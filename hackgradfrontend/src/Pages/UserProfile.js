import axios from 'axios';
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { UserContext, FollowingContext } from "../App";
import { userService, contentService } from "../apiService";
import FollowersModal from '../components/FollowersModal';
import "../styles/UserProfile.css";
import { messageService } from "../messageService";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faProjectDiagram, faGraduationCap, faBriefcase, 
  faCode, faGlobe, faEdit, faIdCard, faLock, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const UserProfile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const { setRefreshFollowing } = useContext(FollowingContext);

  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followers, setFollowers] = useState([]);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);

  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  
  // CV states
  const [cvStatus, setCvStatus] = useState('loading'); // 'loading', 'none', 'private', 'public'
  const [cvProfileId, setCvProfileId] = useState(null); // Store the CV ID, not the user ID
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching profile for user ID: ${profileId}`);
  
        // Get the user profile
        const userData = await userService.getUserProfile(profileId);
        console.log("User data retrieved:", userData);
        setUser(userData);
  
        // Get followers
        const followersData = await userService.getUserFollowers(profileId);
        console.log("Followers retrieved:", followersData);
        setFollowers(followersData);
  
        // Get posts
        const userPosts = await contentService.getUserPosts(profileId);
        console.log("User posts retrieved:", userPosts);
        
        // Handle different possible response formats
        if (userPosts && userPosts.contents && Array.isArray(userPosts.contents)) {
          setPosts(userPosts.contents);
        } else if (Array.isArray(userPosts)) {
          setPosts(userPosts);
        } else {
          console.warn("Unexpected posts response format:", userPosts);
          setPosts([]);
        }

        // Check for CV profile and its status
        try {
          // First try to get CV by user ID
          let userHasCV = false;
          let cvId = null;
          
          // Try to find the CV ID first with a search endpoint
          const cvSearchResponse = await fetch(`http://localhost:3000/api/cv-profile/search/by-user/${profileId}`);
          console.log("CV search response:", cvSearchResponse);
          
          if (cvSearchResponse.ok) {
            const cvData = await cvSearchResponse.json();
            console.log("CV data:", cvData);
            
            if (cvData && cvData._id) {
              userHasCV = true;
              cvId = cvData._id;
              
              // Now check if this CV is public
              const publicResponse = await fetch(`http://localhost:3000/api/cv-profile/public/${cvId}`);
              
              if (publicResponse.ok) {
                // User has a public CV
                setCvStatus('public');
                setCvProfileId(cvId); // Store the CV ID for links
                console.log("Public CV found with ID:", cvId);
              } else {
                // CV exists but is private
                setCvStatus('private');
                console.log("Private CV found");
              }
            } else {
              // No CV found for this user
              setCvStatus('none');
              console.log("No CV data found");
            }
          } else {
            // Search endpoint failed, user has no CV
            setCvStatus('none');
            console.log("CV search failed");
          }
        } catch (cvError) {
          console.error("Error checking for CV:", cvError);
          setCvStatus('none');
        }
  
        // Check if current user is following this profile
        if (currentUser && currentUser._id !== profileId) {
          const isUserFollowed = currentUser.connections && 
                               Array.isArray(currentUser.connections) && 
                               currentUser.connections.includes(profileId);
          console.log(`Is current user following this profile? ${isUserFollowed}`);
          setIsFollowing(isUserFollowed);
        }
  
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Could not load user profile");
      } finally {
        setIsLoading(false);
      }
    };
  
    if (profileId && (!user || user._id !== profileId)) {
      fetchUserData();
    }
  }, [profileId, currentUser]);

  const handleShowFollowers = () => {
    setShowFollowersModal(true);
  };

  const handleShowFollowing = async () => {
    try {
      // If we already have following users loaded, just show the modal
      if (followingUsers.length > 0) {
        setShowFollowingModal(true);
        return;
      }
      
      console.log(`Fetching following users for profile ID: ${profileId}`);
  
      // Use direct axios call instead of the missing function
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication required to view following users");
        return;
      }
  
      const response = await axios.get(
        `http://localhost:3000/api/user/following/${profileId}`,
        { 
          headers: { 
            'Authorization': `Bearer ${token}` 
          } 
        }
      );
      
      console.log("Following response:", response.data);
      setFollowingUsers(response.data || []);
      setShowFollowingModal(true);
    } catch (error) {
      console.error("Error fetching following users:", error);
      setError("Failed to load following users");
      setTimeout(() => setError(""), 3000);
    }
  };
  
  // Add this function to handle follow/unfollow from within the modal
  const handleFollowToggleFromModal = async (userId) => {
    try {
      const isCurrentlyFollowing = currentUser.connections && 
                                 currentUser.connections.includes(userId);
      
      // Call the appropriate API
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(userId);
      } else {
        await userService.followUser(userId);
      }
      
      // Update the current user's connections
      setCurrentUser(prev => {
        const prevConnections = prev.connections || [];
        
        const updatedConnections = isCurrentlyFollowing
          ? prevConnections.filter(id => id !== userId)
          : [...prevConnections, userId];
        
        return {
          ...prev,
          connections: updatedConnections
        };
      });
      
      // If the user being toggled is the profile we're viewing, update follow status
      if (userId === profileId) {
        setIsFollowing(!isCurrentlyFollowing);
      }
      
      // Signal to the sidebar that following list should refresh
      setRefreshFollowing(prev => !prev);
      
    } catch (error) {
      console.error("Follow toggle error:", error);
    }
  };

  // Helper functions (unchanged)
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

  const getContentImage = (content) => {
    if (content.image) return content.image;
    
    const extraFields = content.extraFields || {};
    return extraFields.image || '/default-content.png';
  };

  const getContentDescription = (content) => {
    const extraFields = content.extraFields || {};
    return extraFields.description || '';
  };

  const filteredContent = portfolioFilter === 'all' 
    ? posts 
    : posts.filter(item => (item.contentType || '').toLowerCase() === portfolioFilter);

  const countContentByType = (type) => {
    return posts.filter(item => (item.contentType || '').toLowerCase() === type.toLowerCase()).length;
  };

  // Handle follow/unfollow (unchanged)
  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    
    try {
      setIsFollowing(!isFollowing);
      
      if (isFollowing) {
        await userService.unfollowUser(profileId);
      } else {
        await userService.followUser(profileId);
      }
      
      setCurrentUser(prev => {
        const prevConnections = prev.connections || [];
        
        const updatedConnections = isFollowing
          ? prevConnections.filter(id => id !== profileId)
          : [...prevConnections, profileId];
        
        return {
          ...prev,
          connections: updatedConnections
        };
      });
      
      setRefreshFollowing(prev => !prev);
      
    } catch (err) {
      console.error("Follow toggle error:", err);
      setIsFollowing(!isFollowing);
      setError(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleMessage = async () => {
    try {
      const conversation = await messageService.createConversation(
        currentUser._id,
        profileId
      );
      
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Failed to start conversation. Please try again.");
      
      setTimeout(() => setError(""), 3000);
    }
  };
  
  // Helper function to render CV status - using cvProfileId instead of profileId
  const renderCVStatus = () => {
    switch (cvStatus) {
      case 'public':
        return (
          <Link to={`/cv/${cvProfileId}`} className="cv-button">
            <FontAwesomeIcon icon={faIdCard} /> View CV
          </Link>
        );
      case 'private':
        return (
          <span className="cv-status private">
            <FontAwesomeIcon icon={faLock} /> Private CV
          </span>
        );
      case 'none':
        return (
          <span className="cv-status none">
            <FontAwesomeIcon icon={faExclamationCircle} /> User has no CV uploaded
          </span>
        );
      default:
        return null;
    }
  };

  // Helper function to render CV link in connect section - using cvProfileId instead of profileId
  const renderCVLink = () => {
    switch (cvStatus) {
      case 'public':
        return (
          <Link 
            to={`/cv/${cvProfileId}`}
            className="connect-link cv-link"
          >
            <FontAwesomeIcon icon={faIdCard} /> View CV
          </Link>
        );
      case 'private':
        return (
          <span className="connect-link cv-private">
            <FontAwesomeIcon icon={faLock} /> Private CV
          </span>
        );
      case 'none':
        return (
          <span className="connect-link cv-none">
            <FontAwesomeIcon icon={faExclamationCircle} /> No CV uploaded
          </span>
        );
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return <div className="user-loading">Loading profile...</div>;
  }
  
  if (error) {
    return <div className="user-error">{error}</div>;
  }
  
  if (!user) {
    return <div className="user-error">User not found</div>;
  }

  return (
    <div className="user-profile">
      <div className="user-header">
        <div className="user-header-top">
          <img
            src={user.profileImage || "/default-avatar.png"}
            alt={user.fullName || user.username}
            className="user-avatar"
            onError={(e) => { e.target.src = "/default-avatar.png" }}
          />
          <div className="user-info">
            <h2>{user.fullName || user.username}</h2>
            <p>@{user.username}</p>
            
            {user.areaOfExpertise && <p className="user-expertise">{user.areaOfExpertise}</p>}
            
            <div className="user-metrics">
  <span 
    onClick={handleShowFollowers}
    style={{ 
      cursor: 'pointer',
      padding: '5px 10px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transition: 'background-color 0.2s'
    }}
    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
  >
    <strong>{followers.length}</strong> Followers
  </span>
  
  <span 
    onClick={handleShowFollowing}
    style={{ 
      cursor: 'pointer',
      padding: '5px 10px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      transition: 'background-color 0.2s'
    }}
    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
  >
    <strong>{user.connections ? user.connections.length : 0}</strong> Following
  </span>
  
  <span><strong>{posts.length}</strong> Posts</span>
</div>
          </div>
        </div>
        
        {user.bio && (
          <div className="user-bio-container">
            {user.bio}
          </div>
        )}
      </div>

      {/* Only show action buttons if looking at someone else's profile */}
      {currentUser && user._id !== currentUser._id && (
        <div className="user-actions">
          <button
            onClick={handleFollowToggle}
            className={`follow-button ${isFollowing ? "following" : "not-following"}`}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
          <button onClick={handleMessage} className="message-button">
            Message
          </button>
          
          {/* CV Button with status handling */}
          {renderCVStatus()}
        </div>
      )}

      <div className="user-content-container">
        <div className="user-main-content">
          {/* Portfolio Section*/}
          <div className="portfolio-section">
            <div className="portfolio-header">
              <h3>
                <FontAwesomeIcon icon={faProjectDiagram} /> {user.fullName ? user.fullName.split(" ")[0] + "'s" : user.username + "'s"} Portfolio
              </h3>
              <div className="portfolio-filters">
                <button 
                  className={portfolioFilter === 'all' ? 'active' : ''}
                  onClick={() => setPortfolioFilter('all')}
                >
                  All
                </button>
                <button 
                  className={portfolioFilter === 'post' ? 'active' : ''}
                  onClick={() => setPortfolioFilter('post')}
                >
                  Posts
                </button>
                <button 
                  className={portfolioFilter === 'project' ? 'active' : ''}
                  onClick={() => setPortfolioFilter('project')}
                >
                  Projects
                </button>
                <button 
                  className={portfolioFilter === 'tutorial' ? 'active' : ''}
                  onClick={() => setPortfolioFilter('tutorial')}
                >
                  Tutorials
                </button>
                <button 
                  className={portfolioFilter === 'books' ? 'active' : ''}
                  onClick={() => setPortfolioFilter('books')}
                >
                  Books
                </button>
              </div>
            </div>

            {filteredContent.length > 0 ? (
              <div className="portfolio-grid">
                {filteredContent.map(content => (
                  <Link to={`/contents/${content._id}`} key={content._id} className="portfolio-item">
                    <div className="portfolio-image">
                      <img 
                        src={getContentImage(content)} 
                        alt={getContentTitle(content)} 
                        onError={(e) => { e.target.src = "/default-content.png" }}
                      />
                      <span className="content-type-badge">{content.contentType}</span>
                    </div>
                    <div className="portfolio-details">
                      <h4>{getContentTitle(content)}</h4>
                      <p>{getContentDescription(content).substring(0, 100)}
                        {getContentDescription(content).length > 100 ? '...' : ''}
                      </p>
                      <div className="portfolio-item-footer">
                        <span className="date">{new Date(content.createdAt).toLocaleDateString()}</span>
                        <span className="stats">
                          {content.likes ? content.likes.length : 0} ❤️ | {content.comments ? content.comments.length : 0} 💬
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-portfolio">
                <p>No {portfolioFilter !== 'all' ? portfolioFilter : ''} content yet.</p>
                {portfolioFilter === 'all' && <p>Coming soon: tutorials, projects, and updates!</p>}
              </div>
            )}
          </div>

          {/* Education Section */}
          {user.education && user.education.length > 0 && (
            <section className="user-education">
              <h3>
                <FontAwesomeIcon icon={faGraduationCap} /> Education
              </h3>
              <div className="education-list">
                {user.education.map((edu, index) => (
                  <div key={index} className="education-item">
                    <h4>{edu.institution}</h4>
                    <p className="degree">{edu.degree} in {edu.fieldOfStudy}</p>
                    <p className="years">{edu.startYear} - {edu.endYear || 'Present'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience Section*/}
          {user.experience && user.experience.length > 0 && (
            <section className="user-experience">
              <h3>
                <FontAwesomeIcon icon={faBriefcase} /> Experience
              </h3>
              <div className="experience-list">
                {user.experience.map((exp, index) => (
                  <div key={index} className="experience-item">
                    <h4>{exp.position}</h4>
                    <p className="company">{exp.company}</p>
                    <p className="years">
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
                      <p className="description">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="user-sidebar">
          {/* CV Section - Show for all CV statuses */}
          <section className="user-cv">
            <h3>
              <FontAwesomeIcon icon={faIdCard} /> Professional CV
            </h3>
            <div className="cv-info">
              {cvStatus === 'public' && (
                <>
                  <p>
                    {user.fullName || user.username} has shared their professional CV. 
                    View their detailed experience, skills, and qualifications.
                  </p>
                  <Link to={`/cv/${cvProfileId}`} className="view-cv-button">
                    <FontAwesomeIcon icon={faIdCard} /> View CV
                  </Link>
                </>
              )}
              {cvStatus === 'private' && (
                <p className="cv-status-message private">
                  <FontAwesomeIcon icon={faLock} /> {user.fullName || user.username} has set their CV to private.
                </p>
              )}
              {cvStatus === 'none' && (
                <p className="cv-status-message none">
                  <FontAwesomeIcon icon={faExclamationCircle} /> {user.fullName || user.username} has not uploaded a CV yet.
                </p>
              )}
            </div>
          </section>

          {/* Skills Section */}
          {user.skills && user.skills.length > 0 && (
            <section className="user-skills">
              <h3>Skills</h3>
              <div className="skills-list">
                {user.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </section>
          )}

          {/* Programming Languages Section */}
          {user.favoriteLanguages && user.favoriteLanguages.length > 0 && (
            <section className="user-languages">
              <h3>
                <FontAwesomeIcon icon={faCode} /> Languages
              </h3>
              <div className="languages-list">
                {user.favoriteLanguages.map((lang, index) => (
                  <span key={index} className="language-tag">{lang}</span>
                ))}
              </div>
            </section>
          )}

          {/* Content Stats Section */}
          <section className="user-content-stats">
            <h3>Content Stats</h3>
            <div className="stats-grid">
              <div className="stat-item stat-posts">
                <div className="stat-value">{countContentByType('post')}</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat-item stat-tutorials">
                <div className="stat-value">{countContentByType('tutorial')}</div>
                <div className="stat-label">Tutorials</div>
              </div>
              <div className="stat-item stat-projects">
                <div className="stat-value">{countContentByType('project')}</div>
                <div className="stat-label">Projects</div>
              </div>
              <div className="stat-item stat-other">
                <div className="stat-value">
                  {countContentByType('event') + countContentByType('job') + countContentByType('books')}
                </div>
                <div className="stat-label">Other</div>
              </div>
            </div>
          </section>

          {/* Connect Section */}
          <section className="user-connect">
            <h3>Connect</h3>
            <div className="connect-links">
              {user.github && (
                <a 
                  href={user.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="connect-link"
                >
                  <FontAwesomeIcon icon={faGithub} /> GitHub
                </a>
              )}
              {user.linkedin && (
                <a 
                  href={user.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="connect-link"
                >
                  <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
                </a>
              )}
              {user.portfolio && (
                <a 
                  href={user.portfolio} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="connect-link"
                >
                  <FontAwesomeIcon icon={faGlobe} /> Portfolio
                </a>
              )}
              
              {/* Render CV link based on status */}
              {renderCVLink()}
              
              {!user.github && !user.linkedin && !user.portfolio && cvStatus === 'none' && (
                <p className="no-links">No social links provided yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
      
      {/* Followers Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        type="followers"
        users={followers}
        onFollowToggle={handleFollowToggleFromModal}
        currentUser={currentUser}
      />

      {/* Following Modal */}
      <FollowersModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        type="following"
        users={followingUsers}
        onFollowToggle={handleFollowToggleFromModal}
        currentUser={currentUser}
      />
    </div>
  );
};

export default UserProfile;