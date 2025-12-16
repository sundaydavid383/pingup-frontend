// src/pages/SinglePostPage.jsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import PostViewer from "../component/PostViewer";

const SinglePostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);

useEffect(() => {
  console.log("🔍 Checking SinglePostPage...");
  console.log("➡️ Incoming postId:", postId);
  console.log("➡️ Fetch URL:", `${import.meta.env.VITE_SERVER}api/posts/${postId}`);

  const fetchPost = async () => {
    try {
      console.log("📡 Sending request...");
      const res = await axios.get(`${import.meta.env.VITE_SERVER}api/posts/${postId}`);
      console.log("✅ Response received:", res.data);
      setPost(res.data.post);
    } catch (err) {
      console.error("❌ Error fetching:", err);
      console.log("❌ Full error object:", JSON.stringify(err, null, 2));
    }
  };

  fetchPost();
}, [postId]);


  if (!post) return <div className="p-4">Loading...</div>;

  return <PostViewer feed={[post]} currentIndex={0} onClose={() => window.history.back()} />;
};

export default SinglePostPage;
