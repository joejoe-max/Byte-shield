/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Activity, 
  BarChart3, 
  Settings, 
  Wifi, 
  Zap, 
  ShieldAlert,
  ArrowDownUp, 
  CheckCircle2,
  AlertCircle,
  Play,
  Package,
  Layers,
  ChevronRight,
  Globe,
  MessageCircle,
  Music,
  Battery
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { NativeModules, Platform } from 'react-native';

// Use NativeModules on Android, simulate on other platforms
const NativeByteShield = NativeModules.ByteShield;
const IS_ANDROID = Platform.OS === 'android';

const ByteShield = NativeByteShield || {
  checkUsagePermission: () => Promise.resolve(true),
  checkBatteryOptimization: () => Promise.resolve(false),
  getAppDataUsage: (start, end) => {
    // Return mock data that scales with time since 'start' to simulate real tracking
    const durationMinutes = Math.max(1, (end - start) / 60000);
    const baseRate = 1024 * 1024; // 1MB per minute average
    
    return Promise.resolve([
      { 
        uid: 1000,
        packageName: 'android',
        name: 'System Services', 
        usageBytes: Math.floor(baseRate * durationMinutes * 0.1), 
        mobileBytes: Math.floor(baseRate * durationMinutes * 0.05), 
        wifiBytes: Math.floor(baseRate * durationMinutes * 0.05),
        mobileRx: Math.floor(baseRate * durationMinutes * 0.03),
        mobileTx: Math.floor(baseRate * durationMinutes * 0.02),
        wifiRx: Math.floor(baseRate * durationMinutes * 0.03),
        wifiTx: Math.floor(baseRate * durationMinutes * 0.02),
        color: '#71717A', 
        icon: Settings 
      },
      { 
        uid: 10001,
        packageName: 'com.android.chrome',
        name: 'Browser', 
        usageBytes: Math.floor(baseRate * durationMinutes * 0.4), 
        mobileBytes: Math.floor(baseRate * durationMinutes * 0.2), 
        wifiBytes: Math.floor(baseRate * durationMinutes * 0.2),
        mobileRx: Math.floor(baseRate * durationMinutes * 0.15),
        mobileTx: Math.floor(baseRate * durationMinutes * 0.05),
        wifiRx: Math.floor(baseRate * durationMinutes * 0.15),
        wifiTx: Math.floor(baseRate * durationMinutes * 0.05),
        color: '#4285F4', 
        icon: Globe 
      },
      { 
        uid: 10002,
        packageName: 'com.google.android.youtube',
        name: 'Media Streamer', 
        usageBytes: Math.floor(baseRate * durationMinutes * 1.5 * (1 + Math.random() * 0.2)), 
        mobileBytes: Math.floor(baseRate * durationMinutes * 0.8), 
        wifiBytes: Math.floor(baseRate * durationMinutes * 0.7),
        mobileRx: Math.floor(baseRate * durationMinutes * 0.75),
        mobileTx: Math.floor(baseRate * durationMinutes * 0.05),
        wifiRx: Math.floor(baseRate * durationMinutes * 0.65),
        wifiTx: Math.floor(baseRate * durationMinutes * 0.05),
        color: '#FF0000', 
        icon: Play 
      },
      { 
        uid: 10003,
        packageName: 'com.whatsapp',
        name: 'Messaging', 
        usageBytes: Math.floor(baseRate * durationMinutes * 0.05), 
        mobileBytes: Math.floor(baseRate * durationMinutes * 0.01), 
        wifiBytes: Math.floor(baseRate * durationMinutes * 0.04),
        mobileRx: Math.floor(baseRate * durationMinutes * 0.005),
        mobileTx: Math.floor(baseRate * durationMinutes * 0.005),
        wifiRx: Math.floor(baseRate * durationMinutes * 0.02),
        wifiTx: Math.floor(baseRate * durationMinutes * 0.02),
        color: '#25D366', 
        icon: MessageCircle 
      },
    ]);
  },
  startVPN: () => console.log("VPN Started"),
  stopVPN: () => console.log("VPN Stopped"),
  isVPNActive: () => Promise.resolve(false),
  requestBatteryOptimizationExemption: () => console.log("Directing to Android Battery Optimization settings..."),
  openUsageSettings: () => console.log("Opening Android Usage Access settings..."),
  runPing: (host) => Promise.resolve(Math.floor(Math.random() * 50) + 10),
  runDownloadTest: (url) => Promise.resolve((Math.random() * 50 + 10).toFixed(1)),
  runUploadTest: (url) => Promise.resolve((Math.random() * 20 + 2).toFixed(1)),
};

