import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Globe, 
  DollarSign,
  Settings,
  TrendingUp,
  Shield,
  Zap,
  Edit,
  Play,
  Crown,
  Building,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface GameData {
  name: string;
  description?: string;
  logo_url?: string;
  hero_image_url?: string;
  starts_at: string;
  ends_at: string;
  currency: string;
  locale: string;
  allow_secondary: boolean;
  show_public_leaderboards: boolean;
  circuit_breaker: boolean;
  max_price_per_share: number | null;
  default_budgets: {
    founder: number;
    angel: number;
    vc: number;
  };
  organizer?: {
    name: string;
    avatar?: string;
  };
  participants_count?: number;
  startups_count?: number;
}

interface Participant {
  id: string;
  role: string;
  user: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  founder_members?: Array<{
    venture: {
      id: string;
      name: string;
      logo_url?: string;
    };
  }>;
}

interface Venture {
  id: string;
  name: string;
  logo_url?: string;
  founder_count: number;
  founders?: Participant[];
}

interface GameProfileProps {
  gameData: GameData;
  isPreview?: boolean;
  gameId?: string;
  onBack?: () => void;
  onEdit?: (type?: 'logo' | 'header') => void;
  onCreateGame?: () => void;
  onJoinGame?: () => void;
  onAdminView?: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", CNY: "¥", JPY: "¥", GBP: "£",
  INR: "₹", AUD: "A$", CAD: "C$", CHF: "CHF", HKD: "HK$"
};

