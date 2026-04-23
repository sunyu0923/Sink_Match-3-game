# 水槽厨具消消乐 — Cocos Creator 项目结构

## 概览

基于 **Cocos Creator 3.8.0** (TypeScript) 的微信小游戏，玩家从 2.5D 水槽中挑选厨具放入队列，3 个同类自动消除。所有 UI 均通过代码动态生成，无 `.scene` 编辑器文件。

---

## 目录结构

```
cocos-project/
├── cc.d.ts                              # Cocos 'cc' 模块类型声明（IDE 用）
├── package.json                         # npm 配置 & 脚本
├── tsconfig.json                        # TypeScript 编译配置
├── README.md                            # 项目说明
│
├── assets/
│   ├── resources/
│   │   └── textures/                    # 占位符 PNG 资源（由工具生成）
│   │       ├── bg.png                   # 背景
│   │       ├── plate.png                # 盘子
│   │       ├── queue_cell.png           # 队列格子
│   │       └── utensils/               # 8 种厨具精灵图
│   │           ├── chopstick.png
│   │           ├── spoon.png
│   │           ├── fork.png
│   │           ├── spatula.png
│   │           ├── whisk.png
│   │           ├── ladle.png
│   │           ├── board.png
│   │           └── rolling_pin.png
│   │
│   └── scripts/                         # 源代码
│       ├── Bootstrap.ts                 # 入口组件
│       ├── data/                        # 数据配置层
│       ├── game/                        # 游戏核心逻辑
│       ├── services/                    # 服务层
│       ├── ui/                          # UI 场景层
│       └── utils/                       # 工具函数
│
├── settings/                            # Cocos Creator 编辑器设置
│   └── v2/packages/
│       ├── project.json                 # 项目元数据（分辨率 720×1280）
│       └── engine.json                  # 引擎配置
│
├── tests/                               # 单元测试
│   ├── framework.ts                     # 自定义测试框架
│   ├── match.test.ts                    # MatchSystem 测试
│   ├── level.test.ts                    # LevelManager 测试
│   ├── gamelogic.test.ts                # GameLogic 测试
│   ├── run.ts                           # 测试入口
│   └── tsconfig.json
│
└── tools/
    └── gen-placeholders.ts              # 占位符 PNG 生成工具
```

---

## 分层架构

### 1. 数据配置层（`scripts/data/`）

纯数据，无任何引擎依赖。

| 文件 | 导出内容 | 说明 |
|------|---------|------|
| `GameConstants.ts` | `GAME_CONSTANTS`, `GameState` 枚举 | 全局常量（分辨率、物理参数、计时等）+ 游戏状态枚举 |
| `LevelConfig.ts` | `LevelConfig` 接口, `LEVELS` 数组 | 20 个关卡配置：目标、时间限制、槽位数、道具 |
| `UtensilConfig.ts` | `UtensilDef` 接口, `UTENSILS`, `UTENSILS_MAP` | 8 种厨具定义：尺寸、颜色、纹理路径 |

### 2. 游戏核心逻辑层（`scripts/game/`）

**零 Cocos 依赖**，可通过 Node.js 直接测试。

| 文件 | 导出类 | 说明 |
|------|--------|------|
| `GameLogic.ts` | `GameLogic` | 核心状态机与调度器。管理队列、盘子、水槽池，触发消除判定。使用可观察模式向 UI 推送状态快照 |
| `MatchSystem.ts` | `MatchSystem` | 三消匹配逻辑。扫描队列中 ≥3 个同类型项，返回匹配的 ID 列表 |
| `SinkPool.ts` | `SinkPool` | 水槽容器。根据关卡配置生成厨具，在椭圆区域内随机分布，管理层级遮挡 |
| `UtensilEntity.ts` | `UtensilEntity` | 厨具实体。追踪 ID、类型、位置、层级、浮动动画状态 |
| `LevelManager.ts` | `LevelManager` | 关卡管理。查询关卡配置、计算星级评分 |

### 3. 服务层（`scripts/services/`）

平台相关的封装，单例模式。

