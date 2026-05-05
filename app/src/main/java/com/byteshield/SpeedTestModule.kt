package com.byteshield

import java.net.URL
import java.net.HttpURLConnection
import java.io.InputStream
import java.util.concurrent.TimeUnit

class SpeedTestModule {

    /**
     * React Native Bridge simulation function
     * Runs a basic download test
     */
    fun runDownloadTest(testUrl: String): Double {
        var connection: HttpURLConnection? = null
        var inputStream: InputStream? = null
        
        try {
            val startTime = System.currentTimeMillis()
            val url = URL(testUrl)
            connection = url.openConnection() as HttpURLConnection
            connection.connect()

            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK) {
                var bytesRead = 0L
                val buffer = ByteArray(8192)
                inputStream = connection.inputStream
                
                var read = inputStream.read(buffer)
                while (read != -1) {
                    bytesRead += read
                    read = inputStream.read(buffer)
                    
                    // Limit test to 5 seconds to prevent excessive data usage in prototype
                    if (System.currentTimeMillis() - startTime > 5000) break
                }

                val endTime = System.currentTimeMillis()
                val durationSeconds = (endTime - startTime) / 1000.0
                
                // Calculate Mbps: (Bytes * 8 bits / 1,000,000) / Seconds
                val mbps = (bytesRead * 8.0 / 1_000_000.0) / durationSeconds
                return mbps
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            inputStream?.close()
            connection?.disconnect()
        }
        
        return 0.0
    }
}
