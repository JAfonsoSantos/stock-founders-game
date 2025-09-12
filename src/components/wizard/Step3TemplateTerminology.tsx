import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Wallet, TrendingUp, Building2, Code, Network, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const MACRO_TEMPLATES = [
  {
    id: 'startup',
    name: 'Startup Event',
    description: 'Para pitch competitions, demo days e eventos de investimento',
    icon: TrendingUp,
    color: 'from-blue-500 to-purple-600',
    defaultAsset: { singular: 'Startup', plural: 'Startups' },
    defaultRoles: [
      { id: 'founder', label: 'Founder', canTrade: false, voteWeight: 1, isIssuer: true },
      { id: 'angel', label: 'Angel', canTrade: true, voteWeight: 1, isIssuer: false },
      { id: 'vc', label: 'VC', canTrade: true, voteWeight: 1, isIssuer: false }
    ],
    defaultBudgets: { founder: 10000, angel: 100000, vc: 1000000 }
  },
  {
    id: 'corporate',
    name: 'Corporate Event',
    description: 'Para eventos internos corporativos e apresentação de ideias',
    icon: Building2,
    color: 'from-green-500 to-teal-600',
    defaultAsset: { singular: 'Ideia', plural: 'Ideias' },
    defaultRoles: [
      { id: 'team', label: 'Team', canTrade: false, voteWeight: 1, isIssuer: true },
      { id: 'employee', label: 'Employee', canTrade: true, voteWeight: 1, isIssuer: false },
      { id: 'judge', label: 'Judge', canTrade: true, voteWeight: 2, isIssuer: false }
    ],
    defaultBudgets: { team: 5000, employee: 20000, judge: 50000 }
  },
  {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'Para competições de programação e inovação técnica',
    icon: Code,
    color: 'from-orange-500 to-red-600',
    defaultAsset: { singular: 'Projeto', plural: 'Projetos' },
    defaultRoles: [
      { id: 'team', label: 'Team', canTrade: false, voteWeight: 1, isIssuer: true },
      { id: 'judge', label: 'Judge', canTrade: true, voteWeight: 3, isIssuer: false },
      { id: 'attendee', label: 'Attendee', canTrade: true, voteWeight: 1, isIssuer: false }
    ],
    defaultBudgets: { team: 0, judge: 100000, attendee: 25000 }
  },
  {
    id: 'networking',
    name: 'Networking Event',
    description: 'Para eventos de networking onde cada pessoa é um ativo',
    icon: Network,
    color: 'from-purple-500 to-pink-600',
    defaultAsset: { singular: 'Perfil', plural: 'Perfis' },
    defaultRoles: [
      { id: 'attendee', label: 'Attendee', canTrade: true, voteWeight: 1, isIssuer: true }
    ],
    defaultBudgets: { attendee: 50000 }
  },
  {
    id: 'custom',
    name: 'Custom Event',
    description: 'Configuração totalmente personalizada',
    icon: Settings,
    color: 'from-gray-500 to-gray-700',
    defaultAsset: { singular: 'Asset', plural: 'Assets' },
    defaultRoles: [
      { id: 'founder', label: 'Founder', canTrade: false, voteWeight: 1, isIssuer: true },
      { id: 'investor', label: 'Investor', canTrade: true, voteWeight: 1, isIssuer: false }
    ],
    defaultBudgets: { founder: 10000, investor: 100000 }
  }
];

