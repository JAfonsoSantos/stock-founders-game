import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wallet, TrendingUp, DollarSign, Activity, ArrowUpDown, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SecondaryTradeModal } from "@/components/SecondaryTradeModal";
import { NotificationCenter } from "@/components/NotificationCenter";
import { usePositionUpdates, useStartupPriceUpdates } from "@/hooks/useRealtime";

export default function PlayerDashboard() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [participant, setParticipant] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [gameAllowsSecondary, setGameAllowsSecondary] = useState(false);
  const [portfolioUpdates, setPortfolioUpdates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!user || !gameId) return;
    
    const fetchData = async () => {
      // Fetch game and participant data
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameData) {
        setGameAllowsSecondary(gameData.allow_secondary);
      }
      
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
      
      // Fetch portfolio data
      const { data: portfolioData } = await supabase
        .rpc("get_portfolio_data", { p_game_id: gameId });
      
      // Find the current participant's data
      const currentParticipantPortfolio = portfolioData?.find(
        (p: any) => p.participant_id === participantData.id
      );
      
      if (currentParticipantPortfolio) {
        setParticipant(prev => ({ ...prev, ...currentParticipantPortfolio }));
      }
      
      // Fetch positions
      const { data: positionsData } = await supabase
        .from("positions")
        .select(`
          *,
          startups (
            name,
            slug,
            logo_url,
            last_vwap_price
          )
        `)
        .eq("participant_id", participantData.id)
        .gt("qty_total", 0);
      
      setPositions(positionsData || []);
      
      // Fetch recent trades
      const { data: tradesData } = await supabase
        .from("trades")
        .select(`
          *,
          startups (
            name,
            slug
          )
        `)
        .or(`buyer_participant_id.eq.${participantData.id},seller_participant_id.eq.${participantData.id}`)
        .order("created_at", { ascending: false })
        .limit(20);
      
      setTrades(tradesData || []);
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, navigate]);

  // Real-time startup price updates
  useStartupPriceUpdates(gameId!, (updatedStartup) => {
    // Update positions with new market values
    setPositions(prev => 
      prev.map(position => 
        position.startup_id === updatedStartup.id
          ? {
              ...position,
              startups: {
                ...position.startups,
                last_vwap_price: updatedStartup.last_vwap_price
              }
            }
          : position
      )
    );

    // Show update animation for affected positions
    const affectedPosition = positions.find(p => p.startup_id === updatedStartup.id);
    if (affectedPosition) {
      setPortfolioUpdates(prev => ({ ...prev, [affectedPosition.id]: true }));
      setTimeout(() => {
        setPortfolioUpdates(prev => ({ ...prev, [affectedPosition.id]: false }));
      }, 2000);
    }
  });

  // Real-time position updates
  usePositionUpdates(participant?.id, (positionPayload) => {
    if (positionPayload.eventType === 'UPDATE') {
      setPositions(prev =>
        prev.map(position =>
          position.id === positionPayload.new.id
            ? { ...position, ...positionPayload.new }
            : position
        )
      );
    } else if (positionPayload.eventType === 'INSERT') {
      // Refresh positions when new position is created
      window.location.reload();
    }
  });

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getPositionValue = (position: any) => {
    if (!position.startups?.last_vwap_price) return 0;
    return position.qty_total * position.startups.last_vwap_price;
  };

  const getPositionPnL = (position: any) => {
    const currentValue = getPositionValue(position);
    const cost = position.qty_total * position.avg_cost;
    return currentValue - cost;
  };

  const handleSellClick = (position: any) => {
    setSelectedPosition(position);
    setSellModalOpen(true);
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
          <h1 className="text-3xl font-bold">My Portfolio</h1>
          <p className="text-muted-foreground mt-2">
            Track your investments and performance
          </p>
        </div>

        <div className="space-y-6">
          {/* Notification Center */}
          {participant && (
            <NotificationCenter 
              participantId={participant.id} 
              gameId={gameId!} 
            />
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(participant?.current_cash || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(participant?.portfolio_value || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(participant?.total_value || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {participant?.roi_percentage ? `${participant.roi_percentage.toFixed(2)}%` : "0%"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="positions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="positions">My Positions</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
                <CardDescription>
                  Current positions and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Startup</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Avg Cost</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Market Value</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => {
                      const pnl = getPositionPnL(position);
                      const pnlPercent = position.avg_cost > 0 ? (pnl / (position.qty_total * position.avg_cost)) * 100 : 0;
                      
                      return (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">
                            <Button
                              variant="link"
                              className="p-0 h-auto font-medium flex items-center gap-2"
                              onClick={() => navigate(`/games/${gameId}/startup/${position.startups.slug}`)}
                            >
                              {position.startups.name}
                              {portfolioUpdates[position.id] && (
                                <Zap className="h-3 w-3 text-yellow-500 animate-pulse" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>{position.qty_total}</TableCell>
                          <TableCell>{formatCurrency(position.avg_cost)}</TableCell>
                          <TableCell className={`transition-colors ${
                            portfolioUpdates[position.id] ? 'text-green-600 font-semibold' : ''
                          }`}>
                            {position.startups.last_vwap_price 
                              ? formatCurrency(position.startups.last_vwap_price)
                              : "No trades"
                            }
                          </TableCell>
                          <TableCell className={`transition-colors ${
                            portfolioUpdates[position.id] ? 'text-green-600 font-semibold' : ''
                          }`}>
                            {formatCurrency(getPositionValue(position))}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(pnl)}
                              {pnl !== 0 && (
                                <span className="ml-1 text-xs">
                                  ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {gameAllowsSecondary && position.qty_total > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSellClick(position)}
                              >
                                <ArrowUpDown className="h-3 w-3 mr-1" />
                                Vender
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {positions.length === 0 && (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start investing to see your positions here
                    </p>
                    <Button onClick={() => navigate(`/games/${gameId}/discover`)}>
                      Discover Startups
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>
                  Your recent trading activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Startup</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => {
                      const isBuy = trade.buyer_participant_id === participant.id;
                      
                      return (
                        <TableRow key={trade.id}>
                          <TableCell>
                            {new Date(trade.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {trade.startups?.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isBuy ? "default" : "secondary"}>
                              {isBuy ? "Buy" : "Sell"}
                            </Badge>
                          </TableCell>
                          <TableCell>{trade.qty}</TableCell>
                          <TableCell>{formatCurrency(trade.price_per_share)}</TableCell>
                          <TableCell>
                            {formatCurrency(trade.qty * trade.price_per_share)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {trades.length === 0 && (
                  <div className="text-center py-8">
                    <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
                    <p className="text-muted-foreground">
                      Your trading activity will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

          {/* Secondary Trade Modal */}
          {selectedPosition && (
            <SecondaryTradeModal
              isOpen={sellModalOpen}
              onClose={() => setSellModalOpen(false)}
              gameId={gameId!}
              startupId={selectedPosition.startup_id}
              startupName={selectedPosition.startups?.name}
              maxQuantity={selectedPosition.qty_total}
            />
          )}
        </div>
      </div>
    </div>
  );
}
