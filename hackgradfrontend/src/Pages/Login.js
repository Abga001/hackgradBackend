//Login component on landing page
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext, UserContext } from "../App";
import { authService } from "../apiService";
import "../styles/Login.css";

const Login = () => {
  // Add a state to track which form to show (login or register)
  const [showLogin, setShowLogin] = useState(true);
  
  // Existing login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  // Add registration form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const { setCurrentUser } = useContext(UserContext);
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Effect for registration success countdown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prevCount => prevCount - 1);
      }, 1000);
    } else if (countdown === 0 && success) {
      // Switch to login form when countdown finishes
      setShowLogin(true);
      setSuccess(null);
    }
    
    return () => clearTimeout(timer);
  }, [countdown, success]);

  // Toggle between login and register forms
  const toggleForm = () => {
    setShowLogin(!showLogin);
    setError(null);
    setSuccess(null);
  };

  // Handle login form changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  // Handle registration form changes
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({ ...registerData, [name]: value });
  };

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await authService.login(loginData);
      
      // If we have user data in the response, update the user context
      if (response.user) {
        setCurrentUser(response.user);
      } else {
        // If no user data in response, fetch it separately
        try {
          const userData = await authService.getCurrentUser();
          if (userData) {
            setCurrentUser(userData);
          }
        } catch (userErr) {
          console.error("Error fetching user data after login:", userErr);
        }
      }
      
      // Update authentication state and navigate
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authService.register(registerData);
      
      // Set success message and start countdown
      setSuccess('Registration successful! Switching to login in 3 seconds...');
      setCountdown(3);
      
      // Clear form
      setRegisterData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="forest-background">
        <video className="forest-video" autoPlay loop muted playsInline>
          <source src="/forest.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Header */}
      <header className="login-header">
        <div className="logo">
          <img src="/HackGrad-Logo-4aw.png" alt="HackGrad Logo" className="logo-image" />
        </div>
        <nav className="nav-links">
          {/* <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/features" className="nav-link">Features</Link> */}
          <button onClick={toggleForm} className="signup-button">
            {showLogin ? "Sign Up" : "Login"}
          </button>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="login-main">
        {/* Content */}
        <div className="login-content">
          <div className="hero-section">
            <h1>The future belongs to those who build together.</h1>
            <p>Connect with other developers, share your projects, and build your tech career. One community. Endless growth. Unlimited possibilities.</p>
            <div className="cta-buttons">
              <button onClick={() => setShowLogin(false)} className="cta-button primary">Get Started</button>
              <a href="#learn-more" className="cta-button secondary">Learn More</a>
            </div>
          </div>
          
          <div className="login-form-wrapper">
            <h2>{showLogin ? "Login to your account" : "Create an account"}</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && (
              <div className="success-message">
                {success.replace('3', countdown)}
              </div>
            )}
            
            {showLogin ? (
              // Login Form
              <form onSubmit={handleLoginSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    disabled={isLoading}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    disabled={isLoading}
                    placeholder="Enter your password"
                  />
                </div>
                
                <div className="form-actions">
                  <div className="remember-me">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">Remember me</label>
                  </div>
                  <a href="#forgot-password" className="forgot-password">Forgot password?</a>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="login-button"
                >
                  {isLoading ? (
                    <span className="loading-spinner">
                      <span className="spinner-icon"></span>
                      Logging in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            ) : (
              // Registration Form
              <form onSubmit={handleRegisterSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    required
                    disabled={isLoading || success}
                    placeholder="Choose a username"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="reg-email">Email</label>
                  <input
                    type="email"
                    id="reg-email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    disabled={isLoading || success}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="reg-password">Password</label>
                  <input
                    type="password"
                    id="reg-password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    disabled={isLoading || success}
                    minLength={6}
                    placeholder="Create a password"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    disabled={isLoading || success}
                    placeholder="Confirm your password"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="login-button"
                  disabled={isLoading || success}
                >
                  {isLoading ? "Creating account..." : "Sign up"}
                </button>
              </form>
            )}
            
            <div className="login-footer">
              {showLogin ? (
                <>Don't have an account? <button onClick={toggleForm} className="register-link">Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={toggleForm} className="register-link">Login</button></>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;