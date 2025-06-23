'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;
    let startTime: number;

    const startLoading = () => {
      setLoading(true);
      setProgress(0);
      startTime = Date.now();
      
      // Progressive loading animation
      intervalId = setInterval(() => {
        setProgress((prev) => {
          const elapsed = Date.now() - startTime;
          
          // Different speeds for different stages
          if (prev >= 95) return prev; // Stop near completion
          if (prev >= 80) return prev + Math.random() * 2; // Slow down near end
          if (prev >= 50) return prev + Math.random() * 5; // Medium speed
          return prev + Math.random() * 15; // Fast start
        });
      }, 100);

      // Auto complete after reasonable time
      timeoutId = setTimeout(() => {
        finishLoading();
      }, 1500);
    };

    const finishLoading = () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    };

    // Start loading on navigation
    const timer = setTimeout(() => {
      startLoading();
    }, 50);

    // Complete loading when navigation finishes
    const finishTimer = setTimeout(finishLoading, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <>
      {/* Loading bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 transition-all duration-200 ease-out"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.6), 0 0 5px rgba(168, 85, 247, 0.4)',
          }}
        />
      </div>
      
      {/* Subtle backdrop for better visibility */}
      <div className="fixed top-0 left-0 right-0 z-[99] h-1 bg-background/80 backdrop-blur-sm" />
    </>
  );
} 