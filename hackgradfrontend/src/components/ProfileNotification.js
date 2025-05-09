
import React, { useState, useEffect } from 'react';

const ProfileNotification = ({ 
  message, 
  icon, 
  onClose, 
  duration = 3000, 
  primaryColor = '#4e54c8', 
  secondaryColor = '#8f94fb' 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-close the notification after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    // Clean up timer
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Call onClose after fade out animation
    }
  };

  if (!isVisible) return null;

  return (
    <div className="notification-overlay">
      <div 
        className="notification-container"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          animation: isVisible ? 'fadeIn 0.3s ease' : 'fadeOut 0.3s ease forwards'
        }}
      >
        <div className="notification-content">
          <div className="notification-header">
            <div className="notification-title">
              {icon && <span className="notification-icon">{icon}</span>}
              <span>localhost:3001</span>
            </div>
          </div>
          <div className="notification-body">
            {message}
          </div>
          <div className="notification-footer">
            <button 
              className="notification-button"
              onClick={handleClose}
              style={{ color: primaryColor }}
            >
              OK
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .notification-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        
        .notification-container {
          width: 400px;
          max-width: 90%;
          background: linear-gradient(135deg, #4e54c8, #8f94fb);
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        
        .notification-content {
          display: flex;
          flex-direction: column;
        }
        
        .notification-header {
          padding: 15px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .notification-title {
          display: flex;
          align-items: center;
          font-size: 16px;
          font-weight: 500;
        }
        
        .notification-icon {
          margin-right: 10px;
          font-size: 18px;
        }
        
        .notification-body {
          padding: 20px;
          font-size: 16px;
          text-align: center;
        }
        
        .notification-footer {
          padding: 10px 20px;
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .notification-button {
          background-color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s, background-color 0.2s;
        }
        
        .notification-button:hover {
          transform: translateY(-2px);
          background-color: #f8f8f8;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default ProfileNotification;