'use client';

import { Square } from 'lucide-react';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

interface BoxSettingsProps {
  transparency: string;
  setTransparency: (value: string) => void;
}

export function BoxSettings({
  transparency,
  setTransparency,
}: BoxSettingsProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Square className='mr-2 h-4 w-4' />
        <span>Caixa</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuLabel>Transparência</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={transparency}
          onValueChange={setTransparency}
        >
          <DropdownMenuRadioItem value='100'>
            Sólido (100%)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='75'>75%</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='50'>
            Semissólido (50%)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='0'>
            Transparente (0%)
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
