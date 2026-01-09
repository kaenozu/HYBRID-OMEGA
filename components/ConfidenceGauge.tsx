
import React, { useEffect, useState } from 'react';

interface ConfidenceGaugeProps {
  value: number; // 0 to 100
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const getColor = (val: number) => {
    if (val >= 80) return '#6366f1'; // Indigo
    if (val >= 60) return '#0ea5e9'; // Sky
    if (val >= 40) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-32 w-full">
      <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 60">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={getColor(displayValue)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference / 2}
          strokeDashoffset={circumference / 2 - (displayValue / 100) * (circumference / 2)}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 1s ease-out' }}
          className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[-10%] text-center">
        <span className="text-2xl font-black text-white font-mono leading-none">
          {Math.round(displayValue)}
          <span className="text-[10px] text-slate-500 ml-0.5">%</span>
        </span>
        <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">AI 予測の確信度</div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
