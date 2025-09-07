import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useI18n, SUPPORTED_LOCALES } from "@/hooks/useI18n";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  
  const currentLocale = SUPPORTED_LOCALES.find(l => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe className="h-4 w-4 mr-2" />
          {currentLocale?.flag} {currentLocale?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((localeOption) => (
          <DropdownMenuItem
            key={localeOption.code}
            onClick={() => setLocale(localeOption.code as any)}
            className={locale === localeOption.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{localeOption.flag}</span>
            {localeOption.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}