import { Megaphone } from "lucide-react";
import React from "react";

export const EmptyFeed = () => {
    return (
    <div className="flex flex-col items-center justify-center -mt-1 text-center px-4">
      <div
        className="
          relative
          bg-[var(--bg-light)]
          p-10
          rounded-3xl
          shadow-2xl
          max-w-lg
          animate-fadeIn
          overflow-hidden
          backdrop-blur-[15px]
          border border-[rgba(255,255,255,0.05)]
        "
      >
<div
  className="absolute -inset-10 rounded-full blur-[120px] pointer-events-none z-0"
  style={{
    background: "radial-gradient(circle, rgba(30,64,175,0.4) 0%, rgba(30,64,175,0.1) 40%, transparent 80%)",
  }}
></div>

        {/* Icon */}
        <Megaphone className="mx-auto text-[var(--primary)] w-12 h-12 mb-4 animate-bounce-slow" />

        {/* Header */}
        <h2 className="text-[var(--text-main)] text-2xl font-bold mb-2">No posts yet!</h2>

        {/* Message */}
        <p className="text-[var(--text-secondary)] mb-6">
          Your feed is quiet… but that’s a chance to inspire! Create your first post and share something amazing 🌱
        </p>

        {/* Button */}
        <button
          onClick={() => alert("Redirect to create post page!")}
          className="
            bg-[var(--btn-bg)]
            text-[var(--btn-text)]
            font-semibold
            px-6 py-2
            rounded-full
            shadow-lg
            hover:bg-[var(--btn-hover)]
            transform transition-transform duration-300
            hover:scale-105
          "
        >
          Create Your First Post
        </button>
      </div>
    </div>
  );
//   return (
//     <div className="flex flex-col items-center justify-center -mt-1 text-center px-4 ">
//       <div
//         className="
//           relative
//           bg-[var(--glassy-white)]
//           p-10
//           rounded-3xl
//           shadow-2xl
//           max-w-lg
//           animate-fadeIn
//           overflow-hidden
//           backdrop-blur-[15px]
//           ring-4 ring-inset ring-[rgb(255,255,255,.4)]
//         "
//       >
// <div
//   className="absolute -inset-10 rounded-full blur-[120px] pointer-events-none z-0"
//   style={{
//     background: "radial-gradient(circle, rgba(192, 197, 248, 0.6) 0%, rgba(213, 215, 244, 0.9) 40%, transparent 80%)",
//   }}
// ></div>

//         {/* Icon */}
//         <Megaphone className="mx-auto text-[var(--primary)] w-12 h-12 mb-4 animate-bounce-slow" />

//         {/* Header */}
//         <h2 className="text-[var(--primary)] text-2xl font-bold mb-2">No posts yet!</h2>

//         {/* Message */}
//         <p className="text-[var(--secondary)] text-[15px] mb-6">
//           Your feed is quiet… but that’s a chance to inspire! Create your first post and share something amazing 🌱
//         </p>

//         {/* Button */}
//         <button
//           onClick={() => alert("Redirect to create post page!")}
//           className="
//            btn
//           "
//         >
//           Create Your First Post
//         </button>
//       </div>
//     </div>
//   );
};
