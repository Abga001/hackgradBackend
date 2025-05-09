// EmptyCVState.js - A user-friendly component to display when no CV exists
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,faFileAlt, faLightbulb, faCheckCircle, 
  faUserTie, faShareAlt
} from '@fortawesome/free-solid-svg-icons';

const EmptyCVState = () => {
  const navigate = useNavigate();

  const handleCreateCV = () => {
    navigate('/cv/edit');
  };

  return (
    <div className="cv-empty-state-container">
      <div className="cv-empty-state-content">
        <img 
          src="/images/cv-illustration.svg" 
          alt="Empty CV illustration" 
          className="cv-empty-illustration"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-avatar.png';
          }}
        />
        
        <h2>Your CV Journey Begins Here</h2>
        
        <p className="cv-empty-description">
          Create your professional CV to showcase your skills, experience, and achievements to 
          potential employers and the developer community.
        </p>
        
        <div className="cv-empty-actions">
          <button 
            onClick={handleCreateCV}
            className="cv-create-button primary"
          >
            <FontAwesomeIcon icon={faPlus} /> Create Your First CV
          </button>
          
          <div className="cv-empty-options">
            <div className="cv-empty-option">
              <div className="cv-option-icon">
                <FontAwesomeIcon icon={faFileAlt} />
              </div>
              <div className="cv-option-content">
                <h3>CV Templates</h3>
                <p>Choose from professionally designed templates</p>
              </div>
            </div>
            
            <div className="cv-empty-option">
              <div className="cv-option-icon">
                <FontAwesomeIcon icon={faLightbulb} />
              </div>
              <div className="cv-option-content">
                <h3>CV Guidelines</h3>
                <p>Tips for creating an effective resume</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="cv-empty-benefits">
          <h3>Why Create a Professional CV?</h3>
          <div className="cv-benefits-list">
            <div className="cv-benefit-item">
              <FontAwesomeIcon icon={faCheckCircle} className="cv-benefit-icon" />
              <p>Showcase your skills and experience</p>
            </div>
            <div className="cv-benefit-item">
              <FontAwesomeIcon icon={faUserTie} className="cv-benefit-icon" />
              <p>Stand out to potential employers</p>
            </div>
            <div className="cv-benefit-item">
              <FontAwesomeIcon icon={faShareAlt} className="cv-benefit-icon" />
              <p>Share your accomplishments with the community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyCVState;