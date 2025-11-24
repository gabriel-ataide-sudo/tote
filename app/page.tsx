'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { SettingsMenu } from '@/components/SettingMenu';
import { useWindowPosition } from '@/app/hooks/useWindowPosition';
import { useSettingsPersistence } from '@/app/hooks/useSettingsPersistence';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2, X } from 'lucide-react';

export default function Home() {
  const { position, moveWindow } = useWindowPosition();
  const { settings, updateSetting, loaded } = useSettingsPersistence();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync position when settings are loaded
  useEffect(() => {
    if (loaded) {
      moveWindow(settings.position);
    }
  }, [loaded, settings.position, moveWindow]);

  // Estados da Aplicação de Transcrição
  const [subtitle, setSubtitle] = useState('As legendas irão aparecer aqui...');

  // Auto-scroll to bottom when subtitle changes
  useEffect(() => {
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
            limite_caracteres: 300,
            comprimento_minimo: 0.8,
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
    transition: 'all 0.3s ease',
  };

  const opacityValue = parseInt(settings.transparency) / 100;
  const backgroundColor = theme === 'dark'
    ? `rgba(24, 24, 27, ${opacityValue})` // zinc-900
    : `rgba(255, 255, 255, ${opacityValue})`; // white

  if (!mounted) return null;

  return (
    <div
      className="flex h-screen w-full flex-col overflow-hidden bg-transparent"
    >
      <div
        className="relative flex flex-col w-full h-auto min-h-[80px] overflow-hidden rounded-xl border border-white/10 shadow-sm"
        style={{ backgroundColor }}
      >
        {/* Drag Region */}
        <div data-tauri-drag-region className="h-6 w-full cursor-move bg-transparent absolute top-0 left-0 z-10" />

        <main className='flex-1 px-4 pb-3 pt-3 relative'>
          <div className='relative flex h-full flex-col'>
            {/* Header com Controles - Compact */}
            <div className='absolute top-2 right-2 flex items-center gap-2 z-30'>
              <Button
                onClick={toggleTranscription}
                disabled={isConnecting}
                variant={isRecording ? 'destructive' : 'ghost'}
                size="sm"
                className='h-7 gap-2'
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
                    moveWindow(pos as any);
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
                />
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-red-500 hover:text-white"
                onClick={() => getCurrentWindow().close()}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Subtitle Text Box */}
            <div
              ref={scrollRef}
              className='flex items-end w-full overflow-y-auto scrollbar-hide z-20 relative px-8'
              style={{ maxHeight: `calc(${settings.fontSize} * 1.625 * 2)` }}
            >
              <p
                className='w-full whitespace-pre-wrap leading-relaxed text-left drop-shadow-md max-w-[90%]'
                style={textStyle}
              >
                {subtitle}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
