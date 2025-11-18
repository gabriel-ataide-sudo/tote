// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { SettingsMenu } from '@/components/SettingMenu';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2 } from 'lucide-react'; // Certifique-se de ter lucide-react instalado ou use ícones SVG

export default function Home() {
  // Estados de Configuração Visual
  const [position, setPosition] = useState('middle');
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontSize, setFontSize] = useState('16px');
  const [transparency, setTransparency] = useState('100');

  // Estados da Aplicação de Transcrição
  const [subtitle, setSubtitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { theme, setTheme } = useTheme();

  // Configurações do Servidor Whisper (Python)
  const WHISPER_HOST = '127.0.0.1';
  const WHISPER_PORT = 43007;

  // Função para Iniciar/Parar a Transcrição
  const toggleTranscription = async () => {
    if (isRecording) {
      // Parar
      try {
        await invoke('parar_transcricao');
        setIsRecording(false);
      } catch (error) {
        console.error('Erro ao parar:', error);
      }
    } else {
      // Iniciar
      setIsConnecting(true);
      try {
        // 1. Inicializa o Wrapper (Conecta ao socket Python)
        // Ignoramos o erro se ele já estiver iniciado
        try {
          await invoke('iniciar_wrapper', {
            host: WHISPER_HOST,
            porta: WHISPER_PORT,
            limite_caracteres: 300, // Limite de caracteres para quebra
            comprimento_minimo: 0.5,
          });
        } catch (e: any) {
          if (typeof e === 'string' && !e.includes('Wrapper já foi iniciado')) {
            throw e;
          }
        }

        // 2. Inicia o envio de áudio
        await invoke('iniciar_transcricao');
        setIsRecording(true);
      } catch (error) {
        console.error('Erro ao conectar:', error);
        alert(
          "Falha ao conectar ao servidor Python. Verifique se o script 'simulstreaming_whisper_server.py' está rodando."
        );
      } finally {
        setIsConnecting(false);
      }
    }
  };

  // Polling: Busca o texto atualizado do Rust a cada 100ms
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
          console.error('Erro no polling:', error);
        }
      }, 1);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording]);

  // Estilos dinâmicos baseados nas configurações
  const textStyle = {
    fontFamily:
      fontFamily === 'sans'
        ? 'var(--font-sans)'
        : fontFamily === 'serif'
        ? 'var(--font-serif)'
        : 'var(--font-mono)',
    fontWeight: fontWeight as any,
    fontSize: fontSize,
    opacity: parseInt(transparency) / 100,
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-100 font-sans dark:bg-zinc-950'>
      <main className='container p-4'>
        <div className='relative flex flex-col rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900'>
          {/* Header com Controles e Configurações */}
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <h1 className='text-lg font-semibold text-black dark:text-zinc-50'>
                Tote
              </h1>

              {/* Botão de Controle Principal */}
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
            </div>

            {/* Menu de Configurações */}
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

          {/* Área de Legenda */}
          <div
            className={`min-h-[200px] w-full rounded-md border bg-zinc-50 p-4 dark:bg-zinc-800 transition-all overflow-y-auto flex ${
              position === 'top'
                ? 'items-start'
                : position === 'bottom'
                ? 'items-end'
                : 'items-center'
            }`}
          >
            <p
              className='text-zinc-800 dark:text-zinc-200 w-full text-center whitespace-pre-wrap'
              style={textStyle}
            >
              {subtitle || 'As legendas aparecerão aqui quando você iniciar...'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
