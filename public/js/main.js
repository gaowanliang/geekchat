 var initPhotoSwipeFromDOM = function(gallerySelector) {
     // parse slide data (url, title, size ...) from DOM elements 
     // (children of gallerySelector)
     var parseThumbnailElements = function(el) {
         var thumbElements = el.childNodes,
             numNodes = thumbElements.length,
             items = [],
             figureEl,
             linkEl,
             size,
             item;
         for (var i = 0; i < numNodes; i++) {
             figureEl = thumbElements[i]; // <figure> element
             // include only element nodes 
             if (figureEl.nodeType !== 1) {
                 continue;
             }
             linkEl = figureEl.children[0]; // <a> element
             size = linkEl.getAttribute('data-size').split('x');
             // create slide object
             item = {
                 src: linkEl.getAttribute('href'),
                 w: parseInt(size[0], 10),
                 h: parseInt(size[1], 10)
             };



             if (figureEl.children.length > 1) {
                 // <figcaption> content
                 item.title = figureEl.children[1].innerHTML;
             }

             if (linkEl.children.length > 0) {
                 // <img> thumbnail element, retrieving thumbnail url
                 item.msrc = linkEl.children[0].getAttribute('src');
             }
             item.el = figureEl; // save link to element for getThumbBoundsFn
             items.push(item);
         }
         return items;
     };

     // find nearest parent element
     var closest = function closest(el, fn) {
         return el && (fn(el) ? el : closest(el.parentNode, fn));
     };
     // triggers when user clicks on thumbnail
     var onThumbnailsClick = function(e) {
         e = e || window.event;
         e.preventDefault ? e.preventDefault() : e.returnValue = false;

         var eTarget = e.target || e.srcElement;

         // find root element of slide
         var clickedListItem = closest(eTarget, function(el) {
             return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
         });
         if (!clickedListItem) {
             return;
         }
         // find index of clicked item by looping through all child nodes
         // alternatively, you may define index via data- attribute
         var clickedGallery = clickedListItem.parentNode,
             childNodes = clickedListItem.parentNode.childNodes,
             numChildNodes = childNodes.length,
             nodeIndex = 0,
             index;

         for (var i = 0; i < numChildNodes; i++) {
             if (childNodes[i].nodeType !== 1) {
                 continue;
             }

             if (childNodes[i] === clickedListItem) {
                 index = nodeIndex;
                 break;
             }
             nodeIndex++;
         }



         if (index >= 0) {
             // open PhotoSwipe if valid index found
             openPhotoSwipe(index, clickedGallery);
         }
         return false;
     };

     // parse picture index and gallery index from URL (#&pid=1&gid=2)
     var photoswipeParseHash = function() {
         var hash = window.location.hash.substring(1),
             params = {};

         if (hash.length < 5) {
             return params;
         }

         var vars = hash.split('&');
         for (var i = 0; i < vars.length; i++) {
             if (!vars[i]) {
                 continue;
             }
             var pair = vars[i].split('=');
             if (pair.length < 2) {
                 continue;
             }
             params[pair[0]] = pair[1];
         }

         if (params.gid) {
             params.gid = parseInt(params.gid, 10);
         }

         return params;
     };

     var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
         var pswpElement = document.querySelectorAll('.pswp')[0],
             gallery,
             options,
             items;

         items = parseThumbnailElements(galleryElement);

         // define options (if needed)
         options = {

             // define gallery index (for URL)
             galleryUID: galleryElement.getAttribute('data-pswp-uid'),

             getThumbBoundsFn: function(index) {
                 // See Options -> getThumbBoundsFn section of documentation for more info
                 var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                     pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                     rect = thumbnail.getBoundingClientRect();

                 return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
             }

         };

         // PhotoSwipe opened from URL
         if (fromURL) {
             if (options.galleryPIDs) {
                 // parse real index when custom PIDs are used 
                 // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                 for (var j = 0; j < items.length; j++) {
                     if (items[j].pid == index) {
                         options.index = j;
                         break;
                     }
                 }
             } else {
                 // in URL indexes start from 1
                 options.index = parseInt(index, 10) - 1;
             }
         } else {
             options.index = parseInt(index, 10);
         }

         // exit if index not found
         if (isNaN(options.index)) {
             return;
         }

         if (disableAnimation) {
             options.showAnimationDuration = 0;
         }

         // Pass data to PhotoSwipe and initialize it
         gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
         gallery.init();
     };

     // loop through all gallery elements and bind events
     var galleryElements = document.querySelectorAll(gallerySelector);

     for (var i = 0, l = galleryElements.length; i < l; i++) {
         galleryElements[i].setAttribute('data-pswp-uid', i + 1);
         galleryElements[i].onclick = onThumbnailsClick;
     }

     // Parse URL and open gallery if it contains #&pid=3&gid=1
     var hashData = photoswipeParseHash();
     if (hashData.pid && hashData.gid) {
         openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
     }
 };
 //=============这是图片浏览所需的代码，可以不用管=====================
 // execute above function
 //initPhotoSwipeFromDOM('.my-gallery');


 $(function() {
     // ----------设置昵称-------------
     //document.getElementById("userNamein").style.display = "none";
     $('#fresh').attr("style", "display:none;"); //style="display:none;"
     var socket = io(); //<a href="javascript:void(0)" onclick="showImg(this)" id="0">[图片]</a>
     //alert(ip);
     var user_name = '',
         id = 0, //这个id为每个消息标签的id，被附在每个消息的id上
         sysid = 0, //这是系统提示标签的id
         urlid1 = 0, //这是url标签的id
         urlid2 = 0,
         msgno1 = 0, //这是被url标签分割的消息的id
         msgno2 = 0;


     $('#myModal').modal('toggle', 'center')
     user_name = document.getElementById("userNamein").value
         //document.write('你输入了'+msg.length+'个字符');
         //这里防止昵称为空
     if (user_name === '' || user_name == null) {
         user_name = Math.floor(Math.random() * 100000) + '';
     }

     if (user_name.length > 20) {
         user_name = Math.floor(Math.random() * 100000) + '';
     }
     // var t = document.getElementById("userNamein");
     //t.value = user_name;
     $('#userNamed').html(user_name);
     // ---------创建连接-----------
     var ip = "6"
         // 加入房间
     socket.on('connect', function() {
         socket.emit('join', user_name, ip);
     });
     // 监听消息
     socket.on('msg', function(userName, msg) {
         var myDate = new Date();
         if (userName === user_name) {
             var message = '' +
                 '<div class="message">' +
                 '  <span class="userme" id="user' + id + '"> </span>' +
                 '  <span class="time">' + myDate.toLocaleTimeString() + '</span>' +
                 '  <span class="msg" id="msg' + id + '"> ';
         } else {
             var message = '' +
                 '<div class="message">' +
                 '  <span class="user" id="user' + id + '"> </span>' +
                 '  <span class="time">' + myDate.toLocaleTimeString() + '</span>' +
                 '  <span class="msg" id="msg' + id + '"> ';
         }
         var mg = '';
         var allurl = msg.match(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g);
         if (allurl !== null) {
             var nourlmsg = msg.replace(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g, "⋘");
             mg = nourlmsg.split("⋘");
             for (var i = 0; i < mg.length; i++) {
                 message = message.concat('</span><a target="_blank" id="urlid' + urlid1 + '"></a>' + '<span class="msg" id="msgno' + msgno1 + '"> ');
                 urlid1++;
                 msgno1++;
             }
         }

         message = message.concat('</span></div>');
         $('#msglog').append(message);

         $('#user' + id).text(userName);
         if (allurl !== null) {
             $('#msg' + id).text(' : ' + mg[0]);
             for (var i = 0; i < mg.length; i++) {
                 document.getElementById("urlid" + urlid2).setAttribute('href', allurl[i]);
                 $('#urlid' + urlid2).text(allurl[i]);
                 urlid2++;
             }
             for (var i = 1; i <= mg.length; i++) {
                 $('#msgno' + msgno2).text(mg[i]);
                 msgno2++;
             }
         } else {
             $('#msg' + id).text(' : ' + msg);
         }

         id++;
         $('#msglog').scrollTop($('#msglog')[0].scrollHeight); // 滚动条保持最下方
     });

     //监听图片消息
     socket.on('img', function(userName, img, w, h) {
         var myDate = new Date();
         if (userName === user_name) {
             var message = '' +
                 '<div class="message" class="my-gallery" itemscope itemtype="http://schema.org/ImageGallery">' +
                 '  <span class="userme" id="user' + id + '"> </span>' +
                 '  <span class="time">' + myDate.toLocaleTimeString() + '</span>' +
                 '<div class="my-gallery" itemscope itemtype="http://schema.org/ImageGallery">' +
                 '<figure itemprop="associatedMedia" itemscope itemtype="http://schema.org/ImageObject">' +
                 '  <a href="' + img + '" itemprop="contentUrl" data-size="' + w + 'x' + h + '"> ' +
                 ' <img src="' + img + '" class="img-thumbnail" itemprop="thumbnail" alt="Image description" style="width: 200px"/></a></figure></div></div>';
         } else {
             var message = '' +
                 '<div class="message">' +
                 '  <span class="user" id="user' + id + '"> </span>' +
                 '  <span class="time">' + myDate.toLocaleTimeString() + '</span>' +
                 '<div class="my-gallery" itemscope itemtype="http://schema.org/ImageGallery">' +
                 '<figure itemprop="associatedMedia" itemscope itemtype="http://schema.org/ImageObject">' +
                 '  <a href="' + img + '" itemprop="contentUrl" data-size="' + w + 'x' + h + '"> ' +
                 ' <img src="' + img + '" class="img-thumbnail" itemprop="thumbnail" alt="Image description" style="width: 200px;/></a></figure></div></div>';
         }
         $('#msglog').append(message);
         $('#user' + id).text(userName);
         id++;
         $('#msglog').scrollTop($('#msglog')[0].scrollHeight);
         initPhotoSwipeFromDOM('.my-gallery'); //初始化PhotoSwipe插件
     });

     // 监听系统消息
     socket.on('sys', function(sysMsg, users) {
         var message = '' +
             '<div class="sysMsg">' +
             '  <span class="sysMsg" id="sys' + sysid + '"> </span> </div>';
         $('#msglog').append(message);
         $('#sys' + sysid).text(sysMsg);
         sysid++;
         $('#count').text(users.length);
         $('#cs').attr("data-content", users.join(","))
     });
     socket.on('dk', function(resIP, nickName, model) {
         if (resIP == ip) {
             user_name = nickName
             $('#userNamed').html(nickName);
             if (model == 2) {
                 socket.emit('dk_ip', nickName);
             }
         }
     });
     // ---------------发送图片--------------------
     $(':input').change(function() {
         $('#loadIndicator1').toggleClass('loading');
         var zip = this.files[0].size
         var msgd = new $.zui.Messager('图片正在压缩上传中，请耐心等待', {
             icon: 'heart', // 定义显示位置
             time: 0
         })
         msgd.show();
         const file = this.files[0];
         if (!file) {
             return;
         }
         new ImageCompressor(file, {
             quality: .6,
             success(result) {
                 new $.zui.Messager('图片压缩成功，压缩率' + (100 - (result.size / zip) * 100).toFixed(2) + "%", {
                     type: 'success', // 定义颜色主题
                     icon: 'check-circle'
                 }).show();
                 const formData = new FormData();
                 formData.append('smfile', result);
                 $.ajax({
                     url: 'https://sm.ms/api/v2/upload',
                     type: 'POST',
                     data: formData,
                     cache: false,
                     contentType: false,
                     processData: false,
                     success: function(data) {
                         console.log(data)
                         socket.emit('messageimg', JSON.stringify(data.data.url).replace(/"/g, ''), JSON.stringify(data.data.delete).replace(/"/g, ''), JSON.stringify(data.data.width), JSON.stringify(data.data.height));
                         msgd.hide();
                         new $.zui.Messager('图片上传成功', {
                             type: 'success', // 定义颜色主题
                             icon: 'icheck-circle'
                         }).show();
                         $('#loadIndicator1').toggleClass('loading');
                     },
                     error: function() {
                         msgd.hide();
                         new $.zui.Messager('图片上传失败，请重试', {
                             type: 'danger', // 定义颜色主题
                             icon: 'remove-sign'
                         }).show();
                         $('#loadIndicator1').toggleClass('loading');
                     },
                 });
             },
             error(e) {
                 console.log(e.message);
                 new $.zui.Messager('图片压缩失败，请重试', {
                     type: 'danger', // 定义颜色主题
                     icon: 'remove-sign'
                 }).show();
                 $('#loadIndicator1').toggleClass('loading');
             },
         });
     });

     // ---------------发送消息--------------------
     $('#messageInput').keydown(function(e) {
         if (e.which === 13 || e.which === 10) {
             e.preventDefault();
             var msg = $(this).val();
             if (msg.replace(/ /g, '') !== '') {
                 if (msg.length < 800) {
                     $(this).val('');
                     socket.send(msg);
                 } else {
                     alert('你输入了' + msg.length + '个字符，最大支持800个字符');
                 }

             }
         }
     });

     $('#sendMsg').click(function(event) {
         event.preventDefault();
         var msg = $('#messageInput').val();
         if (msg.replace(/ /g, '') !== '') {
             if (msg.length < 800) {
                 $('#messageInput').val('');
                 socket.send(msg);
             } else {
                 alert('你输入了' + msg.length + '个字符，最大支持800个字符');
             }

         }
     });

     // ---------------改名--------------------
     $("#nick").click(function() {
         $("#setNick").text("更改昵称")
         document.getElementById("nickInfo").style.display = "none"
         $('#myModal').modal('toggle', 'center')
     })
     $('#changeName').click(function(event) {
         var t = document.getElementById("userNamein");
         var y = document.getElementById("userNamed");
         if (t.value !== '') {
             if (t.value.length < 20) {
                 socket.emit('change_name', y.innerText, t.value);
                 user_name = t.value;
                 $('#userNamed').text(user_name);
                 $('#myModal').modal('hide', 'fit')
                 new $.zui.Messager('昵称更改成功', {
                     type: 'success',
                     icon: 'check-circle'
                 }).show();
                 document.getElementById("userNamein").value = ""
             }
         }
     });


     $('[data-toggle="popover"]').popover(); //初始化弹出面板
     $('[data-toggle="tooltip"]').tooltip(); //初始化提示消息

 });