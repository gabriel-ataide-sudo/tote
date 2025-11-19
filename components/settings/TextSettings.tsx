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
              <DropdownMenuRadioItem value='sans' onSelect={(e) => e.preventDefault()}>
                Sans-Serif
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='serif' onSelect={(e) => e.preventDefault()}>Serif</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='mono' onSelect={(e) => e.preventDefault()}>
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
              <DropdownMenuRadioItem value='light' onSelect={(e) => e.preventDefault()}>Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='normal' onSelect={(e) => e.preventDefault()}>
                Normal
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='bold' onSelect={(e) => e.preventDefault()}>Bold</DropdownMenuRadioItem>
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
              <DropdownMenuRadioItem value='14px' onSelect={(e) => e.preventDefault()}>
                Pequeno
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='16px' onSelect={(e) => e.preventDefault()}>Médio</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='20px' onSelect={(e) => e.preventDefault()}>Grande</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
