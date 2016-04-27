

var FADE_TIME = 150;
var TYPING_TIMER_LENGTH = 400;
var COLORS = [
  '#e21400', '#91580f', '#f8a700', '#f78b00',
  '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
  '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

var usernameInput = document.querySelector('.usernameInput');
var messages = document.querySelector('.messages');
var inputMessage = document.querySelector('.inputMessage');

var loginPage = document.querySelector('.login.page');
var chatPage = document.querySelector('.chat.page');
var usernameTitle = document.getElementById('userNamer');


var username;
var connected = false;
var typing = false;

var socket = io();

function addParticipantsMessage (data) {
  var message = '';
  if (data.numUsers === 1) {
    message += "there's 1 participant";
  } else {
    message += "there are " + data.numUsers + " participants";
  }
  log(message);
}



function setUsername(){
  
  username = usernameInput.value.trim();
  if (username) {
    loginPage.style.display='none';
    chatPage.style.display='block';
    inputMessage.focus();
    socket.emit('add user', username);
  }

}



  // Sends a chat message
function sendMessage () {
  var message = inputMessage.value;

  if (message && connected) {
    inputMessage.value = ('');
    addChatMessage({
      username: username,
      message: message
    });

    socket.emit('new message', message);
  }
}

function log (message, options) {
  var el = document.createElement('li');
  if (el.classList)
    el.classList.add('log');
  else
    el.className += ' ' + log;
  el.textContent = message;

  addMessageElement(el, options);
}


function addChatMessage (data, options) {

  options = options || {};

  var usernameDiv = document.createElement('span');
  usernameDiv.classList.add('username');
  usernameDiv.textContent = data.username;
  usernameDiv.style.color = getUsernameColor(data.username);

  var messageBodyDiv = document.createElement('span');
  messageBodyDiv.classList.add('messageBody');
  messageBodyDiv.textContent = data.message;

  var typingClass = data.typing ? 'typing' : '';

  var messageDiv = document.createElement('li');
  messageDiv.classList.add('message');
  messageDiv.setAttribute('data-username', data.username);
  messageDiv.className += ' ' +typingClass;
  

  messageDiv.appendChild(usernameDiv);
  messageDiv.appendChild(messageBodyDiv);


  addMessageElement(messageDiv, options);
}


function addChatTyping (data) {
  data.typing = true;
  data.message = 'is typing';
  addChatMessage(data);
}

function removeChatTyping (data) {

  var typingMessages = document.querySelector('.typing');
  if(typingMessages){
    typingMessages.parentNode.removeChild(typingMessages);
  }
}

function addMessageElement (el, options) {
  var el = el;

  if (!options) {
    options = {};
  }

  if (typeof options.prepend === 'undefined') {
    options.prepend = false;
  }


  if (options.prepend) {
    messages.insertBefore(el, messages.firstChild);
  } else {
    messages.appendChild(el);
  }

    messages.lastChild.scrollIntoView();

}



function updateTyping () {
  if (connected) {
    if (!typing) {
      typing = true;
      socket.emit('typing');
    }
    lastTypingTime = (new Date()).getTime();

    setTimeout(function () {
      var typingTimer = (new Date()).getTime();
      var timeDiff = typingTimer - lastTypingTime;
      if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
        socket.emit('stop typing');
        typing = false;
      }
    }, TYPING_TIMER_LENGTH);
  }
}


function getTypingMessages (data) {

  var typingMessages = document.querySelectorAll('.message.typing');
  return Array.prototype.filter.call(typingMessages, function(){
    return data['username']===data.username;
  })


}


function getUsernameColor (username) {

  var hash = 7;
  for (var i = 0; i < username.length; i++) {
     hash = username.charCodeAt(i) + (hash << 5) - hash;
  }

  var index = Math.abs(hash % COLORS.length);
  return COLORS[index];
}



document.addEventListener('keydown', function(event){
  if(event.keyCode ==13){

    if (username) {
      sendMessage();
      socket.emit('stop typing');
      typing = false;
    } else {
      setUsername();
    }
    event.preventDefault();
  }



  
});

document.addEventListener('input', function(){
  updateTyping();
});


window.onload = function(){
  console.log('hello there');
  socket.emit('pageload');
}



// Socket events

// Whenever the server emits 'login', log the login message

socket.on('pageload', function(data){
  

})

socket.on('login', function (data) {
  connected = true;
  // Display the welcome message
  var message = "Welcome to Chocolate";
  log(message, {
    prepend: true
  });
  addParticipantsMessage(data);
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', function (data) {
  addChatMessage(data);
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', function (data) {
  log(data.username + ' joined');
  addParticipantsMessage(data);
});

// Whenever the server emits 'user left', log it in the chat body
socket.on('user left', function (data) {
  log(data.username + ' left');
  addParticipantsMessage(data);
  removeChatTyping(data);
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', function (data) {
  // console.log('socket typing');

  addChatTyping(data);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', function (data) {
  removeChatTyping(data);
});