package com.byteshield

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetSocketAddress
import java.nio.ByteBuffer
import java.nio.channels.DatagramChannel
import java.util.concurrent.atomic.AtomicBoolean

class ByteShieldVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private val isRunning = AtomicBoolean(false)
    private var vpnThread: Thread? = null
    
    private var lastUsageCheckTime = 0L
    private var totalBytesThisPeriod = 0L
    private val SPIKE_THRESHOLD_BYTES = 5 * 1024 * 1024 // 5MB spike in 10s for demo

    companion object {
        const val TAG = "ByteShieldVpnService"
        const val CHANNEL_ID = "ByteShieldVpnChannel"
        const val ALERT_CHANNEL_ID = "ByteShieldAlertChannel"
        const val NOTIFICATION_ID = 1001
        
        val isServiceRunning = AtomicBoolean(false)
        
        val alertHistory = mutableListOf<Map<String, Any>>()
        
        // Callback for data usage tracking (simulated metadata logger)
        var onDataLogged: ((uid: Int, sent: Long, received: Long) -> Unit)? = null
    }

    override fun onStartCommand(intent: android.content.Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "START") {
            startVpn()
        } else if (intent?.action == "STOP") {
            stopVpn()
        }
        return START_STICKY
    }

    private fun startVpn() {
        if (isServiceRunning.get()) return
        
        Log.d(TAG, "Starting Byte Shield VPN Service...")

        createNotificationChannels()
        startForeground(NOTIFICATION_ID, createNotification())
        
        try {
            val builder = Builder()
                .setSession("ByteShieldMonitor")
                .addAddress("10.0.0.2", 24)
                .addDnsServer("8.8.8.8")
                .addRoute("0.0.0.0", 0)
                .setBlocking(true)

            vpnInterface = builder.establish()
            isServiceRunning.set(true)
            isRunning.set(true)
            lastUsageCheckTime = System.currentTimeMillis()
            totalBytesThisPeriod = 0

            vpnThread = Thread {
                runVpnLoop()
            }
            vpnThread?.start()
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to establish VPN interface", e)
        }
    }

    private fun runVpnLoop() {
        val input = FileInputStream(vpnInterface?.fileDescriptor)
        val output = FileOutputStream(vpnInterface?.fileDescriptor)
        val buffer = ByteBuffer.allocate(16384)

        try {
            while (isRunning.get()) {
                val length = input.read(buffer.array())
                if (length > 0) {
                    monitorTraffic(length.toLong())
                    
                    output.write(buffer.array(), 0, length)
                    buffer.clear()
                }
                Thread.sleep(1)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in VPN loop", e)
        } finally {
            vpnInterface?.close()
        }
    }

    private fun monitorTraffic(bytes: Long) {
        totalBytesThisPeriod += bytes
        val now = System.currentTimeMillis()
        
        // Simulate logging to the UI if a callback is set
        onDataLogged?.invoke(1000, 0, bytes) // Simulate system-level uid 1000 activity
        
        // Every 10 seconds check for spikes or simulate anomalies
        if (now - lastUsageCheckTime > 10000) {
            if (totalBytesThisPeriod > SPIKE_THRESHOLD_BYTES) {
                sendSecurityAlert("Data Spike Detected", "Sudden usage of ${(totalBytesThisPeriod / 1024 / 1024)}MB detected in 10 seconds. Check active background apps.")
            }
            
            // Simulated random "Security Interaction"
            if (Math.random() < 0.1) { // 10% chance every 10s for demo
                 sendSecurityAlert("Suspicious IP Blocked", "Traffic from an unverified IP range (45.12.33.x) was intercepted and rerouted safely.")
            }

            lastUsageCheckTime = now
            totalBytesThisPeriod = 0
        }
    }

    private fun sendSecurityAlert(title: String, message: String) {
        val alert = mapOf(
            "id" to System.currentTimeMillis().toString(),
            "title" to title,
            "message" to message,
            "timestamp" to System.currentTimeMillis(),
            "type" to "security"
        )
        synchronized(alertHistory) {
            alertHistory.add(0, alert)
            if (alertHistory.size > 50) alertHistory.removeAt(alertHistory.size - 1)
        }

        val notification = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(Notification.CATEGORY_ALARM)
            .setAutoCancel(true)
            .build()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun stopVpn() {
        Log.d(TAG, "Stopping Byte Shield VPN Service...")
        isServiceRunning.set(false)
        isRunning.set(false)
        vpnThread?.interrupt()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // General Status Channel
            val statusChannel = NotificationChannel(CHANNEL_ID, "Byte Shield Status", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Shows active VPN status and data protection"
            }
            notificationManager.createNotificationChannel(statusChannel)

            // High Priority Alert Channel
            val alertChannel = NotificationChannel(ALERT_CHANNEL_ID, "Security Alerts", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Notifies you of unusual network activity even if offline"
                enableLights(true)
                lightColor = android.graphics.Color.RED
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(alertChannel)
        }
    }

    private fun createNotification(): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Byte Shield Protection")
            .setContentText("VPN is active and monitoring traffic")
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Fallback icon
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .setContentIntent(pendingIntent)
            .build()
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }
}
