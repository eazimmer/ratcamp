const socket = io();
var urlParams = new URLSearchParams(window.location.search);

const setUsername = (name) => {
  document.getElementById('username-header').innerHTML = name;
  socket.emit('login-name', name);
}

$(document).ready(function() {
  // auto resize message text area
  $(document).on('input', 'textarea', function() {
    $(this).outerHeight('34px').outerHeight(this.scrollHeight);
  });

  socket.on('msgrecv', msg => {
    let data = JSON.parse(msg);
    outputMessage(data.name, data.msg);

    // scroll to bottom of messages
    $('#messages').animate({scrollTop: $('#messages')[0].scrollHeight}, 1000);
  });

  socket.on('updateonlineusers', msg => {
    let online_users = msg;
    updateOnlineUserCount(online_users);
    updateOnlineUserList(online_users);
  });
});

const sendMessage = () => {
  const message = document.getElementById('message-input').value;

  if (message != '') {
    // clear message input field
    document.getElementById('message-input').value = '';
    $('#message-input').outerHeight('32px');

    // send message to the server
    let msgData = { name : urlParams.get('name'), msg : message };
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

  if (name === urlParams.get('name'))
    li.setAttribute('class', 'message sent-message');
  else {
    li.setAttribute('class', 'message received-message');

    // print username above received message
    let h3 = document.createElement('h3');
    h3.setAttribute('class', 'received-message-username');
    h3.appendChild(document.createTextNode(name));
    div.appendChild(h3);
  }

  li.appendChild(document.createTextNode(message));
  div.appendChild(li);
  ul.appendChild(div);
};

const updateOnlineUserCount = (onlineUsers) => {
  document.getElementById('online-num').innerHTML = onlineUsers.length - 1;
};

const updateOnlineUserList = (onlineUsers) => {
  const ul = document.getElementById('online-users-list');
  ul.innerHTML = '';

  // remove self from array
  //const index = onlineUsers.indexOf(urlParams.get('name'));
  //if (index > -1) {
    //onlineUsers.splice(index, 1);
  //}

  for (let i = 0; i < onlineUsers.length; i++) {
    let div = document.createElement('div');
    let li = document.createElement('li');
    div.setAttribute('class', 'online-user-block');
    li.setAttribute('class', 'online-user');
    li.appendChild(document.createTextNode(onlineUsers[i]));
    div.appendChild(li);
    ul.appendChild(div);
  }
};