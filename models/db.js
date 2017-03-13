var mongoose = require('mongoose');
//var dbURI = 'mongodb://localhost/chat';
var dbURI = 'mongodb://vikram:password@ds161059.mlab.com:61059/chat';

mongoose.connect(dbURI);

mongoose.connection.on('connected', function() {
	console.log('Mongoose connected to '+dbURI);
});

mongoose.connection.on('error', function(err) {
	console.log('Mongoose connection error '+err);
});

mongoose.connection.on('disconnected', function() {
	console.log('Mongoose disconnected');
});

var userSchema = new mongoose.Schema({
		chatname: {type: String, unique:true},
		email: {type: String,unique:true},
		password: String,
		onlineStatus:Boolean
});

var buddySchema = new mongoose.Schema({
	userName:{type:String,unique:true},
	buddies:[String]
});

// Build the User model
mongoose.model('User', userSchema);

//build the buddy model
mongoose.model('Buddy', buddySchema);