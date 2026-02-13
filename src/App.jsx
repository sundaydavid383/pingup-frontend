import { useEffect, useState, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate  } from 'react-router-dom';
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

    <Route path="/" element={!user ? <AuthContainer initialError={oauthError} /> : <Layout />}>
  <Route index element={<Feed />} />
  <Route path="scriptures" element={<ScriptureAssistant currentUser={user} />} />
  <Route path="bible">
  <Route index element={<BibleReader />} />
  <Route path=":book/:chapter" element={<BibleReader />} />
  <Route path=":book/:chapter/:verse" element={<BibleReader />} />
</Route>
 {/* ← new route */}
  <Route path="messages" element={<Messages />} />
  <Route path="chatbox/:userId" element={<ChatBox />} />
  <Route path="connections" element={<Connections />} />
  <Route path="discover" element={<Discover />} />
  <Route path="profile" element={<Profile />} />
  <Route path="profile/:profileId" element={<Profile />} />
  <Route path="create-post" element={<CreatePost />} />
  <Route path="notification" element={<Notification userId={user?._id}/>} />
  <Route path='portfolio' element={<Portfolio/>}/>
  <Route path="post/:postId" element={<SinglePostPage />} />
  
  {/* Settings Route - No nested routing, single page with state management */}
  <Route path="settings" element={<Settings />} />
  
  <Route path="*" element={<NotFound />} />
</Route>

      </Routes>
    </>
  );
};

export default App;