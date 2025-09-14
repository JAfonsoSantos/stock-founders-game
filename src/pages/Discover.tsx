import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, Building, Zap } from "lucide-react";
import { toast } from "sonner";
import InvestModal from "@/components/InvestModal";
import { useStartupPriceUpdates, useTradeUpdates } from "@/hooks/useRealtime";

interface Venture {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  total_shares: number;
  primary_shares_remaining: number;
  last_vwap_price: number | null;
}

export default function Discover() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenture, setSelectedVenture] = useState<Venture | null>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [priceUpdates, setPriceUpdates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!user || !gameId) return;
    
    const fetchData = async () => {
      // Check if user is participant
      const { data: participantData } = await supabase
        .from("participants")
        .select("*")
        .eq("game_id", gameId)
        .eq("user_id", user.id)
        .single();
      
      if (!participantData) {
        navigate(`/join/${gameId}`);
        return;
      }
      
      setParticipant(participantData);
      
      // Fetch ventures
      const { data: venturesData, error } = await supabase
        .from("ventures")
        .select("*")
        .eq("game_id", gameId)
        .order("name");
      
      if (error) {
        toast.error("Failed to load ventures");
        return;
      }
      
      setVentures(venturesData || []);
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, navigate]);

  // Real-time price updates
  useStartupPriceUpdates(gameId!, (updatedVenture) => {
    setVentures(prev => 
      prev.map(venture => 
        venture.id === updatedVenture.id 
          ? { ...venture, last_vwap_price: updatedVenture.last_vwap_price }
          : venture
      )
    );
    
    // Show price update animation
    setPriceUpdates(prev => ({ ...prev, [updatedVenture.id]: true }));
    setTimeout(() => {
      setPriceUpdates(prev => ({ ...prev, [updatedVenture.id]: false }));
    }, 2000);
    
    toast.success(`${updatedVenture.name} price updated to ${formatPrice(updatedVenture.last_vwap_price)}`);
  });

  // Real-time trade updates
  useTradeUpdates(gameId!, (newTrade) => {
    // Update shares remaining for the venture
    setVentures(prev => 
      prev.map(venture => 
        venture.id === newTrade.venture_id
          ? { 
              ...venture, 
              primary_shares_remaining: newTrade.market_type === 'primary' 
                ? Math.max(0, venture.primary_shares_remaining - newTrade.qty)
                : venture.primary_shares_remaining
            }
          : venture
      )
    );
  });

  const formatPrice = (price: number | null) => {
    if (!price) return "No trades yet";
    return `$${price.toFixed(2)}`;
  };

  const getSharesProgress = (venture: Venture) => {
    const sold = venture.total_shares - venture.primary_shares_remaining;
    return (sold / venture.total_shares) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Discover Ventures</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Browse and invest in promising ventures
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/games/${gameId}/me`)}
            >
              My Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/games/${gameId}/leaderboard`)}
            >
              Leaderboard
            </Button>
            {participant?.role === 'founder' && (
              <Button 
                variant="outline"
                onClick={() => navigate(`/games/${gameId}/founder-onboarding`)}
              >
                <Building className="h-4 w-4 mr-2" />
                Manage Venture
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {ventures.map((venture) => (
            <Card key={venture.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  {venture.logo_url ? (
                    <img 
                      src={venture.logo_url} 
                      alt={venture.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {venture.name}
                      {priceUpdates[venture.id] && (
                        <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                      )}
                    </CardTitle>
                    <CardDescription className={`text-sm transition-colors ${
                      priceUpdates[venture.id] ? 'text-green-600 font-semibold' : ''
                    }`}>
                      {formatPrice(venture.last_vwap_price)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {venture.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {venture.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Shares Sold</span>
                    <span>{venture.total_shares - venture.primary_shares_remaining}/{venture.total_shares}</span>
                  </div>
                  <Progress value={getSharesProgress(venture)} className="h-2" />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    className="flex-1"
                    onClick={() => setSelectedVenture(venture)}
                    disabled={venture.primary_shares_remaining === 0}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Invest
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/games/${gameId}/venture/${venture.slug}`)}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {ventures.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No ventures yet</h3>
            <p className="text-muted-foreground">
              Ventures will appear here once they're added to the game
            </p>
          </div>
        )}
      </div>

      {selectedVenture && participant && (
        <InvestModal
          venture={selectedVenture}
          participant={participant}
          gameId={gameId!}
          onClose={() => setSelectedVenture(null)}
          onSuccess={() => {
            setSelectedVenture(null);
            // Refresh data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}