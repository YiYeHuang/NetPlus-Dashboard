import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface RouteInfo {
  destination: string
  gateway: string
  flags: string
  interface: string
  type: "ipv4" | "ipv6"
  latency?: number
  loss?: number
  hostname?: string
}

let lastRxBytes = 0
let lastTxBytes = 0
let lastTimestamp = Date.now()
const lastPingTime = 0
const PING_INTERVAL = 30000

export async function GET(request: Request) {

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
 
    switch (type) {
      case "performance":
        const [performance, macInfo] = await Promise.all([getPerformanceData(), getMacOSInfo()])
        return NextResponse.json({
          performance,
          macInfo,
          timestamp: new Date().toISOString(),
        })

      case "interfaces":
        const [interfaces, traffic] = await Promise.all([getNetworkInterfaces(), getTrafficData()])
        return NextResponse.json({
          interfaces,
          traffic,
          timestamp: new Date().toISOString(),
        })

      case "security":
        const security = await getSecurityData()
        return NextResponse.json({
          security,
          timestamp: new Date().toISOString(),
        })

      case "routes":
        const [routes, ping] = await Promise.all([
          getRouteData(true),
          getPingData(),
        ])
        return NextResponse.json({
          routes,
          ping,
          timestamp: new Date().toISOString(),
        })

      default:
        const [allInterfaces, allTraffic, allSecurity, allRoutes, allPerformance, allPing, allMacInfo] =
          await Promise.all([
            getNetworkInterfaces(),
            getTrafficData(),
            getSecurityData(),
            getRouteData(true),
            getPerformanceData(),
            getPingData(),
            getMacOSInfo(),
          ])

        return NextResponse.json({
          interfaces: allInterfaces,
          traffic: allTraffic,
          security: allSecurity,
          routes: allRoutes,
          performance: allPerformance,
          ping: allPing,
          macInfo: allMacInfo,
          timestamp: new Date().toISOString(),
        })
    }
  } catch (error) {
    console.error("🚨 [ERROR] API Error:", error)
    console.error("🚨 [ERROR] Stack trace:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      error: "Failed to fetch network status",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function getNetworkInterfaces() {
  try {
    const { stdout } = await execAsync("ifconfig")
    const interfaces = parseIfconfig(stdout)

    for (const iface of interfaces) {
      try {
        const stats = await getInterfaceStats(iface.name)
        iface.packets = stats
      } catch (error) {
        console.error(`🚨 [ERROR] Getting stats for ${iface.name}:`, error)
        iface.packets = { rx: 0, tx: 0, rxBytes: 0, txBytes: 0 }
      }
    }

    return interfaces
  } catch (error) {
    return []
  }
}

async function getInterfaceStats(interfaceName: string) {
  try {
    const { stdout } = await execAsync(`netstat -ib | grep ${interfaceName}`)
    const lines = stdout.trim().split("\n")

    if (lines.length > 0) {
      const parts = lines[0].trim().split(/\s+/)
      if (parts.length >= 10) {
        return {
          rx: Number.parseInt(parts[6]) || 0,
          tx: Number.parseInt(parts[9]) || 0,
          rxBytes: Number.parseInt(parts[5]) || 0,
          txBytes: Number.parseInt(parts[8]) || 0,
        }
      }
    }

    return { rx: 0, tx: 0, rxBytes: 0, txBytes: 0 }
  } catch (error) {
    return { rx: 0, tx: 0, rxBytes: 0, txBytes: 0 }
  }
}

async function getTrafficData() {
  try {
    const { stdout } = await execAsync("netstat -ib")
    const lines = stdout.split("\n").slice(1)

    let totalRxBytes = 0
    let totalTxBytes = 0

    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 10 && !parts[0].includes("lo")) {
        const rxBytes = Number.parseInt(parts[5]) || 0
        const txBytes = Number.parseInt(parts[8]) || 0
        totalRxBytes += rxBytes
        totalTxBytes += txBytes
      }
    }

    const now = Date.now()
    const timeDiff = (now - lastTimestamp) / 1000

    let uploadSpeed = 0
    let downloadSpeed = 0

    if (lastRxBytes > 0 && lastTxBytes > 0 && timeDiff > 0) {
      uploadSpeed = (totalTxBytes - lastTxBytes) / timeDiff
      downloadSpeed = (totalRxBytes - lastRxBytes) / timeDiff
    }

    lastRxBytes = totalRxBytes
    lastTxBytes = totalTxBytes
    lastTimestamp = now

    return {
      upload: uploadSpeed,
      download: downloadSpeed,
      total: {
        upload: totalTxBytes / 1024 / 1024 / 1024,
        download: totalRxBytes / 1024 / 1024 / 1024,
      },
    }
  } catch (error) {
    console.error("Error getting traffic data:", error)
    return {
      upload: 0,
      download: 0,
      total: { upload: 0, download: 0 },
    }
  }
}

