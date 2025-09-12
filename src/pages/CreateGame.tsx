import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Step1BasicInformation } from '@/components/wizard/Step1BasicInformation';
import { Step2Organization } from '@/components/wizard/Step2Organization';
import { Step3TemplateTerminology } from '@/components/wizard/Step3TemplateTerminology';
import { Step4GameSettings } from '@/components/wizard/Step4GameSettings';
import { Step5HowItWorks } from '@/components/wizard/Step5HowItWorks';
import { Step6PreviewCreate } from '@/components/wizard/Step6PreviewCreate';

export default function CreateGame() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

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
    leaderboardMode: "private",
    tradingMode: "continuous",
    circuitBreaker: true,
    maxPricePerShare: 10000,
    judgesPanel: false
  });

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

      const roleData = formData.roles.map(role => ({
        game_id: game.id,
        role: role.id as any,
        default_budget: formData.budgets[role.id] || 0
      }));

      const { error: rolesError } = await supabase
        .from('game_roles')
        .insert(roleData);

      if (rolesError) throw rolesError;

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
        title: "Sucesso!",
        description: "Evento criado com sucesso.",
      });

      navigate(`/games/${game.id}/organizer`);
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar evento. Tente novamente.",
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
    // Permitir navegação livre entre passos
    return true;
  };

  const steps = [
    { id: 1, name: "Básico", component: () => <Step1BasicInformation formData={formData} setFormData={setFormData} /> },
    { id: 2, name: "Organização", component: () => <Step2Organization formData={formData} setFormData={setFormData} /> },
    { id: 3, name: "Template", component: () => <Step3TemplateTerminology formData={formData} setFormData={setFormData} /> },
    { id: 4, name: "Configurações", component: () => <Step4GameSettings formData={formData} setFormData={setFormData} /> },
    { id: 5, name: "Como Funciona", component: () => <Step5HowItWorks formData={formData} /> },
    { id: 6, name: "Preview", component: () => <Step6PreviewCreate formData={formData} /> }
  ];

  const CurrentStepComponent = steps.find(s => s.id === currentStep)?.component || steps[0].component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-700">Criar Novo Evento</h1>
            <div className="flex items-center space-x-8">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "text-lg font-medium cursor-pointer transition-colors relative",
                    currentStep === step.id ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {step.id}
                  {currentStep === step.id && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="max-w-6xl mx-auto bg-white border-gray-300 shadow-sm">
          <CardContent className="p-8">
            <CurrentStepComponent />
          </CardContent>
        </Card>

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