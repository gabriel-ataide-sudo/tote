// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { SettingsMenu } from '@/components/SettingMenu';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2 } from 'lucide-react';

export default function Home() {
  // Estados de Configuração Visual (Restaurados para os defaults do código original)
  const [position, setPosition] = useState('middle');
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontSize, setFontSize] = useState('16px');
  const [transparency, setTransparency] = useState('100');

  // Estados da Aplicação de Transcrição
  const [subtitle, setSubtitle] = useState('As legendas irão aparecer aqui...');
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

  // Estilos dinâmicos
  const textStyle = {
    fontFamily:
      fontFamily === 'sans'
        ? 'var(--font-sans)'
        : fontFamily === 'serif'
        ? 'serif'
        : 'monospace',
    fontWeight: fontWeight as any,
    fontSize: fontSize,
    opacity: parseInt(transparency) / 100,
    color: theme === 'dark' ? 'rgb(228 228 231)' : 'rgb(39 39 42)', // Cor do texto baseada no tema
  };

  // Classe de fundo restaurada (bg-zinc-900 / bg-white)
  const boxClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';

  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-100 font-sans dark:bg-zinc-950'>
      <main className='container p-4'>
        <div
          className={`relative flex flex-col rounded-lg border p-6 shadow-sm ${boxClass}`}
        >
          {/* Header com Controles e Configurações */}
          <div className='mb-4 flex items-center justify-between'>
            <h1 className='text-lg font-semibold text-black dark:text-zinc-50'>
              Texto recebido da IA
            </h1>

            <div className='flex items-center gap-4'>
              <Button
                onClick={toggleTranscription}
                disabled={isConnecting}
                variant={isRecording ? 'destructive' : 'default'}
                className='flex items-center gap-2'
              >
                {isConnecting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : isRecording ? (
                  <>
                    <Square className='h-4 w-4 fill-current' /> Parar
                  </>
                ) : (
                  <>
                    <Play className='h-4 w-4 fill-current' /> Iniciar
                  </>
                )}
              </Button>

              {/* Dropdown menu */}
              <SettingsMenu
                position={position}
                setPosition={setPosition}
                fontFamily={fontFamily}
                setFontFamily={setFontFamily}
                fontWeight={fontWeight}
                setFontWeight={setFontWeight}
                fontSize={fontSize}
                setFontSize={setFontSize}
                transparency={transparency}
                setTransparency={setTransparency}
                theme={theme}
                setTheme={setTheme}
              />
            </div>
          </div>

          {/* Subtitle Text Box */}
          <div className='min-h-[120px] w-full rounded-md border bg-zinc-50 dark:bg-zinc-800 p-4 relative overflow-hidden'>
            <div className='flex flex-col justify-end h-full w-full'>
              <p
                className='w-full whitespace-pre-wrap leading-snug text-center'
                style={textStyle}
              >
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
