import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/ColorPicker';
import { toast } from '@/hooks/use-toast';
import { Download, Upload, RotateCcw, Search, Palette } from 'lucide-react';

interface ColorConfig {
  name: string;
  description: string;
  cssVar: string;
  defaultValue: string;
  category: 'primary' | 'neutral' | 'semantic' | 'background' | 'navigation' | 'text' | 'buttons' | 'forms';
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

  // Specific Page Colors
  { name: 'Page Background', description: 'Fundo geral das páginas (cinza claro)', cssVar: '--page-bg', defaultValue: '#f8fafc', category: 'background' },
  { name: 'Header Background', description: 'Fundo do header/sidebar', cssVar: '--header-bg', defaultValue: '#f1f5f9', category: 'background' },
  { name: 'Input Background', description: 'Fundo dos campos de input', cssVar: '--input-bg', defaultValue: '#ffffff', category: 'background' },
  { name: 'Input Border', description: 'Bordas dos inputs', cssVar: '--input-border', defaultValue: '#d1d5db', category: 'neutral' },
  { name: 'Input Placeholder', description: 'Texto placeholder nos inputs', cssVar: '--input-placeholder', defaultValue: '#9ca3af', category: 'neutral' },
  { name: 'Input Text', description: 'Texto nos inputs', cssVar: '--input-text', defaultValue: '#374151', category: 'neutral' },
  
  // Navigation Colors
  { name: 'Nav Step Active', description: 'Cor do passo ativo na navegação', cssVar: '--nav-step-active', defaultValue: '#FF6B35', category: 'primary' },
  { name: 'Nav Step Inactive', description: 'Cor dos passos inativos', cssVar: '--nav-step-inactive', defaultValue: '#6b7280', category: 'neutral' },
  { name: 'Nav Step Completed', description: 'Cor dos passos completos', cssVar: '--nav-step-completed', defaultValue: '#10b981', category: 'semantic' },
  
  // Text Variations
  { name: 'Text Primary', description: 'Texto principal (títulos)', cssVar: '--text-primary', defaultValue: '#111827', category: 'neutral' },
  { name: 'Text Secondary', description: 'Texto secundário (subtítulos)', cssVar: '--text-secondary', defaultValue: '#6b7280', category: 'neutral' },
  { name: 'Text Tertiary', description: 'Texto terciário (labels)', cssVar: '--text-tertiary', defaultValue: '#9ca3af', category: 'neutral' },
  { name: 'Text Disabled', description: 'Texto desabilitado', cssVar: '--text-disabled', defaultValue: '#d1d5db', category: 'neutral' },
  
  // Button Variations
  { name: 'Button Secondary BG', description: 'Fundo botão secundário', cssVar: '--button-secondary-bg', defaultValue: '#f9fafb', category: 'background' },
  { name: 'Button Secondary Text', description: 'Texto botão secundário', cssVar: '--button-secondary-text', defaultValue: '#374151', category: 'neutral' },
  { name: 'Button Secondary Border', description: 'Borda botão secundário', cssVar: '--button-secondary-border', defaultValue: '#d1d5db', category: 'neutral' },
  
  // Form Elements
  { name: 'Radio Active', description: 'Radio button selecionado', cssVar: '--radio-active', defaultValue: '#FF6B35', category: 'primary' },
  { name: 'Radio Inactive', description: 'Radio button não selecionado', cssVar: '--radio-inactive', defaultValue: '#d1d5db', category: 'neutral' },
  { name: 'Checkbox Active', description: 'Checkbox selecionado', cssVar: '--checkbox-active', defaultValue: '#FF6B35', category: 'primary' },
  { name: 'Toggle Active', description: 'Toggle ligado', cssVar: '--toggle-active', defaultValue: '#FF6B35', category: 'primary' },
  { name: 'Toggle Inactive', description: 'Toggle desligado', cssVar: '--toggle-inactive', defaultValue: '#d1d5db', category: 'neutral' },
];

