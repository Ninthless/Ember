<p align="center">
  <img src="resources/icon.png" alt="Ember" width="128">
</p>

<h1 align="center">Ember</h1>

<p align="center">
  在自己的电脑上，把抖音连续聊天的那一侧发出去。
</p>

<p align="center">
  <a href="https://github.com/Ninthless/Ember/releases/latest"><img alt="版本" src="https://img.shields.io/github/v/release/Ninthless/Ember?style=flat-square&color=f97316"></a>
  <a href="https://github.com/Ninthless/Ember/actions/workflows/ci.yml"><img alt="持续集成" src="https://img.shields.io/github/actions/workflow/status/Ninthless/Ember/ci.yml?style=flat-square&label=CI"></a>
  <a href="https://github.com/Ninthless/Ember/releases"><img alt="下载量" src="https://img.shields.io/github/downloads/Ninthless/Ember/total?style=flat-square&color=blueviolet"></a>
  <a href="LICENSE"><img alt="许可" src="https://img.shields.io/badge/license-MIT-orange?style=flat-square"></a>
</p>

<p align="center">
  <a href="README.md">English</a>
  ·
  <strong>简体中文</strong>
  ·
  <a href="https://github.com/Ninthless/Ember/releases/latest">下载</a>
  ·
  <a href="https://github.com/Ninthless/Ember/issues">问题反馈</a>
</p>

<p align="center">
  <a href="https://github.com/Ninthless/Ember/releases/latest">下载最新版本</a>
</p>

---

Ember 是适用于 Windows、macOS 和 Linux 的桌面应用。在内嵌的抖音聊天页登录后，Ember 读取这个页面，可以向今天待发的单聊和群聊发出你这一侧的消息。

当天的火花要双方都发过消息才算点亮。Ember 不替对方发送，也不需要粘贴 Cookie。

## 功能

| | |
| --- | --- |
| **火花列表** | 名称、天数、最近一条、你今天是否已发、对方今天是否已发。 |
| **一键续火** | 给今天待发的单聊和群聊逐条发送。 |
| **定时** | 两个钟点，默认 `10:05` 和 `21:05`。默认关闭，需要自行打开。 |
| **排除** | 勾选的会话不进入一键续火、定时和测试发送。 |
| **登录保持** | 正常退出后，聊天登录留在本应用里。 |

发送之后、聊天页有新动态时，以及隔一小段时间，列表都会再读一次。

## 下载

安装包在 [GitHub Releases](https://github.com/Ninthless/Ember/releases/latest)。这些文件没有代码签名。Windows SmartScreen 和 macOS Gatekeeper 第一次打开时可能会提示。

| 系统 | 安装包 |
| --- | --- |
| Windows x64 | [Ember 安装包](https://github.com/Ninthless/Ember/releases/latest/download/Ember-Setup.exe) |
| Windows x64 便携版 | [Ember 便携版](https://github.com/Ninthless/Ember/releases/latest/download/Ember-portable.exe) |
| macOS Apple 芯片 | [Ember arm64](https://github.com/Ninthless/Ember/releases/latest/download/Ember-arm64.dmg) |
| macOS Intel | [Ember x64](https://github.com/Ninthless/Ember/releases/latest/download/Ember-x64.dmg) |
| Linux x64 | [Ember AppImage](https://github.com/Ninthless/Ember/releases/latest/download/Ember-x64.AppImage) |
| Linux x64 | [Ember deb](https://github.com/Ninthless/Ember/releases/latest/download/Ember-x64.deb) |

macOS 从磁盘镜像里打开。Linux 先给 AppImage 加上可执行权限再运行。macOS 另外提供 zip。

## 开始使用

1. 安装并打开 Ember。
2. 进入 **登录**，在内嵌聊天页完成登录。
3. 回到 **火花**。会话列表会自行出现。
4. 排除不想发的会话，再使用 **一键续火**，或打开定时。

定时发送只在窗口开着时运行。

## 界面

| 页面 | 用途 |
| --- | --- |
| 火花 | 今天待发、已点亮、已排除。**刷新列表** 只重新读取会话，不发送。 |
| 定时 | 两个时间。**到点自动续火** 默认关闭。 |
| 登录 | 内嵌聊天页。**刷新页面** 会重载页面并重新读取登录态，不发送。 |
| 关于 | 当前版本、检查更新、免责声明、无关声明和 MIT 许可。 |

## 发送规则

| 操作 | 发送对象 |
| --- | --- |
| 一键续火 | 今天待发、且未排除的单聊和群聊。今天已经发过的会话会跳过。 |
| 到点自动续火 | 与一键续火同一批会话，按两个钟点发送。 |
| 测试发送 | 只发送测试列勾选的会话。已排除的不发。今天已发过的勾选会话仍会再发。 |
| 排除 | 勾选的会话不进入一键续火、定时和测试发送。 |

没有会话短号或票据的会话不发。其他会话类型不发。消息逐条发送，每条收到回包后再稍等一下。聊天页把登录弹掉时，这一轮停止。

## 数据

Ember 把自己的选项写在 `settings.json`。聊天登录保存在应用的持久浏览器分区里，正常退出时会先刷盘。

| 系统 | 路径 |
| --- | --- |
| Windows | `%APPDATA%\spark-desktop\settings.json` |
| macOS | `~/Library/Application Support/spark-desktop/settings.json` |
| Linux | `~/.config/spark-desktop/settings.json` |

文件里保存定时、排除的 id，以及测试发送勾选的 id。群聊按会话 id 记录。文件中旧的发送范围开关不再读取。

## 开发

需要 Node.js 22 和 npm。

```bash
npm install
npm run dev
```

| 命令 | 结果 |
| --- | --- |
| `npm test` | 运行本地单元测试。测试不会请求抖音。 |
| `npm run typecheck` | 检查渲染层和共享代码的类型。 |
| `npm run build` | 构建产物写入 `out/`。 |
| `npm run dist:win` | 将 Windows 安装包和便携版写入 `release/`。 |
| `npm run dist:mac` | 将 macOS 磁盘镜像和 zip 写入 `release/`。 |
| `npm run dist:linux` | 将 Linux AppImage 和 deb 写入 `release/`。 |
| `npm run preview` | 打开构建好的应用。 |

| 路径 | 作用 |
| --- | --- |
| `src/main` | 窗口、聊天页会话、设置文件 |
| `src/preload` | 设置、窗口与更新桥接 |
| `src/renderer` | 侧栏、火花、定时、登录、关于、内嵌聊天页 |
| `src/shared` | 列表解析、发送判断和测试 |
| `electron-builder.yml` | Windows、macOS、Linux 安装包 |
| `.github/workflows` | 持续集成，以及推送版本标签时的发布 |

产品名是 Ember。npm 包名是 `spark-desktop`。

推送 `v` 加 `package.json` 里 `version` 的标签，会启动发布流程。流程先跑测试，再分别在 Windows、macOS、Linux 上打包，并把安装包挂到对应的 GitHub Release。上面的下载链接始终指向最新版本。

## 社区

问题和缺陷请提交到 [GitHub Issues](https://github.com/Ninthless/Ember/issues)。

Ember 是独立桌面应用，与抖音、字节跳动没有隶属、认可或赞助关系。

## 许可

Copyright (C) 2026 Ninthless

这个公开界面以 MIT 许可发布。使用或再分发时保留版权声明即可。聊天与发送协议不在这个仓库里。本程序不提供任何担保。全文见 [LICENSE](LICENSE)。
