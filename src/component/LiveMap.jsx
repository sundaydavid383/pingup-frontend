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

/* 🔵 Custom icon for YOU */
const myIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:16px;
      height:16px;
      background:#2563eb;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 10px rgba(37,99,235,.8);
    "></div>
  `,
});

/* 🟢 Custom icon for OTHERS */
const otherIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:14px;
      height:14px;
      background:#22c55e;
      border:2px solid white;
      border-radius:50%;
    "></div>
  `,
});

export default function LiveMap({ open }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const mapRef = useRef(null);
  const hasCentered = useRef(false);

  const [myCoords, setMyCoords] = useState(null);
  const [others, setOthers] = useState({});

  /* 👂 Listen for location updates from socket */
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = ({ userId, coords }) => {
      const latlng = [coords[1], coords[0]];

      if (user && userId === user._id) {
        setMyCoords(latlng);
      } else {
        setOthers((prev) => ({
          ...prev,
          [userId]: latlng,
        }));
      }
    };

    socket.on("userLocationUpdated", handleUpdate);
    return () => socket.off("userLocationUpdated", handleUpdate);
  }, [socket, user]);

  /* 🎯 Center map on YOU only once */
  useEffect(() => {
    if (!mapRef.current || !myCoords || hasCentered.current) return;

    mapRef.current.flyTo(myCoords, 16, { animate: true });
    hasCentered.current = true;
  }, [myCoords]);

  /* 🧱 Fix map size when modal opens */
  useEffect(() => {
    if (!mapRef.current || !open) return;

    setTimeout(() => {
      mapRef.current.invalidateSize();
    }, 200);
  }, [open]);

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[6.5244, 3.3792]} // fallback (Lagos)
        zoom={15}
        className="w-full h-full"
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* 🔵 YOU */}
        {myCoords && <Marker position={myCoords} icon={myIcon} />}

        {/* 🟢 OTHERS */}
        {Object.entries(others).map(([id, coords]) => (
          <Marker key={id} position={coords} icon={otherIcon} />
        ))}
      </MapContainer>
    </div>
  );
}
