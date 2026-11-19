# 发布与分发

三种分发形态，按「别人拿到后怎么装」区分。前两种现在都可用，第三种（npm）还没发布。

## 0. 每次发布前

```bash
cd /e/DSH_workplace/dsh-handoff-log
node --check lib/index.js
npm pack --dry-run            # 看清 12 个文件都在
```

改版本号：`package.json` 的 `version`。

## 1. 本地目录 / tarball（不需要任何账号）

```bash
npm pack                      # 生成 dsh-handoff-log-0.1.0.tgz
```

对方在 DSH **插件 → 添加插件**里填：

- 你的绝对目录，如 `E:\\code\\dsh-handoff-log`
- 或 tarball 绝对路径，如 `E:\\code\\dsh-handoff-log-0.1.0.tgz`

本地目录是 `link:` 形式装进 profile，改完源码**重启 DSH** 即生效，不用重装。

## 2. GitHub 仓库地址（已发布）

仓库：<https://github.com/jadeji00/dsh-handoff-log>（公开，默认分支 `main`）

对方在 **添加插件** 里填：

```
https://github.com/jadeji00/dsh-handoff-log
```

或简写 `github:jadeji00/dsh-handoff-log`。公开仓库才能被无凭据安装；私有仓库要对方自己配好 git 凭据。

### 本机怎么推送（网络受限时的做法）

这台机器上 `github.com:443`（git 协议端点）**不通**，但 `api.github.com` 正常，所以 `git push` 必定失败：

```
fatal: unable to access 'https://github.com/jadeji00/dsh-handoff-log.git/': Failed to connect to github.com:443
```

推送改用 Git Data API。Git 对象是内容寻址的，只要 blob / tree / commit 的字节完全一致，算出来的 SHA 就与本地相同，`git status` 也就不会显示分叉。有两个必须踩准的点：

1. 提交信息末尾**不能有换行** —— GitHub 会 trim，本地带 `\n` 就会被算出不同的 SHA。
2. 提交的 author/committer 时区统一写 **`+0000`** —— GitHub 按 UTC 存，本地写 `+0800` 同样会算出不同 SHA。

网络恢复后可以照常 `git push`；在此之前，先 `git write-tree` 得到树，用 `POST /git/blobs`、`POST /git/trees`、`POST /git/commits` 上传，最后 `PATCH /git/refs/heads/main` 指向新提交，再把本地 `refs/heads/main` 和 `refs/remotes/origin/main` 都 `update-ref` 到同一个 SHA。

## 3. npm 包名（尚未发布）

```bash
npm login                     # 或 npm adduser
npm whoami                    # 确认已登录
npm publish --access public
```

发布后对方填 `dsh-handoff-log` 或 `dsh-handoff-log@0.1.0`。包名目前**未被占用**（`npm view dsh-handoff-log version` 为空）。

## 本机当前状态（2026-11-19）

| 项 | 状态 |
| --- | --- |
| 本地 git 仓库 | ✅ 4 个提交，分支 `main`，工作区干净 |
| remote | ✅ `origin` → `https://github.com/jadeji00/dsh-handoff-log.git` |
| GitHub 仓库 | ✅ 公开，已推送，`main` 与本地 SHA 一致 |
| GitHub 推送方式 | ⚠️ `git push` 不通（github.com:443 被挡），走 Git Data API |
| npm 登录 | ❌ `npm whoami` 报 ENEEDAUTH |
| npm 包名 `dsh-handoff-log` | ✅ 未被占用 |
| tgz 产物 | ✅ `dsh-handoff-log-0.1.0.tgz`，12 文件 |
| 本地安装已经生效 | ✅ 当前 profile 已装，skill 目录指向本仓库 |
