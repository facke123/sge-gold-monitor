/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Bell, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

interface GoldHeaderProps {
  activeRulesCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  triggeredCount: number;
  resetTriggeredCount: () => void;
  connectionStatus?: 'connected' | 'connecting' | 'error';
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
}

export default function GoldHeader({
  activeRulesCount,
  soundEnabled,
  setSoundEnabled,
  triggeredCount,
  resetTriggeredCount,
  connectionStatus = 'connected',
  darkMode,
  setDarkMode,
}: GoldHeaderProps) {
  return (
    <header className="border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 transition-colors duration-250">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title and Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
            <Activity className="w-5 h-5" id="header-logo-icon" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight" id="app-title">
                沪金极简实时助手
              </h1>
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 px-1.5 py-0.5 rounded-md font-bold">
                AU99.99 & AU(T+D)
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5" id="app-subtitle">
              专为国内黄金投资人打造的极简价格跟踪与高阶预警提醒
            </p>
          </div>
        </div>

        {/* Info badges & Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-medium">
            {connectionStatus === 'connected' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-gray-600 dark:text-gray-400">实时轮询中</span>
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-mono text-gray-600 dark:text-gray-400">正在连接行情...</span>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-mono text-gray-600 dark:text-gray-400">行情同步延迟(重试中)</span>
              </>
            )}
          </div>

          {/* Active alerts count */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-medium">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-gray-500 dark:text-gray-400">监控中:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{activeRulesCount}</span>
          </div>

          {/* Trigger Alert indicator */}
          {triggeredCount > 0 && (
            <button
              onClick={resetTriggeredCount}
              className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 px-3 py-1.5 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold cursor-pointer transition-all hover:bg-rose-100/50 dark:hover:bg-rose-900/40"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
              <span>已触发 ({triggeredCount}) · 点击清除</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title={soundEnabled ? '声音警报已开启' : '声音警报已静音'}
            id="sound-toggle-btn"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
              darkMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
            title={darkMode ? '切换至日间模式' : '切换至暗夜模式'}
            id="theme-toggle-btn"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
