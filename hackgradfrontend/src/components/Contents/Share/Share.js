// SharePopup option for Facebook, Linkedin, Twitter, Whatsapp and Telegram
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLink, 
  faEnvelope, 
  faTimes
} from '@fortawesome/free-solid-svg-icons';

// Import brand icons
import {
  faFacebookF,
  faTwitter,
  faLinkedinIn,
  faWhatsapp,
  faTelegram
} from '@fortawesome/free-brands-svg-icons';
import '../../../styles/ContentStyles/Share.css';

const SharePopup = ({ isOpen, onClose, contentUrl, contentTitle }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const popupRef = useRef(null);

  const shareUrl = contentUrl || window.location.href;
  const shareTitle = contentTitle || document.title;
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const handleClose = () => {
    setAnimateOut(true);
    setTimeout(() => {
      setAnimateOut(false);
      onClose();
    }, 300); // Match this with the CSS animation duration
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`Check out this content: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareToWhatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`, '_blank');
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className={`share-popup-overlay ${animateOut ? 'fade-out' : 'fade-in'}`}>
      <div 
        ref={popupRef}
        className={`share-popup-container ${animateOut ? 'slide-out' : 'slide-in'}`}
      >
        <div className="share-popup-header">
          <h3>Share this content</h3>
          <button className="close-button" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="share-popup-content">
          <div className="share-url-container">
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className="share-url-input" 
            />
            <button 
              onClick={copyToClipboard} 
              className={`copy-button ${copySuccess ? 'copy-success' : ''}`}
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <div className="share-options">
            <button className="share-option email" onClick={shareViaEmail}>
              <span className="share-icon">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <span>Email</span>
            </button>
            
            <button className="share-option facebook" onClick={shareToFacebook}>
              <span className="share-icon">
                <FontAwesomeIcon icon={faFacebookF} />
              </span>
              <span>Facebook</span>
            </button>
            
            <button className="share-option twitter" onClick={shareToTwitter}>
              <span className="share-icon">
                <FontAwesomeIcon icon={faTwitter} />
              </span>
              <span>Twitter</span>
            </button>
            
            <button className="share-option linkedin" onClick={shareToLinkedIn}>
              <span className="share-icon">
                <FontAwesomeIcon icon={faLinkedinIn} />
              </span>
              <span>LinkedIn</span>
            </button>
            
            <button className="share-option whatsapp" onClick={shareToWhatsapp}>
              <span className="share-icon">
                <FontAwesomeIcon icon={faWhatsapp} />
              </span>
              <span>WhatsApp</span>
            </button>
            
            <button className="share-option telegram" onClick={shareToTelegram}>
              <span className="share-icon">
                <FontAwesomeIcon icon={faTelegram} />
              </span>
              <span>Telegram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePopup;