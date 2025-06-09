import { useState, useEffect } from 'react';

interface ActiveBakeIndicatorProps {
  isActive: boolean;
  startTimestamp: string | null; // ISO date string
}

function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function ActiveBakeIndicator({ isActive, startTimestamp }: ActiveBakeIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

  useEffect(() => {
    if (isActive && startTimestamp) {
      const startTime = new Date(startTimestamp).getTime();
      const intervalId = setInterval(() => {
        const now = Date.now();
        const diff = now - startTime;
        setElapsedTime(formatElapsedTime(diff));
      }, 1000);

      // Initial update
      const now = Date.now();
      const diff = now - startTime;
      setElapsedTime(formatElapsedTime(diff));

      return () => clearInterval(intervalId);
    } else {
      setElapsedTime("00:00:00"); // Reset if not active or no start time
    }
  }, [isActive, startTimestamp]);

  if (!isActive) return null;

  return (
    <span className="ml-4 text-red-600 font-semibold">
      Active Bake 🔴 {elapsedTime}
    </span>
  );
}