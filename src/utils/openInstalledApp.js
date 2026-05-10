export function openInstalledApp() {
  return new Promise((resolve) => {
    try {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

      if (isStandalone) {
        console.log("✅ App already running in standalone mode");
        resolve(false);
        return;
      }

      // Use a timeout to prevent hanging if custom URL scheme doesn't exist
      const timeoutId = setTimeout(() => {
        console.warn("⚠️ Custom URL scheme did not open - continuing in web app");
        resolve(false);
      }, 1500);

      // Attempt to open the installed app
      window.location.href = "web+springsConnect://open";

      // If it succeeds, clear timeout (though unlikely to reach here)
      setTimeout(() => clearTimeout(timeoutId), 100);
      resolve(true);
    } catch (error) {
      console.error("❌ Error attempting to open installed app:", error);
      resolve(false);
    }
  });
}