"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Shield, Zap, Router, Cpu, Laptop, Network } from "lucide-react"

const REFRESH_INTERVALS = {
  SYSTEM_PERFORMANCE: Number(process.env.NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH || "15000"),
  NETWORK_INTERFACES: Number(process.env.NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH || "5000"),
  SECURITY_MATRIX: Number(process.env.NEXT_PUBLIC_SECURITY_MATRIX_REFRESH || "15000"),
  ROUTE_DIAGNOSTICS: Number(process.env.NEXT_PUBLIC_ROUTE_DIAGNOSTICS_REFRESH || "100000"),
}

interface NetworkData {
  interfaces: any[]
  traffic: any
  security: {
    firewall: {
      enabled: boolean
      stealthMode: boolean
      blockAll: boolean
      rules: number
    }
    vpn: boolean
    threats: number
    ports: Array<{
      port: number
      service: string
      process: string
      pid: string
      user: string
      status: string
      risk: 'low' | 'medium' | 'high'
    }>
    suspiciousConnections: any[]
  }
  routes: {
    defaultGateways: Array<{
      gateway: string
      interface: string
      latency?: number
    }>
    routes: any[]
    traceroute: Array<{
      number: number
      ip: string
      latency?: number
    }>
  }
  performance: {
    cpu: number
    memory: {
      percentage: number
      used: string
      total: string
      details?: {
        active: string
        wired: string
        compressed: string
        inactive: string
        free: string
      }
    }
    jitter: number[]
  }
  ping: any
  macInfo: any
}

