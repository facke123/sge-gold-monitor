/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoldType, GoldQuote, AlertRule, AlertCriteria, TriggerLog, GoldHolding } from './types';
import GoldHeader from './components/GoldHeader';
import PriceCards from './components/PriceCards';
import PriceChart from './components/PriceChart';
import AlertManager from './components/AlertManager';
import HoldingsCalculator from './components/HoldingsCalculator';
import AiAnalyst, { SimpleMarkdown } from './components/AiAnalyst';
import MarketStatsWidget from './components/MarketStatsWidget';
import { audioSynth } from './utils/audio';
import { Bell, Sparkles, AlertTriangle, X, Clock } from 'lucide-react';

// Initial empty quotes (populated on first API fetch)
const INITIAL_AU9999: GoldQuote = {
  type: 'AU9999',
  name: '沪金 AU99.99',
  price: 0,
  open: 0,
  high: 0,
  low: 0,
  lastSettlement: 0,
  change: 0,
  changePercent: 0,
  volume: 0,
  time: '--:--:--',
  history1D: [],
  history1W: [],
  history1M: [],
};

const INITIAL_AUTD: GoldQuote = {
  type: 'AUTD',
  name: '沪金 AU(T+D)',
  price: 0,
  open: 0,
  high: 0,
  low: 0,
  lastSettlement: 0,
  change: 0,
  changePercent: 0,
  volume: 0,
  time: '--:--:--',
  history1D: [],
  history1W: [],
  history1M: [],
};

