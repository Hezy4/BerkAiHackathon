import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSun, FiMoon, FiMessageSquare, FiMap } from 'react-icons/fi';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [chatWidth, setChatWidth] = useState(350);
  const chatRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  
  // Toggle theme and save preference
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Handle mouse down on resizer
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = chatRef.current.getBoundingClientRect().width;
  }, []);

  // Handle mouse move during resize
  const resize = useCallback((e) => {
    if (!isResizing) return;
    
    const currentWidth = startWidth.current + e.clientX - startX.current;
    const minWidth = 280; // matches --min-chat-width in CSS
    const maxWidth = 500;  // matches --max-chat-width in CSS
    
    // Apply constraints
    const newWidth = Math.min(Math.max(currentWidth, minWidth), maxWidth);
    
    // Update the width
    document.documentElement.style.setProperty('--chat-width', `${newWidth}px`);
    setChatWidth(newWidth);
  }, [isResizing]);

  // Stop resizing
  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove event listeners for resizing
  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);
  
  // Check for saved theme preference or system preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your chatbot. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage = { 
        text: `I received: "${inputValue}"`,
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="app-container">
      {/* Chat Interface */}
      <div 
        className="chat-interface"
        ref={chatRef}
        style={{ width: `${chatWidth}px` }}
      >
        <div className="app">
          <header className="app-header">
            <h1>Grocery Assistant</h1>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle" 
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </button>
          </header>
        
          <div className="chat-container">
            <div className="messages">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.sender}`}
                >
                  {message.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="input-area">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
              />
              <button type="submit" className="send-button">
                <FiMessageSquare />
              </button>
            </form>
          </div>
        </div>
        <div 
          className="resizer"
          onMouseDown={startResizing}
        />
      </div>
      
      {/* Map Area */}
      <div className="map-container">
        <div className="map-placeholder">
          <FiMap size={48} />
          <p>Interactive Map Will Appear Here</p>
          <small>Drag the edge to resize the chat panel</small>
        </div>
      </div>
    </div>
  );
}

export default App;
