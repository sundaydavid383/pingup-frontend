import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const HeaderArrow = ({ sidebarOpen, navigate }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const marginLeft = isMobile ? (sidebarOpen ? "1px" : "40px") : "20px";

  return (
    <div
      onClick={() => navigate(-1)}
      className="cursor-pointer text-[var(--primary)] p-1 hover:bg-gray-200 rounded-full transition-all duration-300"
      style={{ marginLeft }}
    >
      <ArrowLeft size={24} />
    </div>
  );
};

export default HeaderArrow;
