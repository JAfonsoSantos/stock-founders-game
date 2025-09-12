import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
  description?: string;
}

export function ColorPicker({ color, onChange, label, description }: ColorPickerProps) {
  const [tempColor, setTempColor] = useState(color);
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
    onChange(newColor);
  };

  const presetColors = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a',
    '#fef2f2', '#fee2e2', '#fecaca', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a',
    '#fff7ed', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#dc2626', '#c2410c', '#9a3412', '#7c2d12',
    '#fffbeb', '#fef3c7', '#fde68a', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12', '#422006',
    '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
    '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
    '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
    '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-12 p-2 justify-start bg-white border-gray-200 hover:bg-gray-50"
          >
            <div 
              className="w-8 h-8 rounded border border-gray-200 mr-3" 
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 text-left">
              <div className="font-mono text-sm">{color}</div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-white border-gray-200 shadow-lg">
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Escolher Cor</Label>
              <div className="flex space-x-2 mt-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-8 rounded border border-gray-200"
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
              <Label className="text-sm">Cores Predefinidas</Label>
              <div className="grid grid-cols-11 gap-1 mt-2">
                {presetColors.map((presetColor, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorChange(presetColor)}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}