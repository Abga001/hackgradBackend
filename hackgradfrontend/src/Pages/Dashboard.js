//Dashboard.js

import React, { useEffect, useState, useContext } from "react";
import { useNavigate} from "react-router-dom";
import { searchService, contentService } from "../apiService";
import { UserContext, ModalContext } from "../App";
import "../styles/Dashboard.css";

const ImprovedDashboard = () => {
  const [contents, setContents] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], contents: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [repostModalId, setRepostModalId] = useState(null);
  const [repostNote, setRepostNote] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Define all available filter tabs
  const filterTabs = ["All", "Profiles", "Projects", "Jobs", "Tutorials", "Posts", "Events", "Books", "Questions"];
  
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const { openCreateModal } = useContext(ModalContext);

  // Function to handle opening create content modal
  const handleOpenCreateModal = (e) => {
    e.preventDefault();
    if (currentUser) {
      openCreateModal("Post"); // Default to Post type
    } else {
      navigate('/login');
    }
  };

  // Function to handle opening create content modal with specific type
  const handleOpenCreateModalWithType = (type) => {
    if (currentUser) {
      openCreateModal(type);
    } else {
      navigate('/login');
    }
  };

  // Function to handle tab changes 
  const handleTabChange = (tab) => {
    setActiveFilter(tab);
    setCurrentPage(1); // Reset to page 1 when changing filters
  };

  // Helper function for backward compatibility with legacy content structure
  const getContentTitle = (content) => {
    // Check if the content has a title at the root level (new structure)
    if (content.title && typeof content.title === 'string') {
      return content.title;
    }
    
    // Check extraFields for legacy content
    const extraFields = content.extraFields || {};
    return extraFields.title || 
           extraFields.postTitle || 
           extraFields.tutorialTitle || 
           extraFields.jobTitle || 
           extraFields.eventTitle || 
           extraFields.projectTitle ||
           extraFields.bookTitle || 
           extraFields.questionTitle || 
           "Untitled";
  };

  // Helper function for backward compatibility with legacy content structure
  const getContentImage = (content) => {
    // Check if the content has an image at the root level (new structure)
    if (content.image && typeof content.image === 'string') {
      // If it's a relative path starting with /uploads/
      if (content.image.startsWith('/uploads/')) {
        return `http://localhost:3000${content.image}`;
      }
      // If it's a full URL or base64
      if (content.image.startsWith('http') || content.image.startsWith('data:')) {
        return content.image;
      }
      // If it's just a filename, add the uploads path
      if (!content.image.startsWith('/')) {
        return `http://localhost:3000/uploads/${content.image}`;
      }
      return content.image;
    }
    
    // Check extraFields for legacy content
    const extraFields = content.extraFields || {};
    if (extraFields.image) {
      if (extraFields.image.startsWith('/uploads/')) {
        return `http://localhost:3000${extraFields.image}`;
      }
      if (extraFields.image.startsWith('http') || extraFields.image.startsWith('data:')) {
        return extraFields.image;
      }
      return extraFields.image;
    }
    
    return "/default-content.gif";
  };

  // Helper function to get content description
  const getContentDescription = (content) => {
    const extraFields = content.extraFields || {};
    return extraFields.description || "No description available";
  };

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 120) => {
    if (!text) return "No description available";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Handle save content
  const handleSaveContent = async (contentId, event) => {
    event.stopPropagation(); // Prevent card click navigation
    
    if (!currentUser) {
      // Show login prompt
      navigate('/login');
      return;
    }
    
    try {
      setActionInProgress(contentId + '-save');
      await contentService.saveContent(contentId);
      
      // Refresh content list after saving
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error("Save error:", err);
      // Show an error toast here
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle repost modal
  const handleRepostModal = (contentId, event) => {
    event.stopPropagation(); // Prevent card click navigation
    
    if (!currentUser) {
      // Show a login prompt here
      navigate('/login');
      return;
    }
    
    setRepostModalId(contentId);
  };

  // Handle repost content
  const handleRepostContent = async (contentId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    try {
      setActionInProgress(contentId + '-repost');
      
      await contentService.repostContent(contentId, repostNote);
      
      // Clear form and close modal
      setRepostNote('');
      setRepostModalId(null);
      
      // Refresh content list after reposting
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error("Repost error:", err);
      // Show an error toast here
    } finally {
      setActionInProgress(null);
    }
  };

  // Repost Modal Component
  const RepostModal = () => {
    if (!repostModalId) return null;
    
    return (
      <div className="repost-modal-overlay" onClick={() => setRepostModalId(null)}>
        <div className="repost-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Repost this content</h3>
          <p>Add an optional note to your repost:</p>
          
          <textarea
            value={repostNote}
            onChange={(e) => setRepostNote(e.target.value)}
            placeholder="What do you think about this content? (optional)"
            rows="4"
          />
          
          <div className="modal-actions">
            <button 
              onClick={() => setRepostModalId(null)}
              className="cancel-button"
              disabled={actionInProgress}
            >
              Cancel
            </button>
            
            <button
              onClick={() => handleRepostContent(repostModalId)}
              className="repost-button"
              disabled={actionInProgress}
            >
              {actionInProgress === (repostModalId + '-repost') ? 'Reposting...' : 'Repost'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Used to fetch SearchResults with extended user data

useEffect(() => {
  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get the content type from the active filter
      const contentType = activeFilter !== "All" && activeFilter !== "Profiles" 
        ? getContentTypeFromFilter(activeFilter) 
        : null;

      // Build the API URL with filter parameters
      let contentsUrl = `http://localhost:3000/api/contents?page=${currentPage}&limit=${itemsPerPage}`;
      
      // Add contentType filter if needed
      if (contentType) {
        contentsUrl += `&contentType=${contentType}`;
      }

      const contentsResponse = await fetch(contentsUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const usersResponse = await fetch('http://localhost:3000/api/user/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (contentsResponse.ok) {
        const contentsData = await contentsResponse.json();
        
        // Set pagination data
        setTotalItems(contentsData.pagination?.total || 0);
        setTotalPages(contentsData.pagination?.pages || 1);
        
        const processedContents = (contentsData.contents || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map(content => ({
            ...content,
            processedTitle: getContentTitle(content),
            processedImage: getContentImage(content),
            processedDescription: getContentDescription(content)
          }));
        
        setContents(processedContents);
      } else {
        console.error("Error fetching contents:", contentsResponse.status);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData || []);
      } else {
        console.error("Error fetching users:", usersResponse.status);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchAll();
}, [refreshCounter, currentPage, itemsPerPage, activeFilter]);

  // Function to handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Function to change items per page
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Helper function to get user data for a content
  const getUserForContent = (content) => {
    return users.find(user => user._id === content.userId) || null;
  };

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim() === "") {
        setIsSearching(false);
        return;
      }

      try {
        const res = await searchService.search(searchQuery);
        
        // Process search results for backward compatibility
        const processedResults = {
          users: res.users || [],
          contents: (res.contents || []).map(content => ({
            ...content,
            processedTitle: getContentTitle(content),
            processedImage: getContentImage(content),
            processedDescription: getContentDescription(content)
          }))
        };
        
        setSearchResults(processedResults);
        setIsSearching(true);
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    performSearch();
  }, [searchQuery]);

  // Click handler for cards, remembers's state to be passed on to content
const handleCardClick = (type, id) => {
  // Save current dashboard state before navigating
  const dashboardState = {
    activeFilter,
    currentPage,
    itemsPerPage,
    scrollPosition: window.scrollY
  };
  
  // Save to localStorage
  localStorage.setItem('dashboardState', JSON.stringify(dashboardState));
  
  // Navigate as normal
  if (type === "user") navigate(`/profile/${id}`);
  if (type === "content") navigate(`/contents/${id}`);
};
  // Magazine-style card styles with inline styling to avoid CSS conflicts
  const cardStyles = {
    card: {
      background: '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      border: '1px solid #eaeaea',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      marginBottom: '20px'
    },
    imageContainer: {
      height: '200px',
      overflow: 'hidden',
      position: 'relative',
      borderBottom: '1px solid #eee'
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    content: {
      padding: '15px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff'
    },
    contentType: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#e91e63',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '5px',
      fontFamily: 'Arial, sans-serif'
    },
    title: {
      margin: '0 0 10px 0',
      fontSize: '20px',
      color: '#222',
      lineHeight: 1.3,
      fontWeight: 600,
      fontFamily: 'Arial, sans-serif'
    },
    description: {
      margin: '0 0 10px 0',
      fontSize: '14px',
      color: '#555',
      lineHeight: 1.5,
      fontFamily: 'Georgia, serif'
    },
    readMore: {
      fontSize: '13px',
      fontWeight: 500,
      color: '#000',
      textDecoration: 'none',
      display: 'inline-block',
      marginTop: 'auto',
      fontFamily: 'Arial, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderTop: '1px solid #ddd',
      paddingTop: '10px',
      width: '100%'
    },
    // New styles for poster info
    posterInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 0',
      borderBottom: '1px solid #ddd',
      marginBottom: '10px'
    },
    posterAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover',
      backgroundColor: '#ccc'
    },
    posterName: {
      fontWeight: '500',
      fontSize: '14px',
      color: '#333'
    },
    posterDate: {
      fontSize: '12px',
      color: '#666',
      marginLeft: 'auto'
    },
    // New styles for stats
    stats: {
      display: 'flex',
      gap: '15px',
      marginTop: '10px',
      fontSize: '14px',
      color: '#666'
    },
    statItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    emojiHeart: {
      fontSize: '18px',
      display: 'inline-block',
      width: '20px',
      textAlign: 'center'
    },
    emojiComment: {
      fontSize: '23px',
      display: 'inline-block',
      width: '25px',
      height: '38.5px',
      textAlign: 'center'
    },
    emojiSave: {
      fontSize: '21px',
      display: 'inline-block',
      width: '22px',
      height: '32.5px',
      textAlign: 'center'
    },
    emojiRepost: {
      fontSize: '22px',
      display: 'inline-block',
      width: '20px',
      textAlign: 'center'
    },
    // Pagination styles
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '30px',
      gap: '10px'
    },
    pageButton: {
      padding: '8px 15px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: '#fff',
      cursor: 'pointer',
      transition: 'background 0.2s ease'
    },
    activePageButton: {
      background: '#e91e63',
      color: '#fff',
      border: '1px solid #e91e63'
    },
    itemsPerPageSelect: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      marginLeft: '15px'
    },
    paginationInfo: {
      marginRight: '15px',
      color: '#666',
      fontSize: '14px'
    }
  };

  const renderUsers = (usersList) => (
    <div className="dashboard-grid">
      {usersList.map(user => (
        <div key={user._id} className="dashboard-card profile-card" onClick={() => handleCardClick("user", user._id)}>
          <div className="card-image-container">
            <img 
              src={user.profileImage || "/default-avatar.png"} 
              alt={user.fullName || user.username || "User"} 
              loading="lazy"
              onError={(e) => { e.target.src = "/default-avatar.png"; }}
            />
          </div>
          <div className="card-content">
            <span className="profile-badge">Profile</span>
            <h4>{user.fullName || user.username || "User"}</h4>
            <p>{truncateText(user.areaOfExpertise || user.bio || "No bio available")}</p>
            <div className="read-more">
              View Profile
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContents = (contentList) => (
    <div className="dashboard-grid">
      {contentList.map(content => {
        const user = getUserForContent(content);
        const userHasSaved = content.saves && currentUser && content.saves.includes(currentUser._id);
        const userHasReposted = content.reposts && currentUser && content.reposts.includes(currentUser._id);
        
        return (
          <div 
            key={content._id} 
            style={{...cardStyles.card, cursor: 'default'}}
            className="dashboard-card"
          >
            {/* Show repost indicator if it's a repost */}
            {content.originalContentId && (
              <div style={{
                backgroundColor: '#f1f1f1', 
                padding: '5px 10px',
                fontSize: '12px',
                color: '#555',
                borderBottom: '1px solid #ddd'
              }}>
                <span>🔄 Reposted by {user?.username || "Unknown User"}</span>
              </div>
            )}
            
            {/* Make image clickable */}
            <div 
              className="image-container"
              style={cardStyles.imageContainer}
              onClick={() => handleCardClick("content", content._id)}
            >
              <img 
  src={content.processedImage || "/default-content.gif"}
  alt={content.processedTitle || "Content"} 
  loading="lazy"
  style={{
    width: 'auto',         // Let width adjust automatically
    maxWidth: '100%',      // Ensure it doesn't overflow
    maxHeight: '100%',     // Ensure it doesn't overflow
    height: 'auto',        // Let height adjust automatically
    objectFit: 'contain',  // Maintain aspect ratio
    margin: '0 auto',      // Center horizontally
    display: 'block',       // Remove extra spacing
  }}
  onError={(e) => {
    console.log("Image failed to load:", e.target.src);
    e.target.src = "/default-content.gif";
  }}
              />
            </div>
            
            <div style={cardStyles.content}>
              <div style={cardStyles.contentType}>
                {content.contentType || content.type || "Content"}
              </div>
              
              {/* Poster Info Section */}
              <div style={cardStyles.posterInfo}>
                <img 
                  src={user?.profileImage || "/default-avatar.png"} 
                  alt={user?.username || "Unknown User"} 
                  style={cardStyles.posterAvatar}
                  onError={(e) => { e.target.src = "/default-avatar.png"; }}
                />
                <span style={cardStyles.posterName}>
                  {user?.fullName || user?.username || "Unknown User"}
                </span>
                <span style={cardStyles.posterDate}>
                  {formatDate(content.createdAt)}
                </span>
              </div>
              
              <h4 
                className="title-link"
                style={cardStyles.title} 
                onClick={() => handleCardClick("content", content._id)}
              >
                {content.processedTitle || "Untitled"}
              </h4>
              <p style={cardStyles.description}>{truncateText(content.processedDescription, 100)}</p>
              
              <div style={cardStyles.stats}>
                <div style={cardStyles.statItem}>
                  <span style={cardStyles.emojiHeart}>❤</span>
                  <span>{content.likes?.length || 0}</span>
                </div>
                <div style={cardStyles.statItem}>
                  <span style={cardStyles.emojiComment}>🗨</span>
                  <span>{content.comments?.length || 0}</span>
                </div>
                
                {/* Save button with proper click handler */}
                <div 
                  className="stat-item-clickable"
                  style={{...cardStyles.statItem, cursor: 'pointer'}}
                  onClick={(e) => handleSaveContent(content._id, e)}
                >
                  <span style={cardStyles.emojiSave}>✚</span>
                  <span>{userHasSaved ? 'Saved' : 'Save'}</span>
                </div>
                
                {/* Repost button with proper click handler */}
                <div 
                  className="stat-item-clickable"
                  style={{...cardStyles.statItem, cursor: 'pointer'}}
                  onClick={(e) => handleRepostModal(content._id, e)}
                >
                  <span style={cardStyles.emojiRepost}>🗘</span>
                  <span>{userHasReposted ? 'Reposted' : 'Repost'}</span>
                </div>
              </div>
              
              {/* Read More section - make only this clickable */}
              <div 
                className="read-more-link"
                style={{...cardStyles.readMore, cursor: 'pointer'}}
                onClick={() => handleCardClick("content", content._id)}
              >
                Read More
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Render the repost modal */}
      <RepostModal />
    </div>
  );
  
// RenderPagination function that hides pagination for fewer than 50 items
const renderPagination = () => {
  // Get filtered content count based on active filter
  const filteredContentCount = activeFilter === "All" 
    ? totalItems 
    : filteredContents.filter(item => {
        if (activeFilter === "Profiles") return false; // Profiles aren't counted in content
        const contentType = getContentTypeFromFilter(activeFilter);
        return (item.type === contentType || item.contentType === contentType);
      }).length;
  
  // Hide pagination if fewer than 50 items after filtering or only 1 page
  if (filteredContentCount < 50 || totalPages <= 1) {
    return null;
  }
  
  // Create an array of page numbers with improved logic for large datasets
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  // Add first page indicator
  if (startPage > 1) {
    pageNumbers.push(1);
    if (startPage > 2) {
      pageNumbers.push('...');
    }
  }
  
  // Add numbered pages
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  // Add last page indicator
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    pageNumbers.push(totalPages);
  }
  
  return (
    <div style={cardStyles.pagination}>
      <span style={cardStyles.paginationInfo}>
        Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
      </span>
      
      <button 
        style={{...cardStyles.pageButton, opacity: currentPage === 1 ? 0.5 : 1}}
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
      >
        &laquo; First
      </button>
      
      <button 
        style={{...cardStyles.pageButton, opacity: currentPage === 1 ? 0.5 : 1}}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt; Prev
      </button>
      
      {pageNumbers.map((number, index) => (
        number === '...' ? (
          <span key={`ellipsis-${index}`} style={{margin: '0 5px'}}>...</span>
        ) : (
          <button
            key={`page-${number}`}
            style={{
              ...cardStyles.pageButton,
              ...(number === currentPage ? cardStyles.activePageButton : {})
            }}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </button>
        )
      ))}
      
      <button 
        style={{...cardStyles.pageButton, opacity: currentPage === totalPages ? 0.5 : 1}}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next &gt;
      </button>
      
      <button 
        style={{...cardStyles.pageButton, opacity: currentPage === totalPages ? 0.5 : 1}}
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        Last &raquo;
      </button>
      
      <select 
        value={itemsPerPage}
        onChange={handleItemsPerPageChange}
        style={cardStyles.itemsPerPageSelect}
      >
        <option value={10}>10 per page</option>
        <option value={20}>20 per page</option>
        <option value={50}>50 per page</option>
        <option value={100}>100 per page</option>
      </select>
    </div>
  );
};

  const filteredUsers = isSearching ? searchResults.users : users;
  const filteredContents = isSearching ? searchResults.contents : contents;

  // Map the UI filter tabs to the actual content types in the database
  const getContentTypeFromFilter = (filter) => {
    const typeMap = {
      "Projects": "Project",
      "Jobs": "Job", 
      "Tutorials": "Tutorial",
      "Posts": "Post",
      "Events": "Event",
      "Books": "Books",
      "Questions": "Question",
    };
    return typeMap[filter] || filter;
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div>Loading dashboard...</div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-search-container">
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Search users, content or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Updated button to open modal instead of redirect */}
        <button onClick={handleOpenCreateModal} className="create-content-btn">
          + Create Content
        </button>
      </div>

      <div className="dashboard-nav-container">
        <div className="dashboard-tabs">
          {filterTabs.map(tab => (
            <span
              key={tab}
              className={activeFilter === tab ? "active" : ""}
              onClick={() => handleTabChange(tab)} // UPDATED: Use new handler here
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {["All", "Projects", "Jobs", "Tutorials", "Posts", "Events", "Books", "Questions"].includes(activeFilter) && filteredContents.length > 0 && (
        <div className="dashboard-section">
          <h3>Content</h3>
          {renderContents(
            activeFilter === "All"
              ? filteredContents
              : filteredContents.filter(item => {
                  const contentType = getContentTypeFromFilter(activeFilter);
                  return (item.type === contentType || item.contentType === contentType);
                })
          )}
        </div>
      )}

      {/* Render pagination controls */}
      {!isSearching && ["All", "Projects", "Jobs", "Tutorials", "Posts", "Events", "Books", "Questions"].includes(activeFilter) && renderPagination()}

      {isSearching && filteredUsers.length === 0 && filteredContents.length === 0 && (
        <div className="no-results">
          <p>No results found for "{searchQuery}"</p>
          <button onClick={() => setSearchQuery("")} className="clear-search-btn-text">
            Clear search
          </button>
        </div>
      )}

      {["All", "Profiles"].includes(activeFilter) && filteredUsers.length > 0 && (
        <div className="dashboard-section">
          <h3>Users</h3>
          {renderUsers(filteredUsers)}
        </div>
      )}

      {!isSearching && filteredContents.length === 0 && activeFilter !== "Profiles" && (
        <div className="no-content">
          <p>No {activeFilter !== "All" ? activeFilter.toLowerCase() : "content"} available.</p>
          <div className="no-content-options">
            <p>This could be happening because:</p>
            <ul>
              <li>There are no {activeFilter !== "All" ? activeFilter.toLowerCase() : "content"} items in the database</li>
              <li>The content exists but isn't being properly fetched</li>
              <li>You may need to create some {activeFilter !== "All" ? activeFilter.toLowerCase() : "content"}</li>
            </ul>
            
            <button 
              onClick={handleOpenCreateModalWithType.bind(null, getContentTypeFromFilter(activeFilter))}
              className="create-button"
            >
              Create {activeFilter !== "All" ? activeFilter.slice(0, -1).toLowerCase() : "content"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ImprovedDashboard;