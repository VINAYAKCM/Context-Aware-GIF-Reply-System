import React, { useState } from 'react';
import './App.css';
import IphoneFrame from './components/IphoneFrame';

function App() {
  const [messages1, setMessages1] = useState([]);
  const [messages2, setMessages2] = useState([]);
  const [lastReceivedMessage1, setLastReceivedMessage1] = useState('');
  const [lastReceivedMessage2, setLastReceivedMessage2] = useState('');

  const handleSendMessage1 = (message) => {
    const newMessage = { content: message, type: 'text', sender: 'Matt Watkins' };
    setMessages1([...messages1, newMessage]);
    setLastReceivedMessage2(message);
  };

  const handleSendMessage2 = (message) => {
    const newMessage = { content: message, type: 'text', sender: 'Robin Schzacy' };
    setMessages2([...messages2, newMessage]);
    setLastReceivedMessage1(message);
  };

  const handleSendGif1 = (gifUrl) => {
    const newMessage = { content: gifUrl, type: 'gif', sender: 'Matt Watkins' };
    setMessages1([...messages1, newMessage]);
    setLastReceivedMessage2('Check out this GIF!');
  };

  const handleSendGif2 = (gifUrl) => {
    const newMessage = { content: gifUrl, type: 'gif', sender: 'Robin Schzacy' };
    setMessages2([...messages2, newMessage]);
    setLastReceivedMessage1('Check out this GIF!');
  };

  return (
    <div className="app">
      <div className="iphone-container">
        <IphoneFrame
          user="Matt Watkins"
          otherUser="Robin Schzacy"
          messages={messages1}
          onSendMessage={handleSendMessage1}
          onSendGif={handleSendGif1}
          lastReceivedMessage={lastReceivedMessage1}
        />
        <IphoneFrame
          user="Robin Schzacy"
          otherUser="Matt Watkins"
          messages={messages2}
          onSendMessage={handleSendMessage2}
          onSendGif={handleSendGif2}
          lastReceivedMessage={lastReceivedMessage2}
        />
      </div>
    </div>
  );
}

export default App; 