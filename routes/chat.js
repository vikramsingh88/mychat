var socketio = require('socket.io');

var users = {};
var user_msg_map = [];

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

		//event for typing indicatio
		socket.on('keydown-client', function(buddy) {
			if (users[buddy.buddy] != null) {
				users[buddy.buddy].emit('keydown-server',{'from':buddy.loginuser});
			}
		});
		socket.on('keyup-client', function(buddy) {
			if (users[buddy.buddy] != null) {
				users[buddy.buddy].emit('keyup-server',{'from':buddy.loginuser});
			}
		});

		socket.on('send message', function(data, callback) {
			var msg=data.msg;
			var chatname=data.chatname;
			var buddy = data.buddy;
			var conversation_id = data.conversation_id
			console.log('conversation_id ',conversation_id);
			//console.log('chatname '+chatname);
			//console.log('buddy '+buddy);
			var temp = {
				from : chatname,
				to : buddy,
				msg : msg
			};
			user_msg_map.push(temp);
			console.log('msg '+temp);
             if(chatname in users){
                users[buddy].emit('whisper',{msg:msg,chatname:socket.chatname,conversation_id:conversation_id});
                socket.emit('private',{msg:msg,chatname:chatname,conversation_id:conversation_id});
            }else{
              callback("Sorry, "+chatname+" is not online");
            }
		});
		//chat_with_buddy event is not used as of now
		socket.on('chat_with_buddy',function(data) {
			var chatName = data.chatName;
			var buddy = data.buddy;
			var msg_map = [];
			for(i = 0; i <= user_msg_map.length; i++){
				var item = user_msg_map[i];
				if(chatName == item.from && buddy == item.to){
					msg_map.push(item);
				}
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