| 文件 | 导出类 | 说明 |
|------|--------|------|
| `StorageService.ts` | `StorageService` | 持久化存储封装。兼容微信 `wx.setStorageSync` 和 Cocos `sys.localStorage` |
| `AdService.ts` | `AdService` | 激励视频广告抽象层。封装微信 `wx.createRewardedVideoAd()`，支持注入自定义 Provider |
| `AudioManager.ts` | `AudioManager` | 音频管理。基于 Cocos `AudioSource`，预加载音效、管理播放和开关 |

### 4. UI 场景层（`scripts/ui/`）

依赖 Cocos `cc` 模块，代码生成所有 UI 节点。

| 文件 | 导出内容 | 说明 |
|------|---------|------|
| `UIKit.ts` | `makeNode()`, `makeSprite()`, `makeLabel()` 等 | UI 工厂函数。声明式创建 Cocos 节点（容器、精灵、文字、圆角矩形等） |
| `SceneRouter.ts` | `SceneRouter` 单例, `SceneType` 枚举, `IScene` 接口 | 场景路由器。在同一个 Cocos Scene 内切换 HOME / LEVELS / GAME 三个 UI 容器 |
| `HomeScene.ts` | `HomeScene` 类 | 首页。显示游戏标题、总星数、当前关卡、开始按钮 |
| `LevelScene.ts` | `LevelScene` 类 | 关卡选择页。4 列网格展示 20 个关卡及星级 |
| `GameScene.ts` | `GameScene` 类 | 主游戏页。渲染 HUD、水槽池、盘子栏、队列槽位、道具工具栏、弹窗 |

### 5. 工具函数（`scripts/utils/`）

| 文件 | 导出函数 | 说明 |
|------|---------|------|
| `MathUtil.ts` | `clamp()`, `lerp()`, `randomRange()`, `randomInt()`, `pointInEllipse()`, `shuffle()` | 纯数学与随机工具 |

### 6. 入口（`scripts/Bootstrap.ts`）

Cocos `@ccclass` 组件，挂载在 Canvas 节点上。负责：
- 设置设计分辨率（720×1280）
- 初始化 `StorageService`、`AdService`
- 将 `SceneRouter` 附加到场景并导航到首页

---

## 数据流

```
LevelConfig → LevelManager → SinkPool（生成厨具）
                            → GameLogic（初始化状态机）

用户点击厨具 → GameScene（事件拦截）
            → GameLogic.pickUtensil()
            → MatchSystem.findMatch()
            → 消除 / 失败 / 胜利
            → GameLogic 触发回调 → GameScene 更新 UI
```

---

## 常用命令

```bash
# 安装依赖
npm install

# 生成占位符 PNG 资源
npm run gen-assets

# 运行单元测试（23 个测试用例）
npm test

# 在 Cocos Creator 中打开
# 用 Cocos Dashboard 打开 cocos-project/ 目录
```

---

## 厨具类型

| 类型 ID | 中文名 | 英文 |
|---------|--------|------|
| `chopstick` | 筷子 | Chopstick |
| `spoon` | 勺子 | Spoon |
| `fork` | 叉子 | Fork |
| `spatula` | 锅铲 | Spatula |
| `whisk` | 打蛋器 | Whisk |
| `ladle` | 漏勺 | Ladle |
| `board` | 砧板 | Board |
| `rolling_pin` | 擀面杖 | Rolling Pin |

---

## 关卡设计规则

- 每种厨具数量必须是 **3 的倍数**（保证可解）
- 关卡 1-5 用 2 种厨具；6-10 用 3 种；11+ 逐步增加
- 特殊机制在高关卡引入：泡沫遮挡 (11+)、冰冻 (21+)

---

## 测试覆盖

| 测试文件 | 测试数 | 覆盖模块 |
|---------|--------|---------|
| `match.test.ts` | 4 | MatchSystem — 空队列、无匹配、3 消、多余项 |
| `level.test.ts` | 8 | LevelManager — 关卡数量、目标可整除、类型合法性、星级计算 |
| `gamelogic.test.ts` | 11 | GameLogic — 初始化、拾取、队列管理、盘子状态、胜负判定 |
| **合计** | **23** | 游戏核心逻辑 100% 可测 |
