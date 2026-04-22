# 微信小游戏纯 Canvas 迁移 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有 WXML/WXSS 混合架构彻底迁移为纯 Canvas 微信小游戏，消除 "invalid file" 预览错误。

**Architecture:** 新增 `game.js`/`game.json` 作为小游戏入口；`SceneManager` 统一驱动 RAF 主循环并管理 HomeScene/LevelScene/GameScene 三个纯 Canvas 场景；`GameEngine` 去除内部 RAF 改由外部驱动。

**Tech Stack:** 微信小游戏 Canvas 2D API、CommonJS require、wx.setStorageSync

---

### Task 1: game.json + game.js 入口

**Files:**
- Create: `miniprogram/game.json`
- Create: `miniprogram/game.js`

### Task 2: UIKit.js

**Files:**
- Create: `miniprogram/ui/UIKit.js`

### Task 3: SceneManager.js

**Files:**
- Create: `miniprogram/scenes/SceneManager.js`

### Task 4: 修改 GameEngine / Renderer / InputHandler

**Files:**
- Modify: `miniprogram/game/engine/GameEngine.js`
- Modify: `miniprogram/game/engine/Renderer.js`
- Modify: `miniprogram/game/engine/InputHandler.js`

### Task 5: HomeScene + LevelScene

**Files:**
- Create: `miniprogram/scenes/HomeScene.js`
- Create: `miniprogram/scenes/LevelScene.js`

### Task 6: GameScene

**Files:**
- Create: `miniprogram/scenes/GameScene.js`

### Task 7: 删除旧文件

- Delete: `miniprogram/app.js`, `app.json`, `app.wxss`, `sitemap.json`
- Delete: `miniprogram/pages/` 目录
- Delete: `miniprogram/components/` 目录
