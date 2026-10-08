# 减脂计划 · Cloudflare D1 云端同步

把打卡进度从「本机浏览器」升级为「多设备互通」。架构：

```
GitHub Pages 静态页（jianfei）──fetch──▶ Cloudflare Worker ──▶ D1 数据库
```

GitHub Pages 只能托管静态文件，跑不了后端；D1 也不能被浏览器直连，所以必须有一个
Worker 当接口。**不需要 R2**（R2 是文件/对象存储，不适合存打卡这种结构化小数据）。

## 部署步骤（需要 Node.js）

1. 安装并登录 wrangler（Cloudflare 官方命令行）：
   ```bash
   npm i -g wrangler
   npx wrangler login
   ```

2. 创建 D1 数据库，把输出的 `database_id` 填进 `wrangler.toml`：
   ```bash
   npx wrangler d1 create jianfei
   ```

3. 建表（远程）：
   ```bash
   npx wrangler d1 execute jianfei --remote --file=schema.sql
   ```

4. 设置密钥（推荐用 secret，不会提交到 GitHub）：
   ```bash
   npx wrangler secret put SYNC_KEY
   ```
   输入一长串随机字符，例如：`9fK2mP7xQ4vR8sT1uW3zY5cA6bD0eHjL`。

5. 部署 Worker：
   ```bash
   npx wrangler deploy
   ```
   成功后会得到一个 `https://jianfei-sync.<你的子域>.workers.dev` 地址。

6. 打开网页 →「打卡」→「数据备份 / 换设备」→ 云端同步：
   - API 地址填 Worker 地址（如 `https://jianfei-sync.xxx.workers.dev`）
   - 密钥填第 4 步的 SYNC_KEY
   - 用户ID填一个自己记得的字符串（手机、电脑填**同一个**）
   - 点「开启同步」→ 显示「已从云端拉取」即成功

7. 把网页部署到 GitHub Pages：仓库里建 `jianfei/` 目录，把 `减脂作战手册.html`
   改名为 `index.html` 放进去（或保留原名，访问 `https://lei37927.github.io/jianfei/减脂作战手册.html`）。

## 说明与注意

- **免费额度**：Worker 免费版每天 10 万次请求、D1 免费版有 500 万行读取/天，个人打卡完全够用。
- **同步策略**：以本机为准合并（云端兜底），同一时间只用一台设备填数据最稳；
  两台设备同时改同一项时，后上传的会覆盖。
- **密钥别公开**：网页里的密钥会和页面一起公开，所以密钥只用来挡住陌生人乱写；
  对个人使用足够。介意的话可以后续给 Worker 加登录鉴权（如 Cloudflare Access）。
- **离线不影响**：本地 localStorage 仍正常记录，断网时先用本机，联网后点「立即同步」补齐。
