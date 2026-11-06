<p align="center">
  <img src="resources/icon.png" alt="Ember" width="128">
</p>

<h1 align="center">Ember</h1>

<p align="center">
  Keep a Douyin consecutive-chat streak going from your own desktop.
</p>

<p align="center">
  <a href="https://github.com/Ninthless/Ember/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/Ninthless/Ember?style=flat-square&color=f97316"></a>
  <a href="https://github.com/Ninthless/Ember/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Ninthless/Ember/ci.yml?style=flat-square&label=CI"></a>
  <a href="https://github.com/Ninthless/Ember/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/Ninthless/Ember/total?style=flat-square&color=blueviolet"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-orange?style=flat-square"></a>
</p>

<p align="center">
  <strong>English</strong>
  ·
  <a href="README.zh-CN.md">简体中文</a>
  ·
  <a href="https://github.com/Ninthless/Ember/releases/latest">Download</a>
  ·
  <a href="https://github.com/Ninthless/Ember/issues">Issues</a>
</p>

<p align="center">
  <a href="https://github.com/Ninthless/Ember/releases/latest">Download the latest release</a>
</p>

---

Ember is a desktop application for Windows, macOS, and Linux. Sign in on the embedded Douyin chat page. Ember reads that page and can send your side of a due private chat or group.

A streak for the day counts only after both people have sent a message. Ember does not send for the other person, and it does not ask you to paste a cookie.

## Features

| | |
| --- | --- |
| **Streak list** | Name, days, last message, whether you sent today, and whether the other side sent today. |
| **Renew all** | Sends due private chats and groups one message at a time. |
| **Schedule** | Two clock times, `10:05` and `21:05` until you change them. Off until you turn it on. |
| **Exclude** | A checked chat stays out of Renew all, the schedule, and Test send. |
| **Session** | A normal quit keeps the chat login in this app. |

The list refreshes after a send, when the chat page reports new traffic, and on a short fallback read.

## Download

Packages are on [GitHub Releases](https://github.com/Ninthless/Ember/releases/latest). They are not code-signed. Windows SmartScreen and macOS Gatekeeper may warn the first time you open one.

| Platform | Package |
| --- | --- |
| Windows x64 | [Ember Setup](https://github.com/Ninthless/Ember/releases/latest/download/Ember-Setup.exe) |
| Windows x64, portable | [Ember portable](https://github.com/Ninthless/Ember/releases/latest/download/Ember-portable.exe) |
| macOS Apple silicon | [Ember arm64](https://github.com/Ninthless/Ember/releases/latest/download/Ember-arm64.dmg) |
| macOS Intel | [Ember x64](https://github.com/Ninthless/Ember/releases/latest/download/Ember-x64.dmg) |
| Linux x64 | [Ember AppImage](https://github.com/Ninthless/Ember/releases/latest/download/Ember-x64.AppImage) |
| Linux x64 | [Ember deb](https://github.com/Ninthless/Ember/releases/latest/download/Ember-x64.deb) |

On macOS, open the app from the disk image. On Linux, mark the AppImage executable before you run it. A zip is also published for each macOS build.

## Get started

1. Install Ember and open it.
2. Open **Login** and sign in on the embedded chat page.
3. Return to **Sparks**. The conversation list fills on its own.
4. Exclude any chat you do not want, then use **Renew all** or turn on the schedule.

A scheduled send runs only while the window is open.

## Interface

| Page | What it is for |
| --- | --- |
| Sparks | Due today, lit streaks, and excluded chats. **Refresh list** reads conversations again and does not send. |
| Schedule | Two times. **Renew on schedule** stays off by default. |
| Login | The embedded chat page. **Refresh page** reloads it and reads the session again. It does not send. |
| About | Current version, update check, disclaimer, independence notice, and MIT license. |

## Sending

| Action | Who receives a message |
| --- | --- |
| Renew all | Private chats and groups that are due today, except excluded ones. A chat you already sent today is skipped. |
| Renew on schedule | The same chats as Renew all, at the two clock times. |
| Test send | Only rows checked in the test column. An excluded row is not sent. A message already sent today does not skip a checked row. |
| Exclude | Checked rows stay out of Renew all, the schedule, and Test send. |

A chat without a conversation short id or a ticket is never sent. Other conversation types are never sent. Messages go out one after another, with a short pause after each response. If the chat page drops the login, that round stops.

## Data

Ember stores its own choices in `settings.json`. The chat login stays in the app's persistent browser partition and is flushed on a normal quit.

| Platform | Path |
| --- | --- |
| Windows | `%APPDATA%\spark-desktop\settings.json` |
| macOS | `~/Library/Application Support/spark-desktop/settings.json` |
| Linux | `~/.config/spark-desktop/settings.json` |

The file holds the schedule, excluded ids, and test-send ids. A group is stored by conversation id. An older send-scope switch in that file is ignored.

## Develop

Node.js 22 and npm.

```bash
npm install
npm run dev
```

| Command | Result |
| --- | --- |
| `npm test` | Runs the local unit tests. They do not call Douyin. |
| `npm run typecheck` | Typechecks the renderer and shared code. |
| `npm run build` | Writes the build to `out/`. |
| `npm run dist:win` | Writes the Windows installer and portable executable to `release/`. |
| `npm run dist:mac` | Writes the macOS disk image and zip to `release/`. |
| `npm run dist:linux` | Writes the Linux AppImage and deb to `release/`. |
| `npm run preview` | Opens the built application. |

| Path | Role |
| --- | --- |
| `src/main` | Window, chat-page session, settings file |
| `src/preload` | Settings, window, and update bridge |
| `src/renderer` | Sidebar, Sparks, Schedule, Login, About, embedded chat page |
| `src/shared` | List parsing, send decisions, and tests |
| `electron-builder.yml` | Windows, macOS, and Linux packages |
| `.github/workflows` | Continuous integration, and the release that runs on a version tag |

The product name is Ember. The npm package name is `spark-desktop`.

A tag named `v` plus the `version` in `package.json` starts the release workflow. It runs the tests, builds on Windows, macOS, and Linux, and attaches the packages to that GitHub Release. The download links above always follow the latest release.

## Community

Questions and defects go to [GitHub Issues](https://github.com/Ninthless/Ember/issues).

Ember is an independent desktop application. It is not affiliated with, endorsed by, or sponsored by Douyin or ByteDance.

## License

Copyright (C) 2026 Ninthless

This public shell is released under the MIT license. Keep the copyright notice when you use or share it. The chat and send protocol is not part of this repository. This program is distributed without warranty. See [LICENSE](LICENSE).
