import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Check, X } from "lucide-react";
import { useNotificationUpdates } from "@/hooks/useRealtime";

interface NotificationCenterProps {
  participantId: string;
  gameId: string;
}

export function NotificationCenter({ participantId, gameId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Real-time notifications
  useNotificationUpdates(participantId, (newNotification) => {
    setNotifications(prev => [newNotification, ...prev]);
  });

  // Fetch existing notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('to_participant_id', participantId)
        .eq('status', 'unread')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    };

    if (participantId) {
      fetchNotifications();
    }
  }, [participantId]);

  const handleAcceptTrade = async (notificationId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_secondary_trade', {
        p_notification_id: notificationId
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
        description: "Trade aceito com sucesso!"
      });

      // Remove notification from list
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error accepting trade:', error);
      toast({
        title: "Erro",
        description: "Erro ao aceitar trade",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectTrade = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'rejected' })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Rejeitado",
        description: "Pedido de trade rejeitado"
      });

      // Remove notification from list
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error rejecting trade:', error);
    }
  };

  const formatTradeRequest = (payload: any) => {
    return `Pedido para comprar ${payload.qty} ações por $${payload.price_per_share} cada`;
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações
          {notifications.length > 0 && (
            <Badge variant="destructive">{notifications.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="border rounded-lg p-3">
            {notification.type === 'secondary_trade_request' && (
              <div className="space-y-2">
                <p className="text-sm">
                  {formatTradeRequest(notification.payload)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptTrade(notification.id)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectTrade(notification.id)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}