import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';

const ChatWindow = ({ user, messages, onSendMessage, onSendGif, lastReceivedMessage }) => {
  const [message, setMessage] = useState('');
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionType, setSuggestionType] = useState('reply'); // 'reply' or 'search'
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
      setShowGifPanel(false);
      setDebugInfo(null);
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
      
      if (type === 'reply') {
        setGifs(data.gifs || []);
        setDebugInfo(data.debug_info || null);
      } else {
        setGifs(data || []);
        setDebugInfo(null);
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGifClick = async () => {
    if (!showGifPanel) {
      if (message.trim()) {
        // If text in textbar, show GIFs representing that text
        await fetchGifs(message.trim(), 'search');
      } else {
        // If textbar empty, show reply GIFs based on last received message
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

  const handleSuggestionTypeChange = async (type) => {
    setSuggestionType(type);
    if (type === 'reply') {
      const context = message.trim() || lastReceivedMessage;
      if (context) {
        await fetchGifs(context, 'reply');
      }
    } else {
      setDebugInfo(null);
      if (searchQuery.trim()) {
        await fetchGifs(searchQuery.trim(), 'search');
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
            onChange={(e) => {
              setMessage(e.target.value);
              if (showGifPanel && e.target.value.trim()) {
                // Update GIFs as user types if GIF panel is open
                fetchGifs(e.target.value.trim(), 'search');
              }
            }}
            placeholder="Type a message..."
            className="message-input"
          />
          <button
            type="button"
            onClick={handleGifClick}
            className={`gif-button ${showGifPanel ? 'active' : ''}`}
          >
            GIF
          </button>
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
        {showGifPanel && (
          <div className="gif-panel">
            <div className="gif-panel-header">
              <div className="suggestion-type-toggle">
                <button
                  className={`toggle-button ${suggestionType === 'reply' ? 'active' : ''}`}
                  onClick={() => handleSuggestionTypeChange('reply')}
                >
                  Reply GIFs
                </button>
                <button
                  className={`toggle-button ${suggestionType === 'search' ? 'active' : ''}`}
                  onClick={() => handleSuggestionTypeChange('search')}
                >
                  Search GIFs
                </button>
              </div>
              {suggestionType === 'search' && (
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
              )}
            </div>
            
            {debugInfo && suggestionType === 'reply' && (
              <div className="debug-info">
                <div className="debug-section">
                  <h4>Generated Replies:</h4>
                  <ul>
                    {debugInfo.replies.map((reply, index) => (
                      <li key={index}>{reply}</li>
                    ))}
                  </ul>
                </div>
                <div className="debug-section">
                  <h4>Search Query:</h4>
                  <p>{debugInfo.search_query}</p>
                </div>
              </div>
            )}

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
                        setSearchQuery('');
                      }}
                    />
                    {gif.similarity && (
                      <div className="gif-score">
                        Score: {gif.similarity.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow; 