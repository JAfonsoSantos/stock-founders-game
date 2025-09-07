import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface SecondaryTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  startupId: string;
  startupName: string;
  maxQuantity: number;
}

export function SecondaryTradeModal({ 
  isOpen, 
  onClose, 
  gameId, 
  startupId, 
  startupName,
  maxQuantity 
}: SecondaryTradeModalProps) {
  const [buyerEmail, setBuyerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pricePerShare, setPricePerShare] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!buyerEmail || quantity <= 0 || pricePerShare <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos corretamente",
        variant: "destructive"
      });
      return;
    }

    if (quantity > maxQuantity) {
      toast({
        title: "Erro", 
        description: `Quantidade máxima disponível: ${maxQuantity}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_secondary_trade_request', {
        p_game_id: gameId,
        p_startup_id: startupId,
        p_buyer_email: buyerEmail,
        p_qty: quantity,
        p_price_per_share: pricePerShare
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data && data.error) {
        toast({
          title: "Erro",
          description: data.error as string,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Pedido de venda enviado com sucesso!"
      });

      onClose();
      setBuyerEmail("");
      setQuantity(1);
      setPricePerShare(0);
    } catch (error) {
      console.error('Error creating secondary trade request:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pedido de venda",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vender Ações - {startupName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="buyer">Email/Nome do Comprador</Label>
            <Input
              id="buyer"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="email@example.com ou Nome do Participante"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            <p className="text-sm text-muted-foreground">
              Máximo: {maxQuantity} ações
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Preço por Ação</Label>
            <Input
              id="price"
              type="number"
              min="0.01"
              step="0.01"
              value={pricePerShare}
              onChange={(e) => setPricePerShare(parseFloat(e.target.value) || 0)}
            />
          </div>
          {quantity > 0 && pricePerShare > 0 && (
            <div className="text-sm">
              <p><strong>Total: ${(quantity * pricePerShare).toFixed(2)}</strong></p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}