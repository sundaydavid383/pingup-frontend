import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useSocket } from "../context/SocketContext";

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Optional: recenter map on first user
function Recenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords, map]);
  return null;
}

export default function LiveMap() {
  const { socket } = useSocket();
  const [userLocations, setUserLocations] = useState({});
  const mapRef = useRef();

  // Listen to location updates
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = ({ userId, coords }) => {
      setUserLocations((prev) => ({
        ...prev,
        [userId]: [coords[1], coords[0]], // Leaflet uses [lat, lng]
      }));
    };

    socket.on("userLocationUpdated", handleLocationUpdate);

    return () => {
      socket.off("userLocationUpdated", handleLocationUpdate);
    };
  }, [socket]);

  const firstCoords = Object.values(userLocations)[0] || [6.5622749, 3.3712688];

  // Force map to recalc size after mount
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      setTimeout(() => {
        map.invalidateSize();
      }, 100); // small delay ensures parent is rendered
    }
  }, [mapRef, userLocations]);

  return (
    <div className="w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] mb-6 rounded-xl overflow-hidden shadow-md border border-gray-200">
      <MapContainer
        center={firstCoords}
        zoom={15}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
        whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {Object.entries(userLocations).map(([userId, coords]) => (
          <Marker key={userId} position={coords}>
            <Popup>User ID: {userId}</Popup>
          </Marker>
        ))}

        <Recenter coords={firstCoords} />
      </MapContainer>
    </div>
  );
}
