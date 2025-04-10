import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';

const ChatWindow = ({ user, otherUser, messages, onSendMessage, onSendGif, lastReceivedMessage }) => {
  const [message, setMessage] = useState('');
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setIsTyping(false);
      setShowGifPanel(false);
    }
  };

  const fetchGifs = async (text, type = 'reply') => {
    setIsLoading(true);
    try {
      const endpoint = type === 'reply' ? 'gif-suggestions' : 'search-gifs';
      const response = await fetch(`http://localhost:8000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setGifs(type === 'reply' ? data.gifs : data);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGifClick = async () => {
    if (!showGifPanel) {
      if (message.trim()) {
        await fetchGifs(message.trim(), 'search');
      } else if (lastReceivedMessage) {
        await fetchGifs(lastReceivedMessage, 'reply');
      }
    }
    setShowGifPanel(!showGifPanel);
  };

  const handleGifSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await fetchGifs(searchQuery.trim(), 'search');
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);
    setIsTyping(text.length > 0);
    if (showGifPanel && text.trim()) {
      fetchGifs(text.trim(), 'search');
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-button">
          <ArrowBackIcon />
        </button>
        <div className="profile-info">
          <div className="profile-picture"></div>
          <span className="profile-name">{otherUser}</span>
        </div>
      </div>

      <div className="chat-content">
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
          <form onSubmit={handleSendMessage} className={`message-form ${isTyping ? 'typing' : ''}`}>
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              placeholder="Message"
              className="message-input"
            />
            <button
              type="button"
              onClick={handleGifClick}
              className={`gif-button ${showGifPanel ? 'active' : ''}`}
            >
              GIF
            </button>
            {isTyping && (
              <button type="submit" className="send-button">
                <SendIcon />
              </button>
            )}
          </form>

          {showGifPanel && (
            <div className={`gif-panel ${showGifPanel ? 'show' : ''}`}>
              <div className="gif-search-container">
                <form onSubmit={handleGifSearch} className="gif-search-form">
                  <SearchIcon className="search-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search GIFs"
                    className="gif-search-input"
                  />
                </form>
              </div>
              
              {isLoading ? (
                <div className="loading-indicator">Loading GIFs...</div>
              ) : (
                <div className="gif-grid">
                  {gifs.map((gif, index) => (
                    <div key={index} className="gif-container">
                      <img
                        src={gif.preview || gif.url}
                        alt={gif.title || "GIF"}
                        className="gif-thumbnail"
                        onClick={() => {
                          onSendGif(gif.url);
                          setShowGifPanel(false);
                          setMessage('');
                          setIsTyping(false);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 