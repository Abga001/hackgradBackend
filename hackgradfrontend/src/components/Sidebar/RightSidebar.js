import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import { contentService } from '../../apiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faCalculator, 
  faCalendarAlt, 
  faCheckSquare, 
  faBook, 
  faCog,
  faFileAlt,
  faLightbulb,
  faCalendar,
  faClipboardList,
  faUserCog,
  faList,
  faWordpress,
  faBrain
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/RightSidebar.css';

const RightSidebar = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch all content
        const response = await fetch('http://localhost:3000/api/contents', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const allContents = data.contents || [];

          // Process different content types
          const processedContent = allContents.map(content => ({
            ...content,
            likes: content.likes || [],
            comments: content.comments || [],
            processedTitle: getContentTitle(content),
            processedImage: getContentImage(content),
            processedDescription: getContentDescription(content)
          }));

          // Get popular content (most likes) - one of each type
          const sortedByLikes = [...processedContent].sort(
            (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
          );

          // Group contents by their type
          const contentByType = {};
          sortedByLikes.forEach(content => {
            const type = content.contentType || content.type;
            if (!contentByType[type]) {
              contentByType[type] = [];
            }
            contentByType[type].push(content);
          });

          // Get top content from each category
          const topHighlights = [];
          
          // Create an event highlight
          if (contentByType.Event && contentByType.Event.length > 0) {
            topHighlights.push({
              ...contentByType.Event[0],
              cardType: 'event'
            });
          }
          
          // Create a job highlight
          if (contentByType.Job && contentByType.Job.length > 0) {
            topHighlights.push({
              ...contentByType.Job[0],
              cardType: 'job'
            });
          }
          
          // Create a project highlight
          if (contentByType.Project && contentByType.Project.length > 0) {
            topHighlights.push({
              ...contentByType.Project[0],
              cardType: 'project'
            });
          }
          
          // Create a post highlight
          if (contentByType.Post && contentByType.Post.length > 0) {
            topHighlights.push({
              ...contentByType.Post[0],
              cardType: 'post'
            });
          }

          // Add more if needed
          if (topHighlights.length < 4 && sortedByLikes.length > 0) {
            const typesAdded = topHighlights.map(h => h.contentType || h.type);
            
            // Add more popular content that's not already included
            sortedByLikes.forEach(content => {
              const type = content.contentType || content.type;
              if (!typesAdded.includes(type) && topHighlights.length < 4) {
                topHighlights.push({
                  ...content,
                  cardType: type.toLowerCase()
                });
                typesAdded.push(type);
              }
            });
          }

          setHighlights(topHighlights);
        }
      } catch (err) {
        console.error("Error fetching sidebar content:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();

    // Set up auto-rotate for carousel
    const highlightTimer = setInterval(() => {
      setHighlightIndex(prev => 
        highlights.length > 0 ? (prev + 1) % highlights.length : 0
      );
    }, 5000);

    return () => {
      clearInterval(highlightTimer);
    };
  }, []);

  // Helper functions for content display
  const getContentTitle = (content) => {
    if (content.title && typeof content.title === 'string') {
      return content.title;
    }
    
    const extraFields = content.extraFields || {};
    return extraFields.title || 
           extraFields.postTitle || 
           extraFields.tutorialTitle || 
           extraFields.jobTitle || 
           extraFields.eventTitle || 
           extraFields.projectTitle || 
           "Untitled";
  };

  const getContentImage = (content) => {
    if (content.image && typeof content.image === 'string') {
      if (content.image.startsWith('/uploads/')) {
        return `http://localhost:3000${content.image}`;
      }
      if (content.image.startsWith('http') || content.image.startsWith('data:')) {
        return content.image;
      }
      if (!content.image.startsWith('/')) {
        return `http://localhost:3000/uploads/${content.image}`;
      }
      return content.image;
    }
    
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

  const getContentDescription = (content) => {
    const extraFields = content.extraFields || {};
    return extraFields.description || "No description available";
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text) return "No description available";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const navigateCarousel = (direction) => {
    if (highlights.length === 0) return;
    
    if (direction === 'prev') {
      setHighlightIndex(prev => 
        prev === 0 ? highlights.length - 1 : prev - 1
      );
    } else {
      setHighlightIndex(prev => 
        (prev + 1) % highlights.length
      );
    }
  };

  // Render the current highlight
  const renderCurrentHighlight = () => {
    if (highlights.length === 0) {
      return (
        <div className="empty-carousel">
          <p>No highlights available</p>
        </div>
      );
    }

    const current = highlights[highlightIndex];
    const cardTypeColors = {
      event: '#FF6B6B',
      job: '#4ECDC4',
      project: '#FFD166',
      post: '#6A0572',
      tutorial: '#0077B6'
    };

    const defaultColor = '#4e54c8';
    const bgColor = cardTypeColors[current.cardType] || defaultColor;

    return (
      <Link to={`/contents/${current._id}`} className="highlight-card">
        <div className="highlight-image-container">
          <img 
            src={current.processedImage} 
            alt={current.processedTitle}
            onError={(e) => { e.target.src = "/default-content.gif"; }} 
          />
          <div className="highlight-overlay" style={{ backgroundColor: bgColor }}>
            <span className="highlight-type">
              {current.contentType || current.type}
            </span>
          </div>
        </div>
        <div className="highlight-content">
          <h3>{current.processedTitle}</h3>
          <p>{truncateText(current.processedDescription, 80)}</p>
          <div className="highlight-stats">
            <span>👍 {current.likes.length}</span>
            <span>💬 {current.comments.length}</span>
          </div>
        </div>
      </Link>
    );
  };

  // Render carousel indicators
  const renderIndicators = (activeIndex, total) => {
    if (total <= 1) return null;
    
    return (
      <div className="carousel-indicators">
        {Array.from({ length: total }).map((_, index) => (
          <button 
            key={index}
            className={`indicator ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setHighlightIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    );
  };

  // Updated Tools and Utilities section to match the image and file list
  const tools = [
    { name: 'AccountSettings', icon: faUserCog, link: '/tools/accountsettings' },
    { name: 'Calculator', icon: faCalculator, link: '/tools/calculator' },
    { name: 'Calendar', icon: faCalendar, link: '/tools/calendar' },
    { name: 'Flashcards', icon: faBrain, link: '/tools/flashcards' },
    { name: 'PomodoroTimer', icon: faClock, link: '/tools/pomodoro-timer' },
    { name: 'StudyScheduler', icon: faClipboardList, link: '/tools/study-scheduler' },
    { name: 'ToDoList', icon: faList, link: '/tools/todo-list' },
    { name: 'WageCalculator', icon: faCalculator, link: '/tools/wage-calculator' },
    { name: 'WordCounter', icon: faFileAlt, link: '/tools/word-counter' },
  ];

  return (
     <div className="right-sidebar">
    <div className="sidebar-section">
      <h2 className="section-title">Highlights</h2>
      
      <div className="carousel-container">
        {renderCurrentHighlight()}
        
        <div className="carousel-controls">
          <button 
            className="carousel-arrow prev"
            onClick={() => navigateCarousel('prev')}
            aria-label="Previous highlight"
          >
            &#10094;
          </button>
          <button 
            className="carousel-arrow next"
            onClick={() => navigateCarousel('next')}
            aria-label="Next highlight"
          >
            &#10095;
          </button>
        </div>
        
        {renderIndicators(highlightIndex, highlights.length)}
      </div>
    </div>
      
    <div className="sidebar-section tools-section">
      <h2 className="section-title">Tools & Utilities</h2>
      <div className="tools-list">
        {tools.map((tool, index) => (
          <Link key={index} to={tool.link} className="tool-link">
            <FontAwesomeIcon icon={tool.icon} className="tool-icon" />
            <span className="tool-name">{tool.name}</span>
          </Link>
        ))}
      </div>
    </div>
  </div>
);
};

export default RightSidebar;