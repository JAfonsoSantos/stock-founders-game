import { useState, useCallback } from "react";
import { toast } from "sonner";

export type ErrorSeverity = "info" | "warning" | "error";

interface ErrorDetails {
  message: string;
  severity: ErrorSeverity;
  code?: string;
  details?: any;
}

export function useErrorHandler() {
  const [lastError, setLastError] = useState<ErrorDetails | null>(null);

  const handleError = useCallback((error: any, customMessage?: string) => {
    let errorDetails: ErrorDetails;

    // Handle different error types
    if (error?.message) {
      // Standard Error object
      errorDetails = {
        message: customMessage || error.message,
        severity: "error",
        code: error.code,
        details: error
      };
    } else if (typeof error === 'string') {
      // String error
      errorDetails = {
        message: customMessage || error,
        severity: "error"
      };
    } else if (error?.error) {
      // Supabase error format
      errorDetails = {
        message: customMessage || error.error.message || "An error occurred",
        severity: "error",
        code: error.error.code,
        details: error.error
      };
    } else {
      // Unknown error format
      errorDetails = {
        message: customMessage || "An unexpected error occurred",
        severity: "error",
        details: error
      };
    }

    setLastError(errorDetails);

    // Show toast notification
    if (errorDetails.severity === "error") {
      toast.error(errorDetails.message);
    } else {
      toast(errorDetails.message);
    }

    // Log error for debugging
    console.error("Error handled:", errorDetails);

    return errorDetails;
  }, []);

  const handleWarning = useCallback((message: string, details?: any) => {
    const warningDetails: ErrorDetails = {
      message,
      severity: "warning",
      details
    };

    setLastError(warningDetails);

    toast.warning(message);

    console.warn("Warning:", warningDetails);
    return warningDetails;
  }, []);

  const handleInfo = useCallback((message: string, details?: any) => {
    const infoDetails: ErrorDetails = {
      message,
      severity: "info",
      details
    };

    setLastError(infoDetails);

    toast.info(message);

    console.info("Info:", infoDetails);
    return infoDetails;
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const getErrorTitle = (severity: ErrorSeverity): string => {
    switch (severity) {
      case "error": return "Error";
      case "warning": return "Warning";
      case "info": return "Information";
      default: return "Notice";
    }
  };

  // Utility function to handle async operations with error handling
  const handleAsync = useCallback(async (
    operation: () => Promise<any>,
    errorMessage?: string
  ): Promise<any | null> => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, errorMessage);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleWarning,
    handleInfo,
    clearError,
    handleAsync,
    lastError
  };
}