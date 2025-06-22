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
  // --- UNCHANGED MAP STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [chatWidth, setChatWidth] = useState(350);
  const [userLocation, setUserLocation] = useState(null);
  const [groceryStores, setGroceryStores] = useState([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const mapRef = useRef(null);
  const chatRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  
  // --- CHAT-SPECIFIC STATE ---
  const [messages, setMessages] = useState([
    { sender: 'agent', text: "Hello! How can I help you plan your shopping today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [preference, setPreference] = useState('balanced');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);


  // --- UNCHANGED MAP FUNCTIONS ---
  const fetchNearbyGroceryStores = async (lat, lon, radius = 2000) => {
    try {
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      const query = `
        [out:json];
        (
          node["shop"="supermarket"](around:${radius},${lat},${lon});
          node["shop"="grocery"](around:${radius},${lat},${lon});
          way["shop"="supermarket"](around:${radius},${lat},${lon});
          way["shop"="grocery"](around:${radius},${lat},${lon});
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
            lat = element.center.lat;
            lon = element.center.lon;
          } else if (element.nodes && element.nodes.length > 0) {
            const firstNode = data.elements.find(el => el.type === 'node' && el.id === element.nodes[0]);
            if (firstNode) {
              lat = firstNode.lat;
              lon = firstNode.lon;
            } else {
              return; 
            }
          } else {
            return;
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
  
  const sampleGroceryStores = [
    { id: 'sample-1', name: 'Whole Foods Market', lat: 37.9489, lon: -122.5472, tags: { 'addr:street': '720 Sir Francis Drake Blvd', 'addr:city': 'Kentfield', 'addr:postcode': '94904', phone: '(415) 925-9426', website: 'https://www.wholefoodsmarket.com', opening_hours: '8:00 AM - 10:00 PM', organic: 'Yes', rating: '4.5/5', description: 'High-end grocery chain with a focus on natural & organic food items, plus household goods.' }},
    { id: 'sample-2', name: 'Woodlands Market', lat: 37.9465, lon: -122.5421, tags: { 'addr:street': '720 College Ave', 'addr:city': 'Kentfield', 'addr:postcode': '94904', phone: '(415) 924-1520', website: 'https://www.woodlandsmarket.com', opening_hours: '7:00 AM - 9:00 PM', organic: 'Yes', rating: '4.7/5', description: 'Local market offering gourmet foods, organic produce & specialty items in a warm setting.' }},
    { id: 'sample-3', name: 'Trader Joe\'s', lat: 37.9542, lon: -122.5353, tags: { 'addr:street': '1599 S Novato Blvd', 'addr:city': 'Novato', 'addr:postcode': '94947', phone: '(415) 897-1125', website: 'https://www.traderjoes.com', opening_hours: '8:00 AM - 9:00 PM', organic: 'Partial', rating: '4.6/5', description: 'Grocery chain with a variety of signature items, plus produce, dairy & more.' }},
    { id: 'sample-4', name: 'Safeway', lat: 37.9520, lon: -122.5400, tags: { 'addr:street': '700 E Blithedale Ave', 'addr:city': 'Mill Valley', 'addr:postcode': '94941', phone: '(415) 388-7252', website: 'https://www.safeway.com', opening_hours: '6:00 AM - 12:00 AM', organic: 'Partial', rating: '4.2/5', description: 'Grocery store chain with a wide selection of food & household items, plus a pharmacy.' }},
    { id: 'sample-5', name: 'Mollie Stone\'s Market', lat: 37.9440, lon: -122.5480, tags: { 'addr:street': '414 Miller Ave', 'addr:city': 'Mill Valley', 'addr:postcode': '94941', phone: '(415) 388-3175', website: 'https://www.molliestones.com', opening_hours: '7:00 AM - 9:00 PM', organic: 'Yes', rating: '4.4/5', description: 'Upscale grocery store offering organic produce, a deli counter & a selection of wine & beer.' }},
    { id: 'sample-6', name: 'Good Earth Natural Foods', lat: 37.9580, lon: -122.5450, tags: { 'addr:street': '720 Center Blvd', 'addr:city': 'Fairfax', 'addr:postcode': '94930', phone: '(415) 453-0120', website: 'https://goodearthnaturalfoods.com', opening_hours: '7:00 AM - 9:00 PM', organic: 'Yes', rating: '4.6/5', description: 'Longtime natural foods market with organic produce, bulk foods, vitamins & a juice bar.' }},
    { id: 'sample-7', name: 'United Markets', lat: 37.9490, lon: -122.5300, tags: { 'addr:street': '555 E Blithedale Ave', 'addr:city': 'Mill Valley', 'addr:postcode': '94941', phone: '(415) 381-1500', website: 'https://www.unitedmarketsmarin.com', opening_hours: '6:00 AM - 11:00 PM', organic: 'Partial', rating: '4.3/5', description: 'Local grocery chain with a wide selection of natural & organic foods, plus a deli & bakery.' }},
  ];

  useEffect(() => {
    const address = '835 College Ave, Kentfield, CA 94904';
    const fetchData = async () => {
      setIsMapLoading(true);
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData && geocodeData[0]) {
          const { lat, lon } = geocodeData[0];
          const coordinates = [parseFloat(lat), parseFloat(lon)];
          setUserLocation(coordinates);
          
          const stores = await fetchNearbyGroceryStores(lat, lon);
          console.log('Found grocery stores:', stores);
          
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
        
        const stores = await fetchNearbyGroceryStores(
          MAP_CONFIG.defaultCoords[0], 
          MAP_CONFIG.defaultCoords[1]
        );
        console.log('Using default coordinates. Found stores:', stores);
        
        const storesToShow = stores.length > 0 ? stores : sampleGroceryStores;
        setGroceryStores(storesToShow);
        
        if (stores.length === 0) {
          console.warn('No grocery stores found with default coordinates. Using sample data.');
        }
        
        if (mapRef.current) {
          mapRef.current.flyTo(MAP_CONFIG.defaultCoords, MAP_CONFIG.defaultZoom);
        }
      } finally {
        setIsMapLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = chatRef.current.getBoundingClientRect().width;
  }, []);

  const resize = useCallback((e) => {
    if (!isResizing) return;
    
    const currentWidth = startWidth.current + e.clientX - startX.current;
    const minWidth = 280;
    const maxWidth = 500;
    
    const newWidth = Math.min(Math.max(currentWidth, minWidth), maxWidth);
    
    document.documentElement.style.setProperty('--chat-width', `${newWidth}px`);
    setChatWidth(newWidth);
  }, [isResizing]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);
  
  // --- MODIFIED CHAT FUNCTIONS ---

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userMessage = inputValue.trim();

    if (!userMessage || isChatLoading) return;

    // Add user message and set loading state
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setIsChatLoading(true);
    setInputValue('');

    try {
      // --- BACKEND INTEGRATION ---
      const response = await fetch('http://127.0.0.1:5001/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: userMessage,
          preference: preference
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add agent response
      setMessages(prev => [...prev, { sender: 'agent', text: data.recommendation }]);

    } catch (error) {
      console.error("Failed to fetch from backend:", error);
      setMessages(prev => [...prev, { sender: 'agent', text: `I'm sorry, I seem to be having a technical issue. Please try again.` }]);
    } finally {
      setIsChatLoading(false);
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

           {/* Preference selection for the chatbot */}
          <div className="preference-container">
            <fieldset>
              <legend>Recommendation Preference</legend>
              <div>
                <input type="radio" id="price" name="preference" value="price" checked={preference === 'price'} onChange={(e) => setPreference(e.target.value)} />
                <label htmlFor="price">Price</label>
              </div>
              <div>
                <input type="radio" id="balanced" name="preference" value="balanced" checked={preference === 'balanced'} onChange={(e) => setPreference(e.target.value)} />
                <label htmlFor="balanced">Balanced</label>
              </div>
              <div>
                <input type="radio" id="quality" name="preference" value="quality" checked={preference === 'quality'} onChange={(e) => setPreference(e.target.value)} />
                <label htmlFor="quality">Quality</label>
              </div>
            </fieldset>
          </div>
        
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
              {isChatLoading && (
                <div className="message agent loading">
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
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
                disabled={isChatLoading}
              />
              <button type="submit" className="send-button" disabled={isChatLoading}>
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
        {!isMapLoading && userLocation ? (
          <MapContainer 
            center={MAP_CONFIG.defaultCoords}
            zoom={MAP_CONFIG.defaultZoom}
            minZoom={MAP_CONFIG.minZoom}
            maxZoom={MAP_CONFIG.maxZoom}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => {
              mapRef.current = map;
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
            
            {showMarkers && groceryStores.map((store, index) => {
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
