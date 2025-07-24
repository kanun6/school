import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateGrade(score: number | null | undefined): string {
    if (score === null || score === undefined || isNaN(score)) return '-';
    if (score < 0 || score > 100) return 'N/A';
    if (score >= 80) return '4';
    if (score >= 75) return '3.5';
    if (score >= 70) return '3';
    if (score >= 65) return '2.5';
    if (score >= 60) return '2';
    if (score >= 55) return '1.5';
    if (score >= 50) return '1';
    return '0';
}