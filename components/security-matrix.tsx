"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Eye, AlertTriangle, CheckCircle } from "lucide-react"

interface SecurityEvent {
  id: string
  type: "firewall" | "port" | "vpn" | "intrusion"
  severity: "low" | "medium" | "high"
  message: string
  timestamp: number
  status: "active" | "resolved" | "monitoring"
}

interface OpenPort {
  port: number
  protocol: "TCP" | "UDP"
  service: string
  process: string
  status: "listening" | "established" | "closed"
}

export function SecurityMatrix() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: "1",
      type: "firewall",
      severity: "low",
      message: "Firewall blocked 3 connection attempts from 192.168.1.1",
      timestamp: Date.now() - 30000,
      status: "resolved",
    },
    {
      id: "2",
      type: "port",
      severity: "medium",
      message: "New service listening on port 8080 (HTTP-Alt)",
      timestamp: Date.now() - 120000,
      status: "monitoring",
    },
    {
      id: "3",
      type: "vpn",
      severity: "low",
      message: "VPN tunnel established to 203.0.113.1",
      timestamp: Date.now() - 300000,
      status: "active",
    },
  ])

  const [openPorts, setOpenPorts] = useState<OpenPort[]>([
    { port: 22, protocol: "TCP", service: "SSH", process: "sshd", status: "listening" },
    { port: 80, protocol: "TCP", service: "HTTP", process: "nginx", status: "listening" },
    { port: 443, protocol: "TCP", service: "HTTPS", process: "nginx", status: "listening" },
    { port: 3000, protocol: "TCP", service: "Node.js", process: "node", status: "listening" },
    { port: 5432, protocol: "TCP", service: "PostgreSQL", process: "postgres", status: "listening" },
    { port: 8080, protocol: "TCP", service: "HTTP-Alt", process: "java", status: "listening" },
  ])

  const [vpnStatus, setVpnStatus] = useState({
    connected: true,
    server: "us-west-1.example.com",
    ip: "203.0.113.1",
    protocol: "OpenVPN",
    encryption: "AES-256-GCM",
    uptime: "2h 34m",
  })

  const [firewallStats, setFirewallStats] = useState({
    status: "enabled",
    blocked: 1247,
    allowed: 8934,
    rules: 23,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new security events
      if (Math.random() > 0.8) {
        const newEvent: SecurityEvent = {
          id: Date.now().toString(),
          type: ["firewall", "port", "vpn", "intrusion"][Math.floor(Math.random() * 4)] as any,
          severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as any,
          message: "New security event detected",
          timestamp: Date.now(),
          status: "active",
        }
        setSecurityEvents((prev) => [newEvent, ...prev.slice(0, 9)])
      }

      // Update firewall stats
      setFirewallStats((prev) => ({
        ...prev,
        blocked: prev.blocked + Math.floor(Math.random() * 3),
        allowed: prev.allowed + Math.floor(Math.random() * 10),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-400 border-red-400"
      case "medium":
        return "text-yellow-400 border-yellow-400"
      default:
        return "text-green-400 border-green-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Eye className="w-4 h-4 text-yellow-400" />
    }
  }

  const getPortRisk = (port: number) => {
    const riskyPorts = [22, 23, 80, 443, 3389, 5432, 3306]
    return riskyPorts.includes(port) ? "medium" : "low"
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 flex items-center text-sm">
              <Shield className="w-4 h-4 mr-2" />
              Firewall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{firewallStats.status.toUpperCase()}</div>
            <div className="text-xs text-green-300">
              {firewallStats.blocked} blocked • {firewallStats.allowed} allowed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-400 flex items-center text-sm">
              <Lock className="w-4 h-4 mr-2" />
              VPN Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {vpnStatus.connected ? "CONNECTED" : "DISCONNECTED"}
            </div>
            <div className="text-xs text-blue-300">
              {vpnStatus.server} • {vpnStatus.uptime}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 flex items-center text-sm">
              <Eye className="w-4 h-4 mr-2" />
              Open Ports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{openPorts.length}</div>
            <div className="text-xs text-yellow-300">
              {openPorts.filter((p) => getPortRisk(p.port) === "medium").length} require attention
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-400 flex items-center text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {securityEvents.filter((e) => e.status === "active").length}
            </div>
            <div className="text-xs text-red-300">Active security events</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Events Matrix */}
        <Card className="bg-gray-900 border-gray-700 flex flex-col">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-400" />
              Security Events Matrix
              <Badge variant="outline" className="ml-auto border-red-400 text-red-400">
                LIVE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3 h-full min-h-80 overflow-y-auto">
              {securityEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(event.severity)} bg-gray-800/50`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(event.status)}
                      <Badge variant="outline" className={`text-xs ${getSeverityColor(event.severity)}`}>
                        {event.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <div className="text-sm text-gray-300">{event.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Port Scanner */}
        <Card className="bg-gray-900 border-gray-700 flex flex-col">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Eye className="w-5 h-5 mr-2 text-yellow-400" />
              Port Scanner
              <Badge variant="outline" className="ml-auto border-yellow-400 text-yellow-400">
                SCANNING
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
              {openPorts.map((port) => (
                <Card
                  key={`${port.port}-${port.protocol}`}
                  className={`${
                    getPortRisk(port.port) === "medium"
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-green-400 bg-green-400/10"
                  } flex flex-col`}
                >
                  <CardContent className="p-4 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-mono text-2xl font-bold text-white">{port.port}</div>
                      <Badge
                        className={port.status === "listening" ? "bg-green-400 text-black" : "bg-gray-400 text-black"}
                      >
                        {port.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg text-gray-300 font-medium">{port.service}</div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-400">{port.protocol}</div>
                        <div className="text-sm text-gray-400">{port.process}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matrix Rain Effect */}
      <Card className="bg-black border-green-400/30 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Matrix
            <Badge variant="outline" className="ml-auto border-green-400 text-green-400">
              ACTIVE MONITORING
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-32 overflow-hidden">
            <div className="absolute inset-0 font-mono text-green-400 text-xs leading-tight opacity-60">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-pulse"
                  style={{
                    left: `${i * 5}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "2s",
                  }}
                >
                  {Array.from({ length: 10 }, () => String.fromCharCode(0x30a0 + Math.random() * 96)).join("")}
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 text-green-400 font-mono">
              SYSTEM SECURE • ALL PROTOCOLS MONITORED • THREAT LEVEL: LOW
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
