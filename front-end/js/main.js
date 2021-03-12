const socket = io();
var urlParams = new URLSearchParams(window.location.search);
var countdownTimer;
var countdownTimerValue;
var answeringQuestion = false;
var messageQueue = [];

const signup = () => {
  var email = document.getElementById('email-input').value;
  var name = document.getElementById('name-input').value;
  var password = document.getElementById('password-input').value;

  var credentials_object = {
    'email' : email,
    'name' : name,
    'password' : password
  }

  credentials_object['password'] = encrypt_and_decrypt(credentials_object['password'], true)
  socket.emit('attempt-signup', credentials_object);
}

const login = () => {
  var name = document.getElementById('name-input').value;
  var password = document.getElementById('password-input').value;

  var credentials_object = {
    'name' : name,
    'password' : password
  }

  credentials_object['password'] = encrypt_and_decrypt(credentials_object['password'], true);
  socket.emit('attempt-login', credentials_object);
}

const setUsername = (name) => {
  document.getElementById('username-header').innerHTML = name;
  // socket.emit('login-name', name);
}

$(document).ready(function() {
  // auto resize message text area
  $(document).on('input', 'textarea', function() {
    $(this).outerHeight('34px').outerHeight(this.scrollHeight);
  });

  // hamburger icon functionality
  $('#hamburger-toggle').click(() => {
    if ($('body').hasClass('hamburger-open'))
        document.body.classList.remove('hamburger-open');
    else
        document.body.classList.add('hamburger-open');
  });

  // Handle signup attempt response
  socket.on('signup-result', msg => {
    if (msg === 'Success') {
      window.location.replace('./login.html');
    } else {
      document.getElementById('result').innerHTML = 'Signup attempt failed, an account already exists using this username. Please try again and provide a different username.';
    }
  });

  // Handle login attempt response
  socket.on('login-result', msg => {
    if (msg === 'Success') {
      // Check if account is already online
      socket.emit('already-online-check', document.getElementById('name-input').value);
    } else {
      document.getElementById('result').innerHTML = 'Login attempt failed, invalid credentials. Please try again.';
    }
  });

  // Handle response to whether or not account is already logged on
  socket.on('online-check-result', found => {
    if (!found) { // Not already logged in; login
      socket.emit('register-login', document.getElementById('name-input').value);
      const url='./messageBoard.html?name=' + document.getElementById('name-input').value;
      window.location.replace(url);
      } else { // Account already logged in; abort
        document.getElementById('result').innerHTML = 'Login attempt failed, this account is already signed in. Please try a different account.';
      }
  });

  // Handle response to whether or not login was verified
  socket.on('verify-login-response', found => {
    if (!found) { // Not logged in
      const url='./notloggedin';
      window.location.replace(url);
    } else { // Account verified
      socket.emit('login-name', urlParams.get('name'));
      socket.emit('unverify-user', urlParams.get('name'));
    }
  });

  // message received
  socket.on('msgrecv', msg => {
    let data = JSON.parse(msg);
    if (!answeringQuestion)
      outputMessage(data.name, data.msg);
    else
      messageQueue.push(data);
  });

  // update online users list
  socket.on('updateonlineusers', msg => {
    if ( document.URL.includes('messageBoard.html') ) {
      let online_users = msg;
      updateOnlineUserCount(online_users);
      updateOnlineUserList(online_users);
    }
  });

  // trivia message received
  socket.on('trivia-update', data => {
    if (data.code == 'start') {
      outputStartNotification(data.name);

      // start countdown
      countdownTimerValue = 24;
      countdownTimer = setInterval(() => {
        if(countdownTimerValue <= 0){
          $('.trivia-message')[$('.trivia-message').length-1].textContent = data.name + ' started a game of trivia!';
          clearInterval(countdownTimer);
        }
        else {
          $('.start-countdown')[$('.start-countdown').length-1].textContent = countdownTimerValue;
          countdownTimerValue -= 1;
        }
      }, 1000);
    }
    else if (data.code[0] == 'q') {
      answeringQuestion = true;
      const questionNum = parseInt(data.code.substring(1)) + 1;
      outputQuestion(questionNum, data.question, data.answers, data.correct_index);

      // start countdown
      countdownTimerValue = 9;
      countdownTimer = setInterval(() => {
        if(countdownTimerValue <= 0){ // run out of time
          $('.trivia-question-countdown')[$('.trivia-question-countdown').length-1].textContent = 'Points: 0';
          $('.trivia-correct-answer .trivia-answer-btn').last().css('background', '#4b7a41');
          $('.trivia-correct-answer .trivia-answer-txt').last().css('color', '#4b7a41');
          $('.trivia-question').last().children('li').unbind('click');
          $('.trivia-question').last().children('li').css('pointer-events', 'none');

          sendScore(urlParams.get('name'), 0);
          answeringQuestion = false;
          outputMessageQueue();
          clearInterval(countdownTimer);
        }
        else {
          $('.trivia-question-countdown-num')[$('.trivia-question-countdown-num').length-1].textContent = countdownTimerValue;
          countdownTimerValue -= 1;
        }
      }, 1000);
    }
    else if (data.code == 'end') {
      outputLeaderboard(data.leaderboard);
    }
  });
  
  /*
  // display updated leaderboard
  socket.on('update-leaderboard', (leaderboard) => {
    outputLeaderboard(leaderboard);
  });
  */
});

