import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Startup {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  game_id: string;
}

export function AdminDeleteStartups() {
  const navigate = useNavigate();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartups, setSelectedStartups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      // Use admin function to get ALL startups
      const { data, error } = await supabase
        .rpc('get_all_startups_admin');

      if (error) throw error;
      setStartups(data || []);
    } catch (error) {
      console.error('Error fetching startups:', error);
      toast.error('Erro ao carregar startups');
    } finally {
      setLoading(false);
    }
  };

  const toggleStartup = (startupId: string) => {
    const newSelected = new Set(selectedStartups);
    if (newSelected.has(startupId)) {
      newSelected.delete(startupId);
    } else {
      newSelected.add(startupId);
    }
    setSelectedStartups(newSelected);
  };

  const toggleAll = () => {
    if (selectedStartups.size === startups.length) {
      setSelectedStartups(new Set());
    } else {
      setSelectedStartups(new Set(startups.map(startup => startup.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedStartups.size === 0) return;

    setDeleting(true);
    try {
      // Use admin function to delete startups
      const { data, error } = await supabase
        .rpc('admin_delete_startups', { 
          startup_ids: Array.from(selectedStartups) 
        });

      if (error) throw error;
      
      const result = data as { error?: string; success?: boolean };
      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success(`${selectedStartups.size} startups eliminadas com sucesso`);
      setSelectedStartups(new Set());
      fetchStartups();
    } catch (error) {
      console.error('Error deleting startups:', error);
      toast.error('Erro ao eliminar startups');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
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
          <h2 className="text-2xl font-bold">Eliminar Startups</h2>
          <p className="text-muted-foreground">Selecione as startups que deseja eliminar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Startups</CardTitle>
              <CardDescription>
                {startups.length} startups encontradas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={toggleAll}
                disabled={startups.length === 0}
                size="sm"
              >
                {selectedStartups.size === startups.length ? 'Desseleccionar todas' : 'Seleccionar todas'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                disabled={selectedStartups.size === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar ({selectedStartups.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {startups.map((startup) => (
              <div key={startup.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={selectedStartups.has(startup.id)}
                  onCheckedChange={() => toggleStartup(startup.id)}
                />
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {startup.logo_url ? (
                    <img 
                      src={startup.logo_url} 
                      alt={startup.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{startup.name}</p>
                      <p className="text-sm text-muted-foreground">({startup.slug})</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criada em: {new Date(startup.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {startups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma startup encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Eliminação"
        description={`Tem a certeza que deseja apagar ${selectedStartups.size} startups? Esta acção não pode ser desfeita.`}
        confirmText={deleting ? "A eliminar..." : "Sim, eliminar"}
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}