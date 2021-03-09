const socket = io();
var urlParams = new URLSearchParams(window.location.search);

const setUsername = (name) => {
  document.getElementById('username-header').innerHTML = name;
  // socket.emit('login-name', name);
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

  credentials_object["password"] = encrypt_and_decrypt(credentials_object["password"], true)
  socket.emit('attempt-signup', credentials_object);
}

function login() {
  var name = document.getElementById("name-input").value
  var password = document.getElementById("password-input").value

  var credentials_object = {
    "name" : name,
    "password" : password
  }

  credentials_object["password"] = encrypt_and_decrypt(credentials_object["password"], true)
  socket.emit('attempt-login', credentials_object);
}

$(document).ready(function() {
  // auto resize message text area
  $(document).on('input', 'textarea', function() {
    $(this).outerHeight('34px').outerHeight(this.scrollHeight);
  });

  // hamburger icon functionality
  $("#hamburger-toggle").click(() => {
    if ($("body").hasClass("hamburger-open"))
        document.body.classList.remove("hamburger-open");
    else
        document.body.classList.add("hamburger-open");
  });

  socket.on('msgrecv', msg => {
    let data = JSON.parse(msg);
    outputMessage(data.name, data.msg);

    // scroll to bottom of messages
    $('#messages').animate({scrollTop: $('#messages')[0].scrollHeight}, 1000);
  });

  socket.on('updateonlineusers', msg => {
    if ( document.URL.includes("messageBoard.html") ) {
      let online_users = msg;
      updateOnlineUserCount(online_users);
      updateOnlineUserList(online_users);
    }
  });

  // Handle signup attempt response
  socket.on('signup-result', msg => {
    if (msg === "Success") {
      window.location.replace("./login.html");
    } else {
      document.getElementById("result").innerHTML = "Signup attempt failed, an account already exists using this username. Please try again and provide a different username."
    }
  });

  // Handle login attempt response
  socket.on('login-result', msg => {
    if (msg === "Success") {
      // Check if account is already online
      socket.emit('already-online-check', document.getElementById("name-input").value)
    } else {
      document.getElementById("result").innerHTML = "Login attempt failed, invalid credentials. Please try again."
    }
  });

  // Handle response to whether or not account is already logged on
  socket.on('online-check-result', found => {
    if (!found) { // Not already logged in; login
      socket.emit("register-login", document.getElementById("name-input").value)
      const url="./messageBoard.html?name=" + document.getElementById("name-input").value;
      window.location.replace(url);
      } else { // Account already logged in; abort
        document.getElementById("result").innerHTML = "Login attempt failed, this account is already signed in. Please try a different account."
      }
  });

  // Handle response to whether or not login was verified
  socket.on('verify-login-response', found => {
    if (!found) { // Not logged in
      const url="./notloggedin"
      window.location.replace(url);
    } else { // Account verified
      socket.emit('login-name', urlParams.get('name'))
      socket.emit('unverify-user', urlParams.get('name'))
    }
  });
});

// Initiate check to see if login process was completed
const verifyLogin = (name) => {
  socket.emit("verify-login", name)
}

const sendMessage = () => {
  const message = document.getElementById('message-input').value;

  if ($.trim(message).length !== 0){
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
  document.getElementById('online-num').innerHTML = onlineUsers.length;
};

const updateOnlineUserList = (onlineUsers) => {
  const ul = document.getElementById('online-users-list');
  ul.innerHTML = '';

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

// Encrypt and decrypt password depending on parameters
const encrypt_and_decrypt = (pass, encrypt) => {
  const alph = "abcdefghijklmnopqrstuvwxyz"
  let new_pass = []

  // Encrypt
  if (encrypt) {
    for (let index in pass) {
      if (!alph.includes(pass.charAt(index))) {
        new_pass.push(pass.charAt(index))
      } else {
        let new_char_index = alph.indexOf(pass.charAt(index))+3

        if (new_char_index > 25) {
          new_char_index -= 26
        }

        new_pass.push(alph.charAt(new_char_index))
      }
    }
  } else { // Decrypt
    for (let index in pass) {
      if (!alph.includes(pass.charAt(index))) {
        new_pass.push(pass.charAt(index))
      } else {
        let new_char_index = alph.indexOf(pass.charAt(index))-3

        if (new_char_index < 0) {
          new_char_index += 26
        }

        new_pass.push(alph.charAt(new_char_index))
      }
    }
  }
  return new_pass.join("")
}
