import { useEffect, useState } from "react";

const Timer = ({ createdAt }: { createdAt: Date }) => {
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const createdDate = new Date(createdAt).getTime();
      const diff = now - createdDate;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formattedTime = [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0"),
      ].join(":");

      setElapsedTime(formattedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div className="text-sm font-semibold w-20 text-center">{elapsedTime}</div>
  );
};

export default Timer;
