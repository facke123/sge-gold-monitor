/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { GoldQuote, GoldType } from '../types';

interface PriceCardsProps {
  au9999: GoldQuote;
  autd: GoldQuote;
  selectedType: GoldType;
  setSelectedType: (type: GoldType) => void;
}

export default function PriceCards({
  au9999,
  autd,
  selectedType,
  setSelectedType,
}: PriceCardsProps) {
  const [au9999Flash, setAu9999Flash] = useState<'up' | 'down' | null>(null);
  const [autdFlash, setAutdFlash] = useState<'up' | 'down' | null>(null);

  const prevAu9999Price = useRef(au9999.price);
  const prevAutdPrice = useRef(autd.price);

  useEffect(() => {
    if (au9999.price > prevAu9999Price.current) {
      setAu9999Flash('up');
      const timer = setTimeout(() => setAu9999Flash(null), 800);
      return () => clearTimeout(timer);
    } else if (au9999.price < prevAu9999Price.current) {
      setAu9999Flash('down');
      const timer = setTimeout(() => setAu9999Flash(null), 800);
      return () => clearTimeout(timer);
    }
    prevAu9999Price.current = au9999.price;
  }, [au9999.price]);

  useEffect(() => {
    if (autd.price > prevAutdPrice.current) {
      setAutdFlash('up');
      const timer = setTimeout(() => setAutdFlash(null), 800);
      return () => clearTimeout(timer);
    } else if (autd.price < prevAutdPrice.current) {
      setAutdFlash('down');
      const timer = setTimeout(() => setAutdFlash(null), 800);
      return () => clearTimeout(timer);
    }
    prevAutdPrice.current = autd.price;
  }, [autd.price]);

  const renderCard = (quote: GoldQuote, flash: 'up' | 'down' | null) => {
    const isUp = quote.change >= 0;
    const isSelected = selectedType === quote.type;

    const trendTextColor = isUp ? 'text-rose-500' : 'text-emerald-500';
    const trendBgColor = isUp ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30';
    const TrendIcon = isUp ? TrendingUp : TrendingDown;

    // Elegant clean bordered styling
    let borderClass = 'border-gray-100 dark:border-gray-800';
    let bgClass = 'bg-white dark:bg-gray-900';
    let shadowClass = 'shadow-sm';

    if (flash === 'up') {
      borderClass = 'border-rose-400 dark:border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.08)]';
      bgClass = 'bg-rose-50/20 dark:bg-rose-950/10';
    } else if (flash === 'down') {
      borderClass = 'border-emerald-400 dark:border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.08)]';
      bgClass = 'bg-emerald-50/20 dark:bg-emerald-950/10';
    } else if (isSelected) {
      borderClass = 'border-amber-400 dark:border-amber-500 shadow-[0_8px_30px_rgba(245,158,11,0.04)]';
      bgClass = 'bg-white dark:bg-gray-900';
      shadowClass = 'shadow-md';
    }

    return (
      <div
        onClick={() => setSelectedType(quote.type)}
        className={`relative rounded-[28px] border-2 ${borderClass} ${bgClass} ${shadowClass} p-6 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between h-full`}
        id={`price-card-${quote.type}`}
      >
        {/* Minimal Selected Line Indicator */}
        {isSelected && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
        )}

        <div>
          {/* Card Title & Badges */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-gray-800 dark:text-gray-100">{quote.name}</span>
              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-1.5 py-0.2 rounded font-mono font-bold tracking-wider uppercase">
                {quote.type}
              </span>
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold ${trendTextColor} ${trendBgColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>
                {isUp ? '+' : ''}
                {quote.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Large display price */}
          <div className="flex items-baseline gap-1.5 mb-3">
            <span
              className={`text-5xl font-medium tracking-tight font-sans transition-colors duration-200 ${
                flash === 'up'
                  ? 'text-rose-500'
                  : flash === 'down'
                  ? 'text-emerald-500'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {quote.price.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-gray-400 tracking-wider">CNY/克</span>
          </div>

          {/* Real-time Buy 1 & Sell 1 microboard */}
          <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">买一价 (BID)</span>
              </div>
              <span className="text-lg font-bold font-mono text-emerald-600 mt-0.5 block">
                {quote.buy1 ? quote.buy1.toFixed(2) : (quote.price - 0.03).toFixed(2)}
              </span>
            </div>
            <div className="border-l border-gray-100 dark:border-gray-800 pl-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">卖一价 (ASK)</span>
              </div>
              <span className="text-lg font-bold font-mono text-rose-600 mt-0.5 block">
                {quote.sell1 ? quote.sell1.toFixed(2) : (quote.price + 0.03).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 dark:border-gray-800 pt-4 mb-4">
            <div>
              <span className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase">开盘价</span>
              <span className="text-sm font-semibold font-mono text-gray-700 dark:text-gray-300 mt-0.5 block">{quote.open.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase">昨收价</span>
              <span className="text-sm font-semibold font-mono text-gray-700 dark:text-gray-300 mt-0.5 block">{quote.lastSettlement.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase">最高价</span>
              <span className="text-sm font-semibold font-mono text-rose-500 mt-0.5 block">{quote.high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase">最低价</span>
              <span className="text-sm font-semibold font-mono text-emerald-500 mt-0.5 block">{quote.low.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-mono text-gray-500 dark:text-gray-400">{quote.time}</span>
          </div>
          <div>
            <span className="text-gray-300">成交量 </span>
            <span className="font-mono text-gray-600 dark:text-gray-400 font-semibold">{(quote.volume / 1000).toFixed(1)}k 手</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {renderCard(au9999, au9999Flash)}
      {renderCard(autd, autdFlash)}
    </div>
  );
}