const ROLE_CATALOG = [
  { id: 'founder', label: 'Founder' },
  { id: 'angel', label: 'Angel' },
  { id: 'vc', label: 'VC' },
  { id: 'team', label: 'Team' },
  { id: 'employee', label: 'Employee' },
  { id: 'judge', label: 'Judge' },
  { id: 'attendee', label: 'Attendee' },
  { id: 'visitor', label: 'Visitor' }
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

interface Step3Props {
  formData: {
    templateId: string;
    assetSingular: string;
    assetPlural: string;
    currency: string;
    roles: Array<{
      id: string;
      label: string;
      canTrade: boolean;
      voteWeight: number;
      isIssuer: boolean;
    }>;
    budgets: Record<string, number>;
    judgesPanel: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function Step3TemplateTerminology({ formData, setFormData }: Step3Props) {
  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === formData.currency)?.symbol || "$";
  };

  const applyTemplate = (templateId: string) => {
    const template = MACRO_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      templateId,
      assetSingular: template.defaultAsset.singular,
      assetPlural: template.defaultAsset.plural,
      roles: template.defaultRoles,
      budgets: template.defaultBudgets,
      judgesPanel: template.defaultRoles.some(r => r.id === 'judge')
    }));
  };

  const autoBalanceBudgets = () => {
    const totalParticipants = 100; // Default participants count
    const roleCount = formData.roles.length;
    const baseAmount = Math.floor(50000 / roleCount) * roleCount;
    
    const newBudgets = { ...formData.budgets };
    formData.roles.forEach((role, index) => {
      const multiplier = role.isIssuer ? 0.2 : (role.id === 'judge' ? 2 : 1);
      newBudgets[role.id] = Math.floor(baseAmount * multiplier);
    });

    setFormData(prev => ({ ...prev, budgets: newBudgets }));
  };

  const addRole = () => {
    const availableRole = ROLE_CATALOG.find(r => !formData.roles.some(fr => fr.id === r.id));
    if (availableRole) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, {
          id: availableRole.id,
          label: availableRole.label,
          canTrade: true,
          voteWeight: 1,
          isIssuer: false
        }],
        budgets: { ...prev.budgets, [availableRole.id]: 50000 }
      }));
    }
  };

  const removeRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter(r => r.id !== roleId),
      budgets: Object.fromEntries(Object.entries(prev.budgets).filter(([id]) => id !== roleId))
    }));
  };

  const updateRole = (roleId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.map(role => 
        role.id === roleId ? { ...role, [field]: value } : role
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">Template & Terminologia</h2>
        <p className="text-foreground">Escolha o tipo de evento e configure os termos</p>
      </div>

      <div>
        <Label className="text-base font-semibold mb-4 block">Selecionar Template</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MACRO_TEMPLATES.map(template => {
            const IconComponent = template.icon;
            return (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-all duration-300 bg-white border-gray-200",
                  formData.templateId === template.id ? "ring-2 ring-primary" : ""
                )}
                onClick={() => applyTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 bg-gradient-to-br ${template.color} rounded-lg`}>
                      <IconComponent className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">{template.description}</p>
                  <p className="text-xs text-foreground mt-2">
                    Asset: {template.defaultAsset.singular}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {formData.templateId && (
        <>
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="assetSingular">Nome do Asset (singular) *</Label>
              <Input
                id="assetSingular"
                value={formData.assetSingular}
                onChange={(e) => setFormData(prev => ({ ...prev, assetSingular: e.target.value }))}
                placeholder="Ex: Startup, Ideia, Projeto"
              />
            </div>
            <div>
              <Label htmlFor="assetPlural">Nome do Asset (plural) *</Label>
              <Input
                id="assetPlural"
                value={formData.assetPlural}
                onChange={(e) => setFormData(prev => ({ ...prev, assetPlural: e.target.value }))}
                placeholder="Ex: Startups, Ideias, Projetos"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Roles dos Participantes</Label>
              <div className="space-x-2">
                <Button type="button" size="sm" variant="outline" onClick={autoBalanceBudgets}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Auto-balance Budgets
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={addRole}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Role
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {formData.roles.map((role, index) => (
                <Card key={role.id} className="p-4 bg-white border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <Label className="text-sm">Label</Label>
                      <Input
                        value={role.label}
                        onChange={(e) => updateRole(role.id, 'label', e.target.value)}
                        placeholder="Nome do role"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm">Budget ({getCurrencySymbol()})</Label>
                      <Input
                        type="number"
                        value={formData.budgets[role.id] || 0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          budgets: { ...prev.budgets, [role.id]: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`canTrade-${role.id}`}
                        checked={role.canTrade}
                        onCheckedChange={(checked) => updateRole(role.id, 'canTrade', !!checked)}
                      />
                      <Label htmlFor={`canTrade-${role.id}`} className="text-sm">Pode negociar?</Label>
                    </div>

                    <div>
                      <Label className="text-sm">Peso de voto</Label>
                      <Input
                        type="number"
                        min="1"
                        value={role.voteWeight}
                        onChange={(e) => updateRole(role.id, 'voteWeight', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`isIssuer-${role.id}`}
                          checked={role.isIssuer}
                          onCheckedChange={(checked) => updateRole(role.id, 'isIssuer', !!checked)}
                        />
                        <Label htmlFor={`isIssuer-${role.id}`} className="text-sm">Emissor?</Label>
                      </div>
                      {formData.roles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRole(role.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}