import { useState, useRef, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import RecentMessages from "../RecentMessages";
import RightSidebarSkeleton from "../skeleton/RightSidebarSkeleton";

const MediumSidebarToggle = ({ sponsors }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (
        showSidebar &&
        sidebarRef.current && !sidebarRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setShowSidebar(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showSidebar]);

  return (
    <>
      <style>{`
        .gn-msb {
          position: fixed;
          top: 0;
          right: 0;
          z-index: 555;
          background: #fff;
          width: 300px;
          height: 100dvh;
          box-shadow: -2px 0 12px rgba(0,0,0,.10);
          transform: translateX(100%);
          transition: transform .25s cubic-bezier(.4,0,.2,1);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          font-family: 'Google Sans Text', 'Segoe UI', sans-serif;
        }
        @media (min-width: 1024px) { .gn-msb { display: none; } }
        .gn-msb.open { transform: translateX(0); }

        .gn-msb-inner { padding: 12px; flex: 1; }

        .gn-msb-sponsor {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,.10);
          text-decoration: none;
          display: block;
          margin-bottom: 12px;
          transition: box-shadow .15s;
          color: inherit;
        }
        .gn-msb-sponsor:hover { box-shadow: 0 4px 12px rgba(0,0,0,.15); }
        .gn-msb-sponsor-body { padding: 14px; }
        .gn-msb-sponsor h3 { font-size: 14px; font-weight: 600; color: #202124; margin-bottom: 8px; }
        .gn-msb-sponsor img { width: 100%; height: auto; border-radius: 8px; margin-bottom: 8px; object-fit: contain; }
        .gn-msb-sponsor p { font-size: 12px; color: #5f6368; margin: 2px 0; }

        /* toggle button */
        .gn-msb-toggle {
          position: fixed;
          top: 8px;
          right: 8px;
          z-index: 556;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #fff;
          box-shadow: 0 2px 8px rgba(26,115,232,.35);
          cursor: pointer;
          transition: box-shadow .15s, background .15s;
          color: #1a73e8;
        }
        @media (min-width: 1024px) { .gn-msb-toggle { display: none; } }
        .gn-msb-toggle:hover {
          background: #e8f0fe;
          box-shadow: 0 2px 4px rgba(26,115,232,.2);
        }
      `}</style>

      {/* Sidebar panel */}
      <div ref={sidebarRef} className={`gn-msb${showSidebar ? ' open' : ''}`}>
        <div className="gn-msb-inner">
          {!sponsors ? (
            <RightSidebarSkeleton />
          ) : (
            <a href={sponsors.link} target="_blank" rel="noopener noreferrer" className="gn-msb-sponsor">
              <div className="gn-msb-sponsor-body">
                <h3>{sponsors.title}</h3>
                <img src={sponsors.image} alt={sponsors.brand} />
                <p style={{ fontWeight: 600, color: '#202124' }}>{sponsors.brand}</p>
                <p>{sponsors.description}</p>
              </div>
            </a>
          )}
          <RecentMessages />
        </div>
      </div>

      {/* Toggle button */}
      <button ref={buttonRef} className="gn-msb-toggle" onClick={() => setShowSidebar(p => !p)}>
        {showSidebar ? <X size={20} /> : <Megaphone size={20} />}
      </button>
    </>
  );
};

export default MediumSidebarToggle;