
import { useEffect, useState, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import AuthContainer from './pages/AuthContainer';
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import ChatBox from './pages/ChatBox';
import Connections from './pages/Connections';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import { useAuth } from "./context/AuthContext";
import Layout from './pages/Layout';
import UserModal from "./component/UserModal";
import { Toaster } from 'react-hot-toast';
import Notification from "./pages/Notification"
import Portfolio from './pages/Portfolio';
import ReloadNotice from './component/ReloadNotice';
import NotFound from './pages/NotFound';
import SinglePostPage from "./pages/SinglePostPage";
import ScriptureAssistant from './pages/spiritual_life_tracker/ScriptureAssistant';
import BibleReader from './pages/spiritual_life_tracker/BibleReader';
import AppInstallPrompt from './pages/AppInstallPrompt';
import AuthSuccess from "./pages/AuthSuccess";
import "./styles/ui.css"
import GlobalAudioModal from './component/shared/GlobalAudioModal';
import GlobalVideoModal from './component/shared/GlobalVideoModal';
import Settings from './pages/settings/Settings';
import AccountSettings from './pages/settings/AccountSettings';
import PrivacySafety from './pages/settings/PrivacySafety';
import Appearance from './pages/settings/Appearance';
import NotificationSettings from './pages/settings/NotificationSettings';
import PersonalInfo from './pages/settings/PersonalInfo';
import ContentPreferences from './pages/settings/ContentPreferences';
import HelpAbout from './pages/settings/HelpAbout';
import Spinning3DSphere from './component/Spinning3DSphere';
import LandingPage from './pages/LandingPage';
import CommunityPage from './pages/CommunityPage';
import AboutPage from './pages/AboutPage';
import CallContainer from './component/CallUI/CallContainer';
import GlobalPipModal from './component/GlobalPipModal';
const App = () => {
  const { user, modalOpen, setModalOpen } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const oauthError = searchParams.get('error');

  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthText, setOauthText] = useState("Loading…");


  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }

  useEffect(() => {
    const loading = sessionStorage.getItem("oauth_loading");
    const text = sessionStorage.getItem("oauth_text");

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js') // sw.js in public folder
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(err => {
          console.error('Service Worker registration failed:', err);
        });

      // Listen for messages from service worker (notification deep linking)
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📬 App received message from SW:', event.data);
        
        if (event.data && event.data.type) {
          switch (event.data.type) {
            case 'SCROLL_TO_MESSAGE':
              // Handle scroll to message from notification click
              console.log('📬 Need to scroll to message:', event.data.messageId);
              // Store the message ID to scroll to after chat loads
              sessionStorage.setItem('scrollToMessage', event.data.messageId);
              break;
            case 'REPLY_TO_MESSAGE':
              // Handle reply intent
              console.log('📬 Need to reply to message:', event.data.messageId);
              sessionStorage.setItem('replyToMessage', event.data.messageId);
              break;
            case 'MARK_READ':
              // Handle mark read
              console.log('📬 Need to mark as read:', event.data.messageId);
              break;
            default:
              console.log('📬 Unknown message type:', event.data.type);
          }
        }
      });
    }

    if (loading === "true") {
      setOauthLoading(true);
      setOauthText(text || "Loading…");
    }
  }, []);



  const PUBLIC_VAPID_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY

const requestNotificationPermission = async () => {
  if (window.Notification.permission === 'granted') {
    subscribeUserToPush();
    return;
  }

  if (window.Notification.permission === 'denied') {
    console.log('User has blocked window.notifications ❌');
    return;
  }

  const permission = await window.Notification.requestPermission();

  if (permission === 'granted') {
    subscribeUserToPush();
  }
};

useEffect(() => {
  if (!user) return;
  if (!PUBLIC_VAPID_KEY) {
    console.error("Missing VAPID key");
    return;
  }

  requestNotificationPermission();
}, [user]);


const subscribeUserToPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
    }

    await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription.toJSON()),
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('User subscribed to push notifications ✅');

  } catch (err) {
    console.error('Failed to subscribe the user: ', err);
  }
};

  const toTitleCase = (str) => {
    return str
      ?.toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  };


  useEffect(() => {
    const disableImageContextMenu = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    const disableImageDrag = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    }

    document.addEventListener("contextmenu", disableImageContextMenu);
    document.addEventListener("dragstart", disableImageDrag);

    return () => {
      document.removeEventListener("contextmenu", disableImageContextMenu);
      document.removeEventListener("dragstart", disableImageDrag);
    }
  }, []);

  useEffect(() => {
    document.title = modalOpen ? toTitleCase(user?.name) : "SpringsConnect – News Feed";
    document.body.style.overflow = modalOpen ? 'hidden' : 'auto';
    return () => (document.body.style.overflow = 'auto');
  }, [modalOpen, user]);
  return (
    <CallContainer user={user}>
      <Helmet>
        <title>SpringsConnect - Newsprings Youth</title>
        <meta name="description" content="Connect spiritually, share scriptures, and grow with SpringsConnect." />
      </Helmet>

      {modalOpen && <UserModal user={user} onClose={() => setModalOpen(false)} />}
      <Toaster />
      {/* <ReloadNotice /> */}

      <AppInstallPrompt />
      <GlobalAudioModal />
      {oauthLoading && <Loading text={oauthText} />}

      {/* Global PiP Modal - renders outside of RightSidebar */}
      <GlobalPipModal />

      <Routes>

        {/* Public or Auth route */}
        <Route path="/auth/success" element={<AuthSuccess />} />

        {/* Public Pages */}
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Landing Page - visible before login */}
        <Route path="/" element={!user ? <LandingPage /> : <Layout />}>
          {user && <Route index element={<Feed />} />}
          {user && <Route path="scriptures" element={<ScriptureAssistant currentUser={user} />} />}
          {user && (
            <Route path="bible">
              <Route index element={<BibleReader />} />
              <Route path=":book/:chapter" element={<BibleReader />} />
              <Route path=":book/:chapter/:verse" element={<BibleReader />} />
            </Route>
          )}
          {user && <Route path="messages" element={<Messages />} />}
          {user && <Route path="chatbox/:userId" element={<ChatBox />} />}
          {user && <Route path="connections" element={<Connections />} />}
          {user && <Route path="discover" element={<Discover />} />}
          {user && <Route path="profile" element={<Profile />} />}
          {user && <Route path="profile/:profileId" element={<Profile />} />}

          {user && <Route path="create-post" element={<CreatePost />} />}
          {user && <Route path="notification" element={<Notification userId={user?._id} />} />}
          {user && <Route path='portfolio' element={<Portfolio />} />}
          {user && <Route path="post/:postId" element={<SinglePostPage />} />}
          {user && <Route path="settings" element={<Settings />} />}
        </Route>

        {/* Public profile page for unauthenticated users */}
        {!user && <Route path="profile/:profileId" element={<Profile />} />}

        {/* Auth page - for login/signup */}
        <Route path="/auth" element={!user ? <AuthContainer initialError={oauthError} /> : <Navigate to="/" />} />

        {/* 3D Sphere Demo */}
        <Route path="/sphere" element={<Spinning3DSphere />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </CallContainer>
  );
};

export default App;