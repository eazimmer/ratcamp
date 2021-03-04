const socket = io();

var username = "";
const setUsername = () => {
  console.log("setUsername entered")
  username = document.getElementById('username-input').value;
  console.log("Username stored: " + username)
  //location.href = "/front-end/html/messageBoard.html";
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