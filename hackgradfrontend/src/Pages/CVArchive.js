import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faCopy, 
  faCheck, faEye, faLock, faDownload, faArchive
} from '@fortawesome/free-solid-svg-icons';
import '../styles/CVArchive.css';

const CVArchive = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  
  // State management
  const [cvProfiles, setCVProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCVTitle, setNewCVTitle] = useState('My CV');
  const [cvArchive, setCVArchive] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  
  // Fetch CV profiles when component mounts
  useEffect(() => {
    fetchCVProfiles();
  }, []);
  
  // Function to fetch all CV profiles
  const fetchCVProfiles = async () => {
    try {
      setIsLoading(true);
      
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Make API request to get all CV profiles
      const response = await axios.get('http://localhost:3000/api/cv-profile/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('CV Profiles:', response.data);
      setCVProfiles(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching CV profiles:', err);
      setError('Failed to load your CV profiles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to create a new CV profile
// Function to create a new CV profile
const handleCreateCV = async () => {
  try {
    // Check if maximum number of CVs reached
    if (cvArchive.length >= 5) { // Make sure you're using cvArchive instead of cvProfiles
      showNotification('Maximum number of CVs reached (5). Please delete an existing CV first.', 'error');
      return;
    }
   
    // Get token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
   
    // Create the request payload
    const payload = {
      title: newCVTitle
    };
    console.log('Creating CV with payload:', payload);
   
    // Create new CV profile
    const response = await axios.post('http://localhost:3000/api/cv-profile/', payload, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
   
    console.log('CV created successfully:', response.data);
    
    // Update the CV Archive state
    setCVArchive(prevArchive => [...prevArchive, response.data]);
    
    // Close the modal
    setCreateModalOpen(false);
    
    // Reset the form
    setNewCVTitle('My CV');
    
    // Show success notification
    showNotification('New CV profile created successfully!', 'success');
    
    // Navigate to the edit page
    navigate(`/cv/edit/${response.data._id}`);
   
  } catch (err) {
    console.error('Error creating CV profile:', err);
    if (err.response) {
      console.error('Server response:', err.response.data);
      console.error('Status code:', err.response.status);
    }
    showNotification('Failed to create CV profile. Please try again.', 'error');
  }
};
  
  // Function to set a CV as default
  const handleSetDefault = async (id) => {
    try {
      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Set CV as default
      await axios.put(`http://localhost:3000/api/cv-profile/default/${id}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update CV profiles in state
      setCVProfiles(cvProfiles.map(cv => ({
        ...cv,
        isDefault: cv._id === id
      })));
      
      // Show success notification
      showNotification('Default CV updated successfully!');
    } catch (err) {
      console.error('Error setting default CV:', err);
      showNotification('Failed to set default CV. Please try again.', 'error');
    }
  };
  
  // Function to duplicate a CV profile
  const handleDuplicateCV = async (id) => {
    try {
      // Check if maximum number of CVs reached
      if (cvProfiles.length >= 5) {
        showNotification('Maximum number of CVs reached (5). Please delete an existing CV first.', 'error');
        return;
      }
      
      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Duplicate CV profile
      const response = await axios.post(`http://localhost:3000/api/cv-profile/duplicate/${id}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Add duplicated CV to state
      setCVProfiles([...cvProfiles, response.data]);
      
      // Show success notification
      showNotification('CV profile duplicated successfully!');
    } catch (err) {
      console.error('Error duplicating CV profile:', err);
      showNotification('Failed to duplicate CV profile. Please try again.', 'error');
    }
  };
  
  // Function to toggle CV privacy (public/private)
  const handleTogglePrivacy = async (id, isCurrentlyPublic) => {
    try {
      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Determine which endpoint to use based on current state
      const endpoint = isCurrentlyPublic ? 'private' : 'public';
      
      // Toggle privacy
      const response = await axios.put(`http://localhost:3000/api/cv-profile/${endpoint}/${id}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update CV in state
      setCVProfiles(cvProfiles.map(cv => 
        cv._id === id ? { ...cv, isPublic: !isCurrentlyPublic } : cv
      ));
      
      // Show success notification
      const message = isCurrentlyPublic 
        ? 'CV profile is now private.' 
        : 'CV profile is now public and can be viewed by others.';
      showNotification(message);
    } catch (err) {
      console.error('Error toggling CV privacy:', err);
      showNotification('Failed to update CV privacy. Please try again.', 'error');
    }
  };
  
  // Function to delete a CV profile
  const handleDeleteCV = async (id) => {
    try {
      // Check if this is the only CV
      if (cvProfiles.length === 1) {
        showNotification('Cannot delete your only CV profile. Create another one first.', 'error');
        return;
      }
      
      // Check if this is the default CV
      const isDefault = cvProfiles.find(cv => cv._id === id)?.isDefault;
      if (isDefault) {
        showNotification('Cannot delete your default CV. Set another CV as default first.', 'error');
        return;
      }
      
      // Confirm deletion
      if (!window.confirm('Are you sure you want to delete this CV profile? This action cannot be undone.')) {
        return;
      }
      
      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Delete CV profile
      await axios.delete(`http://localhost:3000/api/cv-profile/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove CV from state
      setCVProfiles(cvProfiles.filter(cv => cv._id !== id));
      
      // Show success notification
      showNotification('CV profile deleted successfully!');
    } catch (err) {
      console.error('Error deleting CV profile:', err);
      showNotification('Failed to delete CV profile. Please try again.', 'error');
    }
  };
  
  // Function to generate and download PDF
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
      showNotification('Failed to generate PDF. Please try again.', 'error');
    }
  };
  
  // Function to show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification({ ...notification, show: false });
    }, 5000);
  };
  
  // Function to edit a CV profile
  const handleEditCV = (id) => {
    navigate(`/cv/edit/${id}`);
  };
  
  // Function to view a CV profile
  const handleViewCV = (id) => {
    navigate(`/cv/${id}`);
  };

  // Toggle dropdown
const toggleDropdown = (id) => {
  setDropdownOpen(dropdownOpen === id ? null : id);
};
  
  // Loading state
  if (isLoading) {
    return (
      <div className="cv-archive-loading">
        <div className="spinner"></div>
        <p>Loading your CV profiles...</p>
      </div>
    );
  }
  
  return (
    <div className="cv-archive-container">
      {/* Header */}
      <div className="cv-archive-header">
        <div className="cv-header-title">
          <h1><FontAwesomeIcon icon={faArchive} /> CV Archive</h1>
          <p>Manage your professional CV profiles (max 5)</p>
        </div>
        
        <button 
          className="cv-create-button"
          onClick={() => setCreateModalOpen(true)}
          disabled={cvProfiles.length >= 5}
        >
          <FontAwesomeIcon icon={faPlus} /> Create New CV
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="cv-error-message">
          <p>{error}</p>
          <button onClick={fetchCVProfiles}>Try Again</button>
        </div>
      )}
      
      {/* CV Profiles Grid */}
      <div className="cv-profiles-grid">
        {cvProfiles.length > 0 ? (
          cvProfiles.map(cv => (
            <div key={cv._id} className={`cv-profile-card ${cv.isDefault ? 'default' : ''}`}>
              <div className="cv-card-header">
                <h3>{cv.title || 'My CV'}</h3>
                {cv.isDefault && (
                  <span className="cv-default-badge">
                    <FontAwesomeIcon icon={faCheck} /> Default
                  </span>
                )}
                <span className={`cv-privacy-badge ${cv.isPublic ? 'public' : 'private'}`}>
                  <FontAwesomeIcon icon={cv.isPublic ? faEye : faLock} />
                  {cv.isPublic ? ' Public' : ' Private'}
                </span>
              </div>
              
              <div className="cv-card-body">
                <p className="cv-card-name">{cv.fullName || currentUser?.fullName || currentUser?.username}</p>
                {cv.headline && <p className="cv-card-headline">{cv.headline}</p>}
                <p className="cv-card-date">Last updated: {new Date(cv.updatedAt || cv.lastUpdated || Date.now()).toLocaleDateString()}</p>
                
                <div className="cv-card-stats">
                  <div className="cv-stat">
                    <span className="cv-stat-label">Skills</span>
                    <span className="cv-stat-value">{cv.skills?.length || 0}</span>
                  </div>
                  <div className="cv-stat">
                    <span className="cv-stat-label">Experience</span>
                    <span className="cv-stat-value">{cv.workExperience?.length || 0}</span>
                  </div>
                  <div className="cv-stat">
                    <span className="cv-stat-label">Education</span>
                    <span className="cv-stat-value">{cv.education?.length || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="cv-card-actions">
  <div className="cv-primary-actions">
    <button 
      className="cv-action-button primary"
      onClick={() => handleViewCV(cv._id)}
      title="View CV"
    >
      <FontAwesomeIcon icon={faEye} /> View
    </button>
    
    <button 
      className="cv-action-button"
      onClick={() => handleEditCV(cv._id)}
      title="Edit CV"
    >
      <FontAwesomeIcon icon={faEdit} /> Edit
    </button>
    
    <button 
      className="cv-action-button"
      onClick={() => handleDownloadPDF(cv._id)}
      title="Download as PDF"
    >
      <FontAwesomeIcon icon={faDownload} /> PDF
    </button>
  </div>
  
  <div className="cv-secondary-actions">
    <button 
      onClick={() => handleTogglePrivacy(cv._id, cv.isPublic)}
      className="cv-secondary-button"
      title={cv.isPublic ? "Make Private" : "Make Public"}
    >
      <FontAwesomeIcon icon={cv.isPublic ? faLock : faEye} />
      {cv.isPublic ? ' Make Private' : ' Make Public'}
    </button>
    
    <button 
      onClick={() => handleDuplicateCV(cv._id)}
      className="cv-secondary-button"
      disabled={cvProfiles.length >= 5}
      title="Duplicate CV"
    >
      <FontAwesomeIcon icon={faCopy} /> Duplicate
    </button>
    
    {!cv.isDefault && (
      <button 
        onClick={() => handleSetDefault(cv._id)}
        className="cv-secondary-button"
        title="Set as Default"
      >
        <FontAwesomeIcon icon={faCheck} /> Set as Default
      </button>
    )}
    
    {!cv.isDefault && (
      <button 
        onClick={() => handleDeleteCV(cv._id)}
        className="cv-secondary-button delete"
        title="Delete CV"
      >
        <FontAwesomeIcon icon={faTrash} /> Delete
      </button>
    )}
  </div>
</div>
            </div>
          ))
        ) : (
          <div className="cv-no-profiles">
            <div className="cv-empty-state">
              <FontAwesomeIcon icon={faArchive} size="3x" />
              <h3>No CV Profiles Yet</h3>
              <p>Create your first professional CV to showcase your skills and experience.</p>
              <button 
                className="cv-create-button"
                onClick={() => setCreateModalOpen(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Create Your First CV
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Create New CV Modal */}
      {createModalOpen && (
        <div className="cv-modal-overlay">
          <div className="cv-modal">
            <div className="cv-modal-header">
              <h2>Create New CV</h2>
              <button 
                className="cv-modal-close"
                onClick={() => setCreateModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="cv-modal-content">
              <div className="cv-form-group">
                <label htmlFor="cv-title">CV Title</label>
                <input 
                  id="cv-title"
                  type="text"
                  value={newCVTitle}
                  onChange={(e) => setNewCVTitle(e.target.value)}
                  placeholder="e.g., My Professional CV, Developer CV, etc."
                  maxLength={50}
                />
                <p className="cv-form-hint">Give your CV a descriptive name to easily identify it</p>
              </div>
            </div>
            
            <div className="cv-modal-footer">
              <button 
                className="cv-button cancel"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="cv-button create"
                onClick={handleCreateCV}
                disabled={!newCVTitle.trim()}
              >
                Create CV
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {notification.show && (
        <div className={`cv-notification ${notification.type}`}>
          <p>{notification.message}</p>
          <button 
            className="cv-notification-close"
            onClick={() => setNotification({ ...notification, show: false })}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default CVArchive;