export function GameProfile({ 
  gameData, 
  isPreview = false, 
  gameId,
  onBack, 
  onEdit, 
  onCreateGame, 
  onJoinGame,
  onAdminView
}: GameProfileProps) {
  const [activeTab, setActiveTab] = useState<'participants' | 'ventures' | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedVenture, setExpandedVenture] = useState<string | null>(null);

  const currencySymbol = CURRENCY_SYMBOLS[gameData.currency] || gameData.currency;
  
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP 'at' p");
  };

  const getDuration = () => {
    const start = new Date(gameData.starts_at);
    const end = new Date(gameData.ends_at);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const fetchParticipants = async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      // Get all participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select(`
          id,
          role,
          user:users(first_name, last_name, avatar_url)
        `)
        .eq("game_id", gameId)
        .eq("status", "active");

      if (participantsError) throw participantsError;

      // For founders, get their venture info
      const participantsWithVentures = await Promise.all(
        (participantsData || []).map(async (participant) => {
          if (participant.role === 'founder') {
            const { data: founderData } = await supabase
              .from("founder_members")
              .select(`
                venture:ventures(id, name, logo_url)
              `)
              .eq("participant_id", participant.id)
              .single();

            return {
              ...participant,
              founder_members: founderData ? [founderData] : []
            };
          }
          return participant;
        })
      );

      setParticipants(participantsWithVentures);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVentures = async () => {
    if (!gameId) return;
    setLoading(true);
    try {
      // First get all ventures
      const { data: venturesData, error: venturesError } = await supabase
        .from("ventures")
        .select("id, name, logo_url")
        .eq("game_id", gameId);

      if (venturesError) throw venturesError;

      // Then get founder counts for each venture
      const venturesWithCounts = await Promise.all(
        (venturesData || []).map(async (venture) => {
          const { data: foundersData, error: foundersError } = await supabase
            .from("founder_members")
            .select(`
              participant:participants!inner(
                id,
                role,
                user:users(first_name, last_name, avatar_url)
              )
            `)
            .eq("venture_id", venture.id);

          if (foundersError) {
            console.error("Error fetching founders for venture:", venture.id, foundersError);
            return {
              ...venture,
              founder_count: 0,
              founders: []
            };
          }

          return {
            ...venture,
            founder_count: foundersData?.length || 0,
            founders: foundersData?.map(fm => fm.participant) || []
          };
        })
      );

      setVentures(venturesWithCounts);
    } catch (error) {
      console.error("Error fetching ventures:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab: 'participants' | 'ventures') => {
    if (activeTab === tab) {
      setActiveTab(null);
      return;
    }
    
    setActiveTab(tab);
    if (tab === 'participants') {
      fetchParticipants();
    } else {
      fetchVentures();
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'founder': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'angel': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'vc': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        <div 
          className="h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 w-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 group cursor-pointer relative"
          style={{
            backgroundImage: gameData.hero_image_url ? `url(${gameData.hero_image_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          
          {/* Edit Cover Image Button */}
          {isPreview && onEdit && (
            <div 
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
              onClick={() => onEdit('header')}
            >
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/90 text-gray-900 hover:bg-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit cover image
              </Button>
            </div>
          )}
        </div>
        
        {/* Header Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Game Logo and Title */}
        <div className="absolute -bottom-16 left-8 right-8">
          <div className="flex items-end gap-6">
            <div className="relative group">
              <div className="h-32 w-32 border-4 border-white shadow-xl cursor-pointer rounded-2xl bg-white flex items-center justify-center flex-col">
                {gameData.logo_url ? (
                  <img src={gameData.logo_url} alt={gameData.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="text-center flex flex-col justify-center h-full">
                    <div className="text-sm text-gray-400 leading-relaxed">
                      <div>Your</div>
                      <div>Logo</div>
                      <div>Here</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Edit Logo Button */}
              {isPreview && onEdit && (
                <div 
                  className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                  onClick={() => onEdit('logo')}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 text-gray-900 hover:bg-white p-2 h-10 w-10"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-end justify-between">
                <div>
                  {isPreview && (
                    <Badge variant="secondary" className="text-sm font-medium text-gray-800 bg-white/90 backdrop-blur-sm">
                      Preview Mode
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Title */}
      <div className="px-8 pt-8 pb-4 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            {gameData.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Game Status and Actions */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              {gameData.participants_count && (
                <button
                  onClick={() => handleTabClick('participants')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors",
                    activeTab === 'participants' 
                      ? "bg-blue-50 border-blue-200 text-blue-800" 
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Users className="h-4 w-4" />
                  {gameData.participants_count} participants
                  {activeTab === 'participants' ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </button>
              )}
              {gameData.startups_count && (
                <button
                  onClick={() => handleTabClick('ventures')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors",
                    activeTab === 'ventures' 
                      ? "bg-purple-50 border-purple-200 text-purple-800" 
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Building className="h-4 w-4" />
                  {gameData.startups_count} startups
                  {activeTab === 'ventures' ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              {isPreview && onAdminView && (
                <Button onClick={onAdminView} variant="outline" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                  <Eye className="h-4 w-4 mr-2" />
                  Admin View
                </Button>
              )}
              {isPreview && onEdit && (
                <Button onClick={() => onEdit()} variant="outline" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isPreview && onCreateGame && (
                <Button onClick={onCreateGame} className="bg-orange-500 hover:bg-orange-600 text-white px-6">
                  <Play className="h-4 w-4 mr-2" />
                  Create Game
                </Button>
              )}
              {!isPreview && onJoinGame && (
                <Button onClick={onJoinGame} className="bg-orange-500 hover:bg-orange-600 text-white px-6">
                  Join Game
                </Button>
              )}
            </div>
          </div>

          {/* Expandable Tab Content */}
          {activeTab && (
            <Card className="bg-white shadow-sm border-gray-100 mb-8">
              <CardContent className="pt-6 pb-6 px-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading...</div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'participants' && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Participants</h3>
                        {participants.map((participant) => (
                          <div key={participant.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.user.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                                {getInitials(participant.user.first_name, participant.user.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {participant.user.first_name} {participant.user.last_name}
                              </div>
                              {/* Show startup info for founders */}
                              {participant.role === 'founder' && participant.founder_members?.[0]?.venture && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="h-4 w-4 rounded border bg-white flex items-center justify-center overflow-hidden">
                                    {participant.founder_members[0].venture.logo_url ? (
                                      <img 
                                        src={participant.founder_members[0].venture.logo_url} 
                                        alt={participant.founder_members[0].venture.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Building className="h-2 w-2 text-gray-400" />
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {participant.founder_members[0].venture.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className={cn("text-xs font-medium", getRoleColor(participant.role))}>
                              {participant.role}
                            </Badge>
                          </div>
                        ))}
                        {participants.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No participants found
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'ventures' && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Startups</h3>
                        {ventures.map((venture) => (
                          <div key={venture.id} className="border border-gray-100 rounded-lg bg-gray-50/50">
                            <div className="flex items-center gap-4 p-3">
                              <div className="h-12 w-12 rounded-lg border-2 border-white shadow-sm bg-white flex items-center justify-center overflow-hidden">
                                {venture.logo_url ? (
                                  <img 
                                    src={venture.logo_url} 
                                    alt={venture.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Building className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{venture.name}</div>
                              </div>
                              <button
                                onClick={() => setExpandedVenture(expandedVenture === venture.id ? null : venture.id)}
                                className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                {venture.founder_count} founder{venture.founder_count !== 1 ? 's' : ''}
                                {expandedVenture === venture.id ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                                }
                              </button>
                            </div>
                            
                            {expandedVenture === venture.id && venture.founders && (
                              <div className="px-3 pb-3 space-y-2">
                                <Separator className="mb-2" />
                                {venture.founders.map((founder) => (
                                  <div key={founder.id} className="flex items-center gap-3 p-2 rounded bg-white">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={founder.user.avatar_url} />
                                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-semibold">
                                        {getInitials(founder.user.first_name, founder.user.last_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="text-sm font-medium text-gray-900">
                                      {founder.user.first_name} {founder.user.last_name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {ventures.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No startups found
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {gameData.description && (
            <Card className="bg-white shadow-sm border-gray-100 mb-8">
              <CardContent className="pt-8 pb-6 px-8">
                <div 
                  className="text-gray-700 leading-relaxed text-lg prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: gameData.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Schedule */}
              <Card className="bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pb-8">
                  <div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                      <Clock className="h-4 w-4" />
                      Starts
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(gameData.starts_at)}</p>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                      <Clock className="h-4 w-4" />
                      Ends
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(gameData.ends_at)}</p>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Duration</div>
                    <p className="text-lg font-semibold text-gray-900">{getDuration()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Default Budgets */}
              <Card className="bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    Default Budgets
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-3">
                        <Crown className="h-8 w-8 text-amber-600" />
                        <div>
                          <div className="text-sm font-medium text-amber-800">Founder</div>
                          <div className="text-xs text-amber-600">Startup founders</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-amber-900">{formatCurrency(gameData.default_budgets.founder)}</div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-blue-800">Angel</div>
                          <div className="text-xs text-blue-600">Angel investors</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{formatCurrency(gameData.default_budgets.angel)}</div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <Building className="h-8 w-8 text-emerald-600" />
                        <div>
                          <div className="text-sm font-medium text-emerald-800">VC</div>
                          <div className="text-xs text-emerald-600">Venture capital</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-emerald-900">{formatCurrency(gameData.default_budgets.vc)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Configuration */}
              <Card className="bg-white shadow-sm border-gray-100">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Settings className="h-6 w-6 text-purple-600" />
                    </div>
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Currency</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">{gameData.currency}</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Language</span>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                      <Globe className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">{gameData.locale.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Secondary Trading</span>
                    <Badge variant={gameData.allow_secondary ? "default" : "secondary"} 
                           className={cn("font-medium px-3 py-1", 
                             gameData.allow_secondary ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-700")}>
                      {gameData.allow_secondary ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Public Leaderboards</span>
                    <Badge variant={gameData.show_public_leaderboards ? "default" : "secondary"} 
                           className={cn("font-medium px-3 py-1",
                             gameData.show_public_leaderboards ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-700")}>
                      {gameData.show_public_leaderboards ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Circuit Breaker</span>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-gray-500" />
                      <Badge variant={gameData.circuit_breaker ? "default" : "secondary"} 
                             className={cn("font-medium px-3 py-1",
                               gameData.circuit_breaker ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-gray-100 text-gray-700")}>
                        {gameData.circuit_breaker ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  {gameData.max_price_per_share && (
                    <>
                      <div className="h-px bg-gray-100"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Max Price Per Share</span>
                        <span className="font-semibold text-gray-900 px-3 py-1 bg-gray-50 rounded-lg">{formatCurrency(gameData.max_price_per_share)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Organizer Info */}
              {gameData.organizer && (
                <Card className="bg-white shadow-sm border-gray-100">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                      Organizer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={gameData.organizer.avatar} />
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-lg font-semibold">
                          {gameData.organizer.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{gameData.organizer.name}</p>
                        <p className="text-sm text-gray-600">Event Organizer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}