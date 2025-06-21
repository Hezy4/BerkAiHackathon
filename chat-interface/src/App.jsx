import { useState, useRef, useEffect, useCallback } from 'react';
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
  
  // Fetch nearby grocery stores using Overpass API
  const fetchNearbyGroceryStores = async (lat, lon, radius = 2000) => {
    try {
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      const query = `
        [out:json];
        (
          node["shop"="supermarket"](around:${radius},${lat},${lon});
          node["shop"="grocery"](around:${radius},${lat},${lon});
          way["shop"="supermarket"](around:${radius},${lat},${lon});
          way["shop"="grocery"](around:${lat},${lon});
          relation["shop"="supermarket"](around:${radius},${lat},${lon});
          relation["shop"="grocery"](around:${radius},${lat},${lon});
        );
        out body;
        >;
        out skel qt;
      `;
      
      const response = await fetch(`${overpassUrl}?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Process the data to get unique stores with names and coordinates
      const stores = [];
      const seen = new Set();
      
      if (!data || !data.elements) {
        console.error('Unexpected API response format:', data);
        return [];
      }
      
      data.elements.forEach(element => {
        if (element.tags && element.tags.name) {
          let lat, lon;
          
          if (element.type === 'node') {
            lat = element.lat;
            lon = element.lon;
          } else if (element.center) {
            // For ways and relations, use the center point
            lat = element.center.lat;
            lon = element.center.lon;
          } else if (element.nodes && element.nodes.length > 0) {
            // Fallback: use the first node's coordinates
            const firstNode = data.elements.find(el => el.type === 'node' && el.id === element.nodes[0]);
            if (firstNode) {
              lat = firstNode.lat;
              lon = firstNode.lon;
            } else {
              return; // Skip if we can't get coordinates
            }
          } else {
            return; // Skip if we can't get coordinates
          }
          
          const storeKey = `${element.tags.name}-${lat}-${lon}`;
          
          if (!seen.has(storeKey)) {
            seen.add(storeKey);
            stores.push({
              id: element.id,
              name: element.tags.name,
              lat,
              lon,
              tags: element.tags
            });
          }
        }
      });
      
      return stores;
    } catch (error) {
      console.error('Error fetching grocery stores:', error);
      return [];
    }
  };
  
  // Sample grocery stores data for demonstration
  const sampleGroceryStores = [
    {
      id: 'sample-1',
      name: 'Whole Foods Market',
      lat: 37.9489,
      lon: -122.5472,
      tags: {
        'addr:street': '720 Sir Francis Drake Blvd',
        'addr:city': 'Kentfield',
        'addr:postcode': '94904',
        phone: '(415) 925-9426',
        website: 'https://www.wholefoodsmarket.com',
        opening_hours: '8:00 AM - 10:00 PM',
        organic: 'Yes',
        rating: '4.5/5',
        description: 'High-end grocery chain with a focus on natural & organic food items, plus household goods.'
      }
    },
    {
      id: 'sample-2',
      name: 'Woodlands Market',
      lat: 37.9465,
      lon: -122.5421,
      tags: {
        'addr:street': '720 College Ave',
        'addr:city': 'Kentfield',
        'addr:postcode': '94904',
        phone: '(415) 924-1520',
        website: 'https://www.woodlandsmarket.com',
        opening_hours: '7:00 AM - 9:00 PM',
        organic: 'Yes',
        rating: '4.7/5',
        description: 'Local market offering gourmet foods, organic produce & specialty items in a warm setting.'
      }
    },
    {
      id: 'sample-3',
      name: 'Trader Joe\'s',
      lat: 37.9542,
      lon: -122.5353,
      tags: {
        'addr:street': '1599 S Novato Blvd',
        'addr:city': 'Novato',
        'addr:postcode': '94947',
        phone: '(415) 897-1125',
        website: 'https://www.traderjoes.com',
        opening_hours: '8:00 AM - 9:00 PM',
        organic: 'Partial',
        rating: '4.6/5',
        description: 'Grocery chain with a variety of signature items, plus produce, dairy & more.'
      }
    },
    {
      id: 'sample-4',
      name: 'Safeway',
      lat: 37.9520,
      lon: -122.5400,
      tags: {
        'addr:street': '700 E Blithedale Ave',
        'addr:city': 'Mill Valley',
        'addr:postcode': '94941',
        phone: '(415) 388-7252',
        website: 'https://www.safeway.com',
        opening_hours: '6:00 AM - 12:00 AM',
        organic: 'Partial',
        rating: '4.2/5',
        description: 'Grocery store chain with a wide selection of food & household items, plus a pharmacy.'
      }
    }
  ];

  // Set the address location and fetch nearby grocery stores
  useEffect(() => {
    const address = '835 College Ave, Kentfield, CA 94904';
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get coordinates for the address
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData && geocodeData[0]) {
          const { lat, lon } = geocodeData[0];
          const coordinates = [parseFloat(lat), parseFloat(lon)];
          setUserLocation(coordinates);
          
          // Fetch nearby grocery stores
          const stores = await fetchNearbyGroceryStores(lat, lon);
          console.log('Found grocery stores:', stores);
          
          // Use sample data if no stores found or API fails
          const storesToShow = stores.length > 0 ? stores : sampleGroceryStores;
          setGroceryStores(storesToShow);
          
          if (stores.length === 0) {
            console.warn('No grocery stores found in the area. Using sample data.');
          }
          
          if (mapRef.current) {
            mapRef.current.flyTo(coordinates, 15);
          }
        } else {
          throw new Error('Address not found');
        }
      } catch (error) {
        console.error('Error:', error);
        setLocationError('Unable to load location data');
        setUserLocation(MAP_CONFIG.defaultCoords);
        
        // Try to fetch stores with default coordinates
        const stores = await fetchNearbyGroceryStores(
          MAP_CONFIG.defaultCoords[0], 
          MAP_CONFIG.defaultCoords[1]
        );
        console.log('Using default coordinates. Found stores:', stores);
        
        // Use sample data if no stores found or API fails
        const storesToShow = stores.length > 0 ? stores : sampleGroceryStores;
        setGroceryStores(storesToShow);
        
        if (stores.length === 0) {
          console.warn('No grocery stores found with default coordinates. Using sample data.');
        }
        
        if (mapRef.current) {
          mapRef.current.flyTo(MAP_CONFIG.defaultCoords, MAP_CONFIG.defaultZoom);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
              // Different colors for different stores
              const colors = [
                'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png'
              ];
              
              return (
                <Marker 
                  key={`${store.id}-${index}`}
                  position={[store.lat, store.lon]}
                  icon={new L.Icon({
                    ...DefaultIcon.options,
                    iconUrl: colors[index % colors.length],
                  })}
                >
                  <Popup className="store-popup">
                    <div className="store-popup-content">
                      <h3>{store.name}</h3>
                      <div className="store-details">
                        {store.tags.description && (
                          <p className="store-description">{store.tags.description}</p>
                        )}
                        <div className="store-address">
                          {store.tags['addr:street'] && (
                            <div>{store.tags['addr:street']}</div>
                          )}
                          {store.tags['addr:city'] && store.tags['addr:postcode'] && (
                            <div>{store.tags['addr:city']}, {store.tags['addr:postcode']}</div>
                          )}
                        </div>
                        <div className="store-info">
                          {store.tags.opening_hours && (
                            <div><strong>Hours:</strong> {store.tags.opening_hours}</div>
                          )}
                          {store.tags.rating && (
                            <div><strong>Rating:</strong> {store.tags.rating}</div>
                          )}
                          {store.tags.organic && (
                            <div><strong>Organic:</strong> {store.tags.organic}</div>
                          )}
                        </div>
                        <div className="store-contacts">
                          {store.tags.phone && (
                            <div className="contact-item">
                              <a href={`tel:${store.tags.phone}`} className="contact-link">
                                📞 {store.tags.phone}
                              </a>
                            </div>
                          )}
                          {store.tags.website && (
                            <div className="contact-item">
                              <a 
                                href={store.tags.website.startsWith('http') ? store.tags.website : `https://${store.tags.website}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="contact-link"
                              >
                                🌐 Visit Website
                              </a>
                            </div>
                          )}
                        </div>
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
                    Show Grocery Stores
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
