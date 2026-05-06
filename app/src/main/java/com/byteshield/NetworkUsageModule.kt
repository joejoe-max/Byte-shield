package com.byteshield

import android.app.usage.NetworkStats
import android.app.usage.NetworkStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.ApplicationInfo
import android.net.ConnectivityManager
import android.util.Log

data class AppUsageInfo(
    val uid: Int,
    var packageName: String = "",
    var label: String = "Unknown",
    var mobileRx: Long = 0,
    var mobileTx: Long = 0,
    var wifiRx: Long = 0,
    var wifiTx: Long = 0
)

class NetworkUsageModule(private val context: Context) {

    /**
     * Gets usage for all applications with granular breakdown
     */
    fun getAllAppsUsage(startTime: Long, endTime: Long): List<Map<String, Any>> {
        val networkStatsManager = context.getSystemService(Context.NETWORK_STATS_SERVICE) as NetworkStatsManager
        val pm = context.packageManager
        val usageMap = mutableMapOf<Int, AppUsageInfo>()

        fun queryStats(networkType: Int, isWifi: Boolean) {
            try {
                val stats = try {
                    networkStatsManager.querySummary(networkType, null, startTime, endTime)
                } catch (e: SecurityException) {
                    Log.e("NetworkUsageModule", "SecurityException: Missing PACKAGE_USAGE_STATS permission")
                    return
                } catch (e: Exception) {
                    Log.e("NetworkUsageModule", "Error querying stats for type $networkType", e)
                    return
                }

                val bucket = NetworkStats.Bucket()
                while (stats.hasNextBucket()) {
                    stats.getNextBucket(bucket)
                    val uid = bucket.uid
                    
                    val info = usageMap.getOrPut(uid) { AppUsageInfo(uid = uid) }
                    
                    if (isWifi) {
                        info.wifiRx += bucket.rxBytes
                        info.wifiTx += bucket.txBytes
                    } else {
                        info.mobileRx += bucket.rxBytes
                        info.mobileTx += bucket.txBytes
                    }
                }
                stats.close()
            } catch (e: Exception) {
                Log.e("NetworkUsageModule", "Fatal error processing network type $networkType", e)
            }
        }

        // Aggregate across common network types
        queryStats(ConnectivityManager.TYPE_WIFI, true)
        queryStats(ConnectivityManager.TYPE_MOBILE, false)
        // Optionally add Ethernet if desired: queryStats(ConnectivityManager.TYPE_ETHERNET, true)

        val installedApps = pm.getInstalledApplications(0)
        val uidToApp = installedApps.groupBy { it.uid }
        
        val finalResults = mutableListOf<Map<String, Any>>()
        
        for ((uid, usage) in usageMap) {
            val totalBytes = usage.mobileRx + usage.mobileTx + usage.wifiRx + usage.wifiTx
            if (totalBytes <= 0) continue

            val apps = uidToApp[uid]
            if (apps != null) {
                // If multiple apps share a UID, we concatenate their names or pick primary
                usage.packageName = apps.joinToString(", ") { it.packageName }
                usage.label = pm.getApplicationLabel(apps[0]).toString()
            } else if (uid == android.os.Process.SYSTEM_UID) {
                usage.label = "System"
                usage.packageName = "android"
            } else if (uid == 0) {
                usage.label = "Root / Kernel"
                usage.packageName = "kernel"
            }

            val resultRecord = mapOf(
                "uid" to usage.uid,
                "name" to usage.label,
                "packageName" to usage.packageName,
                "usageBytes" to totalBytes,
                "mobileBytes" to (usage.mobileRx + usage.mobileTx),
                "wifiBytes" to (usage.wifiRx + usage.wifiTx),
                "mobileRx" to usage.mobileRx,
                "mobileTx" to usage.mobileTx,
                "wifiRx" to usage.wifiRx,
                "wifiTx" to usage.wifiTx
            )
            finalResults.add(resultRecord)
        }
        
        return finalResults.sortedByDescending { it["usageBytes"] as Long }
    }

    /**
     * Legacy method for specific UID if needed
     */
    fun getAppDataUsage(uid: Int, startTime: Long, endTime: Long): Map<String, Long> {
        val networkStatsManager = context.getSystemService(Context.NETWORK_STATS_SERVICE) as NetworkStatsManager
        val usageMap = mutableMapOf<String, Long>()

        try {
            val bucket = NetworkStats.Bucket()
            
            // Mobile
            val mobileStats = networkStatsManager.queryDetailsForUid(ConnectivityManager.TYPE_MOBILE, null, startTime, endTime, uid)
            var mobileTotal = 0L
            while (mobileStats.hasNextBucket()) {
                mobileStats.getNextBucket(bucket)
                mobileTotal += bucket.rxBytes + bucket.txBytes
            }
            mobileStats.close()
            usageMap["mobile"] = mobileTotal

            // WiFi
            val wifiStats = networkStatsManager.queryDetailsForUid(ConnectivityManager.TYPE_WIFI, null, startTime, endTime, uid)
            var wifiTotal = 0L
            while (wifiStats.hasNextBucket()) {
                wifiStats.getNextBucket(bucket)
                wifiTotal += bucket.rxBytes + bucket.txBytes
            }
            wifiStats.close()
            usageMap["wifi"] = wifiTotal

        } catch (e: Exception) {
            Log.e("NetworkUsageModule", "Error fetching usage for UID $uid", e)
        }

        return usageMap
    }
}
