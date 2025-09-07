import { z } from "zod";

// Email validation
export const emailSchema = z.string().email("Invalid email address");

// URL validation
export const urlSchema = z.string().url("Invalid URL format").optional().or(z.literal(""));

// LinkedIn URL validation
export const linkedinUrlSchema = z.string()
  .optional()
  .refine(
    (url) => !url || url === "" || url.includes("linkedin.com"),
    "Must be a valid LinkedIn URL"
  );

// Website URL validation
export const websiteUrlSchema = z.string()
  .optional()
  .refine(
    (url) => !url || url === "" || url.startsWith("http"),
    "Must start with http:// or https://"
  );

// Price validation
export const priceSchema = z.number()
  .positive("Price must be positive")
  .max(1000000, "Price is too high");

// Quantity validation
export const quantitySchema = z.number()
  .int("Quantity must be a whole number")
  .positive("Quantity must be positive")
  .max(10000, "Quantity is too high");

// Game name validation
export const gameNameSchema = z.string()
  .min(3, "Name must be at least 3 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z0-9\s\-_]+$/, "Name can only contain letters, numbers, spaces, hyphens, and underscores");

// Startup name validation
export const startupNameSchema = z.string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters");

// Description validation
export const descriptionSchema = z.string()
  .max(500, "Description must be less than 500 characters")
  .optional();

// Budget validation
export const budgetSchema = z.number()
  .positive("Budget must be positive")
  .max(10000000, "Budget is too high");

// Validation helpers
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validateUrl = (url: string): boolean => {
  if (!url || url === "") return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateLinkedInUrl = (url: string): boolean => {
  if (!url || url === "") return true;
  return url.includes("linkedin.com") && validateUrl(url);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};

export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const validateFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  return allowedTypes.includes(file.type);
};

// Circuit breaker validation
export const isCircuitBreakerTriggered = (oldPrice: number, newPrice: number, threshold: number = 200): boolean => {
  if (oldPrice === 0) return false;
  const percentChange = Math.abs((newPrice - oldPrice) / oldPrice * 100);
  return percentChange > threshold;
};