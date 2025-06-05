# 🚀 NetPlus - macOS Network Monitoring Center

实时网络监控Web应用，专为macOS设计，支持独立配置各监控模块的刷新频率。
![Screenshot 2025-06-04 at 22 40 38](https://github.com/user-attachments/assets/91fce3c1-b0a2-4c64-a9cd-79aaef60431f)

## ✨ 特色功能

### 🎨 界面设计
- **动态Logo** - 自动使用计算机hostname作为应用名称
- **卡通+Geek风格** - emoji图标配合科技感界面
- **单页面布局** - 所有监控信息集中在一个界面
- **深色主题** - 护眼的深色背景配色

### 📊 监控功能
- **⚡ 系统性能** - CPU、内存
- **🌐 网络接口** - WiFi/以太网状态，实时数据包统计
- **📊 网络抖动** - 实时波形图显示网络稳定性
- **🛡️ 安全状态** - 防火墙、VPN、开放端口监控
- **🗺️ 路由诊断** - 网络跳点、延迟分析

### ⚙️ 可配置刷新频率
每个监控模块都可以独立配置刷新频率：

| 模块 | 环境变量 | 默认值 | 说明 |
|------|----------|--------|------|
| 系统性能 | `NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH` | 2000ms | CPU、内存、抖动监控 |
| 网络接口 | `NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH` | 1000ms | 接口状态、流量统计 |
| 安全矩阵 | `NEXT_PUBLIC_SECURITY_MATRIX_REFRESH` | 5000ms | 防火墙、VPN、端口扫描 |
| 路由诊断 | `NEXT_PUBLIC_ROUTE_DIAGNOSTICS_REFRESH` | 10000ms | Ping、Traceroute、网关 |

## 🚀 快速开始

### 本地开发调试
```
npm install

# 编辑 .env.local 文件

npm run dev

# 5. 访问应用
# 前端: http://localhost:3000
```

### 配置刷新频率

创建 `.env.local` 文件并配置刷新频率：


# 快速刷新 (开发/调试用) - 高CPU使用
NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH=1000
NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH=500
NEXT_PUBLIC_SECURITY_MATRIX_REFRESH=2000
NEXT_PUBLIC_ROUTE_DIAGNOSTICS_REFRESH=5000

# 标准刷新 (日常使用) - 平衡性能
NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH=2000
NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH=1000
NEXT_PUBLIC_SECURITY_MATRIX_REFRESH=5000
NEXT_PUBLIC_ROUTE_DIAGNOSTICS_REFRESH=10000

# 节能模式 (降低CPU使用) - 低功耗
NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH=5000
NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH=3000
NEXT_PUBLIC_SECURITY_MATRIX_REFRESH=10000
NEXT_PUBLIC_ROUTE_DIAGNOSTICS_REFRESH=30000

### Docker部署 (监控宿主机)
不建议

## ⚡ 性能优化建议

### 1. 根据使用场景调整刷新频率

**实时监控场景** (高精度，高CPU使用):
```
NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH=1000
NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH=500
NEXT_PUBLIC_SECURITY_MATRIX_REFRESH=2000
NEXT_PUBLIC_ROUTE_DIAGNOSTICS_REFRESH=5000
```

**日常监控场景** (平衡性能):
```
NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH=2000
NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH=1000
NEXT_PUBLIC_SECURITY_MATRIX_REFRESH=5000
NEXT_PUBLIC_ROUTE_DIAGNOSTICS_REFRESH=10000
```

**后台监控场景** (低CPU使用):
```
NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH=10000
NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH=5000
NEXT_PUBLIC_SECURITY_MATRIX_REFRESH=15000
NEXT_PUBLIC_ROUTE_DIAGNOSTICS_REFRESH=60000
```

### 2. 模块化数据获取

应用现在支持按需获取数据，减少不必要的网络请求和系统调用。

### 3. 智能缓存

- 路由诊断数据会根据配置的刷新频率进行缓存
- 系统信息（hostname、OS版本等）会被缓存以减少重复调用

## 🔍 故障排除

### 常见问题

1. **API无响应**

   # 检查服务状态
   curl http://localhost:3000/api/network-status

2. **CPU使用率过高**

   # 降低刷新频率
   NEXT_PUBLIC_SYSTEM_PERFORMANCE_REFRESH=5000
   NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH=3000

3. **数据更新不及时**
   # 提高刷新频率
   NEXT_PUBLIC_NETWORK_INTERFACES_REFRESH=500

## 🎨 自定义配置

### 修改刷新频率
在 `app/page.tsx` 中修改：
```typescript
const interval = setInterval(fetchData, 1000) // 1秒刷新
```

### 添加新的监控指标
1. 在 `app/api/network-status/route.ts` 中添加数据获取函数
2. 在 `app/page.tsx` 中添加显示组件
