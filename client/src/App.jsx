import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, MessageSquare, Sparkles } from 'lucide-react';

const socket = io('http://localhost:3000');

export default function App() {
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);

  useEffect(() => {
    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
      if (msg.username === 'Gemini Bot') {
        setIsBotThinking(false);
      }
    });

    socket.on('user list', (onlineUsers) => {
      setUsers(onlineUsers);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('chat message');
      socket.off('user list');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSetUsername = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('set username', username.trim());
      setIsUsernameSet(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      if (isBotEnabled && message.trim().startsWith('@Gemini')) {
        setIsBotThinking(true);
        const prompt = message.trim().substring(7).trim();
        socket.emit('gemini bot query', prompt);
      } else {
        socket.emit('chat message', message);
      }
      setMessage('');
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <form onSubmit={handleSetUsername} className="p-8 space-y-4 bg-white rounded-lg shadow-xl dark:bg-gray-800 w-96">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">Join Chat</h2>
          <div className="relative">
            <User className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 top-1/2 left-3" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
              placeholder="Enter your username"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-blue-600 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Join
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen antialiased bg-gray-100 font-inter dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <MessageSquare className="text-blue-500" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Real-time Chat</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsBotEnabled(!isBotEnabled)}
            className={`flex items-center px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${isBotEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
            title="Toggle Gemini Bot"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {isBotEnabled ? 'Bot ON' : 'Bot OFF'}
          </button>
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{username}</span>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* User list sidebar */}
        <aside className="w-64 p-4 overflow-y-auto bg-gray-50 border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Online Users</h3>
          <ul className="mt-4 space-y-2">
            {users.map((user, index) => (
              <li key={index} className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200">
                <div className="w-2 h-2 mr-2 bg-green-500 rounded-full" />
                {user.username}
              </li>
            ))}
            {isBotEnabled && (
              <li className="flex items-center px-3 py-2 text-sm text-purple-700 bg-purple-200 rounded-lg dark:bg-purple-700 dark:text-purple-200 animate-pulse">
                <Sparkles className="w-4 h-4 mr-2" />
                Gemini Bot
              </li>
            )}
          </ul>
        </aside>

        {/* Chat window */}
        <div className="relative flex flex-col flex-1">
          {/* Message display area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex flex-col max-w-sm px-4 py-2 text-white rounded-lg shadow ${msg.username === username ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <span className="text-xs font-semibold">{msg.username}</span>
                    <p className="mt-1 text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isBotThinking && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 text-white bg-purple-600 rounded-lg shadow max-w-sm">
                    <span className="text-xs font-semibold">Gemini Bot</span>
                    <p className="mt-1 text-sm animate-pulse">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message input form */}
          <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 w-full px-4 py-2 text-sm text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:border-gray-600"
                placeholder={isBotEnabled ? "Type '@Gemini' to ask the bot or a regular message..." : "Type a message..."}
                required
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
