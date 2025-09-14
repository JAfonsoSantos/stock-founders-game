import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Venture {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  game_id: string;
  type: string;
}

export function AdminDeleteVentures() {
  const navigate = useNavigate();
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [selectedVentures, setSelectedVentures] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchVentures();
  }, []);

  const fetchVentures = async () => {
    try {
      // Use admin function to get ALL ventures
      const { data, error } = await supabase
        .rpc('get_all_ventures_admin');

      if (error) throw error;
      setVentures(data || []);
    } catch (error) {
      console.error('Error fetching ventures:', error);
      toast.error('Erro ao carregar ventures');
    } finally {
      setLoading(false);
    }
  };

  const toggleVenture = (ventureId: string) => {
    const newSelected = new Set(selectedVentures);
    if (newSelected.has(ventureId)) {
      newSelected.delete(ventureId);
    } else {
      newSelected.add(ventureId);
    }
    setSelectedVentures(newSelected);
  };

  const toggleAll = () => {
    if (selectedVentures.size === ventures.length) {
      setSelectedVentures(new Set());
    } else {
      setSelectedVentures(new Set(ventures.map(venture => venture.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedVentures.size === 0) return;

    setDeleting(true);
    try {
      // Use admin function to delete ventures
      const { data, error } = await supabase
        .rpc('admin_delete_ventures', { 
          venture_ids: Array.from(selectedVentures) 
        });

      if (error) throw error;
      
      const result = data as { error?: string; success?: boolean };
      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success(`${selectedVentures.size} ventures eliminadas com sucesso`);
      setSelectedVentures(new Set());
      fetchVentures();
    } catch (error) {
      console.error('Error deleting ventures:', error);
      toast.error('Erro ao eliminar ventures');
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
          <h2 className="text-2xl font-bold">Eliminar Ventures</h2>
          <p className="text-muted-foreground">Selecione as ventures que deseja eliminar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Ventures</CardTitle>
              <CardDescription>
                {ventures.length} ventures encontradas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={toggleAll}
                disabled={ventures.length === 0}
                size="sm"
              >
                {selectedVentures.size === ventures.length ? 'Desseleccionar todas' : 'Seleccionar todas'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                disabled={selectedVentures.size === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar ({selectedVentures.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ventures.map((venture) => (
              <div key={venture.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={selectedVentures.has(venture.id)}
                  onCheckedChange={() => toggleVenture(venture.id)}
                />
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {venture.logo_url ? (
                    <img 
                      src={venture.logo_url} 
                      alt={venture.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{venture.name}</p>
                      <p className="text-sm text-muted-foreground">({venture.slug})</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {venture.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criada em: {new Date(venture.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {ventures.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma venture encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirmar Eliminação"
        description={`Tem a certeza que deseja apagar ${selectedVentures.size} ventures? Esta acção não pode ser desfeita.`}
        confirmText={deleting ? "A eliminar..." : "Sim, eliminar"}
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}