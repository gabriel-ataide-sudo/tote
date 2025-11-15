// components/SettingsMenu.tsx
'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Importa todos os sub-componentes de configurações
import { PositionSettings } from './settings/PositionSettings';
import { TextSettings } from './settings/TextSettings';
import { BoxSettings } from './settings/BoxSettings';
import { ThemeSettings } from './settings/ThemeSettings';

// Define uma interface de props que combina todas as props necessárias
// para todos os sub-componentes.
interface SettingsMenuProps {
  position: string;
  setPosition: (position: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontWeight: string;
  setFontWeight: (weight: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  transparency: string;
  setTransparency: (value: string) => void;
  theme?: string;
  setTheme: (theme: string) => void;
}

export function SettingsMenu(props: SettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Settings className='h-5 w-5 text-zinc-600 dark:text-zinc-400' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Configurações</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <PositionSettings {...props} />
        <TextSettings {...props} />
        <BoxSettings {...props} />

        <DropdownMenuSeparator />

        <ThemeSettings {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
