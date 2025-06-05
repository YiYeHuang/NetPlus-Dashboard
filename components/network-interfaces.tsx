"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, NetworkIcon as Ethernet, Router, Signal } from "lucide-react"

interface NetworkInterface {
  name: string
  type: "wifi" | "ethernet" | "loopback" | "bridge"
  status: "active" | "inactive" | "connecting"
  ip: string
  mac: string
  speed: string
  description: string
  packets: { rx: number; tx: number }
}

export function NetworkInterfaces() {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([
    {
      name: "en0",
      type: "wifi",
      status: "active",
      ip: "192.168.1.108",
      mac: "a4:83:e7:2b:4c:1d",
      speed: "866 Mbps",
      description: "Primary WiFi adapter - Connected to home network",
      packets: { rx: 1024567, tx: 892341 },
    },
    {
      name: "en1",
      type: "ethernet",
      status: "inactive",
      ip: "N/A",
      mac: "a4:83:e7:2b:4c:1e",
      speed: "1 Gbps",
      description: "Thunderbolt Ethernet - Disconnected",
      packets: { rx: 0, tx: 0 },
    },
    {
      name: "lo0",
      type: "loopback",
      status: "active",
      ip: "127.0.0.1",
      mac: "N/A",
      speed: "N/A",
      description: "Loopback interface - System internal communication",
      packets: { rx: 45231, tx: 45231 },
    },
    {
      name: "bridge0",
      type: "bridge",
      status: "active",
      ip: "192.168.64.1",
      mac: "a6:83:e7:2b:4c:1f",
      speed: "N/A",
      description: "Virtual bridge - VM network isolation",
      packets: { rx: 12456, tx: 8934 },
    },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setInterfaces((prev) =>
        prev.map((iface) => ({
          ...iface,
          packets: {
            rx: iface.packets.rx + Math.floor(Math.random() * 1000),
            tx: iface.packets.tx + Math.floor(Math.random() * 800),
          },
        })),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case "wifi":
        return <Wifi className="w-5 h-5" />
      case "ethernet":
        return <Ethernet className="w-5 h-5" />
      case "bridge":
        return <Router className="w-5 h-5" />
      default:
        return <Signal className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-green-400 bg-green-400/10"
      case "connecting":
        return "border-yellow-400 bg-yellow-400/10"
      default:
        return "border-gray-600 bg-gray-600/10"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-400 text-black">ACTIVE</Badge>
      case "connecting":
        return <Badge className="bg-yellow-400 text-black">CONNECTING</Badge>
      default:
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-500">
            INACTIVE
          </Badge>
        )
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {interfaces.map((iface) => (
        <Card
          key={iface.name}
          className={`bg-gray-900 border-2 ${getStatusColor(iface.status)} transition-all duration-300`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    iface.status === "active" ? "bg-green-400/20 text-green-400" : "bg-gray-600/20 text-gray-400"
                  }`}
                >
                  {getInterfaceIcon(iface.type)}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white">{iface.name}</CardTitle>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{iface.type}</p>
                </div>
              </div>
              {getStatusBadge(iface.status)}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-xs text-gray-300 leading-relaxed">{iface.description}</div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs mb-1">IP Address</div>
                <div className="font-mono text-green-400">{iface.ip}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">MAC Address</div>
                <div className="font-mono text-blue-400">{iface.mac}</div>
              </div>
            </div>

            {iface.speed !== "N/A" && (
              <div>
                <div className="text-gray-400 text-xs mb-1">Link Speed</div>
                <div className="font-mono text-purple-400">{iface.speed}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">RX Packets</div>
                <div className="font-mono text-green-400 text-sm">{iface.packets.rx.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">TX Packets</div>
                <div className="font-mono text-blue-400 text-sm">{iface.packets.tx.toLocaleString()}</div>
              </div>
            </div>

            {iface.status === "active" && (
              <div className="flex justify-center pt-2">
                <div className="flex space-x-1">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-green-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
