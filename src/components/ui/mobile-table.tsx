import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MobileTableProps {
  data: any[];
  renderItem: (item: any, index: number) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
}

export function MobileTable({ data, renderItem, emptyState, className = "" }: MobileTableProps) {
  if (data.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={`space-y-2 sm:space-y-3 block sm:hidden ${className}`}>
      {data.map((item, index) => (
        <Card key={item.id || index} className="p-2 sm:p-3">
          {renderItem(item, index)}
        </Card>
      ))}
    </div>
  );
}

// Mobile-friendly position card for PlayerDashboard
export function MobilePositionCard({ position, gameId, onSellClick, formatCurrency, getPositionValue, getPositionPnL, portfolioUpdates, gameAllowsSecondary, navigate }: any) {
  const pnl = getPositionPnL(position);
  const pnlPercent = position.avg_cost > 0 ? (pnl / (position.qty_total * position.avg_cost)) * 100 : 0;
  
  return (
    <CardContent className="p-0">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-left"
            onClick={() => navigate(`/games/${gameId}/startup/${position.startups.slug}`)}
          >
            {position.startups.name}
          </Button>
          <Badge variant="outline">{position.qty_total} shares</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground block">Avg Cost</span>
            <span className="font-medium">{formatCurrency(position.avg_cost)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Current Price</span>
            <span className={`font-medium transition-colors ${
              portfolioUpdates[position.id] ? 'text-green-600' : ''
            }`}>
              {position.startups.last_vwap_price 
                ? formatCurrency(position.startups.last_vwap_price)
                : "No trades"
              }
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Market Value</span>
            <span className={`font-medium transition-colors ${
              portfolioUpdates[position.id] ? 'text-green-600' : ''
            }`}>
              {formatCurrency(getPositionValue(position))}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">P&L</span>
            <div className={`font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(pnl)}
              {pnl !== 0 && (
                <div className="text-xs">
                  ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                </div>
              )}
            </div>
          </div>
        </div>

        {gameAllowsSecondary && position.qty_total > 0 && (
          <div className="pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSellClick(position)}
              className="w-full"
            >
              Sell Shares
            </Button>
          </div>
        )}
      </div>
    </CardContent>
  );
}

// Mobile-friendly trade card
export function MobileTradeCard({ trade, participant, formatCurrency }: any) {
  const isBuy = trade.buyer_participant_id === participant.id;
  
  return (
    <CardContent className="p-0">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">{trade.startups?.name}</div>
          <Badge variant={isBuy ? "default" : "secondary"}>
            {isBuy ? "Buy" : "Sell"}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div>
            <span className="block">Date</span>
            <span>{new Date(trade.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="block">Shares</span>
            <span>{trade.qty}</span>
          </div>
          <div>
            <span className="block">Price</span>
            <span>{formatCurrency(trade.price_per_share)}</span>
          </div>
          <div>
            <span className="block">Total</span>
            <span className="font-medium text-foreground">
              {formatCurrency(trade.qty * trade.price_per_share)}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  );
}