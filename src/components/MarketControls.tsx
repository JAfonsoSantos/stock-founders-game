import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Mail, Users, TrendingUp, Pause } from "lucide-react";

interface MarketControlsProps {
  gameId: string;
  gameName: string;
  gameStatus: string;
  allowSecondary: boolean;
  onStatusChange: () => void;
}

export default function MarketControls({ 
  gameId, 
  gameName, 
  gameStatus, 
  allowSecondary, 
  onStatusChange 
}: MarketControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const sendMarketEmail = async (type: 'open' | 'last_minutes' | 'results') => {
    setLoading(type);
    
    try {
      // Get participant emails
      const { data: participants, error } = await supabase
        .from("participants")
        .select(`
          users (
            first_name,
            last_name
          )
        `)
        .eq("game_id", gameId);

      if (error) throw error;

      // For demo purposes, just show success
      toast.success(`${type.replace('_', ' ')} email notifications would be sent to ${participants?.length || 0} participants`);
    } catch (error: any) {
      toast.error("Failed to send emails: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  const emergencyPause = async () => {
    setLoading('pause');
    
    try {
      const { error } = await supabase
        .from("games")
        .update({ status: 'closed' })
        .eq("id", gameId);

      if (error) throw error;

      toast.success("Market paused for emergency!");
      onStatusChange();
    } catch (error: any) {
      toast.error("Failed to pause market: " + error.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Market Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Controls */}
        <div>
          <h4 className="font-medium mb-2">Email Notifications</h4>
          <div className="flex flex-wrap gap-2">
            {gameStatus === 'pre_market' && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => sendMarketEmail('open')}
                disabled={loading === 'open'}
              >
                <Mail className="h-4 w-4 mr-2" />
                Market Open Alert
              </Button>
            )}
            {gameStatus === 'open' && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => sendMarketEmail('last_minutes')}
                disabled={loading === 'last_minutes'}
              >
                <Mail className="h-4 w-4 mr-2" />
                Last 10 Minutes
              </Button>
            )}
            {gameStatus === 'closed' && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => sendMarketEmail('results')}
                disabled={loading === 'results'}
              >
                <Mail className="h-4 w-4 mr-2" />
                Final Results
              </Button>
            )}
          </div>
        </div>

        {/* Emergency Controls */}
        {gameStatus === 'open' && (
          <div>
            <h4 className="font-medium mb-2">Emergency Controls</h4>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Pause
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Emergency Market Pause</DialogTitle>
                  <DialogDescription>
                    This will immediately close the market and stop all trading. 
                    This action should only be used in emergency situations.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    variant="destructive" 
                    onClick={emergencyPause}
                    disabled={loading === 'pause'}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Market
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Secondary Market:</span>
              <p className="font-medium">{allowSecondary ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Game Status:</span>
              <p className="font-medium capitalize">{gameStatus.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}