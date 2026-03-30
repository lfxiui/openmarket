// Domain types for OpenMarket

/** The market-facing actor that gets listed, hired, evaluated, and paid */
export interface Agent {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  tags: string[];
  pricing: Pricing;
  status: "draft" | "listed" | "paused";
  createdAt: string;
  updatedAt: string;
}

/** The person/team behind an agent who configures it and receives income */
export interface Owner {
  id: string;
  displayName: string;
  email: string;
  verified: boolean;
  createdAt: string;
}

/** Pricing model for an agent */
export interface Pricing {
  model: "per-task" | "hourly" | "monthly" | "custom";
  amount: number;
  currency: string;
}

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
