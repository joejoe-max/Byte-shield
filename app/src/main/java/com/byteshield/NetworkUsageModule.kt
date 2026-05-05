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
            // Mobile Data
            val mobileBucket = networkStatsManager.querySummaryForDevice(
                ConnectivityManager.TYPE_MOBILE, 
                null, 
                startTime, 
                endTime
            )
            usageMap["mobile"] = mobileBucket.rxBytes + mobileBucket.txBytes

            // WiFi Data
            val wifiBucket = networkStatsManager.querySummaryForDevice(
                ConnectivityManager.TYPE_WIFI, 
                null, 
                startTime, 
                endTime
            )
            usageMap["wifi"] = wifiBucket.rxBytes + wifiBucket.txBytes

        } catch (e: RemoteException) {
            Log.e("NetworkUsageModule", "Error fetching usage for UID $uid", e)
        }

        return usageMap
    }
}
