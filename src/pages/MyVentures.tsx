import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Lightbulb, Rocket, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";

interface Venture {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  type: 'startup' | 'idea' | 'project';
  game_id: string | null;
  game_name: string;
  total_shares: number;
  primary_shares_remaining: number;
  last_vwap_price?: number;
  created_at: string;
  is_venture_idea: boolean;
}

const getVentureIcon = (type: string) => {
  switch (type) {
    case 'startup': return <Building className="w-5 h-5" />;
    case 'idea': return <Lightbulb className="w-5 h-5" />;
    case 'project': return <Rocket className="w-5 h-5" />;
    default: return <Building className="w-5 h-5" />;
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

export default function MyVentures() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchMyVentures();
    }
  }, [user]);

  const fetchMyVentures = async () => {
    if (!user) return;

    try {
      // Get all venture ideas created by the user
      const { data: ventureIdeasData, error: ventureIdeasError } = await supabase
        .from('venture_ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ventureIdeasError) throw ventureIdeasError;

      // Get all real ventures where user is a founder member
      const { data: founderMembersData, error: founderError } = await supabase
        .from('founder_members')
        .select(`
          *,
          ventures!inner (
            *,
            games!inner (
              id,
              name,
              status
            )
          ),
          participants!inner (
            user_id
          )
        `)
        .eq('participants.user_id', user.id);

      if (founderError) throw founderError;

      const ventureIdeas = ventureIdeasData?.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        logo_url: item.logo_url,
        description: item.description,
        type: item.type,
        game_id: null,
        game_name: 'Independent Venture',
        total_shares: 100,
        primary_shares_remaining: 100,
        last_vwap_price: null,
        created_at: item.created_at,
        is_venture_idea: true,
      })) || [];

      const realVentures = founderMembersData?.map((item: any) => ({
        id: item.ventures.id,
        name: item.ventures.name,
        slug: item.ventures.slug,
        logo_url: item.ventures.logo_url,
        description: item.ventures.description,
        type: item.ventures.type,
        game_id: item.ventures.game_id,
        game_name: item.ventures.games.name,
        total_shares: item.ventures.total_shares,
        primary_shares_remaining: item.ventures.primary_shares_remaining,
        last_vwap_price: item.ventures.last_vwap_price,
        created_at: item.ventures.created_at,
        is_venture_idea: false,
      })) || [];

      const allVentures = [...realVentures, ...ventureIdeas];
      setVentures(allVentures);
    } catch (error) {
      console.error('Error fetching ventures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVentures = selectedType === "all" 
    ? ventures 
    : ventures.filter(v => v.type === selectedType);

  const getSharesProgress = (venture: Venture) => {
    const sold = venture.total_shares - venture.primary_shares_remaining;
    const percentage = (sold / venture.total_shares) * 100;
    return { sold, total: venture.total_shares, percentage };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Ventures</h1>
          <p className="text-muted-foreground">
            Manage all your startups, ideas, and projects
          </p>
        </div>
        <Button onClick={() => navigate('/ventures/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Venture
        </Button>
      </div>

      {ventures.length === 0 ? (
        <EmptyState
          title="No ventures yet"
          description="You haven't created any ventures yet. Start by creating your first startup, idea, or project!"
          action={{
            label: "Create New Venture",
            onClick: () => navigate('/ventures/new')
          }}
        />
      ) : (
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="startup">Startups</TabsTrigger>
            <TabsTrigger value="idea">Ideas</TabsTrigger>
            <TabsTrigger value="project">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVentures.map((venture) => {
                const progress = getSharesProgress(venture);
                const marketCap = venture.last_vwap_price 
                  ? venture.last_vwap_price * venture.total_shares 
                  : 0;

                return (
                  <Card 
                    key={venture.id} 
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => {
                            if (venture.game_id) {
                              navigate(`/games/${venture.game_id}/venture/${venture.slug}`);
                            } else {
                              // For venture ideas, navigate to create venture page with pre-filled data
                              navigate(`/ventures/new?from=${venture.id}`);
                            }
                          }}
                        >
                          {venture.logo_url ? (
                            <img 
                              src={venture.logo_url} 
                              alt={venture.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                              {getVentureIcon(venture.type)}
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg">{venture.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {venture.game_name}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!venture.is_venture_idea && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/games/${venture.game_id}/venture/${venture.slug}/admin`);
                              }}
                              className="p-2"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                          )}
                          <Badge className={getVentureColor(venture.type)}>
                            {venture.type}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {venture.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {venture.description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Shares Progress</span>
                          <span>{progress.sold} / {progress.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Market Cap</p>
                            <p className="font-semibold">
                              {marketCap > 0 ? `$${marketCap.toLocaleString()}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">VWAP Price</p>
                            <p className="font-semibold">
                              {venture.last_vwap_price ? `$${venture.last_vwap_price.toFixed(2)}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}