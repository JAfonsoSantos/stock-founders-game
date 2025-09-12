import React from 'react';
import { Card } from '@/components/ui/card';
import { Settings, TrendingUp, BarChart3, Trophy } from 'lucide-react';

interface Step5Props {
  formData: {
    name: string;
    assetSingular: string;
    assetPlural: string;
    enableSecondaryMarket: boolean;
    leaderboardMode: string;
    roles: Array<{
      id: string;
      label: string;
    }>;
  };
}

export function Step5HowItWorks({ formData }: Step5Props) {
  const replacePlaceholders = (text: string) => {
    return text
      .replace(/{asset_noun}/g, formData.assetSingular || 'Asset')
      .replace(/{asset_noun_plural}/g, formData.assetPlural || 'Assets');
  };

  const steps = [
    {
      title: "Setup",
      description: replacePlaceholders("Regista a tua {asset_noun} e configura o perfil inicial"),
      icon: Settings
    },
    {
      title: "Trading",
      description: "Investidores propõem trades e emissores aceitam ou rejeitam ofertas",
      icon: TrendingUp
    },
    {
      title: "Pricing",
      description: replacePlaceholders("VWAP das últimas 3 trades define o preço atual de cada {asset_noun}"),
      icon: BarChart3
    },
    {
      title: "Results",
      description: replacePlaceholders("Leaderboard mostra top {asset_noun_plural} e melhores traders por ROI"),
      icon: Trophy
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-700">Como Funciona</h2>
        <p className="text-gray-600">Visão geral do funcionamento do jogo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <Card key={index} className="p-6 bg-white border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-700">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-white border-gray-200">
        <h3 className="font-semibold text-lg mb-3 text-gray-700">
          Configuração do seu evento: {formData.name}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-gray-700">Asset:</strong> <span className="text-gray-600">{formData.assetSingular} / {formData.assetPlural}</span>
          </div>
          <div>
            <strong className="text-gray-700">Roles:</strong> <span className="text-gray-600">{formData.roles.map(r => r.label).join(", ")}</span>
          </div>
          <div>
            <strong className="text-gray-700">Mercado Secundário:</strong> <span className="text-gray-600">{formData.enableSecondaryMarket ? "Ativo" : "Inativo"}</span>
          </div>
          <div>
            <strong className="text-gray-700">Leaderboard:</strong> <span className="text-gray-600">{
              formData.leaderboardMode === 'public_live' ? 'Público' :
              formData.leaderboardMode === 'private' ? 'Privado' : 'Apenas no Final'
            }</span>
          </div>
        </div>
      </Card>
    </div>
  );
}