'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useTheme } from 'next-themes';
import { SettingsMenu } from '@/components/SettingMenu';
import { useWindowPosition } from '@/app/hooks/useWindowPosition';
import { useSettingsPersistence } from '@/app/hooks/useSettingsPersistence';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, currentMonitor } from '@tauri-apps/api/window';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText } from '@/components/TypewriterText';

export default function Home() {
  const { position, moveWindow, resizeWindow, startDrag } = useWindowPosition();
  const { settings, updateSetting, loaded } = useSettingsPersistence();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Estados da Aplicação de Transcrição
  const [subtitle, setSubtitle] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [preDockPosition, setPreDockPosition] = useState<string | null>(null);

  // Debounce/Optimization for AppBar updates
  const lastAppBarRef = useRef<{pos: string, height: number} | null>(null);

  const updateAppBar = async (pos: 'top' | 'bottom' | 'none', height: number) => {
      // Prevent redundant calls to avoid shell freeze
      if (lastAppBarRef.current && 
          lastAppBarRef.current.pos === pos && 
          lastAppBarRef.current.height === height) {
          return;
      }

      try {
          lastAppBarRef.current = { pos, height };
          await invoke('register_appbar', { position: pos, height });
      } catch (e) {
          console.error("Failed to update app bar:", e);
      }
  };

  // Drag-to-Undock Polling
  useEffect(() => {
    if (!isFullWidth || isSettingsOpen) return;  // Disable polling while settings are open or undocked 

    const checkUndock = async () => {
       try {
           const appWindow = getCurrentWindow();
           const pos = await appWindow.outerPosition();
           const monitor = await currentMonitor();
           if (!monitor) return;
           
           // Threshold to snap out
           const threshold = 20; 

           if (settings.position === 'top') {
               // If we are docked top, y should be close to monitor.y
               if (Math.abs(pos.y - monitor.position.y) > threshold) {
                   setIsFullWidth(false);
                   updateAppBar('none', 0);
               }
           } else if (settings.position === 'bottom') {
               // If docked bottom, y + height should be close to monitor.y + size.height
               // Actually checking if we pulled it UP away from bottom
               const size = await appWindow.outerSize();
               const monitorBottom = monitor.position.y + monitor.size.height;
               if (Math.abs((pos.y + size.height) - monitorBottom) > threshold) {
                   setIsFullWidth(false);
                   updateAppBar('none', 0);
               }
           }
       } catch (e) {
           // ignore errors during poll
       }
    };

    const interval = setInterval(checkUndock, 500); // Check every 500ms
    return () => clearInterval(interval);
  }, [isFullWidth, settings.position]);

  // Effect 1: Snap to preset position when position setting changes or apps loads
  useEffect(() => {
    if (loaded) {
      const fontSizeValue = parseInt(settings.fontSize);
      const compactHeight = (fontSizeValue * 1.625 * 2.0) + 24;
      const targetHeight = isSettingsOpen ? compactHeight + 350 : compactHeight;

      // This will snap the window to Top/Bottom/Mid of monitor
      moveWindow(settings.position, targetHeight, isFullWidth ? 1.0 : 0.95);
      
      if (isFullWidth) {
         getCurrentWindow().scaleFactor().then(scale => {
             // ALWAYS reserve only the compact strip height for the AppBar
             // NOT the targetHeight (which might include the setting menu)
             // This allows the menu to "overflow" the reserved area without pushing windows
             const compactPhysicalHeight = Math.round(compactHeight * scale);
             
             if (settings.position === 'middle') {
                 updateAppBar('none', 0);
             } else {
                 updateAppBar(settings.position, compactPhysicalHeight);
             }
         });
      } else {
         updateAppBar('none', 0);
      }
    }
  }, [loaded, settings.position, moveWindow, isFullWidth, isSettingsOpen, settings.fontSize]); // Dependencies: Only position changes cause snap

  // Effect 2: Resize in place when settings toggle or content size changes
  useEffect(() => {
    if (loaded) {
      const fontSizeValue = parseInt(settings.fontSize);
      const compactHeight = (fontSizeValue * 1.625 * 2.0) + 24;
      const targetHeight = isSettingsOpen ? compactHeight + 350 : compactHeight;

      // This will only resize (and adjust Y if needed) relative to CURRENT position
      resizeWindow(targetHeight, settings.position as any);
    }
  }, [isSettingsOpen, settings.fontSize, resizeWindow]); // Dependencies: Toggles and Font Size

  // Auto-scroll to bottom when subtitle changes
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [subtitle]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { theme, setTheme } = useTheme();

  // Configurações do Servidor Python
  const WHISPER_HOST = '127.0.0.1';
  const WHISPER_PORT = 43007;

  const toggleTranscription = async () => {
    if (isRecording) {
      try {
        await invoke('parar_transcricao');
        setSubtitle(''); // Clear text immediately
        setIsRecording(false);
      } catch (error) {
        console.error('Erro ao parar:', error);
      }
    } else {
      setIsConnecting(true);
      setSubtitle('');
      
      const MAX_RETRIES = 120; // 120 attempts * 500ms = 60 seconds (safe for large models)
      let attempts = 0;
      let connected = false;

      while (attempts < MAX_RETRIES && !connected) {
          try {
              // Try to connect
              await invoke('iniciar_wrapper', {
                  host: WHISPER_HOST,
                  porta: WHISPER_PORT,
                  limite_caracteres: 2000,
                  comprimento_minimo: 0.1,
              });
              connected = true;
          } catch (e: any) {
              if (typeof e === 'string' && e.includes('Wrapper já foi iniciado')) {
                  connected = true;
              } else {
                  console.log(`Connection attempt ${attempts + 1} failed, retrying...`);
                  attempts++;
                  await new Promise(r => setTimeout(r, 500));
              }
          }
      }

      if (!connected) {
           console.error('Falha ao conectar após várias tentativas.');
           alert('Falha ao conectar ao servidor Python. O modelo pode estar demorando para carregar.');
           setIsConnecting(false);
           return;
      }

      // If connected, start transcription immediately
      try {
          await invoke('iniciar_transcricao');
          setIsRecording(true);
          setIsConnecting(false);
      } catch (error) {
          console.error('Falha ao iniciar transcrição:', error);
          alert('Erro ao iniciar fluxo de áudio.');
          setIsConnecting(false);
      }
    }
  };

  // Polling para o texto em tempo real
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRecording || isConnecting) { // Poll while connecting too, to catch early signals
      intervalId = setInterval(async () => {
        try {
          const textoAtual = await invoke<string>('pegar_texto');
          if (textoAtual) {
              // Safety net: If we receive data, we are definitely connected and recording
              if (isConnecting) {
                  // If we get the specific ready signal or just data, we assume success
                   console.log("Data received during connection phase. Switching to recording.");
                   setIsConnecting(false);
                   setIsRecording(true);
              }

              if (textoAtual.includes("[SERVER_READY]")) {
                  const limpio = textoAtual.replace("[SERVER_READY]", "").trim();
                  if (limpio) setSubtitle(limpio);
              } else {
                  setSubtitle(textoAtual);
              }
          }
        } catch (error) {
           // Ignore errors during polling (e.g. if wrapper not fully ready yet)
        }
      }, 100);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording, isConnecting]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [mounted, settings.fontSize]); // Re-observe if elements shift heavily? Actually just dependent on ref existence.

  // Estilos dinâmicos
  const textStyle = {
    fontFamily:
      settings.fontFamily === 'sans'
        ? 'var(--font-sans)'
        : settings.fontFamily === 'serif'
          ? 'serif'
          : 'monospace',
    fontWeight: settings.fontWeight as any,
    fontSize: settings.fontSize,
    color: theme === 'dark' ? 'rgb(228 228 231)' : 'rgb(39 39 42)', // Cor do texto baseada no tema
    transition: 'color 0.3s ease',
  };

  const opacityValue = parseInt(settings.transparency) / 100;
  const backgroundColor = theme === 'dark'
    ? `rgba(24, 24, 27, ${opacityValue})` // zinc-900
    : `rgba(255, 255, 255, ${opacityValue})`; // white

  const compactHeight = (parseInt(settings.fontSize) * 1.625 * 2.0) + 24;

  const handleDragOrDoubleClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, [role="button"], input, select, textarea, a')) {
      return;
    }

    if (e.button === 0) {
      if (e.detail === 2) {
        if (!isFullWidth) {
           // Calculate the current position roughly to save it correctly
           // Because the user might have dragged the window manually without updating 'settings.position'
           let currentApproxPos = settings.position;
           try {
             const appWindow = getCurrentWindow();
             const monitor = await currentMonitor();
             const pos = await appWindow.outerPosition();
             const size = await appWindow.outerSize();
             
             if (monitor) {
                 const screenHeight = monitor.size.height;
                 const centerY = pos.y + (size.height / 2);
                 const relativeY = centerY - monitor.position.y;
                 
                  // Simple heuristic: Top half / Bottom half
                  if (relativeY < screenHeight / 2) {
                      currentApproxPos = 'top';
                  } else {
                      currentApproxPos = 'bottom';
                  }
             }
           } catch (err) {
               console.error("Error calculating position:", err);
           }

           // DOCKING logic
           setPreDockPosition(currentApproxPos); // Save where we ACTUALLY were
           setIsFullWidth(true);
           
           const targetDockPos = currentApproxPos === 'bottom' ? 'bottom' : 'top';
           updateSetting('position', targetDockPos);
           
           const fontSizeValue = parseInt(settings.fontSize);
           const height = (fontSizeValue * 1.625 * 2.0) + 24;
           moveWindow(targetDockPos as any, height, 1.0);
        } else {
           // RESTORING logic
           setIsFullWidth(false);
           const restorePos = (preDockPosition || 'bottom') as any; // Default backup
           updateSetting('position', restorePos);

           const fontSizeValue = parseInt(settings.fontSize);
           const height = (fontSizeValue * 1.625 * 2.0) + 24;
           moveWindow(restorePos, height, 0.95);
           setPreDockPosition(null);
        }
        return;
      }
      startDrag(e);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`flex h-screen w-full flex-col overflow-hidden bg-transparent ${
        settings.position === 'bottom' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        onMouseDown={handleDragOrDoubleClick}
        className="relative flex flex-col w-full overflow-hidden border border-white/10 cursor-grab active:cursor-grabbing"
        style={{ 
          backgroundColor,
          height: compactHeight, // Fixed height for the visual bar
          // When settings are open, we allow overflow so the menu can be seen outside this bar
          // If Radix uses Portal, standard overflow:hidden on this container might CLIP it if the portal root is inside?
          // Radix Portals usually go to document.body.
          // If document.body is transparent, and window is large, we are good.
        }}
      >
        {/* Drag Region - Transparent overlay for extra safety, though parent has it too */}
        <div className="absolute inset-0 z-0" />

        <main className='flex-1 px-4 pb-3 pt-3 relative'>
          <div className='relative flex h-full flex-col'>
            {/* Header com Controles - Compact */}
            {/* Header com Controles - Compact */}
            <div className='absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2 z-30'>
              <motion.button
                onClick={toggleTranscription}
                disabled={isConnecting}
                initial={false}
                animate={{
                  backgroundColor: isRecording ? '#ef4444' : '#22c55e', // red-500 : green-500
                  borderRadius: isRecording ? '50%' : '8px', // circle : rounded-md
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`h-8 w-8 flex items-center justify-center text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isConnecting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : isRecording ? (
                  <Square className='h-3 w-3 fill-current' />
                ) : (
                  <Play className='h-3 w-3 fill-current' />
                )}
              </motion.button>

              {/* Dropdown menu */}
              <div className="relative">
                <SettingsMenu
                  position={settings.position}
                  setPosition={(pos) => {
                    const shouldStayDocked = isFullWidth;
                    setIsFullWidth(shouldStayDocked);
                    updateSetting('position', pos);
                    const fontSizeValue = parseInt(settings.fontSize);
                    const height = (fontSizeValue * 1.625 * 2.0) + 32;
                    const widthPercent = shouldStayDocked ? 1.0 : 0.95;
                    moveWindow(pos as any, height, widthPercent);
                  }}
                  fontFamily={settings.fontFamily}
                  setFontFamily={(val) => updateSetting('fontFamily', val)}
                  fontWeight={settings.fontWeight}
                  setFontWeight={(val) => updateSetting('fontWeight', val)}
                  fontSize={settings.fontSize}
                  setFontSize={(val) => updateSetting('fontSize', val)}
                  transparency={settings.transparency}
                  setTransparency={(val) => updateSetting('transparency', val)}
                  theme={theme}
                  setTheme={setTheme}
                  onOpenChange={setIsSettingsOpen}
                />
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#ef4444", color: "#ffffff" }}
                whileTap={{ scale: 0.95 }}
                className="h-8 w-8 flex items-center justify-center rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-md transition-colors"
                onClick={() => getCurrentWindow().close()}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Subtitle Text Box */}
            <div
              ref={scrollRef}
              className='flex flex-col w-full h-full overflow-hidden z-20 relative px-8 cursor-grab active:cursor-grabbing'
             
              style={{ maxHeight: `calc(${settings.fontSize} * 1.625 * 2.0)` }}
            >
              <div className="flex flex-col w-full max-w-3xl mx-auto min-h-full justify-end">
                {/* Text Container */}
                {subtitle ? (
                  <div
                    className="w-full whitespace-pre-wrap leading-relaxed text-left drop-shadow-md max-w-[90%] break-words relative z-10"
                  >
                    <TypewriterText 
                      text={subtitle.length > 1000 ? subtitle.slice(-1000) : subtitle}
                      style={textStyle}
                      speed={20}
                    />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {isConnecting ? (
                      <motion.div
                        key="connecting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className='w-full flex flex-col items-center justify-center gap-2 relative z-10 my-auto select-none'
                        style={{ ...textStyle, fontSize: `calc(${settings.fontSize} * 0.8)` }}
                      >
                         <Loader2 className='h-6 w-6 animate-spin' />
                         <p>Iniciando modelo...</p>
                      </motion.div>
                    ) : isRecording ? (
                      <motion.p
                        key="listening"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className='w-full text-center italic relative z-10 my-auto select-none'
                        style={{ ...textStyle, fontSize: `calc(${settings.fontSize} * 0.8)` }}
                       
                      >
                        Ouvindo...
                      </motion.p>
                    ) : (
                      <motion.p
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className='w-full text-center italic relative z-10 my-auto select-none'
                        style={{ ...textStyle, fontSize: `calc(${settings.fontSize} * 0.8)` }}
                       
                      >
                        As legendas vão aparecer aqui...
                      </motion.p>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </main >
      </div >
    </div >
  );
}
