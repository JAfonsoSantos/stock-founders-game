import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Upload, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Participant {
  id: string;
  user_id: string;
  role: string;
  initial_budget: number;
  current_cash: number;
  is_suspended: boolean;
  users: {
    first_name: string;
    last_name: string;
  };
}

interface GameRole {
  id: string;
  role: string;
  default_budget: number;
}

export default function ManageParticipants() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [gameRoles, setGameRoles] = useState<GameRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newParticipant, setNewParticipant] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "founder" as const,
    budget: 0
  });

  useEffect(() => {
    if (gameId) {
      fetchData();
    }
  }, [gameId]);

  const fetchData = async () => {
    try {
      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select(`
          *,
          users(first_name, last_name)
        `)
        .eq("game_id", gameId);

      if (participantsError) throw participantsError;

      // Fetch game roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("game_roles")
        .select("*")
        .eq("game_id", gameId);

      if (rolesError) throw rolesError;

      setParticipants(participantsData || []);
      setGameRoles(rolesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: string) => {
    const gameRole = gameRoles.find(gr => gr.role === role);
    setNewParticipant(prev => ({
      ...prev,
      role: role as any,
      budget: gameRole?.default_budget || 0
    }));
  };

  const addParticipant = async () => {
    if (!newParticipant.email || !newParticipant.firstName || !newParticipant.lastName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    try {
      // For now, we'll show a message that this needs user signup
      toast({
        title: "Invitation System",
        description: "Real implementation would send magic link to the user's email. For now, users need to sign up manually.",
      });
      
      // Clear form
      setNewParticipant({
        email: "",
        firstName: "",
        lastName: "",
        role: "founder",
        budget: 0
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/games/${gameId}/organizer`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Participants</h1>
            <p className="text-muted-foreground">Add and manage game participants</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Add New Participant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Participant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newParticipant.firstName}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newParticipant.lastName}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newParticipant.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Founder</SelectItem>
                      <SelectItem value="angel">Angel</SelectItem>
                      <SelectItem value="vc">VC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newParticipant.budget}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={addParticipant}>
                  Add Participant
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Participants ({participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Initial Budget</TableHead>
                      <TableHead>Current Cash</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          {participant.users.first_name} {participant.users.last_name}
                        </TableCell>
                        <TableCell className="capitalize">{participant.role}</TableCell>
                        <TableCell>${participant.initial_budget.toLocaleString()}</TableCell>
                        <TableCell>${participant.current_cash.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            participant.is_suspended 
                              ? 'bg-destructive/10 text-destructive' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {participant.is_suspended ? 'Suspended' : 'Active'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No participants yet. Add the first participant above.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}