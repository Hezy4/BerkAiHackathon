import { useState, useRef, useEffect, useCallback } from 'react';
// Import is no longer needed as we'll use stores.json
import { FiSun, FiMoon, FiMessageSquare } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Fix for default marker icons in Leaflet with Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Map configuration
const MAP_CONFIG = {
  defaultCoords: [37.9506, -122.5495], // Coordinates for 835 College Ave, Kentfield, CA
  defaultZoom: 15,
  minZoom: 14,
  maxZoom: 18,
  bounds: {
    southWest: [37.93, -122.57],
    northEast: [37.97, -122.53]
  }
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [chatWidth, setChatWidth] = useState(350);
  const [userLocation, setUserLocation] = useState(null);
  const [groceryStores, setGroceryStores] = useState([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef(null);
  const chatRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  
  // Load grocery stores from local JSON file
  const fetchLocalGroceryStores = async () => {
    try {
      const response = await fetch('/data/stores.json');
      if (!response.ok) {
        throw new Error('Failed to load stores data');
      }
      const data = await response.json();
      
      // Transform the data to match the expected format
      const stores = data.map(store => {
        // Create address parts from the location string
        const [street, ...cityParts] = store.location.split(',').map(s => s.trim());
        const city = cityParts.join(', ');
        
        // Use the store's tags if they exist, otherwise create default tags
        const tags = store.tags || {};
        
        return {
          id: store.id,
          name: store.name,
          lat: store.lat,
          lon: store.long, // Note: using 'long' from the JSON to match 'lon' in the app
          category: store.category,
          location: store.location,
          inventory: store.inventory || [],
          // Use the rating from tags if available, otherwise default to 4.0
          rating: tags.rating || 4.0,
          // Include all tags with proper structure
          tags: {
            description: tags.description || `${store.name} is a ${store.category} located at ${store.location}`,
            'addr:street': tags['addr:street'] || street,
            'addr:city': tags['addr:city'] || city,
            'addr:postcode': tags['addr:postcode'] || '94941',
            'opening_hours': tags['opening_hours'] || 'Mo-Su 08:00-22:00',
            'phone': tags['phone'] || store.phone || '(415) 555-1234',
            'website': tags['website'] || store.website || `https://${store.name.toLowerCase().replace(/\s+/g, '')}.com`
          }
        };
      });
      
      console.log('Loaded local stores:', stores);
      return stores;
    } catch (error) {
      console.error('Error loading local grocery stores:', error);
      return [];
    }
  };
  
  // Function to load grocery stores data from JSON file
  const loadGroceryStores = async () => {
    try {
      const response = await fetch('/data/stores.json');
      if (!response.ok) {
        throw new Error('Failed to load stores data');
      }
      const data = await response.json();
      setGroceryStores(data);
      return data;
    } catch (error) {
      console.error('Error loading grocery stores:', error);
      setGroceryStores([]);
      return [];
    }
  };
  
  // Load grocery stores data on component mount
  useEffect(() => {
    loadGroceryStores();
  }, []);

  // Load local grocery stores data
  useEffect(() => {
    const loadStores = async () => {
      setIsLoading(true);
      try {
        // Use default coordinates for the map center
        setUserLocation(MAP_CONFIG.defaultCoords);
        
        // Load stores from local JSON
        const stores = await fetchLocalGroceryStores();
        console.log('Loaded stores:', stores);
        
        if (stores.length > 0) {
          setGroceryStores(stores);
          
          // Center the map on the first store if available
          if (mapRef.current && stores[0]) {
            mapRef.current.flyTo([stores[0].lat, stores[0].lon], 15);
          }
        } else {
          console.warn('No stores found in the local data');
          setLocationError('No stores data available');
        }
      } catch (error) {
        console.error('Error loading stores:', error);
        setLocationError('Failed to load stores data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStores();
  }, []);

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
    { text: "Hello! I'm your grocery shopping assistant. What ingredients do you need help with today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call our Flask backend
      const response = await fetch('http://localhost:5001/api/converse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: inputValue,
          preference: 'balanced' // or get this from user input
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      // Add bot response
      const botMessage = { 
        text: data.response || "I'm not sure how to respond to that. Could you rephrase?",
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { 
        text: "Sorry, I'm having trouble connecting to the server. Please try again later.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
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
                  dangerouslySetInnerHTML={{ __html: message.text }}
                />
              ))}
              {isLoading && (
                <div className="message bot">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="input-area">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="spinner"></div>
                ) : (
                  <FiMessageSquare />
                )}
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
      <div className={`map-container ${isDarkMode ? 'dark' : ''}`}>
        {!isLoading && userLocation ? (
          <MapContainer 
            center={MAP_CONFIG.defaultCoords}
            zoom={MAP_CONFIG.defaultZoom}
            minZoom={MAP_CONFIG.minZoom}
            maxZoom={MAP_CONFIG.maxZoom}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => {
              mapRef.current = map;
              // Set up map bounds
              const bounds = L.latLngBounds(
                L.latLng(MAP_CONFIG.bounds.southWest[0], MAP_CONFIG.bounds.southWest[1]),
                L.latLng(MAP_CONFIG.bounds.northEast[0], MAP_CONFIG.bounds.northEast[1])
              );
              map.setMaxBounds(bounds);
              map.on('drag', function() {
                map.panInsideBounds(bounds, { animate: false });
              });
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={userLocation}>
              <Popup>
                <strong>Your Location</strong><br />
                835 College Ave<br />
                Kentfield, CA 94904
              </Popup>
            </Marker>
            
            {/* Grocery Store Markers */}
            {showMarkers && groceryStores.map((store, index) => {
              // Use red marker for all grocery stores
              const redMarker = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
              
              return (
                <Marker 
                  key={`${store.id}-${index}`}
                  position={[store.lat, store.lon]}
                  icon={new L.Icon({
                    ...DefaultIcon.options,
                    iconUrl: redMarker,
                  })}
                >
                  <Popup className="store-popup">
                    <div className="store-popup-content">
                      <div className="store-header">
                        <h3>{store.name}</h3>
                        <div className="store-rating">
                          <span className="rating-star">★</span> {store.rating.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="store-category">
                        <span className="category-tag">{store.category}</span>
                      </div>
                      
                      <div className="store-description-container">
                        <div className="store-description-icon">💬</div>
                        <p className="store-description">{store.tags.description}</p>
                      </div>
                      
                      <div className="store-details">
                        <div className="store-address">
                          <div className="address-icon">📍</div>
                          <div>
                            <div className="address-street">{store.tags['addr:street']}</div>
                            <div className="address-city">{store.tags['addr:city']}, {store.tags['addr:postcode']}</div>
                          </div>
                        </div>
                        
                        <div className="store-hours">
                          <div className="hours-icon">🕒</div>
                          <div>{store.tags.opening_hours}</div>
                        </div>
                        
                        <div className="store-contact">
                          <div className="contact-icon">📞</div>
                          <div>{store.tags.phone}</div>
                        </div>
                        
                        <div className="store-website">
                          <div className="website-icon">🌐</div>
                          <a href={store.tags.website} target="_blank" rel="noopener noreferrer">
                            {store.tags.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                      
                      <div className="store-actions">
                        <button 
                          className="action-button directions-button"
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`, '_blank')}
                        >
                          Directions
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            
            {/* Map Controls */}
            <div className="map-controls">
              <div className="map-control-panel">
                <h4>Map Controls</h4>
                <div className="control-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={showMarkers} 
                      onChange={(e) => setShowMarkers(e.target.checked)} 
                    />
                    Show Stores
                  </label>
                </div>
              </div>
            </div>
          </MapContainer>
        ) : (
          <div className="map-loading">
            {locationError || 'Loading map...'}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
