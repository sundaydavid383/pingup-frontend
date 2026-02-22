import { useCallback, useState, useEffect } from "react";

/**
 * useRTCServers Hook
 * 
 * Provides STUN and TURN server configuration for WebRTC
 * STUN servers are free and help with NAT traversal
 * TURN servers are paid and required for P2P through restrictive NAT
 * 
 * Returns array of ICE server configurations for RTCPeerConnection
 */

const useRTCServers = () => {
  const [servers, setServers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Get STUN servers (free, built-in)
   */
  const getStunServers = useCallback(() => {
    return [
      { urls: ["stun:stun.l.google.com:19302"] },
      { urls: ["stun:stun1.l.google.com:19302"] },
      { urls: ["stun:stun2.l.google.com:19302"] },
      { urls: ["stun:stun3.l.google.com:19302"] },
      { urls: ["stun:stun4.l.google.com:19302"] },
      { urls: ["stun.stunprotocol.org:3478"] },
      { urls: ["stun.l.google.com:19302"] }
    ];
  }, []);

  /**
   * Get TURN servers from your backend
   * Your backend should provide TURN credentials
   */
  const getTurnServers = useCallback(async () => {
    try {
      // Call your backend to get temporary TURN credentials
      const response = await fetch("/api/webrtc/turn-servers", {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch TURN servers: ${response.status}`);
      }

      const data = await response.json();
      return data.iceServers || [];
    } catch (err) {
      console.warn("Could not fetch TURN servers:", err);
      // Return empty array - will fall back to STUN only
      return [];
    }
  }, []);

  /**
   * Initialize servers configuration
   */
  useEffect(() => {
    const initServers = async () => {
      try {
        setLoading(true);
        const stun = getStunServers();
        const turn = await getTurnServers();

        // Combine STUN and TURN servers
        const combined = [...stun, ...turn];
        setServers(combined);
      } catch (err) {
        console.error("Error initializing RTC servers:", err);
        setError(err.message);
        // Fallback to STUN only
        setServers(getStunServers());
      } finally {
        setLoading(false);
      }
    };

    initServers();
  }, [getStunServers, getTurnServers]);

  /**
   * Get ICE server configuration for RTCPeerConnection
   */
  const getIceServers = useCallback(() => {
    return servers || getStunServers();
  }, [servers, getStunServers]);

  return {
    servers: getIceServers(),
    loading,
    error,
    iceServers: getIceServers()
  };
};

export default useRTCServers;

/**
 * BACKEND IMPLEMENTATION GUIDE FOR TURN SERVERS
 * 
 * Endpoint: GET /api/webrtc/turn-servers
 * 
 * Example Node.js/Express implementation:
 * 
 * app.get("/api/webrtc/turn-servers", async (req, res) => {
 *   try {
 *     // Verify user is authenticated
 *     const user = req.user;
 *     if (!user) return res.status(401).json({ error: "Unauthorized" });
 * 
 *     // Use a TURN provider like Twilio, Xirsys, or your own TURN server
 *     // Example with Xirsys:
 * 
 *     const xirsysUrl = "https://api.xirsys.com/getToken";
 *     const xirsysRequest = {
 *       method: "POST",
 *       headers: {
 *         "authorization": "Bearer " + XIRSYS_JWT,
 *         "content-type": "application/json"
 *       },
 *       body: JSON.stringify({
 *         username: XIRSYS_USERNAME,
 *         secure: 1
 *       })
 *     };
 * 
 *     const response = await fetch(xirsysUrl, xirsysRequest);
 *     const data = await response.json();
 * 
 *     res.json({
 *       iceServers: data.d?.v?.iceServers || []
 *     });
 *   } catch (error) {
 *     console.error("Error getting TURN servers:", error);
 *     res.status(500).json({ error: "Failed to get TURN servers" });
 *   }
 * });
 * 
 * Alternative TURN providers:
 * 1. Xirsys (paid) - https://xirsys.com
 * 2. Twilio (paid) - https://twilio.com
 * 3. OpenRelay (free, limited) - https://openrelay.metered.ca
 * 4. Self-hosted (free but complex) - coturn
 * 
 * Example free TURN server response:
 * {
 *   iceServers: [
 *     {
 *       urls: ["turn:turnserver.example.com:3478"],
 *       username: "user123",
 *       credential: "pass123"
 *     }
 *   ]
 * }
 */
