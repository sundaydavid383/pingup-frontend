import { useEffect, useState } from "react";
import "../styles/appinstallprompt.css"
export default function AppInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // prevent Chrome default install bar
      setDeferredPrompt(e);
      setShowModal(true);
      console.log("💡 PWA install prompt captured");
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () =>
      window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="install-overlay">
      <div className="install-modal">
        <img src="/icons/icon-192.png" alt="SpringssConnect" />
        <h2>Install SpringssConnect?</h2>
        <p>Would you like to install the app for a faster, offline-ready experience?</p>
        <div className="install-actions">
          <button className="yes-btn" onClick={installApp}>
            Yes
          </button>
          <button className="no-btn" onClick={() => setShowModal(false)}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}
