import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WifiIcon from '@mui/icons-material/Wifi';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import MattProfile from '../assets/Matt.png';
import RobinProfile from '../assets/Robin.png';

const ChatWindow = ({ user, otherUser, messages, onSendMessage, onSendGif, lastReceivedMessage }) => {
  const [message, setMessage] = useState('');
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState('9:41');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (showGifPanel) {
      const delayDebounceFn = setTimeout(() => {
        if (searchQuery.trim()) {
          fetchGifs(searchQuery.trim(), 'search');
        }
      }, 300); // 300ms delay

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, showGifPanel]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);
    setIsTyping(text.length > 0);
    if (showGifPanel && text.trim()) {
      fetchGifs(text.trim(), 'search');
    }
  };

  const handleInputClick = () => {
    if (showGifPanel) {
      setShowGifPanel(false);
    }
  };

  const getProfileImage = (username) => {
    if (username === 'Matt Willkins') {
      return MattProfile;
    }
    return RobinProfile;
  };

  const getFullName = (username) => {
    if (username === 'Matt Willkins') {
      return 'Matt Willkins';
    }
    return 'Robin Schzacy';
  };

  return (
    <div className="chat-window">
      <div className="status-bar">
        <div className="status-bar-time">9:41</div>
        <div className="status-bar-icons">
          <svg className="signal-icon" width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="0" width="3" height="12" rx="1" fill="white"/>
            <rect x="9.5" y="3" width="3" height="9" rx="1" fill="white"/>
            <rect x="5" y="6" width="3" height="6" rx="1" fill="white"/>
            <rect x="0.5" y="9" width="3" height="3" rx="1" fill="white"/>
          </svg>
          <svg className="wifi-icon" width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 9.5C8.55228 9.5 9 9.94772 9 10.5C9 11.0523 8.55228 11.5 8 11.5C7.44772 11.5 7 11.0523 7 10.5C7 9.94772 7.44772 9.5 8 9.5Z" fill="white"/>
            <path d="M8 6C9.65685 6 11.2013 6.67428 12.3336 7.80657L11.2427 8.89749C10.4677 8.12249 9.27065 7.5 8 7.5C6.72935 7.5 5.53227 8.12249 4.75736 8.89749L3.66644 7.80657C4.79873 6.67428 6.34315 6 8 6Z" fill="white"/>
            <path d="M8 2.5C10.5399 2.5 12.9097 3.53142 14.6673 5.28903L13.5764 6.37996C12.1284 4.93196 10.1543 4 8 4C5.84568 4 3.87158 4.93196 2.42359 6.37996L1.33267 5.28903C3.09028 3.53142 5.46005 2.5 8 2.5Z" fill="white"/>
          </svg>
          <svg className="battery-icon" width="25" height="12" viewBox="0 0 25 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="white"/>
            <rect x="2" y="2" width="18" height="8" rx="2" fill="white"/>
            <path d="M23 4V8C23.8047 7.66122 24.328 6.87313 24.328 6C24.328 5.12687 23.8047 4.33878 23 4Z" fill="white"/>
          </svg>
        </div>
      </div>

      <div className="chat-header">
        <button className="back-button">
          <ChevronLeftIcon style={{ color: '#FFFFFF' }} />
        </button>
        <div className="profile-info">
          <img 
            src={getProfileImage(otherUser)} 
            alt={`${otherUser}'s profile`} 
            className="profile-picture"
          />
          <span className="profile-name">{getFullName(otherUser)}</span>
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
              onClick={handleInputClick}
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
                <form onSubmit={(e) => e.preventDefault()} className="gif-search-form">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search GIFs"
                    className="gif-search-input"
                  />
                  <SearchIcon className="search-icon" />
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
                          setSearchQuery('');
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