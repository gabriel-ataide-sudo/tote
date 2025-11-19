'use client';

import { Sun } from 'lucide-react';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeSettingsProps {
  theme?: string;
  setTheme: (theme: string) => void;
}

export function ThemeSettings({ theme, setTheme }: ThemeSettingsProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun className='mr-2 h-4 w-4' />
        <span>Tema</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value='light' onSelect={(e) => e.preventDefault()}>Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='dark' onSelect={(e) => e.preventDefault()}>Escuro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='system' onSelect={(e) => e.preventDefault()}>Sistema</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}