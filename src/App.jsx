
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
const App = () => {
  const { user, modalOpen, setModalOpen } = useAuth();
  const location  = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const oauthError = searchParams.get('error');

    const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthText, setOauthText] = useState("Loading…");

  useEffect(() => {
    const loading = sessionStorage.getItem("oauth_loading");
    const text = sessionStorage.getItem("oauth_text");

    if (loading === "true") {
      setOauthLoading(true);
      setOauthText(text || "Loading…");
    }
  }, []);
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
    <>
          <Helmet>
        <title>SpringsConnect - Newsprings Youth</title>
        <meta name="description" content="Connect spiritually, share scriptures, and grow with SpringsConnect." />
      </Helmet>

      {modalOpen && <UserModal user={user} onClose={() => setModalOpen(false)} />}
      <Toaster />
      {/* <ReloadNotice /> */}

      <AppInstallPrompt />
      <GlobalAudioModal/>
      {oauthLoading && <Loading text={oauthText} />}

      <Routes>

        {/* Public or Auth route */}
        <Route path="/auth/success" element={<AuthSuccess />} />
        
        {/* Public Pages */}
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="profile/:profileId" element={<Profile />} />
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
          
          {user && <Route path="create-post" element={<CreatePost />} />}
          {user && <Route path="notification" element={<Notification userId={user?._id}/>} />}
          {user && <Route path='portfolio' element={<Portfolio/>}/>}
          {user && <Route path="post/:postId" element={<SinglePostPage />} />}
          {user && <Route path="settings" element={<Settings />} />}
        </Route>

        {/* Auth page - for login/signup */}
        <Route path="/auth" element={!user ? <AuthContainer initialError={oauthError} /> : <Navigate to="/" />} />

        {/* 3D Sphere Demo */}
        <Route path="/sphere" element={<Spinning3DSphere />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
};

export default App;