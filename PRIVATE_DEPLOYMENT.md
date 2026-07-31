# Private deployment profile

本 Fork 面向少量自有服务器与家庭观察点，不以公开展示或多租户 SaaS 为目标。

## 架构

- Cloudflare 只部署一套 Dashboard、Worker、D1 和 Durable Object。
- 每台需要观察的 Linux、macOS 或 Windows 设备只安装轻量 Agent，不重复部署面板。
- 两台不同线路的云服务器用 TCP/ICMP 探测观察云端路径。
- 常开的 Windows 设备可额外通过本机 Clash/Mihomo HTTP 代理发起 HTTPS 请求，观察家庭侧完整代理链路。

## 安全默认值

- 新站点的 `is_public` 默认是 `false`。
- WebSocket 握手必须携带有效后台 JWT。
- Agent 上报 Secret 使用 SHA-256 固定长度摘要和常量时间比较。
- GitHub Actions 通过 `cloudflare/wrangler-action` 的 `secrets` 输入设置 `API_SECRET`，不会将其写入 `wrangler.toml [vars]`。
- Agent 自动更新必须保持关闭，升级前人工审核固定 commit。
- 不启用第三方主题和自定义脚本。

## Windows 端到端代理探测

`custom_bd` 在本 Fork 中作为 `PROXY` 探测槽使用。它支持两种值：

- `host[:port]`：保持原有 TCP 建连探测；
- 不带查询参数的 `https://...`：执行四次 HTTPS GET，显示成功请求的中位耗时，并按失败次数显示 0/25/50/75/100% 失败率。

Windows 安装 Agent 时可额外传入：

```powershell
-BdNode "https://example.com/generate_204" -ProxyUrl "http://127.0.0.1:PORT"
```

约束：

- `ProxyUrl` 只接受回环地址，不能配置远程代理；
- HTTPS 目标应在单台 Windows 服务器的设置里配置，不要设成全局默认，否则其他平台 Agent 也会收到这个目标；
- 探测经过“当前 Clash/Mihomo 选中的代理路径”，它不会为测试自动切换节点；
- `PROXY` 失败说明完整请求失败，但不能单独区分本地网络、Mihomo、代理节点入口、服务端代理进程或服务器出口，需要和两台云服务器的 TCP/ICMP 曲线一起判断。

## 部署顺序

1. 使用 Node.js 24 执行测试与前端构建。
2. 用 `wrangler deploy --dry-run` 验证 Worker、D1、Durable Object 和 Assets 绑定。
3. 创建 D1 数据库并设置真正的 Worker Secret `API_SECRET`。
4. 先部署空面板，设置独立后台密码和 JWT Secret，确认匿名 HTTP 与 WebSocket 均无法读取监控数据。
5. 绑定 Cloudflare Custom Domain，并把 CORS 限制为该监控域名。
6. 最后安装两台云服务器和可选的家庭 Windows 观察点 Agent。

不要把 Cloudflare Token、Agent Secret、后台密码、JWT Secret 或真实服务器地址写入仓库。
