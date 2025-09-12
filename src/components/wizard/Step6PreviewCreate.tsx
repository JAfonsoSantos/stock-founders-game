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

export function Step6PreviewCreate({ formData }: Step6Props) {
  const formatBudget = (amount: number) => {
    const symbol = CURRENCIES.find(c => c.value === formData.currency)?.symbol || "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">Preview & Criar</h2>
        <p className="text-foreground">Reveja os detalhes e crie o seu evento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Informações Básicas</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Nome:</strong> {formData.name}</div>
            <div><strong>Organizador:</strong> {formData.organizerName}</div>
            <div><strong>Data:</strong> {format(formData.startDate, 'dd/MM/yyyy')} - {format(formData.endDate, 'dd/MM/yyyy')}</div>
            <div><strong>Moeda:</strong> {formData.currency}</div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Terminologia</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Template:</strong> {MACRO_TEMPLATES.find(t => t.id === formData.templateId)?.name}</div>
            <div><strong>Asset:</strong> {formData.assetSingular} / {formData.assetPlural}</div>
            <div><strong>Roles:</strong> {formData.roles.length}</div>
            <div><strong>Budget Total:</strong> {formatBudget(Object.values(formData.budgets).reduce((a, b) => a + b, 0))}</div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Configurações</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Mercado Secundário:</strong> {formData.enableSecondaryMarket ? "Ativo" : "Inativo"}</div>
            <div><strong>Leaderboard:</strong> {
              formData.leaderboardMode === 'public_live' ? 'Público' :
              formData.leaderboardMode === 'private' ? 'Privado' : 'Apenas no Final'
            }</div>
            <div><strong>Circuit Breaker:</strong> {formData.circuitBreaker ? "Ativo" : "Inativo"}</div>
            <div><strong>Preço Máximo:</strong> {formatBudget(formData.maxPricePerShare)}</div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Roles e Budgets</h3>
          <div className="space-y-2 text-sm">
            {formData.roles.map(role => (
              <div key={role.id} className="flex justify-between">
                <span>{role.label}:</span>
                <span>{formatBudget(formData.budgets[role.id] || 0)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}