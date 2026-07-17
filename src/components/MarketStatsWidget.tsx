/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GoldQuote } from '../types';
import { Activity, Gauge, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';

interface MarketStatsWidgetProps {
  au9999: GoldQuote;
  autd: GoldQuote;
}

export default function MarketStatsWidget({ au9999, autd }: MarketStatsWidgetProps) {
  // Helper to calculate statistics
  const calculateStats = (quote: GoldQuote) => {
    const high = quote.high || quote.price;
    const low = quote.low || quote.price;
    const lastSettlement = quote.lastSettlement || quote.open || 1;

    // 1. Amplitude (振幅) = (High - Low) / LastSettlement * 100%
    const absAmplitude = high - low;
    const pctAmplitude = lastSettlement > 0 ? (absAmplitude / lastSettlement) * 100 : 0;

    // 2. Intraday Volatility using standard deviation of history1D
    const history = quote.history1D || [];
    let stdDev = 0;
    let pctVolatility = 0; // Coefficient of Variation (变异系数) = stdDev / mean * 100%
    let mean = quote.price;

    if (history.length > 0) {
      const sum = history.reduce((acc, val) => acc + val, 0);
      mean = sum / history.length;
      const sqDiffSum = history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
      stdDev = Math.sqrt(sqDiffSum / history.length);
      pctVolatility = mean > 0 ? (stdDev / mean) * 100 : 0;
    } else {
      // Fallback estimate if history is not loaded yet
      stdDev = absAmplitude * 0.3;
      pctVolatility = mean > 0 ? (stdDev / mean) * 100 : 0;
    }

    return {
      absAmplitude: parseFloat(absAmplitude.toFixed(2)),
      pctAmplitude: parseFloat(pctAmplitude.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(4)),
      pctVolatility: parseFloat(pctVolatility.toFixed(4)),
      mean: parseFloat(mean.toFixed(2)),
      high,
      low,
    };
  };

  const auStats = calculateStats(au9999);
  const tdStats = calculateStats(autd);

  // Compare relative volatility to provide trading insights
  const moreVolatile = auStats.pctVolatility > tdStats.pctVolatility ? 'AU9999' : 'AUTD';
  const volDiff = Math.abs(auStats.pctVolatility - tdStats.pctVolatility).toFixed(4);

  return (
    <div
      id="market-stats-widget"
      className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100">当日行情统计与波动率指标</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">基于当前双轨价格分时 tick 数据实时解算</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full font-mono">
          <span>算法: Intraday Standard Deviation & Amplitude</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AU9999 Statistics Card */}
        <div className="bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-700 dark:text-gray-200">沪金 AU99.99</span>
              <span className="text-[9px] bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                AU9999
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-gray-400">平均价: {auStats.mean} 元/克</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amplitude Block */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs mb-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                <span>今日振幅</span>
              </div>
              <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                {auStats.pctAmplitude}%
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                极值价差: {auStats.absAmplitude} 元
              </p>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, auStats.pctAmplitude * 100)}%` }}
                />
              </div>
            </div>

            {/* Volatility Block */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs mb-1.5 font-medium">
                <Gauge className="w-3.5 h-3.5 text-amber-500" />
                <span>当日离散波动率</span>
              </div>
              <p className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">
                {auStats.pctVolatility.toFixed(3)}%
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 text-ellipsis overflow-hidden whitespace-nowrap">
                离散标准差: ±{auStats.stdDev.toFixed(3)}
              </p>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, auStats.pctVolatility * 300)}%` }}
                />
              </div>
            </div>
          </div>

          {/* High & Low Price range bar */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800/50">
            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-mono mb-1.5">
              <span>今日最低: {auStats.low.toFixed(2)} 元</span>
              <span>今日最高: {auStats.high.toFixed(2)} 元</span>
            </div>
            {/* Visual range placement */}
            <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full">
              {au9999.high > au9999.low && (
                <div 
                  className="absolute h-full bg-amber-500 rounded-full"
                  style={{
                    left: `${((au9999.price - au9999.low) / (au9999.high - au9999.low)) * 100 - 4}%`,
                    width: '8%',
                    maxWidth: '100%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#f59e0b',
                    boxShadow: '0 0 8px #f59e0b'
                  }}
                />
              )}
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-1.5">指示器代表当前最新成交价在今日区间中的位置</p>
          </div>
        </div>

        {/* AUTD Statistics Card */}
        <div className="bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-700 dark:text-gray-200">沪金 AU(T+D)</span>
              <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                AUTD
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-gray-400">平均价: {tdStats.mean} 元/克</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amplitude Block */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs mb-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                <span>今日振幅</span>
              </div>
              <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                {tdStats.pctAmplitude}%
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                极值价差: {tdStats.absAmplitude} 元
              </p>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, tdStats.pctAmplitude * 100)}%` }}
                />
              </div>
            </div>

            {/* Volatility Block */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs mb-1.5 font-medium">
                <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                <span>当日离散波动率</span>
              </div>
              <p className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {tdStats.pctVolatility.toFixed(3)}%
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 text-ellipsis overflow-hidden whitespace-nowrap">
                离散标准差: ±{tdStats.stdDev.toFixed(3)}
              </p>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, tdStats.pctVolatility * 300)}%` }}
                />
              </div>
            </div>
          </div>

          {/* High & Low Price range bar */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800/50">
            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-mono mb-1.5">
              <span>今日最低: {tdStats.low.toFixed(2)} 元</span>
              <span>今日最高: {tdStats.high.toFixed(2)} 元</span>
            </div>
            {/* Visual range placement */}
            <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full">
              {autd.high > autd.low && (
                <div 
                  className="absolute h-full bg-indigo-500 rounded-full"
                  style={{
                    left: `${((autd.price - autd.low) / (autd.high - autd.low)) * 100 - 4}%`,
                    width: '8%',
                    maxWidth: '100%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#6366f1',
                    boxShadow: '0 0 8px #6366f1'
                  }}
                />
              )}
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-1.5">指示器代表当前最新成交价在今日区间中的位置</p>
          </div>
        </div>
      </div>

      {/* Intraday Insights Footer section */}
      <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            日内波动洞察：双轨目前以 <span className="text-amber-500 font-bold">{moreVolatile === 'AU9999' ? '沪金 AU99.99' : '沪金 AU(T+D)'}</span> 的波动水平更活跃。
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            两者波动率差异为 <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">{volDiff}%</span>。当日波动率（变异系数）反映了今日分时交易中价格偏离均值的离散程度，离散百分比越高，表明该时段内日内买卖博弈越剧烈，更有利于网格震荡策略或日内利差套利运作。
          </p>
        </div>
      </div>
    </div>
  );
}
