
import { useState, useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { currentMonitor } from '@tauri-apps/api/window';
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi';

export const useWindowPosition = () => {
  const [position, setPosition] = useState<'top' | 'bottom' | 'middle'>('top');

  const moveWindow = useCallback(async (newPosition: 'top' | 'bottom' | 'middle', height?: number, widthPercent: number = 0.95) => {
    try {
      const appWindow = getCurrentWindow();
      const monitor = await currentMonitor();

      if (!monitor) return;

      const screenWidth = monitor.size.width;
      const screenHeight = monitor.size.height;
      const scaleFactor = monitor.scaleFactor;
      
      // Measure current borders to compensate
      const currentInner = await appWindow.innerSize();
      const currentOuter = await appWindow.outerSize();
      const totalBorderWidth = currentOuter.width - currentInner.width;

      // If height is provided, we assume it's in logical pixels, so we multiply by scaleFactor
      const logicalHeight = height || 150;
      const windowHeight = logicalHeight * scaleFactor;
      
      const isFullWidth = widthPercent >= 0.99;
      // If full width, we want OUTER width to be screenWidth
      // setSize sets INNER width, so targetInner = screenWidth - totalBorderWidth
      const windowWidth = isFullWidth ? (screenWidth - totalBorderWidth) : (screenWidth * widthPercent);

      await appWindow.setSize(new PhysicalSize(Math.round(windowWidth), Math.round(windowHeight)));

      // Calculate position directly without centering first to prevent flicker
      // Center horizontally since we are not 100% width anymore 
      // (Actually if isFullWidth, we are 100% outer width, so start at monitor X)
      let x = isFullWidth ? monitor.position.x : monitor.position.x + (screenWidth - windowWidth) / 2;
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

  const resizeWindow = useCallback(async (newHeight: number, anchor: 'top' | 'bottom' | 'middle') => {
    try {
      const appWindow = getCurrentWindow();
      const monitor = await currentMonitor();
      if (!monitor) return;

      const scaleFactor = monitor.scaleFactor;
      // Use innerSize to preserve content width (avoid growing by border width)
      const currentInnerSize = await appWindow.innerSize();
      // Use outerSize for screen boundary calculations
      const currentOuterSize = await appWindow.outerSize();
      const currentPos = await appWindow.outerPosition();

      const targetHeight = Math.round(newHeight * scaleFactor);
      
      // If height hasn't changed (based on inner height), do nothing
      if (Math.abs(targetHeight - currentInnerSize.height) < 1) return;

      // We maintain the current INNER width
      const targetWidth = currentInnerSize.width;

      // Calculate border dimensions to estimate new outer size
      const borderW = currentOuterSize.width - currentInnerSize.width;
      const borderH = currentOuterSize.height - currentInnerSize.height;

      const targetOuterHeight = targetHeight + borderH;
      const targetOuterWidth = targetWidth + borderW;

      const screenTop = monitor.position.y;
      const screenBottom = monitor.position.y + monitor.size.height;
      
      const windowBottom = currentPos.y + currentOuterSize.height;
      const distBottom = screenBottom - windowBottom;
      const isAtBottom = distBottom < 50; 

      let candidateY = currentPos.y;
      if (isAtBottom) {
          candidateY = windowBottom - targetOuterHeight;
      }

      const maxY = screenBottom - targetOuterHeight;
      const clampedY = Math.max(screenTop, Math.min(candidateY, maxY));

      const screenLeft = monitor.position.x;
      const screenRight = monitor.position.x + monitor.size.width;
      
      // Use target OUTER width for clamping X
      const maxX = screenRight - targetOuterWidth;
      const clampedX = Math.max(screenLeft, Math.min(currentPos.x, maxX));

      const growing = targetHeight > currentInnerSize.height;
      const moving = Math.abs(clampedX - currentPos.x) > 1 || Math.abs(clampedY - currentPos.y) > 1;

      if (growing) {
          // If growing, Move first to secure the new top-left, then Expand
          if (moving) await appWindow.setPosition(new PhysicalPosition(clampedX, Math.round(clampedY)));
          // setSize sets INNER size
          await appWindow.setSize(new PhysicalSize(targetWidth, targetHeight));
      } else {
          // If shrinking, Shrink first (to minimal size), then Move to new position
          await appWindow.setSize(new PhysicalSize(targetWidth, targetHeight));
          if (moving) await appWindow.setPosition(new PhysicalPosition(clampedX, Math.round(clampedY)));
      }

    } catch (error) {
      console.error('Failed to resize window:', error);
    }
  }, []);

  const startDrag = useCallback(async (event: React.MouseEvent) => {
    try {
      const appWindow = getCurrentWindow();
      const monitor = await currentMonitor();
      if (!monitor) return;

      const scale = monitor.scaleFactor;
      const initialWindowPos = await appWindow.outerPosition();
      const initialWindowSize = await appWindow.outerSize();

      // Convert mouse screen coords (CSS pixels) to Physical pixels
      const mousePhysX = event.screenX * scale;
      const mousePhysY = event.screenY * scale;

      const offsetX = mousePhysX - initialWindowPos.x;
      const offsetY = mousePhysY - initialWindowPos.y;

      const screenLeft = monitor.position.x;
      const screenTop = monitor.position.y;
      const screenRight = monitor.position.x + monitor.size.width;
      const screenBottom = monitor.position.y + monitor.size.height;

      const handleMouseMove = async (moveEvent: MouseEvent) => {
        const currentMousePhysX = moveEvent.screenX * scale;
        const currentMousePhysY = moveEvent.screenY * scale;

        let newX = currentMousePhysX - offsetX;
        let newY = currentMousePhysY - offsetY;

        // Clamp X position
        newX = Math.max(screenLeft, newX);
        newX = Math.min(screenRight - initialWindowSize.width, newX);

        // Clamp Y position
        newY = Math.max(screenTop, newY);
        newY = Math.min(screenBottom - initialWindowSize.height, newY);

        await appWindow.setPosition(new PhysicalPosition(Math.round(newX), Math.round(newY)));
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

    } catch (error) {
      console.error('Failed to start window drag:', error);
    }
  }, []);

  return { position, moveWindow, resizeWindow, startDrag };
};
