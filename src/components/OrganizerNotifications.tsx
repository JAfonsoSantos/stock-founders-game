import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Check, X, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationPayload {
  participant_id: string;
  user_name: string;
  user_email: string;
  role: string;
  initial_budget: number;
}

interface Notification {
  id: string;
  type: string;
  status: string;
  created_at: string;
  payload: NotificationPayload;
}

interface OrganizerNotificationsProps {
  gameId: string;
}

export function OrganizerNotifications({ gameId }: OrganizerNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time notifications
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
        (payload) => {
          if (payload.new.game_id === gameId) {
            fetchNotifications();
          }
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
        .from("participants")
        .select("id")
        .eq("game_id", gameId)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!participantData) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("to_participant_id", participantData.id)
        .eq("type", "participant_approval_request")
        .eq("status", "unread")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData: Notification[] = (data || []).map(item => ({
        ...item,
        payload: item.payload as unknown as NotificationPayload
      }));
      
      setNotifications(typedData);
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error.message);
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
      });

      if (error) throw error;
      
      // Handle the response from the RPC function
      const response = data as any;
      if (response?.error) {
        toast.error(response.error);
        return;
      }

      toast.success(response?.message || `Participant ${action}ed successfully`);
      
      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
    } catch (error: any) {
      toast.error("Failed to " + action + " participant: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'vc': return 'bg-purple-100 text-purple-800';
      case 'angel': return 'bg-yellow-100 text-yellow-800';
      case 'founder': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border-gray-100">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="bg-white shadow-sm border-gray-100">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No pending participant approvals</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-gray-100">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl flex items-center gap-3 text-gray-900">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Bell className="h-6 w-6 text-orange-600" />
          </div>
          Pending Approvals
          {notifications.length > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review and approve new participants who want to join your game
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-800 text-sm font-medium">
                  {getInitials(notification.payload.user_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900">
                    {notification.payload.user_name}
                  </p>
                  <Badge className={getRoleColor(notification.payload.role)}>
                    {notification.payload.role.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {notification.payload.user_email} • {notification.payload.initial_budget.toLocaleString()} budget
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApproveReject(notification.id, 'reject')}
                disabled={actionLoading === notification.id}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleApproveReject(notification.id, 'approve')}
                disabled={actionLoading === notification.id}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}