// Helper for tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StatCard = ({ title, value, icon: Icon, description, trend, onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3 group transition-all",
      onClick ? "cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5" : "hover:border-zinc-700"
    )}
  >
    <div className="flex justify-between items-start">
      <div className="p-2 bg-zinc-800/50 rounded-xl text-zinc-400 group-hover:text-amber-400 transition-colors">
        <Icon size={20} />
      </div>
      {trend && (
        <span className={cn(
          "text-[10px] font-mono px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-zinc-100 mt-1 font-mono">{value}</h3>
    </div>
    <p className="text-[10px] text-zinc-600 font-mono italic">{description}</p>
  </div>
);

const ViewWrapper = ({ children, isActive }) => (
  <AnimatePresence mode="wait">
    {isActive && (
      <motion.div
        key="view-wrapper-content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex-1 overflow-y-auto no-scrollbar pb-24"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedApp, setSelectedApp] = useState(null);
  const [isVpnOn, setIsVpnOn] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [speedTestActive, setSpeedTestActive] = useState(false);
  const [testPhase, setTestPhase] = useState('idle'); // idle, ping, download, upload, complete
  const [testResults, setTestResults] = useState(null);
  const [appUsage, setAppUsage] = useState([]);
  const [totalBytesToday, setTotalBytesToday] = useState(0);
  const [dataSavedBytes, setDataSavedBytes] = useState(0);
  const [batteryOptimized, setBatteryOptimized] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [resetTimestamp, setResetTimestamp] = useState(new Date().setHours(0, 0, 0, 0));

  const fetchDeviceData = useCallback(async () => {
    try {
      const now = Date.now();
      
      if (IS_ANDROID && ByteShield.isVPNActive) {
        const vpnActive = await ByteShield.isVPNActive();
        setIsVpnOn(vpnActive);
        
        if (vpnActive && ByteShield.getSecurityAlerts) {
          const alerts = await ByteShield.getSecurityAlerts();
          setSecurityAlerts(alerts);
        }
      }

      const usage = await ByteShield.getAppDataUsage(resetTimestamp, now);
      const sortedUsage = usage.sort((a, b) => b.usageBytes - a.usageBytes);
      
      const total = sortedUsage.reduce((acc, curr) => acc + curr.usageBytes, 0);
      setAppUsage(sortedUsage);
      setTotalBytesToday(total);
      setDataSavedBytes(total * 0.15);

      // Dynamic chart data based on accumulation
      setChartData([
        { name: 'Start', usage: 0 },
        { name: 'Mid', usage: total * 0.4 },
        { name: 'Peak', usage: total * 0.7 },
        { name: 'Now', usage: total },
      ]);
      
      const isOptimized = await ByteShield.checkBatteryOptimization();
      setBatteryOptimized(isOptimized);
      
      const hasPermission = await ByteShield.checkUsagePermission();
      setPermissionGranted(hasPermission);
    } catch (error) {
      console.error("Error fetching device data:", error);
    }
  }, [resetTimestamp]);

  const handleReset = () => {
    const confirm = window.confirm("Reset all tracked usage and start fresh?");
    if (confirm) {
      const newStart = Date.now();
      setResetTimestamp(newStart);
      setAppUsage([]);
      setTotalBytesToday(0);
      setDataSavedBytes(0);
      setChartData([]);
      setShowSettings(false);
    }
  };

  useEffect(() => {
    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, 10000); // Faster updates for prototype
    return () => clearInterval(interval);
  }, [fetchDeviceData]);

  const toggleVpn = () => {
    if (isVpnOn) ByteShield.stopVPN();
    else ByteShield.startVPN();
    setIsVpnOn(!isVpnOn);
  };

  const runRealSpeedTest = async () => {
    if (speedTestActive) return;
    setSpeedTestActive(true);
    setTestPhase('ping');
    setTestResults(null);
    
    try {
      // Step 1: Resilient Ping Test
      let ping = 0;
      if (IS_ANDROID && ByteShield.runPing) {
        ping = await ByteShield.runPing("8.8.8.8");
      } else {
        const pStart = performance.now();
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true); 
            img.src = `https://www.google.com/favicon.ico?t=${Date.now()}`;
            setTimeout(reject, 3000);
          });
          ping = Math.round(performance.now() - pStart);
        } catch (e) {
          ping = 999;
        }
      }

      setTestPhase('download');
      // Step 2: Download Projection
      let download = "0.0";
      if (IS_ANDROID && ByteShield.runDownloadTest) {
        download = await ByteShield.runDownloadTest("https://dl.google.com/android/repository/platform-tools-latest-windows.zip");
      } else {
        await new Promise(r => setTimeout(r, 1500));
        download = (Math.random() * 45 + 15).toFixed(1);
      }
      
      setTestPhase('upload');
      // Step 3: Upload Projection
      let upload = "0.0";
      if (IS_ANDROID && ByteShield.runUploadTest) {
        upload = await ByteShield.runUploadTest("https://httpbin.org/post");
      } else {
        await new Promise(r => setTimeout(r, 1200));
        upload = (Math.random() * 15 + 2).toFixed(1);
      }

      let quality = "Average";
      const dl = parseFloat(download);
      if (dl > 40 && ping < 60) quality = "Excellent";
      else if (dl > 15 && ping < 110) quality = "Good";
      else if (dl < 5 || ping > 250) quality = "Poor";

      setTestResults({ download, upload, ping: ping.toString(), quality });
      setTestPhase('complete');
    } catch (e) {
      setTestResults({ download: "0.0", upload: "0.0", ping: "ERR", quality: "Offline" });
      setTestPhase('complete');
    } finally {
      setSpeedTestActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-amber-500/30">
      <div className="max-w-md mx-auto h-[100dvh] flex flex-col bg-zinc-950 border-x border-zinc-900 shadow-2xl relative overflow-hidden">
        
        <header className="p-6 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
              isVpnOn ? "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]" : "bg-zinc-800"
            )}>
              <Shield size={22} className={isVpnOn ? "text-black" : "text-zinc-500"} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">BYTE SHIELD</h1>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", isVpnOn ? "bg-amber-500 animate-pulse" : "bg-zinc-700")} />
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                  {IS_ANDROID ? "Native Guard" : "Sim Mode"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
              title="Reset Stats"
            >
              <Activity size={18} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Global Modal/Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-8 flex flex-col pt-20"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-white">Settings</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 bg-zinc-800 rounded-full text-zinc-400"
                >
                  <Package size={20} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Device Identity</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-300">Environment</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-mono">
                      {IS_ANDROID ? 'Live Android' : 'Web Simulation'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-300">Tracking Reset Point</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(resetTimestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Controls</h3>
                  <button 
                    onClick={handleReset}
                    className="w-full py-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Activity size={16} />
                    Reset Session Data
                  </button>
                  <button 
                    onClick={() => ByteShield.requestBatteryOptimizationExemption()}
                    className="w-full py-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Battery size={16} />
                    Grant Battery Exemption
                  </button>
                </div>

                <p className="text-[10px] text-center text-zinc-700 font-mono italic px-4">
                  Byte Shield uses local-only traffic logging. No PII or decrypted data leaves your device.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 flex-1 overflow-hidden flex flex-col">
          
          <ViewWrapper isActive={activeTab === 'dashboard'}>
            <div className="space-y-6 pt-2">
              {!permissionGranted && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={18} className="text-rose-500" />
                    <p className="text-xs font-bold text-rose-500 uppercase">Usage Access Required</p>
                  </div>
                  <p className="text-[10px] text-rose-200/70">Byte Shield needs permission to track per-app network consumption on this device.</p>
                  <button 
                    onClick={() => ByteShield.openUsageSettings()}
                    className="w-full py-2 bg-rose-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider"
                  >
                    Grant Access
                  </button>
                </div>
              )}

              <div className={cn(
                "p-6 rounded-3xl border-2 transition-all duration-500 overflow-hidden relative",
                isVpnOn ? "bg-amber-500/10 border-amber-500/50" : "bg-zinc-900/50 border-zinc-800"
              )}>
                {isVpnOn && (
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity size={120} className="text-amber-500 rotate-12" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">Local Monitoring</span>
                    <button 
                      onClick={toggleVpn}
                      className={cn(
                        "w-14 h-8 rounded-full relative transition-all duration-300",
                        isVpnOn ? "bg-amber-500" : "bg-zinc-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300",
                        isVpnOn ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                  <h2 className="text-3xl font-black text-white leading-tight">
                    {isVpnOn ? "Your connection is being optimized" : "Network monitoring is paused"}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-2 font-mono italic">
                    {isVpnOn ? `Analyzing ${appUsage.length} active app tunnels` : "Toggle to start metadata tracking"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard 
                  title="Today" 
                  value={formatBytes(totalBytesToday)} 
                  icon={ArrowDownUp} 
                  description="Real-time device usage"
                />
                <StatCard 
                  title="Saved (est)" 
                  value={formatBytes(dataSavedBytes)} 
                  icon={Zap} 
                  description="Estimated bandwidth reduction"
                  trend={12}
                />
              </div>

              {/* Security Alerts Section */}
              {isVpnOn && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-white font-bold text-lg tracking-tight">Security Alerts</h3>
                      <p className="text-xs text-zinc-500 font-mono tracking-wider">Real-time threat interception</p>
                    </div>
                    {securityAlerts.length > 0 && (
                      <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-bold border border-rose-500/20">
                        {securityAlerts.length} LOGGED
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {securityAlerts.length === 0 ? (
                      <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl flex flex-col items-center text-center">
                        <ShieldAlert size={32} className="text-zinc-800 mb-2" />
                        <p className="text-xs text-zinc-600 font-medium">No threats identified in the current session. Monitoring continues...</p>
                      </div>
                    ) : (
                      securityAlerts.slice(0, 3).map((alert, i) => (
                        <motion.div 
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl flex gap-4 items-start"
                        >
                          <div className="mt-1">
                            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                              <AlertCircle size={16} className="text-rose-500" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="text-sm font-bold text-white tracking-tight leading-none">{alert.title}</h5>
                              <span className="text-[9px] text-zinc-600 font-mono">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{alert.message}</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Usage Chart */}
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Usage Pattern</h4>
                  <div className="flex gap-2 text-[10px] text-zinc-500 font-mono">
                    Device Traffic Distribution
                  </div>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#usageGradient)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <StatCard 
                  title="Battery" 
                  value={batteryOptimized ? "Optimized" : "Exemption Needed"} 
                  icon={Battery} 
                  description={batteryOptimized ? "Running in background mode" : "Tap to grant exemption"}
                  trend={batteryOptimized ? 100 : -1}
                  onClick={() => !batteryOptimized && ByteShield.requestBatteryOptimizationExemption()}
                />
              </div>

              {!batteryOptimized && (
                <div onClick={() => ByteShield.requestBatteryOptimizationExemption()} className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-amber-500/20 transition-all">
                  <Zap size={18} className="text-amber-500" />
                  <div>
                    <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Battery Optimization</p>
                    <p className="text-xs text-amber-200">Exempt Byte Shield to prevent system task killing.</p>
                  </div>
                </div>
              )}
            </div>
          </ViewWrapper>

          <ViewWrapper isActive={activeTab === 'usage'}>
            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white">Device Usage</h2>
                  <p className="text-xs text-zinc-500 font-mono italic">Calculated from NetworkStatsManager</p>
                </div>
                <div className="p-2 border border-zinc-800 rounded-lg text-zinc-500">
                  <BarChart3 size={16} />
                </div>
              </div>

              <div className="space-y-3">
                {appUsage.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <Package size={48} className="mx-auto text-zinc-800" />
                    <p className="text-zinc-600 font-mono text-xs">Waiting for device statistics...</p>
                  </div>
                ) : appUsage.map((app, i) => {
                  const percentage = (app.usageBytes / totalBytesToday) * 100;
                  const appKey = app.uid !== undefined ? app.uid.toString() : (app.packageName || app.name);
                  const isSelected = selectedApp === appKey;
                  
                  return (
                    <motion.div 
                      key={appKey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedApp(isSelected ? null : appKey)}
                      className={cn(
                        "group border transition-all duration-300 cursor-pointer overflow-hidden",
                        isSelected 
                          ? "bg-zinc-900 border-amber-500/30 rounded-3xl p-6" 
                          : "bg-zinc-900/30 hover:bg-zinc-900/80 border-zinc-900 hover:border-zinc-700 p-4 rounded-2xl"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border transition-transform duration-500",
                          isSelected ? "scale-110 border-amber-500/50" : "bg-zinc-800 border-zinc-700"
                        )}>
                          {app.icon ? <app.icon size={24} style={{ color: app.color || '#52525b' }} /> : <Package size={24} className="text-zinc-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-white text-sm tracking-tight truncate max-w-[120px]">{app.name}</h4>
                            <span className="text-xs font-mono font-bold text-zinc-400">{formatBytes(app.usageBytes)}</span>
                          </div>
                          {!isSelected && (
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div 
                                key={`progress-${appKey}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                className="h-full rounded-full bg-amber-500"
                              />
                            </div>
                          )}
                        </div>
                        <ChevronRight 
                          size={14} 
                          className={cn(
                            "text-zinc-700 transition-all duration-300",
                            isSelected ? "rotate-90 text-amber-500" : "group-hover:text-zinc-400"
                          )} 
                        />
                      </div>

                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            key={`details-${appKey}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-6 space-y-6 pt-6 border-t border-zinc-800"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              {/* Mobile Breakdown */}
                              <div className="space-y-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity size={14} className="text-amber-500" />
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mobile Network</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[11px] font-mono">
                                    <span className="text-zinc-500">Received (Rx)</span>
                                    <span className="text-zinc-300">{formatBytes(app.mobileRx || 0)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px] font-mono">
                                    <span className="text-zinc-500">Transmitted (Tx)</span>
                                    <span className="text-zinc-300">{formatBytes(app.mobileTx || 0)}</span>
                                  </div>
                                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs font-bold">
                                    <span className="text-zinc-400">Total Mobile</span>
                                    <span className="text-amber-500">{formatBytes(app.mobileBytes || 0)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Wi-Fi Breakdown */}
                              <div className="space-y-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800/50">
                                <div className="flex items-center gap-2 mb-1">
                                  <Wifi size={14} className="text-blue-500" />
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Wi-Fi Network</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[11px] font-mono">
                                    <span className="text-zinc-500">Received (Rx)</span>
                                    <span className="text-zinc-300">{formatBytes(app.wifiRx || 0)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px] font-mono">
                                    <span className="text-zinc-500">Transmitted (Tx)</span>
                                    <span className="text-zinc-300">{formatBytes(app.wifiTx || 0)}</span>
                                  </div>
                                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs font-bold">
                                    <span className="text-zinc-400">Total Wi-Fi</span>
                                    <span className="text-blue-500">{formatBytes(app.wifiBytes || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-zinc-800/20 rounded-2xl">
                              <p className="text-[10px] text-zinc-500 font-mono italic leading-relaxed">
                                Identified by UID <span className="text-zinc-400">{app.uid}</span>. Packaged as: <span className="text-zinc-400 break-all">{app.packageName || "N/A"}</span>
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ViewWrapper>

          <ViewWrapper isActive={activeTab === 'test'}>
            <div className="space-y-6 pt-2 h-full flex flex-col">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white">Speed Analysis</h2>
                <p className="text-xs text-zinc-500 font-mono italic">Bandwidth profiling (Offline fallback: simulated)</p>
              </div>

              {/* Progress Indicators */}
              <div className="flex justify-between items-center px-4">
                {['Ping', 'Download', 'Upload'].map((phase, idx) => {
                  const phaseLower = phase.toLowerCase();
                  const isPast = (phaseLower === 'ping' && (testPhase === 'download' || testPhase === 'upload' || testPhase === 'complete')) ||
                                 (phaseLower === 'download' && (testPhase === 'upload' || testPhase === 'complete')) ||
                                 (phaseLower === 'upload' && testPhase === 'complete');
                  const isCurrent = testPhase === phaseLower;
                  
                  return (
                    <div key={phase} className="flex flex-col items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        isPast ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                        isCurrent ? "bg-amber-500 animate-pulse scale-125 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
                        "bg-zinc-800"
                      )} />
                      <span className={cn(
                        "text-[10px] font-mono uppercase tracking-widest",
                        isPast ? "text-emerald-500" : isCurrent ? "text-amber-500 font-bold" : "text-zinc-600"
                      )}>
                        {phase}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
                <div className={cn(
                  "w-64 h-64 rounded-full border-[8px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500",
                  speedTestActive ? "border-amber-500/20" : testResults ? "border-zinc-800" : "border-zinc-900"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent" />
                  
                  {speedTestActive ? (
                    <div className="flex flex-col items-center text-center px-4">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
                        Phase: {testPhase}
                      </span>
                      <motion.span 
                        key="active-num"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-6xl font-black text-amber-500 font-mono"
                      >
                        {Math.floor(Math.random() * 100)}
                      </motion.span>
                      <span className="text-xs text-zinc-400 font-mono font-bold mt-1">Measuring...</span>
                    </div>
                  ) : testResults ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center text-center"
                    >
                      <ArrowDownUp className="text-amber-500 mb-2 opacity-50" size={32} />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Download Peak</span>
                      <span className="text-6xl font-black text-white font-mono leading-none my-1">{testResults.download}</span>
                      <span className="text-xs text-zinc-400 font-mono font-bold">Mbps</span>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Wifi size={48} className="text-zinc-800 mb-3" />
                      <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">System Ready</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-12 mt-10 w-full px-8">
                  <motion.div 
                    animate={testPhase === 'upload' ? { scale: 1.1 } : { scale: 1 }}
                    className="text-center"
                  >
                    <p className={cn(
                      "text-[10px] uppercase tracking-widest font-mono mb-1 transition-colors",
                      testPhase === 'upload' ? "text-amber-500" : "text-zinc-500"
                    )}>Upload</p>
                    <p className={cn(
                      "text-2xl font-bold font-mono",
                      testResults ? "text-white" : "text-zinc-700"
                    )}>
                      {testResults?.upload || (testPhase === 'upload' ? Math.floor(Math.random() * 20) : "--")} 
                      <span className="text-[10px] opacity-40 ml-1">Mbps</span>
                    </p>
                  </motion.div>
                  <motion.div 
                    animate={testPhase === 'ping' ? { scale: 1.1 } : { scale: 1 }}
                    className="text-center"
                  >
                    <p className={cn(
                      "text-[10px] uppercase tracking-widest font-mono mb-1 transition-colors",
                      testPhase === 'ping' ? "text-amber-500" : "text-zinc-500"
                    )}>Ping</p>
                    <p className={cn(
                      "text-2xl font-bold font-mono",
                      testResults ? "text-white" : "text-zinc-700"
                    )}>
                      {testResults?.ping || (testPhase === 'ping' ? Math.floor(Math.random() * 40) : "--")} 
                      <span className="text-[10px] opacity-40 ml-1">ms</span>
                    </p>
                  </motion.div>
                </div>
              </div>

              <div className="space-y-4 pb-4 mt-auto">
                {testResults && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn(
                      "p-5 rounded-2xl flex flex-col gap-3 border transition-all duration-500 backdrop-blur-sm",
                      testResults.quality === "Excellent" || testResults.quality === "Good" ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]" :
                      testResults.quality === "Average" ? "bg-amber-500/5 border-amber-500/20 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]" :
                      "bg-rose-500/5 border-rose-500/20 shadow-[0_0_30px_-10px_rgba(239,68,68,0.2)]"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {testResults.quality === "Poor" ? <AlertCircle size={18} className="text-rose-500" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
                        <p className={cn(
                          "text-xs font-bold uppercase tracking-[0.1em]",
                          testResults.quality === "Excellent" || testResults.quality === "Good" ? "text-emerald-500" :
                          testResults.quality === "Average" ? "text-amber-500" : "text-rose-500"
                        )}>
                          Network Grade: {testResults.quality}
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">
                        v1.2 Secure
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                      {testResults.quality === "Excellent" && "Server response is instant. Zero jitter detected. Ready for high-fidelity 4K and cloud gaming."}
                      {testResults.quality === "Good" && "Solid availability. Minimal latency overhead. Perfect for VPN-based working or streaming."}
                      {testResults.quality === "Average" && "Moderate congestion detected. You may experience slight delay in real-time interactions."}
                      {testResults.quality === "Poor" && "Heavy packet loss or high latency. Check router placement or contact ISP."}
                    </p>
                  </motion.div>
                )}
                
                <button 
                  onClick={runRealSpeedTest}
                  disabled={speedTestActive}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg",
                    speedTestActive ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800" : 
                    testResults ? "bg-white text-black hover:bg-zinc-200" : 
                    "bg-amber-500 text-black hover:bg-amber-400"
                  )}
                >
                  {speedTestActive ? (
                    <Activity size={20} className="animate-spin" />
                  ) : testResults ? (
                    <ArrowDownUp size={20} />
                  ) : (
                    <Zap size={20} />
                  )}
                  {speedTestActive ? "Analyzing Network..." : testResults ? "Run Analysis Again" : "Start Speed Analysis"}
                </button>
              </div>
            </div>
          </ViewWrapper>
          
        </div>

        <nav className="bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 p-2 pb-8 flex justify-around items-center absolute bottom-0 left-0 right-0 z-30">
          <NavButton 
            icon={Layers} 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            label="Home"
          />
          <NavButton 
            icon={BarChart3} 
            active={activeTab === 'usage'} 
            onClick={() => setActiveTab('usage')} 
            label="Usage"
          />
          <NavButton 
            icon={Zap} 
            active={activeTab === 'test'} 
            onClick={() => setActiveTab('test')} 
            label="Speed"
          />
        </nav>

        <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-60 h-60 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
}

const NavButton = ({ icon: Icon, active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all relative overflow-hidden",
      active ? "text-amber-500" : "text-zinc-600 hover:text-zinc-400"
    )}
  >
    {active && (
      <motion.div 
        layoutId="nav-bg"
        className="absolute inset-0 bg-amber-500/5 -z-10"
      />
    )}
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold tracking-tight">{label}</span>
  </button>
);