async function getSecurityData() {
  try {
    console.log("🛡️ [getSecurityData] Starting security data collection...")
    
    const [firewallStatus, firewallDetails, vpnStatus, ports] = await Promise.all([
      checkFirewall(),
      getFirewallDetails(),
      checkVPN(),
      getOpenPorts(),
    ])

    console.log("🛡️ [getSecurityData] Collected data:")
    console.log("  - Firewall Status:", firewallStatus)
    console.log("  - VPN Status:", vpnStatus)
    console.log("  - Ports Count:", ports.length)
    console.log("  - Ports:", ports)

    const highRiskPorts = ports.filter((port) => port.risk === "high").length
    const suspiciousConnections = await getSuspiciousConnections()

    const securityData = {
      firewall: {
        ...firewallDetails,
        enabled: firewallStatus,
      },
      vpn: vpnStatus,
      threats: highRiskPorts + suspiciousConnections.length,
      ports,
      suspiciousConnections,
    }

    console.log("✅ [getSecurityData] Final security data:", securityData)
    return securityData
  } catch (error) {
    console.error("❌ [getSecurityData] Error getting security data:", error)
    return {
      firewall: {
        enabled: false,
        blockAll: false,
        stealthMode: false,
        rules: 0,
      },
      vpn: false,
      threats: 0,
      ports: [],
      suspiciousConnections: [],
    }
  }
}

async function getRouteData(shouldUpdateTraceroute = false) {
  try {

    const { stdout: routeOutput } = await execAsync("netstat -rn")

    const routes = parseRouteTable(routeOutput)

    const defaultGateways: RouteInfo[] = routes.filter((route) => route.destination === "default")

    if (shouldUpdateTraceroute) {
      for (const route of defaultGateways) {
        try {
          const pingResult = await pingHost(route.gateway)
          route.latency = pingResult.latency
          route.loss = pingResult.loss
          route.hostname = await getHostname(route.gateway)
        } catch (error) {
          route.latency = 999
          route.loss = 100
          route.hostname = "Unknown"
        }
      }
    }

    const tracerouteInfo = shouldUpdateTraceroute ? await getTraceroute() : []

    return {
      defaultGateways,
      routes: routes.slice(0, 15),
      traceroute: tracerouteInfo,
    }
  } catch (error) {
    console.error("Error getting route data:", error)
    return {
      defaultGateways: [],
      routes: [],
      traceroute: [],
    }
  }
}

async function getPerformanceData() {
  try {
    const [cpu, memory] = await Promise.all([getCPUUsage(), getMemoryUsage()])

    const jitter = await getNetworkJitter()

    return {
      cpu,
      memory,
      jitter,
    }
  } catch (error) {
    return {
      cpu: 0,
      memory: 0,
      jitter: [],
    }
  }
}

async function getPingData() {
  try {
    const result = await pingHost("8.8.8.8")
    return result
  } catch (error) {
    return {
      latency: 0,
      loss: 100,
    }
  }
}

async function getMacOSInfo() {
  try {
    const { stdout: osVersion } = await execAsync("sw_vers -productVersion")

    const { stdout: chipInfo } = await execAsync(
      "sysctl -n machdep.cpu.brand_string || system_profiler SPHardwareDataType | grep Chip",
    )

    let batteryInfo = { percentage: 0, charging: false, timeRemaining: 0 }
    try {
      const { stdout: batteryOutput } = await execAsync("pmset -g batt")
      batteryInfo = parseBatteryInfo(batteryOutput)
    } catch (error) {
      console.error("Error getting battery info:", error)
    }

    const { stdout: hostname } = await execAsync("hostname")

    const { stdout: uptimeOutput } = await execAsync("uptime")
    const uptime = parseUptime(uptimeOutput)

    return {
      osVersion: osVersion.trim(),
      chipInfo: parseChipInfo(chipInfo),
      battery: batteryInfo,
      hostname: hostname.trim(),
      uptime,
    }
  } catch (error) {
    console.error("Error getting macOS info:", error)
    return {
      osVersion: "Unknown",
      chipInfo: "Unknown",
      battery: { percentage: 0, charging: false, timeRemaining: 0 },
      hostname: "Unknown",
      uptime: "Unknown",
    }
  }
}

