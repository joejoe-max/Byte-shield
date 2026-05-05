package com.byteshield

import java.net.URL
import java.net.HttpURLConnection
import java.io.InputStream
import java.io.OutputStream
import java.util.concurrent.TimeUnit

class SpeedTestModule {

    /**
     * Executes a native ICMP ping to a host
     */
    fun runPing(host: String): Int {
        try {
            val process = Runtime.getRuntime().exec("ping -c 1 -w 2 $host")
            val exitCode = process.waitFor()
            if (exitCode == 0) {
                val inputStream = process.inputStream.bufferedReader()
                val output = inputStream.readLines()
                for (line in output) {
                    if (line.contains("time=")) {
                        val timePart = line.substringAfter("time=").substringBefore(" ms")
                        return timePart.toDouble().toInt()
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return 999
    }

    /**
     * Runs a basic download test
     */
    fun runDownloadTest(testUrl: String): Double {
        var connection: HttpURLConnection? = null
        var inputStream: InputStream? = null
        
        try {
            val startTime = System.currentTimeMillis()
            val url = URL(testUrl)
            connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 3000
            connection.readTimeout = 5000
            connection.connect()

            if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                var bytesRead = 0L
                val buffer = ByteArray(16384)
                inputStream = connection.inputStream
                
                var read = inputStream.read(buffer)
                while (read != -1) {
                    bytesRead += read
                    read = inputStream.read(buffer)
                    if (System.currentTimeMillis() - startTime > 5000) break
                }

                val durationSeconds = (System.currentTimeMillis() - startTime) / 1000.0
                return if (durationSeconds > 0) (bytesRead * 8.0 / 1_000_000.0) / durationSeconds else 0.0
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            inputStream?.close()
            connection?.disconnect()
        }
        return 0.0
    }

    /**
     * Runs a basic upload test using a POST request
     */
    fun runUploadTest(testUrl: String): Double {
        var connection: HttpURLConnection? = null
        try {
            val startTime = System.currentTimeMillis()
            val url = URL(testUrl)
            connection = url.openConnection() as HttpURLConnection
            connection.doOutput = true
            connection.requestMethod = "POST"
            connection.connectTimeout = 3000
            connection.readTimeout = 5000
            
            val payload = ByteArray(1024 * 512) // 512KB chunk
            val outputStream = connection.outputStream
            
            var bytesWritten = 0L
            while (System.currentTimeMillis() - startTime < 3000) {
                outputStream.write(payload)
                bytesWritten += payload.size
            }
            outputStream.flush()
            outputStream.close()

            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_CREATED) {
                val durationSeconds = (System.currentTimeMillis() - startTime) / 1000.0
                return if (durationSeconds > 0) (bytesWritten * 8.0 / 1_000_000.0) / durationSeconds else 0.0
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            connection?.disconnect()
        }
        return 0.0
    }
}
