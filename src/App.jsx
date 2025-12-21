import { useEffect } from 'react';
import "./styles/ui.css"
import { Routes, Route } from 'react-router-dom';
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
const App = () => {
  const { user, modalOpen, setModalOpen } = useAuth();




  const toTitleCase = (str) => {
    return str
      ?.toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  };


  useEffect(() => {
    document.title = modalOpen ? toTitleCase(user?.name) : "SpringsConnect – News Feed";
    document.body.style.overflow = modalOpen ? 'hidden' : 'auto';
    return () => (document.body.style.overflow = 'auto');
  }, [modalOpen, user]);
  return (
    <>
      {modalOpen && <UserModal user={user} onClose={() => setModalOpen(false)} />}
      <Toaster />
      {/* <ReloadNotice /> */}

      <AppInstallPrompt />

      <Routes>

        {/* Public or Auth route */}
    <Route path="/" element={!user ? <AuthContainer /> : <Layout />}>
  <Route index element={<Feed />} />
  <Route path="scriptures" element={<ScriptureAssistant currentUser={user} />} />
  <Route path="bible" element={<BibleReader />} />  {/* ← new route */}
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
  <Route path="*" element={<NotFound />} />
</Route>

      </Routes>
    </>
  );
};

export default App;