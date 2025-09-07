import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Loader2, Building, TrendingUp, ExternalLink, Globe, Linkedin, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import InvestModal from "@/components/InvestModal";

export default function StartupProfile() {
  const { gameId, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startup, setStartup] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFounder, setIsFounder] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !gameId || !slug) return;
    
    const fetchData = async () => {
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
      
      // Get startup
      const { data: startupData, error } = await supabase
        .from("startups")
        .select("*")
        .eq("game_id", gameId)
        .eq("slug", slug)
        .single();
      
      if (error || !startupData) {
        toast.error("Startup not found");
        navigate(`/games/${gameId}/discover`);
        return;
      }
      
      setStartup(startupData);
      
      // Check if user is a founder
      const { data: founderData } = await supabase
        .from("founder_members")
        .select("*")
        .eq("startup_id", startupData.id)
        .eq("participant_id", participantData.id)
        .single();
      
      setIsFounder(!!founderData);
      
      // Get pending orders if founder
      if (founderData) {
        const { data: ordersData } = await supabase
          .from("orders_primary")
          .select(`
            *,
            participants!orders_primary_buyer_participant_id_fkey (
              users (
                first_name,
                last_name
              )
            )
          `)
          .eq("startup_id", startupData.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        
        setOrders(ordersData || []);
      }
      
      // Get recent trades
      const { data: tradesData } = await supabase
        .from("trades")
        .select("*")
        .eq("startup_id", startupData.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      setTrades(tradesData || []);
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, slug, navigate]);

  const handleOrderDecision = async (orderId: string, decision: 'accepted' | 'rejected') => {
    setActionLoading(orderId);
    
    try {
      const { data, error } = await supabase.rpc('decide_primary_order', {
        p_order_id: orderId,
        p_decision: decision
      });

      if (error) {
        toast.error(error.message || `Failed to ${decision} order`);
      } else {
        toast.success(`Order ${decision} successfully`);
        // Refresh orders
        const { data: ordersData } = await supabase
          .from("orders_primary")
          .select(`
            *,
            participants!orders_primary_buyer_participant_id_fkey (
              users (
                first_name,
                last_name
              )
            )
          `)
          .eq("startup_id", startup.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        
        setOrders(ordersData || []);
        
        // Refresh startup data
        const { data: startupData } = await supabase
          .from("startups")
          .select("*")
          .eq("id", startup.id)
          .single();
        
        if (startupData) {
          setStartup(startupData);
        }
      }
    } catch (error) {
      toast.error(`Failed to ${decision} order`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getSharesProgress = () => {
    if (!startup) return 0;
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {startup.logo_url ? (
                <img 
                  src={startup.logo_url} 
                  alt={startup.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Building className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{startup.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  {startup.last_vwap_price && (
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {formatCurrency(startup.last_vwap_price)} per share
                    </Badge>
                  )}
                  {isFounder && (
                    <Badge variant="outline">Founder</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => navigate(`/games/${gameId}/discover`)}>
                Back to Discover
              </Button>
              {!isFounder && startup.primary_shares_remaining > 0 && (
                <Button onClick={() => setShowInvestModal(true)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Invest
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {startup.last_vwap_price 
                  ? formatCurrency(startup.last_vwap_price * startup.total_shares)
                  : "No trades yet"
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Shares Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {startup.total_shares - startup.primary_shares_remaining}/{startup.total_shares}
              </div>
              <Progress value={getSharesProgress()} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Available Shares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{startup.primary_shares_remaining}</div>
            </CardContent>
          </Card>
        </div>

        {/* Description and Links */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {startup.description && (
              <p className="text-muted-foreground">{startup.description}</p>
            )}
            
            <div className="flex space-x-4">
              {startup.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={startup.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              )}
              {startup.linkedin && (
                <Button variant="outline" size="sm" asChild>
                  <a href={startup.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="trades" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trades">Recent Trades</TabsTrigger>
            {isFounder && (
              <TabsTrigger value="orders">
                Pending Orders ({orders.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>Recent trading activity for this startup</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          {new Date(trade.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trade.market_type === 'primary' ? 'default' : 'secondary'}>
                            {trade.market_type === 'primary' ? 'Primary' : 'Secondary'}
                          </Badge>
                        </TableCell>
                        <TableCell>{trade.qty}</TableCell>
                        <TableCell>{formatCurrency(trade.price_per_share)}</TableCell>
                        <TableCell>{formatCurrency(trade.qty * trade.price_per_share)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {trades.length === 0 && (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
                    <p className="text-muted-foreground">
                      Trading activity will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isFounder && (
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Investment Orders</CardTitle>
                  <CardDescription>
                    Accept or reject investment proposals from other participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Investor</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead>Price per Share</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            {order.participants?.users?.first_name} {order.participants?.users?.last_name}
                          </TableCell>
                          <TableCell>{order.qty}</TableCell>
                          <TableCell>{formatCurrency(order.price_per_share)}</TableCell>
                          <TableCell>{formatCurrency(order.qty * order.price_per_share)}</TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleOrderDecision(order.id, 'accepted')}
                                disabled={actionLoading === order.id}
                              >
                                {actionLoading === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOrderDecision(order.id, 'rejected')}
                                disabled={actionLoading === order.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {orders.length === 0 && (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No pending orders</h3>
                      <p className="text-muted-foreground">
                        Investment orders will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {showInvestModal && participant && startup && (
        <InvestModal
          startup={startup}
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