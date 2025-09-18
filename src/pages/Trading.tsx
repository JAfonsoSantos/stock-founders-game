import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, TrendingUp, TrendingDown, DollarSign, Building2, Loader2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { toast } from 'sonner';
import { SecondaryTradeModal } from '@/components/SecondaryTradeModal';

interface Position {
  id: string;
  venture_id: string;
  qty_total: number;
  avg_cost: number;
  ventures: {
    id: string;
    name: string;
    logo_url: string | null;
    last_vwap_price: number | null;
  };
}

interface Venture {
  id: string;
  name: string;
  logo_url: string | null;
  last_vwap_price: number | null;
  primary_shares_remaining: number;
  total_shares: number;
}

interface TradeRequest {
  id: string;
  type: string;
  status: string;
  payload: any;
  created_at: string;
  from_participant: {
    users: {
      first_name: string;
      last_name: string;
    };
  } | null;
}

export default function Trading() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  const navigate = useNavigate();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVenture, setSelectedVenture] = useState<Venture | null>(null);

  useEffect(() => {
    if (gameId && user) {
      loadData();
    }
  }, [gameId, user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load participant
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', user?.id)
        .single();

      if (participantError) throw participantError;
      setParticipant(participantData);

      // Load positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          ventures:venture_id (
            id,
            name,
            logo_url,
            last_vwap_price
          )
        `)
        .eq('participant_id', participantData.id)
        .gt('qty_total', 0);

      if (positionsError) throw positionsError;
      setPositions(positionsData || []);

      // Load all ventures in the game
      const { data: venturesData, error: venturesError } = await supabase
        .from('ventures')
        .select('id, name, logo_url, last_vwap_price, primary_shares_remaining, total_shares')
        .eq('game_id', gameId);

      if (venturesError) throw venturesError;
      setVentures(venturesData || []);

      // Load trade requests (notifications for secondary trades)
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          status,
          payload,
          created_at,
          from_participant_id
        `)
        .eq('to_participant_id', participantData.id)
        .eq('type', 'trade_request')
        .eq('status', 'unread')
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;
      
      // Get participant info for trade requests
      const notificationsWithUsers = await Promise.all(
        (notificationsData || []).map(async (notification) => {
          if (notification.from_participant_id) {
            const { data: fromParticipant } = await supabase
              .from('participants')
              .select(`
                users:user_id (
                  first_name,
                  last_name
                )
              `)
              .eq('id', notification.from_participant_id)
              .single();
            
            return {
              ...notification,
              from_participant: fromParticipant
            };
          }
          return {
            ...notification,
            from_participant: null
          };
        })
      );
      
      setTradeRequests(notificationsWithUsers);

    } catch (error: any) {
      console.error('Error loading trading data:', error);
      toast.error('Failed to load trading data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async (requestId: string, payload: any) => {
    try {
      const { data, error } = await supabase.rpc('accept_secondary_trade', {
        p_notification_id: requestId
      });

      if (error) throw error;

      const result = data as { error?: string; success?: boolean };
      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success('Trade accepted successfully');
      loadData(); // Reload data
    } catch (error: any) {
      console.error('Error accepting trade:', error);
      toast.error(`Failed to accept trade: ${error.message}`);
    }
  };

  const handleRejectTrade = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Trade request rejected');
      loadData(); // Reload data
    } catch (error: any) {
      console.error('Error rejecting trade:', error);
      toast.error('Failed to reject trade');
    }
  };

  const calculatePortfolioValue = () => {
    const positionsValue = positions.reduce((sum, position) => {
      const currentPrice = position.ventures.last_vwap_price || position.avg_cost;
      return sum + (position.qty_total * currentPrice);
    }, 0);
    
    return (participant?.current_cash || 0) + positionsValue;
  };

  const calculateTotalPnL = () => {
    const positionsValue = positions.reduce((sum, position) => {
      const currentPrice = position.ventures.last_vwap_price || position.avg_cost;
      const investedValue = position.qty_total * position.avg_cost;
      const currentValue = position.qty_total * currentPrice;
      return sum + (currentValue - investedValue);
    }, 0);
    
    return positionsValue;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const portfolioValue = calculatePortfolioValue();
  const totalPnL = calculateTotalPnL();
  const pnlPercentage = participant?.initial_budget ? ((portfolioValue - participant.initial_budget) / participant.initial_budget) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Trading Center</h1>
        </div>
        <Button onClick={() => navigate(`/games/${gameId}/me`)} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(participant?.current_cash || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-1 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatCurrency(totalPnL)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positions">My Positions</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="requests">
            Trade Requests
            {tradeRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {tradeRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          {positions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 opacity-50 mb-4" />
                  <p>You don't have any positions yet.</p>
                  <p className="text-sm">Start investing to see your positions here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => {
                const currentPrice = position.ventures.last_vwap_price || position.avg_cost;
                const investedValue = position.qty_total * position.avg_cost;
                const currentValue = position.qty_total * currentPrice;
                const pnl = currentValue - investedValue;
                const pnlPercentage = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

                return (
                  <Card key={position.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {position.ventures.logo_url ? (
                            <img src={position.ventures.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{position.ventures.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {position.qty_total} shares @ {formatCurrency(position.avg_cost)} avg
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(currentValue)}</div>
                          <div className={`text-sm flex items-center gap-1 ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnl >= 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="space-y-4">
            {ventures.map((venture) => (
              <Card key={venture.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {venture.logo_url ? (
                        <img src={venture.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{venture.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Price: {venture.last_vwap_price ? formatCurrency(venture.last_vwap_price) : 'No trades yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/games/${gameId}/ventures/${venture.id}`)}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => setSelectedVenture(venture)}
                        disabled={!venture.last_vwap_price}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Make Offer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {tradeRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <ArrowLeftRight className="mx-auto h-12 w-12 opacity-50 mb-4" />
                  <p>No trade requests at the moment.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tradeRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Secondary Trade Request</h3>
                        <p className="text-sm text-muted-foreground">
                          From: {request.from_participant?.users?.first_name} {request.from_participant?.users?.last_name}
                        </p>
                        <p className="text-sm">
                          Wants to buy {request.payload?.qty} shares at {formatCurrency(request.payload?.price_per_share)} each
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(request.payload?.qty * request.payload?.price_per_share)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRejectTrade(request.id)}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleAcceptTrade(request.id, request.payload)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedVenture && (
        <SecondaryTradeModal
          isOpen={!!selectedVenture}
          onClose={() => setSelectedVenture(null)}
          gameId={gameId!}
          startupId={selectedVenture.id}
          startupName={selectedVenture.name}
          maxQuantity={100} // This should be calculated based on available shares
        />
      )}
    </div>
  );
}