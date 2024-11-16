import express from 'express';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 3000;
let count = 0;

//* Starts the server instance
const server = app.listen(PORT, () =>
{
    console.log(`Server is listening on http://localhost:${PORT}`);
});

//* Attaches a WebSocketServer to the HTTP server
const wss = new WebSocketServer({server});

//* Receive request from client to set their username
const clients = new Map();
wss.on('connection', (ws) =>
{
    const id = count++;
    clients.set(id, ws);
    ws.send('Welcome to the chat! Use /nick <name> to set a nickname.');

    ws.on('message', (message) =>
    {
        console.log('Message received');

        const user = clients.get(id);
        //* Force user to enter nickname before proceeding
        broadcastMessage(`${user.nickname} has connected to the chat`, ws);

        //* Command handling
        if (message.startsWith('/'))
        {
            handleCommand(user, message, ws);
        }

        //* Broadcast message
        const nickname = user.nickname;
        const fullMessage = `${nickname}: ${message}`;
        broadcastMessage(fullMessage, ws);

    });

    ws.on('close', () =>
    {

        const nickname = clients.get(id).nickname;
        const fullMessage = `${nickname} has disconnected.`;

        for (let client in clients)
        {
            if (client.ws !== ws)
            {
                client.ws.send(fullMessage);
            }
        }

        clients.delete(id);
    })

});

function handleCommand(user, message, ws)
{
    if (message.startsWith('/nick'))
    {
        const nickname = message.split(' '[1]);
        clients.set(user.id, { ws, nickname });
        ws.send(`Nickname set to ${nickname}`);
    }

    if (message.startsWith('/list'))
    {
        for (let client in clients)
        {
            user.ws.send(`${client.nickname}`);
        }
    }

    if (message.startsWith('/me'))
    {
        const action = message.split(' '[1]);
        broadcastMessage(`${user.nickname} ${action}`)
    }

    if (message.startsWith('/help'))
    {
        user.ws.send(
            `/nick <name> - Changes your nickname
                 /list - Prints all connected users
                 /me <action> - Lets you perform an action in the third person. For example,
                 /me laughs would display as \"<name> laughs\" in the chat.
                 /help - Displays a list of available commands.`);
    }
}

function broadcastMessage(message, ws)
{
    for (let client in clients)
    {
        if (client.ws !== ws)
        {
            client.ws.send(message);
        }
    }
}