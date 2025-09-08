import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InvestModalProps {
  startup: {
    id: string;
    name: string;
    primary_shares_remaining: number;
    last_vwap_price: number | null;
  };
  participant: {
    id: string;
    current_cash: number;
  };
  gameId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvestModal({ startup, participant, gameId, onClose, onSuccess }: InvestModalProps) {
  const [quantity, setQuantity] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [loading, setLoading] = useState(false);

  const totalCost = Number(quantity) * Number(pricePerShare) || 0;
  const canAfford = totalCost <= participant.current_cash;
  const validQuantity = Number(quantity) > 0 && Number(quantity) <= startup.primary_shares_remaining;
  const validPrice = Number(pricePerShare) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validQuantity || !validPrice || !canAfford) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('create_primary_order', {
        p_game_id: gameId,
        p_startup_id: startup.id,
        p_qty: Number(quantity),
        p_price_per_share: Number(pricePerShare),
        p_auto_accept_min_price: null
      });

      if (error) {
        toast.error(error.message);
      } else if (data && typeof data === 'object' && 'error' in data && data.error) {
        toast.error(String(data.error));
      } else {
        toast.success("Investment order created successfully!");
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto mx-3 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Invest in {startup.name}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Available Cash</span>
                  <p className="font-semibold">${participant.current_cash.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Shares Available</span>
                  <p className="font-semibold">{startup.primary_shares_remaining}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Price</span>
                  <p className="font-semibold">
                    {startup.last_vwap_price ? `$${startup.last_vwap_price.toFixed(2)}` : "No trades yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={startup.primary_shares_remaining}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of shares"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Share ($)</Label>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                placeholder="Your bid price"
                required
              />
            </div>
          </div>

          {quantity && pricePerShare && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="font-semibold">${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Cash:</span>
                  <span className={`font-semibold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                    ${(participant.current_cash - totalCost).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading || !validQuantity || !validPrice || !canAfford}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}