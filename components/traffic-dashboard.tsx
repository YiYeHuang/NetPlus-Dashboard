"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Activity, Zap } from "lucide-react"

interface TrafficData {
  timestamp: number
  upload: number
  download: number
}

export function TrafficDashboard() {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [currentSpeed, setCurrentSpeed] = useState({ upload: 0, download: 0 })
  const [totalData, setTotalData] = useState({ upload: 0, download: 0 })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const upload = Math.random() * 1000 + 100 // KB/s
      const download = Math.random() * 5000 + 500 // KB/s

      setCurrentSpeed({ upload, download })
      setTotalData((prev) => ({
        upload: prev.upload + upload / 8, // Convert to KB
        download: prev.download + download / 8,
      }))

      setTrafficData((prev) => {
        const newData = [...prev, { timestamp: now, upload, download }]
        return newData.slice(-60) // Keep last 60 data points
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes.toFixed(1)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const formatSpeed = (speed: number) => {
    if (speed < 1024) return `${speed.toFixed(1)} B/s`
    if (speed < 1024 * 1024) return `${(speed / 1024).toFixed(1)} KB/s`
    return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`
  }

  return (
    <div className="space-y-6">
      {/* Real-time Speed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-400/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-400 flex items-center">
                <ArrowUp className="w-5 h-5 mr-2" />
                Upload Speed
              </CardTitle>
              <Badge className="bg-green-400 text-black">LIVE</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{formatSpeed(currentSpeed.upload)}</div>
            <div className="text-sm text-green-300">Total: {formatBytes(totalData.upload)}</div>
            <div className="mt-4 flex space-x-1">
              {trafficData.slice(-20).map((data, i) => (
                <div
                  key={i}
                  className="w-2 bg-green-400 rounded-full transition-all duration-300"
                  style={{ height: `${Math.max(4, (data.upload / 1000) * 40)}px` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-400/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-400 flex items-center">
                <ArrowDown className="w-5 h-5 mr-2" />
                Download Speed
              </CardTitle>
              <Badge className="bg-blue-400 text-black">LIVE</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{formatSpeed(currentSpeed.download)}</div>
            <div className="text-sm text-blue-300">Total: {formatBytes(totalData.download)}</div>
            <div className="mt-4 flex space-x-1">
              {trafficData.slice(-20).map((data, i) => (
                <div
                  key={i}
                  className="w-2 bg-blue-400 rounded-full transition-all duration-300"
                  style={{ height: `${Math.max(4, (data.download / 5000) * 40)}px` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-400/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-purple-400 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Total Bandwidth
              </CardTitle>
              <Badge className="bg-purple-400 text-black">ACTIVE</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {formatSpeed(currentSpeed.upload + currentSpeed.download)}
            </div>
            <div className="text-sm text-purple-300">Combined throughput</div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-green-400/20 rounded">
                <div className="text-green-400">
                  ↑ {((currentSpeed.upload / (currentSpeed.upload + currentSpeed.download)) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-2 bg-blue-400/20 rounded">
                <div className="text-blue-400">
                  ↓ {((currentSpeed.download / (currentSpeed.upload + currentSpeed.download)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Oscilloscope-style Chart */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Network Oscilloscope
            <Badge variant="outline" className="ml-auto border-yellow-400 text-yellow-400">
              500ms refresh
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 bg-black rounded-lg p-4 overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-green-400"
                  style={{ top: `${(i + 1) * 12.5}%` }}
                />
              ))}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full border-l border-green-400"
                  style={{ left: `${(i + 1) * 8.33}%` }}
                />
              ))}
            </div>

            {/* Upload trace */}
            <svg className="absolute inset-0 w-full h-full">
              <path
                d={trafficData
                  .map(
                    (data, i) =>
                      `${i === 0 ? "M" : "L"} ${(i / (trafficData.length - 1)) * 100}% ${100 - (data.upload / 1000) * 80}%`,
                  )
                  .join(" ")}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
            </svg>

            {/* Download trace */}
            <svg className="absolute inset-0 w-full h-full">
              <path
                d={trafficData
                  .map(
                    (data, i) =>
                      `${i === 0 ? "M" : "L"} ${(i / (trafficData.length - 1)) * 100}% ${100 - (data.download / 5000) * 80}%`,
                  )
                  .join(" ")}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
            </svg>

            {/* Particle effects */}
            <div className="absolute inset-0">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-green-400 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "2s",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-4 text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2" />
                <span className="text-green-400">Upload</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-2" />
                <span className="text-blue-400">Download</span>
              </div>
            </div>
            <div className="text-gray-400">Last 30 seconds • Real-time monitoring</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
