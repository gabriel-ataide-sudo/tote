'use client';

import { Baseline } from 'lucide-react';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

interface PositionSettingsProps {
  position: string;
  setPosition: (position: string) => void;
}

export function PositionSettings({
  position,
  setPosition,
}: PositionSettingsProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Baseline className='mr-2 h-4 w-4' />
        <span>Posição</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value='top'>Acima da tela</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='middle'>
            Sobreposto na tela
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='bottom'>
            Abaixo da tela
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}