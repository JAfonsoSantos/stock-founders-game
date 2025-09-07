import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn("text-center", className)}>
      <CardContent className="pt-8 pb-8">
        {icon && (
          <div className="flex justify-center mb-4">
            {icon}
          </div>
        )}
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="mb-4">
          {description}
        </CardDescription>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Common empty states
export function NoDataEmptyState({ 
  title = "No data available", 
  description = "There's nothing to show here yet.",
  action
}: Omit<EmptyStateProps, 'icon'> & { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">📊</div>}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function NoResultsEmptyState({ 
  title = "No results found", 
  description = "Try adjusting your search or filters.",
  action
}: Omit<EmptyStateProps, 'icon'> & { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">🔍</div>}
      title={title}
      description={description}
      action={action}
    />
  );
}