const socket = io();

const storeUsername = () => {
  console.log("setUsername entered")
  var username = document.getElementById('username-input').value;
  console.log("Username stored as cookie: " + username)
  document.cookie = 'name'+username
  location.href = "/front-end/html/messageBoard.html";
}

const setUsername = () => {
  var start = document.cookie.indexOf('name');
  var stop = document.cookie.indexOf(';');
  var username = document.cookie.substring(start+4, stop);
  console.log("Username grabbed from cookies: " + username)
  document.getElementById('username-field').value = username;
}

$(document).ready(function() {
  // auto resize message text area
  $(document).on('input', 'textarea', function() {
    $(this).outerHeight('34px').outerHeight(this.scrollHeight);
  });

  socket.on('msgrecv', msg => {
    let data = JSON.parse(msg);
    console.log(data);
    outputMessage(data.name, data.msg);

    // scroll to bottom of messages
    $('#messages').animate({scrollTop: $('#messages')[0].scrollHeight}, 1000);
  });

  // TODO: update the array of online users
  // updateOnlineUserList(data.onlineUsers);
});

const sendMessage = () => {
  const message = document.getElementById('message-input').value;

  if (message != '') {
    // clear message input field
    document.getElementById('message-input').value = '';
    $('#message-input').outerHeight('32px');

    console.log("Sending username: " + username)

    // send message to the server
    let msgData = { name : username, msg : message };
    socket.emit(
        'chat', JSON.stringify(msgData)
    );
  }
}

const outputMessage = (name, message) => {
  const ul = document.getElementById('message-list');
  let div = document.createElement('div');
  let li = document.createElement('li');
  div.setAttribute('class', 'message-block');
  
  if (name === username)
    li.setAttribute('class', 'message sent-message');
  else {
    li.setAttribute('class', 'message received-message');

    // TODO: print the username above received message
  }

  li.appendChild(document.createTextNode(message));
  div.appendChild(li);
  ul.appendChild(div);
};

const updateOnlineUserList = (onlineUsers) => {
  console.log(onlineUsers);

  // TODO: update screen with the new list of online users
}