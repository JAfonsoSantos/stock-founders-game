import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Building2, Settings, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Game {
  id: string;
  name: string;
  status: string;
  starts_at: string;
  ends_at: string;
  currency: string;
  locale: string;
  owner_user_id: string;
}

export default function GameOrganizer() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    
    fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error) throw error;
      
      // Check if user is the owner
      if (data.owner_user_id !== user?.id) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to organize this game.",
        });
        navigate("/");
        return;
      }

      setGame(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game not found</h2>
          <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <p className="text-muted-foreground">Game Organizer Dashboard</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Game Status */}
          <Card>
            <CardHeader>
              <CardTitle>Game Status</CardTitle>
              <CardDescription>Current status: {game.status}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-muted-foreground">
                    {new Date(game.starts_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">End Date</p>
                  <p className="text-muted-foreground">
                    {new Date(game.ends_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Currency</p>
                  <p className="text-muted-foreground">{game.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-muted-foreground">{game.locale}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              role="button"
              tabIndex={0}
              onClick={() =>
                toast({ title: "Manage Participants", description: "Coming soon: add/edit players via CSV or individually." })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  toast({ title: "Manage Participants", description: "Coming soon: add/edit players via CSV or individually." });
              }}
              className="cursor-pointer hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Manage Participants"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Users className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Manage Participants</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Add and manage game participants
                </p>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() =>
                toast({ title: "Manage Startups", description: "Coming soon: create startups and upload logos." })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  toast({ title: "Manage Startups", description: "Coming soon: create startups and upload logos." });
              }}
              className="cursor-pointer hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Manage Startups"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Building2 className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Manage Startups</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Add and configure startups
                </p>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() =>
                toast({ title: "Game Settings", description: "Coming soon: configure currency, language and toggles." })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  toast({ title: "Game Settings", description: "Coming soon: configure currency, language and toggles." });
              }}
              className="cursor-pointer hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Game Settings"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Settings className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Game Settings</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Configure game parameters
                </p>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() =>
                toast({ title: "Start Game", description: "Coming soon: change status from draft to pre-market/open." })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  toast({ title: "Start Game", description: "Coming soon: change status from draft to pre-market/open." });
              }}
              className="cursor-pointer hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Start Game"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Play className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Start Game</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Launch the game when ready
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Game Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-muted-foreground">No participants yet</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Startups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-muted-foreground">No startups added</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{game.currency} 0</div>
                <p className="text-muted-foreground">Game not started</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}