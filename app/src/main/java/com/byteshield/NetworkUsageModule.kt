package com.byteshield

import android.app.usage.NetworkStatsManager
import android.content.Context
import android.net.ConnectivityManager
import android.os.RemoteException
import android.util.Log

class NetworkUsageModule(private val context: Context) {

    /**
     * React Native Bridge simulation function
     * Gets summary usage for a specific UID
     */
    fun getAppDataUsage(uid: Int, startTime: Long, endTime: Long): Map<String, Long> {
        val networkStatsManager = context.getSystemService(Context.NETWORK_STATS_SERVICE) as NetworkStatsManager
        val usageMap = mutableMapOf<String, Long>()

        try {
            // Mobile Data for specific UID
            val mobileStats = networkStatsManager.queryDetailsForUid(
                ConnectivityManager.TYPE_MOBILE,
                null,
                startTime,
                endTime,
                uid
            )
            var mobileTotal = 0L
            val bucket = android.app.usage.NetworkStats.Bucket()
            while (mobileStats.hasNextBucket()) {
                mobileStats.getNextBucket(bucket)
                mobileTotal += bucket.rxBytes + bucket.txBytes
            }
            mobileStats.close()
            usageMap["mobile"] = mobileTotal

            // WiFi Data for specific UID
            val wifiStats = networkStatsManager.queryDetailsForUid(
                ConnectivityManager.TYPE_WIFI,
                null,
                startTime,
                endTime,
                uid
            )
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
