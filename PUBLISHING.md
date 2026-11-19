# 发布与分发

三种分发形态，按「别人拿到后怎么装」区分。仓库里已经有前两种的全部产物，缺的只是推送/登录凭据。

## 0. 每次发布前

```bash
cd /e/DSH_workplace/dsh-handoff-log
node --check lib/index.js
npm pack --dry-run            # 看清 12 个文件都在
```

改版本号：`package.json` 的 `version` 与 `CHANGELOG`（如有）保持一致。

## 1. 本地目录 / tarball（现在就能用，不需要任何账号）

```bash
npm pack                      # 生成 dsh-handoff-log-0.1.0.tgz
```

对方在 DSH **插件 → 添加插件**里填：

- 你的绝对目录，如 `E:\code\dsh-handoff-log`
- 或 tarball 绝对路径，如 `E:\code\dsh-handoff-log-0.1.0.tgz`

本地目录是 `link:` 形式装进 profile，改完源码**重启 DSH** 即生效，不用重装。

## 2. GitHub 仓库地址（需要仓库存在 + 推送凭据）

```bash
# 先在 GitHub 网页上建空仓库 dsh-handoff-log（不要勾 README）
cd /e/DSH_workplace/dsh-handoff-log
git remote add origin https://github.com/<username>/dsh-handoff-log.git
git branch -M main
git push -u origin main
```

对方填 `https://github.com/<username>/dsh-handoff-log`，或简写 `github:<username>/dsh-handoff-log`。

> 公开仓库才能被无凭据安装。私有仓库要对方自己配好 git 凭据。

## 3. npm 包名（需要 npm 账号登录）

```bash
npm login                     # 或 npm adduser
npm whoami                    # 确认已登录
npm publish --access public
```

对方填 `dsh-handoff-log` 或 `dsh-handoff-log@0.1.0`。

## 本机当前状态（2026-11-19）

| 项 | 状态 |
| --- | --- |
| 本地 git 仓库 | ✅ 已 init，2 个提交，分支待改名 main |
| remote | ❌ 未配置 |
| GitHub 推送凭据 | ❌ 无（`gh` 未安装、无 SSH key、credential.helper 未配置） |
| npm 登录 | ❌ `npm whoami` 报 ENEEDAUTH |
| npm 包名 `dsh-handoff-log` | ✅ 未被占用（`npm view` 空） |
| tgz 产物 | ✅ `dsh-handoff-log-0.1.0.tgz`，12 文件 |
| 本地安装已经生效 | ✅ 当前 profile 已装，skill 目录指向本仓库 |

## 开通凭据后的最短路径

```bash
# GitHub
git remote add origin https://github.com/<username>/dsh-handoff-log.git
git branch -M main && git push -u origin main

# npm
npm login && npm publish --access public
```

两步都不需要再改包内任何文件。