// Initiate check to see if login process was completed
const verifyLogin = (name) => {
  socket.emit('verify-login', name);
}

// Encrypt and decrypt password depending on parameters
const encrypt_and_decrypt = (pass, encrypt) => {
  const alph = 'abcdefghijklmnopqrstuvwxyz';
  let new_pass = []

  // Encrypt
  if (encrypt) {
    for (let index in pass) {
      if (!alph.includes(pass.charAt(index))) {
        new_pass.push(pass.charAt(index));
      } else {
        let new_char_index = alph.indexOf(pass.charAt(index)) + 3;

        if (new_char_index > 25) {
          new_char_index -= 26;
        }

        new_pass.push(alph.charAt(new_char_index));
      }
    }
  } else { // Decrypt
    for (let index in pass) {
      if (!alph.includes(pass.charAt(index))) {
        new_pass.push(pass.charAt(index));
      } else {
        let new_char_index = alph.indexOf(pass.charAt(index)) - 3;

        if (new_char_index < 0) {
          new_char_index += 26;
        }

        new_pass.push(alph.charAt(new_char_index));
      }
    }
  }
  return new_pass.join('');
}

const sendMessage = () => {
  const message = document.getElementById('message-input').value;

  if ($.trim(message).length !== 0 && !answeringQuestion){
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

const sendScore = (username, points) => {
  let ansData = {name: username, points: points};
  socket.emit('trivia', JSON.stringify(ansData));
}

const questionAnswered = (e) => {
  if ($(e).hasClass('trivia-correct-answer')) {
    $(e).children('.trivia-answer-btn').css('background', '#4b7a41');
    $(e).children('.trivia-answer-txt').css('color', '#4b7a41');
    $('.trivia-question-countdown')[$('.trivia-question-countdown').length-1].textContent = 'Points: ' + parseInt(countdownTimerValue + 1);
    sendScore(urlParams.get('name'), countdownTimerValue + 1);
  }
  else {
    $(e).children('.trivia-answer-btn').css('background', '#ab1f1f');
    $(e).children('.trivia-answer-txt').css('color', '#ab1f1f');
    $(e).siblings('.trivia-correct-answer').children('.trivia-answer-btn').css('background', '#4b7a41');
    $(e).siblings('.trivia-correct-answer').children('.trivia-answer-txt').css('color', '#4b7a41');
    $('.trivia-question-countdown')[$('.trivia-question-countdown').length-1].textContent = 'Points: 0';
    sendScore(urlParams.get('name'), 0);
  }
  
  $(e).parent().children('li').unbind('click');
  $(e).parent().children('li').css('pointer-events', 'none');
  answeringQuestion = false;
  outputMessageQueue();
  clearInterval(countdownTimer);
}

const updateOnlineUserCount = (onlineUsers) => {
  document.getElementById('online-num').innerHTML = onlineUsers.length;
}

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

    let h3 = document.createElement('h3');
    h3.setAttribute('class', 'received-message-username');
    h3.appendChild(document.createTextNode(name));
    div.appendChild(h3);
  }

  li.appendChild(document.createTextNode(message));
  div.appendChild(li);
  ul.appendChild(div);

  // scroll to bottom of messages
  $('#messages').animate({scrollTop: $('#messages')[0].scrollHeight}, 1000);
}

