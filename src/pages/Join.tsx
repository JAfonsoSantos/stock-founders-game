import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Join() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [loadingGame, setLoadingGame] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    
    const fetchGameInfo = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("name, status")
        .eq("id", gameId)
        .single();
      
      if (error) {
        toast.error("Game not found");
        navigate("/");
        return;
      }
      
      setGameInfo(data);
      setLoadingGame(false);
    };

    fetchGameInfo();
  }, [gameId, navigate]);

  useEffect(() => {
    if (user && gameId) {
      // Check if user is already a participant
      checkParticipation();
    }
  }, [user, gameId]);

  // Check if user is already a participant and redirect accordingly
  const checkParticipation = async () => {
    if (!user || !gameId) return;
    
    const { data } = await supabase
      .from("participants")
      .select("id, role, status")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      // Activate participant status on first login
      if (data.status === 'pending') {
        await supabase
          .from("participants")
          .update({ status: 'active' })
          .eq("id", data.id);
      }

      // If founder, check if they have a startup or need onboarding
      if (data.role === 'founder') {
        const { data: founderData } = await supabase
          .from("founder_members")
          .select("id")
          .eq("participant_id", data.id)
          .maybeSingle();
        
        if (!founderData) {
          navigate(`/games/${gameId}/founder-onboarding`);
          return;
        }
      }
      
      navigate(`/games/${gameId}/discover`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    
    try {
      const { error } = await signIn(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email for the magic link!");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loadingGame) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Game</CardTitle>
          <CardDescription>
            You're invited to join <strong>{gameInfo?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Join Game"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}