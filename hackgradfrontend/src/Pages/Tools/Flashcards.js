import React, { useState, useEffect, useRef } from 'react';
import '../../styles/Flashcards.css';

const Flashcards = () => {
  // State for flashcards
  const [flashcards, setFlashcards] = useState([]);
  const [currentDeck, setCurrentDeck] = useState('default');
  const [decks, setDecks] = useState(['default']);
  
  // State for creating/editing flashcards
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [showNewDeckInput, setShowNewDeckInput] = useState(false);
  
  // State for studying flashcards
  const [isStudying, setIsStudying] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // State for printing
  const [isPrintView, setIsPrintView] = useState(false);
  const [printFormat, setPrintFormat] = useState('2x2'); // Options: '2x2', '3x3', '4x4', 'list'
  const [printIncludeAnswers, setPrintIncludeAnswers] = useState(true);
  const printableAreaRef = useRef(null);

  // Load flashcards from localStorage on initial render
  useEffect(() => {
    const savedDecks = localStorage.getItem('flashcard-decks');
    if (savedDecks) {
      setDecks(JSON.parse(savedDecks));
    }

    const savedFlashcards = localStorage.getItem('flashcards');
    if (savedFlashcards) {
      setFlashcards(JSON.parse(savedFlashcards));
    }
  }, []);

  // Save flashcards to localStorage when they change
  useEffect(() => {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  // Save decks to localStorage when they change
  useEffect(() => {
    localStorage.setItem('flashcard-decks', JSON.stringify(decks));
  }, [decks]);

  // Add a new flashcard
  const handleAddCard = () => {
    if (front.trim() === '' || back.trim() === '') {
      alert('Please enter both front and back text for the flashcard');
      return;
    }

    if (editIndex !== null) {
      // Update existing card
      const updatedFlashcards = [...flashcards];
      updatedFlashcards[editIndex] = { front, back, deck: currentDeck };
      setFlashcards(updatedFlashcards);
      setEditIndex(null);
    } else {
      // Add new card
      setFlashcards([...flashcards, { front, back, deck: currentDeck }]);
    }

    // Clear form
    setFront('');
    setBack('');
  };

  // Edit a flashcard
  const handleEditCard = (index) => {
    const card = flashcards[index];
    setFront(card.front);
    setBack(card.back);
    setEditIndex(index);
  };

  // Delete a flashcard
  const handleDeleteCard = (index) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this flashcard?');
    if (confirmDelete) {
      const updatedFlashcards = flashcards.filter((_, i) => i !== index);
      setFlashcards(updatedFlashcards);
    }
  };

  // Add a new deck
  const handleAddDeck = () => {
    if (newDeckName.trim() === '') {
      alert('Please enter a deck name');
      return;
    }

    if (decks.includes(newDeckName.trim())) {
      alert('A deck with this name already exists');
      return;
    }

    setDecks([...decks, newDeckName.trim()]);
    setCurrentDeck(newDeckName.trim());
    setNewDeckName('');
    setShowNewDeckInput(false);
  };

  // Delete a deck and all its cards
  const handleDeleteDeck = (deckName) => {
    if (deckName === 'default') {
      alert('Cannot delete the default deck');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete the "${deckName}" deck and all its cards?`);
    if (confirmDelete) {
      // Remove the deck
      const updatedDecks = decks.filter(deck => deck !== deckName);
      setDecks(updatedDecks);
      
      // Remove all cards in the deck
      const updatedFlashcards = flashcards.filter(card => card.deck !== deckName);
      setFlashcards(updatedFlashcards);
      
      // Set current deck to default if we're deleting the current deck
      if (currentDeck === deckName) {
        setCurrentDeck('default');
      }
    }
  };

  // Start studying the current deck
  const handleStartStudying = () => {
    setIsStudying(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  // Next card when studying
  const handleNextCard = () => {
    if (currentCardIndex < filteredFlashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // End of deck
      setIsStudying(false);
    }
  };

  // Previous card when studying
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  // Enter print view
  const handlePrintView = () => {
    setIsPrintView(true);
  };

  // Exit print view
  const handleExitPrintView = () => {
    setIsPrintView(false);
  };

  // Execute print
  const handlePrint = () => {
    const printContent = printableAreaRef.current;
    const originalContents = document.body.innerHTML;
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    
    // Add title for the print window
    printWindow.document.write(`
      <html>
        <head>
          <title>Flashcards - ${currentDeck}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .print-date {
              text-align: right;
              margin-bottom: 20px;
              font-size: 12px;
              color: #666;
            }
            .flashcards-grid {
              display: grid;
              grid-template-columns: repeat(${printFormat === '2x2' ? 2 : printFormat === '3x3' ? 3 : printFormat === '4x4' ? 4 : 1}, 1fr);
              gap: 16px;
              page-break-inside: auto;
            }
            .flashcard-item {
              border: 1px solid #ccc;
              padding: 16px;
              border-radius: 4px;
              page-break-inside: avoid;
              height: ${printFormat === 'list' ? 'auto' : '200px'};
              display: flex;
              flex-direction: column;
            }
            .card-content {
              display: flex;
              flex-direction: column;
              height: 100%;
            }
            .card-front {
              font-weight: bold;
              margin-bottom: ${printIncludeAnswers ? '12px' : '0'};
              font-size: 16px;
              flex: 1;
            }
            .card-back {
              border-top: ${printIncludeAnswers ? '1px dashed #ccc' : 'none'};
              padding-top: ${printIncludeAnswers ? '12px' : '0'};
              color: #333;
              display: ${printIncludeAnswers ? 'block' : 'none'};
            }
            .card-label {
              font-size: 10px;
              color: #999;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            @media print {
              body {
                padding: 0;
              }
              .flashcards-grid {
                gap: 8px;
              }
              .flashcard-item {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Flashcards: ${currentDeck}</h1>
          </div>
          <div class="print-date">
            Printed on ${new Date().toLocaleDateString()}
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Add small delay to ensure styles are applied
    setTimeout(() => {
      printWindow.print();
      // Some browsers close the window after printing, some don't
      // Only close the window if it's still open
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 500);
  };

  // Filter flashcards by current deck
  const filteredFlashcards = flashcards.filter(card => card.deck === currentDeck);

  // Sample flashcards for different subjects
  const sampleFlashcards = {
    "Programming": [
      { front: "What is a variable?", back: "A named storage location in memory that can hold a value.", deck: "Programming" },
      { front: "What is an array?", back: "A data structure that stores a collection of elements of the same type in contiguous memory locations.", deck: "Programming" },
      { front: "What is a function?", back: "A block of code that performs a specific task and can be reused throughout a program.", deck: "Programming" }
    ],
    "Biology": [
      { front: "What is photosynthesis?", back: "The process by which plants convert light energy into chemical energy to fuel their activities.", deck: "Biology" },
      { front: "What is cellular respiration?", back: "The process by which cells break down glucose to release energy in the form of ATP.", deck: "Biology" },
      { front: "What is DNA?", back: "Deoxyribonucleic acid, a molecule that carries the genetic instructions for growth, development, and function of living organisms.", deck: "Biology" }
    ]
  };

  // Load sample flashcards
  const loadSampleFlashcards = (subject) => {
    if (sampleFlashcards[subject]) {
      // Add the deck if it doesn't exist
      if (!decks.includes(subject)) {
        setDecks([...decks, subject]);
      }
      
      // Add the flashcards
      const newFlashcards = [...flashcards];
      sampleFlashcards[subject].forEach(card => {
        // Check if the card already exists to avoid duplicates
        const exists = newFlashcards.some(
          existingCard => 
            existingCard.front === card.front && 
            existingCard.back === card.back && 
            existingCard.deck === card.deck
        );
        
        if (!exists) {
          newFlashcards.push(card);
        }
      });
      
      setFlashcards(newFlashcards);
      setCurrentDeck(subject);
    }
  };

  // Render print view
  if (isPrintView) {
    return (
      <div className="print-view-container">
        <div className="print-header">
          <h2 className="print-title">Print Flashcards: {currentDeck}</h2>
          <div className="print-actions">
            <button
              onClick={handleExitPrintView}
              className="back-btn"
            >
              Back to Editor
            </button>
            <button
              onClick={handlePrint}
              className="print-btn-sm"
            >
              Print
            </button>
          </div>
        </div>
        
        <div className="print-options">
          <div className="print-options-grid">
            <div>
              <label className="print-select-label">Layout:</label>
              <select
                value={printFormat}
                onChange={(e) => setPrintFormat(e.target.value)}
                className="print-select"
              >
                <option value="2x2">2 cards per row (standard)</option>
                <option value="3x3">3 cards per row (compact)</option>
                <option value="4x4">4 cards per row (small)</option>
                <option value="list">List view (full width)</option>
              </select>
            </div>
            <div>
              <label className="print-select-label">Options:</label>
              <div className="print-checkbox-label">
                <input
                  type="checkbox"
                  id="include-answers"
                  checked={printIncludeAnswers}
                  onChange={(e) => setPrintIncludeAnswers(e.target.checked)}
                  className="print-checkbox"
                />
                <label htmlFor="include-answers">Include answers</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="print-preview">
          <h3 className="print-preview-title">Print Preview - {filteredFlashcards.length} cards</h3>
          
          <div ref={printableAreaRef}>
            <div 
              className={`print-grid grid-${printFormat}`}
            >
              {filteredFlashcards.map((card, index) => (
                <div 
                  key={index} 
                  className="print-card"
                  style={{ height: printFormat === 'list' ? 'auto' : '200px' }}
                >
                  <div className="print-card-content">
                    <div className="print-card-label">Question</div>
                    <div className="print-card-front">
                      {card.front}
                    </div>
                    {printIncludeAnswers && (
                      <>
                        <div className="print-card-label">Answer</div>
                        <div className="print-card-back">
                          {card.back}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="print-tip">
          <p>
            Tip: Use your browser's print settings to adjust page margins and other print options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {!isStudying ? (
        <>
          <div className="header">
            <h1>Flashcards Generator</h1>
            <div className="sample-select-container">
              <select
                className="sample-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    loadSampleFlashcards(e.target.value);
                    e.target.value = "";
                  }
                }}
              >
                <option value="" disabled>Load sample flashcards...</option>
                {Object.keys(sampleFlashcards).map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="deck-controls">
            <label className="deck-label">Current Deck:</label>
            <select
              className="deck-select"
              value={currentDeck}
              onChange={(e) => setCurrentDeck(e.target.value)}
            >
              {decks.map((deck) => (
                <option key={deck} value={deck}>{deck}</option>
              ))}
            </select>
            {currentDeck !== 'default' && (
              <button
                onClick={() => handleDeleteDeck(currentDeck)}
                className="delete-deck-btn"
              >
                Delete Deck
              </button>
            )}

            {!showNewDeckInput ? (
              <button
                onClick={() => setShowNewDeckInput(true)}
                className="add-deck-btn"
              >
                + Add New Deck
              </button>
            ) : (
              <div className="new-deck-form">
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="New deck name"
                  className="new-deck-input"
                />
                <button
                  onClick={handleAddDeck}
                  className="new-deck-add-btn"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowNewDeckInput(false);
                    setNewDeckName('');
                  }}
                  className="new-deck-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {filteredFlashcards.length > 0 && (
            <div className="action-buttons">
              <button
                onClick={handleStartStudying}
                className="study-btn"
              >
                Study This Deck ({filteredFlashcards.length} Cards)
              </button>
              
              <button
                onClick={handlePrintView}
                className="print-btn"
              >
                Print Flashcards
              </button>
            </div>
          )}

          <div className="flashcard-form">
            <h3>{editIndex !== null ? 'Edit Flashcard' : 'Add New Flashcard'}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Front:</label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Question or term"
                  className="form-textarea"
                  rows={4}
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Back:</label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Answer or definition"
                  className="form-textarea"
                  rows={4}
                ></textarea>
              </div>
            </div>
            <div className="form-actions">
              {editIndex !== null && (
                <button
                  onClick={() => {
                    setFront('');
                    setBack('');
                    setEditIndex(null);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleAddCard}
                className="add-card-btn"
              >
                {editIndex !== null ? 'Update Card' : 'Add Card'}
              </button>
            </div>
          </div>

          <h3 className="flashcards-title">Flashcards in This Deck ({filteredFlashcards.length})</h3>
          {filteredFlashcards.length === 0 ? (
            <p className="flashcards-empty">No flashcards in this deck yet. Add some flashcards or load a sample deck.</p>
          ) : (
            <div className="flashcards-grid">
              {filteredFlashcards.map((card, index) => (
                <div key={index} className="flashcard-item">
                  <div className="flashcard-front">{card.front}</div>
                  <div className="flashcard-back">{card.back}</div>
                  <div className="flashcard-actions">
                    <button
                      onClick={() => handleEditCard(flashcards.indexOf(card))}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCard(flashcards.indexOf(card))}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="study-container">
          <div className="study-header">
            <h2 className="study-title">Studying: {currentDeck}</h2>
            <button
              onClick={() => setIsStudying(false)}
              className="exit-study-btn"
            >
              Exit Study Mode
            </button>
          </div>

          <div className="study-progress">
            <div>
              Card {currentCardIndex + 1} of {filteredFlashcards.length}
            </div>
          </div>

          <div className={`study-card ${showAnswer ? 'flipped' : ''}`} onClick={() => setShowAnswer(!showAnswer)}>
            <div className="study-card-inner">
              <div className="study-card-front">
                <div className="study-card-front-text">
                  {filteredFlashcards[currentCardIndex].front}
                </div>
              </div>
              <div className="study-card-back">
                <div className="study-card-back-text">
                  {filteredFlashcards[currentCardIndex].back}
                </div>
              </div>
            </div>
          </div>

          <div className="study-hint">
            Click the card to flip it
          </div>

          <div className="study-actions">
            <button
              onClick={handlePrevCard}
              disabled={currentCardIndex === 0}
              className="prev-btn"
            >
              Previous
            </button>
            <button
              onClick={handleNextCard}
              className="next-btn"
            >
              {currentCardIndex === filteredFlashcards.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      )}

      <div className="info-section">
        <h3 className="info-title">About this tool</h3>
        <p>Create flashcards to help memorize key concepts and test your knowledge. You can:</p>
        <ul className="info-list">
          <li>Create multiple decks for different subjects</li>
          <li>Study your flashcards in a friendly interface</li>
          <li>Print your flashcards for studying offline</li>
          <li>Load sample flashcards to get started quickly</li>
        </ul>
      </div>
    </div>
  );
};

export default Flashcards;