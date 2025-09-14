import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Building2, Trash2, Edit, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { LogoUpload } from "@/components/LogoUpload";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Venture {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  linkedin?: string;
  total_shares: number;
  primary_shares_remaining: number;
  last_vwap_price?: number;
  created_at: string;
}

export default function ManageVentures() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [newVenture, setNewVenture] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
    linkedin: "",
    total_shares: 100
  });
  const [editingVenture, setEditingVenture] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      fetchVentures();
    }
  }, [gameId]);

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
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewVenture(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const createVenture = async () => {
    if (!newVenture.name.trim() || !newVenture.slug.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and slug are required",
      });
      return;
    }

    try {
      setIsCreating(true);

      const { error } = await supabase
        .from("ventures")
        .insert({
          game_id: gameId,
          slug: newVenture.slug,
          name: newVenture.name,
          description: newVenture.description || null,
          website: newVenture.website || null,
          linkedin: newVenture.linkedin || null,
          total_shares: newVenture.total_shares,
          primary_shares_remaining: newVenture.total_shares
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venture created successfully!",
      });

      setNewVenture({
        name: "",
        slug: "",
        description: "",
        website: "",
        linkedin: "",
        total_shares: 100
      });

      fetchVentures();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteVenture = async (ventureId: string) => {
    try {
      const { error } = await supabase
        .from("ventures")
        .delete()
        .eq("id", ventureId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venture deleted successfully!",
      });

      fetchVentures();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const startEditing = (venture: Venture) => {
    setEditingVenture(venture.id);
    setEditData({
      name: venture.name,
      slug: venture.slug,
      description: venture.description,
      website: venture.website,
      linkedin: venture.linkedin,
      total_shares: venture.total_shares
    });
  };

  const cancelEditing = () => {
    setEditingVenture(null);
    setEditData({});
  };

  const saveEdit = async (ventureId: string) => {
    try {
      const { error } = await supabase
        .from("ventures")
        .update(editData)
        .eq("id", ventureId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venture updated successfully!",
      });

      setEditingVenture(null);
      setEditData({});
      fetchVentures();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/games/${gameId}/organizer`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizer
            </Button>
            <h1 className="text-3xl font-bold">Manage Ventures</h1>
          </div>
        </div>

        {/* Create New Venture */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Venture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newVenture.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Venture name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={newVenture.slug}
                  onChange={(e) => setNewVenture(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="venture-url-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newVenture.description}
                onChange={(e) => setNewVenture(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the venture"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={newVenture.website}
                  onChange={(e) => setNewVenture(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={newVenture.linkedin}  
                  onChange={(e) => setNewVenture(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_shares">Total Shares</Label>
                <Input
                  id="total_shares"
                  type="number"
                  value={newVenture.total_shares}
                  onChange={(e) => setNewVenture(prev => ({ ...prev, total_shares: parseInt(e.target.value) || 100 }))}
                  min="1"
                />
              </div>
            </div>

            <Button 
              onClick={createVenture} 
              disabled={isCreating || !newVenture.name.trim()}
              className="w-full md:w-auto"
            >
              {isCreating ? "Creating..." : "Create Venture"}
            </Button>
          </CardContent>
        </Card>

        {/* Ventures List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Ventures ({ventures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ventures.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ventures yet</h3>
                <p className="text-muted-foreground">Create your first venture to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Shares</TableHead>
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
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {editingVenture === venture.id ? (
                              <Input
                                value={editData.name || ""}
                                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-32"
                              />
                            ) : (
                              <span className="font-medium">{venture.name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingVenture === venture.id ? (
                            <Input
                              value={editData.slug || ""}
                              onChange={(e) => setEditData(prev => ({ ...prev, slug: e.target.value }))}
                              className="w-32"
                            />
                          ) : (
                            <code className="text-sm bg-muted px-2 py-1 rounded">{venture.slug}</code>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {venture.total_shares - venture.primary_shares_remaining} / {venture.total_shares}
                          </span>
                        </TableCell>
                        <TableCell>
                          {venture.last_vwap_price ? (
                            formatCurrency(venture.last_vwap_price)
                          ) : (
                            <span className="text-muted-foreground">No trades yet</span>
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
                            {editingVenture === venture.id ? (
                              <>
                                <Button size="sm" onClick={() => saveEdit(venture.id)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditing}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => startEditing(venture)}>
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
                                  onClick={() => setDeleteConfirm(venture.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm) {
              deleteVenture(deleteConfirm);
              setDeleteConfirm(null);
            }
          }}
          title="Delete Venture"
          description="Are you sure you want to delete this venture? This action cannot be undone."
        />
      </div>
    </div>
  );
}