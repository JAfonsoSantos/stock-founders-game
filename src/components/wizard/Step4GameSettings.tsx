import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

const CURRENCIES = [
  { value: "USD", symbol: "$" },
  { value: "EUR", symbol: "€" },
  { value: "CNY", symbol: "¥" },
  { value: "JPY", symbol: "¥" },
  { value: "GBP", symbol: "£" },
  { value: "INR", symbol: "₹" },
  { value: "AUD", symbol: "A$" },
  { value: "CAD", symbol: "C$" },
  { value: "CHF", symbol: "CHF" },
  { value: "HKD", symbol: "HK$" },
];

interface Step4Props {
  formData: {
    language: string;
    currency: string;
    enablePrimaryMarket: boolean;
    enableSecondaryMarket: boolean;
    leaderboardMode: string;
    tradingMode: string;
    circuitBreaker: boolean;
    maxPricePerShare: number;
    judgesPanel: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function Step4GameSettings({ formData, setFormData }: Step4Props) {
  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === formData.currency)?.symbol || "$";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-700">Configurações do Jogo</h2>
        <p className="text-gray-600">Configure as regras e mecânicas do evento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-gray-600">Idioma</Label>
            <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Fases do Mercado</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="primaryMarket"
                  checked={formData.enablePrimaryMarket}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enablePrimaryMarket: checked }))}
                />
                <Label htmlFor="primaryMarket">Mercado Primário</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="secondaryMarket"
                  checked={formData.enableSecondaryMarket}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableSecondaryMarket: checked }))}
                />
                <Label htmlFor="secondaryMarket">Mercado Secundário</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Modo de Leaderboard</Label>
            <Select value={formData.leaderboardMode} onValueChange={(value) => setFormData(prev => ({ ...prev, leaderboardMode: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public_live">Público em Tempo Real</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
                <SelectItem value="final_only">Apenas no Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Modo de Trading</Label>
            <Select value={formData.tradingMode} onValueChange={(value) => setFormData(prev => ({ ...prev, tradingMode: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continuous">Contínuo</SelectItem>
                <SelectItem value="rounds">Por Rondas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="circuitBreaker"
              checked={formData.circuitBreaker}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, circuitBreaker: checked }))}
            />
            <Label htmlFor="circuitBreaker">Circuit Breaker</Label>
          </div>

          <div>
            <Label htmlFor="maxPrice">Preço Máximo por Ação ({getCurrencySymbol()})</Label>
            <Input
              id="maxPrice"
              type="number"
              value={formData.maxPricePerShare}
              onChange={(e) => setFormData(prev => ({ ...prev, maxPricePerShare: parseInt(e.target.value) || 10000 }))}
              min="1"
            />
          </div>

          {formData.judgesPanel && (
            <div className="flex items-center space-x-2">
              <Switch
                id="judgesPanel"
                checked={formData.judgesPanel}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, judgesPanel: checked }))}
              />
              <Label htmlFor="judgesPanel">Ativar Painel de Juízes</Label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}