function parseIfconfig(output: string) {
  const interfaces = []
  const blocks = output.split(/\n(?=\w)/)

  for (const block of blocks) {
    const lines = block.split("\n")
    const nameMatch = lines[0].match(/^(\w+):/)

    if (nameMatch) {
      const name = nameMatch[1]
      const ipMatch = block.match(/inet (\d+\.\d+\.\d+\.\d+)/)
      const macMatch = block.match(/ether ([a-f0-9:]{17})/)
      const statusMatch = block.match(/status: (\w+)/)

      const interfaceInfo = getInterfaceInfo(name, block)

      interfaces.push({
        name,
        type: interfaceInfo.type,
        status: statusMatch ? statusMatch[1] : ipMatch ? "active" : "inactive",
        ip: ipMatch ? ipMatch[1] : "N/A",
        mac: macMatch ? macMatch[1] : "N/A",
        speed: getInterfaceSpeed(block),
        description: interfaceInfo.description,
        purpose: interfaceInfo.purpose,
        packets: { rx: 0, tx: 0, rxBytes: 0, txBytes: 0 },
      })
    }
  }

  return interfaces
}

function getInterfaceInfo(name: string, block: string) {
  if (name === "lo0") {
    return {
      type: "loopback",
      description: "Loopback interface for internal system communication",
      purpose: "System Internal",
    }
  }

  if (name.startsWith("en")) {
    const hasWiFi = block.includes("802.11") || block.includes("AirPort")
    const hasEthernet = block.includes("1000baseT") || block.includes("100baseTX")

    if (hasWiFi) {
      return {
        type: "wifi",
        description: "Wireless network adapter for WiFi connectivity",
        purpose: "WiFi Connection",
      }
    } else if (hasEthernet) {
      return {
        type: "ethernet",
        description: "Wired Ethernet adapter for stable network connection",
        purpose: "Wired Network",
      }
    } else {
      if (name === "en0") {
        return {
          type: "wifi",
          description: "Primary network interface (usually WiFi on MacBook)",
          purpose: "Primary WiFi",
        }
      } else {
        return {
          type: "ethernet",
          description: "Secondary network interface (USB/Thunderbolt adapter)",
          purpose: "USB/TB Ethernet",
        }
      }
    }
  }

  if (name.startsWith("bridge")) {
    return {
      type: "bridge",
      description: "Virtual bridge for VM or container networking",
      purpose: "Virtual Bridge",
    }
  }

  if (name.startsWith("utun") || name.startsWith("tun")) {
    return {
      type: "vpn",
      description: "VPN tunnel interface for secure remote connection",
      purpose: "VPN Tunnel",
    }
  }

  if (name.startsWith("awdl")) {
    return {
      type: "p2p",
      description: "Apple Wireless Direct Link for AirDrop/Handoff",
      purpose: "AirDrop/Handoff",
    }
  }

  if (name.startsWith("llw")) {
    return {
      type: "lowlatency",
      description: "Low Latency WLAN interface for real-time apps",
      purpose: "Low Latency WiFi",
    }
  }

  if (name.startsWith("gif")) {
    return {
      type: "tunnel",
      description: "Generic tunnel interface",
      purpose: "IP Tunnel",
    }
  }

  if (name.startsWith("stf")) {
    return {
      type: "tunnel",
      description: "6to4 tunnel interface",
      purpose: "IPv6 Tunnel",
    }
  }

  if (name.startsWith("ap")) {
    return {
      type: "virtual",
      description: "Access point virtual interface",
      purpose: "Virtual AP",
    }
  }

  return {
    type: "unknown",
    description: `Network interface ${name} - purpose unknown`,
    purpose: "Unknown",
  }
}

function getInterfaceSpeed(block: string) {
  if (block.includes("1000baseT")) return "1 Gbps"
  if (block.includes("100baseTX")) return "100 Mbps"
  if (block.includes("10baseT")) return "10 Mbps"
  if (block.includes("802.11")) {
    if (block.includes("ac")) return "866 Mbps (802.11ac)"
    if (block.includes("n")) return "300 Mbps (802.11n)"
    return "WiFi"
  }
  return "N/A"
}

