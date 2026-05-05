package com.byteshield

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.content.Intent
import android.provider.Settings
import android.app.AppOpsManager
import android.os.Process
import android.content.Context

class ByteShieldModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ByteShield"

    @ReactMethod
    fun checkUsagePermission(promise: Promise) {
        val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            reactContext.packageName
        )
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun openUsageSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun checkBatteryOptimization(promise: Promise) {
        val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
        promise.resolve(powerManager.isIgnoringBatteryOptimizations(reactContext.packageName))
    }

    @ReactMethod
    fun requestBatteryOptimizationExemption() {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
        intent.data = android.net.Uri.parse("package:${reactContext.packageName}")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun getAppDataUsage(startTime: Double, endTime: Double, promise: Promise) {
        val usageModule = NetworkUsageModule(reactContext)
        // In a real bridge, we'd iterate through all installed apps.
        // For this prototype, we'll return a simulated comprehensive list 
        // that calling the real NetworkStatsManager would produce.
        val results = com.facebook.react.bridge.Arguments.createArray()
        
        val pm = reactContext.packageManager
        val packages = pm.getInstalledApplications(android.content.pm.PackageManager.GET_META_DATA)
        
        for (app in packages) {
            val usage = usageModule.getAppDataUsage(app.uid, startTime.toLong(), endTime.toLong())
            val total = (usage["mobile"] ?: 0L) + (usage["wifi"] ?: 0L)
            
            if (total > 0) {
                val map = com.facebook.react.bridge.Arguments.createMap()
                map.putString("name", pm.getApplicationLabel(app).toString())
                map.putDouble("usageBytes", total.toDouble())
                map.putInt("uid", app.uid)
                map.putString("packageName", app.packageName)
                results.pushMap(map)
            }
        }
        promise.resolve(results)
    }

    @ReactMethod
    fun startVPN() {
        val intent = Intent(reactContext, ByteShieldVpnService::class.java)
        intent.action = "START"
        reactContext.startService(intent)
    }

    @ReactMethod
    fun stopVPN() {
        val intent = Intent(reactContext, ByteShieldVpnService::class.java)
        intent.action = "STOP"
        reactContext.startService(intent)
    }

    @ReactMethod
    fun runPing(host: String, promise: Promise) {
        val speedModule = SpeedTestModule()
        promise.resolve(speedModule.runPing(host))
    }

    @ReactMethod
    fun runDownloadTest(url: String, promise: Promise) {
        val speedModule = SpeedTestModule()
        promise.resolve(speedModule.runDownloadTest(url).toString())
    }

    @ReactMethod
    fun runUploadTest(url: String, promise: Promise) {
        val speedModule = SpeedTestModule()
        promise.resolve(speedModule.runUploadTest(url).toString())
    }
}
