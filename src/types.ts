/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GoldType = 'AU9999' | 'AUTD';

export interface GoldQuote {
  type: GoldType;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  lastSettlement: number;
  change: number; // absolute change in CNY
  changePercent: number; // percentage change
  volume: number;
  time: string;
  buy1?: number; // buy 1 price
  sell1?: number; // sell 1 price
  history1D: number[]; // Tick prices for 1 Day
  history1DTime?: string[]; // Timestamps for 1 Day ticks (e.g., "20:01")
  history1W: number[]; // Daily closing prices for 1 Week
  history1M: number[]; // Daily closing prices for 1 Month
}

export type AlertCriteria = 'ABOVE' | 'BELOW' | 'SURGE_1M' | 'DROP_1M' | 'SURGE_5M' | 'DROP_5M';

export interface SmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  secure?: boolean;
}

export interface AlertRule {
  id: string;
  goldType: GoldType;
  criteria: AlertCriteria;
  targetValue: number; // Price threshold or fluctuation percentage
  active: boolean;
  isTriggered: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
}

export interface TriggerLog {
  id: string;
  ruleId: string;
  goldType: GoldType;
  criteria: AlertCriteria;
  targetValue: number;
  triggeredPrice: number;
  timestamp: number;
}

export interface GoldHolding {
  id: string;
  goldType: GoldType;
  weight: number; // in grams
  buyPrice: number; // in CNY/gram
  label: string; // custom label for holding
}

export interface MarketNews {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}
