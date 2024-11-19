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
console.log(clients.size);
wss.on('connection', (ws) =>
{
    const id = count++;
    clients.set(id, {nickname: "", ws: ws});
    const user = clients.get(id);

    console.log('New user connected');
    ws.send('Welcome to the chat! Use /nick (name) to set a nickname.');


    ws.on('message', (msg) =>
    {
        const message = String(msg);
        console.log(`Message received: ${message}`);

        //* Command handling
        if (message.startsWith('/'))
        {
            handleCommand(user, id, message, ws);
        }
        //* Prevents users from typing before a nickname is set
        else if (!clients.get(id).nickname)
        {
            ws.send("Please enter a nickname before sending messages.");
        }
        //* Broadcast message
        else
        {
            const fullMessage = `${clients.get(id).nickname}: ${message}`;
            broadcastMessage(fullMessage, ws);
        }
    });

    ws.on('close', () =>
    {
        if (clients.get(id).nickname)
        {
            const fullMessage = `${clients.get(id).nickname} has disconnected`;
            broadcastMessage(fullMessage);
        }
        clients.delete(id);
    });

});

function handleCommand(user, id, message, ws)
{
    if (message.startsWith('/nick'))
    {
        const nickname = message.split(' ')[1];
        //* User entered a valid name
        if (!!nickname)
        {
            clients.set(id, { nickname: nickname, ws: ws });

            ws.send(`Nickname set to ${nickname}`);
            broadcastMessage(`${nickname} has connected to the chat`, ws);
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
        if (clients.size === 1)
        {
            ws.send('There\'s one current chatter. It\'s you!');
        }
        else
        {
            ws.send(`There are ${clients.size} current chatters:`)
            for (let [key, value] of clients)
            {
                ws.send(`${value.nickname}`);
            }
        }
        return;
    }

    if (message.startsWith('/me'))
    {
        const action = message.split(' ')[1];
        console.log(action);
        broadcastMessage(`${clients.get(id).nickname} ${action}`)
        return;
    }

    if (message.startsWith('/help'))
    {
        ws.send('Available commands:');
        ws.send('/nick (name) - Changes your nickname');
        ws.send('/list - Prints all connected users');
        ws.send('/me (action) - Performs an action in the third person. \n');
        ws.send('/help - Displays a list of available commands');
        ws.send('/msg (name) (message) - Directly messages another user')
        return;
    }

    if (message.startsWith('/msg'))
    {
        const name = message.split(' ')[1];

        //* Cuts off the /msg and nickname parts of the message
        let msg = message.slice(message.indexOf(' ') + 1, message.length);
        msg = msg.slice(msg.indexOf(' ') + 1, msg.length);

        for (let [key, value] of clients)
        {
            //* User messaged themself (they are crazy)
            if(name === clients.get(id).nickname)
            {
                ws.send(msg + ', you whisper to yourself');
                break;
            }

            if (value.nickname === name)
            {
                value.ws.send(`${clients.get(id).nickname} whispers: ` + msg);
                ws.send(`You whisper to ${name}: ` + msg);
            }
        }


    }
}

function broadcastMessage(message, ws)
{
    console.log(`Message received: ${message}`);

    for (const [key, value] of clients)
    {
        value.ws.send(message);
    }
}
