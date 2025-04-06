import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';

const ChatWindow = ({ user, messages, onSendMessage, onSendGif, lastReceivedMessage }) => {
  const [message, setMessage] = useState('');
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleGifClick = async () => {
    if (!showGifPanel) {
      // If text is empty, use last received message for context
      const context = message.trim() || lastReceivedMessage;
      if (context) {
        try {
          const response = await fetch('http://localhost:8000/api/gif-suggestions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: context }),
          });
          const data = await response.json();
          // Limit to exactly 6 GIFs
          setGifs(data.slice(0, 6));
        } catch (error) {
          console.error('Error fetching GIFs:', error);
        }
      }
    }
    setShowGifPanel(!showGifPanel);
  };

  const handleGifSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        const response = await fetch('http://localhost:8000/api/search-gifs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: searchQuery }),
        });
        const data = await response.json();
        // Limit to exactly 6 GIFs
        setGifs(data.slice(0, 6));
      } catch (error) {
        console.error('Error searching GIFs:', error);
      }
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{user}</h2>
      </div>
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === user ? 'sent' : 'received'}`}
          >
            {msg.type === 'gif' ? (
              <img src={msg.content} alt="GIF" className="gif-preview" />
            ) : (
              <p>{msg.content}</p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
          />
          <button
            type="button"
            onClick={handleGifClick}
            className="gif-button"
          >
            GIF
          </button>
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
        {showGifPanel && (
          <div className="gif-panel">
            <form onSubmit={handleGifSearch} className="gif-search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search GIFs..."
                className="gif-search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </form>
            <div className="gif-grid">
              {gifs.map((gif, index) => (
                <div key={index} className="gif-container">
                  <img
                    src={gif.url}  // Using the full GIF URL instead of preview
                    alt="GIF"
                    className="gif-thumbnail"
                    onClick={() => {
                      onSendGif(gif.url);
                      setShowGifPanel(false);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow; 