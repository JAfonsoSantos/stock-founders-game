import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ColorPicker';
import { toast } from '@/hooks/use-toast';
import { Download, Upload, RotateCcw } from 'lucide-react';

interface ColorConfig {
  name: string;
  description: string;
  cssVar: string;
  defaultValue: string;
  category: 'primary' | 'neutral' | 'semantic' | 'background';
}

const colorConfigs: ColorConfig[] = [
  // Primary Colors
  { name: 'Primary', description: 'Cor principal do site (botões, links)', cssVar: '--primary', defaultValue: '#FF6B35', category: 'primary' },
  { name: 'Primary Foreground', description: 'Texto em elementos primários', cssVar: '--primary-foreground', defaultValue: '#ffffff', category: 'primary' },
  
  // Neutral Colors  
  { name: 'Background', description: 'Fundo principal das páginas', cssVar: '--background', defaultValue: '#ffffff', category: 'background' },
  { name: 'Foreground', description: 'Cor principal do texto', cssVar: '--foreground', defaultValue: '#0f172a', category: 'neutral' },
  { name: 'Muted', description: 'Fundo de elementos neutros', cssVar: '--muted', defaultValue: '#f1f5f9', category: 'neutral' },
  { name: 'Muted Foreground', description: 'Texto secundário', cssVar: '--muted-foreground', defaultValue: '#64748b', category: 'neutral' },
  { name: 'Card', description: 'Fundo dos cartões', cssVar: '--card', defaultValue: '#ffffff', category: 'background' },
  { name: 'Card Foreground', description: 'Texto nos cartões', cssVar: '--card-foreground', defaultValue: '#0f172a', category: 'neutral' },
  
  // Borders
  { name: 'Border', description: 'Cor das bordas', cssVar: '--border', defaultValue: '#e2e8f0', category: 'neutral' },
  { name: 'Input', description: 'Fundo dos inputs', cssVar: '--input', defaultValue: '#e2e8f0', category: 'neutral' },
  { name: 'Ring', description: 'Cor do foco nos elementos', cssVar: '--ring', defaultValue: '#FF6B35', category: 'primary' },
  
  // Secondary
  { name: 'Secondary', description: 'Cor secundária', cssVar: '--secondary', defaultValue: '#f1f5f9', category: 'neutral' },
  { name: 'Secondary Foreground', description: 'Texto em elementos secundários', cssVar: '--secondary-foreground', defaultValue: '#0f172a', category: 'neutral' },
  
  // Accent
  { name: 'Accent', description: 'Cor de destaque', cssVar: '--accent', defaultValue: '#f1f5f9', category: 'neutral' },
  { name: 'Accent Foreground', description: 'Texto em elementos de destaque', cssVar: '--accent-foreground', defaultValue: '#0f172a', category: 'neutral' },
  
  // Semantic Colors
  { name: 'Destructive', description: 'Cor para ações destrutivas (erro)', cssVar: '--destructive', defaultValue: '#ef4444', category: 'semantic' },
  { name: 'Destructive Foreground', description: 'Texto em elementos destrutivos', cssVar: '--destructive-foreground', defaultValue: '#ffffff', category: 'semantic' },
];

export default function Setup() {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load current colors from CSS variables
    const root = document.documentElement;
    const currentColors: Record<string, string> = {};
    
    colorConfigs.forEach(config => {
      const value = getComputedStyle(root).getPropertyValue(config.cssVar).trim();
      currentColors[config.cssVar] = value || config.defaultValue;
    });
    
    setColors(currentColors);
    setIsLoading(false);
  }, []);

  const handleColorChange = (cssVar: string, color: string) => {
    // Convert color to HSL if it's hex
    const hslColor = hexToHsl(color);
    
    // Update CSS variable
    document.documentElement.style.setProperty(cssVar, hslColor);
    
    // Update state
    setColors(prev => ({
      ...prev,
      [cssVar]: hslColor
    }));
  };

  const hexToHsl = (hex: string): string => {
    if (hex.startsWith('hsl')) return hex;
    
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };

  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(' ').map((val, idx) => {
      if (idx === 0) return parseInt(val);
      return parseInt(val.replace('%', ''));
    });
    
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;
    
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs((hNorm * 6) % 2 - 1));
    const m = lNorm - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= hNorm * 6 && hNorm * 6 < 1) {
      r = c; g = x; b = 0;
    } else if (1 <= hNorm * 6 && hNorm * 6 < 2) {
      r = x; g = c; b = 0;
    } else if (2 <= hNorm * 6 && hNorm * 6 < 3) {
      r = 0; g = c; b = x;
    } else if (3 <= hNorm * 6 && hNorm * 6 < 4) {
      r = 0; g = x; b = c;
    } else if (4 <= hNorm * 6 && hNorm * 6 < 5) {
      r = x; g = 0; b = c;
    } else if (5 <= hNorm * 6 && hNorm * 6 < 6) {
      r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const resetToDefaults = () => {
    colorConfigs.forEach(config => {
      const hslColor = hexToHsl(config.defaultValue);
      document.documentElement.style.setProperty(config.cssVar, hslColor);
      setColors(prev => ({
        ...prev,
        [config.cssVar]: hslColor
      }));
    });
    
    toast({
      title: "Cores restauradas",
      description: "Todas as cores foram restauradas para os valores padrão."
    });
  };

  const exportConfig = () => {
    const config = colorConfigs.map(item => ({
      name: item.name,
      cssVar: item.cssVar,
      value: colors[item.cssVar]
    }));
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stox-colors.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuração exportada",
      description: "Arquivo de configuração de cores baixado com sucesso."
    });
  };

  const groupedConfigs = colorConfigs.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, ColorConfig[]>);

  const categoryNames = {
    primary: 'Cores Principais',
    neutral: 'Cores Neutras', 
    semantic: 'Cores Semânticas',
    background: 'Fundos'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuração de Cores</h1>
          <p className="text-gray-600 mb-6">Personalize todas as cores do site de forma visual e interativa.</p>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Padrões
            </Button>
            <Button variant="outline" onClick={exportConfig}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Configuração
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(groupedConfigs).map(([category, configs]) => (
            <Card key={category} className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  {categoryNames[category as keyof typeof categoryNames]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {configs.map(config => (
                  <ColorPicker
                    key={config.cssVar}
                    label={config.name}
                    description={config.description}
                    color={hslToHex(colors[config.cssVar] || config.defaultValue)}
                    onChange={(color) => handleColorChange(config.cssVar, color)}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-background border border-border rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Cartão de Exemplo</h3>
                  <p className="text-muted-foreground text-sm mb-3">Texto secundário de exemplo</p>
                  <Button size="sm">Botão Principal</Button>
                </div>
                
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-semibold text-card-foreground mb-2">Outro Cartão</h3>
                  <p className="text-muted-foreground text-sm mb-3">Mais texto de exemplo</p>
                  <Button variant="secondary" size="sm">Botão Secundário</Button>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Área Muted</h3>
                  <p className="text-muted-foreground text-sm mb-3">Texto em área neutra</p>
                  <Button variant="destructive" size="sm">Botão Erro</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}