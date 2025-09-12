import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditableColorElement } from '@/components/EditableColorElement';
import { ChevronLeft, ChevronRight, Check, ArrowLeft, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function SetupColors() {
  const navigate = useNavigate();

  // Estado das cores editáveis
  const [colors, setColors] = useState({
    // Backgrounds
    pageBackground: '#f8fafc',
    cardBackground: '#ffffff',
    headerBackground: '#f1f5f9',
    
    // Buttons
    primaryButton: '#FF6B35',
    primaryButtonHover: '#E55A2B',
    secondaryButton: '#f9fafb',
    secondaryButtonBorder: '#d1d5db',
    
    // Text
    primaryText: '#111827',
    secondaryText: '#6b7280',
    placeholderText: '#9ca3af',
    
    // Navigation
    stepActive: '#FF6B35',
    stepInactive: '#6b7280',
    stepCompleted: '#10b981',
    stepProgressActive: '#10b981',
    stepProgressInactive: '#e5e7eb',
    
    // Inputs
    inputBackground: '#ffffff',
    inputBorder: '#d1d5db',
    inputFocus: '#FF6B35',
    
    // Status colors
    successColor: '#10b981',
    errorColor: '#ef4444',
    warningColor: '#f59e0b'
  });

  const updateColor = (colorKey: string, newColor: string) => {
    setColors(prev => ({
      ...prev,
      [colorKey]: newColor
    }));
  };

  const applyChanges = () => {
    // Aplicar as cores ao CSS global
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, color]) => {
      root.style.setProperty(`--setup-${key}`, color);
    });
    
    toast({
      title: "Cores aplicadas!",
      description: "As mudanças foram salvas com sucesso.",
    });
  };

  const resetColors = () => {
    setColors({
      pageBackground: '#f8fafc',
      cardBackground: '#ffffff',
      headerBackground: '#f1f5f9',
      primaryButton: '#FF6B35',
      primaryButtonHover: '#E55A2B',
      secondaryButton: '#f9fafb',
      secondaryButtonBorder: '#d1d5db',
      primaryText: '#111827',
      secondaryText: '#6b7280',
      placeholderText: '#9ca3af',
      stepActive: '#FF6B35',
      stepInactive: '#6b7280',
      stepCompleted: '#10b981',
      stepProgressActive: '#10b981',
      stepProgressInactive: '#e5e7eb',
      inputBackground: '#ffffff',
      inputBorder: '#d1d5db',
      inputFocus: '#FF6B35',
      successColor: '#10b981',
      errorColor: '#ef4444',
      warningColor: '#f59e0b'
    });
  };

  // Simulação do estado do formulário
  const currentStep = 1;
  const steps = [
    { id: 1, name: "Básico" },
    { id: 2, name: "Organização" },
    { id: 3, name: "Template" },
    { id: 4, name: "Configurações" },
    { id: 5, name: "Como Funciona" },
    { id: 6, name: "Preview" }
  ];

  return (
    <EditableColorElement
      colorValue={colors.pageBackground}
      onColorChange={(color) => updateColor('pageBackground', color)}
      description="Fundo da página"
      className="min-h-screen"
      style={{ backgroundColor: colors.pageBackground }}
    >
      {/* Header de controle */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/setup')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Editor Visual de Cores - Todas as Páginas de Jogos
            </h1>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={resetColors}>
              Resetar
            </Button>
            <Button size="sm" onClick={applyChanges}>
              <Save className="w-4 h-4 mr-2" />
              Aplicar Mudanças
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-16">
        
        {/* 1. Create Game Page */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">1. Criar Novo Evento</h2>
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <EditableColorElement
                colorValue={colors.primaryText}
                onColorChange={(color) => updateColor('primaryText', color)}
                description="Título principal"
              >
                <h1 className="text-2xl font-bold" style={{ color: colors.primaryText }}>
                  Criar Novo Evento
                </h1>
              </EditableColorElement>
              
              <EditableColorElement
                colorValue={colors.secondaryText}
                onColorChange={(color) => updateColor('secondaryText', color)}
                description="Texto do passo"
              >
                <div className="text-sm" style={{ color: colors.secondaryText }}>
                  Passo {currentStep} de {steps.length}
                </div>
              </EditableColorElement>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <EditableColorElement
                    colorValue={currentStep === step.id ? colors.stepActive : 
                                currentStep > step.id ? colors.stepCompleted : 
                                colors.stepInactive}
                    onColorChange={(color) => updateColor(
                      currentStep === step.id ? 'stepActive' : 
                      currentStep > step.id ? 'stepCompleted' : 
                      'stepInactive', color
                    )}
                    description={`Cor do passo ${currentStep === step.id ? 'ativo' : 
                                 currentStep > step.id ? 'completo' : 'inativo'}`}
                  >
                    <div 
                      className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-white"
                      style={{
                        backgroundColor: currentStep === step.id ? colors.stepActive : 
                                       currentStep > step.id ? colors.stepCompleted : 
                                       colors.stepInactive
                      }}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                  </EditableColorElement>
                  
                  {index < steps.length - 1 && (
                    <EditableColorElement
                      colorValue={currentStep > step.id ? colors.stepProgressActive : colors.stepProgressInactive}
                      onColorChange={(color) => updateColor(
                        currentStep > step.id ? 'stepProgressActive' : 'stepProgressInactive', 
                        color
                      )}
                      description="Linha de progresso"
                    >
                      <div 
                        className="flex-1 h-1 rounded"
                        style={{
                          backgroundColor: currentStep > step.id ? colors.stepProgressActive : colors.stepProgressInactive
                        }}
                      />
                    </EditableColorElement>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <EditableColorElement
            colorValue={colors.cardBackground}
            onColorChange={(color) => updateColor('cardBackground', color)}
            description="Fundo do cartão principal"
          >
            <Card className="max-w-6xl mx-auto border-gray-200 shadow-sm" style={{ backgroundColor: colors.cardBackground }}>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <EditableColorElement
                      colorValue={colors.primaryText}
                      onColorChange={(color) => updateColor('primaryText', color)}
                      description="Título da seção"
                    >
                      <h2 className="text-2xl font-bold mb-2" style={{ color: colors.primaryText }}>
                        Informações Básicas
                      </h2>
                    </EditableColorElement>
                    
                    <EditableColorElement
                      colorValue={colors.secondaryText}
                      onColorChange={(color) => updateColor('secondaryText', color)}
                      description="Descrição da seção"
                    >
                      <p style={{ color: colors.secondaryText }}>
                        Configure os detalhes principais do seu evento
                      </p>
                    </EditableColorElement>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <EditableColorElement
                          colorValue={colors.primaryText}
                          onColorChange={(color) => updateColor('primaryText', color)}
                          description="Label dos campos"
                        >
                          <Label htmlFor="name" style={{ color: colors.primaryText }}>
                            Nome do Evento *
                          </Label>
                        </EditableColorElement>
                        
                        <EditableColorElement
                          colorValue={colors.inputBackground}
                          onColorChange={(color) => updateColor('inputBackground', color)}
                          description="Fundo dos inputs"
                        >
                          <Input
                            id="name"
                            placeholder="Ex: Demo Day Lisboa 2024"
                            style={{ 
                              backgroundColor: colors.inputBackground,
                              borderColor: colors.inputBorder,
                              color: colors.primaryText
                            }}
                            className="mt-1"
                          />
                        </EditableColorElement>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </EditableColorElement>
        </div>

        {/* 2. Game Organizer Dashboard */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">2. Dashboard do Organizador</h2>
          
          <EditableColorElement
            colorValue={colors.headerBackground}
            onColorChange={(color) => updateColor('headerBackground', color)}
            description="Fundo do cabeçalho"
          >
            <div className="border-b border-gray-200 p-6 rounded-t-lg" style={{ backgroundColor: colors.headerBackground }}>
              <EditableColorElement
                colorValue={colors.primaryText}
                onColorChange={(color) => updateColor('primaryText', color)}
                description="Título do jogo"
              >
                <h1 className="text-2xl font-bold" style={{ color: colors.primaryText }}>
                  Demo Summit Lisboa 2024
                </h1>
              </EditableColorElement>
              
              <EditableColorElement
                colorValue={colors.secondaryText}
                onColorChange={(color) => updateColor('secondaryText', color)}
                description="Subtítulo"
              >
                <p style={{ color: colors.secondaryText }}>
                  Game Organizer Dashboard
                </p>
              </EditableColorElement>
            </div>
          </EditableColorElement>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "Participantes", value: "24", icon: "👥" },
              { title: "Startups", value: "8", icon: "🏢" },
              { title: "Volume Total", value: "$245K", icon: "💰" },
              { title: "Trades", value: "67", icon: "📊" }
            ].map((stat, index) => (
              <EditableColorElement
                key={index}
                colorValue={colors.cardBackground}
                onColorChange={(color) => updateColor('cardBackground', color)}
                description="Fundo dos cartões de estatística"
              >
                <Card style={{ backgroundColor: colors.cardBackground }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <EditableColorElement
                          colorValue={colors.secondaryText}
                          onColorChange={(color) => updateColor('secondaryText', color)}
                          description="Texto das métricas"
                        >
                          <p className="text-sm" style={{ color: colors.secondaryText }}>
                            {stat.title}
                          </p>
                        </EditableColorElement>
                        
                        <EditableColorElement
                          colorValue={colors.primaryText}
                          onColorChange={(color) => updateColor('primaryText', color)}
                          description="Valor das métricas"
                        >
                          <p className="text-2xl font-bold" style={{ color: colors.primaryText }}>
                            {stat.value}
                          </p>
                        </EditableColorElement>
                      </div>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                  </CardContent>
                </Card>
              </EditableColorElement>
            ))}
          </div>

          <div className="flex space-x-4">
            <EditableColorElement
              colorValue={colors.primaryButton}
              onColorChange={(color) => updateColor('primaryButton', color)}
              description="Botão primário do organizador"
            >
              <Button style={{ backgroundColor: colors.primaryButton, color: 'white' }}>
                Abrir Mercado
              </Button>
            </EditableColorElement>
            
            <EditableColorElement
              colorValue={colors.secondaryButton}
              onColorChange={(color) => updateColor('secondaryButton', color)}
              description="Botão secundário"
            >
              <Button variant="outline" style={{ backgroundColor: colors.secondaryButton, borderColor: colors.secondaryButtonBorder }}>
                Configurações
              </Button>
            </EditableColorElement>
          </div>
        </div>

        {/* 3. Discover Startups */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">3. Descobrir Startups</h2>
          
          <EditableColorElement
            colorValue={colors.primaryText}
            onColorChange={(color) => updateColor('primaryText', color)}
            description="Título da página de descoberta"
          >
            <h1 className="text-3xl font-bold" style={{ color: colors.primaryText }}>
              Descobrir Startups
            </h1>
          </EditableColorElement>
          
          <EditableColorElement
            colorValue={colors.secondaryText}
            onColorChange={(color) => updateColor('secondaryText', color)}
            description="Descrição da página"
          >
            <p style={{ color: colors.secondaryText }}>
              Navegue e invista em startups promissoras
            </p>
          </EditableColorElement>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "TechFlow AI", price: "$12.50", logo: "🤖", description: "Plataforma de IA para automação" },
              { name: "GreenEnergy", price: "$8.75", logo: "🌱", description: "Soluções sustentáveis de energia" },
              { name: "HealthTech", price: "$15.20", logo: "🏥", description: "Tecnologia para saúde digital" }
            ].map((startup, index) => (
              <EditableColorElement
                key={index}
                colorValue={colors.cardBackground}
                onColorChange={(color) => updateColor('cardBackground', color)}
                description="Fundo dos cartões de startup"
              >
                <Card className="hover:shadow-lg transition-shadow" style={{ backgroundColor: colors.cardBackground }}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                        {startup.logo}
                      </div>
                      <div>
                        <EditableColorElement
                          colorValue={colors.primaryText}
                          onColorChange={(color) => updateColor('primaryText', color)}
                          description="Nome da startup"
                        >
                          <h3 className="font-semibold" style={{ color: colors.primaryText }}>
                            {startup.name}
                          </h3>
                        </EditableColorElement>
                        
                        <EditableColorElement
                          colorValue={colors.successColor}
                          onColorChange={(color) => updateColor('successColor', color)}
                          description="Preço da ação"
                        >
                          <p className="text-sm font-medium" style={{ color: colors.successColor }}>
                            {startup.price}
                          </p>
                        </EditableColorElement>
                      </div>
                    </div>
                    
                    <EditableColorElement
                      colorValue={colors.secondaryText}
                      onColorChange={(color) => updateColor('secondaryText', color)}
                      description="Descrição da startup"
                    >
                      <p className="text-sm mb-4" style={{ color: colors.secondaryText }}>
                        {startup.description}
                      </p>
                    </EditableColorElement>
                    
                    <EditableColorElement
                      colorValue={colors.primaryButton}
                      onColorChange={(color) => updateColor('primaryButton', color)}
                      description="Botão de investir"
                    >
                      <Button className="w-full" style={{ backgroundColor: colors.primaryButton, color: 'white' }}>
                        Investir
                      </Button>
                    </EditableColorElement>
                  </CardContent>
                </Card>
              </EditableColorElement>
            ))}
          </div>
        </div>

        {/* 4. Player Dashboard */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">4. Dashboard do Jogador</h2>
          
          <EditableColorElement
            colorValue={colors.primaryText}
            onColorChange={(color) => updateColor('primaryText', color)}
            description="Título do portfólio"
          >
            <h1 className="text-3xl font-bold" style={{ color: colors.primaryText }}>
              Meu Portfólio
            </h1>
          </EditableColorElement>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Saldo", value: "$75,000", icon: "💰" },
              { title: "Investido", value: "$25,000", icon: "📈" },
              { title: "Valor Total", value: "$28,500", icon: "💎" },
              { title: "ROI", value: "+14%", icon: "🚀" }
            ].map((metric, index) => (
              <EditableColorElement
                key={index}
                colorValue={colors.cardBackground}
                onColorChange={(color) => updateColor('cardBackground', color)}
                description="Cartões de métricas do jogador"
              >
                <Card style={{ backgroundColor: colors.cardBackground }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <EditableColorElement
                          colorValue={colors.secondaryText}
                          onColorChange={(color) => updateColor('secondaryText', color)}
                          description="Labels das métricas"
                        >
                          <p className="text-sm" style={{ color: colors.secondaryText }}>
                            {metric.title}
                          </p>
                        </EditableColorElement>
                        
                        <EditableColorElement
                          colorValue={colors.primaryText}
                          onColorChange={(color) => updateColor('primaryText', color)}
                          description="Valores das métricas"
                        >
                          <p className="text-xl font-bold" style={{ color: colors.primaryText }}>
                            {metric.value}
                          </p>
                        </EditableColorElement>
                      </div>
                      <span className="text-xl">{metric.icon}</span>
                    </div>
                  </CardContent>
                </Card>
              </EditableColorElement>
            ))}
          </div>
        </div>

        {/* 5. Leaderboard */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">5. Leaderboards</h2>
          
          <EditableColorElement
            colorValue={colors.primaryText}
            onColorChange={(color) => updateColor('primaryText', color)}
            description="Título do leaderboard"
          >
            <h1 className="text-3xl font-bold flex items-center" style={{ color: colors.primaryText }}>
              🏆 Leaderboards
            </h1>
          </EditableColorElement>

          <EditableColorElement
            colorValue={colors.cardBackground}
            onColorChange={(color) => updateColor('cardBackground', color)}
            description="Fundo da tabela de leaderboard"
          >
            <Card style={{ backgroundColor: colors.cardBackground }}>
              <CardContent className="p-6">
                <EditableColorElement
                  colorValue={colors.primaryText}
                  onColorChange={(color) => updateColor('primaryText', color)}
                  description="Cabeçalho da tabela"
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primaryText }}>
                    Top Startups por Market Cap
                  </h3>
                </EditableColorElement>
                
                <div className="space-y-3">
                  {[
                    { rank: "🥇", name: "TechFlow AI", marketCap: "$1.2M" },
                    { rank: "🥈", name: "GreenEnergy", marketCap: "$890K" },
                    { rank: "🥉", name: "HealthTech", marketCap: "$750K" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{item.rank}</span>
                        
                        <EditableColorElement
                          colorValue={colors.primaryText}
                          onColorChange={(color) => updateColor('primaryText', color)}
                          description="Nome no leaderboard"
                        >
                          <span className="font-medium" style={{ color: colors.primaryText }}>
                            {item.name}
                          </span>
                        </EditableColorElement>
                      </div>
                      
                      <EditableColorElement
                        colorValue={colors.successColor}
                        onColorChange={(color) => updateColor('successColor', color)}
                        description="Valor no leaderboard"
                      >
                        <span className="font-bold" style={{ color: colors.successColor }}>
                          {item.marketCap}
                        </span>
                      </EditableColorElement>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </EditableColorElement>
        </div>

        {/* 6. Startup Profile */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-4">6. Perfil da Startup</h2>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-3xl">
                🤖
              </div>
              <div>
                <EditableColorElement
                  colorValue={colors.primaryText}
                  onColorChange={(color) => updateColor('primaryText', color)}
                  description="Nome da startup no perfil"
                >
                  <h1 className="text-3xl font-bold" style={{ color: colors.primaryText }}>
                    TechFlow AI
                  </h1>
                </EditableColorElement>
                
                <EditableColorElement
                  colorValue={colors.successColor}
                  onColorChange={(color) => updateColor('successColor', color)}
                  description="Preço no perfil"
                >
                  <span className="px-3 py-1 rounded-full text-lg font-medium" style={{ 
                    color: colors.successColor,
                    backgroundColor: `${colors.successColor}20`
                  }}>
                    $12.50 per share
                  </span>
                </EditableColorElement>
              </div>
            </div>
            
            <EditableColorElement
              colorValue={colors.primaryButton}
              onColorChange={(color) => updateColor('primaryButton', color)}
              description="Botão de investir no perfil"
            >
              <Button style={{ backgroundColor: colors.primaryButton, color: 'white' }}>
                Investir
              </Button>
            </EditableColorElement>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Market Cap", value: "$1.25M" },
              { title: "Ações Vendidas", value: "850/1000" },
              { title: "Ações Disponíveis", value: "150" }
            ].map((stat, index) => (
              <EditableColorElement
                key={index}
                colorValue={colors.cardBackground}
                onColorChange={(color) => updateColor('cardBackground', color)}
                description="Estatísticas da startup"
              >
                <Card style={{ backgroundColor: colors.cardBackground }}>
                  <CardContent className="p-6">
                    <EditableColorElement
                      colorValue={colors.secondaryText}
                      onColorChange={(color) => updateColor('secondaryText', color)}
                      description="Label das estatísticas"
                    >
                      <p className="text-sm font-medium" style={{ color: colors.secondaryText }}>
                        {stat.title}
                      </p>
                    </EditableColorElement>
                    
                    <EditableColorElement
                      colorValue={colors.primaryText}
                      onColorChange={(color) => updateColor('primaryText', color)}
                      description="Valor das estatísticas"
                    >
                      <p className="text-2xl font-bold" style={{ color: colors.primaryText }}>
                        {stat.value}
                      </p>
                    </EditableColorElement>
                  </CardContent>
                </Card>
              </EditableColorElement>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-16 pt-8 border-t">
          <EditableColorElement
            colorValue={colors.secondaryButton}
            onColorChange={(color) => updateColor('secondaryButton', color)}
            description="Botão de voltar"
          >
            <Button
              variant="outline"
              onClick={() => navigate('/setup')}
              style={{
                backgroundColor: colors.secondaryButton,
                borderColor: colors.secondaryButtonBorder,
                color: colors.secondaryText
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar ao Setup
            </Button>
          </EditableColorElement>
          
          <EditableColorElement
            colorValue={colors.primaryButton}
            onColorChange={(color) => updateColor('primaryButton', color)}
            description="Botão de aplicar todas as cores"
          >
            <Button 
              onClick={applyChanges}
              style={{ backgroundColor: colors.primaryButton, color: 'white' }}
            >
              <Save className="h-4 w-4 mr-2" />
              Aplicar Todas as Mudanças
            </Button>
          </EditableColorElement>
        </div>
      </div>
    </EditableColorElement>
  );
}