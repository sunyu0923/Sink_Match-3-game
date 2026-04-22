# CLAUDE.md — 水槽厨具消消乐 (Sink Match-3)

## Project Overview

微信小程序消消乐游戏。玩家从 2.5D 水槽中挑选厨具（筷子、勺子等），放入槽位队列，3 个同类自动消除。关卡难度递增，广告解锁额外槽位。

## Tech Stack

- **Platform**: 微信小程序 (WeChat Mini Program)
- **Rendering**: Canvas 2D (游戏区) + WXML/WXSS (UI 层)
- **Storage**: `wx.setStorageSync` — 纯本地，无数据库
- **Ads**: `wx.createRewardedVideoAd` + 抽象层预留第三方 SDK
- **Language**: JavaScript (ES6 modules via `require`)

## Project Structure

```
miniprogram/
├── app.js / app.json / app.wxss          # 小程序入口
├── pages/
│   ├── home/                              # 首页
│   ├── game/                              # 主游戏页 (Canvas + WXML overlay)
│   └── levels/                            # 关卡选择页
├── components/
│   ├── game-hud/                          # 顶部 HUD (关卡号、目标、星星)
│   ├── slot-bar/                          # 槽位栏 (盘子 + 队列格子)
│   └── tool-bar/                          # 底部道具工具栏
├── game/
│   ├── engine/
│   │   ├── GameEngine.js                  # 主循环 & 状态机
│   │   ├── Renderer.js                    # Canvas 2D 渲染器
│   │   ├── InputHandler.js                # 触摸事件处理
│   │   └── AnimationManager.js            # 缓动/动画管理
│   ├── entities/
│   │   ├── UtensilItem.js                 # 厨具实体
│   │   └── SinkPool.js                    # 水槽容器 (厨具管理 + 水面)
│   ├── systems/
│   │   ├── MatchSystem.js                 # 三消匹配 & 消除逻辑
│   │   ├── PhysicsLite.js                 # 简易浮动物理
│   │   └── LevelManager.js               # 关卡加载 & 难度管理
│   └── data/
│       ├── levels.json                    # 关卡配置表
│       └── utensils.json                  # 厨具类型定义
├── services/
│   ├── AdService.js                       # 广告抽象层
│   ├── StorageService.js                  # 本地存储封装
│   └── AudioService.js                    # 音效管理
├── utils/
│   └── math.js                            # 数学工具函数
└── assets/
    ├── images/{utensils,ui,sink,bg}/      # 图片资源
    └── audio/                             # 音效资源
```

## Architecture

### Rendering: Canvas 2D + WXML Hybrid

- **Canvas 层**: 水槽背景、水面波纹动画、厨具精灵（2.5D 预渲染 PNG）、浮动动画
- **WXML 覆盖层**: HUD、槽位栏、道具工具栏 — 用 `position:absolute` 叠在 Canvas 上方
- 厨具按 `layer` 优先、同层按 `y` 排序绘制，实现遮挡关系

### Game Loop

`GameEngine.js` 用 `canvas.requestAnimationFrame()` 驱动：
```
每帧: inputHandler.process() → physicsLite.update(dt) → animationManager.update(dt) → renderer.render(ctx)
```

State machine: `LOADING → PLAYING → PAUSED → WIN → LOSE`

### Match Logic

1. 玩家点击厨具 → 从水槽飞入队列
2. `MatchSystem` 扫描队列，同类型 ≥ 3 个 → 消除
3. 所有目标达成 → WIN；队列 + 盘子全满 → LOSE

### Data Flow

```
levels.json → LevelManager → SinkPool (生成厨具)
                           → GameEngine (初始化状态)
用户点击 → InputHandler → GameEngine.pickUtensil()
        → SlotBar.addToQueue() → MatchSystem.check()
        → 消除/失败/胜利
```

## Key Conventions

- **Module pattern**: 每个 `.js` 文件导出一个类 (`module.exports = ClassName`)
- **No npm/node_modules**: 微信小程序原生模块系统 (`require`)
- **坐标系**: Canvas 左上角为原点，x 向右，y 向下
- **资源引用**: 图片路径用 `/assets/images/...`，相对于 miniprogram 根目录
- **事件通信**: 组件间用小程序 `triggerEvent` + 页面 `this.selectComponent`

## Common Commands

```bash
# 无 CLI 构建步骤 — 直接用微信开发者工具打开 miniprogram/ 目录
# 真机预览：微信开发者工具 → 预览 → 扫码
```

## Level Design Rules

- 每种厨具数量必须是 **3 的倍数**（保证可解）
- `itemCount` = Σ(goals[type])，必须被 3 整除
- 关卡 1-5 用 2 种厨具；6-10 用 3 种；11+ 逐步增加
- 特殊机制在高关卡引入：泡沫遮挡 (11+)、冰冻 (21+)

## Utensil Types (6-8 种)

`chopstick` (筷子) · `spoon` (勺子) · `fork` (叉子) · `spatula` (锅铲) · `whisk` (打蛋器) · `ladle` (漏勺) · `board` (砧板) · `rolling_pin` (擀面杖)

## Ad Integration

- `AdService` 抽象层：`showRewardedAd(): Promise<boolean>`
- 触发场景：解锁盘子、获取道具、失败复活
- 默认用微信原生 `wx.createRewardedVideoAd`
- 可通过 `adService.setProvider(thirdPartyProvider)` 切换第三方 SDK

## Storage Schema (wx.setStorageSync)

| Key | Type | Description |
|-----|------|-------------|
| `currentLevel` | number | 已解锁的最高关卡 |
| `levelStars` | `{[levelId]: 1\|2\|3}` | 每关星级 |
| `coins` | number | 金币数 |
| `powerUpCounts` | `{addSlot, remove, shuffle}` | 剩余道具数量 |
| `settings` | `{sound, music}` | 设置项 |
