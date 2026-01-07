/**
 * Utility Functions
 *
 * Common utility functions used throughout the application
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to locale format
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

/**
 * Format a datetime string to locale format
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}

/**
 * Convert DocType name to URL slug
 * e.g., "Guardian Invite" -> "guardian-invite"
 */
export function doctypeToSlug(doctype: string): string {
  return doctype.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Convert URL slug to DocType name
 * e.g., "guardian-invite" -> "Guardian Invite"
 */
export function slugToDoctype(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
