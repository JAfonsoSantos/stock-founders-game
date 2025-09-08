import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const satisfiedCount = Object.values(requirements).filter(Boolean).length;
  
  let score = 0;
  let label = "";
  let color = "";

  if (password.length === 0) {
    score = 0;
    label = "";
    color = "bg-muted";
  } else if (satisfiedCount <= 1) {
    score = 20;
    label = "weak";
    color = "bg-destructive";
  } else if (satisfiedCount <= 2) {
    score = 40;
    label = "weak";
    color = "bg-destructive";
  } else if (satisfiedCount <= 3) {
    score = 60;
    label = "medium";
    color = "bg-yellow-500";
  } else if (satisfiedCount <= 4) {
    score = 80;
    label = "medium";
    color = "bg-yellow-500";
  } else {
    score = 100;
    label = "strong";
    color = "bg-green-500";
  }

  return { score, label, color, requirements };
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-32">
            <Progress value={strength.score} className="h-2" />
            <div 
              className={cn("absolute inset-0 h-2 rounded-full transition-all", strength.color)}
              style={{ width: `${strength.score}%` }}
            />
          </div>
          {strength.label && (
            <span className={cn(
              "text-xs font-medium",
              strength.label === "weak" && "text-destructive",
              strength.label === "medium" && "text-yellow-600 dark:text-yellow-500",
              strength.label === "strong" && "text-green-600 dark:text-green-500"
            )}>
              {strength.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}