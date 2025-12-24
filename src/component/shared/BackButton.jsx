import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const hasTextColor = (cls) =>
  /\btext-(?:\[[^\]]+\]|[a-zA-Z0-9-]+)\b/.test(cls);

const hasBgColor = (cls) =>
  /\bbg-(?:\[[^\]]+\]|[a-zA-Z0-9-]+)\b/.test(cls);

const BackButton = ({
  className = "",
  top = "5px",
  left = "4px",
}) => {
  const navigate = useNavigate();

  const safeBack = () => {
    if (window.history.length <= 2) {
      navigate("/home", { replace: true });
    } else {
      navigate(-1, { replace: true });
    }
  };

  const finalClassName = `
    fixed z-50
    flex items-center gap-2
    px-3 py-2
    rounded-full
    backdrop-blur-sm
    shadow-md
    transition-all
    ${hasBgColor(className) ? "" : "bg-[var(--accent)]/80"}
    ${hasTextColor(className) ? "" : "text-white"}
    hover:bg-white hover:text-[var(--accent)]
    ${className}
  `;

  return (
    <button
      onClick={safeBack}
      style={{ top, left }}
      className={finalClassName}
    >
      <ArrowLeft size={18} />
    </button>
  );
};

export default BackButton;