async function checkFirewall() {
  try {
    const { stdout } = await execAsync(
      'sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "enabled"',
    )
    return !stdout.includes("disabled")
  } catch (error) {
    try {
      const { stdout } = await execAsync('pfctl -s info 2>/dev/null || echo "unknown"')
      return !stdout.includes("disabled")
    } catch (fallbackError) {
      return true
    }
  }
}

async function getFirewallDetails() {
  try {
    const [globalState, stealthMode, blockAll, ruleCount] = await Promise.all([
      execAsync('sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "unknown"'),
      execAsync('sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getstealthmode 2>/dev/null || echo "unknown"'),
      execAsync('sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getblockall 2>/dev/null || echo "unknown"'),
      execAsync(
        'sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps 2>/dev/null | grep "ALF:" | wc -l || echo "0"',
      ),
    ])

    return {
      enabled: !globalState.stdout.includes("disabled"),
      stealthMode: stealthMode.stdout.includes("enabled"),
      blockAll: blockAll.stdout.includes("enabled"),
      rules: Number.parseInt(ruleCount.stdout.trim()) || 0,
    }
  } catch (error) {
    console.error("Error getting firewall details:", error)

    try {
      const { stdout } = await execAsync('pfctl -s info | grep -E "Status|Interfaces|Block|Pass" 2>/dev/null')
      const rules = await execAsync('pfctl -s rules 2>/dev/null | grep -v "@" | wc -l')

      return {
        enabled: !stdout.includes("disabled"),
        stealthMode: stdout.includes("block drop all"),
        blockAll: stdout.includes("block all"),
        rules: Number.parseInt(rules.stdout.trim()) || 0,
      }
    } catch {
      return {
        enabled: true,
        stealthMode: false,
        blockAll: false,
        rules: 0,
      }
    }
  }
}

async function checkVPN() {
  try {
    const { stdout } = await execAsync("ifconfig | grep -E '(utun|tun|ppp)'")
    return stdout.length > 0
  } catch {
    return false
  }
}

async function getOpenPorts() {
  try {
    console.log("🔍 [getOpenPorts] Executing lsof command...")
    const { stdout } = await execAsync("lsof -i -P -n | grep LISTEN")
    console.log("📋 [getOpenPorts] Raw lsof output length:", stdout.length, "characters")
    console.log("📋 [getOpenPorts] First 300 chars:", stdout.substring(0, 300))
    
    if (!stdout.trim()) {
      console.log("⚠️  [getOpenPorts] No lsof output, trying alternative command...")
      try {
        const { stdout: netstatOutput } = await execAsync("netstat -an | grep LISTEN")
        console.log("📋 [getOpenPorts] Netstat output:", netstatOutput.substring(0, 200))
        return parseNetstatOutput(netstatOutput)
      } catch (netstatError) {
        console.error("❌ [getOpenPorts] Netstat also failed:", netstatError)
        return []
      }
    }
    
    const ports = []
    const lines = stdout.split("\n").filter(line => line.trim())
    const seenPorts = new Set()

    console.log("📊 [getOpenPorts] Processing", lines.length, "non-empty lines")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      console.log(`📋 [getOpenPorts] Line ${i}:`, line)
      
      // More flexible regex pattern
      const match = line.match(/(\w+)\s+(\d+)\s+(\w+)\s+.*?:(\d+)\s+.*LISTEN/) ||
                   line.match(/(\w+)\s+(\d+)\s+(\w+)\s+.*?\.(\d+)\s+.*LISTEN/)
      
      if (match) {
        const port = Number.parseInt(match[4])
        const process = match[1]
        const pid = match[2]
        const user = match[3]

        console.log(`✅ [getOpenPorts] Matched port: ${port}, process: ${process}, pid: ${pid}, user: ${user}`)

        if (!seenPorts.has(port) && !isNaN(port)) {
          seenPorts.add(port)
          ports.push({
            port,
            service: getServiceName(port),
            status: "open",
            process,
            pid,
            user,
            risk: getPortRisk(port),
          })
        }
      } else {
        console.log(`❌ [getOpenPorts] No match for line:`, line)
      }
    }

    console.log("✅ [getOpenPorts] Found", ports.length, "open ports:", ports.map(p => `${p.port}(${p.process})`))
    return ports.slice(0, 10) // 限制显示前10个端口
  } catch (error) {
    console.error("❌ [getOpenPorts] Error:", error)
    return []
  }
}

