import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserRoundPen,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosBase from "../utils/axiosBase";
import "../styles/ui.css";
import BackButton from "../component/shared/BackButton";
import ProfileAvatar from "../component/shared/ProfileAvatar";
import CustomAlert from "../component/shared/CustomAlert"; // ✅ import your alert
import RightSidebar from "../component/RightSidebar";
import MediumSidebarToggle from "../component/shared/MediumSidebarToggle";

const Connections = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("Followers");
  const [data, setData] = useState({
    followers: [],
    following: [],
    connections: [],
    pendingConnections: [],
  });
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [alertData, setAlertData] = useState(null); // ✅ for showing custom alerts

  const { user, token, sponsors } = useAuth();

  // ✅ Show alert helper
  const showAlert = (message, type = "info") => {
    setAlertData({ message, type });
  };

  // ✅ Fetch connections
const fetchConnections = async () => {
  setLoading(true);

  try {
    const userId = user?._id;

    if (!token || !userId) {
      showAlert("Please log in again.", "warning");
      return;
    }

    const res = await axiosBase.get(`/api/user/connections?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = res?.data?.data || {};

    const formatted = {
      followers: data.followers || [],
      following: data.following || [],
      connections: data.connections || [],
      pendingConnections: data.pendingConnections || [],
    };

    // Update UI
    setData(formatted);

    // Save to localStorage for offline fallback
    localStorage.setItem(
      "springsconnect_connections_full",
      JSON.stringify(formatted)
    );

  } catch (error) {
    console.error("❌ Error fetching connections:", error);
    showAlert("Failed to load connections. Showing saved data.", "error");

    // FALLBACK: Load previous saved data
    const cached = localStorage.getItem("springsconnect_connections_full");

    if (cached) {
      setData(JSON.parse(cached));
    } else {
      // If nothing saved before
      setData({
        followers: [],
        following: [],
        connections: [],
        pendingConnections: [],
      });
    }

  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Accept connection
  const handleAccept = async (senderId) => {
    if (!user?._id || !token) {
      showAlert("Please log in again.", "warning");
      return;
    }

    try {
      setAcceptingId(senderId);

      const res = await axiosBase.get("/api/user/accept", {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId: user._id, id: senderId },
      });

      if (res.data.success) {
        showAlert("✅ Connection accepted successfully!", "success");
        await fetchConnections();
      } else {
        showAlert(res.data.message || "Failed to accept connection.", "error");
      }
    } catch (error) {
      console.error("❌ Error accepting connection:", error);
      showAlert("Something went wrong. Please try again.", "error");
    } finally {
      setAcceptingId(null);
    }
  };

  const dataArray = [
    { label: "Followers", value: data.followers, icon: Users },
    { label: "Following", value: data.following, icon: UserCheck },
    { label: "Pending", value: data.pendingConnections, icon: UserRoundPen },
    { label: "Connections", value: data.connections, icon: UserPlus },
  ];

  return (
 <div className="h-screen overflow-y-auto bg-slate-50 flex">
  <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
        <BackButton top="2" right="2" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 title">
            Connections
          </h1>
          <p className="text-slate-600">
            Manage your followers, friends, and pending requests.
          </p>
        </div>

        {/* ✅ Loader */}
        {loading ?
(
  <>
    {/* Counts Section Loader */}
    <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center text-center gap-2
                     border border-gray-200 bg-gray-200 rounded-xl p-3 sm:p-4
                     w-full min-h-[120px] animate-pulse"
        >
          <div className="w-6 h-6 bg-gray-300 rounded-full mb-1" />
          <div className="w-10 h-6 bg-gray-300 rounded-md" />
          <div className="w-16 h-4 bg-gray-300 rounded-md mt-1" />
        </div>
      ))}
    </div>

    {/* Tabs Loader */}
    <div className="flex flex-wrap justify-center gap-2 border border-gray-200
                    rounded-md p-2 bg-white shadow-sm max-w-full mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-center gap-1 px-4 py-2 w-[140px] sm:w-[150px] md:w-[160px]
                     bg-gray-200 rounded-md animate-pulse"
        />
      ))}
    </div>

    {/* Connections Cards Loader */}
    <div className="flex flex-wrap gap-6 mt-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="w-[320px] flex gap-4 p-4 bg-gray-200 rounded-xl animate-pulse"
        >
          {/* Avatar */}
          <div className="w-12 h-12 bg-gray-300 rounded-full shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="w-24 h-4 bg-gray-300 rounded-md mb-1" />
            <div className="w-32 h-3 bg-gray-300 rounded-md mt-1" />
            <div className="flex gap-2 mt-4">
              <div className="w-20 h-6 bg-gray-300 rounded-md" />
              <div className="w-20 h-6 bg-gray-300 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
)
: (
          <>
            {/* Counts Section */}
            <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 justify-center">
              {dataArray.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center text-center
                gap-2 border border-gray-200 bg-white shadow hover:shadow-md 
                rounded-xl p-3 sm:p-4 transition-all duration-200 
                w-full min-h-[120px] break-words"
                >
                  <item.icon className="w-6 h-6 text-[var(--primary)] mb-1 shrink-0" />
                  <b className="text-lg sm:text-2xl md:text-3xl text-slate-900 break-words">
                    {item.value?.length || 0}
                  </b>
                  <p className="text-slate-600 text-xs sm:text-sm md:text-base font-medium break-words leading-tight">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div
              className="flex flex-wrap justify-center gap-2 border border-gray-200
              rounded-md p-2 bg-white shadow-sm max-w-full"
            >
              {dataArray.map((tab) => (
                <button
                  onClick={() => setCurrentTab(tab.label)}
                  key={tab.label}
                  className={`flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium
                  rounded-md whitespace-normal w-[140px] sm:w-[150px] md:w-[160px]
                  transition-colors duration-200 ${
                    currentTab === tab.label
                      ? "bg-[var(--primary)] text-white"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="text-center leading-tight">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex flex-wrap gap-6 mt-6 ">
              {dataArray
                .find((item) => item.label === currentTab)
                ?.value?.map((user) => (
                  <div
                    key={user._id}
                    className="w-[320px] flex gap-4 p-4 bg-white shadow-md rounded-xl 
                      hover:shadow-lg transition-all"
                  >
                    {/* Avatar */}
                    <div onClick={() => navigate(`/profile/${user?._id}`)}>
                      <ProfileAvatar
                        user={{
                          name: user?.name || "User",
                          profilePicUrl: user?.profilePicUrl,
                          profilePicBackground: user?.profilePicBackground,
                        }}
                        size={48}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 break-words leading-snug">
                        {user.username}
                      </p>

                      <p className="text-sm text-gray-600 break-words leading-tight mt-1">
                        {user.bio ? user.bio : "No bio yet"}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => navigate(`/profile/${user._id}`)}
                          className="btn"
                        >
                          View Profile
                        </button>

                 {/* ✅ Show Accept button only if it's an incoming request */}
{currentTab === "Pending" && user.direction === "incoming" && (
  <button
    onClick={() => handleAccept(user._id)}
    disabled={acceptingId === user._id}
    className={`btn bg-green-600 text-white hover:bg-green-700 ${
      acceptingId === user._id
        ? "opacity-60 cursor-not-allowed"
        : ""
    }`}
  >
    {acceptingId === user._id ? "Accepting..." : "Accept"}
  </button>
)}


                        {currentTab === "Connections" && (
                          <button
                            onClick={() => navigate(`/chatbox/${user._id}`)}
                            className="btn flex items-center gap-1"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ✅ CustomAlert (rendered last so it overlays) */}
        {alertData && (
          <CustomAlert
            message={alertData.message}
            type={alertData.type}
            onClose={() => setAlertData(null)}
          />
        )}
      </div>
                 {/* Sidebar */}
            <RightSidebar sponsors={sponsors} loading={!sponsors} />
      
              {/* Sidebar toggle (medium screens) */}
        <MediumSidebarToggle sponsors={sponsors} />
    </div>
  );
};

export default Connections;
