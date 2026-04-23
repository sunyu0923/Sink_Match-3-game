# 水槽消消乐 — Cocos Creator 3.x

微信小游戏版本，全部 UI 由代码运行时构建，无需手工编辑 .scene 文件。

## 目录结构

```
cocos-project/
├── assets/
│   ├── resources/
│   │   └── textures/         # 程序化生成的占位 PNG（可被真实素材替换）
│   │       ├── bg.png
│   │       ├── plate.png, queue_cell.png
│   │       └── utensils/{chopstick,spoon,fork,...}.png
│   └── scripts/
│       ├── Bootstrap.ts          # 主入口组件，挂在 Main 场景 Canvas 上
│       ├── data/                 # 配置（关卡、厨具、常量）
│       ├── services/             # StorageService / AdService / AudioManager
│       ├── game/                 # 纯逻辑：MatchSystem / SinkPool / GameLogic / LevelManager
│       ├── ui/                   # 场景 + UIKit
│       │   ├── SceneRouter.ts
│       │   ├── UIKit.ts
│       │   ├── HomeScene.ts
│       │   ├── LevelScene.ts
│       │   └── GameScene.ts
│       └── utils/MathUtil.ts
├── tests/                        # Node.js 单元测试（无 Cocos 依赖部分）
└── tools/gen-placeholders.ts     # 占位素材生成器
```

## 在 Cocos Creator 中打开

1. 用 Cocos Dashboard 安装 **Cocos Creator 3.8+**
2. 在 Dashboard 中「打开项目」选择 `cocos-project/` 目录
3. 编辑器会自动导入资源，菜单 **资源 → 新建 → 场景**，命名 `Main.scene`
4. 在 Main 场景的 Canvas 节点上添加组件 `Bootstrap`（搜索）
5. 点击预览按钮即可运行

## 打包微信小游戏

1. 菜单「项目 → 构建发布」
2. 选择「微信小游戏」平台
3. AppID 填 `wxa77860397b7a4b1b`
4. 点击「构建」→「运行」会启动微信开发者工具

## 命令

```powershell
npm install            # 已执行
npm test               # 运行 23 个单元测试
npm run gen-assets     # 重新生成占位 PNG
```

## 测试结果

```
✓ MatchSystem (4 tests)
✓ LevelManager (8 tests)
✓ GameLogic (11 tests)
23 passed, 0 failed
```

## 替换真实素材

将 AI 生成的同名 PNG 放到 `assets/resources/textures/` 对应位置即可，
不需要改代码。Cocos 编辑器会自动重新生成 .meta。

## 已实现功能

- 三场景切换（首页 / 关卡选择 / 主游戏）
- 20 关数据，难度递进
- 8 种厨具，水槽随机生成 + 多层遮挡
- 浮动动画（正弦波）
- 三消自动消除 + 连消
- 7 格队列 + 4 盘子（默认 2 解锁，2 锁定可看广告解锁）
- 3 种道具：加菜碟 / 移除 / 打乱
- 暂停 / 胜利 / 失败弹窗
- 星级评定 + 金币奖励 + 本地存储

## 暂未实现（plan 中标记为后续）

- 水豚吉祥物引导
- Shader 水面波纹（当前是静态颜色）
- 真实音效素材
- 高关卡特殊机制（泡沫遮挡、冰冻）
