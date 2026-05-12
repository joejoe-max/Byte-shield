import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  NativeModules,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import { 
  Shield, 
  Activity, 
  BarChart3, 
  Settings as SettingsIcon, 
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
  Battery
} from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const NativeByteShield = NativeModules.ByteShield;

const ByteShield = NativeByteShield || {
  checkUsagePermission: () => Promise.resolve(true),
  checkBatteryOptimization: () => Promise.resolve(false),
  getAppDataUsage: () => Promise.resolve([]),
  startVPN: () => console.log("VPN Started"),
  stopVPN: () => console.log("VPN Stopped"),
  isVPNActive: () => Promise.resolve(false),
  requestBatteryOptimizationExemption: () => console.log("Settings..."),
  openUsageSettings: () => console.log("Usage Settings..."),
  runPing: () => Promise.resolve(25),
  runDownloadTest: () => Promise.resolve("45.2"),
  runUploadTest: () => Promise.resolve("12.5"),
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StatCard = ({ title, value, icon: Icon, description, trend, onClick }) => (
  <TouchableOpacity 
    activeOpacity={0.7}
    onPress={onClick}
    style={styles.statCard}
  >
    <View style={styles.statCardHeader}>
      <View style={styles.iconContainer}>
        <Icon size={20} color="#71717A" />
      </View>
      {trend && (
        <View style={[styles.trendBadge, trend > 0 ? styles.trendUp : styles.trendDown]}>
          <Text style={[styles.trendText, trend > 0 ? styles.trendTextUp : styles.trendTextDown]}>
            {trend > 0 ? '+' : ''}{trend}%
          </Text>
        </View>
      )}
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Text style={styles.statDesc}>{description}</Text>
  </TouchableOpacity>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isVpnOn, setIsVpnOn] = useState(false);
  const [appUsage, setAppUsage] = useState([]);
  const [totalToday, setTotalToday] = useState(0);
  const [securityAlerts, setSecurityAlerts] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const vpnActive = await ByteShield.isVPNActive();
      setIsVpnOn(vpnActive);

      const now = Date.now();
      const start = now - 24 * 60 * 60 * 1000;
      const usage = await ByteShield.getAppDataUsage(start, now);
      setAppUsage(usage.sort((a, b) => b.usageBytes - a.usageBytes));
      setTotalToday(usage.reduce((acc, curr) => acc + curr.usageBytes, 0));

      if (vpnActive && ByteShield.getSecurityAlerts) {
        const alerts = await ByteShield.getSecurityAlerts();
        setSecurityAlerts(alerts);
      }
    } catch (e) {
      console.log("Fetch error", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 10000);
    return () => clearInterval(inv);
  }, [fetchData]);

  const toggleVpn = async () => {
    try {
      if (isVpnOn) {
        ByteShield.stopVPN();
        setIsVpnOn(false);
        return;
      }

      const started = await ByteShield.startVPN?.();
      if (started !== false) {
        setIsVpnOn(true);
      }
    } catch (error) {
      Alert.alert("VPN Permission Needed", "Allow Byte Shield's VPN permission to start traffic protection.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <View style={[styles.logoBox, isVpnOn && styles.logoBoxActive]}>
            <Shield size={22} color={isVpnOn ? "#000" : "#71717A"} />
          </View>
          <View>
            <Text style={styles.brandName}>BYTE SHIELD</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, isVpnOn && styles.statusDotActive]} />
              <Text style={styles.statusText}>{isVpnOn ? 'NATIVE GUARD ACTIVE' : 'MONITORING PAUSED'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => Alert.alert("Reset", "Reset stats?", [{text: "Cancel"}, {text: "Reset", onPress: () => fetchData()}])}>
          <Activity size={20} color="#71717A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContent}>
          <TouchableOpacity 
            style={[styles.heroCard, isVpnOn ? styles.heroCardActive : styles.heroCardInactive]}
            onPress={toggleVpn}
          >
            <View style={styles.heroHeader}>
              <Text style={styles.heroSub}>NETWORK GUARD</Text>
              <View style={[styles.toggleTrack, isVpnOn && styles.toggleTrackOn]}>
                <View style={[styles.toggleThumb, isVpnOn && styles.toggleThumbOn]} />
              </View>
            </View>
            <Text style={styles.heroTitle}>
              {isVpnOn ? "Your connection is encrypted" : "Security is currently inactive"}
            </Text>
            <Text style={styles.heroDesc}>
              {isVpnOn ? "Analyzing app tunnels for data leaks" : "Protect your device traffic now"}
            </Text>
          </TouchableOpacity>

          <View style={styles.statsGrid}>
            <StatCard 
              title="Today" 
              value={formatBytes(totalToday)} 
              icon={ArrowDownUp} 
              description="Real-time usage" 
            />
            <StatCard 
              title="Saved" 
              value={formatBytes(totalToday * 0.15)} 
              icon={Zap} 
              description="Smart reduction" 
              trend={12} 
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE TUNNELS</Text>
            <BarChart3 size={16} color="#52525B" />
          </View>

          {appUsage.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={40} color="#27272A" />
              <Text style={styles.emptyText}>Waiting for device statistics...</Text>
            </View>
          ) : (
            appUsage.slice(0, 5).map((app, i) => (
              <View key={i} style={styles.appItem}>
                <View style={styles.appIconBox}>
                  <Package size={20} color="#52525B" />
                </View>
                <View style={styles.appInfo}>
                  <View style={styles.appRow}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appUsage}>{formatBytes(app.usageBytes)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(app.usageBytes / totalToday) * 100}%` }]} />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('dashboard')}>
          <Shield size={24} color={activeTab === 'dashboard' ? "#F59E0B" : "#52525B"} />
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('usage')}>
          <Activity size={24} color={activeTab === 'usage' ? "#F59E0B" : "#52525B"} />
          <Text style={[styles.navText, activeTab === 'usage' && styles.navTextActive]}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('settings')}>
          <SettingsIcon size={24} color={activeTab === 'settings' ? "#F59E0B" : "#52525B"} />
          <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Config</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#18181B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBoxActive: {
    backgroundColor: '#F59E0B',
  },
  brandName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3F3F46',
  },
  statusDotActive: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    color: '#52525B',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  innerContent: {
    padding: 20,
    gap: 24,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  heroCardInactive: {
    backgroundColor: '#09090B',
    borderColor: '#18181B',
  },
  heroCardActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSub: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    backgroundColor: '#27272A',
    borderRadius: 12,
    padding: 2,
  },
  toggleTrackOn: {
    backgroundColor: '#F59E0B',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  heroDesc: {
    color: '#71717A',
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#18181B',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    padding: 8,
    backgroundColor: '#18181B',
    borderRadius: 10,
  },
  statContent: {
    gap: 2,
  },
  statLabel: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statDesc: {
    color: '#3F3F46',
    fontSize: 10,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  trendTextUp: {
    color: '#10B981',
  },
  trendText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  appItem: {
    flexDirection: 'row',
    gap: 16,
    padding: 12,
    backgroundColor: '#09090B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#18181B',
  },
  appIconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#18181B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  appUsage: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#18181B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#52525B',
    fontSize: 12,
  },
  navBar: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#18181B',
    backgroundColor: '#000',
    paddingBottom: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    color: '#52525B',
    fontWeight: 'bold',
  },
  navTextActive: {
    color: '#F59E0B',
  }
});
