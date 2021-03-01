console.log('Test');
const socket = io();


const msgForm = document.querySelector('#msgform');
const msgInput = document.querySelector('#msgforminput');

msgForm.addEventListener( 'submit', event => {
  event.preventDefault();
  socket.emit('chat', msgInput.value);
  msgInput.value = '';
});

socket.on('msgrecv', msg => {console.log(msg)});