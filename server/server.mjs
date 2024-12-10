import express from 'express';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 3000;


//// Server Instance Startup
const server = app.listen(PORT, () =>
{
    console.log(`Server is listening on http://localhost:${PORT}`);
});

//// Attach a WebSocketServer to the HTTP server
const wss = new WebSocketServer({server});

//// Client Map Initialization
const clients = new Map();
let count = 0;

//// Handle User Connection
wss.on('connection', (ws) =>
{
    //// Create new user instance
    const id = count++;
    clients.set(id, {nickname: "", ws: ws});
    const user = clients.get(id);

    //// User Connection Message
    console.log('New user connected');
    ws.send('Welcome to the chat! Use /nick (name) to set a nickname.');

    //// Handle Message Sending
    ws.on('message', (msg) =>
    {
        //* Message Reception
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

    //* Handle Disconnection
    ws.on('close', () =>
    {
        //* Broadcast User Disconnection if Name is Set
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
    //// Set User Nickname
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
            ws.send('Please enter /nick followed by your nickname')
        }
    }

    //// List Connected Users
    else if (message.startsWith('/list'))
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
    }

    //// Perform an Action in the Third Person
    else if (message.startsWith('/me'))
    {
        const action = message.split(' ')[1];
        console.log(action);
        broadcastMessage(`${clients.get(id).nickname} ${action}`)
        return;
    }

    //// Directly Message Users
    else if (message.startsWith('/msg'))
    {
        //* Get Target Username
        const name = message.split(' ')[1];

        //* Cuts off the /msg and nickname parts of the message
        let msg = message.slice(message.indexOf(' ') + 1, message.length);
        msg = msg.slice(msg.indexOf(' ') + 1, msg.length);

        //* User messaged themselves (they are crazy)
        if(name === clients.get(id).nickname)
        {
            ws.send(msg + ', you whisper to yourself');
        }

        //* Send Message to Targeted User
        for (let [key, value] of clients)
        {
            if (value.nickname === name)
            {
                value.ws.send(`${clients.get(id).nickname} whispers: ` + msg);
                ws.send(`You whisper to ${name}: ` + msg);
                break;
            }
        }
    }

    //// List Available Commands
    else if (message.startsWith('/help'))
    {
        ws.send('Available commands:');
        ws.send('/nick (name) - Changes your nickname');
        ws.send('/list - Prints all connected users');
        ws.send('/me (action) - Performs an action in the third person. \n');
        ws.send('/help - Displays a list of available commands');
        ws.send('/msg (name) (message) - Directly messages another user')
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
