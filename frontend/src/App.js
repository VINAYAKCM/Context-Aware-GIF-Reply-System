import React, { useState } from 'react';
import './App.css';
import IphoneFrame from './components/IphoneFrame';

function App() {
  const [messages, setMessages] = useState([]);
  const [lastReceivedMessage1, setLastReceivedMessage1] = useState('');
  const [lastReceivedMessage2, setLastReceivedMessage2] = useState('');

  const handleSendMessage1 = (message) => {
    const newMessage = { content: message, type: 'text', sender: 'Robin Schzacy' };
    setMessages([...messages, newMessage]);
    setLastReceivedMessage2(message);
  };

  const handleSendMessage2 = (message) => {
    const newMessage = { content: message, type: 'text', sender: 'Matt Willkins' };
    setMessages([...messages, newMessage]);
    setLastReceivedMessage1(message);
  };

  const handleSendGif1 = (gifUrl) => {
    const newMessage = { content: gifUrl, type: 'gif', sender: 'Robin Schzacy' };
    setMessages([...messages, newMessage]);
    setLastReceivedMessage2('Check out this GIF!');
  };

  const handleSendGif2 = (gifUrl) => {
    const newMessage = { content: gifUrl, type: 'gif', sender: 'Matt Willkins' };
    setMessages([...messages, newMessage]);
    setLastReceivedMessage1('Check out this GIF!');
  };

  return (
    <div className="app">
      <div className="iphone-container">
        <IphoneFrame
          user="Robin Schzacy"
          otherUser="Matt Willkins"
          messages={messages}
          onSendMessage={handleSendMessage1}
          onSendGif={handleSendGif1}
          lastReceivedMessage={lastReceivedMessage1}
        />
        <IphoneFrame
          user="Matt Willkins"
          otherUser="Robin Schzacy"
          messages={messages}
          onSendMessage={handleSendMessage2}
          onSendGif={handleSendGif2}
          lastReceivedMessage={lastReceivedMessage2}
        />
      </div>
    </div>
  );
}

export default App; 