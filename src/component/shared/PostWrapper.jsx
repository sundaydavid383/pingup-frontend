import { useRef, useEffect, useState } from "react";
import useInView from "../../hooks/useInView";

const PostWrapper = ({ children, index, post, onOpenPost, onOpenMedia }) => {
  const [ref, inView] = useInView();
  const [animate, setAnimate] = useState(false);

  const hasMedia =
    (Array.isArray(post.attachments) && post.attachments.length > 0) ||
    (Array.isArray(post.video_urls) && post.video_urls.length > 0);

  useEffect(() => {
    if (inView) setAnimate(true);
  }, [inView]);

  const handleClick = (target, mediaIndex = 0) => {
    if (target === "header") onOpenPost(index);
    if (target === "image" && hasMedia) onOpenMedia(mediaIndex);
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        animate
          ? "opacity-100 translate-y-0 scale-100 blur-0"
          : "opacity-0 translate-y-10 scale-90 blur-sm"
      }`}
    >
      {children({ handleClick })}
    </div>
  );
};


export default PostWrapper;
