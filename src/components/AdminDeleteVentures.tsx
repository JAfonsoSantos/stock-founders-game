import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Trash2, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchVentures();
  }, []);

  const fetchVentures = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_all_ventures_admin');

      if (error) {
        console.error("Error fetching ventures:", error);
        toast.error("Erro ao buscar ventures");
        return;
      }

      setVentures(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao buscar ventures");
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

    try {
      setDeleting(true);
      
      const ventureIds = Array.from(selectedVentures);
      const { data, error } = await supabase
        .rpc('admin_delete_ventures', { venture_ids: ventureIds });

      if (error) {
        console.error("Delete error:", error);
        toast.error("Erro ao eliminar ventures");
        return;
      }

      const result = data as { success?: boolean; deleted_count?: number; error?: string };
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`${result.deleted_count || selectedVentures.size} ventures eliminadas com sucesso`);
      setSelectedVentures(new Set());
      await fetchVentures();
      
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao eliminar ventures");
    } finally {
      setDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Administrar Ventures</h1>
        </div>

        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Building className="h-5 w-5" />
              Ventures do Sistema ({ventures.length})
            </CardTitle>
            <CardDescription className="text-gray-600">
              Gerir todas as ventures criadas no sistema. Use com cuidado - esta ação não pode ser desfeita.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ventures.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma venture encontrada</h3>
                <p className="text-gray-600">Não existem ventures no sistema no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedVentures.size === ventures.length && ventures.length > 0}
                      onCheckedChange={toggleAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                      Selecionar todas ({selectedVentures.size} de {ventures.length})
                    </label>
                  </div>
                  
                  <Button
                    variant="destructive"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={selectedVentures.size === 0 || deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        A eliminar...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar Selecionadas ({selectedVentures.size})
                      </>
                    )}
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg">
                  <div className="max-h-96 overflow-y-auto">
                    {ventures.map((venture) => (
                      <div
                        key={venture.id}
                        className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                      >
                        <Checkbox
                          id={`venture-${venture.id}`}
                          checked={selectedVentures.has(venture.id)}
                          onCheckedChange={() => toggleVenture(venture.id)}
                        />
                        
                        {venture.logo_url ? (
                          <img 
                            src={venture.logo_url} 
                            alt={venture.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                            <Building className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{venture.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Slug: {venture.slug}</span>
                            <span>Tipo: {venture.type}</span>
                            <span>Criado: {new Date(venture.created_at).toLocaleDateString('pt-PT')}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400 font-mono">
                          {venture.id.slice(0, 8)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="Confirmar Eliminação"
          description={`Tem a certeza que deseja eliminar ${selectedVentures.size} ventures? Esta ação não pode ser desfeita e eliminará também todas as trades, posições e ordens relacionadas.`}
          onConfirm={handleDelete}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
}