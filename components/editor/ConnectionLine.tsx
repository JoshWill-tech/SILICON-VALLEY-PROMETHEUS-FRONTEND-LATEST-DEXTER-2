'use client';

import React from 'react';

export interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  active?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ 
  startX, 
  startY, 
  endX, 
  endY, 
  color = '#10b981', 
  active = true 
}) => {
  // Cubic Bezier path for smooth curves
  const midX = (startX + endX) / 2;
  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background Path (Thick) */}
      <path 
        d={path} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeOpacity="0.1"
      />

      {/* Main Path */}
      <path 
        d={path} 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeOpacity={active ? 0.6 : 0.2}
        strokeDasharray={active ? "8, 4" : "0"}
        className={active ? "animate-[flowLine_1s_linear_infinite]" : ""}
        style={{ filter: active ? 'url(#glow)' : 'none' }}
      />
    </svg>
  );
};
