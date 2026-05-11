import { useEffect } from 'react';

export const useModalScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return undefined;

    const body = document.body;
    const html = document.documentElement;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isLocked]);
};