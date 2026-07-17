/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  History, 
  AlertTriangle, 
  Info, 
  Mail, 
  Moon, 
  Sun, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { AlertCriteria, AlertRule, GoldQuote, GoldType, TriggerLog, SmtpConfig } from '../types';
import { audioSynth } from '../utils/audio';

interface AlertManagerProps {
  au9999: GoldQuote;
  autd: GoldQuote;
  rules: AlertRule[];
  addRule: (goldType: GoldType, criteria: AlertCriteria, targetValue: number) => void;
  toggleRule: (id: string) => void;
  deleteRule: (id: string) => void;
  triggerLogs: TriggerLog[];
  clearLogs: () => void;
  emailEnabled: boolean;
  setEmailEnabled: (val: boolean) => void;
  alertEmail: string;
  setAlertEmail: (val: string) => void;
  nightMode: 'NORMAL' | 'MUTE' | 'MAJOR_ONLY';
  setNightMode: (val: 'NORMAL' | 'MUTE' | 'MAJOR_ONLY') => void;
  smtpConfig: SmtpConfig;
  setSmtpConfig: (val: SmtpConfig) => void;
}

export default function AlertManager({
  au9999,
  autd,
  rules,
  addRule,
  toggleRule,
  deleteRule,
  triggerLogs,
  clearLogs,
  emailEnabled,
  setEmailEnabled,
  alertEmail,
  setAlertEmail,
  nightMode,
  setNightMode,
  smtpConfig,
  setSmtpConfig,
}: AlertManagerProps) {
  const [goldType, setGoldType] = useState<GoldType>('AU9999');
  const [criteria, setCriteria] = useState<AlertCriteria>('ABOVE');
  const [targetValue, setTargetValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'rules' | 'logs' | 'settings'>('rules');
  
  // SMTP UI collapsible block states
  const [showSmtpConfig, setShowSmtpConfig] = useState<boolean>(false);
  const [smtpHost, setSmtpHost] = useState<string>(smtpConfig.host || '');
  const [smtpPort, setSmtpPort] = useState<string>(smtpConfig.port ? String(smtpConfig.port) : '');
  const [smtpUser, setSmtpUser] = useState<string>(smtpConfig.user || '');
  const [smtpPass, setSmtpPass] = useState<string>(smtpConfig.pass || '');
  const [smtpSecure, setSmtpSecure] = useState<boolean>(smtpConfig.secure ?? true);

  const currentPrice = goldType === 'AU9999' ? au9999.price : autd.price;

  // Multiple Email management states
  const [newEmail, setNewEmail] = useState<string>('');
  const [emailInputError, setEmailInputError] = useState<string>('');

  // Parse existing emails
  const emails = alertEmail
    ? alertEmail.split(',').map((e) => e.trim()).filter(Boolean)
    : [];

  const handleAddEmail = (emailToAdd?: string) => {
    const emailToUse = (emailToAdd || newEmail).trim();
    if (!emailToUse) return;

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      setEmailInputError('请输入格式正确的邮箱地址！');
      return;
    }

    if (emails.includes(emailToUse)) {
      setEmailInputError('该邮箱已存在于提醒列表中！');
      return;
    }

    const updatedEmails = [...emails, emailToUse];
    setAlertEmail(updatedEmails.join(','));
    setNewEmail('');
    setEmailInputError('');
  };

  const handleRemoveEmail = (indexToRemove: number) => {
    const updatedEmails = emails.filter((_, idx) => idx !== indexToRemove);
    setAlertEmail(updatedEmails.join(','));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseFloat(targetValue);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      alert('请输入有效的警报阈值！');
      return;
    }
    
    // Validate bounds
    if (criteria.includes('M') && parsedValue > 10) {
      alert('分钟级波动率（急涨急跌）预警建议设置在 0.01% 至 5% 之间');
      return;
    }

    addRule(goldType, criteria, parsedValue);
    setTargetValue('');
  };

  const autofillCurrentPrice = () => {
    setTargetValue(currentPrice.toFixed(2));
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanConfig: SmtpConfig = {
      host: smtpHost.trim() || undefined,
      port: smtpPort ? Number(smtpPort) : undefined,
      user: smtpUser.trim() || undefined,
      pass: smtpPass.trim() || undefined,
      secure: smtpSecure,
    };
    setSmtpConfig(cleanConfig);
    alert('SMTP 配置已成功保存到本地！');
  };

  const renderCriteriaLabel = (crit: AlertCriteria) => {
    switch (crit) {
      case 'ABOVE':
        return '价格高于';
      case 'BELOW':
        return '价格低于';
      case 'SURGE_1M':
        return '1分钟急涨超';
      case 'DROP_1M':
        return '1分钟急跌超';
      case 'SURGE_5M':
        return '5分钟急涨超';
      case 'DROP_5M':
        return '5分钟急跌超';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[28px] p-6 shadow-sm flex flex-col h-full" id="alert-manager-panel">
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 justify-between items-center flex-wrap gap-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('rules')}
            className={`text-sm font-semibold pb-1.5 transition-all relative cursor-pointer ${
              activeTab === 'rules' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            价格警报
            {activeTab === 'rules' && (
              <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-gray-950 dark:bg-gray-100 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`text-sm font-semibold pb-1.5 transition-all relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <span>触发历史</span>
            {triggerLogs.length > 0 && (
              <span className="bg-rose-500 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                {triggerLogs.length}
              </span>
            )}
            {activeTab === 'logs' && (
              <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-gray-950 dark:bg-gray-100 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`text-sm font-semibold pb-1.5 transition-all relative cursor-pointer flex items-center gap-1 ${
              activeTab === 'settings' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <span>提醒设置</span>
            {activeTab === 'settings' && (
              <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-gray-950 dark:bg-gray-100 rounded-full" />
            )}
          </button>
        </div>

        {/* Quick Auditory Test button */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => audioSynth.playBell()}
            className="px-2 py-0.5 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-750 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-medium cursor-pointer transition-colors"
            title="测试铃声"
          >
            铃
          </button>
          <button
            onClick={() => audioSynth.playElectronic()}
            className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-[10px] font-medium cursor-pointer transition-colors"
            title="测试电子音"
          >
            电
          </button>
          <button
            onClick={() => audioSynth.playSiren()}
            className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-[10px] font-medium cursor-pointer transition-colors"
            title="测试急促警笛"
          >
            哨
          </button>
        </div>
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          {/* Creation Form */}
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/20 p-4 border border-gray-100 dark:border-gray-800/50 rounded-2xl space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-500" />
              <span>新增价格监控规则</span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Product selection */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">监控标的</label>
                <select
                  value={goldType}
                  onChange={(e) => setGoldType(e.target.value as GoldType)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="AU9999">沪金 AU99.99</option>
                  <option value="AUTD">沪金 AU(T+D)</option>
                </select>
              </div>

              {/* Threshold Selection */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">触发条件</label>
                <select
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value as AlertCriteria)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ABOVE">价格高于 (突破)</option>
                  <option value="BELOW">价格低于 (跌破)</option>
                  <option value="SURGE_1M">1分钟急涨超</option>
                  <option value="DROP_1M">1分钟急跌超</option>
                  <option value="SURGE_5M">5分钟急涨超</option>
                  <option value="DROP_5M">5分钟急跌超</option>
                </select>
              </div>
            </div>

            {/* Value Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">目标阈值</label>
                {!criteria.includes('M') && (
                  <button
                    type="button"
                    onClick={autofillCurrentPrice}
                    className="text-[9px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-semibold cursor-pointer"
                  >
                    填入现价: {currentPrice.toFixed(2)}
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.01"
                  placeholder={criteria.includes('M') ? '0.50' : '620.00'}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded-xl p-2.5 pr-12 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  required
                />
                <span className="absolute right-3.5 text-[10px] text-gray-400 font-bold font-mono">
                  {criteria.includes('M') ? '%' : '元'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>启动盯盘监控</span>
            </button>
          </form>

          {/* Rules List */}
          <div className="flex-1 overflow-y-auto max-h-[190px] mt-2 pr-1 space-y-2">
            {rules.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                <Info className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">暂无激活的监控提醒</p>
                <p className="text-[10px] text-gray-350 dark:text-gray-600 mt-1">请在上方创建警报</p>
              </div>
            ) : (
              rules.map((rule) => {
                const quote = rule.goldType === 'AU9999' ? au9999 : autd;
                return (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      rule.active
                        ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`w-9 h-5 rounded-full transition-colors focus:outline-none relative cursor-pointer ${
                          rule.active ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${
                            rule.active ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Rule details */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {rule.goldType === 'AU9999' ? 'AU99.99' : 'AU(T+D)'}
                          </span>
                          <span className="text-[9px] bg-gray-105 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-1 py-0.2 rounded font-mono font-bold">
                            {rule.goldType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] mt-0.5 text-gray-500 dark:text-gray-400 flex-wrap">
                          <span>{renderCriteriaLabel(rule.criteria)}</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                            {rule.targetValue.toFixed(2)}
                            {rule.criteria.includes('M') ? '%' : ' 元'}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 font-mono text-[10px]">
                            (现价:{quote.price.toFixed(2)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="删除规则"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        /* Logs tab */
        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div className="flex-1 overflow-y-auto max-h-[290px] pr-1 space-y-2">
            {triggerLogs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                <History className="w-6 h-6 text-gray-300 dark:text-gray-650 mx-auto mb-2" />
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">暂无提醒触发记录</p>
                <p className="text-[10px] text-gray-350 dark:text-gray-600 mt-1">满足阈值要求时，将在此刻录记录</p>
              </div>
            ) : (
              triggerLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 p-3.5 rounded-2xl animate-fadeIn space-y-2"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                          {log.goldType === 'AU9999' ? '沪金 AU99.99' : '沪金 AU(T+D)'}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 font-semibold">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">
                        触发：{renderCriteriaLabel(log.criteria)}
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold px-1 text-sm">
                          {log.targetValue.toFixed(2)}
                          {log.criteria.includes('M') ? '%' : '元'}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        触发价格：<span className="font-mono text-gray-700 dark:text-gray-350 font-bold">{log.triggeredPrice.toFixed(2)} 元/克</span>
                      </p>
                    </div>
                  </div>

                  {/* Sandboxed email alert details */}
                  {log.emailSent && (
                    <div className="flex items-center justify-between text-[10px] bg-white dark:bg-gray-900 rounded-xl p-2 border border-rose-100/60 dark:border-rose-900/30 mt-2">
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        已发送邮件预警提醒
                      </span>
                      {log.emailPreviewUrl && (
                        <a
                          href={log.emailPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold flex items-center gap-0.5 underline hover:no-underline"
                        >
                          <span>查看邮件 ↗</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {triggerLogs.length > 0 && (
            <button
              onClick={clearLogs}
              className="w-full py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-750 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-250 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              清空历史触发记录
            </button>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        /* Settings tab for advanced configs like emails & night session mode */
        <div className="flex-1 overflow-y-auto max-h-[310px] space-y-4 pr-1">
          
          {/* Email Settings Box */}
          <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 p-4 rounded-2xl space-y-3.5">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-amber-100/60 dark:border-amber-900/30 pb-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>邮件提醒配置</span>
            </h4>

            {/* Toggle alert email notification */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">启用自动发送邮件预警</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">行情触及条件后立即推送通知邮件</span>
              </div>
              <button
                type="button"
                onClick={() => setEmailEnabled(!emailEnabled)}
                className={`w-9 h-5 rounded-full transition-colors focus:outline-none relative cursor-pointer ${
                  emailEnabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${
                    emailEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Email destination string */}
            {emailEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">预警接收邮箱列表 ({emails.length}个)</label>
                  {emails.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAlertEmail('')}
                      className="text-[9px] text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 underline font-semibold cursor-pointer"
                    >
                      清空全部
                    </button>
                  )}
                </div>

                {/* Email Tag List */}
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl min-h-[42px] max-h-[120px] overflow-y-auto">
                  {emails.length === 0 ? (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 self-center px-1">请在下方输入邮箱并添加</span>
                  ) : (
                    emails.map((email, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium pl-2.5 pr-1.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/40 shadow-sm"
                      >
                        <span className="truncate max-w-[130px] font-mono" title={email}>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(idx)}
                          className="text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-bold ml-1 cursor-pointer w-4 h-4 flex items-center justify-center rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/55 transition-colors"
                          title="移除"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Email Add Input Row */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="输入邮箱，如 alerts@domain.com"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setEmailInputError('');
                      }}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 text-gray-800 dark:text-gray-100 text-xs rounded-xl p-2.5 font-sans focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddEmail()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-500/10 cursor-pointer flex items-center justify-center whitespace-nowrap"
                  >
                    添加邮箱
                  </button>
                </div>

                {emailInputError && (
                  <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold">{emailInputError}</p>
                )}

                <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 pt-0.5 flex-wrap gap-1">
                  <span>💡 触及条件时，警报将同时发送至以上所有邮箱</span>
                  {!emails.includes('fingalwendy@gmail.com') && (
                    <button
                      type="button"
                      onClick={() => handleAddEmail('fingalwendy@gmail.com')}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-semibold cursor-pointer"
                    >
                      加入默认邮箱 ↗
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Night Session Mode Settings */}
          <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/30 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 border-b border-blue-100/40 dark:border-blue-900/30 pb-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>夜盘专属静音模式 (20:00 - 02:30)</span>
            </h4>

            <div className="space-y-2.5">
              {/* Option 1: NORMAL */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="nightMode"
                  value="NORMAL"
                  checked={nightMode === 'NORMAL'}
                  onChange={() => setNightMode('NORMAL')}
                  className="mt-0.5 accent-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    正常提醒 (全天无休)
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-555 block mt-0.5">夜盘时段触发依旧播放警报声与推送邮件</span>
                </div>
              </label>

              {/* Option 2: MUTE */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="nightMode"
                  value="MUTE"
                  checked={nightMode === 'MUTE'}
                  onChange={() => setNightMode('MUTE')}
                  className="mt-0.5 accent-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    夜盘静音 (免打扰)
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-555 block mt-0.5">20:00 - 02:30 期间，不发出任何声响，不发送任何推送邮件</span>
                </div>
              </label>

              {/* Option 3: MAJOR_ONLY */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="nightMode"
                  value="MAJOR_ONLY"
                  checked={nightMode === 'MAJOR_ONLY'}
                  onChange={() => setNightMode('MAJOR_ONLY')}
                  className="mt-0.5 accent-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    仅大级别波动提醒
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-555 block mt-0.5">20:00 - 02:30 期间，只有波动率 <b>&gt;= 0.5%</b> 或单次波幅 <b>&gt;= 3.0 元</b> 才推送/鸣笛</span>
                </div>
              </label>
            </div>
          </div>

          {/* Advanced SMTP Server Settings Collapsible Drawer */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setShowSmtpConfig(!showSmtpConfig)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 text-xs font-semibold text-gray-600 dark:text-gray-400 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-2xl"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-gray-400" />
                高级发件设置 (SMTP 服务器)
              </span>
              {showSmtpConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSmtpConfig && (
              <form onSubmit={handleSaveSmtp} className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3.5 bg-white dark:bg-gray-900">
                <div className="text-[10px] text-gray-400 dark:text-gray-500 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100/40 dark:border-amber-900/30 leading-relaxed font-medium">
                  💡 <b>系统免配置代理</b><br/>
                  不配置此项时，应用将使用极速沙盒 SMTP 代理。<br/>
                  <b>触发时会生成真实的送达邮件预览链接</b>供您随时调取调试，非常神奇！
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block mb-0.5">SMTP 主机</label>
                    <input
                      type="text"
                      placeholder="smtp.exmail.qq.com / smtp.163.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded-lg p-2 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block mb-0.5">SMTP 端口</label>
                      <input
                        type="number"
                        placeholder="465"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded-lg p-2 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={smtpSecure}
                          onChange={(e) => setSmtpSecure(e.target.checked)}
                          className="accent-amber-500"
                        />
                        SSL 安全连接
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block mb-0.5">发件账号</label>
                    <input
                      type="text"
                      placeholder="alerts@domain.com"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded-lg p-2 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block mb-0.5">授权密码/密码</label>
                    <input
                      type="password"
                      placeholder="请输入发件账号密钥"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs rounded-lg p-2 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-gray-100 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  保存 SMTP 凭据
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
