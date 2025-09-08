import { useMemo } from "react";
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
  } else if (satisfiedCount <= 2 || password.length < 6) {
    score = 25;
    label = "weak";
    color = "bg-red-500";
  } else if (satisfiedCount <= 3) {
    score = 60;
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

  if (!password || password.length === 0) return null;

  return (
    <div className={cn("mt-2", className)}>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", strength.color)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
        {strength.label && (
          <span className={cn(
            "text-xs font-medium",
            strength.label === "weak" && "text-red-500",
            strength.label === "medium" && "text-yellow-500", 
            strength.label === "strong" && "text-green-500"
          )}>
            {strength.label}
          </span>
        )}
      </div>
    </div>
  );
}