import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

export function AdminDeleteUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar utilizadores');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(user => user.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedUsers.size === 0) return;

    setDeleting(true);
    try {
      // Delete participants first (to avoid foreign key constraints)
      const { error: participantsError } = await supabase
        .from('participants')
        .delete()
        .in('user_id', Array.from(selectedUsers));

      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
      }

      // Then delete users
      const { error: usersError } = await supabase
        .from('users')
        .delete()
        .in('id', Array.from(selectedUsers));

      if (usersError) throw usersError;

      toast.success(`${selectedUsers.size} utilizadores eliminados com sucesso`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Erro ao eliminar utilizadores');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const getUserName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || 'Sem nome';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Eliminar Utilizadores</h2>
          <p className="text-muted-foreground">Selecione os utilizadores que deseja eliminar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Utilizadores</CardTitle>
              <CardDescription>
                {users.length} utilizadores encontrados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={toggleAll}
                disabled={users.length === 0}
                size="sm"
              >
                {selectedUsers.size === users.length ? 'Desseleccionar todos' : 'Seleccionar todos'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                disabled={selectedUsers.size === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar ({selectedUsers.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={selectedUsers.has(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{getUserName(user)}</p>
                    {user.email && (
                      <p className="text-sm text-muted-foreground">({user.email})</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Criado em: {new Date(user.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum utilizador encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Eliminação"
        description={`Tem a certeza que deseja apagar ${selectedUsers.size} utilizadores? Esta acção não pode ser desfeita.`}
        confirmText={deleting ? "A eliminar..." : "Sim, eliminar"}
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}