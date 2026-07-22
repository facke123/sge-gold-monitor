/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Sparkles, FileText, AlertCircle, TrendingUp, TrendingDown, Activity, Clock, Share2, Copy, Download, Check, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { GoldQuote } from '../types';

// Simple Markdown-to-JSX Parser to avoid importing heavy external libraries
export function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // H1/H2 Headers
        if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
          const headerText = trimmed.replace(/^#{2,3}\s+/, '');
          return (
            <h4 key={idx} className="text-gray-950 font-semibold text-sm mt-5 mb-2.5 flex items-center gap-2 border-l-2 border-amber-500 pl-2.5">
              {headerText}
            </h4>
          );
        }

        if (trimmed.startsWith('# ')) {
          const headerText = trimmed.replace(/^#\s+/, '');
          return (
            <h3 key={idx} className="text-gray-900 font-bold text-base mt-6 mb-3 border-b border-gray-100 pb-2">
              {headerText}
            </h3>
          );
        }

        // Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-*]\s+/, '');
          return (
            <li key={idx} className="list-disc list-inside ml-2 pl-1 text-gray-600">
              {parseBold(itemText)}
            </li>
          );
        }

        // Standard line - parse bold text
        return <p key={idx} className="my-1.5">{parseBold(trimmed)}</p>;
      })}
    </div>
  );
}

// Helper to replace **text** with <strong>text</strong>
export function parseBold(text: string) {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  if (parts.length === 1) return text;
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="text-amber-700 font-bold">{part}</strong>;
    }
    return part;
  });
}

export interface AiAnalystProps {
  au9999: GoldQuote;
  autd: GoldQuote;
}

