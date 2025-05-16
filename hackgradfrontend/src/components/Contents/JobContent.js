// JobContent.js - Enhanced social media style Job content component
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ContentStyles/ContentPage.css';
import '../../styles/ContentStyles/JobContent.css';
import ImageDisplay from '../ImageDisplay';
import ContentInteractions from '../Contents/ContentInteractions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBriefcase, faMapMarkerAlt, faBuilding, faDollarSign, 
  faEnvelope, faExternalLinkAlt, faListUl, faCalendarAlt,
  faClock, faGraduationCap, faUserTie, faToolbox, faTag,
  faCheck, faInfoCircle, faGlobe, faHistory
} from '@fortawesome/free-solid-svg-icons';

const JobContent = ({ 
  content, 
  currentUser, 
  onEdit, 
  onDelete,
  onLike,
  onSave,
  onRepost,
  onComment,
  onShare,
  onToggleComments,
  showComments,
  isSubmitting,
  error
}) => {
  // Extract job-specific fields
  const extraFields = content.extraFields || {};
  
  // Basic job information
  const company = extraFields.company || '';
  const location = extraFields.location || '';
  const locationType = extraFields.locationType || '';
  const type = extraFields.type || '';
  
  // Contract details
  const contractLength = extraFields.contractLength || '';
  const workingHours = extraFields.workingHours || '';
  const startDate = extraFields.startDate || '';
  const specificStartDate = extraFields.specificStartDate || '';
  
  // Job details
  const description = extraFields.description || '';
  const requirements = extraFields.requirements || '';
  const experienceLevel = extraFields.experienceLevel || '';
  const minimumExperience = extraFields.minimumExperience || '';
  const educationRequirements = extraFields.educationRequirements || '';
  const department = extraFields.department || '';
  
  // Compensation
  const salary = extraFields.salary || '';
  const salaryRange = extraFields.salaryRange || { min: '', max: '' };
  const salaryCurrency = extraFields.salaryCurrency || 'GBP';
  const salaryFrequency = extraFields.salaryFrequency || '';
  
  // Company information
  const companyDescription = extraFields.companyDescription || '';
  const companySize = extraFields.companySize || '';
  const companyIndustry = extraFields.companyIndustry || '';
  const companyWebsite = extraFields.companyWebsite || '';
  const yearEstablished = extraFields.yearEstablished || '';
  
  // Application information
  const contactEmail = extraFields.contactEmail || '';
  const applicationUrl = extraFields.applicationUrl || '';
  const applicationDeadline = extraFields.applicationDeadline || '';
  const applicationInstructions = extraFields.applicationInstructions || '';
  const referenceNumber = extraFields.referenceNumber || '';
  
  // Benefits & Tags
  const benefits = Array.isArray(extraFields.benefits) ? extraFields.benefits : [];
  const skillsTags = Array.isArray(extraFields.skillsTags) ? extraFields.skillsTags : [];
  const keywordTags = Array.isArray(extraFields.keywordTags) ? extraFields.keywordTags : [];
  
  // Performance metrics
  const views = extraFields.views || 0;
  const applicants = extraFields.applicants || 0;
  const status = extraFields.status || 'Open';
  const featured = extraFields.featured || false;

  // Get title and image
  const title = content.title || extraFields.title || extraFields.jobTitle || 'Untitled Job';
  const image = content.image || extraFields.image || '/default-content.gif';

  // Author info
  const authorName = content.authorName || content.username || "Unknown User";
  const authorAvatar = content.authorAvatar || content.profileImage || "/default-avatar.png";
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency
  const formatCurrency = (currency) => {
    switch (currency) {
      case 'GBP': return '£';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return '';
    }
  };

  // Check if current user is the owner
  const isOwner = () => {
    if (!content || !currentUser) return false;
    return content.userId === currentUser._id;
  };

  // Get appropriate status color
  const getStatusColor = () => {
    switch (status) {
      case 'Open': return 'status-open';
      case 'Closed': return 'status-closed';
      case 'Filled': return 'status-filled';
      default: return '';
    }
  };

  return (
    <div className="social-card job-content-card">
      {/* Author Header */}
      <div className="card-header">
        <div className="author-info">
          <Link to={`/profile/${content.userId}`} className="author-avatar">
            <img 
              src={authorAvatar} 
              alt={authorName}
              onError={(e) => { e.target.src = "/default-avatar.png" }}
            />
          </Link>
          <div className="author-meta">
            <Link to={`/profile/${content.userId}`} className="author-name">
              {authorName}
            </Link>
            <div className="post-meta">
              <span className="post-date">{formatDate(content.createdAt)}</span>
              <span className="post-visibility">{content.visibility || 'Public'}</span>
              {status && <span className={`job-status ${getStatusColor()}`}>{status}</span>}
            </div>
          </div>
        </div>
        {isOwner() && (
          <div className="post-actions">
            <button className="action-menu-button">⋯</button>
            <div className="action-menu-dropdown">
              <button onClick={onEdit}>Edit</button>
              <button onClick={onDelete}>Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* Job Title */}
      <h2 className="post-title">{title}</h2>

      {/* Job Header Card */}
      <div className="job-header-card">
        {company && (
          <div className="company-info">
            {image && image !== '/default-content.gif' && (
              <div className="company-logo">
                <ImageDisplay 
                  src={image}
                  alt={company}
                  onError={(e) => {
                    console.log("Image failed to load:", e.target.src);
                    e.target.src = "/default-content.gif";
                  }}
                />
              </div>
            )}
            <div className="company-name">
              <FontAwesomeIcon icon={faBuilding} />
              <span>{company}</span>
            </div>
          </div>
        )}
        
        <div className="job-quick-info">
          {type && (
            <div className="job-badge job-type-badge">
              <FontAwesomeIcon icon={faBriefcase} />
              <span>{type}</span>
            </div>
          )}
          
          {location && (
            <div className="job-badge job-location-badge">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{location}</span>
              {locationType && <span className="location-type">({locationType})</span>}
            </div>
          )}
          
          {salary && (
            <div className="job-badge job-salary-badge">
              <FontAwesomeIcon icon={faDollarSign} />
              <span>{salary}</span>
            </div>
          )}
          
          {experienceLevel && (
            <div className="job-badge job-exp-badge">
              <FontAwesomeIcon icon={faUserTie} />
              <span>{experienceLevel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Job Details Grid */}
      <div className="job-details-grid">
        {department && (
          <div className="job-detail-item">
            <div className="detail-icon">
              <FontAwesomeIcon icon={faBriefcase} />
            </div>
            <div className="detail-content">
              <h4>Department</h4>
              <p>{department}</p>
            </div>
          </div>
        )}
        
        {contractLength && (
          <div className="job-detail-item">
            <div className="detail-icon">
              <FontAwesomeIcon icon={faHistory} />
            </div>
            <div className="detail-content">
              <h4>Contract Length</h4>
              <p>{contractLength}</p>
            </div>
          </div>
        )}
        
        {workingHours && (
          <div className="job-detail-item">
            <div className="detail-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="detail-content">
              <h4>Working Hours</h4>
              <p>{workingHours}</p>
            </div>
          </div>
        )}
        
        {startDate && (
          <div className="job-detail-item">
            <div className="detail-icon">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="detail-content">
              <h4>Start Date</h4>
              <p>{startDate === 'ASAP' ? 'As Soon As Possible' : formatDate(specificStartDate)}</p>
            </div>
          </div>
        )}
        
        {educationRequirements && (
          <div className="job-detail-item">
            <div className="detail-icon">
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div className="detail-content">
              <h4>Education</h4>
              <p>{educationRequirements}</p>
            </div>
          </div>
        )}
        
        {minimumExperience && (
          <div className="job-detail-item">
            <div className="detail-icon">
              <FontAwesomeIcon icon={faUserTie} />
            </div>
            <div className="detail-content">
              <h4>Experience</h4>
              <p>{minimumExperience} years minimum</p>
            </div>
          </div>
        )}
        
        {referenceNumber && (
          <div className="job-detail-item">
            <div className="detail-icon">
              <FontAwesomeIcon icon={faTag} />
            </div>
            <div className="detail-content">
              <h4>Reference</h4>
              <p>{referenceNumber}</p>
            </div>
          </div>
        )}
        
        {applicationDeadline && (
          <div className="job-detail-item">
            <div className="detail-icon">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="detail-content">
              <h4>Apply Before</h4>
              <p>{formatDate(applicationDeadline)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Salary Information */}
      {(salaryRange?.min || salaryRange?.max) && (
        <div className="job-salary-details">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faDollarSign} className="section-icon" />
            Compensation Details
          </h3>
          <div className="salary-range">
            {salaryRange.min && salaryRange.max ? (
              <p>
                <strong>Salary Range:</strong> {formatCurrency(salaryCurrency)}{salaryRange.min.toLocaleString()} - 
                {formatCurrency(salaryCurrency)}{salaryRange.max.toLocaleString()} {salaryFrequency}
              </p>
            ) : salaryRange.min ? (
              <p>
                <strong>From:</strong> {formatCurrency(salaryCurrency)}{salaryRange.min.toLocaleString()} {salaryFrequency}
              </p>
            ) : (
              <p>
                <strong>Up to:</strong> {formatCurrency(salaryCurrency)}{salaryRange.max.toLocaleString()} {salaryFrequency}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Job Description */}
      {description && (
        <div className="post-description">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faBriefcase} className="section-icon" />
            Job Description
          </h3>
          <div className="formatted-text job-description-text">{description}</div>
        </div>
      )}

      {/* Requirements */}
      {requirements && (
        <div className="post-description">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faListUl} className="section-icon" />
            Requirements
          </h3>
          <div className="formatted-text job-requirements-text">{requirements}</div>
        </div>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <div className="job-benefits">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faCheck} className="section-icon" />
            Benefits
          </h3>
          <ul className="benefits-list">
            {benefits.map((benefit, index) => (
              <li key={index} className="benefit-item">
                <FontAwesomeIcon icon={faCheck} className="benefit-icon" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      {skillsTags.length > 0 && (
        <div className="job-skills">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faToolbox} className="section-icon" />
            Required Skills
          </h3>
          <div className="skill-tags">
            {skillsTags.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Company Information */}
      {(companyDescription || companySize || companyIndustry || companyWebsite || yearEstablished) && (
        <div className="company-details">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faBuilding} className="section-icon" />
            About the Company
          </h3>
          
          {companyDescription && (
            <div className="company-description">
              <p>{companyDescription}</p>
            </div>
          )}
          
          <div className="company-meta-details">
            {companyIndustry && (
              <div className="company-meta-item">
                <strong>Industry:</strong> {companyIndustry}
              </div>
            )}
            
            {companySize && (
              <div className="company-meta-item">
                <strong>Size:</strong> {companySize} employees
              </div>
            )}
            
            {yearEstablished && (
              <div className="company-meta-item">
                <strong>Established:</strong> {yearEstablished}
              </div>
            )}
            
            {companyWebsite && (
              <div className="company-meta-item">
                <strong>Website:</strong> <a href={companyWebsite} target="_blank" rel="noopener noreferrer">{companyWebsite}</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Instructions */}
      {applicationInstructions && (
        <div className="application-instructions">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faInfoCircle} className="section-icon" />
            Application Instructions
          </h3>
          <div className="instructions-text">
            {applicationInstructions}
          </div>
        </div>
      )}

      {/* Application Buttons */}
      <div className="job-application-buttons">
        {applicationUrl && (
          <a 
            href={applicationUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="apply-button"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
            Apply for this Position
          </a>
        )}
        
        {contactEmail && (
          <a 
            href={`mailto:${contactEmail}`} 
            className="contact-button"
          >
            <FontAwesomeIcon icon={faEnvelope} />
            Contact via Email
          </a>
        )}
      </div>

      {/* Common Interactions Component */}
      <ContentInteractions
        content={content}
        currentUser={currentUser}
        onLike={onLike}
        onSave={onSave}
        onRepost={onRepost}
        onComment={onComment}
        onShare={onShare}
        onToggleComments={onToggleComments}
        isSubmitting={isSubmitting}
        showComments={showComments}
      />
    </div>
  );
};

export default JobContent;