export default function App() {
  // Quotes state
  const [au9999, setAu9999] = useState<GoldQuote>(INITIAL_AU9999);
  const [autd, setAutd] = useState<GoldQuote>(INITIAL_AUTD);

  // Share report state variables
  const [sharedReportId, setSharedReportId] = useState<string | null>(null);
  const [sharedReportData, setSharedReportData] = useState<{
    analysis: string;
    timestamp: number;
    prices: {
      au9999?: number;
      autd?: number;
    };
  } | null>(null);
  const [sharedReportLoading, setSharedReportLoading] = useState<boolean>(false);
  const [sharedReportError, setSharedReportError] = useState<string>('');

  // General App settings
  const [selectedType, setSelectedType] = useState<GoldType>('AU9999');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('gold_sound_enabled');
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [emailEnabled, setEmailEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('gold_email_enabled');
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [alertEmail, setAlertEmail] = useState<string>(() => {
    const stored = localStorage.getItem('gold_alert_email');
    return stored || 'fingalwendy@gmail.com';
  });

  const [nightMode, setNightMode] = useState<'NORMAL' | 'MUTE' | 'MAJOR_ONLY'>(() => {
    const stored = localStorage.getItem('gold_night_mode');
    return (stored as 'NORMAL' | 'MUTE' | 'MAJOR_ONLY') || 'NORMAL';
  });

  const [smtpConfig, setSmtpConfig] = useState<any>(() => {
    const stored = localStorage.getItem('gold_smtp_config');
    return stored ? JSON.parse(stored) : {};
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('gold_dark_mode');
    if (stored !== null) return JSON.parse(stored);
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Alert Rules state
  const [rules, setRules] = useState<AlertRule[]>(() => {
    const stored = localStorage.getItem('gold_alert_rules');
    return stored ? JSON.parse(stored) : [];
  });

  // Trigger logs state
  const [triggerLogs, setTriggerLogs] = useState<TriggerLog[]>(() => {
    const stored = localStorage.getItem('gold_trigger_logs');
    return stored ? JSON.parse(stored) : [];
  });

  // Holding ledger state
  const [holdings, setHoldings] = useState<GoldHolding[]>(() => {
    const stored = localStorage.getItem('gold_holdings');
    return stored ? JSON.parse(stored) : [];
  });

  // Ticking and Simulation state
  const [autoTickEnabled, setAutoTickEnabled] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  
  // Flash overlays for trigger indicators
  const [activeVisualTrigger, setActiveVisualTrigger] = useState<{
    goldType: GoldType;
    criteria: AlertCriteria;
    targetValue: number;
    triggeredPrice: number;
  } | null>(null);

  // Track counts of triggered alerts
  const [triggeredCount, setTriggeredCount] = useState<number>(0);

  // Check for share query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) {
      setSharedReportId(shareId);
      setSharedReportLoading(true);
      fetch(`/api/gold/share?id=${shareId}`)
        .then((res) => {
          if (!res.ok) throw new Error('分享的报告已被删除或已过期');
          return res.json();
        })
        .then((data) => {
          setSharedReportData(data);
        })
        .catch((err) => {
          setSharedReportError(err.message || '加载分享报告失败');
        })
        .finally(() => {
          setSharedReportLoading(false);
        });
    }
  }, []);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('gold_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('gold_email_enabled', JSON.stringify(emailEnabled));
  }, [emailEnabled]);

  useEffect(() => {
    localStorage.setItem('gold_alert_email', alertEmail);
  }, [alertEmail]);

  useEffect(() => {
    localStorage.setItem('gold_night_mode', nightMode);
  }, [nightMode]);

  useEffect(() => {
    localStorage.setItem('gold_smtp_config', JSON.stringify(smtpConfig));
  }, [smtpConfig]);

  useEffect(() => {
    localStorage.setItem('gold_alert_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('gold_trigger_logs', JSON.stringify(triggerLogs));
  }, [triggerLogs]);

  useEffect(() => {
    localStorage.setItem('gold_holdings', JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem('gold_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync alert rules & settings to cloud for 24/7 off-page background monitoring
  useEffect(() => {
    const syncRulesToCloud = async () => {
      try {
        await fetch('/api/gold/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rules,
            alertEmail,
            nightMode,
            emailEnabled
          })
        });
      } catch (e) {
        console.warn('Cloud rules sync failed:', e);
      }
    };
    syncRulesToCloud();
  }, [rules, alertEmail, nightMode, emailEnabled]);

  // Fetch real-time gold prices from Sina Finance (via our server proxy)
  useEffect(() => {
    const fetchRealPrices = async () => {
      try {
        const response = await fetch('/api/gold/prices');
        if (!response.ok) throw new Error('Failed to fetch real-time gold prices');
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('API returned non-JSON response, skipping parsing to avoid console errors during initialization/boot.');
          setConnectionStatus('connecting');
          return;
        }

        const data = await response.json();

        setAu9999((prev) => {
          const newPrice = data.au9999.price;
          // Use real-time minline history from API if available
          let newHistory = (data.au9999.history1D && data.au9999.history1D.length > 0)
            ? data.au9999.history1D
            : prev.history1D;
          
          let newHistoryTime = (data.au9999.history1DTime && data.au9999.history1DTime.length > 0)
            ? data.au9999.history1DTime
            : (prev.history1DTime || []);
          
          if (newHistory.length > 0 && newHistory[newHistory.length - 1] !== newPrice) {
            newHistory = [...newHistory, newPrice].slice(-1000);
            const d = new Date();
            const tickTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            newHistoryTime = [...newHistoryTime, tickTime].slice(-1000);
          } else if (newHistory.length === 0) {
            newHistory = [newPrice];
            const d = new Date();
            newHistoryTime = [`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`];
          }
          
          return {
            ...prev,
            price: newPrice,
            open: data.au9999.open,
            high: data.au9999.high,
            low: data.au9999.low,
            lastSettlement: data.au9999.lastSettlement,
            change: data.au9999.change,
            changePercent: data.au9999.changePercent,
            volume: data.au9999.volume,
            time: data.au9999.time,
            history1D: newHistory,
            history1DTime: newHistoryTime,
          };
        });

        setAutd((prev) => {
          const newPrice = data.autd.price;
          // Use real-time minline history from API if available
          let newHistory = (data.autd.history1D && data.autd.history1D.length > 0)
            ? data.autd.history1D
            : prev.history1D;
          
          let newHistoryTime = (data.autd.history1DTime && data.autd.history1DTime.length > 0)
            ? data.autd.history1DTime
            : (prev.history1DTime || []);
          
          if (newHistory.length > 0 && newHistory[newHistory.length - 1] !== newPrice) {
            newHistory = [...newHistory, newPrice].slice(-1000);
            const d = new Date();
            const tickTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            newHistoryTime = [...newHistoryTime, tickTime].slice(-1000);
          } else if (newHistory.length === 0) {
            newHistory = [newPrice];
            const d = new Date();
            newHistoryTime = [`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`];
          }
          
          return {
            ...prev,
            price: newPrice,
            open: data.autd.open,
            high: data.autd.high,
            low: data.autd.low,
            lastSettlement: data.autd.lastSettlement,
            change: data.autd.change,
            changePercent: data.autd.changePercent,
            volume: data.autd.volume,
            time: data.autd.time,
            history1D: newHistory,
            history1DTime: newHistoryTime,
          };
        });

        setConnectionStatus('connected');
      } catch (err) {
        setConnectionStatus('error');
        console.warn('Failed to load real-time gold prices (will retry shortly):', err);
      }
    };

    // Initial load
    fetchRealPrices();

    if (!autoTickEnabled) return;

    // Periodic polling for live updates every 1 second (high frequency)
    const interval = setInterval(fetchRealPrices, 1000);
    return () => clearInterval(interval);
  }, [autoTickEnabled]);

  // Monitor prices and run check-alerts rules
  useEffect(() => {
    checkAlerts();
  }, [au9999.price, autd.price]);

  // Night Session SGE helper: check if currently 20:00 - 02:30 SGE night session
  const isNightMarketSession = (): boolean => {
    const d = new Date();
    const hr = d.getHours();
    const mn = d.getMinutes();
    const totalMinutes = hr * 60 + mn;
    // 20:00 is 1200 mins. 02:30 is 150 mins.
    return (totalMinutes >= 1200 || totalMinutes <= 150);
  };

  // Check if a fluctuation is major for Night Mode filtering
  const isMajorMovement = (
    rule: AlertRule,
    price: number,
    quote: GoldQuote,
    change1M: number,
    change5M: number
  ): boolean => {
    switch (rule.criteria) {
      case 'ABOVE':
      case 'BELOW':
        // If fluctuation since settlement is >= 3元 or single trigger difference is >= 3元
        return Math.abs(quote.change) >= 3.0;
      case 'SURGE_1M':
        return change1M >= 0.5;
      case 'DROP_1M':
        return change1M <= -0.5;
      case 'SURGE_5M':
        return change5M >= 0.5;
      case 'DROP_5M':
        return change5M <= -0.5;
      default:
        return false;
    }
  };

  // Send real email alert via backend endpoint
  const sendEmailAlert = async (rule: AlertRule, price: number, reason: string): Promise<string | null> => {
    if (!emailEnabled || !alertEmail) return null;

    try {
      const isNight = isNightMarketSession();
      const nightMarketDisclaimer = isNight 
        ? `<div style="padding: 12px; background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; color: #b45309; margin-bottom: 15px; font-size: 13px;">
            🌙 <b>提示：此条警报在夜盘交易时段 (20:00 - 02:30) 触发</b><br/>
            检测到符合大级别波动，已穿透夜盘防打扰模式向您推送。
           </div>`
        : '';

      const criteriaText: Record<string, string> = {
        'ABOVE': '价格突破（高于）',
        'BELOW': '价格跌破（低于）',
        'SURGE_1M': '1分钟暴涨超',
        'DROP_1M': '1分钟暴跌超',
        'SURGE_5M': '5分钟急涨超',
        'DROP_5M': '5分钟急跌超',
      };

      const criteriaLabel = criteriaText[rule.criteria] || rule.criteria;

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px;">🔔</span>
            <h2 style="margin: 12px 0 4px 0; color: #111827; font-size: 22px; font-weight: 700;">上海黄金交易所 (SGE) 行情预警</h2>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">您的实时盯着规则已被触发</p>
          </div>

          ${nightMarketDisclaimer}

          <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #6b7280; font-size: 13px; padding-bottom: 8px;">监控标的</td>
                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">
                  ${rule.goldType === 'AU9999' ? '沪金 AU99.99' : '沪金 AU(T+D)'} (${rule.goldType})
                </td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 13px; padding-bottom: 8px;">触发条件</td>
                <td style="color: #dc2626; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">
                  ${criteriaLabel} ${rule.targetValue}${rule.criteria.includes('M') ? '%' : ' 元'}
                </td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 13px; padding-bottom: 8px;">最新价格</td>
                <td style="color: #b45309; font-size: 18px; font-weight: 700; text-align: right; padding-bottom: 8px;">
                  ${price.toFixed(2)} 元/克
                </td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 13px;">触发时间</td>
                <td style="color: #111827; font-size: 13px; text-align: right;">
                  ${new Date().toLocaleString('zh-CN')}
                </td>
              </tr>
            </table>
          </div>

          <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 13px; font-weight: 600;">🔔 预警解析报告：</h4>
            <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              ${reason}
            </p>
          </div>

          <div style="background-color: #f9fafb; border-radius: 10px; padding: 12px; font-size: 11px; color: #9ca3af; text-align: center;">
            本邮件由 SGE 沪金监控助手自动发出。如需修改接收邮箱或调整夜盘静音，请前往应用设置面板。<br/>
            © 2026 沪金智能盯着系统
          </div>
        </div>
      `;

      const subject = `【沪金提醒】${rule.goldType === 'AU9999' ? 'AU99.99' : 'AU(T+D)'} 触及 ${price.toFixed(2)} 元！`;

      const response = await fetch('/api/gold/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: alertEmail,
          subject,
          html: htmlContent,
          smtpConfig: Object.keys(smtpConfig).length > 0 ? smtpConfig : undefined
        })
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.success && data.previewUrl) {
            return data.previewUrl as string;
          }
        }
      }
    } catch (e) {
      console.error('Failed to dispatch alert email:', e);
    }
    return null;
  };

  // Core Alert Checker Function
  const checkAlerts = () => {
    let rulesUpdated = false;
    const now = Date.now();
    const isNight = isNightMarketSession();

    const nextRules = rules.map((rule) => {
      if (!rule.active || rule.isTriggered) return rule;

      const quote = rule.goldType === 'AU9999' ? au9999 : autd;
      const price = quote.price;

      // Skip rule checking if price is 0 or invalid (e.g. loading or connection issues)
      if (!price || price <= 0) return rule;

      let triggered = false;

      // Calculate percentages for 1M and 5M
      const ticks = quote.history1D;
      
      const refIndex1M = Math.max(0, ticks.length - 20);
      const refPrice1M = ticks[refIndex1M] || price;
      const change1M = ((price - refPrice1M) / refPrice1M) * 100;

      const refIndex5M = Math.max(0, ticks.length - 100);
      const refPrice5M = ticks[refIndex5M] || price;
      const change5M = ((price - refPrice5M) / refPrice5M) * 100;

      switch (rule.criteria) {
        case 'ABOVE':
          if (price >= rule.targetValue) triggered = true;
          break;
        case 'BELOW':
          if (price <= rule.targetValue) triggered = true;
          break;
        case 'SURGE_1M':
          if (change1M >= rule.targetValue) triggered = true;
          break;
        case 'DROP_1M':
          if (change1M <= -rule.targetValue) triggered = true;
          break;
        case 'SURGE_5M':
          if (change5M >= rule.targetValue) triggered = true;
          break;
        case 'DROP_5M':
          if (change5M <= -rule.targetValue) triggered = true;
          break;
      }

      if (triggered) {
        rulesUpdated = true;

        // Determine if sound & email should be played/sent based on night market mode
        let playSoundAndMail = true;
        if (isNight) {
          if (nightMode === 'MUTE') {
            playSoundAndMail = false;
          } else if (nightMode === 'MAJOR_ONLY') {
            playSoundAndMail = isMajorMovement(rule, price, quote, change1M, change5M);
          }
        }

        // Play audio alert synthesiser
        if (playSoundAndMail && soundEnabled) {
          if (rule.criteria === 'ABOVE') {
            audioSynth.playBell();
          } else if (rule.criteria === 'BELOW') {
            audioSynth.playElectronic();
          } else {
            audioSynth.playSiren();
          }
        }

        // Assemble reason description
        let reason = '';
        if (rule.criteria === 'ABOVE') {
          reason = `最新价格 ${price.toFixed(2)} 元/克 已经突破设定的目标卖出价 ${rule.targetValue.toFixed(2)} 元/克。`;
        } else if (rule.criteria === 'BELOW') {
          reason = `最新价格 ${price.toFixed(2)} 元/克 已经跌破设定的目标买入价 ${rule.targetValue.toFixed(2)} 元/克。`;
        } else if (rule.criteria === 'SURGE_1M') {
          reason = `价格在 1 分钟内急剧暴涨了 ${change1M.toFixed(2)}%，突破了 ${rule.targetValue}% 的报警阈值。现价 ${price.toFixed(2)} 元/克。`;
        } else if (rule.criteria === 'DROP_1M') {
          reason = `价格在 1 分钟内急剧暴跌了 ${Math.abs(change1M).toFixed(2)}%，突破了 ${rule.targetValue}% 的报警阈值。现价 ${price.toFixed(2)} 元/克。`;
        } else if (rule.criteria === 'SURGE_5M') {
          reason = `价格在 5 分钟内急剧急涨了 ${change5M.toFixed(2)}%，突破了 ${rule.targetValue}% 的报警阈值。现价 ${price.toFixed(2)} 元/克。`;
        } else if (rule.criteria === 'DROP_5M') {
          reason = `价格在 5 分钟内急剧急跌了 ${Math.abs(change5M).toFixed(2)}%，突破了 ${rule.targetValue}% 的报警阈值。现价 ${price.toFixed(2)} 元/克。`;
        }

        // Send real email alert (async)
        let emailPromise = Promise.resolve<string | null>(null);
        if (playSoundAndMail && emailEnabled && alertEmail) {
          emailPromise = sendEmailAlert(rule, price, reason);
        }

        // Add Log
        const logId = Math.random().toString(36).substring(2, 9);
        
        emailPromise.then((sandboxPreviewUrl) => {
          const newLog: TriggerLog = {
            id: logId,
            ruleId: rule.id,
            goldType: rule.goldType,
            criteria: rule.criteria,
            targetValue: rule.targetValue,
            triggeredPrice: price,
            timestamp: now,
            // Custom fields stored on triggers for Ethereal email sandboxing visualization
            emailSent: playSoundAndMail && emailEnabled,
            emailPreviewUrl: sandboxPreviewUrl || undefined
          } as any;

          setTriggerLogs((prev) => [newLog, ...prev]);
        });

        setTriggeredCount((prev) => prev + 1);

        // Flash visual alert banner
        setActiveVisualTrigger({
          goldType: rule.goldType,
          criteria: rule.criteria,
          targetValue: rule.targetValue,
          triggeredPrice: price,
        });

        // Auto hide visual overlay after 6s
        setTimeout(() => {
          setActiveVisualTrigger((current) => {
            if (current && current.targetValue === rule.targetValue && current.goldType === rule.goldType) {
              return null;
            }
            return current;
          });
        }, 6000);

        return {
          ...rule,
          isTriggered: true,
          lastTriggeredAt: now,
        };
      }

      return rule;
    });

    if (rulesUpdated) {
      setRules(nextRules);
    }
  };

  // Rule Handlers
  const addRule = (goldType: GoldType, criteria: AlertCriteria, targetValue: number) => {
    const newRule: AlertRule = {
      id: Math.random().toString(36).substring(2, 9),
      goldType,
      criteria,
      targetValue,
      active: true,
      isTriggered: false,
      createdAt: Date.now(),
    };
    setRules((prev) => [newRule, ...prev]);
  };

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) => {
        if (rule.id === id) {
          const nextActive = !rule.active;
          return {
            ...rule,
            active: nextActive,
            // When toggled back ON, we reset its triggered state to let it monitor afresh
            isTriggered: nextActive ? false : rule.isTriggered,
          };
        }
        return rule;
      })
    );
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Holding Handlers
  const addHolding = (goldType: GoldType, weight: number, buyPrice: number, label: string) => {
    const newHolding: GoldHolding = {
      id: Math.random().toString(36).substring(2, 9),
      goldType,
      weight,
      buyPrice,
      label,
    };
    setHoldings((prev) => [newHolding, ...prev]);
  };

  const deleteHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  // Price overrides from simulator console
  const handlePriceOverride = (goldType: GoldType, price: number) => {
    const cleanPrice = parseFloat(price.toFixed(2));
    if (goldType === 'AU9999') {
      setAu9999((prev) => {
        const absoluteChange = parseFloat((cleanPrice - prev.lastSettlement).toFixed(2));
        const percentChange = parseFloat(((absoluteChange / prev.lastSettlement) * 100).toFixed(2));
        const newHistory = [...prev.history1D, cleanPrice].slice(-25);
        return {
          ...prev,
          price: cleanPrice,
          high: Math.max(prev.high, cleanPrice),
          low: Math.min(prev.low, cleanPrice),
          change: absoluteChange,
          changePercent: percentChange,
          history1D: newHistory,
        };
      });
    } else {
      setAutd((prev) => {
        const absoluteChange = parseFloat((cleanPrice - prev.lastSettlement).toFixed(2));
        const percentChange = parseFloat(((absoluteChange / prev.lastSettlement) * 100).toFixed(2));
        const newHistory = [...prev.history1D, cleanPrice].slice(-25);
        return {
          ...prev,
          price: cleanPrice,
          high: Math.max(prev.high, cleanPrice),
          low: Math.min(prev.low, cleanPrice),
          change: absoluteChange,
          changePercent: percentChange,
          history1D: newHistory,
        };
      });
    }
  };

  // Simulate extreme flash event instantly
  const handleTriggerSuddenEvent = (goldType: GoldType, eventType: 'surge' | 'drop') => {
    const targetQuote = goldType === 'AU9999' ? au9999 : autd;
    const currentPrice = targetQuote.price;
    // Inject a sudden 1.5% spike or flash crash
    const coefficient = eventType === 'surge' ? 1.015 : 0.985;
    const overriddenPrice = parseFloat((currentPrice * coefficient).toFixed(2));
    
    // Inject event sequence: push current price as index-basis, then jump price to guarantee threshold breach!
    if (goldType === 'AU9999') {
      setAu9999((prev) => {
        const historic = [...prev.history1D];
        // Ensure index comparison references a stable level so mathematical ratio triggers perfectly!
        if (historic.length >= 6) {
          historic[historic.length - 6] = currentPrice;
        }
        const updated = [...historic, overriddenPrice].slice(-25);
        const absoluteChange = parseFloat((overriddenPrice - prev.lastSettlement).toFixed(2));
        const percentChange = parseFloat(((absoluteChange / prev.lastSettlement) * 100).toFixed(2));

        return {
          ...prev,
          price: overriddenPrice,
          high: Math.max(prev.high, overriddenPrice),
          low: Math.min(prev.low, overriddenPrice),
          change: absoluteChange,
          changePercent: percentChange,
          history1D: updated,
        };
      });
    } else {
      setAutd((prev) => {
        const historic = [...prev.history1D];
        if (historic.length >= 6) {
          historic[historic.length - 6] = currentPrice;
        }
        const updated = [...historic, overriddenPrice].slice(-25);
        const absoluteChange = parseFloat((overriddenPrice - prev.lastSettlement).toFixed(2));
        const percentChange = parseFloat(((absoluteChange / prev.lastSettlement) * 100).toFixed(2));

        return {
          ...prev,
          price: overriddenPrice,
          high: Math.max(prev.high, overriddenPrice),
          low: Math.min(prev.low, overriddenPrice),
          change: absoluteChange,
          changePercent: percentChange,
          history1D: updated,
        };
      });
    }
  };

  const clearLogs = () => {
    setTriggerLogs([]);
    localStorage.removeItem('gold_trigger_logs');
  };

  const resetTriggeredCount = () => {
    setTriggeredCount(0);
    // Also reset triggered states of rules so they continue monitoring
    setRules((prev) =>
      prev.map((rule) => ({
        ...rule,
        isTriggered: false,
      }))
    );
  };

  if (sharedReportId) {
    return (
      <div className="bg-[#F8F9FA] dark:bg-[#0f172a] text-[#1A1A1A] dark:text-gray-100 min-h-screen font-sans flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900 transition-colors duration-300">
        <header className="border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 transition-colors duration-250">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
                <Sparkles className="w-5 h-5 animate-pulse text-amber-105" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                  沪金 AI 智能研判分享
                </h1>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  来自沪金极简实时助手的云端研报
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                window.history.replaceState({}, '', window.location.pathname);
                setSharedReportId(null);
              }}
              className="text-xs px-3 py-1.5 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              返回我的控制台
            </button>
          </div>
        </header>

        <main className="max-w-3xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center">
          {sharedReportLoading ? (
            <div className="text-center py-12 space-y-4">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/10" />
                <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
              </div>
              <p className="text-xs text-gray-500">正在云端调取 AI 黄金研报数据...</p>
            </div>
          ) : sharedReportError ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-[28px] p-8 shadow-sm text-center max-w-md mx-auto space-y-4">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">研报加载失败</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{sharedReportError}</p>
              <button
                onClick={() => {
                  window.history.replaceState({}, '', window.location.pathname);
                  setSharedReportId(null);
                }}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors"
              >
                返回控制台主页
              </button>
            </div>
          ) : sharedReportData ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
              {/* Gold Prices at Analysis time */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    SGE GOLD REPORT
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1.5">
                    沪金云端智能投资研报
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>研报生成时间: {new Date(sharedReportData.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {sharedReportData.prices.au9999 && (
                    <div className="bg-gray-50 dark:bg-gray-950 p-2.5 rounded-xl border border-gray-100 dark:border-gray-805 min-w-[100px] text-center">
                      <span className="text-[9px] text-gray-400 block font-bold">AU99.99 报价</span>
                      <span className="text-base font-bold font-mono text-gray-800 dark:text-gray-200 mt-0.5 block">
                        {sharedReportData.prices.au9999.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {sharedReportData.prices.autd && (
                    <div className="bg-gray-50 dark:bg-gray-950 p-2.5 rounded-xl border border-gray-100 dark:border-gray-805 min-w-[100px] text-center">
                      <span className="text-[9px] text-gray-400 block font-bold">AU(T+D) 报价</span>
                      <span className="text-base font-bold font-mono text-gray-800 dark:text-gray-200 mt-0.5 block">
                        {sharedReportData.prices.autd.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Body */}
              <div className="bg-gray-50 dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-855 overflow-hidden">
                <SimpleMarkdown text={sharedReportData.analysis} />
              </div>

              {/* Risk warning */}
              <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 text-[10px] text-amber-800 leading-relaxed">
                <strong>风险警示:</strong> 本报告仅作为投资技术面与宏观面分析的交流分享，不构成具体建仓与投资建议。杠杆贵金属交易属于高风险投资品种，请独立评估并严控风险。
              </div>
            </div>
          ) : null}
        </main>

        <footer className="border-t border-gray-100 bg-white py-6 text-center text-gray-400 text-[10px] font-bold tracking-widest uppercase mt-12">
          <p>© 2026 沪金极简实时助手 · 云端研报分享系统</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] dark:bg-[#0f172a] text-[#1A1A1A] dark:text-gray-100 min-h-screen font-sans flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900 transition-colors duration-300">
      {/* Top Header Section */}
      <GoldHeader
        activeRulesCount={rules.filter((r) => r.active).length}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        triggeredCount={triggeredCount}
        resetTriggeredCount={resetTriggeredCount}
        connectionStatus={connectionStatus}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        
        {/* Urgent Trigger Floating Notification */}
        {activeVisualTrigger && (
          <div className="bg-rose-50/95 border border-rose-200 text-rose-900 rounded-3xl p-5 flex items-center justify-between shadow-md shadow-rose-100 animate-slideDown max-w-4xl mx-auto">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 animate-bounce">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-md tracking-wider uppercase">价格警报已触发</span>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {activeVisualTrigger.goldType === 'AU9999' ? '沪金 AU99.99' : '沪金 AU(T+D)'}
                  {'已达到预警条件：'}
                  {activeVisualTrigger.criteria === 'ABOVE' && '价格高于'}
                  {activeVisualTrigger.criteria === 'BELOW' && '价格低于'}
                  {activeVisualTrigger.criteria === 'SURGE_1M' && '单分钟暴涨超'}
                  {activeVisualTrigger.criteria === 'DROP_1M' && '单分钟暴跌超'}
                  <span className="font-mono text-amber-600 px-1 font-extrabold text-base">
                    {activeVisualTrigger.targetValue.toFixed(2)}
                    {activeVisualTrigger.criteria.includes('1M') ? '%' : '元'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  触发时刻报价：<span className="font-mono text-gray-800 font-bold">{activeVisualTrigger.triggeredPrice.toFixed(2)} 元/克</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveVisualTrigger(null)}
              className="p-1.5 hover:bg-rose-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Top Section Grid (Quotes cards + Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Block (8 columns) - Quotes and Live Area Chart */}
          <div className="lg:col-span-8 flex flex-col gap-6 justify-between">
            {/* Live Cards */}
            <PriceCards
              au9999={au9999}
              autd={autd}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
            />

            {/* Interactive chart */}
            <PriceChart quote={selectedType === 'AU9999' ? au9999 : autd} darkMode={darkMode} />
          </div>

          {/* Right Block (4 columns) - Alert Configuring manager */}
          <div className="lg:col-span-4 h-full">
            <AlertManager
              au9999={au9999}
              autd={autd}
              rules={rules}
              addRule={addRule}
              toggleRule={toggleRule}
              deleteRule={deleteRule}
              triggerLogs={triggerLogs}
              clearLogs={clearLogs}
              emailEnabled={emailEnabled}
              setEmailEnabled={setEmailEnabled}
              alertEmail={alertEmail}
              setAlertEmail={setAlertEmail}
              nightMode={nightMode}
              setNightMode={setNightMode}
              smtpConfig={smtpConfig}
              setSmtpConfig={setSmtpConfig}
            />
          </div>
        </div>

        {/* Bottom Section Grid (Calculator + AI reports) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Portfolio holdings calculator (7 columns) */}
          <div className="lg:col-span-7 h-full">
            <HoldingsCalculator
              au9999={au9999}
              autd={autd}
              holdings={holdings}
              addHolding={addHolding}
              deleteHolding={deleteHolding}
            />
          </div>

          {/* AI Intelligence reports (5 columns) */}
          <div className="lg:col-span-5 h-full">
            <AiAnalyst au9999={au9999} autd={autd} />
          </div>
        </div>

        {/* Real-time Market Statistics & Volatility Widget */}
        <MarketStatsWidget au9999={au9999} autd={autd} />



      </main>

      {/* Humble Footer */}
      <footer className="border-t border-gray-100 bg-white py-6 text-center text-gray-400 text-[10px] font-bold tracking-widest uppercase mt-12">
        <p>© 2026 沪金极简实时助手 · 沪金 AU99.99 和 AU(T+D) 双轨运行监控系统</p>
      </footer>
    </div>
  );
}
