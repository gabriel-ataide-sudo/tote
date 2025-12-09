// components/SettingsMenu.tsx
'use client';

import { Settings, Type, Layout, Box, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

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
  onOpenChange?: (open: boolean) => void;
}

export function SettingsMenu(props: SettingsMenuProps) {
  return (
    <DropdownMenu onOpenChange={props.onOpenChange}>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-8 w-8 flex items-center justify-center rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-md"
        >
          <Settings className='h-4 w-4' />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80 max-w-[calc(100vw-1rem)]' sideOffset={10} align="end" side={props.position === 'bottom' ? 'top' : 'bottom'}>
        <DropdownMenuLabel className="select-none">Configurações</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-2 space-y-4 select-none">
          <PositionSettings {...props} />
          <DropdownMenuSeparator />
          <TextSettings {...props} />
          <DropdownMenuSeparator />
          <BoxSettings {...props} />
          <DropdownMenuSeparator />
          <ThemeSettings {...props} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PositionSettings({ position, setPosition }: SettingsMenuProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Layout className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Posição</Label>
      </div>
      <RadioGroup
        value={position}
        onValueChange={setPosition}
        className="grid grid-cols-3 gap-2"
      >
        <div>
          <RadioGroupItem value="top" id="pos-top" className="peer sr-only" />
          <Label
            htmlFor="pos-top"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            Top
          </Label>
        </div>
        <div>
          <RadioGroupItem value="middle" id="pos-middle" className="peer sr-only" />
          <Label
            htmlFor="pos-middle"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            Mid
          </Label>
        </div>
        <div>
          <RadioGroupItem value="bottom" id="pos-bottom" className="peer sr-only" />
          <Label
            htmlFor="pos-bottom"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            Bot
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}

function TextSettings({
  fontFamily,
  setFontFamily,
  fontWeight,
  setFontWeight,
  fontSize,
  setFontSize,
}: SettingsMenuProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Texto</Label>
      </div>

      <div className="grid grid-cols-1 min-[240px]:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Fonte</Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans">Sans</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="monospace">Mono</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Peso</Label>
          <Select value={fontWeight} onValueChange={setFontWeight}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Peso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Negrito</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs text-muted-foreground">Tamanho</Label>
          <span className="text-xs text-muted-foreground">{fontSize}</span>
        </div>
        <Slider
          value={[parseInt(fontSize)]}
          onValueChange={(vals) => setFontSize(`${vals[0]}px`)}
          min={12}
          max={48}
          step={1}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        />
      </div>
    </div>
  );
}

function BoxSettings({ transparency, setTransparency }: SettingsMenuProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Janela</Label>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <Label className="text-xs text-muted-foreground">Opacidade</Label>
          <span className="text-xs text-muted-foreground">{transparency}%</span>
        </div>
        <Slider
          value={[parseInt(transparency)]}
          onValueChange={(vals) => setTransparency(vals[0].toString())}
          min={10}
          max={100}
          step={5}
          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        />
      </div>
    </div>
  );
}

function ThemeSettings({ theme, setTheme }: SettingsMenuProps) {
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isDark ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
        <Label className="text-sm font-medium">Tema Escuro</Label>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
    </div>
  )
}
