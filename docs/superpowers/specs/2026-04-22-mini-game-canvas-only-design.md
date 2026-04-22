# 设计文档：微信小游戏纯 Canvas 架构迁移

**日期**: 2026-04-22  
**范围**: 将现有微信小程序（WXML/WXSS + Canvas 混合）彻底迁移为纯 Canvas 微信小游戏

---

## 背景与问题

项目以微信**小游戏**身份注册（AppID 对应小游戏），但代码使用小程序的 WXML/WXSS 组件系统（`pages/`、`components/`、`app.json` 页面路由），导致预览报错：

```
source package include invalid file: /components/game-hud/game-hud.wxml
```

微信小游戏只支持 `game.js` + Canvas，不支持 WXML/WXSS/页面路由/组件系统。

---

## 目标

一次性解决所有问题，让游戏在微信开发者工具中能正常预览和运行。

---

## 方案：Option A — 全 Canvas 微信小游戏重构

### 保留不变

- `game/engine/` — GameEngine、Renderer、InputHandler、AnimationManager（全部保留，微调接口）
- `game/entities/` — UtensilItem、SinkPool（完全不变）
- `game/systems/` — MatchSystem、PhysicsLite、LevelManager（完全不变）
- `game/data/` — levels.json、utensils.json（完全不变）
- `services/` — StorageService、AdService、AudioService（完全不变）
- `utils/math.js` — 完全不变

### 删除

- `app.js`, `app.json`, `app.wxss`
- `pages/` 目录（home、game、levels 三个页面）
- `components/` 目录（game-hud、slot-bar、tool-bar 三个组件）
- `sitemap.json`

### 新增文件

```
miniprogram/
├── game.js                    ← 小游戏入口（替代 app.js）
├── game.json                  ← 小游戏配置（替代 app.json）
├── scenes/
│   ├── SceneManager.js        ← 场景管理器，驱动 RAF 主循环，分发触摸
│   ├── HomeScene.js           ← 主页场景（标题、开始、选关、星星统计）
│   ├── LevelScene.js          ← 关卡选择场景（20 关格子，星级，锁定状态）
│   └── GameScene.js           ← 游戏场景（HUD + 水槽 + 槽位栏 + 道具栏 + 弹窗）
└── ui/
    └── UIKit.js               ← Canvas 绘制辅助：按钮、圆角矩形、文字、弹窗
```

---

## 架构设计

### 入口：game.js

```
初始化 StorageService、AdService、AudioService
获取屏幕尺寸、DPR
创建全屏 Canvas（wx.createCanvas()）
创建 SceneManager，传入 canvas
注册 wx.onTouchStart/Move/End → SceneManager.onTouch()
SceneManager.goTo('home')
```

### SceneManager

- 持有当前场景实例（`currentScene`）
- 用 `requestAnimationFrame` 驱动主循环：`currentScene.update(dt)` → `currentScene.render(ctx)`
- `goTo(sceneName, params)` 切换场景（销毁旧场景，创建新场景）
- 触摸事件直接转发给 `currentScene.onTouch(type, x, y)`

### UIKit

提供无状态绘制函数：
- `drawRoundRect(ctx, x, y, w, h, r, fill, stroke)`
- `drawButton(ctx, rect, label, style)` — 返回 rect 供 hit-test
- `drawText(ctx, text, x, y, style)`
- `drawModal(ctx, title, buttons, screenW, screenH)`

每帧重新绘制所有按钮，hit-test 用已知 rect 数组进行点击判断。

### HomeScene 布局（全屏）

```
┌─────────────────────────┐
│    水槽消消乐  厨具大挑战  │  标题区（上 25%）
│         🍳              │
├─────────────────────────┤
│  ⭐ 总星数  🏆 第N关     │  统计区（中间）
├─────────────────────────┤
│       [ 开始游戏 ]       │  按钮区（下 40%）
│       [ 选择关卡 ]       │
└─────────────────────────┘
```

### LevelScene 布局

- 顶部：返回按钮 + "选择关卡"标题
- 主体：4 列网格，每格显示关卡号 + 0-3 星 + 锁定图标
- 点击已解锁关卡 → `SceneManager.goTo('game', {levelId})`

### GameScene 布局（全屏，动态计算）

```
┌─────────────────────────┐  y=0
│ HUD：暂停 | 关卡N | 目标 │  高度 80px
├─────────────────────────┤  y=80
│                         │
│     水槽（Renderer）     │  高度 = screenH * 0.45
│                         │
├─────────────────────────┤
│ 槽位栏：队列格 + 盘子格  │  高度 90px
├─────────────────────────┤
│ 道具栏：加槽/移除/打乱   │  高度 80px
└─────────────────────────┘  y=screenH
```

HUD、槽位栏、道具栏全部用 UIKit 在 Canvas 上绘制。

### GameEngine 接口调整

去掉内部 `requestAnimationFrame` 循环（`_loop` 方法改为由 SceneManager 统一驱动）：
- 新增 `update(dt)` — 只做物理和动画更新
- 新增 `renderSink(ctx, sinkOffsetX, sinkOffsetY, sinkW, sinkH)` — 只渲染水槽区域

GameScene 在自己的 `update/render` 中调用这两个方法，然后自行绘制 HUD/槽位/道具。

### 触摸分层

GameScene 维护一个 `hitAreas[]` 数组，每帧 render 时重建：
- 暂停按钮 rect
- 每个队列格 rect（触发 moveToPlate）
- 每个盘子格 rect（触发 moveFromPlate）
- 每个道具按钮 rect
- 水槽区域 rect（交给 InputHandler 处理厨具点击）

`onTouch(x, y)` 先遍历 `hitAreas`，匹配则执行对应动作；若在水槽区域内，则调用 `engine.handleTouchStart(e)` — 但需将 y 坐标转为相对水槽的偏移传入。

### 弹窗（暂停 / 结算）

`isShowingModal` 标志位。弹窗期间 `update()` 不推进游戏逻辑。弹窗按钮也注册到 `hitAreas`。

---

## 数据流

```
game.js (入口)
  └─ SceneManager (RAF 主循环)
       ├─ HomeScene ──────────────────── StorageService (读星数/当前关)
       ├─ LevelScene ─────────────────── StorageService (读解锁/星级)
       └─ GameScene
            ├─ GameEngine (update + renderSink)
            │    ├─ SinkPool / PhysicsLite / MatchSystem
            │    └─ Renderer (水槽 Canvas 绘制)
            ├─ UIKit (HUD / 槽位 / 道具 / 弹窗)
            ├─ StorageService (存档)
            └─ AdService (解锁盘子 / 道具广告)
```

---

## 关键约定

- 全局对象替代 `getApp()`：`game.js` 导出 `globalData = { storageService, adService, audioService, screenW, screenH, dpr }`，各场景 `require('../../game')` 获取
- 触摸坐标来自 `wx.onTouchStart` 的 `touches[0].clientX/Y`（小游戏 API）
- Canvas 使用 `wx.createCanvas()`，全屏 `canvas.width = screenW * dpr`

---

## 不在本次范围内

- 音效播放（AudioService 已有，本次不做 Canvas UI 集成）
- 真实图片资源（继续用 Placeholder 绘制）
- 泡沫遮挡 / 冰冻特殊机制（11+ 关卡，后续迭代）