function parseNetstatOutput(output: string) {
  const ports = []
  const lines = output.split("\n")
  const seenPorts = new Set()

  for (const line of lines) {
    const match = line.match(/.*?[.:](\d+)\s+.*LISTEN/)
    if (match) {
      const port = Number.parseInt(match[1])
      if (!seenPorts.has(port) && !isNaN(port)) {
        seenPorts.add(port)
        ports.push({
          port,
          service: getServiceName(port),
          status: "open",
          process: "unknown",
          pid: "unknown",
          user: "unknown",
          risk: getPortRisk(port),
        })
      }
    }
  }

  return ports.slice(0, 10)
}

async function getSuspiciousConnections() {
  try {
    const { stdout } = await execAsync("netstat -an | grep ESTABLISHED")
    const connections = []
    const lines = stdout.split("\n")

    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 5) {
        const foreignAddress = parts[4]
        if (
          !foreignAddress.startsWith("127.") &&
          !foreignAddress.startsWith("192.168.") &&
          !foreignAddress.startsWith("10.")
        ) {
          connections.push({
            local: parts[3],
            foreign: foreignAddress,
            state: parts[5] || "ESTABLISHED",
          })
        }
      }
    }

    return connections.slice(0, 5)
  } catch (error) {
    console.error("Error getting suspicious connections:", error)
    return []
  }
}

async function pingHost(host: string) {
  try {
    const { stdout } = await execAsync(`ping -c 3 -W 3000 ${host}`)

    const latencyMatch = stdout.match(/time=(\d+\.?\d*)/g)
    if (latencyMatch && latencyMatch.length > 0) {
      const latencies = latencyMatch.map((match) => Number.parseFloat(match.split("=")[1]))
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length

      const lossMatch = stdout.match(/(\d+\.?\d*)% packet loss/)
      const loss = lossMatch ? Number.parseFloat(lossMatch[1]) : 0

      return {
        latency: avgLatency,
        loss: loss,
      }
    }

    return { latency: 999, loss: 100 }
  } catch {
    return { latency: 999, loss: 100 }
  }
}

async function getHostname(ip: string) {
  try {
    const { stdout } = await execAsync(`dig +short -x ${ip}`)
    return stdout.trim() || ip
  } catch {
    return ip
  }
}

async function getCPUUsage() {
  try {
    const { stdout } = await execAsync('top -l 1 -n 0 | grep "CPU usage"')
    const match = stdout.match(/(\d+\.?\d*)% user/)
    const usage = match ? Number.parseFloat(match[1]) : 0
    return usage
  } catch (error) {
    return 0
  }
}

async function getMemoryUsage() {
  try {
    const { stdout } = await execAsync("vm_stat")
    const lines = stdout.split("\n")

    const pageSizeMatch = stdout.match(/page size of (\d+) bytes/)
    const pageSize = pageSizeMatch ? Number.parseInt(pageSizeMatch[1]) : 4096

    let freePages = 0
    let activePages = 0
    let inactivePages = 0
    let wiredPages = 0
    let compressedPages = 0

    for (const line of lines) {
      if (line.includes("Pages free:")) {
        const match = line.match(/Pages free:\s+(\d+)\./)
        if (match) freePages = Number.parseInt(match[1])
      } else if (line.includes("Pages active:")) {
        const match = line.match(/Pages active:\s+(\d+)\./)
        if (match) activePages = Number.parseInt(match[1])
      } else if (line.includes("Pages inactive:")) {
        const match = line.match(/Pages inactive:\s+(\d+)\./)
        if (match) inactivePages = Number.parseInt(match[1])
      } else if (line.includes("Pages wired down:")) {
        const match = line.match(/Pages wired down:\s+(\d+)\./)
        if (match) wiredPages = Number.parseInt(match[1])
      } else if (line.includes("Pages occupied by compressor:")) {
        const match = line.match(/Pages occupied by compressor:\s+(\d+)\./)
        if (match) compressedPages = Number.parseInt(match[1])
      }
    }

    const totalPages = freePages + activePages + inactivePages + wiredPages + compressedPages
    const usedPages = activePages + wiredPages + compressedPages

    const usagePercent = (usedPages / totalPages) * 100

    const totalMemoryGB = (totalPages * pageSize) / (1024 * 1024 * 1024)
    const usedMemoryGB = (usedPages * pageSize) / (1024 * 1024 * 1024)

    return {
      percentage: usagePercent,
      used: usedMemoryGB.toFixed(2),
      total: totalMemoryGB.toFixed(2),
      details: {
        active: activePages,
        inactive: inactivePages,
        wired: wiredPages,
        compressed: compressedPages,
        free: freePages,
      },
    }
  } catch (error) {
    console.error("Error calculating memory usage:", error)
    return {
      percentage: 0,
      used: "0",
      total: "0",
      details: {
        active: 0,
        inactive: 0,
        wired: 0,
        compressed: 0,
        free: 0,
      },
    }
  }
}

