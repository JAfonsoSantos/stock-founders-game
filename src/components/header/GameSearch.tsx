import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/hooks/useI18n";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GameSearchResult {
  id: string;
  name: string;
  status: string;
  currency: string;
}

export function GameSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchGames(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const searchGames = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Check if it's a game ID or URL
      const gameIdMatch = searchQuery.match(/games\/([a-f0-9-]+)/i) || 
                         searchQuery.match(/^[a-f0-9-]{36}$/i);
      
      if (gameIdMatch) {
        const gameId = gameIdMatch[1] || gameIdMatch[0];
        const { data } = await supabase
          .from('games')
          .select('id, name, status, currency')
          .eq('id', gameId)
          .single();
        
        if (data) {
          setResults([data]);
          setLoading(false);
          return;
        }
      }

      // Search by name or description
      const { data } = await supabase
        .from('games')
        .select('id, name, status, currency')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    try {
      navigate(`/join/${gameId}`);
      setOpen(false);
      setQuery("");
    } catch (error) {
      toast.error(t('search.joinError'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pre_market': return 'text-yellow-600';
      case 'open': return 'text-green-600';
      case 'closed': return 'text-red-600';
      case 'results': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="pl-10 bg-white text-gray-900 placeholder:text-gray-500"
        />
      </div>
      {open && (query.length >= 2 || loading) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-input rounded-md shadow-lg">
          <Command shouldFilter={false}>
            <CommandList>
              {loading && (
                <div className="p-4 text-center text-muted-foreground">
                  {t('common.loading')}
                </div>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <CommandEmpty>{t('search.noResults')}</CommandEmpty>
              )}
              {!loading && results.length > 0 && (
                <CommandGroup>
                  {results.map((game) => (
                    <CommandItem
                      key={game.id}
                      value={game.id}
                      onSelect={() => handleJoinGame(game.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{game.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {game.currency} • 
                          <span className={`ml-1 ${getStatusColor(game.status)}`}>
                            {game.status.replace('_', ' ')}
                          </span>
                        </span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}