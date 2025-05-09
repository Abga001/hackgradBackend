// FloatingModal.js
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/FloatingModal.css';

const FloatingModal = ({ children, isOpen, onClose, title }) => {
  const modalRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling on background when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="floating-modal-overlay">
      <div className="floating-modal-container" ref={modalRef}>
        <div className="floating-modal-header">
          <h2>{title || 'Create Content'}</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="floating-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FloatingModal;