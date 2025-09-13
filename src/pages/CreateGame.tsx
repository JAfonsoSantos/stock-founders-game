import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Check, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { GameProfile } from '@/components/GameProfile';
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
  const { gameId } = useParams();
  const isEditMode = !!gameId;

  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

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

  // Load existing game data when in edit mode
  useEffect(() => {
    if (!isEditMode || !gameId) return;

    const loadGameData = async () => {
      try {
        setLoading(true);
        
        // Load game data
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();

        if (gameError) throw gameError;

        // Load organizer info
        const { data: organizer, error: organizerError } = await supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', game.owner_user_id)
          .single();

        if (organizerError) throw organizerError;

        // Load game roles
        const { data: roles, error: rolesError } = await supabase
          .from('game_roles')
          .select('*')
          .eq('game_id', gameId);

        if (rolesError) throw rolesError;

        // Load team members
        const { data: teamMembers, error: teamError } = await supabase
          .from('game_team_members')
          .select('*')
          .eq('game_id', gameId)
          .order('created_at');

        if (teamError) throw teamError;

        // Build budgets object from roles
        const budgets: Record<string, number> = {};
        const rolesData = roles?.map(role => ({
          id: role.role,
          label: role.role === 'founder' ? 'Founder' : role.role === 'angel' ? 'Angel' : 'VC',
          canTrade: true,
          voteWeight: 1,
          isIssuer: role.role === 'founder'
        })) || [];

        roles?.forEach(role => {
          budgets[role.role] = role.default_budget;
        });

        // Update form data with loaded data
        setFormData(prev => ({
          ...prev,
          // Step 1 - Basic Information
          name: game.name || "",
          description: game.description || "",
          currency: game.currency || "USD",
          startDate: new Date(game.starts_at),
          endDate: new Date(game.ends_at),
          hasSpecificTimes: game.has_specific_times || false,
          startTime: game.start_time || "09:00",
          endTime: game.end_time || "17:00",
          colorTheme: game.color_theme || "default",
          notifications: game.notifications_enabled ?? true,
          language: game.locale || "en",
          logoUrl: game.logo_url || "",
          headerUrl: game.hero_image_url || "",
          // Step 2 - Organization data
          organizerName: game.organizer_name || (organizer ? `${organizer.first_name} ${organizer.last_name}`.trim() : prev.organizerName),
          organizerCompany: game.organizer_company || prev.organizerCompany,
          eventWebsite: game.event_website || prev.eventWebsite,
          teamMembers: teamMembers?.map(member => ({
            email: member.email,
            name: member.name,
            role: member.role
          })) || [
            {
              email: organizer?.email || prev.teamMembers[0]?.email || "",
              name: organizer ? `${organizer.first_name} ${organizer.last_name}`.trim() : prev.teamMembers[0]?.name || "",
              role: "Organizer"
            }
          ],
          // Step 3 - Template & Terminology
          templateId: game.template_id || "",
          assetSingular: game.asset_singular || "",
          assetPlural: game.asset_plural || "",
          roles: rolesData,
          budgets,
          // Step 4 - Game Settings
          enablePrimaryMarket: game.enable_primary_market ?? true,
          enableSecondaryMarket: game.allow_secondary || false,
          leaderboardMode: game.show_public_leaderboards ? 'public_live' : 'private',
          tradingMode: game.trading_mode || 'continuous',
          circuitBreaker: game.circuit_breaker ?? true,
          maxPricePerShare: game.max_price_per_share || 10000,
          judgesPanel: game.judges_panel || false
        }));

      } catch (error: any) {
        console.error('Error loading game data:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados do evento.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [isEditMode, gameId, navigate]);

  const handleSubmit = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const gameData = {
        name: formData.name,
        description: formData.description,
        starts_at: formData.startDate.toISOString(),
        ends_at: formData.endDate.toISOString(),
        currency: formData.currency,
        locale: formData.language,
        allow_secondary: formData.enableSecondaryMarket,
        show_public_leaderboards: formData.leaderboardMode === 'public_live',
        circuit_breaker: formData.circuitBreaker,
        max_price_per_share: formData.maxPricePerShare,
        logo_url: formData.logoUrl,
        hero_image_url: formData.headerUrl,
        // Step 1 additional fields
        has_specific_times: formData.hasSpecificTimes,
        start_time: formData.hasSpecificTimes ? formData.startTime : null,
        end_time: formData.hasSpecificTimes ? formData.endTime : null,
        color_theme: formData.colorTheme,
        notifications_enabled: formData.notifications,
        // Step 2 fields
        organizer_name: formData.organizerName,
        organizer_company: formData.organizerCompany,
        event_website: formData.eventWebsite,
        // Step 3 fields
        template_id: formData.templateId,
        asset_singular: formData.assetSingular,
        asset_plural: formData.assetPlural,
        // Step 4 fields
        enable_primary_market: formData.enablePrimaryMarket,
        trading_mode: formData.tradingMode,
        judges_panel: formData.judgesPanel,
      };

      if (isEditMode && gameId) {
        // Update existing game
        const { error: gameError } = await supabase
          .from('games')
          .update(gameData)
          .eq('id', gameId);

        if (gameError) throw gameError;

        // Update game roles
        await supabase
          .from('game_roles')
          .delete()
          .eq('game_id', gameId);

        if (formData.roles.length > 0) {
          const roleData = formData.roles.map(role => ({
            game_id: gameId,
            role: role.id as any,
            default_budget: formData.budgets[role.id] || 0
          }));

          const { error: rolesError } = await supabase
            .from('game_roles')
            .insert(roleData);

        if (rolesError) throw rolesError;
        }

        // Save team members
        if (formData.teamMembers && formData.teamMembers.length > 0) {
          // Delete existing team members
          await supabase
            .from('game_team_members')
            .delete()
            .eq('game_id', gameId);

          // Insert new team members
          const teamMemberData = formData.teamMembers.map(member => ({
            game_id: gameId,
            email: member.email,
            name: member.name,
            role: member.role
          }));

          const { error: teamError } = await supabase
            .from('game_team_members')
            .insert(teamMemberData);

          if (teamError) throw teamError;
        }

        toast({
          title: "Sucesso!",
          description: "Evento atualizado com sucesso.",
        });

        navigate(`/games/${gameId}/organizer`);
      } else {
        // Create new game
        const createData = {
          ...gameData,
          owner_user_id: user.id,
          status: 'draft' as const,
        };

        const { data: game, error: gameError } = await supabase
          .from('games')
          .insert(createData)
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
      }
    } catch (error: any) {
      console.error('Error saving game:', error);
      toast({
        title: "Erro",
        description: error.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} evento. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const nextStep = useCallback(() => {
    if (currentStep < 6) setCurrentStep(prev => prev + 1);
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  }, [currentStep]);

  const canProceed = () => {
    // Permitir navegação livre entre passos
    return true;
  };

  const createPreviewData = () => {
    return {
      name: formData.name || "Nome do Evento",
      description: formData.description || "Descrição do evento...",
      logo_url: formData.logoUrl,
      hero_image_url: formData.headerUrl,
      starts_at: formData.startDate.toISOString(),
      ends_at: formData.endDate.toISOString(),
      currency: formData.currency,
      locale: formData.language,
      allow_secondary: formData.enableSecondaryMarket,
      show_public_leaderboards: formData.leaderboardMode === 'public_live',
      circuit_breaker: formData.circuitBreaker,
      max_price_per_share: formData.maxPricePerShare,
      default_budgets: {
        founder: formData.budgets['founder'] || 10000,
        angel: formData.budgets['angel'] || 100000,
        vc: formData.budgets['vc'] || 1000000,
      },
      organizer: {
        name: formData.organizerName || (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "Organizador"),
        avatar: profile?.avatar_url
      },
      participants_count: 0,
      startups_count: 0,
    };
  };

  const steps = useMemo(() => [
    { id: 1, name: "Básico" },
    { id: 2, name: "Organização" },
    { id: 3, name: "Template" },
    { id: 4, name: "Configurações" },
    { id: 5, name: "Como Funciona" },
    { id: 6, name: "Preview" }
  ], []);

  const getCurrentStepComponent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInformation formData={formData} setFormData={setFormData} />;
      case 2:
        return <Step2Organization formData={formData} setFormData={setFormData} />;
      case 3:
        return <Step3TemplateTerminology formData={formData} setFormData={setFormData} />;
      case 4:
        return <Step4GameSettings formData={formData} setFormData={setFormData} />;
      case 5:
        return <Step5HowItWorks formData={formData} />;
      case 6:
        return <Step6PreviewCreate formData={formData} />;
      default:
        return <Step1BasicInformation formData={formData} setFormData={setFormData} />;
    }
  }, [currentStep, formData, setFormData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-700">{isEditMode ? 'Editar Evento' : 'Criar Novo Evento'}</h1>
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
            {getCurrentStepComponent()}
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
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (isEditMode && gameId) {
                  navigate(`/games/${gameId}/preview`);
                } else {
                  setShowPreview(true);
                }
              }}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
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
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isCreating ? (isEditMode ? "Atualizando..." : "Criando...") : (isEditMode ? "Atualizar Evento" : "Criar Evento")}
              </Button>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>Preview do Evento</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <GameProfile
                gameData={createPreviewData()}
                isPreview={true}
                onBack={() => setShowPreview(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}