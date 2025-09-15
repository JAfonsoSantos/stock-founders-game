import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, DollarSign, TrendingUp, Users, Building, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogoUpload } from "@/components/LogoUpload";

interface PendingOrder {
  id: string;
  qty: number;
  price_per_share: number;
  created_at: string;
  buyer_participant: {
    id: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface VentureData {
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
  role: 'owner' | 'member';
  can_manage: boolean;
  participant: {
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

export default function VentureAdmin() {
  const { gameId, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [venture, setVenture] = useState<VentureData | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isFounder, setIsFounder] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberRole, setAddMemberRole] = useState<'owner' | 'member'>('member');
  const [addMemberCanManage, setAddMemberCanManage] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const addTeamMember = async () => {
    if (!venture || !addMemberEmail.trim()) return;

    setAddingMember(true);
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', addMemberEmail.trim())
        .single();

      if (userError || !userData) {
        toast.error("User not found with that email");
        return;
      }

      // Check if user is a participant in this game
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', userData.id)
        .single();

      if (participantError || !participantData) {
        toast.error("User is not a participant in this game");
        return;
      }

      // Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('founder_members')
        .select('id')
        .eq('venture_id', venture.id)
        .eq('participant_id', participantData.id)
        .single();

      if (existingMember) {
        toast.error("User is already a team member");
        return;
      }

      // Add as team member
      const { error: insertError } = await supabase
        .from('founder_members')
        .insert({
          venture_id: venture.id,
          participant_id: participantData.id,
          role: addMemberRole,
          can_manage: addMemberCanManage
        });

      if (insertError) throw insertError;

      toast.success("Team member added successfully!");
      
      // Refresh team members
      const { data: teamData } = await supabase
        .from('founder_members')
        .select(`
          *,
          participant:participants!participant_id (
            user:users!user_id (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('venture_id', venture.id);

      setTeamMembers(teamData || []);
      setAddMemberEmail("");
      setAddMemberRole('member');
      setAddMemberCanManage(false);
      setShowAddDialog(false);

    } catch (error: any) {
      toast.error(`Failed to add team member: ${error.message}`);
    } finally {
      setAddingMember(false);
    }
  };

  const updateTeamMember = async (memberId: string, updates: { role?: 'owner' | 'member'; can_manage?: boolean }) => {
    setUpdatingMember(memberId);
    try {
      const { error } = await supabase
        .from('founder_members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;

      toast.success("Team member updated successfully!");
      
      // Update local state
      setTeamMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, ...updates } : member
      ));

    } catch (error: any) {
      toast.error(`Failed to update team member: ${error.message}`);
    } finally {
      setUpdatingMember(null);
    }
  };

  const removeTeamMember = async (memberId: string, memberName: string) => {
    setRemovingMember(memberId);
    try {
      const { error } = await supabase
        .from('founder_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success(`${memberName} removed from team`);
      
      // Update local state
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));

    } catch (error: any) {
      toast.error(`Failed to remove team member: ${error.message}`);
    } finally {
      setRemovingMember(null);
    }
  };

  useEffect(() => {
    if (!user || !gameId || !slug) return;

    const fetchData = async () => {
      try {
        // Get venture data
        const { data: ventureData, error: ventureError } = await supabase
          .from('ventures')
          .select('*')
          .eq('game_id', gameId)
          .eq('slug', slug)
          .single();

        if (ventureError) throw ventureError;

        if (!ventureData) {
          navigate('/');
          return;
        }

        setVenture(ventureData);

        // Check if user is a founder
        const { data: participantData } = await supabase
          .from('participants')
          .select('id')
          .eq('game_id', gameId)
          .eq('user_id', user.id)
          .single();

        if (!participantData) {
          navigate(`/games/${gameId}/discover`);
          return;
        }

        const { data: founderData } = await supabase
          .from('founder_members')
          .select('*')
          .eq('venture_id', ventureData.id)
          .eq('participant_id', participantData.id)
          .single();

        if (!founderData) {
          navigate(`/games/${gameId}/venture/${slug}`);
          return;
        }

        setIsFounder(true);

        // Fetch pending orders
        const { data: ordersData } = await supabase
          .from('orders_primary')
          .select(`
            *,
            buyer_participant:participants!buyer_participant_id (
              id,
              user:users!user_id (
                id,
                first_name,
                last_name,
                email
              )
            )
          `)
          .eq('venture_id', ventureData.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        setPendingOrders(ordersData || []);

        // Fetch team members
        const { data: teamData } = await supabase
          .from('founder_members')
          .select(`
            *,
            participant:participants!participant_id (
              user:users!user_id (
                first_name,
                last_name,
                email
              )
            )
          `)
          .eq('venture_id', ventureData.id);

        setTeamMembers(teamData || []);

      } catch (error: any) {
        console.error('Error loading venture data:', error);
        toast.error('Failed to load venture data');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, gameId, slug, navigate]);

  const handleOrderDecision = async (orderId: string, decision: 'accepted' | 'rejected') => {
    setProcessingOrder(orderId);
    
    try {
      const { data, error } = await supabase.rpc('decide_primary_order', {
        p_order_id: orderId,
        p_decision: decision
      });

      if (error) throw error;

      toast.success(`Order ${decision} successfully!`);
      
      // Refresh pending orders and venture data
      const { data: ordersData } = await supabase
        .from('orders_primary')
        .select(`
          *,
          buyer_participant:participants!buyer_participant_id (
            id,
            user:users!user_id (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('venture_id', venture?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingOrders(ordersData || []);

      // Refresh venture data to get updated shares remaining
      const { data: ventureData } = await supabase
        .from('ventures')
        .select('*')
        .eq('id', venture?.id)
        .single();

      if (ventureData) {
        setVenture(ventureData);
      }

    } catch (error: any) {
      toast.error(`Failed to ${decision.toLowerCase()} order: ${error.message}`);
    } finally {
      setProcessingOrder(null);
    }
  };

  const updateVentureProfile = async (updates: Partial<VentureData>) => {
    if (!venture) return;

    try {
      const { error } = await supabase
        .from('ventures')
        .update(updates)
        .eq('id', venture.id);

      if (error) throw error;

      setVenture({ ...venture, ...updates });
      toast.success('Venture profile updated successfully!');
    } catch (error: any) {
      toast.error(`Failed to update venture profile: ${error.message}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!venture || !isFounder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Venture not found</h2>
          <p className="text-muted-foreground mb-4">The venture you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate(`/games/${gameId}/discover`)}>
            Back to Game
          </Button>
        </div>
      </div>
    );
  }

  const sharesSold = venture.total_shares - venture.primary_shares_remaining;
  const marketCap = venture.last_vwap_price ? venture.last_vwap_price * venture.total_shares : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/games/${gameId}/venture/${slug}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Venture
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {venture.logo_url ? (
              <img 
                src={venture.logo_url} 
                alt={venture.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{venture.name}</h1>
              <p className="text-muted-foreground">Venture Administration</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {venture.last_vwap_price ? formatCurrency(venture.last_vwap_price) : 'No trades yet'}
              </div>
            </CardContent>
          </Card>

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
              <p className="text-xs text-muted-foreground">
                {Math.round((sharesSold / venture.total_shares) * 100)}% sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Pending Orders</TabsTrigger>
            <TabsTrigger value="profile">Venture Profile</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Investment Orders</CardTitle>
                <CardDescription>
                  Review and approve or reject investment orders from participants
                </CardDescription>
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
                              <TableCell>
                                {new Date(order.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleOrderDecision(order.id, 'accepted')}
                                    disabled={processingOrder === order.id}
                                  >
                                    {processingOrder === order.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Accept'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOrderDecision(order.id, 'rejected')}
                                    disabled={processingOrder === order.id}
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

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Venture Profile</CardTitle>
                <CardDescription>
                  Update your venture's public information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venture Name</Label>
                  <Input
                    id="name"
                    value={venture.name}
                    onChange={(e) => updateVentureProfile({ name: e.target.value })}
                    placeholder="Enter venture name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={venture.description || ''}
                    onChange={(e) => updateVentureProfile({ description: e.target.value })}
                    placeholder="Describe your venture..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={venture.website || ''}
                      onChange={(e) => updateVentureProfile({ website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={venture.linkedin || ''}
                      onChange={(e) => updateVentureProfile({ linkedin: e.target.value })}
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <LogoUpload
                    currentLogoUrl={venture.logo_url}
                    startupSlug={venture.slug}
                    onLogoUploaded={(url) => updateVentureProfile({ logo_url: url })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage your venture's team members and their permissions
                    </CardDescription>
                  </div>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                          Add a participant from this game to your venture team
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="member-email">Email</Label>
                          <Input
                            id="member-email"
                            type="email"
                            value={addMemberEmail}
                            onChange={(e) => setAddMemberEmail(e.target.value)}
                            placeholder="Enter participant email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="member-role">Role</Label>
                          <Select value={addMemberRole} onValueChange={(value: 'owner' | 'member') => setAddMemberRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="can-manage"
                            checked={addMemberCanManage}
                            onChange={(e) => setAddMemberCanManage(e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="can-manage">Can manage venture</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddDialog(false)}
                          disabled={addingMember}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={addTeamMember}
                          disabled={addingMember || !addMemberEmail.trim()}
                        >
                          {addingMember ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Member'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No team members yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Add participants from this game to your venture team</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Can Manage</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers.map((member) => {
                          const user = member.participant?.user;
                          const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : 'Unknown';
                          
                          return (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{fullName}</div>
                                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={member.role} 
                                  onValueChange={(value: 'owner' | 'member') => 
                                    updateTeamMember(member.id, { role: value })
                                  }
                                  disabled={updatingMember === member.id}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={member.can_manage}
                                  onChange={(e) => 
                                    updateTeamMember(member.id, { can_manage: e.target.checked })
                                  }
                                  disabled={updatingMember === member.id}
                                  className="rounded"
                                />
                              </TableCell>
                              <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      disabled={removingMember === member.id || teamMembers.length <= 1}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      {removingMember === member.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove {fullName} from the team? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => removeTeamMember(member.id, fullName)}
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
        </Tabs>
      </div>
    </div>
  );
}