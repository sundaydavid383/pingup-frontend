// src/components/shared/PostWrapper.jsx
import { useRef, useEffect, useState } from "react";
import useInView from "../../hooks/useInView";

const PostWrapper = ({ children, index, post, onOpenPost, onOpenMedia }) => {
  const [ref, inView] = useInView();
  const clickTimer = useRef(null);
  const [animate, setAnimate] = useState(false);

  const hasMedia =
    (Array.isArray(post.attachments) && post.attachments.length > 0) ||
    (Array.isArray(post.video_urls) && post.video_urls.length > 0);

  useEffect(() => {
    if (inView) {
      setAnimate(true);
    }
  }, [inView]);

  const handleClick = () => {
    if (!hasMedia) return;
    clickTimer.current = setTimeout(() => {
      onOpenMedia(index);
    }, 180); // delay for double click detection
  };

  const handleDoubleClick = () => {
    clearTimeout(clickTimer.current);
    onOpenPost(index);
  };

  return (
    <div
      ref={ref}

      onDoubleClick={handleDoubleClick}
      className={`
        transition-all duration-700
        ${animate ? "opacity-100 translate-y-0 scale-100 blur-0" : "opacity-0 translate-y-10 scale-90 blur-sm"}
      `}
    >
      {children}
    </div>
  );
};

export default PostWrapper;
