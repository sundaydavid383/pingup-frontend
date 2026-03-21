import React, { useContext, useEffect, useState } from "react";
import { Phone, PhoneOff, X } from "lucide-react";
import { CallContext } from "../../context/CallContext";

/**
 * IncomingCallModal
 * 
 * Appears when user receives an incoming call
 * Shows caller information and accept/reject buttons
 * With auto-dismiss after 30 seconds
 */

const IncomingCallModal = ({ onAccept, onReject }) => {
  const callContext = useContext(CallContext);
  const [timeLeft, setTimeLeft] = useState(30);

  const call = callContext && callContext.currentCall ? callContext.currentCall : null;

  // Debug: Log incoming call
  useEffect(() => {
    if (call) {
      console.log("📞 IncomingCallModal: Incoming call detected", {
        callId: call.callId,
        type: call.type,
        initiatorName: call.initiatorName,
        status: call.status
      });
    }
  }, [call]);

  useEffect(() => {
    if (!call || call.status !== (callContext && callContext.CALL_STATES && callContext.CALL_STATES.RINGING)) {
      return;
    }

    // Debug: Log timer start
    console.log("📞 IncomingCallModal: Starting countdown timer", { timeLeft: 30 });

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onReject) {
            onReject("missed");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [call?.status, callContext, onReject]);

  // Debug: Log accept/reject actions
  const handleAccept = () => {
    console.log("📞 IncomingCallModal: Accept button clicked", {
      callId: call?.callId,
      type: call?.type
    });
    if (onAccept) onAccept();
  };

  const handleReject = (reason) => {
    console.log("📞 IncomingCallModal: Reject button clicked", {
      callId: call?.callId,
      reason
    });
    if (onReject) onReject(reason);
  };

  if (!call || (callContext && callContext.CALL_STATES && call.status !== callContext.CALL_STATES.RINGING)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-pulse">
        {/* Caller Info */}
        <div className="flex flex-col items-center gap-4">
          {/* Profile Picture */}
          <div className="relative">
            <img
              src={call.initiatorImage || "https://via.placeholder.com/100"}
              alt={call.initiatorName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500"
            />
            {/* Call Type Badge */}
            <div className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-2">
              {call.type === "video" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <Phone size={20} />
              )}
            </div>
          </div>

          {/* Caller Name */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {call.initiatorName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {call.type === "video" ? "📹 Incoming Video Call" : "📞 Incoming Audio Call"}
            </p>
          </div>

          {/* Timer */}
          <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {timeLeft}s
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 justify-center">
          {/* Reject */}
          <button
            onClick={() => onReject("declined")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
          >
            <PhoneOff size={20} />
            Reject
          </button>

          {/* Accept */}
          <button
            onClick={handleAccept}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
          >
            <Phone size={20} />
            Accept
          </button>
        </div>

        {/* Close button for accessibility */}
        <button
          onClick={handleReject("declined")}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

export default IncomingCallModal;
