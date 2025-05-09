import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Pages
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import CreateContent from "./components/Contents/CreateContent";
import ContentPage from "./components/Contents/ContentPage";
import Profile from "./Pages/Profile";
import UserProfile from "./Pages/UserProfile";
import ProfileEdit from "./Pages/ProfileEdit";
import Inbox from "./Pages/Inbox";
import Conversation from "./Pages/Conversation";
import NotFoundContent from "./components/Contents/NotFoundContent";
import ContentEdit from "./components/Contents/Editing/ContentEdit";
import CVProfileEditor from "./Pages/CVProfileEditor"; // Import CV Profile Editor
import CVProfileView from "./Pages/CVProfileView"; // Import CV Profile View
import CVArchive from "./Pages/CVArchive"; // Import CV Archive component

// Layout
import Layout from "./components/Layout";

// Components
import FloatingModal from "./components/FloatingModal";
import ModalController from "./components/ModalController";

// Services
import { authService } from "./apiService";

// Firebase Auth
import { authenticateWithFirebase } from "./firebaseConfig";

// Styles
import "./styles/index.css";
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faMagnifyingGlass, 
  faPenToSquare, 
  faPlus, 
  faEdit, 
  faTrash, 
  faCopy, 
  faCheck, 
  faEye, 
  faEyeSlash, 
  faDownload,
  faArchive,
  faFileAlt, faLightbulb, faCheckCircle, 
  faUserTie, faShareAlt
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faMagnifyingGlass, 
  faPenToSquare, 
  faPlus, 
  faEdit, 
  faTrash, 
  faCopy, 
  faCheck, 
  faEye, 
  faEyeSlash, 
  faDownload,
  faArchive,
  faFileAlt, faLightbulb, faCheckCircle, 
  faUserTie, faShareAlt
);

// Contexts
export const AuthContext = createContext();
export const UserContext = createContext();
export const SearchContext = createContext();
export const FollowingContext = createContext();
export const ModalContext = createContext();
export const CVContext = createContext(); // New context for CV Archive

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [refreshFollowing, setRefreshFollowing] = useState(false);
  
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalContentType, setModalContentType] = useState("Post");

  // CV Archive state
  const [cvArchive, setCVArchive] = useState([]);
  const [activeCV, setActiveCV] = useState(null);
  const [refreshCVArchive, setRefreshCVArchive] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // First check if token exists
        if (!authService.isAuthenticated()) {
          console.log("No token found, not authenticated");
          setIsAuthenticated(false);
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }
        
        // Only initiate Firebase auth after confirming the user is authenticated
        const userData = await authService.getCurrentUser();
        
        if (userData) {
          setCurrentUser(userData);
          setIsAuthenticated(true);
          
          // Move Firebase auth to a separate effect that runs only when needed
          setTimeout(() => authenticateWithFirebase(), 100);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    checkAuth();
  }, []);
  
  const logout = () => {
    // First remove token from localStorage
    authService.logout();
    
    // Then update the state
    setIsAuthenticated(false);
    setCurrentUser(null);
    
    // Force a page refresh to ensure all components are properly reset
    window.location.href = '/login';
  };

  // Open create modal with specific content type
  const openCreateModal = (contentType = "Post") => {
    setModalContentType(contentType);
    setIsCreateModalOpen(true);
  };

  // Close create modal
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const ProtectedRoute = ({ element }) => {
    if (isLoading) {
      return (
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      );
    }

    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  // Modal-aware route handler
  const ModalAwareRoute = ({ element, path }) => {
    // Get current location
    const location = useLocation();
    
    // Check if we should display this route as a modal
    const isModal = location.state?.modal === true;
    
    if (path === "/create" && isModal) {
      // Display dashboard content with modal overlay
      return <Dashboard />;
    }
    
    // Normal route display
    return element;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, logout }}>
      <UserContext.Provider value={{ currentUser, setCurrentUser }}>
        <SearchContext.Provider value={{ searchQuery, setSearchQuery, activeTab, setActiveTab }}>
          <FollowingContext.Provider value={{ refreshFollowing, setRefreshFollowing }}>
            <CVContext.Provider value={{
              cvArchive,
              setCVArchive,
              activeCV,
              setActiveCV,
              refreshCVArchive,
              setRefreshCVArchive
            }}>
              <ModalContext.Provider value={{ 
                isCreateModalOpen, 
                openCreateModal, 
                closeCreateModal,
                modalContentType,
                setModalContentType
              }}>
                <Router>
                  <ModalController>
                    {/* Floating Create Content Modal */}
                    <FloatingModal 
                      isOpen={isCreateModalOpen} 
                      onClose={closeCreateModal}
                      title="Create New Content"
                    >
                      {isAuthenticated && isCreateModalOpen && (
                        <CreateContent initialContentType={modalContentType} isModal={true} />
                      )}
                    </FloatingModal>

                    <Routes>
                      {/* Protected Routes inside Layout */}
                      <Route path="/" element={<Layout />}>
                        <Route index element={<ProtectedRoute element={<Dashboard />} />} />
                        <Route path="dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                        <Route path="create" element={<ProtectedRoute element={<ModalAwareRoute element={<CreateContent />} path="/create" />} />} />
                        <Route path="contents/:id" element={<ProtectedRoute element={<ContentPage />} />} />
                        <Route path="edit/:id" element={<ProtectedRoute element={<ContentEdit />} />} />
                        <Route path="profile" element={<ProtectedRoute element={<Profile />} />} />
                        <Route path="profile/:profileId" element={<ProtectedRoute element={<UserProfile />} />} />
                        <Route path="profile/edit" element={<ProtectedRoute element={<ProfileEdit />} />} />
                        <Route path="messages" element={<ProtectedRoute element={<Inbox />} />} />
                        <Route path="messages/:conversationId" element={<ProtectedRoute element={<Conversation />} />} />
                        
                        {/* CV Profile Routes */}
                        <Route path="cv" element={<ProtectedRoute element={<CVProfileView />} />} />
                        <Route path="cv/archive" element={<ProtectedRoute element={<CVArchive />} />} />
                        <Route path="cv/edit" element={<ProtectedRoute element={<CVProfileEditor />} />} />
                        <Route path="cv/edit/:id" element={<ProtectedRoute element={<CVProfileEditor />} />} />
                        <Route path="cv/:profileId" element={<ProtectedRoute element={<CVProfileView />} />} />
                        
                        <Route path="*" element={<ProtectedRoute element={<NotFoundContent />} />} />
                      </Route>

                      {/* Public Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
                    </Routes>
                  </ModalController>
                </Router>
              </ModalContext.Provider>
            </CVContext.Provider>
          </FollowingContext.Provider>
        </SearchContext.Provider>
      </UserContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;