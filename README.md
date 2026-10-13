# Ember

[English](README.md) | [中文](README.zh-CN.md)

Ember is a Windows desktop app that keeps Douyin private-chat sparks going. You sign in inside the embedded chat page. The app reads that page's conversation list and can send one interactive emoji to the people who are still due today.

## What you can do

- Sign in on the chat page. The session stays in this app after a normal quit. You do not paste a cookie.
- See each private chat and group: name, spark, days, last message, whether you sent today, and whether the other person sent today.
- Renew due private chats and groups one at a time. Excluded chats stay out. Test send uses only the test column.
- Run two clock times while the window stays open. Automatic send is off until you turn it on.

A spark for the day still needs a message from both people. Ember only sends your side.

## Pages

**Sparks.** Three counts sit on top: due today, lit sparks, and excluded chats. The table scrolls inside the window. **Refresh list** reads the conversation list again and does not send.

**Schedule.** Two times, `10:05` and `21:05` until you change them. **到点自动续火** stays off by default. The window has to be open at that minute; a closed app does not send.

**Login.** The chat page fills the pane. **刷新页面** reloads that page and then reads the session again. It does not send.

## Sending rules

| Action | Who is included |
| --- | --- |
| 一键续火 | Private chats and groups that are due today, except excluded ones. A chat you already sent today is skipped. |
| 到点自动续火 | The same chats as 一键续火, at the two clock times. |
| 测试发送 | Only rows checked in the test column. An excluded row is not sent. A message already sent today does not skip the rest. |
| 排除 | Checked rows stay out of 一键续火, the schedule, and 测试发送. Nobody excluded means every due chat is included. |

A chat with no conversation short id, or no ticket, is never sent. Other conversation types are never sent. Messages go out one after another, with a short pause after each response. If the chat page drops the login, that round stops.

The list updates after a send, when the chat page reports new traffic, and on a short fallback read. **刷新列表** does the same read immediately.

## Settings

Choices are stored in `settings.json` inside Electron's userData directory. On Windows that is `%APPDATA%\spark-desktop\settings.json`. The file holds the schedule, the excluded ids, and the test-send ids. Group rows are stored by conversation id. It does not hold the chat login. An older send-scope switch in that file is ignored.

## Release

The first published version is `0.1.0`. Push a tag whose name is `v` plus the `version` in `package.json`, for example `v0.1.0`. GitHub Actions runs the tests, builds a Windows installer and a portable executable, and attaches both to that GitHub release.

The workflow does not sign the files. Windows SmartScreen can warn the first time you open them.

## Develop

Requirements: Node.js and npm. This repo is developed on Windows.

```bash
npm install
npm run dev
```

`npm run dev` opens the Ember window. After it is up, open **Login**, sign in on the chat page, then return to **Sparks**. The list fills by itself.

| Script | Result |
| --- | --- |
| `npm test` | Runs the local unit tests. They do not call Douyin. |
| `npm run typecheck` | Typechecks the renderer and shared code. |
| `npm run build` | Writes `out/`. |
| `npm run dist:win` | Builds `out/`, then writes the Windows installer and portable executable to `release/`. |
| `npm run preview` | Opens the built app. |

Built output, dependencies, and local env files stay out of git. See `.gitignore`.

## Layout

| Path | Role |
| --- | --- |
| `src/main` | Window, chat-page session, settings file |
| `src/preload` | The small bridge the window uses for settings |
| `src/renderer` | Sidebar, sparks, schedule, login, embedded chat page |
| `src/shared` | List parsing, send decisions, and tests |
| `electron-builder.yml` | Windows installer and portable package |
| `.github/workflows` | CI, and the release that runs when a version tag is pushed |

The npm package name is still `spark-desktop`. The product name is Ember.
