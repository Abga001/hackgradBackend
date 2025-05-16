import React, { useState, useEffect, useRef } from "react";
import '../../styles/PomodoroTimer.css';

export default function Pomodoro() {
  // Timer state
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timerMode, setTimerMode] = useState("pomodoro"); // pomodoro, shortBreak, longBreak
  const [displayMessage, setDisplayMessage] = useState(false);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [pomodoroLength, setPomodoroLength] = useState(25);
  const [shortBreakLength, setShortBreakLength] = useState(5);
  const [longBreakLength, setLongBreakLength] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false);
  const [alarmSound, setAlarmSound] = useState("Bell");
  const [volume, setVolume] = useState(50);
  
  // Stats
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  
  // Refs for storing timer functionality
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize timer based on mode
  useEffect(() => {
    resetTimer();
  }, [timerMode, pomodoroLength, shortBreakLength, longBreakLength]);

  // Timer logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
          } else {
            setSeconds(59);
            setMinutes(minutes - 1);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, seconds, minutes]);

  // Handle timer completion
  const handleTimerComplete = () => {
    playAlarmSound();
    
    if (timerMode === "pomodoro") {
      setCompletedPomodoros(prev => prev + 1);
      
      // Determine next break type
      const isLongBreakDue = completedPomodoros > 0 && (completedPomodoros + 1) % longBreakInterval === 0;
      const nextMode = isLongBreakDue ? "longBreak" : "shortBreak";
      
      // Auto-start break if enabled
      if (autoStartBreaks) {
        setTimerMode(nextMode);
        setIsActive(true);
      } else {
        setTimerMode(nextMode);
        setIsActive(false);
      }
      
      setDisplayMessage(true);
    } else {
      // Break timer completed
      if (autoStartPomodoros) {
        setTimerMode("pomodoro");
        setIsActive(true);
      } else {
        setTimerMode("pomodoro");
        setIsActive(false);
      }
      
      setDisplayMessage(false);
    }
  };

  // Play alarm sound
  const playAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.play();
    }
  };

  // Format time display
  const formatTime = () => {
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const displaySeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${displayMinutes}:${displaySeconds}`;
  };

  // Reset timer based on current mode
  const resetTimer = () => {
    clearInterval(intervalRef.current);
    
    switch (timerMode) {
      case "pomodoro":
        setMinutes(pomodoroLength);
        break;
      case "shortBreak":
        setMinutes(shortBreakLength);
        break;
      case "longBreak":
        setMinutes(longBreakLength);
        break;
      default:
        setMinutes(pomodoroLength);
    }
    
    setSeconds(0);
    setIsActive(false);
  };

  // Skip to next timer
  const skipTimer = () => {
    if (timerMode === "pomodoro") {
      const isLongBreakDue = completedPomodoros > 0 && (completedPomodoros + 1) % longBreakInterval === 0;
      setTimerMode(isLongBreakDue ? "longBreak" : "shortBreak");
      if (isLongBreakDue) {
        setCompletedPomodoros(prev => prev + 1);
      }
    } else {
      setTimerMode("pomodoro");
    }
    
    setIsActive(false);
  };

  // Handle settings form submission
  const saveSettings = (e) => {
    e.preventDefault();
    setShowSettings(false);
    resetTimer();
  };

  // Get message text based on current mode
  const getMessageText = () => {
    if (timerMode === "shortBreak") return "Short break time!";
    if (timerMode === "longBreak") return "Long break time! You've earned it!";
    return "Focus time!";
  };

  // Get background color based on current mode
  const getBackgroundColor = () => {
    switch (timerMode) {
      case "pomodoro": return "#1e212d";
      case "shortBreak": return "#2d3748";
      case "longBreak": return "#1a202c";
      default: return "#1e212d";
    }
  };

  // Apply background color to body
  useEffect(() => {
    document.body.style.backgroundColor = getBackgroundColor();
    return () => {
      document.body.style.backgroundColor = "#1e212d";
    };
  }, [timerMode]);

  // Main app UI
  return (
    <div className="pomodoro" style={{ backgroundColor: getBackgroundColor() }}>
      {/* Mode selection tabs */}
      <div className="mode-tabs">
        <button 
          className={timerMode === "pomodoro" ? "active" : ""} 
          onClick={() => setTimerMode("pomodoro")}
        >
          Pomodoro
        </button>
        <button 
          className={timerMode === "shortBreak" ? "active" : ""} 
          onClick={() => setTimerMode("shortBreak")}
        >
          Short Break
        </button>
        <button 
          className={timerMode === "longBreak" ? "active" : ""} 
          onClick={() => setTimerMode("longBreak")}
        >
          Long Break
        </button>
      </div>
      
      {/* Timer display */}
      <div className="message">
        <div>{getMessageText()}</div>
      </div>
      <div className="timer">
        {formatTime()}
      </div>
      
      {/* Timer controls */}
      <div className="controls">
        <button onClick={() => setIsActive(!isActive)}>
          {isActive ? "Pause" : "Start"}
        </button>
        <button onClick={resetTimer}>Reset</button>
        <button onClick={skipTimer}>Skip</button>
      </div>
      
      {/* Stats */}
      <div className="stats">
        Completed Pomodoros: {completedPomodoros}
      </div>
      
      {/* Settings button */}
      <div className="settings-toggle">
        <button onClick={() => setShowSettings(!showSettings)}>
          Settings
        </button>
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="settings-panel">
          <h2>Timer Settings</h2>
          <form onSubmit={saveSettings}>
            <div className="setting-item">
              <label htmlFor="pomodoro-length">Pomodoro Length (minutes)</label>
              <input
                id="pomodoro-length"
                type="number"
                min="1"
                max="60"
                value={pomodoroLength}
                onChange={(e) => setPomodoroLength(parseInt(e.target.value))}
              />
            </div>
            
            <div className="setting-item">
              <label htmlFor="short-break-length">Short Break Length (minutes)</label>
              <input
                id="short-break-length"
                type="number"
                min="1"
                max="30"
                value={shortBreakLength}
                onChange={(e) => setShortBreakLength(parseInt(e.target.value))}
              />
            </div>
            
            <div className="setting-item">
              <label htmlFor="long-break-length">Long Break Length (minutes)</label>
              <input
                id="long-break-length"
                type="number"
                min="1"
                max="60"
                value={longBreakLength}
                onChange={(e) => setLongBreakLength(parseInt(e.target.value))}
              />
            </div>
            
            <div className="setting-item">
              <label htmlFor="long-break-interval">Long Break Interval</label>
              <input
                id="long-break-interval"
                type="number"
                min="1"
                max="10"
                value={longBreakInterval}
                onChange={(e) => setLongBreakInterval(parseInt(e.target.value))}
              />
            </div>
            
            <div className="setting-item checkbox">
              <input
                id="auto-start-breaks"
                type="checkbox"
                checked={autoStartBreaks}
                onChange={(e) => setAutoStartBreaks(e.target.checked)}
              />
              <label htmlFor="auto-start-breaks">Auto-start Breaks</label>
            </div>
            
            <div className="setting-item checkbox">
              <input
                id="auto-start-pomodoros"
                type="checkbox"
                checked={autoStartPomodoros}
                onChange={(e) => setAutoStartPomodoros(e.target.checked)}
              />
              <label htmlFor="auto-start-pomodoros">Auto-start Pomodoros</label>
            </div>
            
            <div className="setting-item">
              <label htmlFor="alarm-sound">Alarm Sound</label>
              <select
                id="alarm-sound"
                value={alarmSound}
                onChange={(e) => setAlarmSound(e.target.value)}
              >
                <option value="Bell">Bell</option>
                <option value="Digital">Digital</option>
                <option value="Chime">Chime</option>
                <option value="None">None</option>
              </select>
            </div>
            
            <div className="setting-item">
              <label htmlFor="volume">Volume: {volume}%</label>
              <input
                id="volume"
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
              />
            </div>
            
            <div className="setting-controls">
              <button type="button" onClick={() => setShowSettings(false)}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}
      
      {/* Audio element for alarm sound */}
      <audio 
        ref={audioRef}
        src={`/sounds/${alarmSound.toLowerCase()}.mp3`}
      />
    </div>
  );
}