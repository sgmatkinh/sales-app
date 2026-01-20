import React, { useEffect, useRef } from "react";

const AutoLogout = ({ children, onLogout }) => {
  const timerRef = useRef(null);
  const INACTIVITY_TIME =30 * 1000; // 3 phút

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onLogout(); // Gọi hàm autoLogoutAction từ App.js truyền xuống
    }, INACTIVITY_TIME);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return <>{children}</>;
};

export default AutoLogout;