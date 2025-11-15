'use client';

import { SunMoon } from 'lucide-react';
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
        <SunMoon className='mr-2 h-4 w-4' />
        <span>Modo</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value='light'>Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='dark'>Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='system'>System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}