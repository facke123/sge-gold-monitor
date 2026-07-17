/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, TrendingUp, TrendingDown, Wallet, HelpCircle } from 'lucide-react';
import { GoldHolding, GoldQuote, GoldType } from '../types';

interface HoldingsCalculatorProps {
  au9999: GoldQuote;
  autd: GoldQuote;
  holdings: GoldHolding[];
  addHolding: (goldType: GoldType, weight: number, buyPrice: number, label: string) => void;
  deleteHolding: (id: string) => void;
}

export default function HoldingsCalculator({
  au9999,
  autd,
  holdings,
  addHolding,
  deleteHolding,
}: HoldingsCalculatorProps) {
  const [goldType, setGoldType] = useState<GoldType>('AU9999');
  const [weight, setWeight] = useState<string>('');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [label, setLabel] = useState<string>('');

  const currentPriceAU9999 = au9999.price;
  const currentPriceAUTD = autd.price;

  // Calculate totals
  const summary = useMemo(() => {
    let totalCost = 0;
    let totalCurrentValue = 0;

    holdings.forEach((h) => {
      const price = h.goldType === 'AU9999' ? currentPriceAU9999 : currentPriceAUTD;
      totalCost += h.weight * h.buyPrice;
      totalCurrentValue += h.weight * price;
    });

    const netProfit = totalCurrentValue - totalCost;
    const returnPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalCurrentValue,
      netProfit,
      returnPercent,
    };
  }, [holdings, currentPriceAU9999, currentPriceAUTD]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const p = parseFloat(buyPrice);
    const lbl = label.trim() || `${goldType === 'AU9999' ? 'AU99.99' : 'AU(T+D)'}持仓`;

    if (isNaN(w) || w <= 0) {
      alert('请输入有效的黄金克重！');
      return;
    }
    if (isNaN(p) || p <= 0) {
      alert('请输入有效的买入单价！');
      return;
    }

    addHolding(goldType, w, p, lbl);
    setWeight('');
    setBuyPrice('');
    setLabel('');
  };

  const fillCurrentPrice = () => {
    const price = goldType === 'AU9999' ? currentPriceAU9999 : currentPriceAUTD;
    setBuyPrice(price.toFixed(2));
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 shadow-sm flex flex-col h-full" id="holdings-calculator-panel">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-3 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-amber-500" />
          <span>持仓账本与投资计算</span>
        </h3>
        <Wallet className="w-4 h-4 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Side: Adding holdings form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-950 p-4 border border-gray-100 dark:border-gray-850 rounded-2xl space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <span>添加买入记录</span>
            </h4>

            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">黄金品种</label>
              <select
                value={goldType}
                onChange={(e) => setGoldType(e.target.value as GoldType)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-750 dark:text-gray-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="AU9999" className="bg-white dark:bg-gray-900">沪金 AU99.99 (实物金/金条)</option>
                <option value="AUTD" className="bg-white dark:bg-gray-900">沪金 AU(T+D) (递延合约)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block mb-1">买入克重 (g)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="如 50"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded-xl p-2.5 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">成本单价</label>
                  <button
                    type="button"
                    onClick={fillCurrentPrice}
                    className="text-[9px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-semibold cursor-pointer"
                  >
                    现价
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="如 600"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded-xl p-2.5 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block mb-1">持仓备注 (选填)</label>
              <input
                type="text"
                placeholder="如: 实物定投一期"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={15}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-750 text-white dark:text-gray-100 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border dark:border-gray-700"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span>记入账本</span>
            </button>
          </form>

          {/* Quick Portfolio stats summary cards */}
          <div className="bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800/45 p-4 rounded-2xl">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">浮动盈亏看板</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold">当前组合市值</span>
                <span className="text-lg font-bold font-mono text-gray-900 dark:text-white mt-0.5 block">
                  ¥ {summary.totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold">投资总成本</span>
                <span className="text-sm font-semibold font-mono text-gray-600 dark:text-gray-300 mt-0.5 block">
                  ¥ {summary.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="col-span-2 border-t border-gray-200/60 dark:border-gray-800 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold">浮动净盈亏</span>
                  <div className={`flex items-center gap-1 text-sm font-bold font-mono mt-0.5 ${summary.netProfit >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {summary.netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>
                      {summary.netProfit >= 0 ? '+' : ''}
                      {summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold">总投资回报率 (ROI)</span>
                  <span className={`text-sm font-bold font-mono mt-0.5 block ${summary.netProfit >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {summary.netProfit >= 0 ? '+' : ''}
                    {summary.returnPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: List of current holdings */}
        <div className="lg:col-span-7 flex flex-col justify-between overflow-hidden">
          <div className="overflow-y-auto max-h-[360px] pr-1 space-y-2 flex-1">
            {holdings.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-50 dark:border-gray-800 rounded-2xl h-full flex flex-col justify-center items-center">
                <HelpCircle className="w-7 h-7 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-555 font-medium">暂无持仓资产明细</p>
                <p className="text-[10px] text-gray-350 dark:text-gray-600 mt-1 max-w-[200px] leading-relaxed text-center">
                  在左侧增加您的买入记录，便可在交易时段实时计算您持仓黄金的浮亏或净赚！
                </p>
              </div>
            ) : (
              holdings.map((h) => {
                const quote = h.goldType === 'AU9999' ? au9999 : autd;
                const cost = h.weight * h.buyPrice;
                const value = h.weight * quote.price;
                const profit = value - cost;
                const roi = (profit / cost) * 100;

                return (
                  <div
                    key={h.id}
                    className="bg-white dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between hover:border-gray-200 dark:hover:border-gray-700 transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{h.label}</span>
                        <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-1 py-0.2 rounded font-mono font-bold">
                          {h.goldType}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 mt-3">
                        <div>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold">持重与均价</span>
                          <span className="text-xs font-semibold font-mono text-gray-600 dark:text-gray-400 mt-0.5 block">
                            {h.weight.toFixed(2)}克 @ ¥{h.buyPrice.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold">当前估值</span>
                          <span className="text-xs font-bold font-mono text-gray-800 dark:text-gray-200 mt-0.5 block">
                            ¥{value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* P&L Column */}
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-semibold">账面盈亏</span>
                        <span className={`text-xs font-bold font-mono block mt-0.5 ${profit >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {profit >= 0 ? '+' : ''}
                          {profit.toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-bold font-mono block ${roi >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {roi >= 0 ? '+' : ''}
                          {roi.toFixed(2)}%
                        </span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => deleteHolding(h.id)}
                        className="p-1.5 text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="删除持仓"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
