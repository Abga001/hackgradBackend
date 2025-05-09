//ModalController for pop out windows
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * ModalController - Controls modal behavior throughout the application
 * This component intercepts route changes to display modals when appropriate
 */
const ModalController = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for route changes to handle modal behavior
  useEffect(() => {
    // Check if this route should be displayed as a modal
    const handleModalRoutes = () => {
      // Current path matches modal-compatible routes
      if (location.pathname === '/create') {
        // Check if navigated directly to this page (not via modal state)
        const isDirectNavigation = !location.state || location.state.modal !== true;
        
      }
    };

    handleModalRoutes();
  }, [location, navigate]);

  // The controller just manages behavior, it doesn't render anything visually
  return <>{children}</>;
};

export default ModalController;