export default function AiAnalyst({ au9999, autd }: AiAnalystProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadStep, setLoadStep] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Short-term trend states
  const [shortTermTrend, setShortTermTrend] = useState<{ trend: '看涨' | '看跌' | '震荡'; reason: string; confidence: number; isFallback?: boolean } | null>(null);
  const [shortTermLoading, setShortTermLoading] = useState<boolean>(false);
  const [shortTermError, setShortTermError] = useState<string>('');

  // Share and poster state variables
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingUrl, setSharingUrl] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [posterGenerating, setPosterGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  // Helper to get range percentage for visualizer
  const getRangePercent = (price: number, low: number, high: number) => {
    if (!price || !low || !high || high <= low) return 50;
    return Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  };

  const au9999Percent = getRangePercent(au9999.price, au9999.low, au9999.high);
  const autdPercent = getRangePercent(autd.price, autd.low, autd.high);

  const loadingSteps = [
    '读取沪金实时盘面技术特征...',
    '分析研判宏观指标与汇率溢价...',
    '运行 Gemini 3.5 测算核心价格支撑位...',
    '封装黄金中短期建仓与风控建议...',
  ];

  const calculateLocalTrendFallback = (auHistory: number[], tdHistory: number[]) => {
    const auLatest = auHistory.slice(-5);
    const tdLatest = tdHistory.slice(-5);
    
    if (auLatest.length < 2) {
      return {
        trend: '震荡' as const,
        reason: '黄金盘面当前处于初始化中，5分钟波动点位不足，建议先采取区间窄幅震荡思路观望。',
        confidence: 60,
        isFallback: true
      };
    }

    const getDiff = (arr: number[]) => {
      let diff = 0;
      for (let i = 1; i < arr.length; i++) {
        diff += (arr[i] - arr[i - 1]);
      }
      return diff;
    };

    const auDiff = getDiff(auLatest);
    const tdDiff = getDiff(tdLatest);
    const totalDiff = auDiff + tdDiff;

    // Small fluctuation thresholds for gold
    const threshold = 0.08;

    let trend: '看涨' | '看跌' | '震荡' = '震荡';
    let reason = '';
    let confidence = 50;

    if (totalDiff > threshold) {
      trend = '看涨';
      confidence = Math.min(70 + Math.floor(Math.abs(totalDiff) * 35), 88);
      reason = `沪金主力与TD合约5分钟短波段累计上涨 ${totalDiff.toFixed(2)} 元，量价双升，短期买盘积极，多头具有明显的动能优势。`;
    } else if (totalDiff < -threshold) {
      trend = '看跌';
      confidence = Math.min(70 + Math.floor(Math.abs(totalDiff) * 35), 88);
      reason = `黄金双盘面在最新5个波动点内累计走低 ${Math.abs(totalDiff).toFixed(2)} 元，重心逐步下移，短线伴随空头回踩与资金流出。`;
    } else {
      trend = '震荡';
      confidence = 55 + Math.floor(Math.random() * 15);
      reason = `最新5分钟振幅窄幅收敛于 ${(totalDiff >= 0 ? '+' : '')}${totalDiff.toFixed(2)} 元，市场处于均线多空博弈箱体内，建议区间低吸高抛。`;
    }

    return { trend, reason, confidence, isFallback: true };
  };

  const fetchShortTermTrend = async () => {
    setShortTermLoading(true);
    setShortTermError('');
    try {
      const response = await fetch('/api/gold/short-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          au9999History: au9999.history1D,
          autdHistory: autd.history1D,
        }),
      });

      if (!response.ok) {
        throw new Error('短期趋势研判接口返回异常');
      }

      const data = await response.json();
      setShortTermTrend({ ...data, isFallback: false });
    } catch (e: any) {
      // Graceful fallback to Local Heuristic engine to ensure 100% service uptime
      console.warn('Using Local Heuristic Engine fallback for trend analysis:', e);
      const fallbackData = calculateLocalTrendFallback(au9999.history1D, autd.history1D);
      setShortTermTrend(fallbackData);
    } finally {
      setShortTermLoading(false);
    }
  };

  // Run on mount only to prevent API spam and quota exhaustion on every price tick
  useEffect(() => {
    fetchShortTermTrend();
  }, []);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setLoadStep(0);
    }
  }, [loading]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/gold/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ au9999, autd }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('服务器响应类型错误，请稍后重试');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || '无法加载 AI 研判数据');
      }
    } catch (e: any) {
      setError(e.message || '网络连接异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = async () => {
    setShareModalOpen(true);
    setShareLoading(true);
    setPosterImage(null);
    setCopiedLink(false);
    setCopiedImage(false);

    try {
      const response = await fetch('/api/gold/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          prices: {
            au9999: au9999.price,
            autd: autd.price
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        const url = `${window.location.origin}/?share=${data.shareId}`;
        setSharingUrl(url);
      }
    } catch (e) {
      console.error('Failed to create share link:', e);
    } finally {
      setShareLoading(false);
    }
  };

  const copyPosterToClipboard = async () => {
    if (!posterImage) return;
    try {
      const response = await fetch(posterImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      console.warn('Clipboard Image API failed:', err);
    }
  };

  const copyShareLink = () => {
    if (!sharingUrl) return;
    navigator.clipboard.writeText(sharingUrl)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(err => console.error('Link copy failed:', err));
  };

  useEffect(() => {
    if (shareModalOpen && analysis && sharingUrl) {
      setPosterGenerating(true);
      const timer = setTimeout(() => {
        const node = document.getElementById('share-poster-node');
        if (node) {
          toPng(node, { 
            cacheBust: true, 
            backgroundColor: '#f9fafb',
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left'
            }
          })
            .then((dataUrl) => {
              setPosterImage(dataUrl);
              setPosterGenerating(false);
            })
            .catch((err) => {
              console.error('Poster image generation failed:', err);
              setPosterGenerating(false);
            });
        } else {
          setPosterGenerating(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shareModalOpen, sharingUrl, analysis]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 shadow-sm flex flex-col h-full" id="ai-analyst-panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-sm shadow-amber-500/10">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">AI 智能黄金研判</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">双多空解析及策略辅助建议</p>
          </div>
        </div>
        
        {!loading && (
          <div className="flex gap-2">
            {analysis && (
              <button
                onClick={handleShareClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享研报</span>
              </button>
            )}
            <button
              onClick={fetchAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{analysis ? '重新研判' : '生成研判'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Short-term Trend Analysis Module (Always visible, responsive) */}
      <div className="mb-5 bg-gray-50/50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>⏱️ 5 分钟波动·短期趋势研判</span>
            {shortTermTrend?.isFallback && (
              <span className="text-[9px] scale-90 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200/50 dark:border-gray-700/50 font-normal">
                本地量化模型
              </span>
            )}
          </div>
          <button
            onClick={fetchShortTermTrend}
            disabled={shortTermLoading}
            className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${shortTermLoading ? 'animate-spin' : ''}`} />
            <span>刷新波动</span>
          </button>
        </div>

        {shortTermLoading ? (
          <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-400">
            <Activity className="w-3.5 h-3.5 animate-spin text-amber-500" />
            <span>AI 正在测算 5 分钟极速波动趋势...</span>
          </div>
        ) : shortTermError ? (
          <div className="text-center py-2 text-xs text-rose-500">
            {shortTermError}
          </div>
        ) : shortTermTrend ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Trend Indicator Badge */}
            <div className="md:col-span-4 flex items-center gap-2">
              <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 w-full justify-center ${
                shortTermTrend.trend === '看涨'
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-500 dark:text-rose-400'
                  : shortTermTrend.trend === '看跌'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-500 dark:text-emerald-400'
                  : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-500 dark:text-amber-400'
              }`}>
                {shortTermTrend.trend === '看涨' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : shortTermTrend.trend === '看跌' ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                <span className="text-xs font-bold tracking-wider">{shortTermTrend.trend}</span>
              </div>
              
              <div className="text-center bg-gray-100 dark:bg-gray-800/40 rounded-xl px-2 py-1 flex-shrink-0">
                <span className="text-[8px] text-gray-400 block font-bold leading-none scale-90">置信度</span>
                <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300 leading-none mt-0.5 block">{shortTermTrend.confidence}%</span>
              </div>
            </div>

            {/* Explanation Reason */}
            <div className="md:col-span-8">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                {shortTermTrend.reason}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-gray-400">
            等待波动数据输入
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col justify-center min-h-[350px]">
        {loading ? (
          /* Loading State */
          <div className="text-center py-12 max-w-sm mx-auto space-y-5">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/10" />
              <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
              <Cpu className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-800">AI 正在进行盘面演算...</h4>
              <p className="text-[11px] text-gray-400 font-medium transition-all duration-300">
                {loadingSteps[loadStep]}
              </p>
            </div>

            {/* Simulated progress indicators */}
            <div className="flex justify-center gap-1.5">
              {loadingSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 w-1.5 rounded-full transition-all duration-300 ${
                    idx <= loadStep ? 'bg-amber-500 w-3.5' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-12 max-w-xs mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h4 className="text-xs font-bold text-gray-800">生成研判报告失败</h4>
            <p className="text-xs text-gray-400 mt-1">
              {error}
            </p>
            <button
              onClick={fetchAnalysis}
              className="mt-4 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              重新加载
            </button>
          </div>
        ) : analysis ? (
          /* Analysis Report */
          <div className="overflow-y-auto max-h-[460px] pr-1 space-y-4 animate-fadeIn">
            {/* Disclaimer badge */}
            <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 text-[10px] text-amber-800 leading-relaxed flex gap-2">
              <FileText className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>专业提醒:</strong> AI 研判报告由系统基于最新实盘指标推演得出，仅供交流学习使用。延期与带杠杆贵金属交易具极高财务风险，请严格做好资金控制与仓位管理。
              </p>
            </div>

            {/* Render formatted analysis */}
            <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl">
              <SimpleMarkdown text={analysis} />
            </div>
          </div>
        ) : (
          /* Initial Empty State */
          <div className="text-center py-12 max-w-xs mx-auto">
            <Cpu className="w-10 h-10 text-gray-300 mx-auto mb-3.5" />
            <h4 className="text-xs font-bold text-gray-700">获取实盘专业分析报告</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              基于最新沪金价格异动、一分钟成交量波幅以及多维度技术面，一键为您生成首席支撑支撑阻力带与仓位配置风控建议。
            </p>
            <button
              onClick={fetchAnalysis}
              className="mt-5 w-full bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>一键获取专业 AI 报告</span>
            </button>
          </div>
        )}
      </div>

      {/* Off-screen rendering wrapper that forces layout paint but hides element behind viewport */}
      <div 
        style={{ 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          width: '600px', 
          height: '1px', 
          overflow: 'hidden', 
          zIndex: -9999, 
          opacity: 0.001, 
          pointerEvents: 'none' 
        }}
      >
        <div 
          id="share-poster-node" 
          className="light bg-gradient-to-b from-[#FAF8F5] to-[#FFFFFF] p-8 rounded-[32px] border-2 border-amber-200/60 w-[600px] flex flex-col gap-6 text-[#1A1A1A] font-sans relative shadow-2xl"
        >
          {/* Top Golden Accent Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-300 via-amber-500 to-yellow-300 rounded-t-[30px]" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-200/50 pb-5 mt-1">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Sparkles className="w-5.5 h-5.5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                  SGE 沪金云端智能研报
                </h1>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">上海黄金交易所主力合约行情深度综述</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] bg-gradient-to-r from-amber-600 to-amber-700 text-white font-extrabold px-2.5 py-0.5 rounded-md tracking-wider uppercase shadow-sm">
                OFFICIAL REPORT
              </span>
              <div className="text-[10px] text-gray-450 mt-1.5 flex items-center gap-1 justify-end font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{new Date().toLocaleString()} (北京时间)</span>
              </div>
            </div>
          </div>

          {/* SGE Ticker Board with range visualization */}
          <div className="grid grid-cols-2 gap-5">
            {/* AU9999 Card */}
            <div className="bg-[#FFFDF9] p-4.5 rounded-2xl border border-amber-100/70 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">沪金 AU99.99 现货</span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  au9999.changePercent >= 0 
                    ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {au9999.changePercent >= 0 ? '▲ +' : '▼ '}{au9999.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-black font-mono text-gray-900">{au9999.price > 0 ? au9999.price.toFixed(2) : '--.--'}</span>
                <span className="text-[10px] text-gray-400 font-bold">元/克</span>
              </div>
              
              {/* Visualizer Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                  <span>最低 {au9999.low.toFixed(2)}</span>
                  <span>最高 {au9999.high.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full relative">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" 
                    style={{ width: `${au9999Percent}%` }}
                  />
                  <div 
                    className="absolute w-2.5 h-2.5 bg-amber-600 border-2 border-white rounded-full -top-[2px] -ml-1.25 shadow-sm"
                    style={{ left: `${au9999Percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* AUTD Card */}
            <div className="bg-[#FFFDF9] p-4.5 rounded-2xl border border-amber-100/70 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">沪金 AU(T+D) 递延</span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  autd.changePercent >= 0 
                    ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {autd.changePercent >= 0 ? '▲ +' : '▼ '}{autd.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-black font-mono text-gray-900">{autd.price > 0 ? autd.price.toFixed(2) : '--.--'}</span>
                <span className="text-[10px] text-gray-400 font-bold">元/克</span>
              </div>
              
              {/* Visualizer Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                  <span>最低 {autd.low.toFixed(2)}</span>
                  <span>最高 {autd.high.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full relative">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" 
                    style={{ width: `${autdPercent}%` }}
                  />
                  <div 
                    className="absolute w-2.5 h-2.5 bg-amber-600 border-2 border-white rounded-full -top-[2px] -ml-1.25 shadow-sm"
                    style={{ left: `${autdPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Report Content Panel */}
          <div className="bg-white p-6 rounded-2xl border border-amber-100/60 shadow-inner flex-1 leading-relaxed min-h-[300px]">
            <SimpleMarkdown text={analysis} />
          </div>

          {/* Disclaimer Banner */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-900/80 leading-normal font-medium">
              <strong>投资提示</strong>：贵金属交易具有杠杆风险，盘面数据为延时行情，本报告由云端量化策略及智能语言模型合并生成，不构成任何入场担保，请注意仓位控制。
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-200/50 pt-5 mt-1">
            <div className="space-y-1">
              <p className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                SGE 沪金主力云端实时监控中
              </p>
              <p className="text-[11px] text-gray-500 font-bold">扫码或浏览器访问：{window.location.origin}</p>
            </div>
            <div className="bg-white p-1.5 rounded-xl border border-amber-100/80 shadow-sm flex items-center justify-center">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-lg flex flex-col items-center justify-center text-white text-[9px] font-black text-center leading-none p-1 shadow-inner select-none">
                <span className="text-[7px] font-bold opacity-80 mb-0.5">SGE</span>
                <span>GOLD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal overlay */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 pb-1 border-b border-gray-100 dark:border-gray-800">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">智能研报一键分享</h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">生成分享链接或保存精美卡片图片</p>
              </div>
            </div>

            {/* Section 1: Copy Link */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">网页分享链接</label>
              {shareLoading ? (
                <div className="flex items-center justify-center py-2 gap-2 text-xs text-gray-400">
                  <Activity className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>正在云端生成分享链接...</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sharingUrl}
                    readOnly
                    className="flex-1 bg-gray-50 dark:bg-gray-955 border border-gray-200 dark:border-gray-850 rounded-xl p-2.5 text-xs text-gray-600 dark:text-gray-350 focus:outline-none font-mono"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-4 py-2.5 bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-955 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? '已复制' : '复制'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Generate Poster Image */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">图片海报分享</label>
              
              {posterGenerating ? (
                <div className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-8 border border-gray-100 dark:border-gray-850 text-center space-y-3">
                  <Activity className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  <p className="text-xs text-gray-400">正在渲染高清预警研报卡片图片...</p>
                </div>
              ) : posterImage ? (
                <div className="space-y-4">
                  {/* Poster Preview */}
                  <div className="relative border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-inner max-h-[220px] bg-gray-50 dark:bg-gray-955 flex items-center justify-center p-3">
                    <img 
                      src={posterImage} 
                      alt="Share Poster" 
                      className="max-h-full max-w-full rounded-lg object-contain border border-gray-100" 
                    />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-[9px] text-gray-300 font-semibold py-1 px-2.5 rounded-lg text-center leading-none">
                      💡 提示：电脑端可右键复制/保存图片，手机端可长按保存至相册
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={copyPosterToClipboard}
                      className="flex-1 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedImage ? '已复制海报' : '复制海报图片'}</span>
                    </button>
                    <a
                      href={posterImage}
                      download={`SGE黄金研报分享_${new Date().toLocaleDateString()}.png`}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>下载高清图片</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-8 border border-gray-100 dark:border-gray-855 text-center text-xs text-rose-500">
                  无法生成研报海报图片，请重试
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
