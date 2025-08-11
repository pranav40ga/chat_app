// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let onlineUsers = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('set username', (username) => {
    socket.username = username;
    const user = { id: socket.id, username: username };
    onlineUsers.push(user);

   
    io.emit('user list', onlineUsers);
    console.log(`User ${username} joined with id ${socket.id}`);
  });

  socket.on('chat message', (msg) => {
    const messageData = {
      username: socket.username || 'Anonymous', 
      text: msg,
    };
    io.emit('chat message', messageData);
    console.log(`Message from ${messageData.username}: ${messageData.text}`);
  });

  
  socket.on('gemini bot query', async (prompt) => {
    console.log(`Received bot query: ${prompt}`);
    let botResponse = 'Sorry, I am unable to process that request right now.';
    let retries = 0;
    const maxRetries = 5;
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    while (retries < maxRetries) {
      try {
        const payload = {
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }]
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.candidates && result.candidates.length > 0 &&
              result.candidates[0].content && result.candidates[0].content.parts &&
              result.candidates[0].content.parts.length > 0) {
            botResponse = result.candidates[0].content.parts[0].text;
            break; 
          }
        } else {
          console.error(`API call failed with status: ${response.status}`);
          throw new Error('API call failed');
        }
      } catch (error) {
        retries++;
        const delay = Math.pow(2, retries) * 1000;
        console.error(`Attempt ${retries} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    
    const messageData = {
      username: 'Gemini Bot',
      text: botResponse,
    };
    io.emit('chat message', messageData);
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.find(u => u.id === socket.id);
    if (user) {
      onlineUsers = onlineUsers.filter(u => u.id !== socket.id);
      io.emit('user list', onlineUsers);
      console.log(`User ${user.username} disconnected.`);
    } else {
      console.log('A user disconnected:', socket.id);
    }
  });
});


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
