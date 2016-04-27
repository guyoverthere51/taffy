// Setup basic express server
var express = require('express');
var app = express();

var http = require('http').createServer(app);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var port = process.env.PORT || 3000;
var session = require('express-session');

// var io = require('socket.io')(http);

var io = require('socket.io')(http);

var expressSession = require('express-session');
var MongoStore =require('connect-mongo')(expressSession);
var sessionStore = new MongoStore({url: 'mongodb://localhost/chocolateUsers'});
var passportSocketIo = require('passport.socketio');

var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;



// Routing

var routes = require('./routes/index');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(session({
  key: 'harrypotter',
  secret: 'chamberofsecrets',
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());


app.use(express.static(path.join(__dirname, 'public')));


app.use('/', routes);

var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

mongoose.connect('mongodb://localhost/chocolateUsers');

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key:'harrypotter',
  secret:'chamberofsecrets',
  store: sessionStore,
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail,
  resave: false,
  saveUninitialized: false
}));

function onAuthorizeSuccess(data, accept){
  console.log('successful connection: ', data);
  accept();
}

function onAuthorizeFail(data, message, error, accept){
  console.log('failed connection: ', message);
  if(error)
    accept(new Error(message));
}


// io.sockets.on('connection', function(socket){
//   socket.request.session;
//   // console.log('hello: ',socket.request.res)
// });

// Chat

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;
  var loggedInUser = socket.request.user.username;
  console.log('user goes here: ', socket.request.user.username);
  socket.on('pageload', function(data){
    
  });
  
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username,data) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = socket.request.user.username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});


http.listen(port, function () {
  console.log('Server listening at port %d', port);
});