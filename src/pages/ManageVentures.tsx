import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Building2, UserPlus, ExternalLink, RefreshCw, Send, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { VentureOwnershipFix } from "@/components/VentureOwnershipFix";

interface VentureIdea {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  linkedin?: string;
  type: string;
  created_at: string;
  user_id: string;
  users?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  already_in_game?: boolean;
}

const getVentureIcon = (type: string) => {
  switch (type) {
    case 'startup': return '🚀';
    case 'idea': return '💡';
    case 'project': return '🏗️';
    default: return '🏢';
  }
};

const getVentureColor = (type: string) => {
  switch (type) {
    case 'startup': return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'idea': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'project': return 'bg-green-500/10 text-green-700 border-green-200';
    default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
  }
};

export default function ManageVentures() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ventureIdeas, setVentureIdeas] = useState<VentureIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const [selectedVentureIdea, setSelectedVentureIdea] = useState<VentureIdea | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reInviteLoading, setReInviteLoading] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedVentureForRemoval, setSelectedVentureForRemoval] = useState<VentureIdea | null>(null);

  // Fetch venture ideas from participants in this game
  const fetchVentureIdeas = async () => {
    try {
      console.log("🔍 [ManageVentures] Starting fetchVentureIdeas for gameId:", gameId);
      console.log("🔍 [ManageVentures] Current user:", user?.id, user?.email);
      
      // First get all participants in this game
      const { data: participants, error: participantsError } = await supabase
        .from("participants")
        .select("user_id")
        .eq("game_id", gameId);

      console.log("🔍 [ManageVentures] Participants query result:", { participants, participantsError });

      if (participantsError) throw participantsError;

      if (!participants || participants.length === 0) {
        console.log("🔍 [ManageVentures] No participants found");
        setVentureIdeas([]);
        return;
      }

      const participantUserIds = participants.map(p => p.user_id);
      console.log("🔍 [ManageVentures] Participant user IDs:", participantUserIds);

      // Get venture ideas from these participants
      const { data: ventureIdeasData, error: ventureIdeasError } = await supabase
        .from("venture_ideas")
        .select("*")
        .in("user_id", participantUserIds)
        .order("created_at", { ascending: false });

      console.log("🔍 [ManageVentures] Venture ideas query result:", { ventureIdeasData, ventureIdeasError });

      if (ventureIdeasError) throw ventureIdeasError;

      // Get user data for each venture idea
      const ventureIdeasWithUsers = await Promise.all(
        (ventureIdeasData || []).map(async (ventureIdea) => {
          const { data: userData } = await supabase
            .from("users")
            .select("first_name, last_name, email")
            .eq("id", ventureIdea.user_id)
            .single();

          console.log("🔍 [ManageVentures] User data for venture:", ventureIdea.name, userData);

          return {
            ...ventureIdea,
            users: userData
          };
        })
      );

      if (ventureIdeasError) throw ventureIdeasError;

      // Check which ventures are already in this game
      const { data: existingVentures, error: existingVenturesError } = await supabase
        .from("ventures")
        .select("slug")
        .eq("game_id", gameId);

      console.log("🔍 [ManageVentures] Existing ventures in game:", { existingVentures, existingVenturesError });

      if (existingVenturesError) throw existingVenturesError;

      const existingVentureSlugs = new Set(existingVentures?.map(v => v.slug) || []);
      console.log("🔍 [ManageVentures] Existing venture slugs:", Array.from(existingVentureSlugs));

      const ventureIdeasWithStatus = ventureIdeasWithUsers.map(ventureIdea => ({
        ...ventureIdea,
        already_in_game: existingVentureSlugs.has(ventureIdea.slug)
      }));

      console.log("🔍 [ManageVentures] Final venture ideas with status:", ventureIdeasWithStatus);
      setVentureIdeas(ventureIdeasWithStatus);
    } catch (error: any) {
      console.error('🚨 [ManageVentures] Error fetching venture ideas:', error);
      console.error('🚨 [ManageVentures] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error("Failed to fetch venture ideas: " + error.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log("🔄 [ManageVentures] Manual refresh triggered");
    await fetchVentureIdeas();
    setRefreshing(false);
    toast.success("Venture ideas refreshed");
  };

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
      await fetchVentureIdeas();
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, navigate]);

  const inviteVentureToGame = async (ventureIdea: VentureIdea) => {
    setInviteLoading(ventureIdea.id);
    
    try {
      // Create venture in game based on venture idea
      const { data: newVenture, error } = await supabase
        .from("ventures")
        .insert({
          game_id: gameId,
          slug: ventureIdea.slug,
          name: ventureIdea.name,
          logo_url: ventureIdea.logo_url,
          description: ventureIdea.description,
          website: ventureIdea.website,
          linkedin: ventureIdea.linkedin,
          type: ventureIdea.type,
          total_shares: 100,
          primary_shares_remaining: 100
        })
        .select()
        .single();

      if (error) throw error;

      // Add the venture creator as a founder member
      const { data: participantData } = await supabase
        .from("participants")
        .select("id")
        .eq("game_id", gameId)
        .eq("user_id", ventureIdea.user_id)
        .single();

      if (participantData) {
        await supabase
          .from("founder_members")
          .insert({
            venture_id: newVenture.id,
            participant_id: participantData.id,
            role: 'owner',
            can_manage: true
          });
      }

      toast.success(`${ventureIdea.name} has been invited to the game!`);
      await fetchVentureIdeas(); // Refresh the list
    } catch (error: any) {
      console.error('Error inviting venture to game:', error);
      toast.error("Failed to invite venture to game");
    } finally {
      setInviteLoading(null);
      setShowInviteDialog(false);
      setSelectedVentureIdea(null);
    }
  };

  const openInviteDialog = (ventureIdea: VentureIdea) => {
    setSelectedVentureIdea(ventureIdea);
    setShowInviteDialog(true);
  };

  const handleReInvite = async (ventureIdea: VentureIdea) => {
    setReInviteLoading(ventureIdea.id);
    
    try {
      // Find the venture in the game
      const { data: venture, error: ventureError } = await supabase
        .from("ventures")
        .select("id")
        .eq("game_id", gameId)
        .eq("slug", ventureIdea.slug)
        .single();

      if (ventureError || !venture) {
        throw new Error("Venture not found in game");
      }

      // Find all founder members of this venture
      const { data: founderMembers, error: foundersError } = await supabase
        .from("founder_members")
        .select(`
          id,
          participant_id,
          participants!inner(id, user_id)
        `)
        .eq("venture_id", venture.id);

      if (foundersError) throw foundersError;

      // Send notification to each founder
      if (founderMembers && founderMembers.length > 0) {
        const notifications = founderMembers.map(member => ({
          game_id: gameId,
          to_participant_id: member.participant_id,
          type: 'venture_re_invited',
          payload: {
            venture_id: venture.id,
            venture_name: ventureIdea.name,
            message: `You have been re-invited to manage ${ventureIdea.name} in the game ${gameInfo?.name}`
          }
        }));

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notificationError) throw notificationError;
      }

      toast.success(`Re-invitation sent to ${ventureIdea.name} members!`);
    } catch (error: any) {
      console.error('Error re-inviting venture:', error);
      toast.error("Failed to send re-invitation: " + error.message);
    } finally {
      setReInviteLoading(null);
    }
  };

  const openRemoveDialog = (ventureIdea: VentureIdea) => {
    setSelectedVentureForRemoval(ventureIdea);
    setShowRemoveDialog(true);
  };

  const handleRemoveFromGame = async (ventureIdea: VentureIdea) => {
    setRemoveLoading(ventureIdea.id);
    
    try {
      // Find the venture in the game
      const { data: venture, error: ventureError } = await supabase
        .from("ventures")
        .select("id")
        .eq("game_id", gameId)
        .eq("slug", ventureIdea.slug)
        .single();

      if (ventureError || !venture) {
        throw new Error("Venture not found in game");
      }

      // Check if there are any trades for this venture
      const { data: trades, error: tradesError } = await supabase
        .from("trades")
        .select("id")
        .eq("venture_id", venture.id)
        .limit(1);

      if (tradesError) throw tradesError;

      if (trades && trades.length > 0) {
        toast.error("Cannot remove venture with existing trades. Contact support if needed.");
        return;
      }

      // Remove founder members
      const { error: foundersError } = await supabase
        .from("founder_members")
        .delete()
        .eq("venture_id", venture.id);

      if (foundersError) throw foundersError;

      // Remove positions (if any)
      const { error: positionsError } = await supabase
        .from("positions")
        .delete()
        .eq("venture_id", venture.id);

      if (positionsError) throw positionsError;

      // Remove orders
      const { error: ordersError } = await supabase
        .from("orders_primary")
        .delete()
        .eq("venture_id", venture.id);

      if (ordersError) throw ordersError;

      // Finally remove the venture
      const { error: deleteError } = await supabase
        .from("ventures")
        .delete()
        .eq("id", venture.id);

      if (deleteError) throw deleteError;

      toast.success(`${ventureIdea.name} has been removed from the game!`);
      await fetchVentureIdeas(); // Refresh the list
    } catch (error: any) {
      console.error('Error removing venture from game:', error);
      toast.error("Failed to remove venture from game: " + error.message);
    } finally {
      setRemoveLoading(null);
      setShowRemoveDialog(false);
      setSelectedVentureForRemoval(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/games/${gameId}/organizer`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Ventures</h1>
          {gameInfo && (
            <p className="text-gray-600 mt-2">
              Invite venture ideas from participants to join {gameInfo.name}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Available Venture Ideas ({ventureIdeas.length})
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardTitle>
          <CardDescription>
            Venture ideas from participants in this game that you can invite to join
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ventureIdeas.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-12 w-12 text-muted-foreground" />}
              title="No venture ideas found"
              description="Participants in this game haven't created any venture ideas yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venture</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Links</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventureIdeas.map((ventureIdea) => (
                    <TableRow key={ventureIdea.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {ventureIdea.logo_url ? (
                            <img
                              src={ventureIdea.logo_url}
                              alt={`${ventureIdea.name} logo`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                              {getVentureIcon(ventureIdea.type)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{ventureIdea.name}</div>
                            <div className="text-sm text-gray-500">@{ventureIdea.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {ventureIdea.users?.first_name} {ventureIdea.users?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ventureIdea.users?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getVentureColor(ventureIdea.type)}>
                          {getVentureIcon(ventureIdea.type)} {ventureIdea.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-600 truncate">
                            {ventureIdea.description || "No description"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {ventureIdea.website && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={ventureIdea.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {ventureIdea.linkedin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a
                                href={ventureIdea.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ventureIdea.already_in_game ? (
                          <Badge variant="secondary">
                            Already in game
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Available
                          </Badge>
                        )}
                      </TableCell>
                       <TableCell>
                         <div className="flex gap-2 flex-wrap">
                           <VentureOwnershipFix
                             ventureIdea={ventureIdea}
                             gameId={gameId!}
                             onFixed={fetchVentureIdeas}
                           />
                           {!ventureIdea.already_in_game ? (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => openInviteDialog(ventureIdea)}
                               disabled={inviteLoading === ventureIdea.id}
                             >
                               {inviteLoading === ventureIdea.id ? (
                                 <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                 <UserPlus className="h-4 w-4" />
                               )}
                               Invite
                             </Button>
                           ) : (
                             <>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleReInvite(ventureIdea)}
                                 disabled={reInviteLoading === ventureIdea.id}
                               >
                                 {reInviteLoading === ventureIdea.id ? (
                                   <Loader2 className="h-4 w-4 animate-spin" />
                                 ) : (
                                   <Send className="h-4 w-4" />
                                 )}
                                 Re-invite
                               </Button>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => openRemoveDialog(ventureIdea)}
                                 disabled={removeLoading === ventureIdea.id}
                               >
                                 {removeLoading === ventureIdea.id ? (
                                   <Loader2 className="h-4 w-4 animate-spin" />
                                 ) : (
                                   <Trash2 className="h-4 w-4" />
                                 )}
                                 Remove
                               </Button>
                             </>
                           )}
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Confirmation Dialog */}
      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invite Venture to Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to invite "{selectedVentureIdea?.name}" to join this game? 
              This will create a new venture entry in the game with 100 shares available for trading.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedVentureIdea && inviteVentureToGame(selectedVentureIdea)}
              disabled={!!inviteLoading}
            >
              {inviteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Inviting...
                </>
              ) : (
                "Invite to Game"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Venture from Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedVentureForRemoval?.name}" from this game? 
              This action cannot be undone. All founder members, positions, and orders will be removed.
              Note: Ventures with existing trades cannot be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedVentureForRemoval && handleRemoveFromGame(selectedVentureForRemoval)}
              disabled={!!removeLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                "Remove from Game"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}