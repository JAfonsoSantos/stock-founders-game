import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mergeAccounts } from "@/utils/mergeAccounts";

export function MergeAccountsButton() {
  const [loading, setLoading] = useState(false);

  const handleMergeAccounts = async () => {
    if (!confirm("Confirma que quer corrigir as contas duplicadas para jose.afonsosantos@gmail.com?")) {
      return;
    }

    setLoading(true);
    
    try {
      await mergeAccounts(
        "c0290938-4225-4e59-9776-eb25f5de2352", // old user with game participation
        "fe1ad7e5-7c72-43c6-be01-78437d8cfea7", // current logged in user
        "jose.afonsosantos@gmail.com"
      );
      
      toast.success("Contas corrigidas com sucesso! Atualize a página.");
    } catch (error: any) {
      console.error("Error merging accounts:", error);
      toast.error("Erro ao corrigir contas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleMergeAccounts} 
      disabled={loading}
      variant="outline"
    >
      {loading ? "Corrigindo..." : "Corrigir Contas Duplicadas"}
    </Button>
  );
}