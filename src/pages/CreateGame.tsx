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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/DatePicker';
import { RichTextEditor } from '@/components/RichTextEditor';
import { GameProfile } from '@/components/GameProfile';
import { BrandingUpload } from '@/components/BrandingUpload';
import { ImageEditor } from '@/components/ImageEditor';
import {
  ChevronDown,
  ArrowLeft,
  Info,
  Upload,
  Palette,
  Bell,
  Trophy,
  Users,
  TrendingUp,
  Zap,
  Crown,
  Heart,
  User,
  Handshake,
  Sparkles,
  Lightbulb,
  Plus,
  X,
  Calendar,
  Clock,
  Settings,
  Play,
  Target,
  Briefcase,
  Users2,
  Send,
  Edit3,
  Check,
  Mail,
  Building2,
  Wallet
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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

const LOCALES = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "hi", label: "हिन्दी" },
  { value: "es", label: "Español" },
  { value: "ar", label: "العربية" },
  { value: "bn", label: "বাংলা" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "ja", label: "日本語" },
  { value: "de", label: "Deutsch" },
];

export default function CreateGame() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);
  const navigate = useNavigate();

  const [step, setStep] = useState<"template" | "form" | "preview" | "image-editor">("template");
  const [editingImageType, setEditingImageType] = useState<'logo' | 'header' | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Function to lookup user profile by email
  const lookupUserByEmail = async (email: string) => {
    if (!email.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, avatar_url')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Error looking up user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in lookupUserByEmail:', error);
      return null;
    }
  };

  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    currency: "USD",
    locale: "en",
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    hasFixedTimes: false,
    startTime: "09:00",
    endTime: "17:00",

    // Game Configuration
    allowSecondary: false,
    showPublicLeaderboards: false,
    circuitBreaker: true,
    maxPricePerShare: 10000,

    // Contest Features
    votingMode: "none",
    rewardSystem: "none",

    // Event Type
    eventType: "unconference",

    // Event Description
    description: "",

    // Organization
    organizerName: profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "",
    organizerCompany: "",
    eventWebsite: "",

    // Customization
    brandingLogo: "",
    profileHeader: "",
    colorTheme: "default",
    notificationSettings: true,

    // Organization team
    organizationTeam: [
      {
        email: profile?.email || user?.email || "",
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
        isOwner: true,
        status: 'active' as 'pending' | 'sent' | 'active',
        avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || ""
      }
    ] as Array<{ email: string; firstName: string; lastName: string; isOwner: boolean; status: 'pending' | 'sent' | 'active'; avatar_url?: string }>
  });

  // Update organization team when profile loads
  useEffect(() => {
    if (profile && formData.organizationTeam[0].isOwner) {
      setFormData(prev => ({
        ...prev,
        organizerName: profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : prev.organizerName,
        organizationTeam: [
          {
            email: profile.email || user?.email || "",
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            isOwner: true,
            status: 'active' as 'pending' | 'sent' | 'active',
            avatar_url: profile.avatar_url || user?.user_metadata?.avatar_url || ""
          },
          ...prev.organizationTeam.slice(1)
        ]
      }));
    }
  }, [profile, user?.email]);

  const [budgets, setBudgets] = useState([
    { id: 'founder', label: 'Founder Budget', value: 10000 },
    { id: 'angel', label: 'Angel Budget', value: 100000 },
    { id: 'vc', label: 'VC Budget', value: 1000000 },
  ]);

  const availableBudgetTypes = [
    { id: 'founder', label: 'Founder Budget' },
    { id: 'angel', label: 'Angel Budget' },
    { id: 'vc', label: 'VC Budget' },
    { id: 'team', label: 'Team Budget' },
    { id: 'investor', label: 'Investor Budget' },
    { id: 'employee', label: 'Employee Budget' },
    { id: 'student', label: 'Student Budget' },
    { id: 'visitor', label: 'Visitor Budget' },
    { id: 'booth', label: 'Booth Budget' },
  ];

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === formData.currency)?.symbol || "$";
  };

  const formatBudget = (amount: number, currency: string = formData.currency) => {
    const symbol = CURRENCIES.find(c => c.value === currency)?.symbol || "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    try {
      const gameData = {
        owner_user_id: user.id,
        name: formData.name,
        description: formData.description,
        status: 'draft' as const,
        starts_at: formData.startsAt.toISOString(),
        ends_at: formData.endsAt.toISOString(),
        currency: formData.currency,
        locale: formData.locale,
        allow_secondary: formData.allowSecondary,
        show_public_leaderboards: formData.showPublicLeaderboards,
        circuit_breaker: formData.circuitBreaker,
        max_price_per_share: formData.maxPricePerShare,
      };

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single();

      if (gameError) throw gameError;

      // Create default game roles
      const roleData = budgets.map(budget => ({
        game_id: game.id,
        role: budget.id as 'founder' | 'angel' | 'vc',
        default_budget: budget.value
      }));

      const { error: rolesError } = await supabase
        .from('game_roles')
        .insert(roleData);

      if (rolesError) throw rolesError;

      // Create participant entry for the organizer
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

  const applyTemplate = (templateValue: string) => {
    const template = GAME_TEMPLATES.find(t => t.value === templateValue);
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      name: template.label,
      eventType: templateValue,
      ...template.config
    }));

    setStep("form");
  };

  // Game templates data
  const GAME_TEMPLATES = [
    {
      value: 'unconference',
      label: 'Unconference',
      tag: 'Recommended',
      tagline: 'Open, participant-driven format',
      defaults: 'Sessions, Networking, Polls',
      icon: Users2,
      colors: {
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600'
      },
      config: {
        allowSecondary: false,
        showPublicLeaderboards: true,
        votingMode: "virtual-money",
        rewardSystem: "badges"
      }
    },
    {
      value: 'hackathon',
      label: 'Hackathon',
      tagline: 'Innovation and coding competition',
      defaults: 'Project submission, Judging, Prizes',
      icon: Lightbulb,
      colors: {
        bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
        iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600'
      },
      config: {
        allowSecondary: false,
        showPublicLeaderboards: true,
        votingMode: "judges",
        rewardSystem: "prizes"
      }
    },
    {
      value: 'charity',
      label: 'Charity Event',
      tagline: 'Making a positive impact together',
      defaults: 'Fundraising, Donations, Impact tracking',
      icon: Heart,
      colors: {
        bg: 'bg-gradient-to-br from-pink-50 to-rose-50',
        iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600'
      },
      config: {
        allowSecondary: false,
        showPublicLeaderboards: true,
        votingMode: "donation",
        rewardSystem: "impact"
      }
    },
    {
      value: 'demo_day',
      label: 'Demo Day',
      tagline: 'Showcase and pitch competition',
      defaults: 'Presentations, Feedback, Awards',
      icon: Trophy,
      colors: {
        bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
        iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600'
      },
      config: {
        allowSecondary: false,
        showPublicLeaderboards: true,
        votingMode: "panel",
        rewardSystem: "awards"
      }
    },
    {
      value: 'networking',
      label: 'Networking Event',
      tagline: 'Building connections and relationships',
      defaults: 'Meet & greet, Business cards, Follow-ups',
      icon: Users,
      colors: {
        bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
        iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600'
      },
      config: {
        allowSecondary: false,
        showPublicLeaderboards: false,
        votingMode: "none",
        rewardSystem: "connections"
      }
    },
    {
      value: 'custom',
      label: 'Custom Event',
      tagline: 'Build your own unique experience',
      defaults: 'Fully customizable settings',
      icon: Plus,
      colors: {
        bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
        iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600'
      },
      config: {
        allowSecondary: false,
        showPublicLeaderboards: false,
        votingMode: "none",
        rewardSystem: "none"
      }
    }
  ];

  const CustomTooltip = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3">
        <div className="space-y-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );

  if (step === "template") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Game</h1>
            <p className="text-gray-600 mt-2">Choose a template to get started</p>
          </div>
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {GAME_TEMPLATES.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card
                    key={template.value}
                    className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-gray-200 ${template.colors.bg}`}
                    onClick={() => applyTemplate(template.value)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 ${template.colors.iconBg} rounded-xl shadow-sm`}>
                            <IconComponent className={`h-6 w-6 text-white`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-gray-700">{template.label}</CardTitle>
                            {template.tag && (
                              <Badge variant="secondary" className="mt-1 bg-orange-100 text-orange-700">
                                {template.tag}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{template.tagline}</p>
                      <div className="text-sm text-gray-500">
                        <strong>Defaults:</strong> {template.defaults}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    const gameData = {
      name: formData.name,
      description: formData.description,
      logo_url: formData.brandingLogo,
      hero_image_url: formData.profileHeader,
      starts_at: formData.startsAt.toISOString(),
      ends_at: formData.endsAt.toISOString(),
      currency: formData.currency,
      locale: formData.locale,
      allow_secondary: formData.allowSecondary,
      show_public_leaderboards: formData.showPublicLeaderboards,
      circuit_breaker: formData.circuitBreaker,
      max_price_per_share: formData.maxPricePerShare,
      default_budgets: {
        founder: budgets.find(b => b.id === 'founder')?.value || 0,
        angel: budgets.find(b => b.id === 'angel')?.value || 0,
        vc: budgets.find(b => b.id === 'vc')?.value || 0,
      },
      organizer: {
        name: user?.user_metadata?.full_name || user?.email || "Event Organizer",
        avatar: user?.user_metadata?.avatar_url,
      },
    };

    const handleCreateGame = () => {
      const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
      handleSubmit(fakeEvent);
    };

    const handleImageEdit = (type?: 'logo' | 'header') => {
      if (type) {
        setEditingImageType(type);
        setStep("image-editor");
      } else {
        setStep("form");
      }
    };

    return (
      <GameProfile
        gameData={gameData}
        isPreview={true}
        onBack={() => setStep("form")}
        onEdit={handleImageEdit}
        onCreateGame={handleCreateGame}
      />
    );
  }

  if (step === "image-editor" && editingImageType) {
    return (
      <ImageEditor
        type={editingImageType}
        onSave={(imageBlob: Blob) => {
          // Convert blob to object URL for preview
          const imageUrl = URL.createObjectURL(imageBlob);
          if (editingImageType === 'logo') {
            setFormData(prev => ({ ...prev, brandingLogo: imageUrl }));
          } else if (editingImageType === 'header') {
            setFormData(prev => ({ ...prev, profileHeader: imageUrl }));
          }
          setStep("preview");
        }}
        onCancel={() => setStep("preview")}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setStep("template")}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">Create New Game</h1>
            <p className="text-gray-600 mt-2">Configure your game settings</p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="space-y-8">

              {/* Basic Information */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Set up the fundamental details for your game
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Game Title</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter game title"
                        required
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">Event Description</Label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(value) => setFormData({ ...formData, description: value })}
                      placeholder="Describe your event..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Organization */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Organization
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Event organizer information and team management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Organizer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Organizer Name
                      </Label>
                      <Input
                        placeholder="Your name or primary organizer name"
                        value={formData.organizerName}
                        onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Company/Organization
                      </Label>
                      <Input
                        placeholder="Your company or organization name"
                        value={formData.organizerCompany}
                        onChange={(e) => setFormData({ ...formData, organizerCompany: e.target.value })}
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Event Website
                    </Label>
                    <Input
                      placeholder="https://your-event-website.com"
                      value={formData.eventWebsite}
                      onChange={(e) => setFormData({ ...formData, eventWebsite: e.target.value })}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>

                  <Separator />

                  {/* Team Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Team Members</h4>
                      <p className="text-sm text-gray-500">Manage organizer access</p>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.organizationTeam.map((member, index) => (
                        <div key={index} className={cn(
                          "flex items-center space-x-4 p-4 rounded-lg border",
                          member.isOwner ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"
                        )}>
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.avatar_url} alt={`${member.firstName} ${member.lastName}`} />
                              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold text-lg">
                                {member.firstName && member.lastName
                                  ? `${member.firstName[0]}${member.lastName[0]}`
                                  : member.email
                                    ? member.email[0].toUpperCase()
                                    : '?'}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          {/* Content - keeping existing organization team functionality */}
                          <div className="flex-1 space-y-3">
                          {/* Name and Role */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900">
                                  {member.firstName && member.lastName
                                    ? `${member.firstName} ${member.lastName}`
                                    : 'Unnamed Member'
                                  }
                                </h4>
                                {member.isOwner && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                    Event Organizer
                                  </Badge>
                                )}
                                {!member.isOwner && (
                                  <Badge
                                    variant={member.status === 'active' ? 'default' : 'secondary'}
                                    className={cn(
                                      "text-xs ml-2",
                                      member.status === 'active' && "bg-green-100 text-green-800",
                                      member.status === 'sent' && "bg-blue-100 text-blue-800",
                                      member.status === 'pending' && "bg-gray-100 text-gray-800"
                                    )}
                                  >
                                    {member.status === 'active' && 'Active'}
                                    {member.status === 'sent' && 'Invitation Sent'}
                                    {member.status === 'pending' && 'Pending'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{member.email}</p>
                            </div>

                            {/* Actions */}
                            {!member.isOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newTeam = formData.organizationTeam.filter((_, i) => i !== index);
                                  setFormData({ ...formData, organizationTeam: newTeam });
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* Edit Fields */}
                          <div className="grid grid-cols-3 gap-3">
                            <Input
                              placeholder="First name"
                              value={member.firstName}
                              onChange={(e) => {
                                const newTeam = [...formData.organizationTeam];
                                newTeam[index].firstName = e.target.value;
                                setFormData({ ...formData, organizationTeam: newTeam });
                              }}
                              className="bg-white text-sm"
                            />
                            <Input
                              placeholder="Last name"
                              value={member.lastName}
                              onChange={(e) => {
                                const newTeam = [...formData.organizationTeam];
                                newTeam[index].lastName = e.target.value;
                                setFormData({ ...formData, organizationTeam: newTeam });
                              }}
                              className="bg-white text-sm"
                            />
                            <div className="flex gap-2">
                              <Input
                                placeholder="Email"
                                type="email"
                                value={member.email}
                                onChange={async (e) => {
                                  const newTeam = [...formData.organizationTeam];
                                  newTeam[index].email = e.target.value;

                                  // Lookup user profile by email
                                  if (e.target.value && e.target.value.includes('@')) {
                                    const userProfile = await lookupUserByEmail(e.target.value);
                                    if (userProfile) {
                                      newTeam[index].firstName = userProfile.first_name || newTeam[index].firstName;
                                      newTeam[index].lastName = userProfile.last_name || newTeam[index].lastName;
                                      newTeam[index].avatar_url = userProfile.avatar_url || "";
                                      newTeam[index].status = 'active';
                                    } else {
                                      newTeam[index].status = 'pending';
                                      newTeam[index].avatar_url = "";
                                    }
                                  }

                                  setFormData({ ...formData, organizationTeam: newTeam });
                                }}
                                className="bg-white text-sm flex-1"
                              />
                              {!member.isOwner && member.email && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Send invite logic would go here
                                    const newTeam = [...formData.organizationTeam];
                                    newTeam[index].status = 'sent';
                                    setFormData({ ...formData, organizationTeam: newTeam });
                                    // TODO: Implement actual email sending
                                  }}
                                  className="px-3 text-gray-600 hover:text-orange-600"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                      <Button
                        variant="outline"
                        onClick={() => {
                          const newTeam = [...formData.organizationTeam, {
                            email: "",
                            firstName: "",
                            lastName: "",
                            isOwner: false,
                            status: 'pending' as 'pending' | 'sent' | 'active',
                            avatar_url: ""
                          }];
                          setFormData({ ...formData, organizationTeam: newTeam });
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Team Member
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How it Works */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    How it Works
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Understanding the game mechanics and flow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2 p-4 border rounded-lg border-blue-200 bg-blue-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <h4 className="font-medium text-blue-900">Setup</h4>
                      </div>
                      <p className="text-sm text-blue-800">Startups register with shares, participants get budgets</p>
                    </div>
                    <div className="space-y-2 p-4 border rounded-lg border-green-200 bg-green-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <h4 className="font-medium text-green-900">Trading</h4>
                      </div>
                      <p className="text-sm text-green-800">Investors propose trades, founders accept/reject primary orders</p>
                    </div>
                    <div className="space-y-2 p-4 border rounded-lg border-purple-200 bg-purple-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <h4 className="font-medium text-purple-900">Pricing</h4>
                      </div>
                      <p className="text-sm text-purple-800">VWAP of last 3 trades sets market price automatically</p>
                    </div>
                    <div className="space-y-2 p-4 border rounded-lg border-orange-200 bg-orange-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                        <h4 className="font-medium text-orange-900">Results</h4>
                      </div>
                      <p className="text-sm text-orange-800">Leaderboards show top startups and best-performing investors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Default Budgets */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Wallet className="h-5 w-5 mr-2" />
                    Default Budgets
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Set default budget amounts for each participant role
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map((budget, index) => (
                      <div key={budget.id} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 capitalize">
                          {budget.label}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            {getCurrencySymbol()}
                          </span>
                          <Input
                            type="number"
                            value={budget.value}
                            onChange={(e) => {
                              const newBudgets = [...budgets];
                              newBudgets[index].value = parseInt(e.target.value) || 0;
                              setBudgets(newBudgets);
                            }}
                            className="bg-white border-gray-300 text-gray-900 pl-8"
                            min="0"
                            step="1000"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatBudget(budget.value, formData.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-4">
                    <p className="text-sm text-gray-600 mr-2">Add budget type:</p>
                    {availableBudgetTypes
                      .filter(type => !budgets.some(b => b.id === type.id))
                      .map((type) => (
                        <Button
                          key={type.id}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBudgets([...budgets, { 
                              id: type.id, 
                              label: type.label, 
                              value: 10000 
                            }]);
                          }}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {type.label}
                        </Button>
                      ))}
                  </div>
                  
                  {budgets.length > 3 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <p className="text-sm text-gray-600 mr-2">Remove:</p>
                      {budgets.slice(3).map((budget) => (
                        <Button
                          key={budget.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBudgets(budgets.filter(b => b.id !== budget.id));
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {budget.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Dates & Times */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Event Dates & Times
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Set when your event will take place
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                      <DatePicker
                        date={formData.startsAt}
                        onDateSelect={(date) => setFormData({ ...formData, startsAt: date })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">End Date</Label>
                      <DatePicker
                        date={formData.endsAt}
                        onDateSelect={(date) => setFormData({ ...formData, endsAt: date })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.hasFixedTimes}
                      onCheckedChange={(checked) => setFormData({ ...formData, hasFixedTimes: checked })}
                    />
                    <Label className="text-sm text-gray-700">Set specific start and end times</Label>
                  </div>

                  {formData.hasFixedTimes && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Start Time
                        </Label>
                        <Input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          End Time
                        </Label>
                        <Input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Game Configuration */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Game Configuration
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure game mechanics and features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-700">Secondary Trading</Label>
                          <p className="text-xs text-gray-500">Allow participants to trade shares with each other</p>
                        </div>
                        <Switch
                          checked={formData.allowSecondary}
                          onCheckedChange={(checked) => setFormData({ ...formData, allowSecondary: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-700">Public Leaderboards</Label>
                          <p className="text-xs text-gray-500">Show rankings publicly during the game</p>
                        </div>
                        <Switch
                          checked={formData.showPublicLeaderboards}
                          onCheckedChange={(checked) => setFormData({ ...formData, showPublicLeaderboards: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-700">Circuit Breaker</Label>
                          <p className="text-xs text-gray-500">Pause trading on extreme price movements</p>
                        </div>
                        <Switch
                          checked={formData.circuitBreaker}
                          onCheckedChange={(checked) => setFormData({ ...formData, circuitBreaker: checked })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxPrice" className="text-sm font-medium text-gray-700">Max Price Per Share</Label>
                        <Input
                          id="maxPrice"
                          type="number"
                          value={formData.maxPricePerShare}
                          onChange={(e) => setFormData({ ...formData, maxPricePerShare: parseInt(e.target.value) || 0 })}
                          placeholder="10000"
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="locale" className="text-sm font-medium text-gray-700">Language</Label>
                        <Select value={formData.locale} onValueChange={(value) => setFormData({ ...formData, locale: value })}>
                          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCALES.map((locale) => (
                              <SelectItem key={locale.value} value={locale.value}>
                                {locale.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contest Features */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Contest Features
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Add competition elements to your event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Voting Mode</Label>
                      <Select value={formData.votingMode} onValueChange={(value) => setFormData({ ...formData, votingMode: value })}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Voting</SelectItem>
                          <SelectItem value="audience">Audience Choice</SelectItem>
                          <SelectItem value="peer">Peer Review</SelectItem>
                          <SelectItem value="judges">Judge Scoring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Reward System</Label>
                      <Select value={formData.rewardSystem} onValueChange={(value) => setFormData({ ...formData, rewardSystem: value })}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Rewards</SelectItem>
                          <SelectItem value="winner">Winner Takes All</SelectItem>
                          <SelectItem value="top3">Top 3 Podium</SelectItem>
                          <SelectItem value="participation">Participation Rewards</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Type */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Event Type
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Choose the type of event you're organizing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { value: "unconference", label: "Unconference", icon: Users2 },
                      { value: "hackathon", label: "Hackathon", icon: Lightbulb },
                      { value: "charity", label: "Charity Event", icon: Heart },
                      { value: "demo_day", label: "Demo Day", icon: Trophy },
                      { value: "networking", label: "Networking", icon: Handshake },
                      { value: "custom", label: "Custom Event", icon: Plus },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, eventType: type.value })}
                        className={cn(
                          "p-4 border rounded-lg text-left transition-colors",
                          formData.eventType === type.value
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        )}
                      >
                        <type.icon className="h-6 w-6 mb-2" />
                        <div className="font-medium">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customization */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Customization
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Customize the look and feel of your event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Color Theme</Label>
                      <div className="space-y-3">
                        <Select value={formData.colorTheme} onValueChange={(value) => setFormData({ ...formData, colorTheme: value })}>
                          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Orange</SelectItem>
                            <SelectItem value="blue">Professional Blue</SelectItem>
                            <SelectItem value="green">Success Green</SelectItem>
                            <SelectItem value="purple">Creative Purple</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Color Preview */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { theme: 'default', colors: ['bg-orange-500', 'bg-orange-400', 'bg-orange-300'], name: 'Orange' },
                            { theme: 'blue', colors: ['bg-blue-500', 'bg-blue-400', 'bg-blue-300'], name: 'Blue' },
                            { theme: 'green', colors: ['bg-green-500', 'bg-green-400', 'bg-green-300'], name: 'Green' },
                            { theme: 'purple', colors: ['bg-purple-500', 'bg-purple-400', 'bg-purple-300'], name: 'Purple' },
                          ].map((colorSet) => (
                            <div 
                              key={colorSet.theme}
                              className={cn(
                                "p-2 rounded-lg border cursor-pointer transition-all",
                                formData.colorTheme === colorSet.theme 
                                  ? "border-gray-400 ring-2 ring-gray-300" 
                                  : "border-gray-200 hover:border-gray-300"
                              )}
                              onClick={() => setFormData({ ...formData, colorTheme: colorSet.theme })}
                            >
                              <div className="flex space-x-1 mb-1">
                                {colorSet.colors.map((color, index) => (
                                  <div key={index} className={`w-3 h-3 rounded ${color}`} />
                                ))}
                              </div>
                              <p className="text-xs text-gray-600 text-center">{colorSet.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">Notifications</Label>
                        <p className="text-xs text-gray-500">Send email updates to participants</p>
                      </div>
                      <Switch
                        checked={formData.notificationSettings}
                        onCheckedChange={(checked) => setFormData({ ...formData, notificationSettings: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BrandingUpload
                      type="logo"
                      currentUrl={formData.brandingLogo}
                      onUpload={(url) => setFormData({ ...formData, brandingLogo: url })}
                      title="Event Logo"
                      description="Upload your event logo (PNG, JPG - max 2MB)"
                    />
                    
                    <BrandingUpload
                      type="header"
                      currentUrl={formData.profileHeader}
                      onUpload={(url) => setFormData({ ...formData, profileHeader: url })}
                      title="Header Image"
                      description="Upload a header image for your event (PNG, JPG - max 5MB)"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("template")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Templates
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("preview")}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Preview Game
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
