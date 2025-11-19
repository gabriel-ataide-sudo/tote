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
import { Slider } from '@/components/ui/slider';

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
        <span>Transparência</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="p-4 min-w-[200px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Opacidade</span>
            <span className="text-sm text-muted-foreground">{transparency}%</span>
          </div>
          <Slider
            value={[parseInt(transparency)]}
            onValueChange={(value) => setTransparency(value[0].toString())}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