export default function Setup() {
  const navigate = useNavigate();
  const [colors, setColors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const groupedConfigs = colorConfigs
    .filter(config => 
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, config) => {
      if (!acc[config.category]) acc[config.category] = [];
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, ColorConfig[]>);

  const categoryNames = {
    primary: 'Cores Principais',
    neutral: 'Cores Neutras', 
    semantic: 'Cores Semânticas',
    background: 'Fundos',
    navigation: 'Navegação',
    text: 'Variações de Texto',
    buttons: 'Botões',
    forms: 'Formulários'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Palette className="w-8 h-8 text-orange-500" />
            Configuração de Cores
          </h1>
          <p className="text-gray-600 mb-6">Personalize todas as cores do site de forma visual e interativa.</p>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-orange-500">{colorConfigs.length}</div>
              <div className="text-sm text-gray-600">Total de Cores</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-500">{Object.keys(groupedConfigs).length}</div>
              <div className="text-sm text-gray-600">Categorias</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-500">{Object.values(groupedConfigs).flat().length}</div>
              <div className="text-sm text-gray-600">Visíveis</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-purple-500">{searchTerm ? 'Filtrando' : 'Todos'}</div>
              <div className="text-sm text-gray-600">Estado</div>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar cores por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrões
              </Button>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrões
              </Button>
              <Button variant="outline" onClick={exportConfig}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" onClick={() => navigate('/setupcolors')}>
                <Palette className="w-4 h-4 mr-2" />
                Editor Visual
              </Button>
            </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Object.entries(groupedConfigs).map(([category, configs]) => (
            <Card key={category} className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                  {category === 'primary' && <div className="w-3 h-3 rounded-full bg-orange-500"></div>}
                  {category === 'background' && <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300"></div>}
                  {category === 'neutral' && <div className="w-3 h-3 rounded-full bg-gray-500"></div>}
                  {category === 'semantic' && <div className="w-3 h-3 rounded-full bg-red-500"></div>}
                  {category === 'navigation' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                  {category === 'text' && <div className="w-3 h-3 rounded-full bg-gray-700"></div>}
                  {category === 'buttons' && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
                  {category === 'forms' && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
                  {categoryNames[category as keyof typeof categoryNames]}
                  <span className="text-sm font-normal text-gray-500">({configs.length})</span>
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
              <CardTitle className="text-lg text-gray-900">Pré-visualização Completa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-3 text-gray-900">Header & Navegação</h4>
                <div className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm">2</div>
                    <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm">3</div>
                  </div>
                  <button className="px-3 py-1 bg-orange-500 text-white rounded text-sm">Setup</button>
                </div>
              </div>

              {/* Forms Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-3 text-gray-900">Formulários</h4>
                <div className="space-y-3 bg-white p-4 rounded border">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Demo Day Lisboa 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-700 bg-white"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Presencial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                    <span className="text-sm text-gray-700">Online</span>
                  </div>
                </div>
              </div>

              {/* Buttons Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-3 text-gray-900">Botões</h4>
                <div className="flex flex-wrap gap-3 bg-white p-4 rounded border">
                  <button className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                    Botão Principal
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                    Botão Secundário
                  </button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    Botão Destrutivo
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed" disabled>
                    Desabilitado
                  </button>
                </div>
              </div>

              {/* Text Variations */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-3 text-gray-900">Variações de Texto</h4>
                <div className="space-y-2 bg-white p-4 rounded border">
                  <h1 className="text-2xl font-bold text-gray-900">Título Principal</h1>
                  <h2 className="text-xl font-semibold text-gray-800">Subtítulo</h2>
                  <p className="text-gray-700">Texto normal de parágrafo</p>
                  <p className="text-gray-500">Texto secundário</p>
                  <p className="text-gray-400">Texto terciário</p>
                  <p className="text-gray-300">Texto desabilitado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}