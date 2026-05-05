package com.byteshield

import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
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

    companion object {
        const val TAG = "ByteShieldVpnService"
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
        if (isRunning.get()) return
        
        Log.d(TAG, "Starting Byte Shield VPN Service...")
        
        try {
            val builder = Builder()
                .setSession("ByteShieldMonitor")
                .addAddress("10.0.0.2", 24)
                .addDnsServer("8.8.8.8")
                .addRoute("0.0.0.0", 0)
                .setBlocking(true)

            vpnInterface = builder.establish()
            isRunning.set(true)

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
                    // Metadata Analysis Logic
                    // In a real implementation, we would parse IP headers to identify UID
                    // and log bytes sent/received.
                    
                    // Simple simulated log for Byte Shield logic:
                    // logTraffic(someUid, length.toLong(), 0L)
                    
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

    private fun stopVpn() {
        Log.d(TAG, "Stopping Byte Shield VPN Service...")
        isRunning.set(false)
        vpnThread?.interrupt()
        stopSelf()
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }
}
