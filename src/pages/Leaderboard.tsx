import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, TrendingUp, Building, Crown, Medal, Award } from "lucide-react";

export default function Leaderboard() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startupLeaderboard, setStartupLeaderboard] = useState<any[]>([]);
  const [angelLeaderboard, setAngelLeaderboard] = useState<any[]>([]);
  const [vcLeaderboard, setVcLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<any>(null);

  useEffect(() => {
    if (!user || !gameId) return;
    
    const fetchData = async () => {
      // Check if user is participant or game owner
      const { data: participantData } = await supabase
        .from("participants")
        .select("*")
        .eq("game_id", gameId)
        .eq("user_id", user.id)
        .single();
      
      // Check if user is game owner
      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();
      
      if (!participantData && gameData?.owner_user_id !== user.id) {
        navigate(`/join/${gameId}`);
        return;
      }
      
      setGameInfo(gameData);
      
      // Check if leaderboards are public or user is game owner
      if (!gameData?.show_public_leaderboards && gameData?.owner_user_id !== user.id) {
        navigate(`/games/${gameId}/discover`);
        return;
      }
      
      // Fetch venture leaderboard
      const { data: startupsData } = await supabase
        .rpc("get_venture_leaderboard", { p_game_id: gameId });
      
      setStartupLeaderboard(startupsData || []);
      
      // Fetch angel leaderboard
      const { data: angelsData } = await supabase
        .rpc("get_angel_leaderboard", { p_game_id: gameId });
      
      setAngelLeaderboard(angelsData || []);
      
      // Fetch VC leaderboard
      const { data: vcsData } = await supabase
        .rpc("get_vc_leaderboard", { p_game_id: gameId });
      
      setVcLeaderboard(vcsData || []);
      setLoading(false);
    };

    fetchData();
  }, [user, gameId, navigate]);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "$0";
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (percentage: number | null) => {
    if (!percentage) return "0%";
    return `${percentage.toFixed(2)}%`;
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground">#{index + 1}</span>;
    }
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
              <h1 className="text-3xl font-bold flex items-center">
                <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
                Leaderboards
              </h1>
              <p className="text-muted-foreground mt-2">
                Top performers in {gameInfo?.name}
              </p>
            </div>
            <Button onClick={() => navigate(`/games/${gameId}/discover`)}>
              Back to Game
            </Button>
          </div>
        </div>

        <Tabs defaultValue="startups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="startups">Top Ventures</TabsTrigger>
            <TabsTrigger value="angels">Top Angels</TabsTrigger>
            <TabsTrigger value="vcs">Top VCs</TabsTrigger>
          </TabsList>

          <TabsContent value="startups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Ventures by Market Cap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Venture</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Market Cap</TableHead>
                      <TableHead>Shares Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {startupLeaderboard.map((startup, index) => (
                      <TableRow key={startup.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {startup.logo_url ? (
                              <img 
                                src={startup.logo_url} 
                                alt={startup.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <Building className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{startup.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {startup.last_vwap_price 
                            ? formatCurrency(startup.last_vwap_price)
                            : "No trades"
                          }
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(startup.market_cap)}
                        </TableCell>
                        <TableCell>
                          {startup.shares_sold}/{startup.total_shares}
                          <div className="text-xs text-muted-foreground">
                            {((startup.shares_sold / startup.total_shares) * 100).toFixed(1)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {startupLeaderboard.length === 0 && (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No ventures yet</h3>
                    <p className="text-muted-foreground">
                      Ventures will appear here once they're added
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="angels">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Angels by ROI Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Initial Budget</TableHead>
                      <TableHead>Current Cash</TableHead>
                      <TableHead>Portfolio Value</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {angelLeaderboard.map((angel, index) => (
                      <TableRow key={angel.participant_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>Anonymous Angel #{index + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              Angel
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(angel.initial_budget)}</TableCell>
                        <TableCell>{formatCurrency(angel.current_cash)}</TableCell>
                        <TableCell>{formatCurrency(angel.portfolio_value)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(angel.total_value)}
                        </TableCell>
                        <TableCell>
                          <div className={`font-semibold ${
                            (angel.roi_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercentage(angel.roi_percentage)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {angelLeaderboard.length === 0 && (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No angels yet</h3>
                    <p className="text-muted-foreground">
                      Angel investors will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vcs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  VCs by ROI Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Initial Budget</TableHead>
                      <TableHead>Current Cash</TableHead>
                      <TableHead>Portfolio Value</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vcLeaderboard.map((vc, index) => (
                      <TableRow key={vc.participant_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>Anonymous VC #{index + 1}</span>
                            <Badge variant="outline" className="text-xs bg-primary/10">
                              VC
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(vc.initial_budget)}</TableCell>
                        <TableCell>{formatCurrency(vc.current_cash)}</TableCell>
                        <TableCell>{formatCurrency(vc.portfolio_value)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(vc.total_value)}
                        </TableCell>
                        <TableCell>
                          <div className={`font-semibold ${
                            (vc.roi_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercentage(vc.roi_percentage)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {vcLeaderboard.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No VCs yet</h3>
                    <p className="text-muted-foreground">
                      Venture capitalists will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}