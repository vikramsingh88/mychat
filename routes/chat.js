var socketio = require('socket.io');
var mongoose = require('mongoose');
var db = require('../models/db.js');
var User = mongoose.model('User');
var Buddy = mongoose.model('Buddy');

var users = {};
var user_msg_map = [];

var chatServer = function(httpServer) {
	var io = socketio.listen(httpServer);

	io.sockets.on('connection', function(socket) {
	
		function updateChatUsers() {
			console.log('update chat users ',Object.keys(users));
			io.sockets.emit('chatusers', Object.keys(users));
		}

		socket.on('new user', function(chatname, callback) {
			callback(true);
	        socket.chatname=chatname;
	        users[socket.chatname]=socket;
	        //update login user presence status
	        updateUserStatusInDB(chatname, true);
	        updateChatUsers();
		});

		//update login user online status in mongodb
		var updateUserStatusInDB = function(chatname, status){
			User.update({ chatname: chatname }, { $set: { onlineStatus: status }}, function(err, user){
				console.log('Updated user ',user);
			});
		};

		//Get buddy presence status
		function getBuddyPresenceStatus(buddy, cb){
			User.findOne({'chatname':buddy}, function(err, user) {
				if(!err){
					cb(user.onlineStatus);
				} else {
					cb(false);
				}
				
			});
		}
		socket.on('get Buddy Presence Status', function(buddy, cb){
			console.log("get Buddy Presence Status buddy ",buddy);
			getBuddyPresenceStatus(buddy, function(status){
				cb(buddy, status);
			});
		});

		//Fetch buddy list of logged in user
		socket.on('fetch buddies', function(loginUser, cb) {
			console.log("login User ",loginUser);
			Buddy.findOne({'userName':loginUser}, function(err, buddies) {
				if(!err && buddies != null){
					cb(buddies.buddies);
					console.log("Fetch buddies ",buddies.buddies);
				} else {
					console.log("Fetch buddies error ",err);
				}
				
			});
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
             	console.log('After closeing tab',users[buddy])
             	if(typeof users[buddy] != 'undefined'){
             		console.log('After closeing tab',"Inside block");
                	users[buddy].emit('whisper',{msg:msg,chatname:socket.chatname,conversation_id:conversation_id});
                	socket.emit('private',{msg:msg,chatname:chatname,conversation_id:conversation_id});
            	} else {
            		callback("Sorry, "+buddy+" is not online");
            	}
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
			//updateChatUsers();
			io.sockets.emit('buudy status offline', socket.chatname);
			updateUserStatusInDB(socket.chatname, false);
		});

		//search buddies
		socket.on('search buddy', function(searchKey, cb) {
			User.find({'chatname':{ "$regex": searchKey, "$options": "i" }},function(err, data){
				var searchResult = [];
				for(i=0;i<data.length;i++){
					searchResult[i] = data[i].chatname;
				}
				cb(searchResult);
			});
		});

		//adding contact to buddy list of use
		socket.on('add to buddy', function(user, contact, cb) {
			Buddy.findOne({'userName':user},function(err, data){
				if(!err) {
					console.log("Data ",data);	
					if (data == null) {
						var newBuddy = new Buddy();
						newBuddy.userName = user;
						newBuddy.buddies.push(contact);
						newBuddy.save(function(err, savedBuddy){
							if(err) {
								console.log("Error in adding contact to buddy list");					
					         	return;
							} else {
								console.log("Successfully added contact to buddy list",savedBuddy);
								cb(contact);
								addBuddyToViceVersa(contact,user);
							}
						});
					} else {						
						//data.buddies.push(contact);
						Buddy.update({_id: data.id}, {$addToSet: {buddies: contact}}, function(err, savedBuddy) {
							if(err) {
								console.log("Error in adding contact to buddy list");					
					         	return;
							} else {
								console.log("Successfully added contact to buddy list",savedBuddy);
								cb(contact);
								addBuddyToViceVersa(contact,user);
							}
						});
					}
				}
			});
		});

		//If A is friend of B then B will be friend of A
		var addBuddyToViceVersa = function(user, contact) {
			Buddy.findOne({'userName':user},function(err, data){
				if(!err) {
					console.log("Data ",data);	
					if (data == null) {
						var newBuddy = new Buddy();
						newBuddy.userName = user;
						newBuddy.buddies.push(contact);
						newBuddy.save(function(err, savedBuddy){
							if(err) {
								console.log("Error in adding contact to buddy list");					
					         	return;
							} else {
								console.log("Successfully added contact to buddy list",savedBuddy);
								//send event to add buddy other side
								users[user].emit("new buddy available", user);
							}
						});
					} else {						
						//data.buddies.push(contact);
						Buddy.update({_id: data.id}, {$addToSet: {buddies: contact}}, function(err, savedBuddy) {
							if(err) {
								console.log("Error in adding contact to buddy list");					
					         	return;
							} else {
								console.log("Successfully added contact to buddy list",savedBuddy);
								//send event to add buddy other side
								users[user].emit("new buddy available", user);
							}
						});
					}
				}
			});
		}
	});

	return io;
}

module.exports.chatServer = chatServer;
