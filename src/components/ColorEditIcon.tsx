import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ColorEditIconProps {
  currentColor: string;
  onChange: (color: string) => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  description?: string;
}

export function ColorEditIcon({ currentColor, onChange, position = 'top', description }: ColorEditIconProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(currentColor);

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };

  const presetColors = [
    '#FF6B35', '#FF8A5B', '#FFB84D', '#FFF3A0',
    '#A8E6CF', '#88D8C0', '#78C6A3', '#68B2A0',
    '#4ECDC4', '#44A08D', '#6B73FF', '#9B59B6',
    '#E74C3C', '#F39C12', '#F1C40F', '#2ECC71',
    '#3498DB', '#9B59B6', '#1ABC9C', '#E67E22',
    '#95A5A6', '#34495E', '#2C3E50', '#000000'
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute z-10 w-6 h-6 p-0 rounded-full bg-white border-2 border-orange-500 shadow-lg hover:scale-110 transition-transform"
          style={{ 
            backgroundColor: currentColor,
            borderColor: '#FF6B35'
          }}
        >
          <Palette className="w-3 h-3 text-white drop-shadow-sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 bg-white border-gray-200 shadow-xl" 
        side={position}
      >
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              {description || 'Editar Cor'}
            </div>
            <div className="flex space-x-2">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-8 rounded border border-gray-200 cursor-pointer"
              />
              <Input
                value={tempColor}
                onChange={(e) => setTempColor(e.target.value)}
                onBlur={() => onChange(tempColor)}
                className="flex-1 font-mono text-sm"
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Cores Rápidas</div>
            <div className="grid grid-cols-8 gap-1">
              {presetColors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorChange(color)}
                  className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}