const outputMessageQueue = () => {
  while (messageQueue.length > 0) {
    let current = messageQueue.shift();
    outputMessage(current.name, current.msg);
  }
}

const outputStartNotification = (name) => {
  const ul = document.getElementById('message-list');
  let div = document.createElement('div');
  let li = document.createElement('li');
  let span = document.createElement('span');
  div.setAttribute('class', 'message-block');
  li.setAttribute('class', 'trivia-message');
  span.setAttribute('class', 'start-countdown');
  span.appendChild(document.createTextNode('25'));
  li.appendChild(document.createTextNode(name + ' started a game of trivia! Starting in... '));
  li.appendChild(span);
  div.appendChild(li);
  ul.appendChild(div);

  // scroll to bottom of messages
  $('#messages').animate({scrollTop: $('#messages')[0].scrollHeight}, 1000);
}

const outputQuestion = (questionNum, question, answers, correct_index) => {
  const ul = document.getElementById('message-list');
  let div1 = document.createElement('div');
  div1.setAttribute('class', 'message-block');
  let div2 = document.createElement('div');
  div2.setAttribute('class', 'trivia-question');

  let div3 = document.createElement('div');
  div3.setAttribute('class', 'trivia-question-header');
  let h2 = document.createElement('h2');
  h2.appendChild(document.createTextNode('Question #' + questionNum));
  let h3 = document.createElement('h3');
  h3.setAttribute('class', 'trivia-question-countdown');
  let span1 = document.createElement('span');
  span1.setAttribute('class', 'trivia-question-countdown-num');
  span1.appendChild(document.createTextNode('10'));
  h3.appendChild(document.createTextNode('Time Left: '));
  h3.appendChild(span1);
  div3.appendChild(h2);
  div3.appendChild(h3);
  div2.appendChild(div3);

  let p1 = document.createElement('div');
  p1.setAttribute('class', 'trivia-question-txt');
  p1.innerHTML = question;
  div2.appendChild(p1);

  const ALPH = 'ABCD';
  for (let i = 0; i < answers.length; i++) {
    let li = document.createElement('li');
    let button = document.createElement('button');
    let p2 = document.createElement('p');

    if (i == correct_index)
      li.setAttribute('class', 'trivia-answer trivia-correct-answer');
    else
      li.setAttribute('class', 'trivia-answer');
    
    li.setAttribute('onclick', 'questionAnswered(this)');
    button.setAttribute('class', 'trivia-answer-btn');
    p2.setAttribute('class', 'trivia-answer-txt under-anim');

    button.appendChild(document.createTextNode(ALPH[i]));
    p2.innerHTML = answers[i];
    li.appendChild(button);
    li.appendChild(p2);
    div2.appendChild(li);
  }
  
  div1.appendChild(div2);
  ul.appendChild(div1);

  // scroll to bottom of messages
  $('#messages').animate({scrollTop: $('#messages')[0].scrollHeight}, 1000);
}

const outputLeaderboard = (leaderboard) => {
  // sort leaderboard by points
  var sortedLeaderboard = [];
  for (var user in leaderboard)
    sortedLeaderboard.push([user, leaderboard[user]]);

  sortedLeaderboard.sort((a, b) => {
    return b[1] - a[1];
  });

  // output leaderboard
  const ul = document.getElementById('message-list');
  let div1 = document.createElement('div');
  div1.setAttribute('class', 'message-block');
  let div2 = document.createElement('div');
  div2.setAttribute('class', 'trivia-leaderboard');
  let h2 = document.createElement('h2');
  h2.setAttribute('class', 'leaderboard-header');
  h2.appendChild(document.createTextNode("Leaderboard"));
  div2.appendChild(h2);

  for (let i = 1; i <= sortedLeaderboard.length; i++) {
    let p = document.createElement('p');
    p.setAttribute('class', 'leaderboard-user');
    p.appendChild(document.createTextNode(i + ") " + sortedLeaderboard[i-1][0] + " (" + sortedLeaderboard[i-1][1] + " pts)"));
    div2.appendChild(p);
  }

  div1.appendChild(div2);
  ul.appendChild(div1);

  // scroll to bottom of messages
  $('#messages').animate({scrollTop: $('#messages')[0].scrollHeight}, 1000);
}