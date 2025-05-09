//Component for viewing a user's CV
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { cvProfileService } from '../CVService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEdit, faDownload, faLock, faGlobe, faPhone, faEnvelope, 
    faMapMarkerAlt, faCalendarAlt, faBriefcase, faGraduationCap, 
    faCode, faLanguage, faCertificate, faBook, faLink, faArchive, faPlus
  } from '@fortawesome/free-solid-svg-icons';
import '../styles/CVProfileView.css';
import EmptyCVState from '../Pages/EmptyCVState';
import '../styles/EmptyCVState.css';

const CVProfileView = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  
  const [cvProfile, setCVProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const profileImage = cvProfile?.user?.profileImage || currentUser?.profileImage || '/path/to/default-image.svg';

  useEffect(() => {
    // Check if the user is authenticated
    const token = localStorage.getItem('token');
    console.log("Authentication token exists:", !!token);
    
    if (!token) {
      setError("You must be logged in to view or create a CV profile.");
      setIsLoading(false);
      return;
    }
  
    const fetchCVProfile = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error state
        let profileData;
  
        if (profileId) {
          console.log(`Fetching CV profile with ID: ${profileId}`);
          
          // First try to get it as a specific CV by ID
          try {
            // Try to get CV by ID (for viewing your own CVs from archive)
            profileData = await cvProfileService.getCVProfileById(profileId);
            console.log("Successfully fetched CV by ID:", profileId);
          } catch (idError) {
            console.log("Failed to get CV by ID, trying as public profile:", idError);
            
            // If that fails, try as a public profile (for viewing other users' CVs)
            try {
              profileData = await cvProfileService.getPublicCVProfile(profileId);
              console.log("Successfully fetched as public profile");
            } catch (pubError) {
              console.error("Failed to get as public profile:", pubError);
              throw pubError; // Re-throw to be caught by the outer catch
            }
          }
        } else {
          // Get current user's default profile
          console.log("Fetching default CV profile");
          profileData = await cvProfileService.getCurrentCVProfile();
        }
  
        // Check if profileData is null before proceeding
        if (!profileData) {
          setError("No CV profile found.");
          setCVProfile(null);
          setIsOwner(!profileId); // If no profileId, we're on the user's own page
          return;
        }
  
        // Rest of your code for setting userData and isOwner
        const user = profileData.user || {};
        setUserData({
          ...user,
          fullName: profileData.fullName || profileData.basicInfo?.fullName || user.fullName || user.username || currentUser?.fullName || currentUser?.username,
        });
  
        // Set is owner if viewing own profile
        setIsOwner(currentUser?._id === profileData.user?._id || !profileId);
        setCVProfile(profileData);
      } catch (err) {
        console.error("Error fetching CV profile:", err);
        
        if (err.response?.status === 404) {
          setError("No CV profile found. Create your first CV profile.");
        } else if (err.response?.status === 401) {
          setError("Authentication error. Please log in again.");
        } else {
          setError("Failed to load CV profile. Please try again later.");
        }
        
        setCVProfile(null);
        setIsOwner(!profileId); // If no profileId, we're on the user's own page
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCVProfile();
  }, [profileId, currentUser]);

  // Helper function to create a new CV profile
  const handleCreateCV = () => {
    navigate('/cv/edit');
  };

  // Helper function to format date
  const formatDate = (dateString, includeDay = false) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: includeDay ? 'numeric' : undefined
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  // Navigate to edit page
  const handleEdit = () => {
    navigate('/cv/edit');
  };

  // Download PDF
  const handleDownloadPDF = async (id) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Make a fetch request with authentication headers
    const response = await fetch(`http://localhost:3000/api/cv-profile/${id}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Open the PDF in a new tab
    window.open(url, '_blank');
    
    // Clean up by revoking the object URL
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  } catch (err) {
    console.error('Error generating PDF:', err);
    
  }
};

  const handleTogglePrivacy = async () => {
    try {
      if (!cvProfile?._id) {
        alert('CV profile not loaded yet');
        return;
      }
      
      // Show loading indicator
      setIsLoading(true);
      
      // Toggle the privacy status
      let updatedProfile;
      if (cvProfile.isPublic) {
        // Make CV private
        updatedProfile = await cvProfileService.makePrivate(cvProfile._id);
      } else {
        // Make CV public
        updatedProfile = await cvProfileService.makePublic(cvProfile._id);
      }
      
      // Update the profile state
      setCVProfile(updatedProfile);
      
      // Custom notification instead of alert
      showCustomNotification(updatedProfile.isPublic);
      
    } catch (err) {
      console.error('Privacy toggle error:', err);
      // Show error message in a nicer way
      showErrorNotification('Unable to update privacy settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Custom notification function
  const showCustomNotification = (isPublic) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    const icon = isPublic ? '🌎' : '🔒';
    const status = isPublic ? 'public' : 'private';
    const message = isPublic 
      ? 'Your CV is now public and can be viewed by others using your public profile link.' 
      : 'Your CV is now private and only visible to you.';
    
    notification.innerHTML = `
      <div class="notification-container">
        <div class="notification-icon">${icon}</div>
        <div class="notification-title">Success!</div>
        <div class="notification-message">${message}</div>
        <button class="notification-button">Got it</button>
      </div>
    `;
    
    // Style the notification (you can move this to your CSS file)
    const style = document.createElement('style');
    style.textContent = `
      .notification-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, ${cvProfile.theme?.primaryColor || '#4e54c8'}, ${cvProfile.theme?.secondaryColor || '#8f94fb'});
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        width: 350px;
        text-align: center;
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        animation: fadeIn 0.3s ease;
      }
      
      .notification-icon {
        font-size: 24px;
        margin-bottom: 15px;
      }
      
      .notification-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 10px;
      }
      
      .notification-message {
        font-size: 15px;
        line-height: 1.5;
        margin-bottom: 15px;
      }
      
      .notification-button {
        background-color: white;
        color: ${cvProfile.theme?.primaryColor || '#4e54c8'};
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      .notification-button:hover {
        transform: translateY(-2px);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Handle the close button
    const closeButton = notification.querySelector('.notification-button');
    closeButton.addEventListener('click', () => {
      notification.style.animation = 'fadeOut 0.3s ease forwards';
      
      // Add fade out animation
      const fadeOutStyle = document.createElement('style');
      fadeOutStyle.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; transform: translate(-50%, 0); }
          to { opacity: 0; transform: translate(-50%, -20px); }
        }
      `;
      document.head.appendChild(fadeOutStyle);
      
      // Remove notification after animation
      setTimeout(() => {
        document.body.removeChild(notification);
        document.head.removeChild(style);
        document.head.removeChild(fadeOutStyle);
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        closeButton.click();
      }
    }, 5000);
  };
  
  // Error notification
  const showErrorNotification = (message) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    notification.innerHTML = `
      <div class="notification-container error">
        <div class="notification-icon">⚠️</div>
        <div class="notification-title">Error</div>
        <div class="notification-message">${message}</div>
        <button class="notification-button">OK</button>
      </div>
    `;
    
    // Style the notification
    const style = document.createElement('style');
    style.textContent = `
      .notification-container.error {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #e53935, #e35d5b);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        width: 350px;
        text-align: center;
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        animation: fadeIn 0.3s ease;
      }
      
      .notification-icon {
        font-size: 24px;
        margin-bottom: 15px;
      }
      
      .notification-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 10px;
      }
      
      .notification-message {
        font-size: 15px;
        line-height: 1.5;
        margin-bottom: 15px;
      }
      
      .notification-button {
        background-color: white;
        color: #e53935;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      .notification-button:hover {
        transform: translateY(-2px);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Handle the close button
    const closeButton = notification.querySelector('.notification-button');
    closeButton.addEventListener('click', () => {
      notification.style.animation = 'fadeOut 0.3s ease forwards';
      
      // Add fade out animation
      const fadeOutStyle = document.createElement('style');
      fadeOutStyle.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; transform: translate(-50%, 0); }
          to { opacity: 0; transform: translate(-50%, -20px); }
        }
      `;
      document.head.appendChild(fadeOutStyle);
      
      // Remove notification after animation
      setTimeout(() => {
        document.body.removeChild(notification);
        document.head.removeChild(style);
        document.head.removeChild(fadeOutStyle);
      }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        closeButton.click();
      }
    }, 5000);
  };

  if (isLoading) {
    return <div className="cv-loading">Loading CV profile...</div>;
  }

  //If no CV then return this component
  if (!cvProfile) {
    return <EmptyCVState />;
  }

  if (error) {
    return (
      <div className="cv-error">
        <p>{error}</p>
        {isOwner && (
          <button onClick={handleCreateCV} className="cv-create-button">
            <FontAwesomeIcon icon={faPlus} /> Create Your CV Profile
          </button>
        )}
      </div>
    );
  }

  // Helper function to get value from nested or flat structure
  const getValue = (fieldName, nestedPath, defaultValue = '') => {
    // Try flat structure first
    if (cvProfile[fieldName] !== undefined) {
      return cvProfile[fieldName];
    }
    
    // Then try nested structure
    if (nestedPath) {
      const parts = nestedPath.split('.');
      let current = cvProfile;
      
      for (const part of parts) {
        if (!current || current[part] === undefined) {
          return defaultValue;
        }
        current = current[part];
      }
      
      return current;
    }
    
    return defaultValue;
  };

  // Determine which sections to show based on display options
  const { hiddenSections = [], sectionsOrder = [] } = cvProfile.displayOptions || {};
  
  // Apply theme styles
  const themeStyle = {
    '--primary-color': cvProfile.theme?.primaryColor || '#4e54c8',
    '--secondary-color': cvProfile.theme?.secondaryColor || '#8f94fb',
    '--font-family': cvProfile.theme?.fontFamily || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  };

  // Get profile name from either flat or nested structure
  const profileName = userData?.fullName || cvProfile.fullName || cvProfile.basicInfo?.fullName || userData?.username || 'CV Profile';
  
  // Get headline from either flat or nested structure
  const headline = cvProfile.headline || cvProfile.basicInfo?.headline || '';
  
  // Get summary from either flat or nested structure
  const summary = cvProfile.summary || cvProfile.basicInfo?.bio || '';

  return (
<div className={`cv-profile-view cv-layout-${cvProfile.theme?.layout || 'standard'}`} style={themeStyle}>
  <div className="cv-view-header">
    <div className="cv-view-controls">
      {isOwner && (
        <>
          <button
            className="cv-edit-button"
            onClick={handleEdit}
            title="Edit CV Profile"
          >
            <FontAwesomeIcon icon={faEdit} /> Edit CV
          </button>
          
          <button
            className="cv-privacy-button"
            onClick={handleTogglePrivacy}
            title={`Make CV ${cvProfile.isPublic ? 'private' : 'public'}`}
          >
            <FontAwesomeIcon icon={cvProfile.isPublic ? faGlobe : faLock} />
            {cvProfile.isPublic ? ' Public CV' : ' Private CV'}
          </button>
          
          <Link 
            to="/cv/archive" 
            className="cv-archive-button"
            title="Manage CV Archive"
          >
            <FontAwesomeIcon icon={faArchive} /> CV Archive
          </Link>
        </>
      )}
<button className="cv-pdf-button" onClick={() => handleDownloadPDF(cvProfile._id)}>
  <FontAwesomeIcon icon={faDownload} /> Download PDF
</button>
    </div>
  </div>

      <div className="cv-header-section">
      {userData && cvProfile.displayOptions?.showProfileImage && (
  <div className="profile-image-container">
  <img
    src={profileImage}
    alt={cvProfile?.fullName || currentUser?.fullName || 'Profile'}
    onError={(e) => {
      console.log('Profile image failed to load, using default');
      e.target.src = '/path/to/default-image.svg';
    }}
    className="profile-image"
  />
</div>
)}
        
        <div className="cv-header-info">
          <h1>{profileName}</h1>
          
          {headline && (
            <h2 className="cv-headline">{headline}</h2>
          )}
          
          {cvProfile.displayOptions?.showContact && cvProfile.contact && (
            <div className="cv-contact-info">
              {cvProfile.contact.email && (
                <div className="cv-contact-item">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <a href={`mailto:${cvProfile.contact.email}`}>{cvProfile.contact.email}</a>
                </div>
              )}
              
              {cvProfile.contact.phone && (
                <div className="cv-contact-item">
                  <FontAwesomeIcon icon={faPhone} />
                  <a href={`tel:${cvProfile.contact.phone}`}>{cvProfile.contact.phone}</a>
                </div>
              )}
              
              {cvProfile.contact.location && (
                <div className="cv-contact-item">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span>{cvProfile.contact.location}</span>
                </div>
              )}
              
              {cvProfile.contact.website && (
                <div className="cv-contact-item">
                  <FontAwesomeIcon icon={faLink} />
                  <a href={cvProfile.contact.website} target="_blank" rel="noopener noreferrer">
                    {cvProfile.contact.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
            </div>
          )}
          
          {isOwner && (
            <div className="cv-edit-link">
              <Link to="/cv/edit" className="cv-edit-button-link">
                <FontAwesomeIcon icon={faEdit} /> Edit your CV Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="cv-content">
        {/* Summary Section */}
        {!hiddenSections.includes('summary') && summary && (
          <div className="cv-section cv-summary">
            <h3>Professional Summary</h3>
            <p>{summary}</p>
          </div>
        )}
        
        {/* Work Experience Section */}
        {!hiddenSections.includes('workExperience') && (
          <div className="cv-section cv-experience">
            <h3><FontAwesomeIcon icon={faBriefcase} /> Work Experience</h3>
            
            {/* Support both workExperience (new) and experience (old) arrays */}
            {(cvProfile.workExperience || cvProfile.experience || []).map((job, index) => (
              <div key={index} className="cv-item">
                <div className="cv-item-header">
                  <h4>{job.title || job.position}</h4>
                  <div className="cv-item-subheader">
                    <div className="cv-item-company">{job.company}</div>
                    {job.location && <div className="cv-item-location">{job.location}</div>}
                  </div>
                  
                  <div className="cv-item-date">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    {job.startDate ? formatDate(job.startDate) : ''} — 
                    {job.current ? ' Present' : (job.endDate ? ` ${formatDate(job.endDate)}` : '')}
                  </div>
                </div>
                
                {job.description && (
                  <p className="cv-item-description">{job.description}</p>
                )}
                
                {job.highlights && job.highlights.length > 0 && (
                  <div className="cv-highlights">
                    <h5>Key Achievements</h5>
                    <ul>
                      {job.highlights.map((highlight, hIndex) => (
                        <li key={hIndex}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {job.technologies && job.technologies.length > 0 && (
                  <div className="cv-technologies">
                    <h5>Technologies Used</h5>
                    <div className="cv-tag-list">
                      {job.technologies.map((tech, tIndex) => (
                        <span key={tIndex} className="cv-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Education Section */}
        {!hiddenSections.includes('education') && cvProfile.education && cvProfile.education.length > 0 && (
          <div className="cv-section cv-education">
            <h3><FontAwesomeIcon icon={faGraduationCap} /> Education</h3>
            
            {cvProfile.education.map((edu, index) => (
              <div key={index} className="cv-item">
                <div className="cv-item-header">
                  <h4>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h4>
                  <div className="cv-item-institution">{edu.institution}</div>
                  
                  <div className="cv-item-date">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    {edu.startYear || ''} — {edu.current ? 'Present' : (edu.endYear || '')}
                  </div>
                </div>
                
                {edu.description && (
                  <p className="cv-item-description">{edu.description}</p>
                )}
                
                {edu.achievements && edu.achievements.length > 0 && (
                  <div className="cv-achievements">
                    <h5>Achievements</h5>
                    <ul>
                      {edu.achievements.map((achievement, aIndex) => (
                        <li key={aIndex}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Skills Section */}
        {!hiddenSections.includes('skills') && cvProfile.skills && cvProfile.skills.length > 0 && (
          <div className="cv-section cv-skills">
            <h3><FontAwesomeIcon icon={faCode} /> Professional Skills</h3>
            
            <div className="cv-skills-grid">
              {cvProfile.skills.map((skill, index) => (
                <div key={index} className="cv-skill-item">
                  <div className="cv-skill-info">
                    <div className="cv-skill-name">{skill.name}</div>
                    <div className="cv-skill-level">{skill.level}</div>
                  </div>
                  
                  <div className="cv-skill-bar">
                    <div 
                      className="cv-skill-progress" 
                      style={{ 
                        width: skill.level === 'Beginner' ? '25%' : 
                               skill.level === 'Intermediate' ? '50%' : 
                               skill.level === 'Advanced' ? '75%' : '100%' 
                      }}
                    ></div>
                  </div>
                  
                  {skill.yearsOfExperience && (
                    <div className="cv-skill-years">
                      {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'} experience
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Languages Section */}
        {!hiddenSections.includes('languages') && cvProfile.languages && cvProfile.languages.length > 0 && (
          <div className="cv-section cv-languages">
            <h3><FontAwesomeIcon icon={faLanguage} /> Languages</h3>
            
            <div className="cv-languages-grid">
              {cvProfile.languages.map((language, index) => (
                <div key={index} className="cv-language-item">
                  <div className="cv-language-name">{language.name}</div>
                  <div className="cv-language-proficiency">{language.proficiency}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Projects Section */}
        {!hiddenSections.includes('projects') && cvProfile.projects && cvProfile.projects.length > 0 && (
          <div className="cv-section cv-projects">
            <h3><FontAwesomeIcon icon={faCode} /> Projects</h3>
            
            {cvProfile.projects.map((project, index) => (
              <div key={index} className="cv-item">
                <div className="cv-item-header">
                  <h4>{project.title}</h4>
                  
                  {(project.url || project.repositoryUrl) && (
                    <div className="cv-project-links">
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="cv-project-link">
                          <FontAwesomeIcon icon={faGlobe} /> Live Demo
                        </a>
                      )}
                      
                      {project.repositoryUrl && (
                        <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="cv-project-link">
                          <FontAwesomeIcon icon={faCode} /> Repository
                        </a>
                      )}
                    </div>
                  )}
                  
                  {(project.startDate || project.endDate) && (
                    <div className="cv-item-date">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      {project.startDate ? formatDate(project.startDate) : ''} — 
                      {project.current ? ' Present' : (project.endDate ? ` ${formatDate(project.endDate)}` : '')}
                    </div>
                  )}
                </div>
                
                {project.description && (
                  <p className="cv-item-description">{project.description}</p>
                )}
                
                {project.technologies && project.technologies.length > 0 && (
                  <div className="cv-technologies">
                    <h5>Technologies Used</h5>
                    <div className="cv-tag-list">
                      {project.technologies.map((tech, tIndex) => (
                        <span key={tIndex} className="cv-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {project.highlights && project.highlights.length > 0 && (
                  <div className="cv-highlights">
                    <h5>Key Features</h5>
                    <ul>
                      {project.highlights.map((highlight, hIndex) => (
                        <li key={hIndex}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Certifications Section */}
        {!hiddenSections.includes('certifications') && cvProfile.certifications && cvProfile.certifications.length > 0 && (
          <div className="cv-section cv-certifications">
            <h3><FontAwesomeIcon icon={faCertificate} /> Certifications</h3>
            
            <div className="cv-certifications-grid">
              {cvProfile.certifications.map((cert, index) => (
                <div key={index} className="cv-certification-item">
                  <div className="cv-certification-header">
                    <h4>{cert.name}</h4>
                    {cert.issuer && <div className="cv-certification-issuer">{cert.issuer}</div>}
                  </div>
                  
                  <div className="cv-certification-details">
                    {cert.date && (
                      <div className="cv-certification-date">
                        <FontAwesomeIcon icon={faCalendarAlt} /> Issued: {formatDate(cert.date, true)}
                      </div>
                    )}
                    
                    {cert.hasExpiry && cert.expires && (
                      <div className="cv-certification-expiry">
                        <FontAwesomeIcon icon={faCalendarAlt} /> Expires: {formatDate(cert.expires, true)}
                      </div>
                    )}
                    
                    {cert.credentialId && (
                      <div className="cv-certification-id">
                        Credential ID: {cert.credentialId}
                      </div>
                    )}
                    
                    {cert.credentialURL && (
                      <a 
                        href={cert.credentialURL} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="cv-certification-verify"
                      >
                        Verify Certificate
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Publications Section */}
        {!hiddenSections.includes('publications') && cvProfile.publications && cvProfile.publications.length > 0 && (
          <div className="cv-section cv-publications">
            <h3><FontAwesomeIcon icon={faBook} /> Publications</h3>
            
            {cvProfile.publications.map((pub, index) => (
              <div key={index} className="cv-item">
                <div className="cv-item-header">
                  <h4>{pub.title}</h4>
                  
                  <div className="cv-item-subheader">
                    {pub.publisher && <div className="cv-publication-publisher">{pub.publisher}</div>}
                    
                    {pub.date && (
                      <div className="cv-item-date">
                        <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(pub.date, true)}
                      </div>
                    )}
                  </div>
                </div>
                
                {pub.description && (
                  <p className="cv-item-description">{pub.description}</p>
                )}
                
                {pub.url && (
                  <a 
                    href={pub.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="cv-publication-link"
                  >
                    Read Publication
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Custom Sections */}
        {cvProfile.customSections && cvProfile.customSections.map((section, secIndex) => (
          !hiddenSections.includes(`customSection-${secIndex}`) && section.items && section.items.length > 0 && (
            <div key={secIndex} className="cv-section cv-custom-section">
              <h3>{section.title}</h3>
              
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="cv-item">
                  <div className="cv-item-header">
                    <h4>{item.title}</h4>
                    
                    <div className="cv-item-subheader">
                      {item.subtitle && <div className="cv-item-subtitle">{item.subtitle}</div>}
                      
                      {item.date && (
                        <div className="cv-item-date">
                          <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(item.date, true)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="cv-item-description">{item.description}</p>
                  )}
                  
                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="cv-item-link"
                    >
                      Learn More
                    </a>
                  )}
                </div>
              ))}
            </div>
          )
        ))}
      </div>
      
      <div className="cv-footer">
        <p>Last updated: {cvProfile.lastUpdated ? new Date(cvProfile.lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()}</p>
        
        {isOwner && (
          <div className="cv-footer-actions">
            <Link to="/cv/edit" className="cv-footer-edit-link">
              <FontAwesomeIcon icon={faEdit} /> Edit CV Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVProfileView;