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
              Editor Visual de Cores - Create Game
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

      <div className="container mx-auto px-4 py-8">
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
          
          <div className="flex items-center justify-between mt-2">
            {steps.map(step => (
              <EditableColorElement
                key={step.id}
                colorValue={colors.secondaryText}
                onColorChange={(color) => updateColor('secondaryText', color)}
                description="Nome dos passos"
              >
                <div className="text-xs text-center" style={{ width: '12.5%', color: colors.secondaryText }}>
                  {step.name}
                </div>
              </EditableColorElement>
            ))}
          </div>
        </div>

        {/* Main Card */}
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

                    <div>
                      <EditableColorElement
                        colorValue={colors.primaryText}
                        onColorChange={(color) => updateColor('primaryText', color)}
                        description="Label dos campos"
                      >
                        <Label style={{ color: colors.primaryText }}>Moeda</Label>
                      </EditableColorElement>
                      
                      <EditableColorElement
                        colorValue={colors.inputBackground}
                        onColorChange={(color) => updateColor('inputBackground', color)}
                        description="Fundo do select"
                      >
                        <Select>
                          <SelectTrigger style={{ 
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.inputBorder
                          }}>
                            <SelectValue placeholder="US Dollar (USD)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </EditableColorElement>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableColorElement>

        {/* Bottom Navigation */}
        <div className="flex justify-between mt-8 max-w-6xl mx-auto">
          <EditableColorElement
            colorValue={colors.secondaryButton}
            onColorChange={(color) => updateColor('secondaryButton', color)}
            description="Botão secundário"
          >
            <Button
              variant="outline"
              disabled
              style={{
                backgroundColor: colors.secondaryButton,
                borderColor: colors.secondaryButtonBorder,
                color: colors.secondaryText
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          </EditableColorElement>
          
          <EditableColorElement
            colorValue={colors.primaryButton}
            onColorChange={(color) => updateColor('primaryButton', color)}
            description="Botão principal"
          >
            <Button style={{ backgroundColor: colors.primaryButton, color: 'white' }}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </EditableColorElement>
        </div>
      </div>
    </EditableColorElement>
  );
}