export default function NetPlusDashboard() {
  const [networkData, setNetworkData] = useState<NetworkData>({
    interfaces: [],
    traffic: { upload: 0, download: 0, total: { upload: 0, download: 0 } },
    security: {
      firewall: { enabled: true, stealthMode: false, blockAll: false, rules: 0 },
      vpn: false,
      threats: 0,
      ports: [],
      suspiciousConnections: [],
    },
    routes: { defaultGateways: [], routes: [], traceroute: [] },
    performance: { cpu: 0, memory: { percentage: 0, used: "0", total: "0" }, jitter: [] },
    ping: { latency: 0, loss: 0 },
    macInfo: {
      osVersion: "",
      chipInfo: "",
      battery: { percentage: 0, charging: false, timeRemaining: 0 },
      hostname: "",
      uptime: "",
    },
  })

  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState({
    systemPerformance: new Date(),
    networkInterfaces: new Date(),
    securityMatrix: new Date(),
    routeDiagnostics: new Date(),
  })

  const fetchSystemPerformance = async () => {
    try {
      const response = await fetch("/api/network-status?type=performance")
      if (response.ok) {
        const data = await response.json()
        setNetworkData((prev) => ({
          ...prev,
          performance: data.performance,
          macInfo: data.macInfo,
        }))
        setLastUpdate((prev) => ({ ...prev, systemPerformance: new Date() }))
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Failed to fetch system performance:", error)
      setIsConnected(false)
    }
  }

  const fetchNetworkInterfaces = async () => {
    try {
      const response = await fetch("/api/network-status?type=interfaces")
      if (response.ok) {
        const data = await response.json()
        setNetworkData((prev) => ({
          ...prev,
          interfaces: data.interfaces,
          traffic: data.traffic,
        }))
        setLastUpdate((prev) => ({ ...prev, networkInterfaces: new Date() }))
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Failed to fetch network interfaces:", error)
      setIsConnected(false)
    }
  }

  const fetchSecurityMatrix = async () => {
    try {
      console.log("🔍 Fetching security data...")
      const response = await fetch("/api/network-status?type=security")
      if (response.ok) {
        const data = await response.json()
        console.log("✅ Security data received:", data.security)
        console.log("📊 Ports data:", data.security.ports)
        setNetworkData((prev) => ({
          ...prev,
          security: data.security,
        }))
        setLastUpdate((prev) => ({ ...prev, securityMatrix: new Date() }))
        setIsConnected(true)
      } else {
        console.error("❌ Security API response not OK:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("❌ Failed to fetch security data:", error)
      setIsConnected(false)
    }
  }

  const fetchRouteDiagnostics = async () => {
    try {
      const response = await fetch("/api/network-status?type=routes")
      if (response.ok) {
        const data = await response.json()
        setNetworkData((prev) => ({
          ...prev,
          routes: data.routes,
          ping: data.ping,
        }))
        setLastUpdate((prev) => ({ ...prev, routeDiagnostics: new Date() }))
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Failed to fetch route diagnostics:", error)
      setIsConnected(false)
    }
  }

  useEffect(() => {
    fetchSystemPerformance()
    fetchNetworkInterfaces()
    fetchSecurityMatrix()
    fetchRouteDiagnostics()

    const intervals = [
      setInterval(fetchSystemPerformance, REFRESH_INTERVALS.SYSTEM_PERFORMANCE),
      setInterval(fetchNetworkInterfaces, REFRESH_INTERVALS.NETWORK_INTERFACES),
      setInterval(fetchSecurityMatrix, REFRESH_INTERVALS.SECURITY_MATRIX),
      setInterval(fetchRouteDiagnostics, REFRESH_INTERVALS.ROUTE_DIAGNOSTICS),
    ]

    return () => {
      intervals.forEach((interval) => clearInterval(interval))
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 animate-pulse"
      case "inactive":
        return "text-gray-500"
      default:
        return "text-yellow-400"
    }
  }

  const formatBatteryTime = (minutes: number) => {
    if (minutes <= 0) return "Calculating..."
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getInterfaceTypeColor = (type: string) => {
    switch (type) {
      case "wifi":
        return "bg-green-400/20 text-green-400 border-green-400/30"
      case "ethernet":
        return "bg-blue-400/20 text-blue-400 border-blue-400/30"
      case "loopback":
        return "bg-purple-400/20 text-purple-400 border-purple-400/30"
      case "vpn":
        return "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
      default:
        return "bg-gray-400/20 text-gray-400 border-gray-400/30"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] text-white p-4 font-mono">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-400/25">
                <Activity className="w-8 h-8 text-black" />
              </div>
              <div
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isConnected ? "bg-green-400 text-black" : "bg-red-500 text-white"}`}
              >
                {isConnected ? "●" : "✕"}
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {networkData.macInfo.hostname || "Network Monitor"}
              </h1>
              <p className="text-gray-400 text-sm">💻 macOS Network Monitoring Center</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Performance: {lastUpdate.systemPerformance.toLocaleTimeString()}</span>
                <span>•</span>
                <span>Interfaces: {lastUpdate.networkInterfaces.toLocaleTimeString()}</span>
                <span>•</span>
                <span>Security: {lastUpdate.securityMatrix.toLocaleTimeString()}</span>
                <span>•</span>
                <span>Routes: {lastUpdate.routeDiagnostics.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <div className="flex space-x-2">
              <Badge className={`${isConnected ? "bg-green-400 text-black" : "bg-red-500 text-white"}`}>
                {isConnected ? "ONLINE" : "OFFLINE"}
              </Badge>
              <Badge
                className={`${networkData.security.firewall.enabled ? "bg-blue-400 text-black" : "bg-yellow-400 text-black"}`}
              >
                {networkData.security.firewall.enabled ? "PROTECTED" : "VULNERABLE"}
              </Badge>
              <Badge className={`${networkData.security.vpn ? "bg-purple-400 text-black" : "bg-gray-600 text-white"}`}>
                {networkData.security.vpn ? "VPN ON" : "VPN OFF"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className={networkData.macInfo.battery.charging ? "text-green-400" : "text-yellow-400"}>
                {networkData.macInfo.battery.percentage}% {networkData.macInfo.battery.charging ? "(Charging)" : ""}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              <span>Hostname: {networkData.macInfo.hostname}</span> •<span> Uptime: {networkData.macInfo.uptime}</span>
            </div>
            <div className="text-xs text-gray-500">
              <span>
                Refresh: Perf:{REFRESH_INTERVALS.SYSTEM_PERFORMANCE / 1000}s | Net:
                {REFRESH_INTERVALS.NETWORK_INTERFACES / 1000}s | Sec:{REFRESH_INTERVALS.SECURITY_MATRIX / 1000}s |
                Route:{REFRESH_INTERVALS.ROUTE_DIAGNOSTICS / 1000}s
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-yellow-900/80 to-yellow-800/60 border-yellow-400/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 flex items-center">
              <Cpu className="w-5 h-5 mr-2" />⚡ System Performance
              <Badge variant="outline" className="ml-auto border-yellow-400 text-yellow-400 text-xs">
                {REFRESH_INTERVALS.SYSTEM_PERFORMANCE / 1000}s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-yellow-400">🖥️ CPU Usage</span>
                <span className="text-white font-bold">{networkData.performance.cpu.toFixed(1)}%</span>
              </div>
              <Progress value={networkData.performance.cpu} className="h-3" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-blue-400">🧠 Memory</span>
                <span className="text-white font-bold">
                  {networkData.performance.memory.percentage.toFixed(1)}% ({networkData.performance.memory.used} /{" "}
                  {networkData.performance.memory.total} GB)
                </span>
              </div>
              <Progress value={networkData.performance.memory.percentage} className="h-3" />

              {networkData.performance.memory.details && (
                <div className="grid grid-cols-5 gap-1 mt-2 text-xs">
                  <div className="text-center p-1 bg-blue-400/20 rounded">
                    <div className="text-blue-400">Active</div>
                    <div className="text-white">{networkData.performance.memory.details.active}</div>
                  </div>
                  <div className="text-center p-1 bg-purple-400/20 rounded">
                    <div className="text-purple-400">Wired</div>
                    <div className="text-white">{networkData.performance.memory.details.wired}</div>
                  </div>
                  <div className="text-center p-1 bg-yellow-400/20 rounded">
                    <div className="text-yellow-400">Compressed</div>
                    <div className="text-white">{networkData.performance.memory.details.compressed}</div>
                  </div>
                  <div className="text-center p-1 bg-gray-400/20 rounded">
                    <div className="text-gray-400">Inactive</div>
                    <div className="text-white">{networkData.performance.memory.details.inactive}</div>
                  </div>
                  <div className="text-center p-1 bg-green-400/20 rounded">
                    <div className="text-green-400">Free</div>
                    <div className="text-white">{networkData.performance.memory.details.free}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Laptop className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">macOS System Info</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-700/30 rounded">
                  <div className="text-gray-400">OS Version</div>
                  <div className="text-white">{networkData.macInfo.osVersion}</div>
                </div>
                <div className="p-2 bg-gray-700/30 rounded">
                  <div className="text-gray-400">Chip</div>
                  <div className="text-white">{networkData.macInfo.chipInfo}</div>
                </div>
                <div className="p-2 bg-gray-700/30 rounded">
                  <div className="text-gray-400">Hostname</div>
                  <div className="text-white">{networkData.macInfo.hostname}</div>
                </div>
                <div className="p-2 bg-gray-700/30 rounded">
                  <div className="text-gray-400">Uptime</div>
                  <div className="text-white">{networkData.macInfo.uptime}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/80 to-green-800/60 border-green-400/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 flex items-center">
              <Zap className="w-5 h-5 mr-2" />📈 Network Jitter
              <Badge variant="outline" className="ml-auto border-green-400 text-green-400 text-xs">
                {REFRESH_INTERVALS.SYSTEM_PERFORMANCE / 1000}s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-48 bg-black/50 rounded-lg p-2 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute w-full border-t border-green-400"
                    style={{ top: `${(i + 1) * 16.6}%` }}
                  />
                ))}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute h-full border-l border-green-400"
                    style={{ left: `${(i + 1) * 8.3}%` }}
                  />
                ))}
              </div>

              <div className="absolute inset-0 flex items-end space-x-1 p-2">
                {networkData.performance.jitter.map((jitter, index) => (
                  <div
                    key={index}
                    className="bg-green-400 rounded-t transition-all duration-300"
                    style={{
                      height: `${(jitter / 15) * 100}%`,
                      width: `${100 / networkData.performance.jitter.length}%`,
                    }}
                  />
                ))}
              </div>

              <div className="absolute top-2 right-2 text-right">
                <div className="text-lg font-bold text-green-400">
                  {networkData.performance.jitter[networkData.performance.jitter.length - 1]?.toFixed(1) || "0.0"}ms
                </div>
                <div className="text-xs text-gray-400">Current</div>
              </div>
            </div>

            <div className="mt-3 text-center text-xs text-gray-400">📊 Lower jitter = Better network stability</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 border-green-400/30 backdrop-blur-sm mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-400 flex items-center">
              <Network className="w-5 h-5 mr-2" />🌐 Network Interfaces
            </CardTitle>
            <Badge variant="outline" className="border-green-400 text-green-400 text-xs">
              {REFRESH_INTERVALS.NETWORK_INTERFACES / 1000}s
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {networkData.interfaces.map((iface, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  iface.status === "active"
                    ? "border-green-400/50 bg-green-400/10"
                    : "border-gray-600/50 bg-gray-600/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${iface.status === "active" ? "bg-green-400" : "bg-gray-500"}`}
                    />
                    <div className="font-bold text-white">{iface.name}</div>
                  </div>
                  <div className="text-xs uppercase text-gray-400">{iface.type}</div>
                </div>

                <div className="mb-2">
                  <div className="text-sm font-mono text-green-400">{iface.ip}</div>
                  <div className="text-xs text-gray-400">{iface.mac}</div>
                </div>

                <div className="mb-2">
                  <Badge variant="outline" className={`${getInterfaceTypeColor(iface.type)} text-xs`}>
                    {iface.purpose}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-1 bg-green-400/10 rounded">
                    <div className="text-green-400">📥 {iface.packets.rx.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-1 bg-blue-400/10 rounded">
                    <div className="text-blue-400">📤 {iface.packets.tx.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-red-900/80 to-red-800/60 border-red-400/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-400 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                🛡️ Security Matrix
              </CardTitle>
              <Badge
                className={`${networkData.security.threats > 0 ? "bg-red-400 text-black" : "bg-green-400 text-black"}`}
              >
                {networkData.security.threats > 0 ? `${networkData.security.threats} THREATS` : "SECURE"}
              </Badge>
              <Badge variant="outline" className="border-red-400 text-red-400 text-xs ml-2">
                {REFRESH_INTERVALS.SECURITY_MATRIX / 1000}s
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full ${networkData.security.firewall.enabled ? "bg-green-400" : "bg-red-500"}`}
                  />
                  <span className="text-white">🔥 Firewall</span>
                </div>
                <Badge
                  className={
                    networkData.security.firewall.enabled ? "bg-green-400 text-black" : "bg-red-500 text-white"
                  }
                >
                  {networkData.security.firewall.enabled ? "ENABLED" : "DISABLED"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="text-center p-1 bg-gray-700/50 rounded">
                  <div className="text-gray-300">Stealth Mode</div>
                  <div className={networkData.security.firewall.stealthMode ? "text-green-400" : "text-gray-400"}>
                    {networkData.security.firewall.stealthMode ? "ON" : "OFF"}
                  </div>
                </div>
                <div className="text-center p-1 bg-gray-700/50 rounded">
                  <div className="text-gray-300">Block All</div>
                  <div className={networkData.security.firewall.blockAll ? "text-green-400" : "text-gray-400"}>
                    {networkData.security.firewall.blockAll ? "ON" : "OFF"}
                  </div>
                </div>
                <div className="text-center p-1 bg-gray-700/50 rounded">
                  <div className="text-gray-300">Rules</div>
                  <div className="text-blue-400">{networkData.security.firewall.rules}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${networkData.security.vpn ? "bg-purple-400" : "bg-gray-500"}`} />
                <span className="text-white">🔒 VPN Tunnel</span>
              </div>
              <Badge className={networkData.security.vpn ? "bg-purple-400 text-black" : "bg-gray-600 text-white"}>
                {networkData.security.vpn ? "CONNECTED" : "DISCONNECTED"}
              </Badge>
            </div>

            <div>
              <div className="text-sm text-gray-300 mb-3">🔍 Open Ports ({networkData.security.ports.length})</div>
              {networkData.security.ports.length === 0 ? (
                <div className="text-center p-6 text-gray-400 bg-gray-800/30 rounded-lg">
                  No ports data available
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {networkData.security.ports.map((port, index) => (
                    <Card
                      key={index}
                      className={`border ${
                        port.risk === "high"
                          ? "border-red-400/50 bg-red-400/10"
                          : port.risk === "medium"
                            ? "border-yellow-400/50 bg-yellow-400/10"
                            : "border-green-400/50 bg-green-400/10"
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-mono text-lg font-bold text-white">{port.port}</div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              port.risk === "high"
                                ? "border-red-400 text-red-400"
                                : port.risk === "medium"
                                  ? "border-yellow-400 text-yellow-400"
                                  : "border-green-400 text-green-400"
                            }`}
                          >
                            {port.risk.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-300 font-medium">{port.service}</div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">{port.process}</span>
                            <span className="text-gray-500">PID: {port.pid}</span>
                          </div>
                          {port.user && (
                            <div className="text-xs text-gray-500">User: {port.user}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/80 to-purple-800/60 border-purple-400/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-purple-400 flex items-center">
                <Router className="w-5 h-5 mr-2" />
                🗺️ Route Diagnostics
              </CardTitle>
              <Badge variant="outline" className="border-purple-400 text-purple-400 text-xs">
                {REFRESH_INTERVALS.ROUTE_DIAGNOSTICS / 1000}s
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-purple-400/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">{networkData.ping.latency.toFixed(1)}ms</div>
                  <div className="text-xs text-purple-300">🏓 Ping</div>
                </div>
                <div className="text-center p-3 bg-red-400/20 rounded-lg">
                  <div className="text-lg font-bold text-red-400">{networkData.ping.loss.toFixed(1)}%</div>
                  <div className="text-xs text-red-300">📉 Loss</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-300 mb-2">🌍 Default Gateways</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {networkData.routes.defaultGateways &&
                    networkData.routes.defaultGateways.map((gateway, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-purple-400 text-black rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-mono text-sm text-white">{gateway.gateway}</div>
                            <div className="text-xs text-gray-400">{gateway.interface}</div>
                          </div>
                        </div>
                        <span className="text-purple-400 text-sm">{gateway.latency?.toFixed(1) || "?"}ms</span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-300 mb-2">🛣️ Traceroute</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {networkData.routes.traceroute &&
                    networkData.routes.traceroute.slice(0, 6).map((hop, index) => (
                      <div key={index} className="flex items-center justify-between p-1 bg-gray-800/30 rounded text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-blue-400 text-black rounded-full flex items-center justify-center text-xs font-bold">
                            {hop.number}
                          </div>
                          <span className="font-mono text-white">{hop.ip !== "*" ? hop.ip : "* * *"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-400">
                            {hop.latency ? `${hop.latency.toFixed(1)}ms` : "timeout"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {(100 - networkData.ping.loss - networkData.ping.latency / 10).toFixed(0)}%
                  </div>
                  <div className="text-purple-300 text-sm">Overall Connection Quality</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-gray-300">System Status: Monitoring Active</span>
            </div>
            <div className="text-gray-400">🔄 Configurable Refresh Rates | 📡 Data Source: Host Network</div>
          </div>
          <div className="text-gray-400">
            {networkData.macInfo.hostname || "Network Monitor"} | 🖥️ macOS Network Monitor
          </div>
        </div>
      </div>
    </div>
  )
}
