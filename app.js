var express = require('express');
var user = require('./routes/user.js');
var db = require('./models/db.js');
var bodyParser = require('body-parser');
var http = require('http');
var chat = require('./routes/chat.js');

var port = process.env.PORT || 8080;

var app = express();

var httpServer = http.createServer(app);
var io = chat.chatServer(httpServer);

app.set('view engine','ejs');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', user.loginForm);
app.get('/register', user.registrationForm);
app.post('/registerme', user.registerme);
app.post('/authenticate', user.authenticate);

app.use(function(req, res) {
     res.send('404 Page not found');
});

app.use(function(error, req, res, next) {
     res.send('500 Server internal error');
});

httpServer.listen(port, function(){
	console.log('Server is running on port '+port);
});