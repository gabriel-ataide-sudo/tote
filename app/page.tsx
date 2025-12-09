'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useTheme } from 'next-themes';
import { SettingsMenu } from '@/components/SettingMenu';
import { useWindowPosition } from '@/app/hooks/useWindowPosition';
import { useSettingsPersistence } from '@/app/hooks/useSettingsPersistence';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { position, moveWindow, resizeWindow } = useWindowPosition();
  const { settings, updateSetting, loaded } = useSettingsPersistence();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Estados da Aplicação de Transcrição
  const [subtitle, setSubtitle] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Effect 1: Snap to preset position when position setting changes or apps loads
  useEffect(() => {
    if (loaded) {
      const fontSizeValue = parseInt(settings.fontSize);
      const compactHeight = (fontSizeValue * 1.625 * 2.5) + 48;
      const targetHeight = isSettingsOpen ? compactHeight + 350 : compactHeight;

      // This will snap the window to Top/Bottom/Mid of monitor
      moveWindow(settings.position, targetHeight);
    }
  }, [loaded, settings.position, moveWindow]); // Dependencies: Only position changes cause snap

  // Effect 2: Resize in place when settings toggle or content size changes
  useEffect(() => {
    if (loaded) {
      const fontSizeValue = parseInt(settings.fontSize);
      const compactHeight = (fontSizeValue * 1.625 * 2.5) + 48;
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
        setIsRecording(false);
      } catch (error) {
        console.error('Erro ao parar:', error);
      }
    } else {
      setIsConnecting(true);
      try {
        try {
          await invoke('iniciar_wrapper', {
            host: WHISPER_HOST,
            porta: WHISPER_PORT,
            limite_caracteres: 2000,
            comprimento_minimo: 0.1,
          });
        } catch (e: any) {
          if (typeof e === 'string' && !e.includes('Wrapper já foi iniciado')) {
            throw e;
          }
        }
        await invoke('iniciar_transcricao');
        setIsRecording(true);
        setSubtitle('');
      } catch (error) {
        console.error('Falha ao conectar/iniciar transcrição:', error);
        alert('Falha ao conectar ao servidor Python.');
      } finally {
        setIsConnecting(false);
      }
    }
  };

  // Polling para o texto em tempo real
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRecording) {
      intervalId = setInterval(async () => {
        try {
          const textoAtual = await invoke<string>('pegar_texto');
          if (textoAtual) {
            setSubtitle(textoAtual);
          }
        } catch (error) {
          // Captura o erro no polling (o Rust pode travar se o wrapper perder a conexão)
          console.debug(
            'Erro no polling (normal durante interrupções):',
            error
          );
        }
      }, 100);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const compactHeight = (parseInt(settings.fontSize) * 1.625 * 2.5) + 48;

  if (!mounted) return null;

  return (
    <div
      className={`flex h-screen w-full flex-col overflow-hidden bg-transparent ${
        settings.position === 'bottom' ? 'justify-end' : settings.position === 'middle' ? 'justify-center' : 'justify-start'
      }`}
    >
      <div
        data-tauri-drag-region
        className="relative flex flex-col w-full overflow-hidden border border-white/10 cursor-grab active:cursor-grabbing"
        style={{ 
          backgroundColor,
          height: compactHeight, // Fixed height for the visual bar
          // When settings are open, we allow overflow so the menu can be seen outside this bar
          // BUT... if we use overflow-visible, the content inside (text) might spill?
          // The text container has overflow-y-auto, so it should handle itself.
          // The settings menu is in a Portal usually? No, in Tauri it might be inside DOM.
          // If Radix uses Portal, standard overflow:hidden on this container might CLIP it if the portal root is inside?
          // Radix Portals usually go to document.body. 
          // If document.body is transparent, and window is large, we are good.
        }}
      >
        {/* Drag Region - Transparent overlay for extra safety, though parent has it too */}
        <div data-tauri-drag-region className="absolute inset-0 z-0" />

        <main data-tauri-drag-region className='flex-1 px-4 pb-3 pt-3 relative'>
          <div className='relative flex h-full flex-col'>
            {/* Header com Controles - Compact */}
            {/* Header com Controles - Compact */}
            <div className='absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2 z-30'>
              <Button
                onClick={toggleTranscription}
                disabled={isConnecting}
                variant={isRecording ? 'destructive' : 'ghost'}
                size="icon"
                className='h-8 w-8'
              >
                {isConnecting ? (
                  <Loader2 className='h-3 w-3 animate-spin' />
                ) : isRecording ? (
                  <Square className='h-3 w-3 fill-current' />
                ) : (
                  <Play className='h-3 w-3 fill-current' />
                )}
              </Button>

              {/* Dropdown menu */}
              <div className="relative">
                <SettingsMenu
                  position={settings.position}
                  setPosition={(pos) => {
                    updateSetting('position', pos);
                    const fontSizeValue = parseInt(settings.fontSize);
                    const height = (fontSizeValue * 1.625 * 2.5) + 48;
                    moveWindow(pos as any, height);
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-500 hover:text-white"
                onClick={() => getCurrentWindow().close()}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Subtitle Text Box */}
            <div
              ref={scrollRef}
              className='flex flex-col w-full h-full overflow-y-auto scrollbar-hide z-20 relative px-8 cursor-grab active:cursor-grabbing'
              data-tauri-drag-region
              style={{ maxHeight: `calc(${settings.fontSize} * 1.625 * 2.5 + 16px)` }}
            >
              <div className="flex flex-col w-full max-w-3xl mx-auto min-h-full" data-tauri-drag-region>
                {/* Text Container */}
                {subtitle ? (
                  <div
                    className="w-full whitespace-pre-wrap leading-relaxed text-left drop-shadow-md max-w-[90%] break-words relative z-10"
                    style={textStyle}
                    data-tauri-drag-region
                  >
                    {subtitle.split(/(\s+)/).map((part, index) => {
                      if (part.match(/\s+/)) {
                        return <span key={index} data-tauri-drag-region>{part}</span>;
                      }
                      if (part.length === 0) return null;
                      return (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.05 }}
                          className="inline-block"
                          data-tauri-drag-region
                        >
                          {part}
                        </motion.span>
                      );
                    })}
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {isRecording ? (
                      <motion.p
                        key="listening"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className='w-full text-center italic relative z-10 my-auto select-none'
                        style={{ ...textStyle, fontSize: `calc(${settings.fontSize} * 0.8)` }}
                        data-tauri-drag-region
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
                        data-tauri-drag-region
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
