import { useEffect, useState } from 'react';

export default function AppInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Prevent automatic mini-popup
      setDeferredPrompt(e);
      setShowInstall(true);
      console.log('💡 PWA install prompt is available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); // Show the install popup
    const choiceResult = await deferredPrompt.userChoice;
    console.log('User choice:', choiceResult.outcome);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-800 text-white p-3 rounded-lg shadow-lg cursor-pointer z-50" onClick={handleInstallClick}>
      Install SpringssConnect
    </div>
  );
}
