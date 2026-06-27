
import { useEffect, useState, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from "react-helmet-async";
import { APP_NAME } from './constants/appConfig';
import { log, logger } from './utils/logger';
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
import Loading from './component/shared/Loading'
import Notification from "./pages/Notification"
import Portfolio from './pages/Portfolio';
import ReloadNotice from './component/ReloadNotice';
import NotFound from './pages/NotFound';
import SinglePostPage from "./pages/SinglePostPage";
import ScriptureAssistant from './pages/spiritual_life_tracker/ScriptureAssistant';
import BibleReader from './pages/spiritual_life_tracker/BibleReader';
import AppInstallPrompt from './pages/AppInstallPrompt';
import AuthSuccess from "./pages/AuthSuccess";
import PasswordSetupModal from './component/PasswordSetupModal';
import AccountabilityOnboarding from './component/onboarding/AccountabilityOnboarding';
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
import  serviceWorkerHelper from './utils/serviceWorkerHelper';
import { openInstalledApp } from './utils/openInstalledApp';
import CallContainer from './component/CallUI/CallContainer';
import GlobalPipModal from './component/GlobalPipModal';
import SidebarTooltipPortal from './component/shared/SidebarTooltipPortal';
import { MoodProvider } from './store/MoodStore';
import { ScriptureProvider } from './context/ScriptureContext';
import GlobalScriptureModal from './component/shared/GlobalScriptureModal';
import { useNotificationStatusModal } from "./hooks/useNotificationStatusModal";
import NotificationStatusModal from './component/shared/NotificationStatusModal';
// Admin Dashboard Imports
import AdminLayout from '@/component/Admin/Layout';
import AdminDashboard from '@/pages/Admin/Dashboard';
import Members from '@/pages/Admin/Members';
import Posts from '@/pages/Admin/Posts';
import Flagged from '@/pages/Admin/Flagged';
import Groups from '@/pages/Admin/Groups';
import Prayers from '@/pages/Admin/Prayers';
import Devotionals from '@/pages/Admin/Devotionals';
import Announcements from '@/pages/Admin/Announcements';
import Reports from '@/pages/Admin/Reports';
import Notifications from '@/pages/Admin/Notifications';
import AdminSettings from '@/pages/Admin/Settings';
import SupportChatWidget from './component/shared/SupportChatWidget';
const App = () => {
  const { user, setUser, token, modalOpen, setModalOpen, showPasswordModal, setShowPasswordModal, showOnboarding, setShowOnboarding } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const oauthError = searchParams.get('error');
  const {
  requestNotificationPermission 
} = serviceWorkerHelper;
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthText, setOauthText] = useState("Loading…");
  const { modalState, dndInfo, dismiss } = useNotificationStatusModal();

useEffect(() => {
    // ✅ OAuth loading check runs unconditionally regardless of SW support
    const loading = sessionStorage.getItem("oauth_loading");
    const text = sessionStorage.getItem("oauth_text");
    if (loading === "true") {
      setOauthLoading(true);
      setOauthText(text || "Loading…");
    }

    if (!('serviceWorker' in navigator)) return;

    // ✅ Register SW separately — not mixed with the message listener
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(registration => {
        log('✅ Service Worker registered:', registration.scope);
      })
      .catch(err => {
        console.error('❌ Service Worker registration failed:', err);
      });

    const messageHandler = (event) => {
      log('📬 App received message from SW:', event.data);
      if (!event.data?.type) return;

      switch (event.data.type) {
        case 'SCROLL_TO_MESSAGE':
          sessionStorage.setItem('scrollToMessage', event.data.messageId);
          if (event.data.chatId) sessionStorage.setItem('scrollToChatId', event.data.chatId);
          break;
        case 'REPLY_TO_MESSAGE':
          sessionStorage.setItem('replyToMessage', event.data.messageId);
          if (event.data.chatId) sessionStorage.setItem('replyToChatId', event.data.chatId);
          break;
        default:
          log('📬 Unknown message type:', event.data.type);
      }
    };

    navigator.serviceWorker.addEventListener('message', messageHandler);
    return () => navigator.serviceWorker.removeEventListener('message', messageHandler);
  }, []);

  // open app if launched from notification and not already open
  useEffect(() => {
    openInstalledApp();
  }, []);



  const PUBLIC_VAPID_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY
useEffect(() => {
  if (!user || !token) return;
  if (!('serviceWorker' in navigator)) return;

  // ✅ Wait for SW to be fully active before attempting to subscribe
  // Without this, pushManager.subscribe silently fails on first load
  navigator.serviceWorker.ready
    .then(() => {
      requestNotificationPermission(token);
    })
    .catch(err => {
      console.error('❌ SW not ready, skipping push subscription:', err);
    });
}, [user, token]);

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
    document.title = modalOpen ? toTitleCase(user?.name) : "{APP_NAME} – News Feed";
    const originalOverflow = document.body.style.overflow;
    if (modalOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [modalOpen, user]);

  // Auto-show onboarding after password modal closes if user hasn't completed onboarding
  useEffect(() => {
    if (!showPasswordModal && user && user.onboardingCompleted === false && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [showPasswordModal, user, showOnboarding, setShowOnboarding]);


   useEffect(() => {
    console.log("Show onboarding:", showOnboarding);   
    console.log("User onboardingCompleted:", user?.onboardingCompleted);
   }, [showOnboarding]);  

  return (
    <MoodProvider>
      <ScriptureProvider>
        <CallContainer user={user}>
          <Helmet>
            <title>{APP_NAME} - Newsprings Youth</title>
            <meta name="description" content="Connect spiritually, share scriptures, and grow with {APP_NAME}." />
          </Helmet>

          {modalOpen && <UserModal user={user} onClose={() => setModalOpen(false)} />}
          <Toaster />
          {/* <ReloadNotice /> */}

          <AppInstallPrompt />
          <GlobalAudioModal />
          {oauthLoading && <Loading text={oauthText} />}

          {/* Global PiP Modal - renders outside of RightSidebar */}
          <GlobalPipModal />

          {/* Global Scripture Modal */}
          <GlobalScriptureModal />

          <SidebarTooltipPortal />

          <PasswordSetupModal
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            token={token}
            onSuccess={() => setShowPasswordModal(false)}
          />
          <NotificationStatusModal
            modalState={modalState}
            dndInfo={dndInfo}
            onDismiss={dismiss}
            onGoToSettings={() => navigate("/settings/notifications")}
          />
          <SupportChatWidget />

          <AccountabilityOnboarding
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            token={token}
            onSuccess={(data) => {
              console.log("🎉 [App.jsx] Onboarding API response received:", data);
              
              // Update user state with new onboarding data
              if (data?.user) {
                console.log("📝 [App.jsx] Updating user state with:", data.user);
                const updatedUser = data.user;
                
                // Update AuthContext user state
                setUser(updatedUser);
                
                // Sync to localStorage for persistence
                localStorage.setItem("springsCircleUser", JSON.stringify(updatedUser));
                console.log("💾 [App.jsx] User synced to localStorage");
                
                // Close modal
                setShowOnboarding(false);
                console.log("✅ [App.jsx] Modal closed, onboarding complete!");
              } else {
                console.error("❌ [App.jsx] No user data in response:", data);
                setShowOnboarding(false);
              }
            }}
          />

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

          {/* Admin Dashboard Routes */}
          {user && (
            <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/members" element={<AdminLayout><Members /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/posts" element={<AdminLayout><Posts /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/flagged" element={<AdminLayout><Flagged /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/groups" element={<AdminLayout><Groups /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/prayers" element={<AdminLayout><Prayers /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/devotionals" element={<AdminLayout><Devotionals /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/announcements" element={<AdminLayout><Announcements /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/notifications" element={<AdminLayout><Notifications /></AdminLayout>} />
          )}
          {user && (
            <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
          )}

          {/* 3D Sphere Demo */}
          <Route path="/sphere" element={<Spinning3DSphere />} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />

        </Routes>
          </CallContainer>
        </ScriptureProvider>
      </MoodProvider>
  );
};

export default App;