import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, User, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: string;
  payload: any; // Use any for flexibility with Supabase Json type
  status: string;
  created_at: string;
}

interface OrganizerNotificationsProps {
  gameId: string;
}

export function OrganizerNotifications({ gameId }: OrganizerNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Set up realtime subscription for notifications
    const channel = supabase
      .channel('organizer-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `type=eq.participant_approval_request`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const fetchNotifications = async () => {
    try {
      // Get organizer's participant record for this game
      const { data: participantData } = await supabase
        .from('participants')
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user?.id)
        .single();

      if (!participantData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('to_participant_id', participantData.id)
        .eq('type', 'participant_approval_request')
        .eq('status', 'unread')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (notificationId: string, action: 'approve' | 'reject') => {
    setActionLoading(notificationId);
    
    try {
      const { data, error } = await supabase.rpc('approve_reject_participant', {
        p_notification_id: notificationId,
        p_action: action
      }) as { data: any; error: any };

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data?.message || `Participant ${action}d successfully`);
      
      // Remove notification from list
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
    } catch (error: any) {
      toast.error('Failed to ' + action + ' participant: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'vc': return 'bg-purple-100 text-purple-800';
      case 'angel': return 'bg-yellow-100 text-yellow-800';
      case 'founder': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">No pending participant approvals</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Participant Approvals
          <Badge variant="secondary" className="ml-2">
            {notifications.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          New participants waiting for approval to join your game
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    {notification.payload?.user_name || 'Unknown User'}
                  </span>
                  <Badge 
                    className={getRoleBadgeColor(notification.payload?.role || 'founder')}
                  >
                    {(notification.payload?.role || 'founder').toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Mail className="h-3 w-3" />
                  {notification.payload?.user_email || 'No email'}
                </div>
                
                <p className="text-sm text-gray-600">
                  Budget: ${(notification.payload?.initial_budget || 0).toLocaleString()}
                </p>
                
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleApproveReject(notification.id, 'approve')}
                  disabled={actionLoading === notification.id}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleApproveReject(notification.id, 'reject')}
                  disabled={actionLoading === notification.id}
                >
                  <X className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}