import React from 'react';
import ChatWindow from './ChatWindow';
import './IphoneFrame.css';

const IphoneFrame = ({ user, otherUser, messages, onSendMessage, onSendGif, lastReceivedMessage }) => {
  return (
    <div className="iphone-frame">
      <div className="iphone-notch"></div>
      <div className="iphone-screen">
        <ChatWindow 
          user={user}
          otherUser={otherUser}
          messages={messages}
          onSendMessage={onSendMessage}
          onSendGif={onSendGif}
          lastReceivedMessage={lastReceivedMessage}
        />
      </div>
      <div className="iphone-home-indicator"></div>
    </div>
  );
};

export default IphoneFrame;
