# Ember

[English](README.md) | [中文](README.zh-CN.md)

Ember is a Windows desktop app that keeps Douyin private-chat sparks going. You sign in inside the embedded chat page. The app reads that page's conversation list and can send one interactive emoji to the people who are still due today.

## What you can do

- Sign in on the chat page. The session stays in this app after a normal quit. You do not paste a cookie.
- See each private chat and group: name, spark, days, last message, whether you sent today, and whether the other person sent today.
- Renew due private chats one at a time, or send only the people you checked.
- Run two clock times while the window stays open. Automatic send is off until you turn it on.

A spark for the day still needs a message from both people. Ember only sends your side.

## Pages

**Sparks.** Three counts sit on top: due today, lit sparks, and checked people. The table scrolls inside the window. **Refresh list** reads the conversation list again and does not send.

**Schedule.** Two times, `10:05` and `21:05` until you change them. **到点自动续火** stays off by default. The window has to be open at that minute; a closed app does not send.

**Login.** The chat page fills the pane. **刷新页面** reloads that page and then reads the session again. It does not send.

## Sending rules

| Action | Who is included |
| --- | --- |
| 一键续火 | Private chats that are due today. Someone you already sent today is skipped. |
| 测试发送 | Only checked people. A message already sent today does not skip them. |
| 限定名单 off | Due send uses every due private chat. |
| 限定名单 on, nobody checked | Due send stays disabled. |
| 限定名单 on, some checked | Due send uses only those people. |

Groups are never sent. A chat with no conversation short id is never sent. Messages go out one after another, with a short pause after each response. If the chat page drops the login, that round stops.

The list updates after a send, when the chat page reports new traffic, and on a short fallback read. **刷新列表** does the same read immediately.

## Settings

Choices are stored in `settings.json` inside Electron's userData directory. On Windows that is `%APPDATA%\spark-desktop\settings.json`. The file holds the schedule, the limited-list switch, and the checked ids. It does not hold the chat login.

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
| `npm run preview` | Opens the built app. |

Built output, dependencies, and local env files stay out of git. See `.gitignore`.

## Layout

| Path | Role |
| --- | --- |
| `src/main` | Window, chat-page session, settings file |
| `src/preload` | The small bridge the window uses for settings |
| `src/renderer` | Sidebar, sparks, schedule, login, embedded chat page |
| `src/shared` | List parsing, send decisions, and tests |

The npm package name is still `spark-desktop`. The product name is Ember.
