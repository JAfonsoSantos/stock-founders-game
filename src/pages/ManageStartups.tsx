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
                    <Input
                      id="linkedin"
                      value={newStartup.linkedin}
                      onChange={(e) => setNewStartup(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/company/startup"
                    />
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
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Total Shares</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>VWAP Price</TableHead>
                      <TableHead>Links</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {startups.map((startup) => (
                      <TableRow key={startup.id}>
                        <TableCell className="font-medium">{startup.name}</TableCell>
                        <TableCell className="text-muted-foreground">{startup.slug}</TableCell>
                        <TableCell>{startup.total_shares}</TableCell>
                        <TableCell>{startup.primary_shares_remaining}</TableCell>
                        <TableCell>
                          {startup.last_vwap_price ? `$${startup.last_vwap_price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {startup.website && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={startup.website} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {startup.linkedin && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={startup.linkedin} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteStartup(startup.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}