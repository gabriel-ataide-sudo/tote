import { useState, useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { currentMonitor } from '@tauri-apps/api/window';
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi';

export const useWindowPosition = () => {
  const [position, setPosition] = useState<'top' | 'bottom' | 'middle'>('top');

  const moveWindow = useCallback(async (newPosition: 'top' | 'bottom' | 'middle', height?: number) => {
    try {
      const appWindow = getCurrentWindow();
      const monitor = await currentMonitor();

      if (!monitor) return;

      const screenWidth = monitor.size.width;
      const screenHeight = monitor.size.height;
      const scaleFactor = monitor.scaleFactor;

      // Use provided height or default to 150
      // If height is provided, we assume it's in logical pixels, so we multiply by scaleFactor
      const logicalHeight = height || 150;
      const windowHeight = logicalHeight * scaleFactor;
      const windowWidth = screenWidth; // 100% of screen width

      await appWindow.setSize(new PhysicalSize(Math.round(windowWidth), Math.round(windowHeight)));

      // Center the window to ensure correct X alignment, then adjust Y
      await appWindow.center();
      const centeredPos = await appWindow.outerPosition();

      let x = centeredPos.x;
      let y = monitor.position.y;

      switch (newPosition) {
        case 'top':
          // y is already at the top of the monitor
          break;
        case 'bottom':
          y += screenHeight - windowHeight; // Start at the very bottom
          break;
        case 'middle':
          y += (screenHeight - windowHeight) / 2;
          break;
      }

      await appWindow.setPosition(new PhysicalPosition(Math.round(x), Math.round(y)));
      setPosition(newPosition);
    } catch (error) {
      console.error('Failed to move window:', error);
    }
  }, []);



  return { position, moveWindow };
};
