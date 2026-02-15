import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import UserPopupCard from "./UserPopupCard";
import "./LiveMap.css";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// SVG Icons
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const NavigationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const CompassIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36, color: 'var(--lm-text-muted)' }}>
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
  </svg>
);

// Component to handle map center updates
function MapCenterHandler({ center, zoom }) {
  const map = useMap();
  const hasCentered = useRef(false);
  
  useEffect(() => {
    if (!center || !Array.isArray(center) || center.length < 2) return;
    if (!map || typeof map.flyTo !== 'function') return;
    if (hasCentered.current) return;
    
    try {
      map.flyTo(center, zoom || 15, { 
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25
      });
      hasCentered.current = true;
    } catch (e) {
      console.warn('Map flyTo error:', e);
    }
  }, [center, zoom, map]);
  
  return null;
}

// Custom marker icon creator
const createUserMarker = (user, isCurrentUser = false) => {
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';
  
  const status = user?.isOnline ? 'online' : 
    (user?.lastActive && (Date.now() - new Date(user.lastActive).getTime()) < 300000) ? 'idle' : 'offline';
  
  if (isCurrentUser) {
    return new L.DivIcon({
      className: 'lm-marker lm-marker-current',
      html: user?.avatar 
        ? `<img src="${user.avatar}" alt="You" class="lm-avatar" />`
        : `<div class="lm-avatar-placeholder">${initials}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }
  
  return new L.DivIcon({
    className: `lm-marker lm-marker-user ${status}`,
    html: user?.avatar 
      ? `<img src="${user.avatar}" alt="${user.name || 'User'}" class="lm-avatar" />`
      : `<div class="lm-avatar-placeholder">${initials}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export default function LiveMap({ open }) {
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();
  const mapRef = useRef(null);
  const hasCentered = useRef(false);
  
  const [myCoords, setMyCoords] = useState(null);
  const [others, setOthers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'online', 'nearby'
  
  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyCoords([latitude, longitude]);
        setIsLoading(false);
        
        // Emit location to socket
        if (socket && currentUser) {
          socket.emit('updateLocation', {
            userId: currentUser._id,
            coords: [longitude, latitude]
          });
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [socket, currentUser]);
  
  // Listen for location updates from socket
  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = ({ userId, coords, userData }) => {
      const latlng = [coords[1], coords[0]];
      
      if (currentUser && userId === currentUser._id) {
        setMyCoords(latlng);
      } else {
        setOthers((prev) => ({
          ...prev,
          [userId]: {
            coords: latlng,
            ...userData
          }
        }));
      }
    };
    
    socket.on('userLocationUpdated', handleUpdate);
    return () => socket.off('userLocationUpdated', handleUpdate);
  }, [socket, currentUser]);
  
  // Center map on current user once
  useEffect(() => {
    if (!mapRef.current || !myCoords || hasCentered.current) return;
    
    mapRef.current.flyTo(myCoords, 15, { animate: true });
    hasCentered.current = true;
  }, [myCoords]);
  
  // Invalidate map size when modal opens
  useEffect(() => {
    if (!mapRef.current || !open) return;
    
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 200);
  }, [open]);
  
  // Filter users based on selected filter
  const filteredUsers = Object.entries(others).map(([id, data]) => ({ id, ...data })).filter((userData) => {
    if (filter === 'online') return userData.isOnline;
    // 'nearby' would filter by distance in real implementation
    return true;
  });
  
  // Calculate stats
  const onlineCount = Object.values(others).filter(u => u.isOnline).length;
  const idleCount = Object.values(others).filter(u => 
    u.lastActive && !u.isOnline && (Date.now() - new Date(u.lastActive).getTime()) < 300000
  ).length;
  const offlineCount = Object.keys(others).length - onlineCount - idleCount;
  
  // Handle marker click
  const handleMarkerClick = (userId, userData) => {
    setSelectedUser({
      _id: userId,
      ...userData
    });
  };
  
  // Handle location button click
  const handleLocateMe = useCallback(() => {
    if (myCoords && mapRef.current) {
      mapRef.current.flyTo(myCoords, 16, { animate: true });
    }
  }, [myCoords]);
  
  // Retry location
  const handleRetryLocation = () => {
    setLocationError(null);
    setIsLoading(true);
    window.location.reload();
  };
  
  return (
    <div className="livemap-container">
      <MapContainer
        center={[6.5244, 3.3792]}
        zoom={15}
        className="w-full h-full"
        whenCreated={(map) => (mapRef.current = map)}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        
        <MapCenterHandler center={myCoords} zoom={16} />
        
        {/* Current User Marker */}
        {myCoords && currentUser && (
          <Marker 
            position={myCoords} 
            icon={createUserMarker(currentUser, true)}
            eventHandlers={{
              click: () => setSelectedUser({
                _id: currentUser._id,
                name: currentUser.name,
                avatar: currentUser.avatar,
                bio: currentUser.bio
              })
            }}
          />
        )}
        
        {/* Other Users Markers */}
        {filteredUsers.map(([id, data]) => (
          <Marker 
            key={id}
            position={data.coords}
            icon={createUserMarker({ name: data.name, avatar: data.avatar, isOnline: data.isOnline, lastActive: data.lastActive })}
            eventHandlers={{
              click: () => handleMarkerClick(id, data)
            }}
          />
        ))}
        
        {/* Leaflet Popup (optional - we use custom popup) */}
        <Popup 
          closeButton={false}
          className="lm-custom-popup"
        >
        </Popup>
      </MapContainer>
      
      {/* Glass Control Panel - Top Left */}
      <div className="lm-control-panel">
        <div className="lm-panel-header">
          <div className="lm-panel-title">
            <MapPinIcon />
            <span>Live Map</span>
          </div>
          <span className="lm-user-count">
            <UsersIcon /> {Object.keys(others).length + (myCoords ? 1 : 0)}
          </span>
        </div>
        
        <div className="lm-panel-stats">
          <div className="lm-stat-item">
            <span className="lm-stat-dot online"></span>
            <span>{onlineCount} Online</span>
          </div>
          <div className="lm-stat-item">
            <span className="lm-stat-dot idle"></span>
            <span>{idleCount} Idle</span>
          </div>
          <div className="lm-stat-item">
            <span className="lm-stat-dot offline"></span>
            <span>{offlineCount} Offline</span>
          </div>
        </div>
      </div>
      
      {/* Floating Action Buttons - Top Right */}
      <div className="lm-fab-container">
        <button 
          className="lm-fab" 
          onClick={() => setFilter(filter === 'online' ? 'all' : 'online')}
          title={filter === 'online' ? 'Show all' : 'Show online only'}
          aria-label="Filter online users"
        >
          <FilterIcon />
        </button>
        
        <button 
          className="lm-fab" 
          title="Search nearby"
          aria-label="Search nearby"
        >
          <SearchIcon />
        </button>
        
        <button 
          className="lm-fab" 
          title="Refresh"
          aria-label="Refresh map"
        >
          <RefreshIcon />
        </button>
      </div>
      
      {/* Geolocation Button - Bottom Left */}
      <button 
        className="lm-geolocation-btn" 
        onClick={handleLocateMe}
        disabled={!myCoords}
        title="Center on my location"
        aria-label="Center on my location"
      >
        <NavigationIcon />
      </button>
      
      {/* Loading State */}
      {isLoading && (
        <div className="lm-loading-overlay">
          <div className="lm-loading-spinner"></div>
        </div>
      )}
      
      {/* Location Error State */}
      {locationError && !isLoading && (
        <div className="lm-error-state">
          <div className="lm-error-icon">
            <AlertCircleIcon />
          </div>
          <h3 className="lm-error-title">Location Access Required</h3>
          <p className="lm-error-text">{locationError}</p>
          <button className="lm-error-btn" onClick={handleRetryLocation}>
            Try Again
          </button>
        </div>
      )}
      
      {/* Empty State - No other users */}
      {!isLoading && !locationError && Object.keys(others).length === 0 && (
        <div className="lm-empty-state">
          <div className="lm-empty-icon">
            <CompassIcon />
          </div>
          <h3 className="lm-empty-title">No Users Nearby</h3>
          <p className="lm-empty-text">
            Be the first to share your location! Other members of the SpringssConnect community will appear here.
          </p>
        </div>
      )}
      
      {/* User Popup Card - Bottom Sheet */}
      {selectedUser && (
        <UserPopupCard 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onMessage={(user) => console.log('Message:', user)}
          onConnect={(user) => console.log('Connect:', user)}
          onViewProfile={(user) => console.log('View Profile:', user)}
        />
      )}
    </div>
  );
}
