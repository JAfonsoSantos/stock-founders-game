import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building2, Trash2, Edit, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Venture {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  linkedin?: string;
  type: string;
  total_shares: number;
  primary_shares_remaining: number;
  last_vwap_price?: number;
  created_at: string;
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
  
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVenture, setNewVenture] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
    linkedin: "",
    type: "startup",
    total_shares: 100
  });
  const [addLoading, setAddLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVenture, setSelectedVenture] = useState<Venture | null>(null);
  const [editVenture, setEditVenture] = useState({
    id: "",
    name: "",
    slug: "",
    description: "",
    website: "",
    linkedin: "",
    type: "startup",
    total_shares: 100
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVentures = async () => {
    try {
      const { data, error } = await supabase
        .from("ventures")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVentures(data || []);
    } catch (error: any) {
      console.error('Error fetching ventures:', error);
      toast.error("Failed to fetch ventures");
    }
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
      await fetchVentures();
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, navigate]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewVenture(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const addVenture = async () => {
    if (!newVenture.name || !newVenture.slug) {
      toast.error("Name and slug are required");
      return;
    }

    setAddLoading(true);

    try {
      const { error } = await supabase
        .from("ventures")
        .insert({
          game_id: gameId,
          slug: newVenture.slug,
          name: newVenture.name,
          description: newVenture.description || null,
          website: newVenture.website || null,
          linkedin: newVenture.linkedin || null,
          type: newVenture.type,
          total_shares: newVenture.total_shares,
          primary_shares_remaining: newVenture.total_shares
        });

      if (error) throw error;

      toast.success(`Venture "${newVenture.name}" created successfully!`);
      setShowAddModal(false);
      setNewVenture({
        name: "",
        slug: "",
        description: "",
        website: "",
        linkedin: "",
        type: "startup",
        total_shares: 100
      });

      await fetchVentures();
    } catch (error: any) {
      toast.error("Failed to create venture: " + error.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (venture: Venture) => {
    setSelectedVenture(venture);
    setEditVenture({
      id: venture.id,
      name: venture.name,
      slug: venture.slug,
      description: venture.description || "",
      website: venture.website || "",
      linkedin: venture.linkedin || "",
      type: venture.type,
      total_shares: venture.total_shares
    });
    setShowEditModal(true);
  };

  const saveEditVenture = async () => {
    setActionLoading(editVenture.id);
    try {
      const { error } = await supabase
        .from("ventures")
        .update({
          name: editVenture.name,
          slug: editVenture.slug,
          description: editVenture.description || null,
          website: editVenture.website || null,
          linkedin: editVenture.linkedin || null,
          type: editVenture.type,
          total_shares: editVenture.total_shares
        })
        .eq("id", editVenture.id);

      if (error) throw error;

      toast.success("Venture updated successfully!");
      setShowEditModal(false);
      await fetchVentures();
    } catch (error: any) {
      toast.error("Failed to update venture: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteDialog = (venture: Venture) => {
    setSelectedVenture(venture);
    setShowDeleteDialog(true);
  };

  const confirmDeleteVenture = async () => {
    if (!selectedVenture) return;
    
    setActionLoading(selectedVenture.id);
    try {
      // First delete related founder_members, positions, trades, orders
      await supabase
        .from("founder_members")
        .delete()
        .eq("venture_id", selectedVenture.id);

      await supabase
        .from("positions")
        .delete()
        .eq("venture_id", selectedVenture.id);

      await supabase
        .from("trades")
        .delete()
        .eq("venture_id", selectedVenture.id);

      await supabase
        .from("orders_primary")
        .delete()
        .eq("venture_id", selectedVenture.id);

      // Then delete the venture
      const { error } = await supabase
        .from("ventures")
        .delete()
        .eq("id", selectedVenture.id);

      if (error) throw error;

      toast.success("Venture deleted successfully!");
      setShowDeleteDialog(false);
      await fetchVentures();
    } catch (error: any) {
      toast.error("Failed to delete venture: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge className={getVentureColor(type)}>
        {getVentureIcon(type)} {type.toUpperCase()}
      </Badge>
    );
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
              <h1 className="text-3xl font-bold">Manage Ventures</h1>
              <p className="text-muted-foreground mt-2">
                Add and manage ventures for {gameInfo?.name}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => navigate(`/games/${gameId}/organizer`)}>
                Back to Dashboard
              </Button>
              
              <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Venture
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Venture</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="Venture name"
                          value={newVenture.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug *</Label>
                        <Input
                          id="slug"
                          placeholder="venture-slug"
                          value={newVenture.slug}
                          onChange={(e) => setNewVenture(prev => ({ ...prev, slug: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={newVenture.type} onValueChange={(value) => setNewVenture(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="startup">🚀 Startup</SelectItem>
                            <SelectItem value="idea">💡 Idea</SelectItem>
                            <SelectItem value="project">🏗️ Project</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_shares">Total Shares</Label>
                        <Input
                          id="total_shares"
                          type="number"
                          min="1"
                          value={newVenture.total_shares}
                          onChange={(e) => setNewVenture(prev => ({ ...prev, total_shares: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of the venture"
                        value={newVenture.description}
                        onChange={(e) => setNewVenture(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          placeholder="https://example.com"
                          value={newVenture.website}
                          onChange={(e) => setNewVenture(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          placeholder="https://linkedin.com/company/..."
                          value={newVenture.linkedin}
                          onChange={(e) => setNewVenture(prev => ({ ...prev, linkedin: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={addVenture} disabled={addLoading} className="flex-1">
                        {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Venture"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Ventures ({ventures.length})</CardTitle>
            <CardDescription>
              All ventures currently available in this game
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ventures.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No ventures yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first venture to get started with the investment game.
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Venture
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venture</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Shares Sold</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Market Cap</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventures.map((venture) => (
                      <TableRow key={venture.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {venture.logo_url ? (
                              <img 
                                src={venture.logo_url} 
                                alt={venture.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <span className="text-lg">{getVentureIcon(venture.type)}</span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{venture.name}</div>
                              {venture.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {venture.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(venture.type)}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{venture.slug}</code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {venture.total_shares - venture.primary_shares_remaining} / {venture.total_shares}
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-primary h-1.5 rounded-full"
                              style={{ 
                                width: `${((venture.total_shares - venture.primary_shares_remaining) / venture.total_shares) * 100}%` 
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {venture.last_vwap_price ? (
                            formatCurrency(venture.last_vwap_price)
                          ) : (
                            <span className="text-muted-foreground">No trades</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {venture.last_vwap_price ? (
                            formatCurrency(venture.last_vwap_price * venture.total_shares)
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(venture)}
                              disabled={actionLoading === venture.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/games/${gameId}/venture/${venture.slug}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(venture)}
                              disabled={actionLoading === venture.id}
                            >
                              {actionLoading === venture.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
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

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Venture</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editVenture.name}
                    onChange={(e) => setEditVenture(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editVenture.slug}
                    onChange={(e) => setEditVenture(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editVenture.type} onValueChange={(value) => setEditVenture(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">🚀 Startup</SelectItem>
                      <SelectItem value="idea">💡 Idea</SelectItem>
                      <SelectItem value="project">🏗️ Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total Shares</Label>
                  <Input
                    type="number"
                    value={editVenture.total_shares}
                    onChange={(e) => setEditVenture(prev => ({ ...prev, total_shares: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editVenture.description}
                  onChange={(e) => setEditVenture(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={editVenture.website}
                    onChange={(e) => setEditVenture(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input
                    value={editVenture.linkedin}
                    onChange={(e) => setEditVenture(prev => ({ ...prev, linkedin: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={saveEditVenture} 
                  disabled={actionLoading === editVenture.id}
                  className="flex-1"
                >
                  {actionLoading === editVenture.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Venture</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedVenture?.name}"? This will permanently remove the venture and all related data including trades, positions, and founder memberships. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteVenture} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Venture
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}