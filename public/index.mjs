const socket = new WebSocket("ws://localhost:3000/");


//// Websocket Connection Response Message
socket.addEventListener('open', () =>
{
    console.log('Connected to WebSocket server');
});

//// Websocket Error Message
socket.addEventListener('error', (error) =>
{
    console.error('WebSocket error: ', error);
});

//// Handle message receiving
socket.addEventListener('message', (event) =>
{
    //* Fetch response
    const data = event.data;

    //* Create message element
    const message = document.createElement('tr');
    message.textContent = data;

    //* Display message element
    document.getElementById('chatbox')
        .appendChild(message);
});

document.addEventListener('DOMContentLoaded', () =>
{
    //// Handle message sending
    document.getElementById('message')
        .addEventListener('submit', (event) =>
        {
            event.preventDefault();
            const message = document.getElementById('message-input');
            socket.send(message.value);
            message.value = '';
        });

    //// Close socket on window closure
    window.addEventListener('close', () =>
    {
        socket.close();
    });
});