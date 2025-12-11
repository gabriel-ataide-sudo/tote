import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms to add a character
  className?: string;
  style?: React.CSSProperties;
}

export function TypewriterText({ 
  text, 
  speed = 10, 
  className,
  style 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  
  // We use a ref to track the latest target text so the interval can see it
  // without re-running the effect on every single char update (if we had text in dep array of effect)
  // actually, we do need to react to text changes, but we want a smooth catch-up.
  
  useEffect(() => {
    // If text was cleared or drastically shorter, reset or just sync immediately?
    // If the new text is NOT a superstructure of displayedText (meaning we changed context),
    // we might want to just reset. But simplest is:
    
    if (text.length < displayedText.length) {
       setDisplayedText(text);
       return;
    }

    // Smart Snap: History Restore (Prepended text)
    if (text.endsWith(displayedText) && text.length > displayedText.length) {
        setDisplayedText(text);
        return;
    }

    // Sliding Window Logic:
    // If the window shifted (e.g. "ABCDE" -> "BCDEF"), we want to snap to "BCDE" and type "F".
    // We look for the longest suffix of `displayedText` that is a prefix of `text`.
    if (displayedText.length > 0) {
      // Limit search to avoid performance hit on long texts, though n=2000 is small.
      // We assume the shift is small usually, so valid overlap is large.
      // We iterate from local start.
      let matchFound = false;
      for (let i = 0; i < displayedText.length; i++) {
         const suffix = displayedText.slice(i);
         if (text.startsWith(suffix)) {
             if (suffix.length > 0) {
                 setDisplayedText(suffix);
                 matchFound = true;
                 break; 
             }
         }
      }

      if (!matchFound) {
        // Context switch detected (no overlap with history). 
        // Reset to empty so we type from scratch.
        setDisplayedText('');
        // We return here to let the state update processed. 
        // The effect will re-run or the interval will start next cycle?
        // Actually, if we setDisplayedText(''), the next render `displayedText` is ''.
        // The effect re-runs because `text` didn't change, but `displayedText` did? 
        // No, `displayedText` is NOT in dependency array.
        // So the effect CONTNUES.
        // But `displayedText` in closure is still the old one.
        // However, the interval consumes `prev` from functional update.
        // If we fired `setDisplayedText('')`, the queue has `''`.
        // Then interval fires `setDisplayedText(prev => ...)`. 
        // `prev` will be `''` (from the update we just queued).
        // `text.slice(0, prev.length + 1)` -> `text[0]`.
        // This works perfectly!
      }
    }
    
    // If we are already up to date, do nothing
    if (displayedText === text) return;

    // Start adding characters
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length >= text.length) {
          clearInterval(interval);
          return text;
        }
        return text.slice(0, prev.length + 1);
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]); // If text changes, we start/continue the race.

  return (
    <div className={className} style={style}>
      {displayedText}
      {/* Optional: Add a cursor blinking if currently typing? Maybe too retro for subtitles. */}
    </div>
  );
}
