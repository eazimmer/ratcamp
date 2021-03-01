$(document).ready(function () {
    // auto resize message text area
    $(document).on('input', 'textarea', function () {
        $(this).outerHeight("34px").outerHeight(this.scrollHeight);
    });
});

const sendMessage = () => {
    const message = document.getElementById('message-input').value;

    if (message != "") {
        document.getElementById('message-input').value = "";
        $('#message-input').outerHeight("32px");

        // add message to screen
        const ul = document.getElementById("message-list");

        var div = document.createElement("div");
        var li = document.createElement("li");

        div.setAttribute('class', 'message-block');
        li.setAttribute('class', 'message sent-message');

        li.appendChild(document.createTextNode(message));
        div.appendChild(li);
        ul.appendChild(div);

        // scroll to bottom of messages
        $("#messages").animate({ scrollTop: $("#messages")[0].scrollHeight}, 1000); 

        // TODO: Send message to server
    }
}

// TODO: *message* is received by the server
const getMessage = (message) => {
    // add message to screen
    const ul = document.getElementById("message-list");

    var div = document.createElement("div");
    var li = document.createElement("li");

    div.setAttribute('class', 'message-block');
    li.setAttribute('class', 'message received-message');

    li.appendChild(document.createTextNode(message));
    div.appendChild(li);
    ul.appendChild(div);

    // scroll to bottom of messages
    $("#messages").animate({ scrollTop: $("#messages")[0].scrollHeight}, 1000); 
}