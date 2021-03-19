// help from https://www.javascripttutorial.net/javascript-dom/javascript-toggle-password-visibility/

// get password input and fa-eye
const password = document.getElementById('password-input');
const passwordToggle = document.getElementById('toggle');

passwordToggle.addEventListener('click', function (error) {
    // toggle type attribute
    if (password.getAttribute('type') === 'password')
    {
        password.setAttribute('type', 'text');
    }
    else
    {
        password.setAttribute('type', 'password');
    }
    // change icon to slash icon
    this.classList.toggle('fa-eye-slash');
});
