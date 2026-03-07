"use client";

import { useRef, useEffect, useCallback } from "react";

interface FitTextProps {
  children: string;
  maxFontSize?: number;
  className?: string;
}

export default function FitText({ children, maxFontSize = 160, className = "" }: FitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const resize = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    text.style.fontSize = `${maxFontSize}px`;
    const containerWidth = container.clientWidth;
    const textWidth = text.scrollWidth;

    if (textWidth > containerWidth) {
      const newSize = Math.floor(maxFontSize * (containerWidth / textWidth));
      text.style.fontSize = `${newSize}px`;
    }
  }, [children, maxFontSize]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <span ref={textRef} className="whitespace-nowrap inline-block leading-none">
        {children}
      </span>
    </div>
  );
}
