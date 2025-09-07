import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle, XCircle, Users, Settings, TrendingUp, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LogoUpload } from "@/components/LogoUpload";

interface PendingOrder {
  id: string;
  qty: number;
  price_per_share: number;
  auto_accept_min_price?: number;
  created_at: string;
  buyer_participant: {
    user_id: string;
    users: {
      first_name: string;
      last_name: string;
    };
  };
}

interface StartupData {
  id: string;
  slug: string;
  name: string;
  description?: string;
  website?: string;
  linkedin?: string;
  logo_url?: string;
  total_shares: number;
  primary_shares_remaining: number;
  last_vwap_price?: number;
  game_id: string;
}

interface TeamMember {
  id: string;
  role: string;
  can_manage: boolean;
  participant: {
    user_id: string;
    users: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function StartupAdmin() {
  const { gameId, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [startup, setStartup] = useState<StartupData | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [autoAcceptPrice, setAutoAcceptPrice] = useState<number>(0);

  useEffect(() => {
    if (user && gameId && slug) {
      fetchData();
    }
  }, [user, gameId, slug]);

  const fetchData = async () => {
    try {
      // Get startup data
      const { data: startupData, error: startupError } = await supabase
        .from('startups')
        .select('*')
        .eq('game_id', gameId)
        .eq('slug', slug)
        .single();

      if (startupError) throw startupError;

      // Check if user is a founder of this startup
      const { data: founderData, error: founderError } = await supabase
        .from('founder_members')
        .select(`
          *,
          participant:participants!inner(
            user_id,
            users(first_name, last_name)
          )
        `)
        .eq('startup_id', startupData.id)
        .eq('participant.user_id', user.id);

      if (founderError) throw founderError;

      if (!founderData || founderData.length === 0) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para gerenciar esta startup",
          variant: "destructive"
        });
        navigate(`/games/${gameId}/startup/${slug}`);
        return;
      }

      setStartup(startupData);

      // Get pending orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders_primary')
        .select(`
          *,
          buyer_participant:participants!buyer_participant_id(
            user_id,
            users(first_name, last_name)
          )
        `)
        .eq('startup_id', startupData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setPendingOrders(ordersData || []);

      // Get team members
      const { data: teamData, error: teamError } = await supabase
        .from('founder_members')
        .select(`
          *,
          participant:participants!inner(
            user_id,
            users(first_name, last_name)
          )
        `)
        .eq('startup_id', startupData.id);

      if (teamError) throw teamError;
      setTeamMembers(teamData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da startup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderDecision = async (orderId: string, decision: 'accepted' | 'rejected') => {
    setProcessingOrder(orderId);
    try {
      const { data, error } = await supabase.rpc('decide_primary_order', {
        p_order_id: orderId,
        p_decision: decision
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Pedido ${decision === 'accepted' ? 'aceito' : 'rejeitado'} com sucesso`,
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pedido",
        variant: "destructive"
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const updateStartupProfile = async (updates: Partial<StartupData>) => {
    try {
      const { error } = await supabase
        .from('startups')
        .update(updates)
        .eq('id', startup?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil da startup atualizado",
      });

      setStartup(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating startup:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p>Startup não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const marketCap = startup.last_vwap_price ? startup.last_vwap_price * startup.total_shares : 0;
  const sharesSold = startup.total_shares - startup.primary_shares_remaining;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/games/${gameId}/startup/${slug}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Perfil
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{startup.name} - Admin</h1>
          <p className="text-muted-foreground">Gerencie sua startup</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Preço Atual</p>
                <p className="text-2xl font-bold">
                  {startup.last_vwap_price ? `$${startup.last_vwap_price.toFixed(2)}` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium">Market Cap</p>
              <p className="text-2xl font-bold">${marketCap.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium">Ações Vendidas</p>
              <p className="text-2xl font-bold">{sharesSold}/{startup.total_shares}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium">Pedidos Pendentes</p>
              <p className="text-2xl font-bold">{pendingOrders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Pedidos Pendentes</TabsTrigger>
          <TabsTrigger value="profile">Perfil da Startup</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Investimento</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pedido pendente
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investidor</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preço/Ação</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {order.buyer_participant.users.first_name} {order.buyer_participant.users.last_name}
                        </TableCell>
                        <TableCell>{order.qty}</TableCell>
                        <TableCell>${order.price_per_share.toFixed(2)}</TableCell>
                        <TableCell>${(order.qty * order.price_per_share).toLocaleString()}</TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOrderDecision(order.id, 'accepted')}
                              disabled={processingOrder === order.id}
                            >
                              {processingOrder === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOrderDecision(order.id, 'rejected')}
                              disabled={processingOrder === order.id}
                            >
                              <XCircle className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Editar Perfil da Startup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={startup.name}
                  onChange={(e) => setStartup(prev => prev ? { ...prev, name: e.target.value } : null)}
                  onBlur={() => updateStartupProfile({ name: startup.name })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={startup.description || ''}
                  onChange={(e) => setStartup(prev => prev ? { ...prev, description: e.target.value } : null)}
                  onBlur={() => updateStartupProfile({ description: startup.description })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={startup.website || ''}
                    onChange={(e) => setStartup(prev => prev ? { ...prev, website: e.target.value } : null)}
                    onBlur={() => updateStartupProfile({ website: startup.website })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={startup.linkedin || ''}
                    onChange={(e) => setStartup(prev => prev ? { ...prev, linkedin: e.target.value } : null)}
                    onBlur={() => updateStartupProfile({ linkedin: startup.linkedin })}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo da Startup</Label>
                <LogoUpload
                  startupSlug={startup.slug}
                  currentLogoUrl={startup.logo_url}
                  onLogoUploaded={(url) => updateStartupProfile({ logo_url: url })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipe da Startup
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum membro da equipe encontrado
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Pode Gerenciar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {member.participant.users.first_name} {member.participant.users.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                            {member.role === 'owner' ? 'Fundador' : 'Membro'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.can_manage ? (
                            <Badge variant="default">Sim</Badge>
                          ) : (
                            <Badge variant="secondary">Não</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}