import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Building, ExternalLink, DollarSign, TrendingUp, Users, Settings } from "lucide-react";
import { toast } from "sonner";
import InvestModal from "@/components/InvestModal";

export default function VentureProfile() {
  const { gameId, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [venture, setVenture] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [isFounder, setIsFounder] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);

  useEffect(() => {
    if (!user || !gameId || !slug) return;

    const fetchData = async () => {
      try {
        // Get participant
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
        
        // Get venture
        const { data: ventureData, error } = await supabase
          .from("ventures")
          .select("*")
          .eq("game_id", gameId)
          .eq("slug", slug)
          .single();

        if (error) throw error;
        
        if (!ventureData) {
          navigate('/');
          return;
        }
        
        setVenture(ventureData);
        
        // Check if current user is a founder of this venture
        const { data: founderData } = await supabase
          .from("founder_members")
          .select("*")
          .eq("venture_id", ventureData.id)
          .eq("participant_id", participantData.id)
          .single();

        setIsFounder(!!founderData);

        // Get pending orders for this venture (if user is founder)
        if (participantData && founderData) {
          const { data: ordersData } = await supabase
            .from("orders_primary")
            .select(`
              *,
              buyer_participant:participants!buyer_participant_id (
                user:users!user_id (
                  first_name,
                  last_name,
                  email
                )
              )
            `)
            .eq("venture_id", ventureData.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

          setPendingOrders(ordersData || []);
        }

        // Get recent trades for this venture
        const { data: tradesData } = await supabase
          .from("trades")
          .select(`
            *,
            buyer_participant:participants!buyer_participant_id (
              user:users!user_id (
                first_name,
                last_name
              )
            ),
            seller_participant:participants!seller_participant_id (
              user:users!user_id (
                first_name,
                last_name
              )
            )
          `)
          .eq("venture_id", ventureData.id)
          .order("created_at", { ascending: false })
          .limit(10);

        setRecentTrades(tradesData || []);

      } catch (error: any) {
        console.error('Error loading venture:', error);
        toast.error('Failed to load venture');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, gameId, slug, navigate]);

  const handleOrderDecision = async (orderId: string, decision: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase.rpc('decide_primary_order', {
        p_order_id: orderId,
        p_decision: decision
      });

      if (error) throw error;

      toast.success(`Order ${decision} successfully!`);
      
      // Refresh orders and venture data
      const ordersPromise = supabase
        .from("orders_primary")
        .select(`
          *,
          buyer_participant:participants!buyer_participant_id (
            user:users!user_id (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq("venture_id", venture.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const venturePromise = supabase
        .from("ventures")
        .select("*")
        .eq("id", venture.id)
        .single();

      const [ordersResult, ventureResult] = await Promise.all([ordersPromise, venturePromise]);
      
      setPendingOrders(ordersResult.data || []);
      if (ventureResult.data) {
        setVenture(ventureResult.data);
      }

    } catch (error: any) {
      toast.error(`Failed to ${decision.toLowerCase()} order: ${error.message}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSharesProgress = (venture: any) => {
    const sold = venture.total_shares - venture.primary_shares_remaining;
    return Math.round((sold / venture.total_shares) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!venture || !participant) {
    return <div>Venture not found</div>;
  }

  const sharesSold = venture.total_shares - venture.primary_shares_remaining;
  const sharesProgress = getSharesProgress(venture);
  const marketCap = venture.last_vwap_price ? venture.last_vwap_price * venture.total_shares : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/games/${gameId}/discover`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Discover
            </Button>
          </div>
          <div className="flex gap-2">
            {isFounder && (
              <Button variant="outline" onClick={() => navigate(`/games/${gameId}/venture/${slug}/admin`)}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Venture
              </Button>
            )}
            {participant.role !== 'founder' && (
              <Button onClick={() => setShowInvestModal(true)}>
                <DollarSign className="h-4 w-4 mr-2" />
                Invest
              </Button>
            )}
          </div>
        </div>

        {/* Venture Header */}
        <div className="flex items-center gap-6 mb-8">
          {venture.logo_url ? (
            <img 
              src={venture.logo_url} 
              alt={venture.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
              <Building className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{venture.name}</h1>
              {isFounder && <Badge>Founder</Badge>}
            </div>
            <div className="flex items-center gap-4 text-lg">
              <span className="font-semibold">
                Current Price: {venture.last_vwap_price ? formatCurrency(venture.last_vwap_price) : 'No trades yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketCap > 0 ? formatCurrency(marketCap) : '-'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shares Sold</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sharesSold} / {venture.total_shares}</div>
              <p className="text-xs text-muted-foreground">{sharesProgress}% sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Shares</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{venture.primary_shares_remaining}</div>
            </CardContent>
          </Card>
        </div>

        {/* Description and Links */}
        {(venture.description || venture.website || venture.linkedin) && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              {venture.description && (
                <p className="text-muted-foreground mb-4">{venture.description}</p>
              )}
              <div className="flex gap-4">
                {venture.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={venture.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {venture.linkedin && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={venture.linkedin} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="trades">
          <TabsList>
            <TabsTrigger value="trades">Recent Trades</TabsTrigger>
            {isFounder && <TabsTrigger value="orders">Pending Orders ({pendingOrders.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
                <CardDescription>Latest trading activity for this venture</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No trades yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Seller</TableHead>
                          <TableHead>Shares</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTrades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell>{new Date(trade.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={trade.market_type === 'primary' ? 'default' : 'secondary'}>
                                {trade.market_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {trade.buyer_participant?.user ? 
                                `${trade.buyer_participant.user.first_name} ${trade.buyer_participant.user.last_name}` : 
                                'Unknown'
                              }
                            </TableCell>
                            <TableCell>
                              {trade.seller_participant?.user ? 
                                `${trade.seller_participant.user.first_name} ${trade.seller_participant.user.last_name}` : 
                                'Primary Market'
                              }
                            </TableCell>
                            <TableCell>{trade.qty}</TableCell>
                            <TableCell>{formatCurrency(trade.price_per_share)}</TableCell>
                            <TableCell>{formatCurrency(trade.qty * trade.price_per_share)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isFounder && (
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Orders</CardTitle>
                  <CardDescription>Investment orders awaiting your approval</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No pending orders</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Investor</TableHead>
                            <TableHead>Shares</TableHead>
                            <TableHead>Price per Share</TableHead>
                            <TableHead>Total Investment</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingOrders.map((order) => {
                            const user = order.buyer_participant?.user;
                            const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : 'Unknown';
                            const totalInvestment = order.qty * order.price_per_share;
                            
                            return (
                              <TableRow key={order.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{fullName}</div>
                                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{order.qty}</TableCell>
                                <TableCell>{formatCurrency(order.price_per_share)}</TableCell>
                                <TableCell>{formatCurrency(totalInvestment)}</TableCell>
                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleOrderDecision(order.id, 'accepted')}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOrderDecision(order.id, 'rejected')}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {showInvestModal && participant && venture && (
        <InvestModal
          venture={venture}
          participant={participant}
          gameId={gameId!}
          onClose={() => setShowInvestModal(false)}
          onSuccess={() => {
            setShowInvestModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}