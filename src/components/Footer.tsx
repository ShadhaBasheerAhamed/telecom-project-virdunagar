import { useState, useEffect } from 'react';

export function Footer() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 text-center">
      <p className="text-sm text-slate-400">
        Server Time: <span className="text-slate-300">{formattedTime}</span>
      </p>
    </div>
  );
}
