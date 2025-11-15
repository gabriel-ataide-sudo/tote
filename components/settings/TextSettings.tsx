'use client';

import { Type } from 'lucide-react';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

interface TextSettingsProps {
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontWeight: string;
  setFontWeight: (weight: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
}

export function TextSettings({
  fontFamily,
  setFontFamily,
  fontWeight,
  setFontWeight,
  fontSize,
  setFontSize,
}: TextSettingsProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Type className='mr-2 h-4 w-4' />
        <span>Texto</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {/* Submenu Nível 2: Fonte */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Fonte</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={fontFamily}
              onValueChange={setFontFamily}
            >
              <DropdownMenuRadioItem value='sans'>
                Sans-Serif
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='serif'>Serif</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='mono'>
                Monospace
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* Submenu Nível 2: Peso */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Peso</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={fontWeight}
              onValueChange={setFontWeight}
            >
              <DropdownMenuRadioItem value='light'>Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='normal'>
                Normal
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='bold'>Bold</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* Submenu Nível 2: Tamanho */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Tamanho</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={fontSize}
              onValueChange={setFontSize}
            >
              <DropdownMenuRadioItem value='14px'>
                Pequeno
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='16px'>Médio</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='20px'>Grande</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
