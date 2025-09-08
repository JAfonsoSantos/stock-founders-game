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

interface Startup {
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
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
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
      
      // Fetch startups
      const { data: startupsData, error } = await supabase
        .from("startups")
        .select("*")
        .eq("game_id", gameId)
        .order("name");
      
      if (error) {
        toast.error("Failed to load startups");
        return;
      }
      
      setStartups(startupsData || []);
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, navigate]);

  // Real-time price updates
  useStartupPriceUpdates(gameId!, (updatedStartup) => {
    setStartups(prev => 
      prev.map(startup => 
        startup.id === updatedStartup.id 
          ? { ...startup, last_vwap_price: updatedStartup.last_vwap_price }
          : startup
      )
    );
    
    // Show price update animation
    setPriceUpdates(prev => ({ ...prev, [updatedStartup.id]: true }));
    setTimeout(() => {
      setPriceUpdates(prev => ({ ...prev, [updatedStartup.id]: false }));
    }, 2000);
    
    toast.success(`${updatedStartup.name} price updated to ${formatPrice(updatedStartup.last_vwap_price)}`);
  });

  // Real-time trade updates
  useTradeUpdates(gameId!, (newTrade) => {
    // Update shares remaining for the startup
    setStartups(prev => 
      prev.map(startup => 
        startup.id === newTrade.startup_id
          ? { 
              ...startup, 
              primary_shares_remaining: newTrade.market_type === 'primary' 
                ? Math.max(0, startup.primary_shares_remaining - newTrade.qty)
                : startup.primary_shares_remaining
            }
          : startup
      )
    );
  });

  const formatPrice = (price: number | null) => {
    if (!price) return "No trades yet";
    return `$${price.toFixed(2)}`;
  };

  const getSharesProgress = (startup: Startup) => {
    const sold = startup.total_shares - startup.primary_shares_remaining;
    return (sold / startup.total_shares) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Discover Startups</h1>
          <p className="text-muted-foreground mt-2">
            Browse and invest in promising startups
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map((startup) => (
            <Card key={startup.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  {startup.logo_url ? (
                    <img 
                      src={startup.logo_url} 
                      alt={startup.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {startup.name}
                      {priceUpdates[startup.id] && (
                        <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                      )}
                    </CardTitle>
                    <CardDescription className={`text-sm transition-colors ${
                      priceUpdates[startup.id] ? 'text-green-600 font-semibold' : ''
                    }`}>
                      {formatPrice(startup.last_vwap_price)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {startup.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {startup.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Shares Sold</span>
                    <span>{startup.total_shares - startup.primary_shares_remaining}/{startup.total_shares}</span>
                  </div>
                  <Progress value={getSharesProgress(startup)} className="h-2" />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    className="flex-1"
                    onClick={() => setSelectedStartup(startup)}
                    disabled={startup.primary_shares_remaining === 0}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Invest
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/games/${gameId}/startup/${startup.slug}`)}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {startups.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No startups yet</h3>
            <p className="text-muted-foreground">
              Startups will appear here once they're added to the game
            </p>
          </div>
        )}
      </div>

      {selectedStartup && participant && (
        <InvestModal
          startup={selectedStartup}
          participant={participant}
          gameId={gameId!}
          onClose={() => setSelectedStartup(null)}
          onSuccess={() => {
            setSelectedStartup(null);
            // Refresh data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}