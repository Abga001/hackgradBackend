import React, { useContext, useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios"; // Keep using axios directly
import { UserContext, FollowingContext, AuthContext, ModalContext } from "../../App";
import NavbarMessageIndicator from '../NavbarMessageIndicator';

import {
  HomeIcon,
  PlusCircleIcon,
  UserCircleIcon,
  IdentificationIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

import "../../styles/LeftSidebar.css";

const LeftSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(UserContext);
  const { refreshFollowing } = useContext(FollowingContext);
  const { logout } = useContext(AuthContext);
  const { openCreateModal } = useContext(ModalContext);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [hasCVProfile, setHasCVProfile] = useState(false);
  const [isLoadingCV, setIsLoadingCV] = useState(true);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(true);
  const sidebarRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [followingPerPage, setFollowingPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Similar to the approach in Profile.js - with direct API call to the user's specific endpoint
  const fetchFollowing = async () => {
    try {
      setIsLoadingFollowing(true);
      
      if (!currentUser || !currentUser._id) {
        console.log("No current user ID available, skipping following fetch");
        return;
      }
      
      // Log for debugging
      console.log("Fetching following users for ID:", currentUser._id);
      
      // Use the direct endpoint with userId parameter like in Profile.js
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3000/api/user/following/${currentUser._id}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Following API response:", response.data);
      setFollowingUsers(response.data || []);
      setTotalPages(Math.ceil((response.data?.length || 0) / followingPerPage));
    } catch (err) {
      console.error("Error fetching following list:", err);
      setFollowingUsers([]);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  // Update followingPerPage based on sidebar height
  useEffect(() => {
    const updateFollowingPerPage = () => {
      if (sidebarRef.current) {
        // Calculate available height
        const sidebarHeight = window.innerHeight - 320; // Approximate height for other elements
        // Each following item is approximately 50px tall
        const itemsPerPage = Math.max(5, Math.floor(sidebarHeight / 50));
        setFollowingPerPage(itemsPerPage);
        setTotalPages(Math.ceil(followingUsers.length / itemsPerPage));
      }
    };

    updateFollowingPerPage();
    window.addEventListener('resize', updateFollowingPerPage);
    return () => window.removeEventListener('resize', updateFollowingPerPage);
  }, [followingUsers.length, sidebarRef]);

  // Only fetch following when currentUser changes or refreshFollowing is triggered
  useEffect(() => {
    if (currentUser && currentUser._id) {
      fetchFollowing();
    }
  }, [currentUser, refreshFollowing]);

  // Check if user has CV profile
  useEffect(() => {
    const checkCVProfile = async () => {
      if (currentUser) {
        try {
          setIsLoadingCV(true);
          const token = localStorage.getItem("token");
          const res = await axios.get("http://localhost:3000/api/cv-profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setHasCVProfile(!!res.data);
        } catch (error) {
          // 404 error is expected if the user doesn't have a CV profile yet
          if (error.response && error.response.status === 404) {
            setHasCVProfile(false);
          } else {
            console.error("Error checking CV profile:", error);
            setHasCVProfile(false);
          }
        } finally {
          setIsLoadingCV(false);
        }
      }
    };
    
    checkCVProfile();
  }, [currentUser]);

  const handleSignOut = () => {
    logout();
  };

  const goToProfile = (userId) => {
    if (currentUser && userId === currentUser._id) {
      navigate("/profile");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  // Handle create button click to open modal instead of navigation
  const handleCreateClick = (e) => {
    e.preventDefault();
    openCreateModal();
  };

  // Pagination handlers
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get current following users for pagination
  const indexOfLastFollowing = currentPage * followingPerPage;
  const indexOfFirstFollowing = indexOfLastFollowing - followingPerPage;
  const currentFollowing = followingUsers.slice(indexOfFirstFollowing, indexOfLastFollowing);

  // Check if current path matches the link
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Check if path starts with the given prefix
  const isActivePrefix = (prefix) => {
    return location.pathname.startsWith(prefix) ? 'active' : '';
  };

  return (
    <div className="left-sidebar" ref={sidebarRef}>
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <img src="/HackGrad-Logo.png" alt="HackGrad Logo" className="logo-image logo-large" />
          <img src="/HackGrad-FSLogo.png" alt="HackGrad Logo" className="logo-image logo-small" />
        </Link>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
          <HomeIcon className="icon" /> 
          <span>Home</span>
        </Link>
        
        <button 
          onClick={handleCreateClick} 
          className={`sidebar-link sidebar-button ${isActive('/create')}`}
        >
          <PlusCircleIcon className="icon" /> 
          <span>Create</span>
        </button>
        
        <Link to="/messages" className={`sidebar-link ${isActivePrefix('/messages')}`}>
          <NavbarMessageIndicator userId={currentUser?._id} />
          <span>Messages</span>
        </Link>

        <Link to="/cv" className={`sidebar-link ${isActivePrefix('/cv')}`}>
          <IdentificationIcon className="icon" /> 
          <span>CV Profile {hasCVProfile && <span className="cv-status">✓</span>}</span>
        </Link>
        
        <Link to="/profile" className={`sidebar-link ${isActivePrefix('/profile')}`}>
          <UserCircleIcon className="icon" /> 
          <span>Profile</span>
        </Link>
      </nav>

      <div className="sidebar-section following-section">
        <div className="section-header">
          <h4 className="section-title">Following</h4>
          {followingUsers.length > followingPerPage && (
            <div className="pagination-controls">
              <button 
                onClick={prevPage} 
                disabled={currentPage === 1}
                className="pagination-button"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="pagination-icon" />
              </button>
              <span className="pagination-info">{currentPage}/{totalPages}</span>
              <button 
                onClick={nextPage} 
                disabled={currentPage === totalPages}
                className="pagination-button"
                aria-label="Next page"
              >
                <ChevronRightIcon className="pagination-icon" />
              </button>
            </div>
          )}
        </div>
        
        {isLoadingFollowing ? (
  <div className="loading-spinner">Loading...</div>
) : followingUsers.length > 0 ? (
  <ul className="following-list">
    {currentFollowing.map((user) => (
      // Make sure user has all required fields before rendering
      user && user._id ? (
        <li
          key={user._id}
          onClick={() => goToProfile(user._id)}
          className="following-item"
        >
          <img
            src={user.profileImage || "/default-avatar.png"}
            alt={user.username || "User"}
            className="following-avatar"
            onError={(e) => (e.target.src = "/default-avatar.png")}
          />
          <div className="following-info">
            <span className="following-name">{user.fullName || user.username || "User"}</span>
            <span className="following-handle">@{user.username || "user"}</span>
          </div>
        </li>
      ) : null // Skip rendering if user data is incomplete
    ))}
  </ul>
) : (
  <p className="sidebar-note">Follow users to see them here</p>
)}
      </div>

      <div className="sidebar-footer">
        <button onClick={handleSignOut} className="signout-btn">
          <div className="user-info">
            <img
              src={currentUser?.profileImage || "/default-avatar.png"}
              alt="Profile"
              className="profile-avatar"
              onError={(e) => (e.target.src = "/default-avatar.png")}
            />
            <div className="user-details">
              <span className="user-name">{currentUser?.fullName || currentUser?.username}</span>
              <span className="user-handle">@{currentUser?.username}</span>
            </div>
          </div>
          <div className="signout-section">
            <span className="signout-text">Sign Out</span>
            <ArrowRightOnRectangleIcon className="signout-icon" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;