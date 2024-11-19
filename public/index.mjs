const socket = new WebSocket("ws://localhost:3000/");

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

    const data = event.data;
    console.log(data);
    const chatDisplay = document.getElementById('chatbox');
    const message = document.createElement('tr');
    message.textContent = data;
    chatDisplay.appendChild(message);
});



document.addEventListener('DOMContentLoaded', () =>
{
    document.getElementById('message')
        .addEventListener('submit', (event) =>
        {
            event.preventDefault();
            const message = document.getElementById('message-input');
            socket.send(message.value);
            message.value = '';
        });

    window.addEventListener('close', () =>
    {
        socket.close();
    })
});