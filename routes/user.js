var mongoose = require('mongoose');
var db = require('../models/db.js');
var User = mongoose.model('User');

var registrationForm = function(req, res) {
	res.render('register');
}

var registerme = function(req, res) {
	var chatName = req.body.chatname;
	var email = req.body.email;
	var password = req.body.password1;
	var confirmPassword = req.body.password2;

	var newUser = new User();
	newUser.chatname = chatName;
	newUser.email = email;
	newUser.password = password;

	newUser.save(function(err, saveUser){
		if(err) {
			console.log("User already exists with that chatname or email");
			var message="A user already exists with that username or email";
         	res.render("signin",{errorMessage:message});
         	return;
		} else {
			var message="User register successfully";
         	res.render("signin",{successMessage:message});
		}
	});
}

var loginForm = function(req, res) {
	res.render('signin');
}

var authenticate = function(req, res) {
	var chatName = req.body.chatname;
	var password = req.body.password;

	console.log('Enter chat name : '+chatName);
	console.log('Enter password : '+password);

	User.findOne({chatname: chatName}, function(err, user) {
		console.log('Fetched user : '+user)
		if (user == null) {
			var message="Invalid chatname or password";
        	res.render("signin", {errorMessage:message});
        	return;
		}

		if (user.password == password) {
			console.log("Authenticated successfully ",user.chatname);
			res.render("profile",{chatname:user.chatname});
		} else {
			var message="Invalid chatname or password";
         	res.render("signin",{errorMessage:message});
         	return;
		}
	});
}

exports.registrationForm = registrationForm;
exports.loginForm = loginForm;
exports.registerme = registerme;
exports.authenticate = authenticate;

