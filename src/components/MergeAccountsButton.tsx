import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mergeAccounts } from "@/utils/mergeAccounts";
import { useAuth } from "@/hooks/useAuth";

export function MergeAccountsButton() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!user?.email) return null;

  const handleMergeAccounts = async () => {
    if (!confirm(`Corrigir o acesso aos jogos para ${user.email}?`)) return;

    setLoading(true);
    try {
      await mergeAccounts(user.id, user.email);
      toast.success("Contas unificadas! A recarregar...");
      setTimeout(() => window.location.reload(), 600);
    } catch (error: any) {
      console.error("Error merging accounts:", error);
      toast.error("Erro ao corrigir contas: " + (error?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleMergeAccounts} disabled={loading} variant="outline">
      {loading ? "A corrigir..." : "Corrigir acesso aos jogos"}
    </Button>
  );
}