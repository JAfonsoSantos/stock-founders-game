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
    <div className="min-h-screen flex bg-gray-100">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-gray-50">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="mb-12">
            <div className="text-2xl font-bold text-gray-700 mb-8">
              stox
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Join Game
              </h1>
              <p className="text-gray-600">
                You're invited to join <strong>{gameInfo?.name}</strong>
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-base bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                required
                disabled={loading}
              />
              
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold bg-[#FF6B35] hover:bg-[#E55A2B] text-white border-0 rounded-lg shadow-sm transition-all duration-200" 
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
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
          {/* Organic shapes */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-16 w-80 h-80 bg-gradient-to-tr from-orange-300/30 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-300/20 to-orange-600/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}