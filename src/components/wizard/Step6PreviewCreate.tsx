import React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

const MACRO_TEMPLATES = [
  { id: 'startup', name: 'Startup Event' },
  { id: 'corporate', name: 'Corporate Event' },
  { id: 'hackathon', name: 'Hackathon' },
  { id: 'networking', name: 'Networking Event' },
  { id: 'custom', name: 'Custom Event' }
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

interface Step6Props {
  formData: {
    name: string;
    organizerName: string;
    startDate: Date;
    endDate: Date;
    currency: string;
    templateId: string;
    assetSingular: string;
    assetPlural: string;
    roles: Array<{
      id: string;
      label: string;
    }>;
    budgets: Record<string, number>;
    enableSecondaryMarket: boolean;
    leaderboardMode: string;
    circuitBreaker: boolean;
    maxPricePerShare: number;
  };
}

export const Step6PreviewCreate = React.memo(function Step6PreviewCreate({ formData }: Step6Props) {
  const formatBudget = (amount: number) => {
    const symbol = CURRENCIES.find(c => c.value === formData.currency)?.symbol || "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-700">Preview & Criar</h2>
        <p className="text-gray-600">Reveja os detalhes e crie o seu evento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-700">Informações Básicas</h3>
          <div className="space-y-2 text-sm">
            <div><strong className="text-gray-700">Nome:</strong> <span className="text-gray-600">{formData.name}</span></div>
            <div><strong className="text-gray-700">Organizador:</strong> <span className="text-gray-600">{formData.organizerName}</span></div>
            <div><strong className="text-gray-700">Data:</strong> <span className="text-gray-600">{format(formData.startDate, 'dd/MM/yyyy')} - {format(formData.endDate, 'dd/MM/yyyy')}</span></div>
            <div><strong className="text-gray-700">Moeda:</strong> <span className="text-gray-600">{formData.currency}</span></div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-700">Terminologia</h3>
          <div className="space-y-2 text-sm">
            <div><strong className="text-gray-700">Template:</strong> <span className="text-gray-600">{MACRO_TEMPLATES.find(t => t.id === formData.templateId)?.name}</span></div>
            <div><strong className="text-gray-700">Asset:</strong> <span className="text-gray-600">{formData.assetSingular} / {formData.assetPlural}</span></div>
            <div><strong className="text-gray-700">Roles:</strong> <span className="text-gray-600">{formData.roles.length}</span></div>
            <div><strong className="text-gray-700">Budget Total:</strong> <span className="text-gray-600">{formatBudget(Object.values(formData.budgets).reduce((a, b) => a + b, 0))}</span></div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-700">Configurações</h3>
          <div className="space-y-2 text-sm">
            <div><strong className="text-gray-700">Mercado Secundário:</strong> <span className="text-gray-600">{formData.enableSecondaryMarket ? "Ativo" : "Inativo"}</span></div>
            <div><strong className="text-gray-700">Leaderboard:</strong> <span className="text-gray-600">{
              formData.leaderboardMode === 'public_live' ? 'Público' :
              formData.leaderboardMode === 'private' ? 'Privado' : 'Apenas no Final'
            }</span></div>
            <div><strong className="text-gray-700">Circuit Breaker:</strong> <span className="text-gray-600">{formData.circuitBreaker ? "Ativo" : "Inativo"}</span></div>
            <div><strong className="text-gray-700">Preço Máximo:</strong> <span className="text-gray-600">{formatBudget(formData.maxPricePerShare)}</span></div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-gray-200">
          <h3 className="font-semibold text-lg mb-4 text-gray-700">Roles e Budgets</h3>
          <div className="space-y-2 text-sm">
            {formData.roles.map(role => (
              <div key={role.id} className="flex justify-between">
                <span className="text-gray-700">{role.label}:</span>
                <span className="text-gray-600">{formatBudget(formData.budgets[role.id] || 0)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
});