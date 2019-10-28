var express = require('express');
var path = require('path');
var IO = require('socket.io');
var router = express.Router();
var _ = require('underscore');

var app = express();
var server = require('http').Server(app);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// 创建socket服务
var socketIO = IO(server);
//图片删除列表
var delImgUrl = {};
// 房间用户名单
var roomInfo = {},
    roomIp = {},
    roomIPDK = {};
socketIO.on('connection', function(socket) {
    // 获取请求建立socket连接的url
    // 如: http://localhost:3000/room/room_1, roomID为room_1
    var url = socket.request.headers.referer;
    var splited = url.split('/');
    var roomID = splited[splited.length - 1];
    var user = '';
    var iparea = '';
    if (!roomInfo[roomID]) {
        roomInfo[roomID] = [];
    }
    if (!delImgUrl[roomID]) {
        delImgUrl[roomID] = [];
    }
    socket.on('join', function(userName, ip) {
        iparea = ip;
        if (!roomIp[roomID]) {
            roomIp[roomID] = [];
        }
        iparea = ip;
        var index = roomIp[roomID].indexOf(ip); // 防止同一聊天室同一ip多登
        if (index == -1) {
            roomIp[roomID].push(ip);
            socket.join(roomID);
            if (!roomInfo[roomID]) {
                roomInfo[roomID] = []
            }
            if (!roomIPDK[roomID]) {
                roomIPDK[roomID] = {}
            }
            user = userName;
            roomInfo[roomID].push(user);
            roomIPDK[roomID][iparea] = { 'dk': 1, 'name': user }
                // 加入房间
                // 通知房间内人员
            socketIO.to(roomID).emit('sys', user + '加入了房间', roomInfo[roomID]);
            console.log(user + '加入了' + roomID + ',ip:' + iparea + ",id:" + socket.id, roomIPDK[roomID]);
            // 将用户昵称加入房间名单中
        } else {
            socket.join(roomID);
            //console.log(roomIPDK)
            roomIPDK[roomID][iparea]['dk']++;
            //console.log(_.findWhere(socketIO.sockets.sockets, { id: socket.id }))
            index = roomIp[roomID].indexOf(iparea)
            console.log(socket.id, roomIPDK[roomID][iparea])
            if (index !== -1) {
                socketIO.to(roomID).emit('dk', ip, roomIPDK[roomID][iparea]['name'], 1);
                user = roomIPDK[roomID][iparea]['name']
            }
            /*var toSocket = _.findWhere(socketIO.sockets.sockets, { id: socket.id });
            //console.log(toSocket)
            toSocket.emit('info', '请勿多开,同一ip仅允许一人聊天');
            socket.leave(roomID);*/
        }
    });
    socket.on('dk_ip', function(nickName) {
        user = nickName
    });
    socket.on('change_name', function(oldName, newName) {
        var index = roomInfo[roomID].indexOf(oldName);
        if (index !== -1) {
            roomInfo[roomID].splice(index, 1);
            roomInfo[roomID].push(newName);
            user = newName;
            socketIO.to(roomID).emit('dk', iparea, newName, 2);
            socketIO.to(roomID).emit('sys', oldName + '将昵称改为了' + newName, roomInfo[roomID]);
            console.log(oldName + '将昵称改为了' + newName + ',房间' + roomID);
        }
    });

    socket.on('leave', function() {
        socket.emit('disconnect');
    });
    socket.on('disconnect', function() {
        // 从房间名单中移除
        if (user !== '') {
            if (roomIPDK[roomID][iparea]['dk'] == 1) {
                var index = roomInfo[roomID].indexOf(user);
                if (index != -1) {
                    roomInfo[roomID].splice(index, 1);
                }
                index = roomIp[roomID].indexOf(iparea);
                if (index != -1) {
                    roomIp[roomID].splice(index, 1);
                }
                if (typeof(roomIPDK[roomID][iparea]) != "undefined") {
                    delete roomIPDK[roomID][iparea]
                    console.log(roomIPDK[roomID])
                }
                socket.leave(roomID); // 退出房间
                socketIO.to(roomID).emit('sys', user + '退出了房间', roomInfo[roomID]);
                console.log(user + '退出了' + roomID);
                if (roomInfo[roomID].length <= 0)
                    if (delImgUrl[roomID].length > 0) {
                        console.log('聊天室没人啦，开始清理图片');
                        for (var i = delImgUrl[roomID].length - 1; i >= 0; i--) {

                            var request = require('request');
                            var options = {
                                url: delImgUrl[roomID][i],
                                headers: {
                                    'User-Agent': 'request'
                                }
                            };

                            function callback(error, response, body) {
                                if (!error && response.statusCode == 200) {}
                            }
                            request(options, callback);
                            console.log('第' + (i + 1) + '张，url:' + delImgUrl[roomID][i]);
                            delImgUrl[roomID].splice(i, 1);
                        }

                    }
            } else {
                roomIPDK[roomID][iparea]['dk']--
                    console.log(roomIPDK[roomID][iparea])
            }
        }

    });
    // 接收用户消息,发送相应的房间
    socket.on('message', function(msg) {
        // 验证如果用户不在房间内则不给发送

        if (roomInfo[roomID].indexOf(user) === -1) {
            return false;
        }
        socketIO.to(roomID).emit('msg', user, msg);
    });

    //接收图片网页，同时储存图床删除图片的链接
    socket.on('messageimg', function(imgurl, delimgurl, w, h) {

        if (roomInfo[roomID].indexOf(user) === -1) {
            return false;
        }

        delImgUrl[roomID].push(delimgurl);
        socketIO.to(roomID).emit('img', user, imgurl, w, h);
    });

});

// room page
router.get('/room/:roomID', function(req, res) {
    var roomID = req.params.roomID;

    // 渲染页面数据(见views/room.hbs)
    res.render('room', {
        roomID: roomID,
        users: roomInfo[roomID]
    });
});

app.use('/', router);

server.listen(8080, function() {
    console.log('聊天室已运行在8080端口上');
});