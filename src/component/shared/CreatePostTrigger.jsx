import { PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreatePostTrigger = () => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/create-post")}
      className="
        relative
        flex items-center gap-4
        w-full
        px-5 py-4
        mb-4
        rounded-2xl
        cursor-pointer
        bg-[var(--glassy-white)]
        backdrop-blur-xl
        transition-all duration-300
        hover:shadow-[0_14px_45px_rgba(0,0,0,0.18)]
        hover:border-[var(--hover-dark)]
        active:scale-[0.985]
        shadow-[0_10px_35px_rgba(0,0,0,0.12),_0_0_0_1px_rgba(148,163,184,0.35)]
      "
    >
      {/* soft enlightening glow */}
      <div
        className="
          absolute -top-12 -left-12
          w-48 h-48
          rounded-full
          blur-[100px]
          opacity-50
          pointer-events-none
        "
        style={{ background: "rgba(143, 211, 244, 0.45)" }}
      />

      {/* icon bubble */}
      <div
        className="
          relative z-10
          w-10 h-10
          flex items-center justify-center
          rounded-full
          bg-gradient-to-br
          from-[var(--primary)]
          to-[var(--hover-dark)]
          text-white
          shadow-md
        "
      >
        <PenLine size={17} />
      </div>

      {/* text */}
      <span className="relative z-10 text-[var(--text-dark)] text-sm sm:text-base">
        What’s on your mind?
      </span>
    </div>
  );
};

export default CreatePostTrigger;
