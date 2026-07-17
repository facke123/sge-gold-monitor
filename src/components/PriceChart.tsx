/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, AreaChart, BarChart2 } from 'lucide-react';
import { GoldQuote } from '../types';

interface PriceChartProps {
  quote: GoldQuote;
  darkMode?: boolean;
}

type Timeframe = '1D' | '1W' | '1M' | 'WK' | 'MN';

interface KLineBar {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  timeLabel: string;
}

export default function PriceChart({ quote, darkMode = false }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [realKlineData, setRealKlineData] = useState<{
    daily: KLineBar[];
    weekly: KLineBar[];
    monthly: KLineBar[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch real K-line data on mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/gold/kline')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch real gold K-line data');
        return res.json();
      })
      .then((data) => {
        setRealKlineData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching real gold K-line data:', err);
        setLoading(false);
      });
  }, []);

  // Generate Candlestick data for 1W (Daily K), 1M (Daily K), WK (Weekly K), or MN (Monthly K)
  const kLinesData = useMemo<KLineBar[]>(() => {
    if (timeframe === '1D') {
      return [];
    }

    let sourceData: KLineBar[] = [];

    // Use real API data if available
    if (realKlineData) {
      if (timeframe === '1W') {
        sourceData = realKlineData.daily.slice(-7).map(x => ({ ...x }));
      } else if (timeframe === '1M') {
        sourceData = realKlineData.daily.slice(-30).map(x => ({ ...x }));
      } else if (timeframe === 'WK') {
        sourceData = realKlineData.weekly.slice(-12).map(x => ({ ...x }));
      } else if (timeframe === 'MN') {
        sourceData = realKlineData.monthly.slice(-12).map(x => ({ ...x }));
      }
    }

    // Fallback to generated mock data if API is loading or failed
    if (sourceData.length === 0) {
      if (timeframe === 'WK' || timeframe === 'MN') {
        const numWeeks = 12;
        const bars: KLineBar[] = [];
        
        for (let i = 0; i < numWeeks; i++) {
          const offsetIndex = numWeeks - 1 - i;
          const seedValue = quote.price - offsetIndex * 1.8;
          const wave = Math.sin(i * 1.5) * 5 + Math.cos(i * 0.9) * 2;
          const open = parseFloat((seedValue + wave - 1).toFixed(2));
          const close = i === numWeeks - 1 
            ? quote.price 
            : parseFloat((open + Math.sin(i * 2.3) * 4 + 1.2).toFixed(2));
          
          const diff = Math.abs(close - open);
          const high = parseFloat((Math.max(open, close) + diff * 0.55 + 0.6).toFixed(2));
          const low = parseFloat((Math.min(open, close) - diff * 0.45 - 0.5).toFixed(2));
          const volume = Math.floor(120000 + (open % 12) * 9000 + i * 5000);
          const timeLabel = timeframe === 'WK' ? `W-${offsetIndex}` : `M-${offsetIndex}`;

          bars.push({ open, close, high, low, volume, timeLabel: offsetIndex === 0 ? '最新' : timeLabel });
        }
        return bars;
      }

      // Daily K-line fallback
      const rawHistory = timeframe === '1W' ? quote.history1W : quote.history1M;
      
      return rawHistory.map((close, idx) => {
        const prevClose = idx > 0 ? rawHistory[idx - 1] : close * 0.996;
        const open = prevClose;
        
        const diff = Math.abs(close - open);
        const spreadMultiplier = 0.4 + (idx % 4) * 0.3;
        const high = parseFloat((Math.max(open, close) + diff * spreadMultiplier + 0.15).toFixed(2));
        const low = parseFloat((Math.min(open, close) - diff * spreadMultiplier - 0.12).toFixed(2));
        
        const volume = Math.floor(18000 + (close % 15) * 2200 + (idx % 6) * 1200);
        
        let timeLabel = '';
        if (timeframe === '1W') {
          const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
          timeLabel = weekdays[(idx + 2) % 7];
        } else {
          timeLabel = `07-${String(idx + 1).padStart(2, '0')}`;
        }

        return { open, close, high, low, volume, timeLabel };
      });
    }

    // Professional touch: Harmonize and align the very last bar's close price with the real-time quote price
    if (sourceData.length > 0) {
      const lastIdx = sourceData.length - 1;
      const lastBar = { ...sourceData[lastIdx] };
      lastBar.close = quote.price;
      lastBar.high = Math.max(lastBar.high, quote.price);
      lastBar.low = Math.min(lastBar.low, quote.price);
      lastBar.timeLabel = '最新';
      sourceData[lastIdx] = lastBar;
    }

    return sourceData;
  }, [timeframe, quote, realKlineData]);

  // Overall statistics for active timeframe
  const stats = useMemo(() => {
    if (timeframe === '1D') {
      const data = quote.history1D;
      const minVal = data.length > 0 ? Math.min(...data) : quote.lastSettlement;
      const maxVal = data.length > 0 ? Math.max(...data) : quote.lastSettlement;
      const avgVal = data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : quote.price;
      const change = quote.price - quote.lastSettlement;
      const changePercent = (change / quote.lastSettlement) * 100;
      return { minVal, maxVal, avgVal, change, changePercent };
    } else {
      const closes = kLinesData.map(b => b.close);
      const highs = kLinesData.map(b => b.high);
      const lows = kLinesData.map(b => b.low);
      
      const minVal = lows.length > 0 ? Math.min(...lows) : quote.price * 0.99;
      const maxVal = highs.length > 0 ? Math.max(...highs) : quote.price * 1.01;
      const avgVal = closes.length > 0 ? closes.reduce((a, b) => a + b, 0) / closes.length : quote.price;
      
      const firstClose = kLinesData[0]?.open || quote.price;
      const lastClose = kLinesData[kLinesData.length - 1]?.close || quote.price;
      const change = lastClose - firstClose;
      const changePercent = (change / firstClose) * 100;

      return { minVal, maxVal, avgVal, change, changePercent };
    }
  }, [timeframe, quote, kLinesData]);

  // Chart Dimension Configuration
  const chartWidth = 600;
  const totalHeight = 230; // Combined canvas height
  const paddingX = 45;
  const paddingY = 20;

  // Split height between core price chart and sub volume chart
  const priceChartHeight = 145; // core price layout
  const volumeChartHeight = 35;  // bottom volume bars
  const spacing = 15;            // gap between charts

  const minVal = stats.minVal;
  const maxVal = stats.maxVal;
  const valueRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  // 1D Intraday line points mapping
  const tickPoints = useMemo(() => {
    if (timeframe !== '1D') return [];
    const ticks = quote.history1D;
    if (ticks.length === 0) return [];

    const stepX = (chartWidth - paddingX * 2) / Math.max(ticks.length - 1, 1);
    return ticks.map((val, idx) => {
      const x = paddingX + idx * stepX;
      // Map to priceChartHeight (with paddingY margins)
      const y = paddingY + (1 - (val - minVal) / valueRange) * (priceChartHeight - paddingY * 2);
      return { x, y, value: val };
    });
  }, [timeframe, quote.history1D, minVal, maxVal, valueRange]);

  // Calculate paths for 1D line & linear-gradient area
  const linePath = useMemo(() => {
    if (tickPoints.length === 0) return '';
    return tickPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }, [tickPoints]);

  const areaPath = useMemo(() => {
    if (tickPoints.length === 0) return '';
    const first = tickPoints[0];
    const last = tickPoints[tickPoints.length - 1];
    const baseY = priceChartHeight - 5;
    return `${linePath} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`;
  }, [tickPoints, linePath]);

  // Handle slide/hover coordination
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    const scaleX = chartWidth / svgRect.width;
    const svgX = clientX * scaleX;

    const dataCount = timeframe === '1D' ? quote.history1D.length : kLinesData.length;
    if (dataCount === 0) return;

    const stepX = (chartWidth - paddingX * 2) / Math.max(dataCount - 1, 1);
    let index = Math.round((svgX - paddingX) / stepX);
    if (index < 0) index = 0;
    if (index >= dataCount) index = dataCount - 1;

    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const isUp = stats.change >= 0;

  // Grid line counts for standard scale
  const yGridLines = 4;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 shadow-sm" id={`price-chart-panel-${quote.type}`}>
      {/* Chart Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              {timeframe === '1D' ? <AreaChart className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
            </span>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{quote.name} 核心品种走势</h3>
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">CNY / 克</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="text-gray-400 dark:text-gray-500">区间表现:</span>
            <div className={`flex items-center font-mono font-bold ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
              {isUp ? '+' : ''}
              {stats.change.toFixed(2)} 元 ({isUp ? '+' : ''}
              {stats.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex bg-gray-50 dark:bg-gray-950 p-1 rounded-xl border border-gray-100 dark:border-gray-800 self-start sm:self-auto flex-wrap gap-y-1">
          {([
            { id: '1D', label: '分时图' },
            { id: '1W', label: '日 K (7天)' },
            { id: '1M', label: '日 K (30天)' },
            { id: 'WK', label: '周 K线' },
            { id: 'MN', label: '月 K线' },
          ] as { id: Timeframe; label: string }[]).map((tf) => (
            <button
              key={tf.id}
              onClick={() => {
                setTimeframe(tf.id);
                setHoverIndex(null);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                timeframe === tf.id
                  ? 'bg-amber-500 text-white font-bold shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/40'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          className="w-full h-auto select-none overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="chartAreaGradientAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chartAreaGradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chartAreaGradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: yGridLines }).map((_, i) => {
            const ratio = i / (yGridLines - 1);
            const y = paddingY + ratio * (priceChartHeight - paddingY * 2);
            const val = maxVal - ratio * (maxVal - minVal);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke={darkMode ? "#1E293B" : "#F3F4F6"}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#9CA3AF"
                  className="font-mono text-[9px] font-bold"
                >
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Reference Line for 昨收价 (Previous Close) on Intraday Chart */}
          {timeframe === '1D' && (
            <g>
              {(() => {
                const ySettlement = paddingY + (1 - (quote.lastSettlement - minVal) / valueRange) * (priceChartHeight - paddingY * 2);
                if (ySettlement >= paddingY && ySettlement <= priceChartHeight) {
                  return (
                    <>
                      <line
                        x1={paddingX}
                        y1={ySettlement}
                        x2={chartWidth - paddingX}
                        y2={ySettlement}
                        stroke="#6B7280"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.4"
                      />
                      <text
                        x={chartWidth - paddingX - 4}
                        y={ySettlement - 4}
                        fill="#6B7280"
                        className="text-[8px] font-bold font-mono"
                        textAnchor="end"
                        opacity="0.6"
                      >
                        昨收: {quote.lastSettlement.toFixed(2)}
                      </text>
                    </>
                  );
                }
                return null;
              })()}
            </g>
          )}

          {/* --- CHART DRAWINGS --- */}

          {/* 1D Intraday continuous line and area */}
          {timeframe === '1D' && tickPoints.length > 0 && (
            <>
              {/* Area */}
              <path
                d={areaPath}
                fill={isUp ? 'url(#chartAreaGradientAmber)' : 'url(#chartAreaGradientGreen)'}
              />
              {/* Continuous Trend Line */}
              <path
                d={linePath}
                fill="none"
                stroke={isUp ? '#F59E0B' : '#10B981'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Candlestick drawing for 1W, 1M, WK */}
          {timeframe !== '1D' && kLinesData.length > 0 && (
            <g>
              {kLinesData.map((bar, i) => {
                const stepX = (chartWidth - paddingX * 2) / kLinesData.length;
                const x = paddingX + i * stepX + stepX / 2;
                
                // Map values to priceChartHeight coordinate space
                const yOpen = paddingY + (1 - (bar.open - minVal) / valueRange) * (priceChartHeight - paddingY * 2);
                const yClose = paddingY + (1 - (bar.close - minVal) / valueRange) * (priceChartHeight - paddingY * 2);
                const yHigh = paddingY + (1 - (bar.high - minVal) / valueRange) * (priceChartHeight - paddingY * 2);
                const yLow = paddingY + (1 - (bar.low - minVal) / valueRange) * (priceChartHeight - paddingY * 2);

                const isBarUp = bar.close >= bar.open;
                // Standard Chinese market K-line: Red is Up, Green is Down
                const candleColor = isBarUp ? '#EF4444' : '#10B981';
                
                // Candlestick Body parameters
                const bodyWidth = Math.max(stepX * 0.7, 3);
                const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1.5);
                const bodyTop = Math.min(yOpen, yClose);

                return (
                  <g key={i} className="transition-opacity duration-200">
                    {/* Shadow / Wick Line */}
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth="1.5"
                    />
                    {/* Candlestick Real Body */}
                    <rect
                      x={x - bodyWidth / 2}
                      y={bodyTop}
                      width={bodyWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      stroke={candleColor}
                      strokeWidth="0.5"
                      rx={1}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Bottom Volume Sub-Chart Panel */}
          <g>
            {/* Divider line above Volume Chart */}
            <line
              x1={paddingX}
              y1={priceChartHeight + spacing / 2}
              x2={chartWidth - paddingX}
              y2={priceChartHeight + spacing / 2}
              stroke={darkMode ? "#1E293B" : "#F3F4F6"}
              strokeWidth="1"
            />
            
            {(() => {
              // Calculate volume coordinates
              const vols = timeframe === '1D' 
                ? Array.from({ length: quote.history1D.length }).map((_, idx) => 3000 + (idx % 4) * 800)
                : kLinesData.map(b => b.volume);
              const maxVol = Math.max(...vols, 1000);

              const dataCount = timeframe === '1D' ? quote.history1D.length : kLinesData.length;
              const stepX = (chartWidth - paddingX * 2) / Math.max(dataCount - 1, 1);
              
              const volYBase = priceChartHeight + spacing + volumeChartHeight;

              return vols.map((vol, idx) => {
                const x = paddingX + idx * stepX;
                const barHeight = (vol / maxVol) * volumeChartHeight;
                const barY = volYBase - barHeight;
                
                // Set color to match the price direction
                let isUpVolume = isUp;
                if (timeframe !== '1D') {
                  const bar = kLinesData[idx];
                  isUpVolume = bar ? bar.close >= bar.open : true;
                } else if (idx > 0) {
                  const currentTick = quote.history1D[idx];
                  const prevTick = quote.history1D[idx - 1];
                  isUpVolume = currentTick >= prevTick;
                }

                const barWidth = timeframe === '1D' ? Math.max(stepX * 0.5, 1) : Math.max(stepX * 0.7, 2);

                return (
                  <rect
                    key={idx}
                    x={x - (timeframe === '1D' ? 0 : barWidth / 2)}
                    y={barY}
                    width={barWidth}
                    height={Math.max(barHeight, 1)}
                    fill={isUpVolume ? '#FEE2E2' : '#D1FAE5'}
                    stroke={isUpVolume ? '#EF4444' : '#10B981'}
                    strokeWidth="0.5"
                    opacity="0.8"
                  />
                );
              });
            })()}
          </g>

          {/* Time scale axis tags at bottom */}
          <g>
            <text
              x={paddingX}
              y={totalHeight - 4}
              fill="#9CA3AF"
              className="font-mono text-[9px] font-bold"
              textAnchor="start"
            >
              {timeframe === '1D' 
                ? (quote.history1DTime && quote.history1DTime[0] ? quote.history1DTime[0] : '20:00') 
                : timeframe === '1W' ? '7天前' : timeframe === '1M' ? '30天前' : timeframe === 'WK' ? '12周前' : '12月前'}
            </text>
            <text
              x={chartWidth / 2}
              y={totalHeight - 4}
              fill="#9CA3AF"
              className="font-mono text-[9px] font-bold"
              textAnchor="middle"
            >
              {timeframe === '1D' ? '上海黄金交易所 (SGE) 主力时段' : '历史K线趋势'}
            </text>
            <text
              x={chartWidth - paddingX}
              y={totalHeight - 4}
              fill="#9CA3AF"
              className="font-mono text-[9px] font-bold"
              textAnchor="end"
            >
              最新
            </text>
          </g>

          {/* Interactive slider tracking line & detailed hover tooltip */}
          {hoverIndex !== null && (
            <g>
              {(() => {
                const dataCount = timeframe === '1D' ? quote.history1D.length : kLinesData.length;
                const stepX = (chartWidth - paddingX * 2) / Math.max(dataCount - 1, 1);
                const x = paddingX + hoverIndex * stepX;

                let hoverPrice = 0;
                let openPrice = 0;
                let highPrice = 0;
                let lowPrice = 0;
                let volVal = 0;
                let label = '';
                let priceChange = 0;
                let priceChangePercent = 0;

                if (timeframe === '1D') {
                  hoverPrice = quote.history1D[hoverIndex];
                  volVal = 3000 + (hoverIndex % 4) * 800;
                  const hasTimeLabel = quote.history1DTime && quote.history1DTime[hoverIndex];
                  label = hasTimeLabel ? quote.history1DTime[hoverIndex] : `分时节点 ${hoverIndex + 1}`;
                  priceChange = hoverPrice - quote.lastSettlement;
                  priceChangePercent = (priceChange / quote.lastSettlement) * 100;
                } else {
                  const bar = kLinesData[hoverIndex];
                  if (bar) {
                    hoverPrice = bar.close;
                    openPrice = bar.open;
                    highPrice = bar.high;
                    lowPrice = bar.low;
                    volVal = bar.volume;
                    label = bar.timeLabel;
                    priceChange = bar.close - bar.open;
                    priceChangePercent = bar.open > 0 ? (priceChange / bar.open) * 100 : 0;
                  }
                }

                // Match theme color for the vertical dotted grid line
                const indicatorColor = (timeframe === '1D' ? isUp : priceChange >= 0) ? '#EF4444' : '#10B981';

                return (
                  <>
                    {/* Vertical guideline */}
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={priceChartHeight + spacing + volumeChartHeight}
                      stroke={indicatorColor}
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />

                    {/* Circle focus on continuous line chart */}
                    {timeframe === '1D' && tickPoints[hoverIndex] && (
                      <circle
                        cx={x}
                        cy={tickPoints[hoverIndex].y}
                        r="5.5"
                        fill={indicatorColor}
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        className="shadow-sm"
                      />
                    )}

                    {/* Professional Rich Tooltip overlay */}
                    <foreignObject
                      x={x > chartWidth - 145 ? x - 145 : x < 145 ? x + 10 : x - 65}
                      y={4}
                      width="135"
                      height={timeframe === '1D' ? "76" : "118"}
                      className="overflow-visible z-50 pointer-events-none"
                    >
                      <div className="bg-gray-900/95 text-white rounded-xl p-2.5 shadow-xl border border-gray-800 text-xs flex flex-col gap-1 backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1">
                          <span className="font-bold text-gray-300 font-sans">{label}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${priceChange >= 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        </div>

                        {timeframe === '1D' ? (
                          <>
                            <div className="flex justify-between font-mono">
                              <span className="text-gray-400">价格:</span>
                              <span className="font-bold">{hoverPrice.toFixed(2)} CNY</span>
                            </div>
                            <div className="flex justify-between font-mono">
                              <span className="text-gray-400">较昨收:</span>
                              <span className={`font-bold ${priceChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between font-mono">
                              <span className="text-gray-400">涨跌幅:</span>
                              <span className={`font-bold ${priceChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between font-mono">
                              <span className="text-gray-400">开盘:</span>
                              <span>{openPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-mono">
                              <span className="text-gray-400">最高:</span>
                              <span className="text-rose-400 font-semibold">{highPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-mono">
                              <span className="text-gray-400">最低:</span>
                              <span className="text-emerald-400 font-semibold">{lowPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-mono">
                              <span className="text-gray-400">收盘:</span>
                              <span className="font-bold">{hoverPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-mono border-t border-gray-800/80 pt-1 mt-1">
                              <span className="text-gray-400">涨跌:</span>
                              <span className={`font-bold ${priceChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between font-mono">
                          <span className="text-gray-400">量 (Volume):</span>
                          <span className="text-amber-400">{volVal.toLocaleString()} 手</span>
                        </div>
                      </div>
                    </foreignObject>
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Stats summary banner */}
      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-4 mt-3 text-center">
        <div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold tracking-wider uppercase">最高价格</span>
          <span className="text-xs font-mono font-bold text-rose-500 mt-0.5 block">{minVal > 0 ? maxVal.toFixed(2) : '--'}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold tracking-wider uppercase">均值</span>
          <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 mt-0.5 block">{minVal > 0 ? stats.avgVal.toFixed(2) : '--'}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold tracking-wider uppercase">最低价格</span>
          <span className="text-xs font-mono font-bold text-emerald-500 mt-0.5 block">{minVal > 0 ? minVal.toFixed(2) : '--'}</span>
        </div>
      </div>
    </div>
  );
}
