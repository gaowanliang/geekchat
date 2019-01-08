var express = require('express');
var path = require('path');
var IO = require('socket.io');
var router = express.Router();

var app = express();
var server = require('http').Server(app);
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// 创建socket服务
var socketIO = IO(server);
// 房间用户名单
var roomInfo = {};
var roomIp = {};
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

    socket.on('join', function(userName, ip) {
        iparea = ip;
        if (!roomIp[roomID]) {
            roomIp[roomID] = [];
        }
        iparea = ip;
        var index = roomIp[roomID].indexOf(ip); // 防止同一聊天室同一ip多登
        if (index === -1) {
            roomIp[roomID].push(ip);
            socket.join(roomID);
            if (!roomInfo[roomID]) {
                roomInfo[roomID] = [];
            }
            user = userName;
            roomInfo[roomID].push(user);
            // 加入房间
            // 通知房间内人员
            socketIO.to(roomID).emit('sys', user + '加入了房间', roomInfo[roomID]);
            console.log(user + '加入了' + roomID + ',ip:' + iparea);
            // 将用户昵称加入房间名单中
        } else {
            socket.leave(roomID);
        }


    });

    socket.on('change_name', function(oldName, newName) {
        var index = roomInfo[roomID].indexOf(oldName);
        if (index !== -1) {
            roomInfo[roomID].splice(index, 1);
            roomInfo[roomID].push(newName);
            user = newName;
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
            var index = roomInfo[roomID].indexOf(user);
            if (index !== -1) {
                roomInfo[roomID].splice(index, 1);
            }
            index = roomIp[roomID].indexOf(iparea);
            if (index !== -1) {
                roomIp[roomID].splice(index, 1);
            }
            socket.leave(roomID); // 退出房间
            socketIO.to(roomID).emit('sys', user + '退出了房间', roomInfo[roomID]);
            console.log(user + '退出了' + roomID);
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

server.listen(3000, function() {
    console.log('server listening on port 3000');
});