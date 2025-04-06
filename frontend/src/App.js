import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  TextField, 
  IconButton, 
  Typography, 
  Grid,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon, Gif as GifIcon } from '@mui/icons-material';
import { io } from 'socket.io-client';
import axios from 'axios';
import debounce from 'lodash/debounce';

// Create a ChatWindow component
const ChatWindow = ({ username, otherUsers }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [gifSuggestions, setGifSuggestions] = useState([]);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const socket = useRef(io('http://localhost:8000', {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5
  })).current;

  useEffect(() => {
    socket.emit('join', { username });

    socket.on('new_message', (data) => {
      if (otherUsers.includes(data.username) || data.username === username) {
        setMessages(prev => [...prev, data]);
      }
    });

    socket.on('user_typing', (data) => {
      if (otherUsers.includes(data.username)) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1000);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [username, otherUsers]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      const messageData = {
        username,
        text: inputMessage,
        timestamp: new Date().toISOString()
      };

      socket.emit('message', messageData);
      setInputMessage('');
      setShowGifPanel(false);
      setGifSuggestions([]);
    }
  };

  const handleSendGif = (gifUrl) => {
    const messageData = {
      username,
      gifUrl,
      timestamp: new Date().toISOString()
    };

    socket.emit('message', messageData);
    setShowGifPanel(false);
    setGifSuggestions([]);
  };

  const handleTyping = debounce(() => {
    socket.emit('typing', { username });
  }, 500);

  const handleGifSearch = async () => {
    if (inputMessage.trim()) {
      setIsLoading(true);
      try {
        const response = await axios.post('http://localhost:8000/api/gif-suggestions', {
          text: inputMessage
        });
        setGifSuggestions(response.data);
        setShowGifPanel(true);
      } catch (error) {
        console.error('Error fetching GIF suggestions:', error);
      }
      setIsLoading(false);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: '100%',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#ffffff'
      }}>
        <Typography variant="h6" component="h1">
          {username}'s Chat
        </Typography>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: '#f8f9fa'
      }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.username === username ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '70%',
                borderRadius: 2,
                bgcolor: msg.username === username ? '#007bff' : '#ffffff',
                color: msg.username === username ? '#ffffff' : 'inherit',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <Typography variant="caption" sx={{ 
                display: 'block',
                mb: 0.5,
                color: msg.username === username ? 'rgba(255,255,255,0.8)' : 'text.secondary'
              }}>
                {msg.username}
              </Typography>
              {msg.gifUrl ? (
                <Box
                  component="img"
                  src={msg.gifUrl}
                  alt="GIF"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 1,
                    display: 'block'
                  }}
                />
              ) : (
                <Typography sx={{ wordBreak: 'break-word' }}>{msg.text}</Typography>
              )}
            </Paper>
          </Box>
        ))}
        {isTyping && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Someone is typing...
          </Typography>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {showGifPanel && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2,
            maxHeight: 200,
            overflow: 'auto',
            borderTop: '1px solid #e0e0e0'
          }}
        >
          <Grid container spacing={1}>
            {gifSuggestions.map((gif, index) => (
              <Grid item xs={4} key={index}>
                <Box
                  component="img"
                  src={gif.url}
                  alt={gif.title}
                  sx={{
                    width: '100%',
                    height: 100,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                  onClick={() => handleSendGif(gif.url)}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid #e0e0e0',
        bgcolor: '#ffffff',
        display: 'flex',
        gap: 1
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          size="small"
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3
            }
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleGifSearch}
          disabled={isLoading || !inputMessage.trim()}
          sx={{ bgcolor: 'rgba(0,123,255,0.1)' }}
        >
          {isLoading ? <CircularProgress size={24} /> : <GifIcon />}
        </IconButton>
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
          sx={{ bgcolor: 'rgba(0,123,255,0.1)' }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

// Main App component
function App() {
  return (
    <Box sx={{ 
      height: '100vh',
      bgcolor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Grid container spacing={2} sx={{ maxWidth: 1600, mx: 'auto' }}>
        <Grid item xs={12} md={6}>
          <ChatWindow username="User1" otherUsers={["User2"]} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChatWindow username="User2" otherUsers={["User1"]} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default App; 