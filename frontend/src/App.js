import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const [user1Messages, setUser1Messages] = useState([]);
  const [user2Messages, setUser2Messages] = useState([]);

  const handleUser1Message = (message) => {
    const newMessage = { sender: 'User 1', content: message, type: 'text' };
    setUser1Messages([...user1Messages, newMessage]);
    setUser2Messages([...user2Messages, newMessage]);
  };

  const handleUser2Message = (message) => {
    const newMessage = { sender: 'User 2', content: message, type: 'text' };
    setUser1Messages([...user1Messages, newMessage]);
    setUser2Messages([...user2Messages, newMessage]);
  };

  const handleUser1Gif = (gifUrl) => {
    const newMessage = { sender: 'User 1', content: gifUrl, type: 'gif' };
    setUser1Messages([...user1Messages, newMessage]);
    setUser2Messages([...user2Messages, newMessage]);
  };

  const handleUser2Gif = (gifUrl) => {
    const newMessage = { sender: 'User 2', content: gifUrl, type: 'gif' };
    setUser1Messages([...user1Messages, newMessage]);
    setUser2Messages([...user2Messages, newMessage]);
  };

  const getLastReceivedMessage = (user, messages) => {
    const lastMessage = messages
      .filter(msg => msg.sender !== user)
      .slice(-1)[0];
    return lastMessage?.content || '';
  };

  return (
    <div className="app">
      <div className="chat-container">
        <ChatWindow
          user="User 1"
          messages={user1Messages}
          onSendMessage={handleUser1Message}
          onSendGif={handleUser1Gif}
          lastReceivedMessage={getLastReceivedMessage('User 1', user1Messages)}
        />
        <ChatWindow
          user="User 2"
          messages={user2Messages}
          onSendMessage={handleUser2Message}
          onSendGif={handleUser2Gif}
          lastReceivedMessage={getLastReceivedMessage('User 2', user2Messages)}
        />
      </div>
    </div>
  );
}

export default App; 