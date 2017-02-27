var socketio = require('socket.io');

var users = {};

var chatServer = function(httpServer) {
	var io = socketio.listen(httpServer);

	io.sockets.on('connection', function(socket) {
	
		function updateChatUsers() {
			io.sockets.emit('chatusers', Object.keys(users));
		}

		socket.on('new user', function(chatname, callback) {
			callback(true);
	        socket.chatname=chatname;
	        users[socket.chatname]=socket;
	        updateChatUsers();
		});

		socket.on('send message', function(data, callback) {
			var msg=data.msg;
			var chatname=data.chatname;
			var buddy = data.buddy;
			console.log('msg '+msg);
			console.log('chatname '+chatname);
			console.log('buddy '+buddy);
             if(chatname in users){
                users[buddy].emit('whisper',{msg:msg,chatname:socket.chatname});
                socket.emit('private',{msg:msg,chatname:chatname});
            }else{
              callback("Sorry, "+chatname+" is not online");
            }
		});

		socket.on('disconnect', function(data) {
			if (!socket.chatname) return;
			delete users[socket.chatname];
			updateChatUsers();
		});
	});

	return io;
}

module.exports.chatServer = chatServer;
