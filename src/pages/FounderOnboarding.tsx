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
import { Loader2, Building, Search, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { LogoUpload } from "@/components/LogoUpload";

export default function FounderOnboarding() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<any>(null);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newVenture, setNewVenture] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
    linkedin: "",
    logo_url: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!user || !gameId) return;
    
    const fetchData = async () => {
      // Get game info
      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();
      
      if (!gameData) {
        navigate("/");
        return;
      }
      
      setGameInfo(gameData);
      
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
      
      // Check if founder already has a venture
      const { data: founderData } = await supabase
        .from("founder_members")
        .select(`
          *,
          ventures (
            slug,
            name
          )
        `)
        .eq("participant_id", participantData.id)
        .maybeSingle();
      
      if (founderData && founderData.ventures) {
        // Founder already has a venture, redirect to venture admin
        navigate(`/games/${gameId}/venture/${founderData.ventures.slug}/admin`);
        return;
      }
      
      // Only show onboarding for founders without ventures
      if (participantData.role !== 'founder') {
        navigate(`/games/${gameId}/discover`);
        return;
      }
      
      setParticipant(participantData);
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, navigate]);

  const searchVentures = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("ventures")
      .select(`
        *,
        founder_members!inner(
          participant_id,
          participants!inner(
            users!inner(first_name, last_name, email)
          )
        )
      `)
      .eq("game_id", gameId)
      .ilike("name", `%${query}%`)
      .limit(10);

    setSearchResults(data || []);
  };

  useEffect(() => {
    const debounced = setTimeout(() => {
      searchVentures(searchTerm);
    }, 300);

    return () => clearTimeout(debounced);
  }, [searchTerm]);

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
      toast.error("Name and slug are required");
      return;
    }

    setIsCreating(true);
    
    try {
      // Check if slug is unique
      const { data: existingVenture } = await supabase
        .from("ventures")
        .select("id")
        .eq("game_id", gameId)
        .eq("slug", newVenture.slug)
        .single();

      if (existingVenture) {
        toast.error("This venture name is already taken");
        return;
      }

      // Create venture
      const { data: ventureData, error: ventureError } = await supabase
        .from("ventures")
        .insert({
          game_id: gameId,
          name: newVenture.name,
          slug: newVenture.slug,
          description: newVenture.description || null,
          website: newVenture.website || null,
          linkedin: newVenture.linkedin || null,
          logo_url: newVenture.logo_url || null,
          type: 'startup'
        })
        .select()
        .single();

      if (ventureError) throw ventureError;

      // Add founder as owner
      const { error: founderError } = await supabase
        .from("founder_members")
        .insert({
          venture_id: ventureData.id,
          participant_id: participant.id,
          role: 'owner',
          can_manage: true
        });

      if (founderError) throw founderError;

      toast.success("Venture created successfully!");
      navigate(`/games/${gameId}/discover`);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to create venture");
    } finally {
      setIsCreating(false);
    }
  };

  const joinVenture = async (ventureId: string) => {
    setIsJoining(true);
    
    try {
      const { error } = await supabase
        .from("founder_members")
        .insert({
          venture_id: ventureId,
          participant_id: participant.id,
          role: 'member',
          can_manage: false
        });

      if (error) throw error;

      toast.success("Join request sent! The venture owner will need to approve.");
      navigate(`/games/${gameId}/discover`);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to join venture");
    } finally {
      setIsJoining(false);
    }
  };

  const skipOnboarding = () => {
    navigate(`/games/${gameId}/discover`);
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome to {gameInfo?.name}!</h1>
          <p className="text-muted-foreground mt-2">
            As a founder, you can create your own startup or join an existing one
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Venture</TabsTrigger>
            <TabsTrigger value="join">Join Venture</TabsTrigger>
            <TabsTrigger value="skip">Skip for Now</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your Venture
                </CardTitle>
                <CardDescription>
                  Build your own venture and attract investors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venture Name *</Label>
                  <Input
                    id="name"
                    value={newVenture.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter your venture name"
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
                  <p className="text-xs text-muted-foreground">
                    This will be used in your venture's URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newVenture.description}
                    onChange={(e) => setNewVenture(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what your venture does..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <LogoUpload
                    currentLogoUrl={newVenture.logo_url}
                    startupSlug={newVenture.slug || 'new-venture'}
                    onLogoUploaded={(url) => setNewVenture(prev => ({ ...prev, logo_url: url }))}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={createVenture}
                  disabled={isCreating || !newVenture.name.trim()}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Building className="mr-2 h-4 w-4" />
                      Create Venture
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Join Existing Venture
                </CardTitle>
                <CardDescription>
                  Search for and join an existing venture as a co-founder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Ventures</Label>
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by venture name..."
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((venture) => (
                      <div key={venture.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {venture.logo_url ? (
                            <img 
                              src={venture.logo_url} 
                              alt={venture.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Building className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{venture.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {venture.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => joinVenture(venture.id)}
                          disabled={isJoining}
                        >
                          {isJoining ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Request to Join"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No ventures found</h3>
                    <p className="text-muted-foreground">
                      Try searching with different keywords
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skip">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Skip for Now
                </CardTitle>
                <CardDescription>
                  Continue without creating or joining a venture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You can always create or join a venture later. For now, you can:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Browse and invest in other ventures</li>
                  <li>View the leaderboard and market activity</li>
                  <li>Access your portfolio dashboard</li>
                  <li>Create or join a venture at any time</li>
                </ul>

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={skipOnboarding}
                >
                  Continue to Game
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}