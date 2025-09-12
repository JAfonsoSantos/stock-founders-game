import { useState } from "react";
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
  Building
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

interface GameProfileProps {
  gameData: GameData;
  isPreview?: boolean;
  onBack?: () => void;
  onEdit?: (type?: 'logo' | 'header') => void;
  onCreateGame?: () => void;
  onJoinGame?: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", CNY: "¥", JPY: "¥", GBP: "£",
  INR: "₹", AUD: "A$", CAD: "C$", CHF: "CHF", HKD: "HK$"
};

export function GameProfile({ 
  gameData, 
  isPreview = false, 
  onBack, 
  onEdit, 
  onCreateGame, 
  onJoinGame 
}: GameProfileProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        <div 
          className="h-48 w-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 group cursor-pointer relative"
          style={{
            backgroundImage: gameData.hero_image_url ? `url(${gameData.hero_image_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          
          {/* Edit Cover Image Button */}
          {isPreview && onEdit && (
            <div 
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
              onClick={() => onEdit('header')}
            >
              <Button
                variant="secondary"
                size="sm"
                className="bg-background/90 text-foreground hover:bg-background"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit cover image
              </Button>
            </div>
          )}
        </div>
        
        {/* Header Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Game Logo and Title */}
        <div className="absolute -bottom-12 left-6">
          <div className="flex items-end gap-4">
            <div className="relative group">
              <div className="h-24 w-24 border-4 border-background shadow-lg cursor-pointer rounded-lg bg-gray-100 border-gray-300 flex items-center justify-center flex-col">
                {gameData.logo_url ? (
                  <img src={gameData.logo_url} alt={gameData.name} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {gameData.name.charAt(0).toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">Your Event Logo</p>
                  </div>
                )}
              </div>
              
              {/* Edit Logo Button */}
              {isPreview && onEdit && (
                <div 
                  className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                  onClick={() => onEdit('logo')}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-background/90 text-foreground hover:bg-background p-2 h-8 w-8"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="pb-2">
              <div className="flex items-center justify-between w-full">
                <h1 className="text-4xl font-bold text-gray-900 drop-shadow-sm">
                  The Unconference
                </h1>
                {isPreview && (
                  <Badge variant="secondary" className="text-sm font-medium text-gray-800 bg-gray-200/90 backdrop-blur-sm mt-3">
                    Preview
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 px-6 pb-6 space-y-6">
        {/* Game Status and Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {gameData.participants_count && (
              <Badge variant="outline" className="text-sm">
                <Users className="h-3 w-3 mr-1" />
                {gameData.participants_count} participants
              </Badge>
            )}
            {gameData.startups_count && (
              <Badge variant="outline" className="text-sm">
                <Building className="h-3 w-3 mr-1" />
                {gameData.startups_count} startups
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {isPreview && onEdit && (
              <Button onClick={() => onEdit()} variant="outline" className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                <Edit className="h-4 w-4 mr-2" />
                Keep editing
              </Button>
            )}
            {isPreview && onCreateGame && (
              <Button onClick={onCreateGame} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Play className="h-4 w-4 mr-2" />
                Create Game
              </Button>
            )}
            {!isPreview && onJoinGame && (
              <Button onClick={onJoinGame} className="bg-orange-500 hover:bg-orange-600 text-white">
                Join Game
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {gameData.description && (
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="pt-6">
              <p className="text-gray-600 leading-relaxed">
                {gameData.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Game Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Timing */}
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Calendar className="h-5 w-5 text-orange-500" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  Starts
                </div>
                <p className="font-medium text-gray-900">{formatDate(gameData.starts_at)}</p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  Ends
                </div>
                <p className="font-medium text-gray-900">{formatDate(gameData.ends_at)}</p>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-gray-600 mb-1">Duration</div>
                <p className="font-medium text-gray-900">{getDuration()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Game Settings */}
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Settings className="h-5 w-5 text-orange-500" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Currency</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{gameData.currency}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Language</span>
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{gameData.locale.toUpperCase()}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Secondary Trading</span>
                <Badge variant={gameData.allow_secondary ? "default" : "secondary"} className={gameData.allow_secondary ? "bg-orange-500 text-white" : ""}>
                  {gameData.allow_secondary ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Public Leaderboards</span>
                <Badge variant={gameData.show_public_leaderboards ? "default" : "secondary"} className={gameData.show_public_leaderboards ? "bg-orange-500 text-white" : ""}>
                  {gameData.show_public_leaderboards ? "Public" : "Private"}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Circuit Breaker</span>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <Badge variant={gameData.circuit_breaker ? "default" : "secondary"} className={gameData.circuit_breaker ? "bg-orange-500 text-white" : ""}>
                    {gameData.circuit_breaker ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {gameData.max_price_per_share && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Price Per Share</span>
                    <span className="font-medium text-gray-900">{formatCurrency(gameData.max_price_per_share)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Default Budgets */}
        <Card className="bg-white shadow-md border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Default Budgets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
                <Crown className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <div className="text-sm text-gray-600 mb-1">Founder</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(gameData.default_budgets.founder)}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
                <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-sm text-gray-600 mb-1">Angel</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(gameData.default_budgets.angel)}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
                <Building className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-sm text-gray-600 mb-1">VC</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(gameData.default_budgets.vc)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizer Info */}
        {gameData.organizer && (
          <Card className="bg-white shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Users className="h-5 w-5 text-orange-500" />
                Organizer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={gameData.organizer.avatar} />
                  <AvatarFallback>
                    {gameData.organizer.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{gameData.organizer.name}</p>
                  <p className="text-sm text-gray-600">Event Organizer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}