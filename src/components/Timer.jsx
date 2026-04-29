import { useState, useEffect, useRef } from "react";
import { TIME_PER_TURN } from "../constants";

export default function Timer({ turnStartTime, duration = TIME_PER_TURN, onTimeout, isMyTurn }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef(null);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    hasTimedOut.current = false;

    if (!turnStartTime) {
      setTimeLeft(duration);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0 && !hasTimedOut.current) {
        hasTimedOut.current = true;
        if (isMyTurn && onTimeout) {
          onTimeout();
        }
      }
    };

    tick(); // Initial calculation
    timerRef.current = setInterval(tick, 200);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [turnStartTime, duration, onTimeout, isMyTurn]);

  const percentage = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`timer-container ${isUrgent ? "urgent" : ""} ${isCritical ? "critical" : ""}`}>
      <svg className="timer-ring" viewBox="0 0 120 120">
        <circle
          className="timer-ring-bg"
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="6"
        />
        <circle
          className="timer-ring-progress"
          cx="60"
          cy="60"
          r="54"
          fill="none"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="timer-text">
        <span className="timer-number">{timeLeft}</span>
        <span className="timer-label">giây</span>
      </div>
    </div>
  );
}
