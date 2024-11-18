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
const clients = new Map();
wss.on('connection', (ws) =>
{
    const id = count++;
    clients.set(id, ws);
    ws.send('Welcome to the chat! Use /nick <name> to set a nickname.');

    ws.on('message', (msg) =>
    {
        const message = String(msg);

        console.log(`Message received: ${message}`);

        const user = clients.get(id);

        //* Force user to enter nickname before proceeding
        // TODO this line should only run once, on the user's first message after their nickname is set
        // broadcastMessage(`${user.nickname} has connected to the chat`, ws);

        //* Command handling
        if (message.startsWith('/'))
        {
            handleCommand(user, message, ws);
        }
        //* Broadcast message
        else
        {
            // TODO prevent user from entering messages until they set a nickname
            const nickname = clients.get(user.id).nickname;
            const fullMessage = `${nickname}: ${message}`;

            broadcastMessage(fullMessage, ws);
        }
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
        // TODO remove welcome message

        const nickname = message.split(' ')[1];

        //* User entered a valid name
        if (!!nickname)
        {
            clients.set(user.id, { ws: ws, nickname: nickname });
            ws.send(`Nickname set to ${nickname}`);
        }
        else
        {
            // TODO remove this message after a user enters a message after this is sent
            ws.send('Please enter /nick followed by your nickname')
        }
        return;
    }

    if (message.startsWith('/list'))
    {
        for (let client in clients)
        {
            ws.send(`${client.nickname}`);
        }
        return;
    }

    if (message.startsWith('/me'))
    {
        const action = message.split(' '[1]);
        broadcastMessage(`${user.nickname} ${action}`)
        return;
    }

    if (message.startsWith('/help'))
    {
        // TODO prettify
        ws.send(
            `/nick <name> - Changes your nickname
                 /list - Prints all connected users
                 /me <action> - Lets you perform an action in the third person. For example,
                 /me laughs would display as \"<name> laughs\" in the chat.
                 /help - Displays a list of available commands.`);
    }
}

function broadcastMessage(message, ws)
{
    console.log(`Message received: ${message}`);

    for (const [key, value] of clients)
    {
        console.log(value.nickname);
        // TODO this isn't sending data to the client
        if (value.ws !== ws)
        {
            value.ws.send(message);
        }
    }
}