async function getNetworkJitter() {
  try {
    const { stdout } = await execAsync("ping -c 5 -i 0.2 8.8.8.8")
    const latencyMatches = stdout.match(/time=(\d+\.?\d*)/g)

    if (latencyMatches && latencyMatches.length > 1) {
      const latencies = latencyMatches.map((match) => Number.parseFloat(match.split("=")[1]))
      const jitter = []

      for (let i = 1; i < latencies.length; i++) {
        jitter.push(Math.abs(latencies[i] - latencies[i - 1]))
      }

      return jitter
    }

    return []
  } catch {
    return []
  }
}

function parseRouteTable(output: string): RouteInfo[] {
  const routes: RouteInfo[] = []
  const lines = output.split("\n")
  let section = ""

  for (const line of lines) {
    if (line.includes("Destination")) {
      if (line.includes("Gateway")) {
        section = "ipv4"
      } else if (line.includes("Gateway6")) {
        section = "ipv6"
      }
      continue
    }

    if (section === "ipv4" && line.trim()) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 4) {
        routes.push({
          destination: parts[0],
          gateway: parts[1],
          flags: parts[2],
          interface: parts[parts.length - 1],
          type: "ipv4",
        })
      }
    }

    else if (section === "ipv6" && line.trim()) {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 4) {
        routes.push({
          destination: parts[0],
          gateway: parts[1],
          flags: parts[2],
          interface: parts[parts.length - 1],
          type: "ipv6",
        })
      }
    }
  }

  return routes
}

async function getTraceroute() {
  try {
    const { stdout } = await execAsync("traceroute -q 1 -w 1 8.8.8.8")
    const lines = stdout.split("\n").slice(1)
    const hops = []

    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\s+(?:([^\s]+)\s+$$([^)]+)$$|(\*))(?:\s+(\d+\.?\d*)\s*ms)?/)
      if (match) {
        const hop = {
          number: Number.parseInt(match[1]),
          hostname: match[2] || "*",
          ip: match[3] || "*",
          latency: match[5] ? Number.parseFloat(match[5]) : null,
        }
        hops.push(hop)
      }
    }

    return hops
  } catch (error) {
    console.error("Error getting traceroute:", error)
    return []
  }
}

function getServiceName(port: number) {
  const services: { [key: number]: string } = {
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    993: "IMAPS",
    995: "POP3S",
    3000: "Node.js Dev",
    3306: "MySQL",
    5432: "PostgreSQL",
    6379: "Redis",
    8080: "HTTP-Alt",
    8443: "HTTPS-Alt",
    9090: "Prometheus",
  }
  return services[port] || "Unknown"
}

function getPortRisk(port: number) {
  const highRiskPorts = [22, 23, 3389, 5900]
  const mediumRiskPorts = [21, 25, 53, 110, 143, 993, 995]

  if (highRiskPorts.includes(port)) return "high"
  if (mediumRiskPorts.includes(port)) return "medium"
  return "low"
}

function parseBatteryInfo(output: string) {
  try {
    const percentMatch = output.match(/(\d+)%/)
    const percentage = percentMatch ? Number.parseInt(percentMatch[1]) : 0

    const charging = output.includes("AC Power")

    let timeRemaining = 0
    const timeMatch = output.match(/(\d+:\d+)/)
    if (timeMatch) {
      const [hours, minutes] = timeMatch[1].split(":").map(Number)
      timeRemaining = hours * 60 + minutes
    }

    return {
      percentage,
      charging,
      timeRemaining,
    }
  } catch (error) {
    console.error("Error parsing battery info:", error)
    return { percentage: 0, charging: false, timeRemaining: 0 }
  }
}

function parseChipInfo(output: string) {
  if (output.includes("Apple M")) {
    const match = output.match(/Apple (M\d+(?:\s+\w+)?)/)
    return match ? match[1] : "Apple Silicon"
  } else if (output.includes("Intel")) {
    return output.trim().split("\n")[0]
  }
  return output.trim()
}

function parseUptime(output: string) {
  const match = output.match(/up\s+(.*?),\s+\d+\s+user/)
  return match ? match[1].trim() : "Unknown"
}