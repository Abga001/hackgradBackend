//Profile for users
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { contentService, userService } from '../apiService'; 
import FollowersModal from '../components/FollowersModal';

// Fixed Font Awesome imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faGraduationCap, faBriefcase, faCode, faProjectDiagram, faIdCard } from '@fortawesome/free-solid-svg-icons';
// GitHub icon comes from brands package
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
// Globe icon is in solid package
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [userContent, setUserContent] = useState([]);
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [modalUsers, setModalUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
  
        // Fetch user profile
        const response = await axios.get('http://localhost:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        setProfileData(response.data);
  
        // Fetch user content
        const contentResponse = await contentService.getUserPosts(response.data._id);
        console.log('Content response:', contentResponse);
        
        // Check for the contents array in the response
        if (contentResponse && contentResponse.contents && Array.isArray(contentResponse.contents)) {
          setUserContent(contentResponse.contents);
        } else {
          // Fallback to empty array if no content is found
          console.log('No content found or unexpected response format:', contentResponse);
          setUserContent([]);
        }

        // Fetch user followers (new)
        if (response.data._id) {
          try {
            const followersResponse = await axios.get(`http://localhost:3000/api/user/followers/${response.data._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setFollowers(followersResponse.data || []);
          } catch (followerErr) {
            console.error('Error fetching followers:', followerErr);
            setFollowers([]);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchProfileAndContent();
  }, [navigate]);
  
  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  // Function to get appropriate title from content
  const getContentTitle = (content) => {
    if (content.title) return content.title;
    
    const extraFields = content.extraFields || {};
    return extraFields.title || 
           extraFields.postTitle || 
           extraFields.tutorialTitle || 
           extraFields.jobTitle || 
           extraFields.eventTitle || 
           extraFields.projectTitle || 
           'Untitled';
  };

  // Function to get image URL from content
  const getContentImageUrl = (content) => {
    if (content.image && typeof content.image === 'string') {
      return content.image;
    }
    
    const extraFields = content.extraFields || {};
    if (extraFields.image && typeof extraFields.image === 'string') {
      return extraFields.image;
    }
    
    return '/default-content.png';
  };

  // Function to get description from content
  const getContentDescription = (content) => {
    const extraFields = content.extraFields || {};
    return extraFields.description || '';
  };

  // Add these functions to handle opening the modals
const handleShowFollowers = async () => {
  try {
    // If followers are already loaded, use them
    if (followers.length > 0) {
      setModalUsers(followers);
      setShowFollowersModal(true);
    } else {
      // Otherwise, fetch followers
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3000/api/user/followers/${profileData._id}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalUsers(response.data || []);
      setFollowers(response.data || []);
      setShowFollowersModal(true);
    }
  } catch (error) {
    console.error("Error fetching followers:", error);
  }
};

const handleShowFollowing = async () => {
  try {
    if (!profileData || !profileData._id) {
      console.error("No user ID available");
      return;
    }

    // Log for debugging
    console.log("Fetching following users for ID:", profileData._id);
    
    // Use the correct endpoint that accepts a userId parameter
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:3000/api/user/following/${profileData._id}`, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("Following response:", response.data);
    setModalUsers(response.data || []);
    setShowFollowingModal(true);
  } catch (error) {
    console.error("Error fetching following users:", error);
    // Show error to user
    alert("Could not load following users. Please try again.");
  }
};

// Add this function to handle follow/unfollow from the modal
const handleFollowToggle = async (userId) => {
  try {
    const isCurrentlyFollowing = profileData.connections && 
                               profileData.connections.includes(userId);
    
    // Call the appropriate API
    if (isCurrentlyFollowing) {
      await userService.unfollowUser(userId);
    } else {
      await userService.followUser(userId);
    }
    
    // Update the current user's connections
    setProfileData(prev => {
      const prevConnections = prev.connections || [];
      
      const updatedConnections = isCurrentlyFollowing
        ? prevConnections.filter(id => id !== userId)
        : [...prevConnections, userId];
      
      return {
        ...prev,
        connections: updatedConnections
      };
    });
    
  } catch (error) {
    console.error("Follow toggle error:", error);
  }
};

  // Count content by specific type (for stats section)
  const countContentByType = (type) => {
    return userContent.filter(item => (item.contentType || '').toLowerCase() === type.toLowerCase()).length;
  };

  // Filter content based on selected type
  const filteredContent = portfolioFilter === 'all' 
    ? userContent 
    : userContent.filter(item => item.contentType.toLowerCase() === portfolioFilter);

  if (isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>Loading profile...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px 20px', backgroundColor: '#4e54c8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ padding: '15px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', marginBottom: '20px' }}>Profile not found.</div>
        <Link to="/dashboard" style={{ padding: '10px 20px', backgroundColor: '#4e54c8', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '30px', background: 'linear-gradient(135deg, #4e54c8, #8f94fb)', color: 'white', flexDirection: 'column' }}>
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <div style={{ marginRight: '30px' }}>
            <img 
              src={profileData.profileImage || "/default-avatar.png"} 
              alt={profileData.username} 
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '2rem', margin: '0 0 5px 0' }}>{profileData.fullName || profileData.username}</h2>
            <p style={{ fontSize: '1rem', opacity: '0.8', margin: '0 0 10px 0' }}>@{profileData.username}</p>
            
            {/* Area of expertise - more prominent */}
            {profileData.areaOfExpertise && (
              <p style={{ fontSize: '1.2rem', margin: '0 0 15px 0', fontWeight: '500' }}>{profileData.areaOfExpertise}</p>
            )}
            
            {/* Added metrics row similar to UserProfile */}
            <div style={{ display: 'flex', gap: '20px', margin: '15px 0' }}>
  <span 
    style={{ 
      cursor: 'pointer',
      padding: '5px 10px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transition: 'background-color 0.2s'
    }}
    onClick={handleShowFollowers}
    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
  >
    <strong>{followers.length}</strong> Followers
  </span>
  
  <span 
    style={{ 
      cursor: 'pointer',
      padding: '5px 10px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transition: 'background-color 0.2s'
    }}
    onClick={handleShowFollowing}
    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
  >
    <strong>{profileData.connections ? profileData.connections.length : 0}</strong> Following
  </span>
  
  <span><strong>{userContent.length}</strong> Posts</span>
</div>

            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleEditProfile}
                style={{ padding: '8px 16px', backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid white', borderRadius: '4px', cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faEdit} /> Edit Profile
              </button>
              
              <Link 
                to="/cv"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 16px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white', 
                  border: '1px solid white', 
                  borderRadius: '4px',
                  textDecoration: 'none'
                }}
              >
                <FontAwesomeIcon icon={faIdCard} /> My CV
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bio added to header */}
        {profileData.bio && (
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            padding: '15px 20px', 
            borderRadius: '8px', 
            marginTop: '10px',
            lineHeight: '1.6'
          }}>
            {profileData.bio}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', padding: '20px' }}>
        <div style={{ flex: 2, paddingRight: '30px' }}>
          {/* About section removed since bio is now in header */}
          
          {/* Portfolio Section */}
          <section style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', margin: '0' }}>
                <FontAwesomeIcon icon={faProjectDiagram} /> Portfolio
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setPortfolioFilter('all')}
                  style={{ 
                    padding: '6px 12px', 
                    backgroundColor: portfolioFilter === 'all' ? '#4e54c8' : '#f1f1f1', 
                    color: portfolioFilter === 'all' ? 'white' : '#333', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  All
                </button>
                <button 
                  onClick={() => setPortfolioFilter('post')}
                  style={{ 
                    padding: '6px 12px', 
                    backgroundColor: portfolioFilter === 'post' ? '#4e54c8' : '#f1f1f1', 
                    color: portfolioFilter === 'post' ? 'white' : '#333', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Posts
                </button>
                <button 
                  onClick={() => setPortfolioFilter('project')}
                  style={{ 
                    padding: '6px 12px', 
                    backgroundColor: portfolioFilter === 'project' ? '#4e54c8' : '#f1f1f1', 
                    color: portfolioFilter === 'project' ? 'white' : '#333', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Projects
                </button>
                <button 
                  onClick={() => setPortfolioFilter('tutorial')}
                  style={{ 
                    padding: '6px 12px', 
                    backgroundColor: portfolioFilter === 'tutorial' ? '#4e54c8' : '#f1f1f1', 
                    color: portfolioFilter === 'tutorial' ? 'white' : '#333', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Tutorials
                </button>
                <button 
                  onClick={() => setPortfolioFilter('books')}
                  style={{ 
                    padding: '6px 12px', 
                    backgroundColor: portfolioFilter === 'books' ? '#4e54c8' : '#f1f1f1', 
                    color: portfolioFilter === 'books' ? 'white' : '#333', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Books
                </button>
              </div>
            </div>

            {filteredContent.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {filteredContent.map((content) => (
                  <Link 
                    key={content._id} 
                    to={`/contents/${content._id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ 
                      border: '1px solid #eee', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      ':hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <div style={{ height: '150px', overflow: 'hidden' }}>
                        <img 
                          src={getContentImageUrl(content)} 
                          alt={getContentTitle(content)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = '/default-content.png' }}
                        />
                      </div>
                      <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '3px 8px', 
                          backgroundColor: '#e8f0fe', 
                          color: '#1a73e8',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          marginBottom: '10px'
                        }}>
                          {content.contentType}
                        </span>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.1rem' }}>
                          {getContentTitle(content)}
                        </h4>
                        <p style={{ 
                          margin: '0 0 15px 0', 
                          color: '#666', 
                          fontSize: '0.9rem',
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {getContentDescription(content)}
                        </p>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#888',
                          display: 'flex', 
                          justifyContent: 'space-between' 
                        }}>
                          <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                          <span>
                            {content.likes ? content.likes.length : 0} ❤️ | {content.comments ? content.comments.length : 0} 💬
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '30px', 
                textAlign: 'center', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '8px',
                color: '#666'
              }}>
                <p>No {portfolioFilter !== 'all' ? portfolioFilter : ''} content yet. Share your work by creating new content!</p>
                <Link 
                  to="/create"
                  style={{ 
                    display: 'inline-block',
                    marginTop: '15px',
                    padding: '8px 16px',
                    backgroundColor: '#4e54c8',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}
                >
                  Create Content
                </Link>
              </div>
            )}
          </section>

          {/* Education Section */}
          {profileData.education && profileData.education.length > 0 && (
            <section style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faGraduationCap} /> Education
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profileData.education.map((edu, index) => (
                  <div key={index} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4e54c8' }}>
                    <h4 style={{ fontSize: '1.1rem', margin: '0 0 5px 0', color: '#333' }}>{edu.institution}</h4>
                    <p style={{ fontWeight: '500', margin: '0 0 5px 0', color: '#555' }}>{edu.degree} in {edu.fieldOfStudy}</p>
                    <p style={{ fontSize: '0.9rem', color: '#777', margin: '0 0 10px 0' }}>
                      {edu.startYear} - {edu.endYear || 'Present'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience Section */}
          {profileData.experience && profileData.experience.length > 0 && (
            <section style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faBriefcase} /> Experience
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profileData.experience.map((exp, index) => (
                  <div key={index} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4e54c8' }}>
                    <h4 style={{ fontSize: '1.1rem', margin: '0 0 5px 0', color: '#333' }}>{exp.position}</h4>
                    <p style={{ fontWeight: '500', margin: '0 0 5px 0', color: '#555' }}>{exp.company}</p>
                    <p style={{ fontSize: '0.9rem', color: '#777', margin: '0 0 10px 0' }}>
                      {exp.startDate 
                        ? new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                        : ''
                      } - {
                        exp.endDate
                          ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                          : 'Present'
                      }
                    </p>
                    {exp.description && (
                      <p style={{ margin: '10px 0 0 0', fontSize: '0.95rem', lineHeight: '1.5', color: '#666' }}>{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
          {/* CV Profile Section - NEW */}
          <section style={{ marginBottom: '30px', background: 'linear-gradient(135deg, #f5f7fa, #e4e8f0)', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>
              <FontAwesomeIcon icon={faIdCard} /> Professional CV
            </h3>
            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Create and manage your professional CV to showcase your skills, experience, and achievements.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link 
                to="/cv"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '10px', 
                  padding: '10px 15px', 
                  backgroundColor: '#4e54c8', 
                  color: 'white', 
                  textDecoration: 'none', 
                  borderRadius: '5px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
              >
                <FontAwesomeIcon icon={faIdCard} /> View My CV
              </Link>
              <Link 
                to="/cv/edit"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '10px', 
                  padding: '10px 15px', 
                  backgroundColor: '#fff', 
                  color: '#4e54c8', 
                  textDecoration: 'none', 
                  borderRadius: '5px',
                  border: '1px solid #4e54c8',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
              >
                <FontAwesomeIcon icon={faEdit} /> Edit CV
              </Link>
            </div>
          </section>

          {/* Skills Section */}
          {profileData.skills && profileData.skills.length > 0 && (
            <section style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profileData.skills.map((skill, index) => (
                  <span key={index} style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem', display: 'inline-block' }}>{skill}</span>
                ))}
              </div>
            </section>
          )}

          {/* Programming Languages Section */}
          {profileData.favoriteLanguages && profileData.favoriteLanguages.length > 0 && (
            <section style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faCode} /> Languages
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profileData.favoriteLanguages.map((lang, index) => (
                  <span key={index} style={{ backgroundColor: '#fde8e8', color: '#e53e3e', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem', display: 'inline-block' }}>{lang}</span>
                ))}
              </div>
            </section>
          )}

          {/* Content Stats - Updated for consistency */}
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Content Stats</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '10px' 
            }}>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f0f7ff', 
                borderRadius: '8px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a73e8' }}>
                  {countContentByType('post')}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Posts</div>
              </div>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#fff8e6', 
                borderRadius: '8px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {countContentByType('tutorial')}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Tutorials</div>
              </div>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f0fff4', 
                borderRadius: '8px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>
                  {countContentByType('project')}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Projects</div>
              </div>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#fdf2f8', 
                borderRadius: '8px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ec4899' }}>
                  {countContentByType('event') + countContentByType('job') + countContentByType('books')}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Other</div>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Connect</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profileData.github && (
                <a 
                  href={profileData.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f1f1f1', color: '#333', textDecoration: 'none', borderRadius: '5px' }}
                >
                  <FontAwesomeIcon icon={faGithub} /> GitHub
                </a>
              )}
              {profileData.linkedin && (
                <a 
                  href={profileData.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f1f1f1', color: '#333', textDecoration: 'none', borderRadius: '5px' }}
                >
                  <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
                </a>
              )}
              {profileData.portfolio && (
                <a 
                  href={profileData.portfolio} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 12px', backgroundColor: '#f1f1f1', color: '#333', textDecoration: 'none', borderRadius: '5px' }}
                >
                  <FontAwesomeIcon icon={faGlobe} /> Portfolio
                </a>
              )}
              {!profileData.github && !profileData.linkedin && !profileData.portfolio && (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No social links provided yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <FollowersModal
  isOpen={showFollowersModal}
  onClose={() => setShowFollowersModal(false)}
  type="followers"
  users={modalUsers}
  onFollowToggle={handleFollowToggle}
  currentUser={profileData}
/>

<FollowersModal
  isOpen={showFollowingModal}
  onClose={() => setShowFollowingModal(false)}
  type="following"
  users={modalUsers}
  onFollowToggle={handleFollowToggle}
  currentUser={profileData}
/>
    </div>
  );
};

export default Profile;