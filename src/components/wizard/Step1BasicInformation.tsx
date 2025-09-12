import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/DatePicker';
import { BrandingUpload } from '@/components/BrandingUpload';
import { RichTextEditor } from '@/components/RichTextEditor';

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD)", symbol: "$" },
  { value: "EUR", label: "Euro (EUR)", symbol: "€" },
  { value: "CNY", label: "Chinese Yuan (CNY)", symbol: "¥" },
  { value: "JPY", label: "Japanese Yen (JPY)", symbol: "¥" },
  { value: "GBP", label: "British Pound (GBP)", symbol: "£" },
  { value: "INR", label: "Indian Rupee (INR)", symbol: "₹" },
  { value: "AUD", label: "Australian Dollar (AUD)", symbol: "A$" },
  { value: "CAD", label: "Canadian Dollar (CAD)", symbol: "C$" },
  { value: "CHF", label: "Swiss Franc (CHF)", symbol: "CHF" },
  { value: "HKD", label: "Hong Kong Dollar (HKD)", symbol: "HK$" },
];

const COLOR_THEMES = [
  { id: 'default', name: 'Default', colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'] },
  { id: 'purple', name: 'Purple', colors: ['#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE'] },
  { id: 'green', name: 'Green', colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'] },
  { id: 'orange', name: 'Orange', colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'] }
];

interface Step1Props {
  formData: {
    name: string;
    description: string;
    currency: string;
    startDate: Date;
    endDate: Date;
    hasSpecificTimes: boolean;
    startTime: string;
    endTime: string;
    colorTheme: string;
    notifications: boolean;
    logoUrl: string;
    headerUrl: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function Step1BasicInformation({ formData, setFormData }: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-700">Informações Básicas</h2>
        <p className="text-gray-600">Configure os detalhes principais do seu evento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-600">Nome do Evento *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Demo Day Lisboa 2024"
              className="placeholder:text-gray-400 border-gray-300 focus:border-gray-400 text-gray-500"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-600">Descrição *</Label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Descreva o seu evento..."
              className="min-h-[120px]"
            />
          </div>

          <div>
            <Label htmlFor="currency" className="text-gray-600">Moeda</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger className="border-gray-300 focus:border-gray-400 text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
                {CURRENCIES.map(currency => (
                  <SelectItem key={currency.value} value={currency.value} className="hover:bg-gray-50 focus:bg-gray-50 text-gray-700">
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">Data de Início *</Label>
              <DatePicker
                date={formData.startDate}
                onDateSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
              />
            </div>
            <div>
              <Label className="text-gray-600">Data de Fim *</Label>
              <DatePicker
                date={formData.endDate}
                onDateSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="specificTimes"
              checked={formData.hasSpecificTimes}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSpecificTimes: !!checked }))}
            />
            <Label htmlFor="specificTimes" className="text-gray-600">Definir horários específicos</Label>
          </div>

          {formData.hasSpecificTimes && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-gray-600">Hora de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="border-gray-300 focus:border-gray-400 text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-gray-600">Hora de Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="border-gray-300 focus:border-gray-400 text-gray-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Personalização</h3>
        
        <div>
          <Label className="text-gray-600">Tema de Cores</Label>
            <Select value={formData.colorTheme} onValueChange={(value) => setFormData(prev => ({ ...prev, colorTheme: value }))}>
            <SelectTrigger className="w-full bg-white border-gray-300 text-gray-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
              {COLOR_THEMES.map(theme => (
                <SelectItem key={theme.id} value={theme.id} className="hover:bg-gray-50 focus:bg-gray-50">
                  <div className="flex items-center space-x-3 w-full">
                    <span className="text-gray-700">{theme.name}</span>
                    <div className="flex space-x-1 ml-auto">
                      {theme.colors.map((color, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="notifications"
            checked={formData.notifications}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
          />
          <Label htmlFor="notifications" className="text-gray-600">Ativar notificações</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-600">Logo do Evento (até 2MB)</Label>
            <BrandingUpload
              type="logo"
              title="Logo do Evento"
              description="PNG, JPG até 2MB"
              onUpload={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
              currentUrl={formData.logoUrl}
            />
          </div>
          <div>
            <Label className="text-gray-600">Imagem de Header (até 5MB)</Label>
            <BrandingUpload
              type="header"
              title="Imagem de Header"
              description="PNG, JPG até 5MB"
              onUpload={(url) => setFormData(prev => ({ ...prev, headerUrl: url }))}
              currentUrl={formData.headerUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}