"use client";

import { useRef, useCallback } from "react";

interface TiltCard3DProps {
  children: React.ReactNode;
  tiltAmount?: number;
  scale?: number;
  className?: string;
}

export function TiltCard3D({ children, tiltAmount = 12, scale = 1.02, className }: TiltCard3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * tiltAmount;
      const tiltY = (x - 0.5) * tiltAmount;
      ref.current.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale},${scale},${scale})`;
    },
    [tiltAmount, scale]
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.4s cubic-bezier(0.2, 0, 0, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
