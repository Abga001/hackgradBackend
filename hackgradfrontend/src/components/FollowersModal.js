// FollowersModal.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUserPlus, faUserCheck, faUserMinus } from '@fortawesome/free-solid-svg-icons';
import '../styles/FollowersModal.css';

/**
 * Modal component to display followers or following users
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {function} props.onClose Function to close the modal
 * @param {string} props.type Either 'followers' or 'following'
 * @param {Array} props.users List of user objects
 * @param {function} props.onFollowToggle Function to handle follow/unfollow action
 * @param {Object} props.currentUser Current logged in user
 */
const FollowersModal = ({ isOpen, onClose, type, users = [], onFollowToggle, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const fullName = user.fullName || '';
    const username = user.username || '';
    const query = searchQuery.toLowerCase();
    
    return fullName.toLowerCase().includes(query) || 
           username.toLowerCase().includes(query);
  });

  // Check if current user is following a specific user
  const isFollowing = (userId) => {
    if (!currentUser || !currentUser.connections) return false;
    return currentUser.connections.includes(userId);
  };

  if (!isOpen) return null;

  return (
    <div className="followers-modal-overlay">
      <div className="followers-modal" ref={modalRef}>
        <div className="followers-modal-header">
          <h3>{type === 'followers' ? 'Followers' : 'Following'}</h3>
          <button className="followers-modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="followers-modal-search">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="followers-modal-content">
          {filteredUsers.length > 0 ? (
            <ul className="followers-list">
              {filteredUsers.map(user => (
                <li key={user._id} className="follower-item">
                  <Link to={`/profile/${user._id}`} className="follower-link" onClick={onClose}>
                    <img 
                      src={user.profileImage || "/default-avatar.png"} 
                      alt={user.username}
                      className="follower-avatar"
                      onError={(e) => { e.target.src = "/default-avatar.png" }}
                    />
                    <div className="follower-info">
                      <span className="follower-name">{user.fullName || user.username}</span>
                      <span className="follower-username">@{user.username}</span>
                    </div>
                  </Link>
                  
                  {currentUser && currentUser._id !== user._id && (
                    <button 
                      className={`follow-toggle-btn ${isFollowing(user._id) ? 'following' : ''}`}
                      onClick={() => onFollowToggle(user._id)}
                    >
                      {isFollowing(user._id) ? (
                        <>
                          <FontAwesomeIcon icon={faUserCheck} /> Following
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faUserPlus} /> Follow
                        </>
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-followers">
              {searchQuery ? (
                <p>No users found matching "{searchQuery}"</p>
              ) : (
                <p>{type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;