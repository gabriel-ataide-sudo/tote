import { useState, useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { currentMonitor } from '@tauri-apps/api/window';
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi';

export const useWindowPosition = () => {
  const [position, setPosition] = useState<'top' | 'bottom' | 'middle'>('middle');

  const moveWindow = useCallback(async (newPosition: 'top' | 'bottom' | 'middle') => {
    try {
      const appWindow = getCurrentWindow();
      const monitor = await currentMonitor();

      if (!monitor) return;

      const screenWidth = monitor.size.width;
      const screenHeight = monitor.size.height;
      const scaleFactor = monitor.scaleFactor;

      // Set a fixed height for the subtitle window (e.g., 150 logical pixels)
      // We can adjust this or make it dynamic later
      const windowHeight = 150 * scaleFactor;
      const windowWidth = screenWidth * 0.8; // 80% of screen width

      await appWindow.setSize(new PhysicalSize(Math.round(windowWidth), Math.round(windowHeight)));

      let x = (screenWidth - windowWidth) / 2;
      let y = 0;

      switch (newPosition) {
        case 'top':
          y = 50 * scaleFactor; // Slight margin from top
          break;
        case 'bottom':
          y = screenHeight - windowHeight - (50 * scaleFactor); // Slight margin from bottom
          break;
        case 'middle':
          y = (screenHeight - windowHeight) / 2;
          break;
      }

      await appWindow.setPosition(new PhysicalPosition(Math.round(x), Math.round(y)));
      setPosition(newPosition);
    } catch (error) {
      console.error('Failed to move window:', error);
    }
  }, []);

  // Initial setup or listener if needed
  useEffect(() => {
    // Optional: Set initial position
    moveWindow(position);
  }, []);

  return { position, moveWindow };
};
