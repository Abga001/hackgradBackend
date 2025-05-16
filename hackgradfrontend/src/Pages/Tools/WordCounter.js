import React, { useState, useEffect } from 'react';
import '../../styles/WordCounter.css'; // Import the CSS file

const WordCounter = () => {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: 0,
    speakingTime: 0
  });

  // Calculate stats whenever text changes
  useEffect(() => {
    // Don't calculate if text is empty
    if (!text.trim()) {
      setStats({
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: 0,
        speakingTime: 0
      });
      return;
    }

    // Calculate stats
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s+/g, '').length;
    
    // Words: split by whitespace and filter out empty strings
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Sentences: count periods, exclamation marks, and question marks followed by spaces or end of text
    const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
    
    // Paragraphs: count double newlines
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length || 1;
    
    // Reading time (based on average reading speed of 200-250 words per minute)
    const readingTime = words / 225;
    
    // Speaking time (based on average speaking speed of 150 words per minute)
    const speakingTime = words / 150;

    setStats({
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTime,
      speakingTime
    });
  }, [text]);

  // Format time to minutes and seconds
  const formatTime = (timeInMinutes) => {
    const minutes = Math.floor(timeInMinutes);
    const seconds = Math.round((timeInMinutes - minutes) * 60);
    
    if (minutes === 0) {
      return `${seconds} sec`;
    } else if (seconds === 0) {
      return `${minutes} min`;
    } else {
      return `${minutes} min ${seconds} sec`;
    }
  };

  // Handle text change
  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  // Handle clear text
  const handleClear = () => {
    setText('');
  };

  // Example preset texts
  const presets = [
    { name: "Short Paragraph", sample: "This is a short paragraph about writing. Good writing is clear, concise, and engaging. It communicates ideas effectively to the reader." },
    { name: "Essay Introduction", sample: "In this essay, I will explore the impact of digital technology on modern education. The rapid advancement of technology has transformed how students learn and how teachers teach. This analysis will cover three main aspects: accessibility, engagement, and outcomes." }
  ];

  // Load preset text
  const loadPreset = (sampleText) => {
    setText(sampleText);
  };

  return (
    <div className="word-counter-container">
      <div className="word-counter-header">
        <h2 className="word-counter-title">Word Counter</h2>
        <div className="word-counter-controls">
          <select 
            className="word-counter-select"
            onChange={(e) => e.target.value && loadPreset(presets.find(p => p.name === e.target.value).sample)}
            value=""
          >
            <option value="" disabled>Load sample text...</option>
            {presets.map((preset, index) => (
              <option key={index} value={preset.name}>{preset.name}</option>
            ))}
          </select>
          <button 
            onClick={handleClear}
            className="word-counter-button word-counter-button-clear"
          >
            Clear
          </button>
        </div>
      </div>
      
      <textarea
        className="word-counter-textarea"
        placeholder="Type or paste your text here..."
        value={text}
        onChange={handleTextChange}
      ></textarea>

      <div className="word-counter-stats">
        <div className="stat-card stat-words">
          <div className="stat-label">Words</div>
          <div className="stat-value">{stats.words}</div>
        </div>
        
        <div className="stat-card stat-characters">
          <div className="stat-label">Characters</div>
          <div className="stat-value">{stats.characters}</div>
        </div>
        
        <div className="stat-card stat-chars-no-spaces">
          <div className="stat-label">Characters (no spaces)</div>
          <div className="stat-value">{stats.charactersNoSpaces}</div>
        </div>
        
        <div className="stat-card stat-sentences">
          <div className="stat-label">Sentences</div>
          <div className="stat-value">{stats.sentences}</div>
        </div>
        
        <div className="stat-card stat-paragraphs">
          <div className="stat-label">Paragraphs</div>
          <div className="stat-value">{stats.paragraphs}</div>
        </div>
        
        <div className="stat-card stat-reading-time">
          <div className="stat-label">Reading Time</div>
          <div className="stat-value">{formatTime(stats.readingTime)}</div>
        </div>
        
        <div className="stat-card stat-speaking-time">
          <div className="stat-label">Speaking Time</div>
          <div className="stat-value">{formatTime(stats.speakingTime)}</div>
        </div>
      </div>

      <div className="word-counter-about">
        <h3 className="word-counter-about-title">About this tool</h3>
        <p>This word counter tool provides statistics about your text including word count, character count, and estimated reading time.</p>
        <ul className="word-counter-about-list">
          <li>Reading time is calculated based on an average reading speed of 225 words per minute.</li>
          <li>Speaking time is calculated based on an average speaking speed of 150 words per minute.</li>
        </ul>
      </div>
    </div>
  );
};

export default WordCounter;