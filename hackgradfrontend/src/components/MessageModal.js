// MessageModal.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Inbox from '../Pages/Inbox';
import Conversation from '../Pages/Conversation';
import '../styles/MessageModal.css';

const MessageModal = ({ isOpen, onClose }) => {
  const { conversationId } = useParams();
  const location = useLocation();
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const [viewingConversation, setViewingConversation] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);

  // Check if we're on a conversation route
  useEffect(() => {
    if (location.pathname.includes('/messages/')) {
      const pathSegments = location.pathname.split('/');
      const convoId = pathSegments[pathSegments.length - 1];
      setViewingConversation(true);
      setActiveConversation(convoId);
    } else {
      setViewingConversation(false);
      setActiveConversation(null);
    }
  }, [location.pathname]);

  // Handle clicks outside the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling on background
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const handleCloseModal = () => {
    onClose();
    // Navigate back to dashboard or current page without messages
    const currentPath = location.pathname;
    if (currentPath.includes('/messages')) {
      navigate('/dashboard');
    }
  };

  // Handle back button in conversation view
  const handleBackToInbox = () => {
    setViewingConversation(false);
    setActiveConversation(null);
    navigate('/messages');
  };

  // Custom navigation to conversation
  const handleNavigateToConversation = (conversationId) => {
    setViewingConversation(true);
    setActiveConversation(conversationId);
    navigate(`/messages/${conversationId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="message-modal-overlay">
      <div className="message-modal-container" ref={modalRef}>
        <div className="message-modal-header">
          <h2>{viewingConversation ? 'Conversation' : 'Messages'}</h2>
          {viewingConversation && (
            <button 
              className="back-button" 
              onClick={handleBackToInbox}
            >
              ← Back
            </button>
          )}
          <button className="close-button" onClick={handleCloseModal}>
            ✕
          </button>
        </div>
        <div className="message-modal-content">
          {viewingConversation ? (
            // Wrap Conversation component with custom navigation handler
            <div className="modal-conversation-wrapper">
              <Conversation 
                isModal={true} 
                onBackClick={handleBackToInbox}
              />
            </div>
          ) : (
            // Wrap Inbox component with custom navigation handler
            <div className="modal-inbox-wrapper">
              <Inbox 
                isModal={true} 
                onConversationClick={handleNavigateToConversation}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageModal;