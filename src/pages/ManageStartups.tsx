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

interface Startup {
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

export default function ManageStartups() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isScrapingLinkedIn, setIsScrapingLinkedIn] = useState(false);
  const [editingStartup, setEditingStartup] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Startup>>({});
  const [startupToDelete, setStartupToDelete] = useState<Startup | null>(null);
  const [newStartup, setNewStartup] = useState({
    slug: "",
    name: "",
    logo_url: "",
    description: "",
    website: "",
    linkedin: "",
    total_shares: 100
  });

  useEffect(() => {
    if (gameId) {
      fetchStartups();
    }
  }, [gameId]);

  const fetchStartups = async () => {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStartups(data || []);
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewStartup(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const createStartup = async () => {
    if (!newStartup.name.trim() || !newStartup.slug.trim()) {
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
        .from("startups")
        .insert({
          game_id: gameId,
          slug: newStartup.slug,
          name: newStartup.name,
          logo_url: newStartup.logo_url || null,
          description: newStartup.description || null,
          website: newStartup.website || null,
          linkedin: newStartup.linkedin || null,
          total_shares: newStartup.total_shares,
          primary_shares_remaining: newStartup.total_shares
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Startup created successfully",
      });

      // Reset form
      setNewStartup({
        slug: "",
        name: "",
        logo_url: "",
        description: "",
        website: "",
        linkedin: "",
        total_shares: 100
      });

      // Refresh list
      fetchStartups();
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

  const handleAutoFillFromLinkedIn = async () => {
    if (!newStartup.linkedin.trim()) {
      toast({
        variant: "destructive",
        title: "No LinkedIn URL",
        description: "Please enter a LinkedIn URL first",
      });
      return;
    }

    console.log('Starting LinkedIn auto-fill with URL:', newStartup.linkedin);
    setIsScrapingLinkedIn(true);
    
    try {
      // Extract vanity name from LinkedIn URL
      let vanityName = newStartup.linkedin;
      if (newStartup.linkedin.includes('linkedin.com/company/')) {
        const match = newStartup.linkedin.match(/linkedin\.com\/company\/([^/?]+)/);
        if (match) {
          vanityName = match[1];
        }
      }

      console.log('Using LinkedIn Organization Lookup API with vanity name:', vanityName);
      
      // Call our new LinkedIn Organization Lookup edge function
      const { data, error } = await supabase.functions.invoke('linkedin-organization-lookup', {
        body: {
          vanityName: vanityName
        }
      });

      console.log('LinkedIn Organization API response:', { data, error });

      if (error) {
        console.error('LinkedIn Organization API error:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to lookup organization');
      }

      const orgData = data.data;
      console.log('Organization data received:', orgData);

      // Convert logoV2 URN to actual URL if needed
      let logoUrl = orgData.logoUrl;
      if (logoUrl && logoUrl.startsWith('urn:li:digitalmediaAsset:')) {
        // LinkedIn media URNs need special handling
        // For now, we'll skip these and try the fallback method
        logoUrl = null;
        console.log('LinkedIn media URN detected, using fallback method for logo');
      }

      if (orgData.name || orgData.description || logoUrl || orgData.website) {
        console.log('Final extracted data from LinkedIn API:', {
          name: orgData.name,
          logoUrl: logoUrl,
          website: orgData.website,
          description: orgData.description?.substring(0, 100) + '...'
        });
        
        setNewStartup(prev => ({
          ...prev,
          name: orgData.name || prev.name,
          slug: orgData.name ? generateSlug(orgData.name) : prev.slug,
          description: orgData.description || prev.description,
          website: orgData.website || prev.website,
          logo_url: logoUrl || prev.logo_url
        }));
        
        const extractedItems = [];
        if (orgData.name) extractedItems.push('nome');
        if (orgData.description) extractedItems.push('descrição');
        if (orgData.website) extractedItems.push('website');
        if (logoUrl) extractedItems.push('logo');
        
        toast({
          title: "Sucesso",
          description: `Informações extraídas do LinkedIn: ${extractedItems.join(', ')}`,
        });
      } else {
        console.log('No data extracted from LinkedIn API');
        toast({
          variant: "destructive",
          title: "Nenhum dado encontrado",
          description: "Não foi possível extrair informações da startup do LinkedIn. Verifique se o perfil da empresa existe e é público.",
        });
      }
    } catch (error: any) {
      console.error('Error in LinkedIn auto-fill:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // If API fails, show a more helpful message
      if (error.message.includes('LinkedIn access token')) {
        toast({
          variant: "destructive",
          title: "Configuração necessária",
          description: "O token de acesso do LinkedIn não está configurado. Entre em contacto com o administrador.",
        });
      } else if (error.message.includes('Organization not found')) {
        toast({
          variant: "destructive",
          title: "Empresa não encontrada",
          description: "Não foi possível encontrar esta empresa no LinkedIn. Verifique o URL e tente novamente.",
        });
      } else if (error.message.includes('Failed to fetch LinkedIn page')) {
        toast({
          variant: "destructive",
          title: "Erro de acesso",
          description: "Não foi possível aceder à página do LinkedIn. Tente novamente mais tarde.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao buscar dados do LinkedIn: " + error.message,
        });
      }
    } finally {
      setIsScrapingLinkedIn(false);
    }
  };

  const deleteStartup = async (startupId: string) => {
    try {
      const { error } = await supabase
        .from("startups")
        .delete()
        .eq("id", startupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Startup deleted successfully",
      });

      fetchStartups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const confirmDeleteStartup = () => {
    if (startupToDelete) {
      deleteStartup(startupToDelete.id);
      setStartupToDelete(null);
    }
  };

  const startEditing = (startup: Startup) => {
    setEditingStartup(startup.id);
    setEditData({
      name: startup.name,
      slug: startup.slug,
      description: startup.description,
      website: startup.website,
      linkedin: startup.linkedin,
      total_shares: startup.total_shares
    });
  };

  const cancelEditing = () => {
    setEditingStartup(null);
    setEditData({});
  };

  const saveEdit = async (startupId: string) => {
    try {
      const { error } = await supabase
        .from("startups")
        .update(editData)
        .eq("id", startupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Startup updated successfully",
      });

      setEditingStartup(null);
      setEditData({});
      fetchStartups();
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
            <h1 className="text-2xl font-bold">Manage Startups</h1>
            <p className="text-muted-foreground">Add and configure startups for the game</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Add New Startup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Startup
              </CardTitle>
            </CardHeader>
            <CardContent>
                  <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Startup Name</Label>
                    <Input
                      id="name"
                      value={newStartup.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Awesome Startup"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug (URL-friendly)</Label>
                    <Input
                      id="slug"
                      value={newStartup.slug}
                      onChange={(e) => setNewStartup(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="awesome-startup"
                    />
                  </div>
                  <div>
                    <LogoUpload
                      startupSlug={newStartup.slug}
                      currentLogoUrl={newStartup.logo_url}
                      onLogoUploaded={(url) => setNewStartup({ ...newStartup, logo_url: url })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newStartup.description}
                    onChange={(e) => setNewStartup(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the startup..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={newStartup.website}
                      onChange={(e) => setNewStartup(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://startup.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <div className="flex gap-2">
                      <Input
                        id="linkedin"
                        value={newStartup.linkedin}
                        onChange={(e) => setNewStartup(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="https://linkedin.com/company/startup"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAutoFillFromLinkedIn}
                        disabled={isScrapingLinkedIn || !newStartup.linkedin.trim()}
                      >
                        {isScrapingLinkedIn ? "Fetching..." : "Auto-fill"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="shares">Total Shares</Label>
                    <Input
                      id="shares"
                      type="number"
                      min="1"
                      value={newStartup.total_shares}
                      onChange={(e) => setNewStartup(prev => ({ ...prev, total_shares: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button onClick={createStartup} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Startup"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Startups List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Startups ({startups.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {startups.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>LinkedIn</TableHead>
                        <TableHead>Total Shares</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>VWAP Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {startups.map((startup) => (
                        <TableRow key={startup.id}>
                          <TableCell>
                            {startup.logo_url ? (
                              <img 
                                src={startup.logo_url} 
                                alt={`${startup.name} logo`} 
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {editingStartup === startup.id ? (
                              <Input
                                value={editData.name || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Startup name"
                              />
                            ) : (
                              startup.name
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {editingStartup === startup.id ? (
                              <Input
                                value={editData.slug || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="startup-slug"
                              />
                            ) : (
                              startup.slug
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStartup === startup.id ? (
                              <Textarea
                                value={editData.description || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description..."
                                rows={2}
                                className="min-w-[200px]"
                              />
                            ) : (
                              <div className="max-w-[200px] truncate" title={startup.description || ''}>
                                {startup.description || '-'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStartup === startup.id ? (
                              <Input
                                value={editData.website || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="https://website.com"
                              />
                            ) : (
                              startup.website ? (
                                <a 
                                  href={startup.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate block max-w-[150px]"
                                  title={startup.website}
                                >
                                  {startup.website.replace(/^https?:\/\//, '')}
                                </a>
                              ) : '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStartup === startup.id ? (
                              <Input
                                value={editData.linkedin || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, linkedin: e.target.value }))}
                                placeholder="https://linkedin.com/company/..."
                              />
                            ) : (
                              startup.linkedin ? (
                                <a 
                                  href={startup.linkedin} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate block max-w-[150px]"
                                  title={startup.linkedin}
                                >
                                  LinkedIn
                                </a>
                              ) : '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStartup === startup.id ? (
                              <Input
                                type="number"
                                min="1"
                                value={editData.total_shares || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, total_shares: Number(e.target.value) }))}
                              />
                            ) : (
                              startup.total_shares
                            )}
                          </TableCell>
                          <TableCell>{startup.primary_shares_remaining}</TableCell>
                          <TableCell>
                            {startup.last_vwap_price ? `$${startup.last_vwap_price.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {editingStartup === startup.id ? (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => saveEdit(startup.id)}
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={cancelEditing}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => startEditing(startup)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setStartupToDelete(startup)}
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No startups yet. Add the first startup above.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!startupToDelete}
        onOpenChange={(open) => !open && setStartupToDelete(null)}
        onConfirm={confirmDeleteStartup}
        title="Delete Startup"
        description={
          startupToDelete
            ? `Are you sure you want to delete "${startupToDelete.name}"? This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}