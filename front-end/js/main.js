const socket = io();
var urlParams = new URLSearchParams(window.location.search);

const setUsername = (name) => {
  document.getElementById('username-header').innerHTML = name;
  socket.emit('login-name', name);
}

function signup() {
  var email = document.getElementById("email-input").value
  var name = document.getElementById("name-input").value
  var password = document.getElementById("password-input").value

  var credentials_object = {
    "email" : email,
    "name" : name,
    "password" : password
  }

  console.log("Signing up. Credentials:")
  console.log(credentials_object)

  socket.emit('attempt-signup', credentials_object);
}

function login() {
  var name = document.getElementById("name-input").value
  var password = document.getElementById("password-input").value

  var credentials_object = {
    "name" : name,
    "password" : password
  }

  console.log("Logging in. Credentials:")
  console.log(credentials_object)

  socket.emit('attempt-login', credentials_object);
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
    if ( document.URL.includes("./messageBoard.html") ) {
      let online_users = msg;
      updateOnlineUserCount(online_users);
      updateOnlineUserList(online_users);
    }
  });

  socket.on('signup-result', msg => {
    console.log(`Server responds that signup attempt is: ${msg}`)
    if (msg === "Success") {
      const Http = new XMLHttpRequest();
      const url='./login.html';
      Http.open("GET", url);
      Http.send()
    } else {
      document.getElementById("result").innerHTML = "Signup attempt failed, these credentials are already in use. Please try again."
    }
  });

  socket.on('login-result', msg => {
    console.log(`Server responds that signup attempt is: ${msg}`)
    if (msg === "Success") {
      const Http = new XMLHttpRequest();
      const url='./messageBoard.html?name=' + document.getElementById("name-input").value;
      Http.open("GET", url);
      Http.send()
    } else {
      document.getElementById("result").innerHTML = "Login attempt failed, invalid credentials. Please try again."
    }
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
  // Subtract by one to not show self
  document.getElementById('online-num').innerHTML = onlineUsers.length;
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