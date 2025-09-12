import { Bell, X, CheckCircle, AlertCircle, TrendingUp, Users, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  payload: any;
  status: string;
  created_at: string;
  game_id?: string;
  to_participant_id: string;
  from_participant_id?: string;
}

const getNotificationIcon = (type: string) => {
  if (type.includes('trade')) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  } else if (type.includes('game')) {
    return <Calendar className="h-4 w-4 text-blue-500" />;
  } else if (type.includes('winner')) {
    return <CheckCircle className="h-4 w-4 text-yellow-500" />;
  } else if (type.includes('transfer')) {
    return <Users className="h-4 w-4 text-purple-500" />;
  }
  return <AlertCircle className="h-4 w-4 text-gray-500" />;
};

const getNotificationColor = (type: string) => {
  if (type.includes('trade')) {
    return 'border-l-green-500 bg-green-50/50';
  } else if (type.includes('game')) {
    return 'border-l-blue-500 bg-blue-50/50';
  } else if (type.includes('winner')) {
    return 'border-l-yellow-500 bg-yellow-50/50';
  } else if (type.includes('transfer')) {
    return 'border-l-purple-500 bg-purple-50/50';
  }
  return 'border-l-gray-500 bg-gray-50/50';
};

const getNotificationContent = (notification: Notification) => {
  const { type, payload } = notification;
  
  if (type === 'trade_request') {
    return {
      title: 'Trade Request',
      message: `${payload?.from_name || 'Someone'} wants to buy ${payload?.qty || 0} shares of ${payload?.startup_name || 'a startup'} for ${payload?.price_per_share || 0} per share`
    };
  } else if (type === 'game_opened') {
    return {
      title: 'Game Started!',
      message: `The game "${payload?.game_name || 'Startup Stock Market'}" is now open for trading!`
    };
  } else if (type === 'game_closed') {
    return {
      title: 'Game Ended',
      message: `The game "${payload?.game_name || 'Startup Stock Market'}" has ended. Check the results!`
    };
  } else if (type === 'trade_accepted') {
    return {
      title: 'Trade Accepted',
      message: `Your trade for ${payload?.qty || 0} shares has been accepted!`
    };
  } else if (type === 'order_accepted') {
    return {
      title: 'Order Accepted',
      message: `Your investment order has been accepted by ${payload?.startup_name || 'the startup'}!`
    };
  }
  
  return {
    title: 'Notification',
    message: payload?.message || 'You have a new notification'
  };
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Load existing notifications
    loadNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          if (newNotification.to_participant_id === user.id) {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            const content = getNotificationContent(newNotification);
            // Show toast for new notification
            toast(content.title, {
              description: content.message,
              action: {
                label: "View",
                onClick: () => setOpen(true),
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // Get current participant ID for the user
      const { data: participants } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id);

      if (!participants || participants.length === 0) return;

      const participantIds = participants.map(p => p.id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .in('to_participant_id', participantIds)
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, status: 'read' } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const notificationIds = notifications
        .filter(n => n.status === 'unread')
        .map(n => n.id);

      if (notificationIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .in('id', notificationIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const wasUnread = notifications.find(n => n.id === notificationId)?.status === 'unread';
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 rounded-full border-2 border-border/20 hover:border-border/30 transition-colors"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-foreground text-xs animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${getNotificationColor(notification.type)} ${
                      notification.status === 'unread' ? 'bg-blue-50/30' : 'bg-white'
                    }`}
                    onClick={() => notification.status === 'unread' && markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                            {getNotificationContent(notification).title}
                          </h4>
                          <div className="flex items-center gap-1 ml-2">
                            {notification.status === 'unread' && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {getNotificationContent(notification).message}
                        </p>
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}