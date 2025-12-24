import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* 🔥 FIX DEFAULT MARKER ICON */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function LiveMap({ open }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const mapRef = useRef(null);

  const [myCoords, setMyCoords] = useState(null);
  const [others, setOthers] = useState({});

  /* Track current user */
  useEffect(() => {
    if (!navigator.geolocation || !socket || !user) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setMyCoords([latitude, longitude]);

        socket.emit("updateLocation", {
          userId: user._id,
          coords: [longitude, latitude],
        });
      },
      (err) => console.error("Geo error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, user]);

  /* Listen for others */
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = ({ userId, coords }) => {
      setOthers((prev) => ({
        ...prev,
        [userId]: [coords[1], coords[0]],
      }));
    };

    socket.on("userLocationUpdated", handleUpdate);
    return () => socket.off("userLocationUpdated", handleUpdate);
  }, [socket]);

  /* 🔥 Recenter map on YOU */
  useEffect(() => {
    if (!mapRef.current || !myCoords) return;

    mapRef.current.flyTo(myCoords, 16, { animate: true });
  }, [myCoords]);

  /* Resize when modal opens */
  useEffect(() => {
    if (!mapRef.current || !open) return;

    setTimeout(() => {
      mapRef.current.invalidateSize();
    }, 150);
  }, [open]);

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[6.5244, 3.3792]} // fallback
        zoom={15}
        className="w-full h-full"
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* YOU */}
        {myCoords && <Marker position={myCoords} />}

        {/* OTHERS */}
        {Object.entries(others).map(([id, coords]) => (
          <Marker key={id} position={coords} />
        ))}
      </MapContainer>
    </div>
  );
}
