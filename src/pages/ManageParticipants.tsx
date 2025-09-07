import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, UserPlus, Mail, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { sendInviteEmail } from "@/lib/email";
import CSVParticipantImport from "@/components/CSVParticipantImport";

export default function ManageParticipants() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [gameRoles, setGameRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "founder" as const,
    budget: 0
  });
  const [addLoading, setAddLoading] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);

  useEffect(() => {
    if (!user || !gameId) return;
    
    const fetchData = async () => {
      // Check if user is game owner
      const { data: gameData, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .eq("owner_user_id", user.id)
        .single();
      
      if (error || !gameData) {
        toast.error("Game not found or access denied");
        navigate("/");
        return;
      }
      
      setGameInfo(gameData);
      
      // Fetch game roles
      const { data: rolesData } = await supabase
        .from("game_roles")
        .select("*")
        .eq("game_id", gameId);
      
      setGameRoles(rolesData || []);
      
      // Set default budget for new participant based on founder role
      const founderRole = rolesData?.find(r => r.role === 'founder');
      if (founderRole) {
        setNewParticipant(prev => ({ ...prev, budget: founderRole.default_budget }));
      }
      
      // Fetch participants
      const { data: participantsData } = await supabase
        .from("participants")
        .select(`
          *,
          users (
            first_name,
            last_name
          )
        `)
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });
      
      setParticipants(participantsData || []);
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, navigate]);

  const handleRoleChange = (role: string) => {
    const roleData = gameRoles.find(r => r.role === role);
    setNewParticipant(prev => ({
      ...prev,
      role: role as any,
      budget: roleData?.default_budget || 0
    }));
  };

  const addParticipant = async () => {
    if (!newParticipant.email || !newParticipant.first_name) {
      toast.error("Email and first name are required");
      return;
    }

    setAddLoading(true);

    try {
      // Use RPC function to add demo participant
      const { data, error } = await supabase.rpc('add_demo_participant', {
        p_game_id: gameId,
        p_email: newParticipant.email,
        p_first_name: newParticipant.first_name,
        p_last_name: newParticipant.last_name,
        p_role: newParticipant.role,
        p_budget: newParticipant.budget
      });

      if (error) {
        toast.error("Failed to add participant: " + error.message);
        return;
      }

      const result = data as any;
      if (result?.error) {
        toast.error("Failed to add participant: " + result.error);
        return;
      }

      // Send invitation email (demo: sends to game owner's email)
      try {
        const testEmail = user?.email || 'test@example.com';
        await sendInviteEmail([testEmail], gameId!, gameInfo.name, gameInfo.locale);
        toast.success(`Participant added! Demo invitation sent to ${testEmail} (would be sent to ${newParticipant.email} in production)`);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        toast.success(`Participant added! (Note: Email invitation failed to send)`);
      }
      
      setShowAddModal(false);
      setNewParticipant({
        email: "",
        first_name: "",
        last_name: "",
        role: "founder",
        budget: gameRoles.find(r => r.role === 'founder')?.default_budget || 0
      });

      // Refresh participants
      const { data: participantsData } = await supabase
        .from("participants")
        .select(`
          *,
          users (
            first_name,
            last_name
          )
        `)
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });
      
      setParticipants(participantsData || []);
    } catch (error) {
      toast.error("Failed to add participant");
    } finally {
      setAddLoading(false);
    }
  };

  const sendInvitesToAll = async () => {
    if (!gameInfo || participants.length === 0) return;

    setSendingInvites(true);
    try {
      // For demo participants, we'll use a test email or the game owner's email
      // In a real app, you'd have actual participant emails stored
      const testEmail = user?.email || 'test@example.com';
      const emails = [testEmail]; // Using owner's email as demo

      await sendInviteEmail(emails, gameId!, gameInfo.name, gameInfo.locale);
      toast.success(`Demo invitation sent to ${testEmail}! (In production, would send to all ${participants.length} participants)`);
    } catch (error) {
      console.error('Failed to send invitations:', error);
      toast.error("Failed to send invitations");
    } finally {
      setSendingInvites(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, "default" | "secondary" | "outline"> = {
      founder: "default",
      angel: "secondary", 
      vc: "outline"
    };
    return <Badge variant={colors[role] || "default"}>{role.toUpperCase()}</Badge>;
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manage Participants</h1>
              <p className="text-muted-foreground mt-2">
                Add and manage participants for {gameInfo?.name}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => navigate(`/games/${gameId}/organizer`)}>
                Back to Dashboard
              </Button>
              
              <div className="flex space-x-2">
                <CSVParticipantImport 
                  gameId={gameId!}
                  gameRoles={gameRoles}
                  onImportComplete={() => {
                    // Refresh participants
                    const refreshData = async () => {
                      const { data: participantsData } = await supabase
                        .from("participants")
                        .select(`
                          *,
                          users (
                            first_name,
                            last_name
                          )
                        `)
                        .eq("game_id", gameId)
                        .order("created_at", { ascending: false });
                      
                      setParticipants(participantsData || []);
                    };
                    refreshData();
                  }}
                />
                
                <Button 
                  onClick={sendInvitesToAll}
                  disabled={sendingInvites || participants.length === 0}
                  variant="outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {sendingInvites ? "Sending..." : "Send Invites"}
                </Button>
                
                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Participant
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Participant</DialogTitle>
                    </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="participant@example.com"
                        value={newParticipant.email}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={newParticipant.first_name}
                          onChange={(e) => setNewParticipant(prev => ({ ...prev, first_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={newParticipant.last_name}
                          onChange={(e) => setNewParticipant(prev => ({ ...prev, last_name: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newParticipant.role} onValueChange={handleRoleChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gameRoles.map(role => (
                            <SelectItem key={role.role} value={role.role}>
                              {role.role.toUpperCase()} - {formatCurrency(role.default_budget)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget</Label>
                      <Input
                        id="budget"
                        type="number"
                        min="0"
                        value={newParticipant.budget}
                        onChange={(e) => setNewParticipant(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={addParticipant} disabled={addLoading} className="flex-1">
                        {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Participant"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Participants ({participants.length})</CardTitle>
            <CardDescription>
              All participants currently enrolled in this game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Initial Budget</TableHead>
                  <TableHead>Current Cash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">
                      {participant.users?.first_name || "Demo"} {participant.users?.last_name || "User"}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(participant.role)}
                    </TableCell>
                    <TableCell>{formatCurrency(participant.initial_budget)}</TableCell>
                    <TableCell>{formatCurrency(participant.current_cash)}</TableCell>
                    <TableCell>
                      <Badge variant={participant.is_suspended ? "destructive" : "outline"}>
                        {participant.is_suspended ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(participant.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {participants.length === 0 && (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No participants yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add participants to start the game
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  Add First Participant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}