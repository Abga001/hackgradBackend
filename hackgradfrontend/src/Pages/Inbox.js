//Inbox for messages
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../messageService';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles/Inbox.css';

// User avatar component with fallback to initials
const UserAvatar = ({ user, size = "md" }) => {
  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const sizeClass = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  }[size] || "w-10 h-10";

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

const ImprovedMessages = () => {
  const navigate = useNavigate();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userMap, setUserMap] = useState({});
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [newMessageQuery, setNewMessageQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const searchInputRef = useRef(null);
  const newMessageSearchRef = useRef(null);
  
  // Initialize Firebase authentication
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // await authenticateWithFirebase();
      } catch (error) {
        console.error("Firebase authentication failed:", error);
        setError("Failed to connect to chat service. Please try again later.");
      }
    };
    
    initFirebase();
  }, []);
  
  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Get current user profile
        const userResponse = await axios.get('http://localhost:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCurrentUserId(userResponse.data._id);
        
        // Fetch all users for mapping
        const usersResponse = await axios.get('http://localhost:3000/api/user/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Create a map of user IDs to user objects
        const users = {};
        usersResponse.data.forEach(user => {
          users[user._id] = user;
        });
        
        setUserMap(users);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data. Please check your connection and try again.");
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  // Fetch conversations and set up real-time updates
  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchUnreadCounts = async () => {
      try {
        const counts = await messageService.getAllConversationUnreadCounts(currentUserId);
        setUnreadCounts(counts || {});
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    };
    
    setLoading(true);
    
    try {
      // Subscribe to conversations
      const unsubscribe = messageService.subscribeToUserConversations(
        currentUserId,
        async (updatedConversations) => {
          // Process conversations
          const processedConversations = updatedConversations.map(convo => {
            // Find the other participant
            const otherUserId = convo.participants.find(id => id !== currentUserId);
            const otherUser = userMap[otherUserId];
            
            return {
              ...convo,
              otherUser
            };
          });
          
          setConversations(processedConversations);
          setFilteredConversations(processedConversations);
          setLoading(false);
          
          // Fetch unread counts
          await fetchUnreadCounts();
        }
      );
      
      // Clean up subscription on unmount
      return () => {
        unsubscribe && unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up conversations:", error);
      setError("Failed to load conversations. Please try again later.");
      setLoading(false);
    }
  }, [currentUserId, userMap]);
  
  // Handle search within existing conversations
  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(convo => {
        const otherUser = convo.otherUser;
        if (!otherUser) return false;
        
        const username = otherUser.username || "";
        const fullName = otherUser.fullName || "";
        const lastMessage = convo.lastMessage?.text || "";
        
        const searchTerms = searchQuery.toLowerCase();
        return username.toLowerCase().includes(searchTerms) ||
               fullName.toLowerCase().includes(searchTerms) ||
               lastMessage.toLowerCase().includes(searchTerms);
      });
      
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);
  
  // Handle search for new message recipients
  useEffect(() => {
    if (!newMessageQuery.trim() || !showNewMessage) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }
    
    const searchUsers = async () => {
      setSearchingUsers(true);
      try {
        // Use existing user map to filter users
        const results = Object.values(userMap).filter(user => {
          if (user._id === currentUserId) return false;
          
          const username = user.username || "";
          const fullName = user.fullName || "";
          
          const searchTerms = newMessageQuery.toLowerCase();
          return username.toLowerCase().includes(searchTerms) ||
                 fullName.toLowerCase().includes(searchTerms);
        });
        
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setSearchingUsers(false);
      }
    };
    
    searchUsers();
  }, [newMessageQuery, showNewMessage, userMap, currentUserId]);
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Create or navigate to conversation
  const handleStartConversation = async (userId) => {
    if (!userId || !currentUserId) return;
    
    try {
      // Create or get existing conversation
      const conversation = await messageService.createConversation(
        currentUserId,
        userId
      );
      
      // Close new message modal
      setShowNewMessage(false);
      setNewMessageQuery("");
      
      // Navigate to conversation
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setError("Failed to start conversation. Please try again.");
    }
  };
  
  // Handle new message button click
  const handleNewMessageClick = () => {
    setShowNewMessage(true);
    setTimeout(() => {
      newMessageSearchRef.current?.focus();
    }, 100);
  };
  
  // Press Escape to close new message modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowNewMessage(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Messages</h1>
        <div className="messages-actions">
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
            <span className="search-icon"><FontAwesomeIcon icon="fa-solid fa-magnifying-glass" /></span>
          </div>
          <button className="new-message-button" onClick={handleNewMessageClick} aria-label="New message">
        <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
      </button>
        </div>
      </div>
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="messages-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <p>No conversations matching "{searchQuery}"</p>
            ) : (
              <>
                <p>No conversations yet</p>
                <button 
                  className="start-conversation-btn"
                  onClick={handleNewMessageClick}
                >
                  Start a conversation
                </button>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map(conversation => {
            const otherUser = conversation.otherUser;
            const hasUnread = unreadCounts[conversation.id] > 0;
            
            return (
              <div
                key={conversation.id}
                className={`conversation-item ${hasUnread ? 'unread' : ''}`}
                onClick={() => navigate(`/messages/${conversation.id}`)}
              >
                <UserAvatar user={otherUser} />
                
                <div className="conversation-details">
                  <div className="conversation-top">
                    <span className="username">
                      {otherUser?.fullName || otherUser?.username || "Unknown User"}
                    </span>
                    <span className="timestamp">
                      {conversation.lastMessage && formatTimestamp(conversation.lastMessage.timestamp)}
                    </span>
                  </div>
                  
                  <div className="conversation-bottom">
                    <p className="message-preview">
                      {conversation.lastMessage?.senderId === currentUserId && (
                        <span className="sent-by-you">You: </span>
                      )}
                      {conversation.lastMessage?.text || "Start a conversation"}
                    </p>
                    
                    {hasUnread && (
                      <span className="unread-indicator">{unreadCounts[conversation.id]}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* New Message Modal */}
      {showNewMessage && (
        <div className="modal-overlay" onClick={() => setShowNewMessage(false)}>
          <div className="new-message-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Message</h3>
              <button
                className="close-modal"
                onClick={() => setShowNewMessage(false)}
              >
                ×
              </button>
            </div>
            
            <div className="user-search">
              <div className="search-input-container">
                <span className="search-to">To:</span>
                <input
                  ref={newMessageSearchRef}
                  type="text"
                  placeholder="Type a name or username"
                  value={newMessageQuery}
                  onChange={(e) => setNewMessageQuery(e.target.value)}
                  className="search-recipient-input"
                  autoFocus
                />
              </div>
              
              <div className="search-results">
                {searchingUsers ? (
                  <div className="searching-indicator">
                    <div className="spinner-small"></div>
                    <span>Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="user-results-list">
                    {searchResults.map(user => (
                      <li 
                        key={user._id}
                        onClick={() => handleStartConversation(user._id)}
                        className="user-result-item"
                      >
                        <UserAvatar user={user} size="sm" />
                        <div className="user-info">
                          <span className="user-name">{user.fullName || user.username}</span>
                          {user.fullName && user.username && (
                            <span className="user-username">@{user.username}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : newMessageQuery.trim() ? (
                  <div className="no-results">
                    <p>No users found matching "{newMessageQuery}"</p>
                  </div>
                ) : (
                  <div className="search-prompt">
                    <p>Search for a user to start a conversation</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedMessages;