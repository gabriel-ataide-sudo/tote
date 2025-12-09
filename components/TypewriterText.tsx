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
      for (let i = 0; i < displayedText.length; i++) {
         const suffix = displayedText.slice(i);
         if (text.startsWith(suffix)) {
             // Found the overlap!
             // "ABCDE" (Disp), "BCDEF" (Target). Suffix "BCDE". Text starts with "BCDE".
             // Snap to "BCDE". The effect will type "F".
             // Ensure we don't just snap to empty string if no total match (handled by loop end)
             // But we want the LONGEST match, so we break immediately on first find?
             // i=0 "ABCDE" -> No.
             // i=1 "BCDE" -> Yes. Longest match.
             if (suffix.length > 0) {
                 setDisplayedText(suffix);
                 // Do NOT return. We want to continue to the interval logic 
                 // to type the REST of the text (the new part).
                 // The interval will use the functional update state, 
                 // so 'prev' will be the suffix we just set.
                 break; // Found largest, break loop, continue to interval
             }
         }
      }
    }
    
    // If no intelligent overlap found (context switch?), just let it run normally.
    // Ideally we might clear if totally different?
    // But for now, let standard slice logic handle it (might look like overwrite).
    
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
