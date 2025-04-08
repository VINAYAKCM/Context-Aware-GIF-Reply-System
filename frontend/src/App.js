import React, { useState } from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';

function App() {
  const [messages1, setMessages1] = useState([]);
  const [messages2, setMessages2] = useState([]);
  const [lastReceivedMessage1, setLastReceivedMessage1] = useState('');
  const [lastReceivedMessage2, setLastReceivedMessage2] = useState('');

  const handleSendMessage = (windowId, message) => {
    const newMessage = {
      content: message,
      sender: windowId === 1 ? 'User 1' : 'User 2',
      type: 'text'
    };

    if (windowId === 1) {
      setMessages1([...messages1, newMessage]);
      setMessages2([...messages2, { ...newMessage, sender: 'User 1' }]);
      setLastReceivedMessage2(message);
    } else {
      setMessages2([...messages2, newMessage]);
      setMessages1([...messages1, { ...newMessage, sender: 'User 2' }]);
      setLastReceivedMessage1(message);
    }
  };

  const handleSendGif = (windowId, gifUrl) => {
    const newMessage = {
      content: gifUrl,
      sender: windowId === 1 ? 'User 1' : 'User 2',
      type: 'gif'
    };

    if (windowId === 1) {
      setMessages1([...messages1, newMessage]);
      setMessages2([...messages2, { ...newMessage, sender: 'User 1' }]);
    } else {
      setMessages2([...messages2, newMessage]);
      setMessages1([...messages1, { ...newMessage, sender: 'User 2' }]);
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <ChatWindow
          user="User 1"
          messages={messages1}
          onSendMessage={(message) => handleSendMessage(1, message)}
          onSendGif={(gifUrl) => handleSendGif(1, gifUrl)}
          lastReceivedMessage={lastReceivedMessage1}
        />
        <ChatWindow
          user="User 2"
          messages={messages2}
          onSendMessage={(message) => handleSendMessage(2, message)}
          onSendGif={(gifUrl) => handleSendGif(2, gifUrl)}
          lastReceivedMessage={lastReceivedMessage2}
        />
      </div>
    </div>
  );
}

export default App; 