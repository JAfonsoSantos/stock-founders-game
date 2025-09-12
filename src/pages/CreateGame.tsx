import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/DatePicker';
import { LogoUpload } from '@/components/LogoUpload';
import { BrandingUpload } from '@/components/BrandingUpload';
import { 
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  Building2,
  Code,
  Network,
  Settings,
  Play,
  Target,
  TrendingUp,
  BarChart3,
  Plus,
  Minus,
  X,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Briefcase,
  UserCheck,
  Award,
  Shield,
  Timer,
  Eye,
  EyeOff,
  Zap,
  Wallet,
  Crown,
  User,
  Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Constants
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

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

// Macro Templates
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

// Global role catalog
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

// Color themes
const COLOR_THEMES = [
  { id: 'default', name: 'Default', colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'] },
  { id: 'purple', name: 'Purple', colors: ['#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE'] },
  { id: 'green', name: 'Green', colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'] },
  { id: 'orange', name: 'Orange', colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'] }
];

export default function CreateGame() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1 - Basics
    name: "",
    description: "",
    currency: "USD",
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    hasSpecificTimes: false,
    startTime: "09:00",
    endTime: "17:00",
    venue: "presential", // presential | online | hybrid
    expectedParticipants: 50,
    colorTheme: "default",
    notifications: true,
    logoUrl: "",
    headerUrl: "",

    // Step 2 - Organization
    organizerName: profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "",
    organizerCompany: "",
    eventWebsite: "",
    teamMembers: [
      {
        email: profile?.email || user?.email || "",
        name: profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "",
        role: "Organizer"
      }
    ],

    // Step 3 - Template & Terminology
    templateId: "",
    assetSingular: "",
    assetPlural: "",
    roles: [] as Array<{
      id: string;
      label: string;
      canTrade: boolean;
      voteWeight: number;
      isIssuer: boolean;
    }>,
    budgets: {} as Record<string, number>,
    
    // Step 4 - Game Settings
    language: "en",
    enablePrimaryMarket: true,
    enableSecondaryMarket: false,
    leaderboardMode: "private", // public_live | private | final_only
    tradingMode: "continuous", // continuous | rounds
    circuitBreaker: true,
    maxPricePerShare: 10000,
    judgesPanel: false
  });

  // Helper functions
  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === formData.currency)?.symbol || "$";
  };

  const formatBudget = (amount: number) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${amount.toLocaleString()}`;
  };

  const replacePlaceholders = (text: string) => {
    return text
      .replace(/{asset_noun}/g, formData.assetSingular || 'Asset')
      .replace(/{asset_noun_plural}/g, formData.assetPlural || 'Assets');
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
    const totalParticipants = formData.expectedParticipants;
    const roleCount = formData.roles.length;
    const baseAmount = Math.floor(50000 / roleCount) * roleCount;
    
    const newBudgets = { ...formData.budgets };
    formData.roles.forEach((role, index) => {
      // Issuers get less, traders get more
      const multiplier = role.isIssuer ? 0.2 : (role.id === 'judge' ? 2 : 1);
      newBudgets[role.id] = Math.floor(baseAmount * multiplier);
    });

    setFormData(prev => ({ ...prev, budgets: newBudgets }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { email: "", name: "", role: "" }]
    }));
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
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

  const handleSubmit = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const gameData = {
        owner_user_id: user.id,
        name: formData.name,
        description: formData.description,
        status: 'draft' as const,
        starts_at: formData.startDate.toISOString(),
        ends_at: formData.endDate.toISOString(),
        currency: formData.currency,
        locale: formData.language,
        allow_secondary: formData.enableSecondaryMarket,
        show_public_leaderboards: formData.leaderboardMode === 'public_live',
        circuit_breaker: formData.circuitBreaker,
        max_price_per_share: formData.maxPricePerShare,
      };

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single();

      if (gameError) throw gameError;

      // Create game roles
      const roleData = formData.roles.map(role => ({
        game_id: game.id,
        role: role.id as any,
        default_budget: formData.budgets[role.id] || 0
      }));

      const { error: rolesError } = await supabase
        .from('game_roles')
        .insert(roleData);

      if (rolesError) throw rolesError;

      // Create organizer participant
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          game_id: game.id,
          user_id: user.id,
          role: 'organizer',
          initial_budget: 0,
          current_cash: 0,
          status: 'active'
        });

      if (participantError) throw participantError;

      toast({
        title: "Success!",
        description: "Game created successfully.",
      });

      navigate(`/games/${game.id}/organizer`);
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.description && formData.startDate && formData.endDate;
      case 2:
        return formData.organizerName;
      case 3:
        return formData.templateId && formData.assetSingular && formData.assetPlural && formData.roles.length > 0;
      case 4:
        return true;
      default:
        return true;
    }
  };

  // Step components
  const Step1Basics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Informações Básicas</h2>
        <p className="text-gray-600">Configure os detalhes principais do seu evento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Evento *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Demo Day Lisboa 2024"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o seu evento..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="currency">Moeda</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(currency => (
                  <SelectItem key={currency.value} value={currency.value}>
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
              <Label>Data de Início *</Label>
              <DatePicker
                date={formData.startDate}
                onDateSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
              />
            </div>
            <div>
              <Label>Data de Fim *</Label>
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
            <Label htmlFor="specificTimes">Definir horários específicos</Label>
          </div>

          {formData.hasSpecificTimes && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Hora de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Hora de Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Local do Evento</Label>
            <RadioGroup value={formData.venue} onValueChange={(value) => setFormData(prev => ({ ...prev, venue: value }))}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="presential" id="presential" />
                <Label htmlFor="presential">Presencial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online">Online</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid">Híbrido</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="participants">Participantes Esperados</Label>
            <Input
              id="participants"
              type="number"
              value={formData.expectedParticipants}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedParticipants: parseInt(e.target.value) || 0 }))}
              min="1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personalização</h3>
        
        <div>
          <Label>Tema de Cores</Label>
          <RadioGroup value={formData.colorTheme} onValueChange={(value) => setFormData(prev => ({ ...prev, colorTheme: value }))}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {COLOR_THEMES.map(theme => (
                <div key={theme.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={theme.id} id={theme.id} />
                  <Label htmlFor={theme.id} className="flex items-center space-x-2 cursor-pointer">
                    <span>{theme.name}</span>
                    <div className="flex space-x-1">
                      {theme.colors.map((color, i) => (
                        <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="notifications"
            checked={formData.notifications}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
          />
          <Label htmlFor="notifications">Ativar notificações</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Logo do Evento (até 2MB)</Label>
            <BrandingUpload
              type="logo"
              title="Logo do Evento"
              description="PNG, JPG até 2MB"
              onUpload={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
              currentUrl={formData.logoUrl}
            />
          </div>
          <div>
            <Label>Imagem de Header (até 5MB)</Label>
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

  const Step2Organization = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Organização</h2>
        <p className="text-gray-600">Informações sobre a organização e equipa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="organizerName">Nome do Organizador *</Label>
          <Input
            id="organizerName"
            value={formData.organizerName}
            onChange={(e) => setFormData(prev => ({ ...prev, organizerName: e.target.value }))}
            placeholder="Seu nome"
          />
        </div>
        <div>
          <Label htmlFor="organizerCompany">Empresa/Organização</Label>
          <Input
            id="organizerCompany"
            value={formData.organizerCompany}
            onChange={(e) => setFormData(prev => ({ ...prev, organizerCompany: e.target.value }))}
            placeholder="Nome da empresa"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="eventWebsite">Website do Evento</Label>
        <Input
          id="eventWebsite"
          value={formData.eventWebsite}
          onChange={(e) => setFormData(prev => ({ ...prev, eventWebsite: e.target.value }))}
          placeholder="https://..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>Membros da Equipa</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Membro
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.teamMembers.map((member, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Email"
                  value={member.email}
                  onChange={(e) => {
                    const newMembers = [...formData.teamMembers];
                    newMembers[index].email = e.target.value;
                    setFormData(prev => ({ ...prev, teamMembers: newMembers }));
                  }}
                />
                <Input
                  placeholder="Nome"
                  value={member.name}
                  onChange={(e) => {
                    const newMembers = [...formData.teamMembers];
                    newMembers[index].name = e.target.value;
                    setFormData(prev => ({ ...prev, teamMembers: newMembers }));
                  }}
                />
                <Input
                  placeholder="Cargo"
                  value={member.role}
                  onChange={(e) => {
                    const newMembers = [...formData.teamMembers];
                    newMembers[index].role = e.target.value;
                    setFormData(prev => ({ ...prev, teamMembers: newMembers }));
                  }}
                />
              </div>
              {index > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeTeamMember(index)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Step3Template = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Template & Terminologia</h2>
        <p className="text-gray-600">Escolha o tipo de evento e configure os termos</p>
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
                  "cursor-pointer hover:shadow-lg transition-all duration-300",
                  formData.templateId === template.id ? "ring-2 ring-blue-500" : ""
                )}
                onClick={() => applyTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 bg-gradient-to-br ${template.color} rounded-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
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
                <Card key={role.id} className="p-4">
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

  const Step4Settings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações do Jogo</h2>
        <p className="text-gray-600">Configure as regras e mecânicas do evento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Idioma</Label>
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

  const Step5HowItWorks = () => {
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
          <h2 className="text-2xl font-bold mb-2">Como Funciona</h2>
          <p className="text-gray-600">Visão geral do funcionamento do jogo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-lg mb-3">
            Configuração do seu evento: {formData.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Asset:</strong> {formData.assetSingular} / {formData.assetPlural}
            </div>
            <div>
              <strong>Roles:</strong> {formData.roles.map(r => r.label).join(", ")}
            </div>
            <div>
              <strong>Mercado Secundário:</strong> {formData.enableSecondaryMarket ? "Ativo" : "Inativo"}
            </div>
            <div>
              <strong>Leaderboard:</strong> {
                formData.leaderboardMode === 'public_live' ? 'Público' :
                formData.leaderboardMode === 'private' ? 'Privado' : 'Apenas no Final'
              }
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const Step6Preview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Preview & Criar</h2>
        <p className="text-gray-600">Reveja os detalhes e crie o seu evento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Informações Básicas</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Nome:</strong> {formData.name}</div>
            <div><strong>Organizador:</strong> {formData.organizerName}</div>
            <div><strong>Data:</strong> {format(formData.startDate, 'dd/MM/yyyy')} - {format(formData.endDate, 'dd/MM/yyyy')}</div>
            <div><strong>Participantes:</strong> {formData.expectedParticipants}</div>
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

  const steps = [
    { id: 1, name: "Básico", component: Step1Basics },
    { id: 2, name: "Organização", component: Step2Organization },
    { id: 3, name: "Template", component: Step3Template },
    { id: 4, name: "Configurações", component: Step4Settings },
    { id: 5, name: "Como Funciona", component: Step5HowItWorks },
    { id: 6, name: "Preview", component: Step6Preview }
  ];

  const CurrentStepComponent = steps.find(s => s.id === currentStep)?.component || Step1Basics;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Criar Novo Evento</h1>
            <div className="text-sm text-gray-500">
              Passo {currentStep} de {steps.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  currentStep === step.id ? "bg-blue-600 text-white" :
                  currentStep > step.id ? "bg-green-600 text-white" :
                  "bg-gray-200 text-gray-600"
                )}>
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-1 rounded",
                    currentStep > step.id ? "bg-green-600" : "bg-gray-200"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            {steps.map(step => (
              <div key={step.id} className="text-xs text-gray-500 text-center" style={{ width: '12.5%' }}>
                {step.name}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-8">
            <CurrentStepComponent />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="space-x-2">
            {currentStep < 6 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isCreating || !canProceed()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? "Criando..." : "Criar Evento"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}