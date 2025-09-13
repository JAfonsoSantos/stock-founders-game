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

export const Step4GameSettings = React.memo(function Step4GameSettings({ formData, setFormData }: Step4Props) {
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
              <SelectTrigger className="border-gray-300 focus:border-gray-400 text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value} className="hover:bg-gray-50 focus:bg-gray-50 text-gray-700">
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            <div className="space-y-3">
            <Label className="text-base font-semibold text-gray-600">Fases do Mercado</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="primaryMarket"
                  checked={formData.enablePrimaryMarket}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enablePrimaryMarket: checked }))}
                />
                <Label htmlFor="primaryMarket" className="text-gray-600">Mercado Primário</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="secondaryMarket"
                  checked={formData.enableSecondaryMarket}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableSecondaryMarket: checked }))}
                />
                <Label htmlFor="secondaryMarket" className="text-gray-600">Mercado Secundário</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-600">Modo de Leaderboard</Label>
            <Select value={formData.leaderboardMode} onValueChange={(value) => setFormData(prev => ({ ...prev, leaderboardMode: value }))}>
              <SelectTrigger className="border-gray-300 focus:border-gray-400 text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
                <SelectItem value="public_live" className="hover:bg-gray-50 focus:bg-gray-50 text-gray-700">Público em Tempo Real</SelectItem>
                <SelectItem value="private" className="hover:bg-gray-50 focus:bg-gray-50 text-gray-700">Privado</SelectItem>
                <SelectItem value="final_only" className="hover:bg-gray-50 focus:bg-gray-50 text-gray-700">Apenas no Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-600">Modo de Trading</Label>
            <Select value={formData.tradingMode} onValueChange={(value) => setFormData(prev => ({ ...prev, tradingMode: value }))}>
              <SelectTrigger className="border-gray-300 focus:border-gray-400 text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
                <SelectItem value="continuous" className="hover:bg-gray-50 focus:bg-gray-50 text-gray-700">Contínuo</SelectItem>
                <SelectItem value="rounds" className="hover:bg-gray-50 focus:bg-gray-50 text-gray-700">Por Rondas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="circuitBreaker"
              checked={formData.circuitBreaker}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, circuitBreaker: checked }))}
            />
            <Label htmlFor="circuitBreaker" className="text-gray-600">Circuit Breaker</Label>
          </div>

          <div>
            <Label htmlFor="maxPrice" className="text-gray-600">Preço Máximo por Ação ({getCurrencySymbol()})</Label>
            <Input
              id="maxPrice"
              type="number"
              value={formData.maxPricePerShare}
              onChange={(e) => setFormData(prev => ({ ...prev, maxPricePerShare: parseInt(e.target.value) || 10000 }))}
              min="1"
              className="placeholder:text-gray-400 border-gray-300 focus:border-gray-400 text-gray-500"
            />
          </div>

          {formData.judgesPanel && (
            <div className="flex items-center space-x-2">
              <Switch
                id="judgesPanel"
                checked={formData.judgesPanel}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, judgesPanel: checked }))}
              />
              <Label htmlFor="judgesPanel" className="text-gray-600">Ativar Painel de Juízes</Label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});