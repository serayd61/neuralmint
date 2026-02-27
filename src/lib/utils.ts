import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format microSTX to human-readable STX
 * 1 STX = 1,000,000 microSTX
 */
export function formatStx(microStx: number | bigint, decimals = 2): string {
  const stx = Number(microStx) / 1_000_000;
  if (stx >= 1_000_000) return `${(stx / 1_000_000).toFixed(1)}M STX`;
  if (stx >= 1_000) return `${(stx / 1_000).toFixed(1)}K STX`;
  return `${stx.toFixed(decimals)} STX`;
}

/**
 * Format STX amount (already in STX, not micro)
 */
export function formatStxDisplay(stx: number, decimals = 2): string {
  if (stx >= 1_000_000) return `${(stx / 1_000_000).toFixed(1)}M`;
  if (stx >= 1_000) return `${(stx / 1_000).toFixed(1)}K`;
  return stx.toFixed(decimals);
}

/**
 * Truncate a Stacks address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Estimate time from block count
 * ~10 minutes per Stacks block
 */
export function formatBlockTime(blocks: number): string {
  const minutes = blocks * 10;
  if (minutes < 60) return `~${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `~${hours}h`;
  const days = Math.floor(hours / 24);
  return `~${days}d`;
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format percentage change
 */
export function formatPercentChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Get relative time string
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
