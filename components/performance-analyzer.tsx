"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Cpu, HardDrive, Thermometer, Zap, Activity, Gauge } from "lucide-react"

interface SystemMetrics {
  cpu: {
    usage: number
    temperature: number
    frequency: number
    cores: number
  }
  memory: {
    used: number
    total: number
    pressure: number
  }
  network: {
    bandwidth: number
    utilization: number
    errors: number
    quality: number
  }
  disk: {
    read: number
    write: number
    usage: number
  }
}

interface NetworkProtocol {
  name: string
  packets: number
  bytes: number
  percentage: number
  color: string
}

export function PerformanceAnalyzer() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 45, temperature: 52, frequency: 3200, cores: 8 },
    memory: { used: 8.2, total: 16, pressure: 35 },
    network: { bandwidth: 1000, utilization: 23, errors: 0, quality: 98 },
    disk: { read: 125, write: 89, usage: 67 },
  })

  const [protocols, setProtocols] = useState<NetworkProtocol[]>([
    { name: "HTTPS", packets: 15420, bytes: 45231890, percentage: 65, color: "bg-green-400" },
    { name: "HTTP", packets: 3240, bytes: 8934567, percentage: 15, color: "bg-blue-400" },
    { name: "SSH", packets: 890, bytes: 234567, percentage: 8, color: "bg-purple-400" },
    { name: "DNS", packets: 2340, bytes: 567890, percentage: 7, color: "bg-yellow-400" },
    { name: "Other", packets: 1200, bytes: 345678, percentage: 5, color: "bg-gray-400" },
  ])

  const [jitterData, setJitterData] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      // Update system metrics
      setMetrics((prev) => ({
        cpu: {
          ...prev.cpu,
          usage: Math.max(10, Math.min(90, prev.cpu.usage + (Math.random() - 0.5) * 10)),
          temperature: Math.max(35, Math.min(85, prev.cpu.temperature + (Math.random() - 0.5) * 5)),
          frequency: 3200 + Math.floor((Math.random() - 0.5) * 400),
        },
        memory: {
          ...prev.memory,
          used: Math.max(4, Math.min(15, prev.memory.used + (Math.random() - 0.5) * 0.5)),
          pressure: Math.max(10, Math.min(80, prev.memory.pressure + (Math.random() - 0.5) * 5)),
        },
        network: {
          ...prev.network,
          utilization: Math.max(5, Math.min(95, prev.network.utilization + (Math.random() - 0.5) * 10)),
          errors: prev.network.errors + (Math.random() > 0.9 ? 1 : 0),
          quality: Math.max(85, Math.min(100, prev.network.quality + (Math.random() - 0.5) * 2)),
        },
        disk: {
          ...prev.disk,
          read: Math.max(0, prev.disk.read + (Math.random() - 0.5) * 50),
          write: Math.max(0, prev.disk.write + (Math.random() - 0.5) * 30),
        },
      }))

      // Update jitter data
      setJitterData((prev) => {
        const newJitter = Math.random() * 10 + 1
        return [...prev, newJitter].slice(-50)
      })

      // Update protocol distribution
      setProtocols((prev) =>
        prev.map((protocol) => ({
          ...protocol,
          packets: protocol.packets + Math.floor(Math.random() * 100),
          bytes: protocol.bytes + Math.floor(Math.random() * 10000),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getTemperatureColor = (temp: number) => {
    if (temp < 50) return "text-green-400"
    if (temp < 70) return "text-yellow-400"
    return "text-red-400"
  }

  const getUsageColor = (usage: number) => {
    if (usage < 50) return "bg-green-400"
    if (usage < 80) return "bg-yellow-400"
    return "bg-red-400"
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 flex items-center text-sm">
              <Cpu className="w-4 h-4 mr-2" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{metrics.cpu.usage.toFixed(1)}%</div>
            <div className="text-xs text-red-300">
              {metrics.cpu.cores} cores @ {metrics.cpu.frequency}MHz
            </div>
            <Progress value={metrics.cpu.usage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-400 flex items-center text-sm">
              <HardDrive className="w-4 h-4 mr-2" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {((metrics.memory.used / metrics.memory.total) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-blue-300">
              {metrics.memory.used.toFixed(1)} / {metrics.memory.total} GB
            </div>
            <Progress value={(metrics.memory.used / metrics.memory.total) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 flex items-center text-sm">
              <Thermometer className="w-4 h-4 mr-2" />
              Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${getTemperatureColor(metrics.cpu.temperature)}`}>
              {metrics.cpu.temperature}°C
            </div>
            <div className="text-xs text-yellow-300">CPU thermal status</div>
            <Progress value={(metrics.cpu.temperature / 100) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 flex items-center text-sm">
              <Activity className="w-4 h-4 mr-2" />
              Network Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{metrics.network.quality.toFixed(1)}%</div>
            <div className="text-xs text-green-300">Connection stability</div>
            <Progress value={metrics.network.quality} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Jitter Waveform */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-400" />
              Network Jitter Analysis
              <Badge variant="outline" className="ml-auto border-yellow-400 text-yellow-400">
                REAL-TIME
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-48 bg-black rounded-lg p-4 overflow-hidden">
              {/* Oscilloscope grid */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute w-full border-t border-yellow-400" style={{ top: `${i * 20}%` }} />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="absolute h-full border-l border-yellow-400" style={{ left: `${i * 10}%` }} />
                ))}
              </div>

              {/* Jitter waveform */}
              <svg className="absolute inset-0 w-full h-full">
                <path
                  d={jitterData
                    .map(
                      (jitter, i) =>
                        `${i === 0 ? "M" : "L"} ${(i / (jitterData.length - 1)) * 100}% ${100 - (jitter / 15) * 80}%`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="2"
                  className="drop-shadow-lg"
                />
              </svg>

              {/* Current jitter value */}
              <div className="absolute top-4 right-4 text-right">
                <div className="text-xl font-bold text-yellow-400">
                  {jitterData[jitterData.length - 1]?.toFixed(1) || "0.0"}ms
                </div>
                <div className="text-xs text-gray-400">Current Jitter</div>
              </div>
            </div>

            <div className="flex justify-between mt-4 text-xs text-gray-400">
              <span>Network latency variation</span>
              <span>Lower is better</span>
            </div>
          </CardContent>
        </Card>

        {/* Protocol Distribution */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-purple-400" />
              Protocol Distribution
              <Badge variant="outline" className="ml-auto border-purple-400 text-purple-400">
                ANALYZING
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Protocol pie chart representation */}
            <div className="relative h-48 flex items-center justify-center">
              <div className="relative w-32 h-32">
                {protocols.map((protocol, index) => {
                  const startAngle = protocols.slice(0, index).reduce((sum, p) => sum + p.percentage * 3.6, 0)
                  const endAngle = startAngle + protocol.percentage * 3.6

                  return (
                    <div
                      key={protocol.name}
                      className={`absolute inset-0 rounded-full border-8 ${protocol.color.replace("bg-", "border-")}`}
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(((startAngle - 90) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((startAngle - 90) * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((endAngle - 90) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((endAngle - 90) * Math.PI) / 180)}%)`,
                      }}
                    />
                  )
                })}
                <div className="absolute inset-4 bg-gray-900 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {protocols.reduce((sum, p) => sum + p.packets, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">Total Packets</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {protocols.map((protocol) => (
                <div key={protocol.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${protocol.color}`} />
                    <span className="text-white">{protocol.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-300">{protocol.percentage}%</div>
                    <div className="text-xs text-gray-400">{formatBytes(protocol.bytes)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resource Monitor */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-400" />
            System Resource Monitor
            <Badge variant="outline" className="ml-auto border-green-400 text-green-400">
              MONITORING
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU Cores */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">CPU Cores</h4>
              {[...Array(metrics.cpu.cores)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="text-xs text-gray-400 w-12">Core {i}</div>
                  <div className="flex-1">
                    <Progress value={metrics.cpu.usage + (Math.random() - 0.5) * 20} className="h-2" />
                  </div>
                  <div className="text-xs text-gray-300 w-12">
                    {(metrics.cpu.usage + (Math.random() - 0.5) * 20).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Memory Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Memory Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">System</span>
                  <span className="text-blue-400">4.2 GB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Applications</span>
                  <span className="text-green-400">3.1 GB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Cache</span>
                  <span className="text-yellow-400">0.9 GB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Free</span>
                  <span className="text-gray-400">{(metrics.memory.total - metrics.memory.used).toFixed(1)} GB</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-1">Memory Pressure</div>
                <Progress value={metrics.memory.pressure} className="h-2" />
              </div>
            </div>

            {/* Disk I/O */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Disk I/O</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Read Speed</span>
                    <span className="text-green-400">{metrics.disk.read.toFixed(1)} MB/s</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (metrics.disk.read / 500) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Write Speed</span>
                    <span className="text-blue-400">{metrics.disk.write.toFixed(1)} MB/s</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (metrics.disk.write / 300) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-400">Disk Usage: {metrics.disk.usage}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
