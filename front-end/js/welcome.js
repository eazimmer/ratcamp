$('#toggle').on('click', function () {
    // get password input and fa-eye
    const password = document.getElementById('password-input');

    // toggle type attribute
    if (password.getAttribute('type') === 'password')
        password.setAttribute('type', 'text');
    else
        password.setAttribute('type', 'password');
    
    // change icon to slash icon
    this.classList.toggle('fa-eye-slash');
});
