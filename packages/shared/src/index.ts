// Domain types for OpenMarket

// ============================================================
// Core Entities
// ============================================================

/** The person/team behind an agent who configures it and receives income */
export interface Owner {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The market-facing actor that gets listed, hired, evaluated, and paid */
export interface Agent {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  endpointUrl: string | null;
  tags: string[];
  pricingModel: PricingModel;
  pricingAmount: number;
  status: AgentStatus;
  totalTransactions: number;
  totalEarnings: number;
  avgRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export type PricingModel = "per-task" | "hourly" | "monthly" | "custom";
export type AgentStatus = "draft" | "listed" | "paused" | "suspended";

// ============================================================
// Wallet & Credits
// ============================================================

export interface Wallet {
  id: string;
  ownerId: string;
  balance: number;
  frozen: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletEvent {
  id: string;
  walletId: string;
  type: WalletEventType;
  amount: number;
  balanceAfter: number;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export type WalletEventType =
  | "topup"
  | "freeze"
  | "release"
  | "refund"
  | "commission"
  | "earn";

// ============================================================
// Transactions (Escrow)
// ============================================================

export interface Transaction {
  id: string;
  buyerOwnerId: string;
  sellerOwnerId: string;
  agentId: string;
  amount: number;
  commission: number;
  sellerPayout: number;
  status: TransactionStatus;
  description: string | null;
  metadata: Record<string, unknown> | null;
  expiresAt: string;
  deliveredAt: string | null;
  completedAt: string | null;
  disputedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus =
  | "escrowed"
  | "delivered"
  | "completed"
  | "disputed"
  | "refunded"
  | "expired"
  | "cancelled";

export interface TransactionEvent {
  id: string;
  transactionId: string;
  eventType: string;
  actorType: "buyer" | "seller" | "system";
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================================
// API Keys
// ============================================================

/** Public view of an API key (never includes the actual key) */
export interface ApiKey {
  id: string;
  ownerId: string;
  keyPrefix: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

// ============================================================
// Reviews
// ============================================================

export interface Review {
  id: string;
  transactionId: string;
  agentId: string;
  reviewerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// ============================================================
// Bounties (Job Requests)
// ============================================================

export interface Bounty {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  budget: number;
  tags: string[];
  status: BountyStatus;
  createdAt: string;
  updatedAt: string;
}

export type BountyStatus = "open" | "in_progress" | "completed" | "closed";

export interface BountyApplication {
  id: string;
  bountyId: string;
  agentId: string;
  ownerId: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

/** POST /api/bounties */
export interface CreateBountyRequest {
  title: string;
  description: string;
  budget: number;
  tags?: string[];
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** POST /api/agents */
export interface CreateAgentRequest {
  name: string;
  description: string;
  longDescription?: string;
  endpointUrl?: string;
  tags?: string[];
  pricingModel: PricingModel;
  pricingAmount: number;
}

/** POST /api/transactions */
export interface CreateTransactionRequest {
  agentId: string;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
  ttlHours?: number;
}

/** POST /api/transactions/:id/confirm */
export interface ConfirmTransactionRequest {
  rating?: number;
  comment?: string;
}

/** POST /api/transactions/:id/dispute */
export interface DisputeTransactionRequest {
  reason: string;
}

// ============================================================
// Constants
// ============================================================

export const COMMISSION_RATE = 0.20;
export const DEFAULT_TTL_HOURS = 72;
export const MIN_TOPUP_CREDITS = 1000;
export const CREDITS_PER_DOLLAR = 100;
