import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageService } from '../messageService';
import axios from 'axios';
import '../styles/Conversation.css';

// User avatar component with fallback to initials
const UserAvatar = ({ user, size = "md" }) => {
  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const sizeClass = {
    sm: "avatar-sm",
    md: "avatar-md",
    lg: "avatar-lg"
  }[size] || "avatar-md";

  if (user?.profileImage) {
    return (
      <div className={`avatar ${sizeClass}`}>
        <img
          src={user.profileImage}
          alt={user.username || "User"}
          className="avatar-img"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.classList.add('avatar-fallback');
            e.target.parentNode.innerText = getInitials(user.username);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`avatar-fallback ${sizeClass}`}>
      {getInitials(user?.username)}
    </div>
  );
};

const Conversation = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Fetch user data and conversation details on initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Get current user profile
        const response = await axios.get('http://localhost:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data);

        // Get conversation details
        const convo = await messageService.getConversationById(conversationId);
        if (!convo) {
          setError('Conversation not found');
          setLoading(false);
          return;
        }
        setConversation(convo);

        // Get other participant's details
        const otherParticipantId = convo.participants.find(id => id !== response.data._id);
        if (otherParticipantId) {
          try {
            const otherUserResponse = await axios.get(`http://localhost:3000/api/user/profile/${otherParticipantId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setOtherUser(otherUserResponse.data);
          } catch (err) {
            console.error('Error fetching other user details:', err);
          }
        }

        // Mark messages as read
        await messageService.markMessagesAsRead(conversationId, response.data._id);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load conversation. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, navigate]);
  
  // Subscribe to messages for real-time updates
  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;
  
    let mounted = true;
    
    const loadMessages = async () => {
      try {
        setLoading(true);
        // Subscribe to messages
        const unsubscribe = messageService.subscribeToMessages(
          conversationId,
          async (updatedMessages) => {
            if (mounted) {
              setMessages(updatedMessages);
              setLoading(false);
              
              // Mark messages as read whenever new messages arrive
              await messageService.markMessagesAsRead(conversationId, currentUser._id);
            }
          }
        );
  
        // Cleanup subscription on component unmount
        return () => {
          mounted = false;
          unsubscribe();
        };
      } catch (err) {
        console.error('Error subscribing to messages:', err);
        if (mounted) {
          setError('Failed to load messages. Please try again.');
          setLoading(false);
        }
      }
    };
  
    loadMessages();
  }, [conversationId, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus message input when conversation loads
  useEffect(() => {
    if (!loading && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [loading]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser?._id || !conversationId || isSending) {
      return;
    }
    
    try {
      setIsSending(true);
      await messageService.sendMessage(conversationId, currentUser._id, newMessage.trim());
      setNewMessage('');
      setError(null);
      
      // Force scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      messageInputRef.current?.focus();
    }
  };
  
  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Format timestamp for message bubbles
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for day separators
  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  // Group messages by date for day separators
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      if (!message.timestamp) return;
      
      const date = message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp);
      const dateString = date.toDateString();
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      
      groups[dateString].push(message);
    });
    
    return groups;
  };
  
  // Handle back button
  const handleBack = () => {
    navigate('/messages');
  };

  return (
    <div className="conversation-container">
      {/* Conversation Header */}
      <div className="conversation-header">
        <button 
          className="back-button"
          onClick={handleBack}
          aria-label="Back to messages"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        
        {otherUser ? (
          <div className="conversation-user" onClick={() => navigate(`/profile/${otherUser._id}`)}>
            <UserAvatar user={otherUser} />
            <div className="user-details">
              <h3 className="user-name">{otherUser.fullName || otherUser.username}</h3>
              {otherUser.fullName && otherUser.username && (
                <p className="user-username">@{otherUser.username}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="conversation-user">
            <div className="avatar-loading"></div>
            <div className="user-details-loading">
              <div className="name-loading"></div>
              <div className="username-loading"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {/* Messages area */}
      <div className="messages-area" ref={messagesContainerRef}>
        {loading ? (
          <div className="loading-messages">
            <div className="message-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-conversation">
            <div className="empty-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Send a message to start the conversation!</p>
          </div>
        ) : (
          <div className="messages-content">
            {/* Group messages by date */}
            {Object.entries(groupMessagesByDate()).map(([dateString, dateMessages]) => (
              <div key={dateString} className="message-date-group">
                <div className="date-separator">
                  <span>{formatMessageDate(dateMessages[0].timestamp)}</span>
                </div>
                
                {/* Render message bubbles */}
                {dateMessages.map((message, index) => {
                  const isCurrentUser = message.senderId === currentUser?._id;
                  const isFirstInGroup = index === 0 || 
                    dateMessages[index - 1].senderId !== message.senderId;
                  const isLastInGroup = index === dateMessages.length - 1 || 
                    dateMessages[index + 1].senderId !== message.senderId;
                    
                  return (
                    <div 
                      key={message.id} 
                      className={`message-container ${isCurrentUser ? 'sent' : 'received'}`}
                    >
                      {!isCurrentUser && isFirstInGroup && (
                        <UserAvatar user={otherUser} size="sm" />
                      )}
                      
                      <div 
                        className={`message-bubble ${isCurrentUser ? 'sent' : 'received'} ${isFirstInGroup ? 'first' : ''} ${isLastInGroup ? 'last' : ''}`}
                      >
                        <div className="message-content">{message.text}</div>
                        <div className="message-time">{formatMessageTime(message.timestamp)}</div>
                      </div>
                      
                      {isCurrentUser && isFirstInGroup && (
                        <UserAvatar user={currentUser} size="sm" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} className="scroll-target"></div>
          </div>
        )}
      </div>
      
      {/* Message input */}
      <form className="message-form" onSubmit={handleSendMessage}>
        <textarea
          ref={messageInputRef}
          className="message-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isSending}
          rows={1}
        />
        
        <button 
          type="submit" 
          className="send-button"
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <div className="send-spinner"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default Conversation;