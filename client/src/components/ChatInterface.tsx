import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Phone, Video, Settings, Moon, Sun, Users } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { encryption } from '../utils/encryption';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  encrypted: boolean;
  messageType?: string;
}

interface ChatInterfaceProps {
  roomId: string;
  onStartCall: (type: 'audio' | 'video') => void;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  roomId,
  onStartCall,
  onBack
}) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { 
    messages, 
    connected, 
    typingUsers, 
    incomingCall,
    sendMessage, 
    startTyping, 
    stopTyping,
    acceptCall,
    rejectCall
  } = useSocket(roomId, user?._id || null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Handle typing indicators
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
  }, [isTyping, startTyping, stopTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      // Send encrypted message
      const content = encryption.encrypt(inputMessage.trim());
      sendMessage(content, 'text');
      setInputMessage('');
      
      // Stop typing
      if (isTyping) {
        setIsTyping(false);
        stopTyping();
      }
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === user?._id;
    let content = message.content;
    
    // Decrypt if encrypted
    if (message.encrypted) {
      console.log(`Decrypting message: ${message.content}`);
      try {
        content = encryption.decrypt(message.content);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        content = '[Encrypted message]';
      }
    }

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : isDark 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-200 text-gray-800'
          }`}
        >
          {message.messageType === 'call' ? (
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm italic">{content}</span>
            </div>
          ) : (
            <p className="text-sm">{content}</p>
          )}
          <p className={`text-xs mt-1 ${isOwn ? 'text-gray-200' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  // Handle incoming call
  useEffect(() => {
    if (incomingCall) {
      // Show call notification
      const audio = new Audio('/ringtone.mp3'); // Add ringtone file to public folder
      audio.loop = true;
      audio.play().catch(console.error);

      const handleCallResponse = () => {
        audio.pause();
        audio.currentTime = 0;
      };

      return handleCallResponse;
    }
  }, [incomingCall]);

  return (
    <div className={`min-h-screen flex flex-col ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'
    }`}>
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                {incomingCall.type === 'video' ? <Video className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
              </div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">
                Incoming {incomingCall.type} call
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {incomingCall.callerName}
              </p>
              <div className="flex space-x-4">
                <button onClick={rejectCall} className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Decline
                </button>
                <button onClick={acceptCall} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`px-4 py-3 border-b backdrop-blur-lg ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-full hover:bg-gray-100 ${
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600'
              } transition-colors`}
            >
              ←
            </button>
            <div>
              <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Private Chat
              </h2>
              <p className={`text-sm ${
                connected 
                  ? 'text-green-500' 
                  : isDark ? 'text-red-400' : 'text-red-500'
              }`}>
                {connected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onStartCall('audio')}
              className={`p-2 rounded-full ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              } transition-colors`}
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => onStartCall('video')}
              className={`p-2 rounded-full ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              } transition-colors`}
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                isDark 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              } transition-colors`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <Users className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Start your private conversation
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Messages are encrypted and completely private
              </p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start mb-4">
              <div className={`px-4 py-2 rounded-2xl ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {typingUsers[0].username} is typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t backdrop-blur-lg ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
              }`}
              disabled={!connected}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !connected}
              className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};