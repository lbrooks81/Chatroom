const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener('open', () =>
{
    console.log('Connected to WebSocket server');
});
socket.addEventListener('error', (error) =>
{
    console.error('WebSocket error: ', error);
});

socket.addEventListener('message', (event) =>
{
    const data = JSON.parse(event.data);
    const chatDisplay = document.getElementById('chatbox');
    const message = document.createElement('tr');
    message.textContent = data;
    chatDisplay.appendChild(message);
});

document.addEventListener('DOMContentLoaded', () =>
{
    document.getElementById('send-btn')
        .addEventListener('click', sendMessage);
});

function sendMessage()
{
    const message = document.getElementById('message-input');
    socket.send(message.value);
    message.value = '';
}