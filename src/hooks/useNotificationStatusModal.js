import { useState, useEffect, useRef, useCallback } from "react";
import axiosBase from "../utils/axiosBase";

const STORAGE_KEY = "notif_modal_last_shown";
const COOLDOWN_DAYS = 7;
const IDLE_DELAY_MS = 30000; // show after 30s of being on page

/**
 * Returns modal state and a dismiss function.
 *
 * modalState values:
 *   null           → do not show modal
 *   "disabled"     → browser permission is denied or default
 *   "dnd_active"   → permission granted but DND is currently blocking
 */
export function useNotificationStatusModal() {
  const [modalState, setModalState] = useState(null);
  const [dndInfo, setDndInfo] = useState({ dndFrom: "", dndUntil: "" });
  const dismissedThisSession = useRef(false);
  const idleTimer = useRef(null);

  const shouldShowBasedOnCooldown = () => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (!last) return true;
      const daysSince = (Date.now() - Number(last)) / (1000 * 60 * 60 * 24);
      return daysSince >= COOLDOWN_DAYS;
    } catch {
      return true;
    }
  };

  const isCurrentlyInDnd = useCallback((dndEnabled, dndFrom, dndUntil) => {
    if (!dndEnabled || !dndFrom || !dndUntil) return false;

    const now = new Date();
    const [fH, fM] = dndFrom.split(":").map(Number);
    const [uH, uM] = dndUntil.split(":").map(Number);
    const nowMins   = now.getHours() * 60 + now.getMinutes();
    const fromMins  = fH * 60 + fM;
    const untilMins = uH * 60 + uM;

    if (fromMins > untilMins) {
      return nowMins >= fromMins || nowMins < untilMins;
    }
    return nowMins >= fromMins && nowMins < untilMins;
  }, []);

  const evaluate = useCallback(async () => {
    // Already dismissed this session — never bother again until next visit
    if (dismissedThisSession.current) return;

    // Cooldown check — don't nag user more than once a week
    if (!shouldShowBasedOnCooldown()) return;

    // Check browser permission
    const permission = typeof Notification !== "undefined"
      ? Notification.permission
      : "default";

    if (permission === "denied" || permission === "default") {
      setModalState("disabled");
      return;
    }

    // Permission granted — check DND
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axiosBase.get("/api/notifications/settings/dnd", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const { dndEnabled, dndFrom, dndUntil } = res.data;

        if (isCurrentlyInDnd(dndEnabled, dndFrom, dndUntil)) {
          setDndInfo({ dndFrom, dndUntil });
          setModalState("dnd_active");
          return;
        }
      }
    } catch {
      // If we can't fetch DND settings, don't show the modal
    }

    // Everything is fine — don't show modal
    setModalState(null);
  }, [isCurrentlyInDnd]);

  // Trigger evaluation after user has been idle on page for IDLE_DELAY_MS
  useEffect(() => {
    idleTimer.current = setTimeout(() => {
      evaluate();
    }, IDLE_DELAY_MS);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [evaluate]);

  const dismiss = useCallback(() => {
    dismissedThisSession.current = true;
    setModalState(null);
    // Record timestamp so cooldown starts from now
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  return { modalState, dndInfo, dismiss, refetch: evaluate };
}