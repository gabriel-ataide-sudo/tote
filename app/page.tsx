// app/page.tsx
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { SettingsMenu } from '@/components/SettingMenu'; // Importamos nosso novo componente

export default function Home() {
  const [position, setPosition] = useState('middle');
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontSize, setFontSize] = useState('16px');
  const [transparency, setTransparency] = useState('100');

  const { theme, setTheme } = useTheme();

  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-100 font-sans dark:bg-zinc-950'>
      <main className='container p-4'>
        <div className='relative flex flex-col rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900'>
          {/* Header com Título e Configurações */}
          <div className='mb-4 flex items-center justify-between'>
            <h1 className='text-lg font-semibold text-black dark:text-zinc-50'>
              Texto recebido da IA
            </h1>

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

          {/* Subtitle Text Box */}
          <div className='min-h-[200px] w-full rounded-md border bg-zinc-50 p-4 dark:bg-zinc-800'>
            <p className='text-zinc-400 dark:text-zinc-500'>
              As legendas irão aparecer aqui...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
