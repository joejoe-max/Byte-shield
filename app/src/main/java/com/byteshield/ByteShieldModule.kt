package com.byteshield

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
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
        try {
            val usageList = usageModule.getAllAppsUsage(startTime.toLong(), endTime.toLong())
            val results = Arguments.createArray()
            
            for (info in usageList) {
                val map = Arguments.createMap()
                map.putInt("uid", info["uid"] as Int)
                map.putString("name", info["name"] as String)
                map.putString("packageName", info["packageName"] as String)
                map.putDouble("usageBytes", (info["usageBytes"] as Long).toDouble())
                map.putDouble("mobileBytes", (info["mobileBytes"] as Long).toDouble())
                map.putDouble("wifiBytes", (info["wifiBytes"] as Long).toDouble())
                map.putDouble("mobileRx", (info["mobileRx"] as Long).toDouble())
                map.putDouble("mobileTx", (info["mobileTx"] as Long).toDouble())
                map.putDouble("wifiRx", (info["wifiRx"] as Long).toDouble())
                map.putDouble("wifiTx", (info["wifiTx"] as Long).toDouble())
                results.pushMap(map)
            }
            promise.resolve(results)
        } catch (e: Exception) {
            promise.reject("USAGE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isVPNActive(promise: Promise) {
        promise.resolve(ByteShieldVpnService.isServiceRunning.get())
    }

    @ReactMethod
    fun getSecurityAlerts(promise: Promise) {
        val results = Arguments.createArray()
        synchronized(ByteShieldVpnService.alertHistory) {
            for (alert in ByteShieldVpnService.alertHistory) {
                val map = Arguments.createMap()
                map.putString("id", alert["id"] as String)
                map.putString("title", alert["title"] as String)
                map.putString("message", alert["message"] as String)
                map.putDouble("timestamp", (alert["timestamp"] as Long).toDouble())
                map.putString("type", alert["type"] as String)
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
