"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Route, MapPin, Clock, Zap } from "lucide-react"

interface RouteHop {
  hop: number
  ip: string
  hostname: string
  latency: number[]
  location: string
  asn: string
}

interface PingResult {
  timestamp: number
  latency: number
  status: "success" | "timeout" | "error"
}

export function RouteDiagnostics() {
  const [routeHops, setRouteHops] = useState<RouteHop[]>([
    {
      hop: 1,
      ip: "192.168.1.1",
      hostname: "router.local",
      latency: [1.2, 1.1, 1.3],
      location: "Local Gateway",
      asn: "Private",
    },
    {
      hop: 2,
      ip: "10.0.0.1",
      hostname: "isp-gateway.net",
      latency: [12.4, 11.8, 13.2],
      location: "ISP Gateway",
      asn: "AS1234",
    },
    {
      hop: 3,
      ip: "203.0.113.1",
      hostname: "core-router.isp.com",
      latency: [25.6, 24.9, 26.1],
      location: "San Francisco, CA",
      asn: "AS1234",
    },
    {
      hop: 4,
      ip: "198.51.100.1",
      hostname: "edge.example.com",
      latency: [45.2, 44.8, 45.9],
      location: "Los Angeles, CA",
      asn: "AS5678",
    },
    {
      hop: 5,
      ip: "93.184.216.34",
      hostname: "example.com",
      latency: [52.1, 51.7, 52.8],
      location: "Destination",
      asn: "AS15133",
    },
  ])

  const [pingResults, setPingResults] = useState<PingResult[]>([])
  const [currentPing, setCurrentPing] = useState({ avg: 0, min: 0, max: 0, loss: 0 })

  useEffect(() => {
    const interval = setInterval(() => {
      const latency = Math.random() * 50 + 20 + (Math.random() > 0.9 ? 100 : 0) // Occasional spike
      const status = Math.random() > 0.05 ? "success" : "timeout" // 5% packet loss

      const newResult: PingResult = {
        timestamp: Date.now(),
        latency,
        status,
      }

      setPingResults((prev) => {
        const newResults = [...prev, newResult].slice(-60)

        // Calculate stats
        const successResults = newResults.filter((r) => r.status === "success")
        const latencies = successResults.map((r) => r.latency)

        if (latencies.length > 0) {
          setCurrentPing({
            avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
            min: Math.min(...latencies),
            max: Math.max(...latencies),
            loss: ((newResults.length - successResults.length) / newResults.length) * 100,
          })
        }

        return newResults
      })

      // Update route latencies
      setRouteHops((prev) =>
        prev.map((hop) => ({
          ...hop,
          latency: [
            hop.latency[0] + (Math.random() - 0.5) * 2,
            hop.latency[1] + (Math.random() - 0.5) * 2,
            hop.latency[2] + (Math.random() - 0.5) * 2,
          ].map((l) => Math.max(0.1, l)),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getLatencyColor = (latency: number) => {
    if (latency < 20) return "text-green-400"
    if (latency < 50) return "text-yellow-400"
    return "text-red-400"
  }

  const getLatencyBg = (latency: number) => {
    if (latency < 20) return "bg-green-400/20 border-green-400/30"
    if (latency < 50) return "bg-yellow-400/20 border-yellow-400/30"
    return "bg-red-400/20 border-red-400/30"
  }

  return (
    <div className="space-y-6">
      {/* Ping Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-400 flex items-center text-sm">
              <Clock className="w-4 h-4 mr-2" />
              Average Ping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{currentPing.avg.toFixed(1)}ms</div>
            <div className="text-xs text-blue-300">Real-time latency</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-400 flex items-center text-sm">
              <Zap className="w-4 h-4 mr-2" />
              Min / Max
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white mb-1">
              {currentPing.min.toFixed(1)} / {currentPing.max.toFixed(1)}ms
            </div>
            <div className="text-xs text-green-300">Best / Worst response</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-purple-400 flex items-center text-sm">
              <Route className="w-4 h-4 mr-2" />
              Packet Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{currentPing.loss.toFixed(1)}%</div>
            <div className="text-xs text-purple-300">Connection stability</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              Route Hops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">{routeHops.length}</div>
            <div className="text-xs text-yellow-300">Network path length</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Trace */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Route className="w-5 h-5 mr-2 text-blue-400" />
              Route Trace to example.com
              <Badge variant="outline" className="ml-auto border-blue-400 text-blue-400">
                TRACING
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {routeHops.map((hop, index) => (
                <div key={hop.hop} className="relative">
                  <div className={`p-4 rounded-lg border ${getLatencyBg(hop.latency[0])}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-400 text-black rounded-full flex items-center justify-center font-bold text-sm">
                          {hop.hop}
                        </div>
                        <div>
                          <div className="font-mono text-white text-sm">{hop.ip}</div>
                          <div className="text-xs text-gray-400">{hop.hostname}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm ${getLatencyColor(hop.latency[0])}`}>
                          {hop.latency[0].toFixed(1)}ms
                        </div>
                        <div className="text-xs text-gray-400">{hop.asn}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="text-gray-300">{hop.location}</div>
                      <div className="flex space-x-2">
                        {hop.latency.map((lat, i) => (
                          <span key={i} className={`font-mono ${getLatencyColor(lat)}`}>
                            {lat.toFixed(1)}ms
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {index < routeHops.length - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-0.5 h-4 bg-blue-400/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ping Visualization */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-400" />
              Ping Latency Graph
              <Badge variant="outline" className="ml-auto border-green-400 text-green-400">
                2s refresh
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-black rounded-lg p-4 overflow-hidden">
              {/* Grid */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute w-full border-t border-green-400" style={{ top: `${i * 20}%` }} />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="absolute h-full border-l border-green-400" style={{ left: `${i * 10}%` }} />
                ))}
              </div>

              {/* Ping line chart */}
              <svg className="absolute inset-0 w-full h-full">
                <path
                  d={pingResults
                    .map((result, i) => {
                      const x = (i / (pingResults.length - 1)) * 100
                      const y = result.status === "success" ? 100 - (result.latency / 200) * 80 : 100
                      return `${i === 0 ? "M" : "L"} ${x}% ${y}%`
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  className="drop-shadow-lg"
                />

                {/* Timeout indicators */}
                {pingResults.map((result, i) =>
                  result.status === "timeout" ? (
                    <circle
                      key={i}
                      cx={`${(i / (pingResults.length - 1)) * 100}%`}
                      cy="90%"
                      r="3"
                      fill="#EF4444"
                      className="animate-pulse"
                    />
                  ) : null,
                )}
              </svg>

              {/* Current ping indicator */}
              <div className="absolute top-4 right-4 text-right">
                <div className={`text-2xl font-bold ${getLatencyColor(currentPing.avg)}`}>
                  {currentPing.avg.toFixed(0)}ms
                </div>
                <div className="text-xs text-gray-400">Current</div>
              </div>
            </div>

            <div className="flex justify-between mt-4 text-xs text-gray-400">
              <span>Last 2 minutes</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                  Success
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-1" />
                  Timeout
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3D Network Topology Placeholder */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-purple-400" />
            Network Topology Map
            <Badge variant="outline" className="ml-auto border-purple-400 text-purple-400">
              3D VIEW
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 bg-black rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-8 items-center">
                {routeHops.map((hop, index) => (
                  <div key={hop.hop} className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                        index === 0
                          ? "border-green-400 bg-green-400/20"
                          : index === routeHops.length - 1
                            ? "border-red-400 bg-red-400/20"
                            : "border-blue-400 bg-blue-400/20"
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{hop.hop}</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-center max-w-16 truncate">{hop.location}</div>
                    <div className={`text-xs font-mono mt-1 ${getLatencyColor(hop.latency[0])}`}>
                      {hop.latency[0].toFixed(1)}ms
                    </div>

                    {index < routeHops.length - 1 && (
                      <div className="absolute w-8 h-0.5 bg-blue-400/50 transform translate-x-8" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Animated data packets */}
            <div className="absolute inset-0">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: "50%",
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: "2s",
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
