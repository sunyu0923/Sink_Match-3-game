/**
 * 关卡配置（移植自旧版 levels.js，共 20 关）
 */

export interface PowerUpConfig {
    addSlot: number;
    remove: number;
    shuffle: number;
}

export interface LevelConfig {
    levelId: number;
    layerCount: number;                        // 水槽层数
    utensilTypes: string[];
    goals: Record<string, number>;             // 各类型目标数量（必为3的倍数）
    timeLimit: number | null;                  // 秒，null 表示无限
    initialSlots: number;                      // 已解锁盘子数
    unlockableSlots: number;                   // 可通过广告解锁的盘子数
    powerUps: PowerUpConfig;
}

export const LEVELS: LevelConfig[] = [
    { levelId: 1,  layerCount: 1, utensilTypes: ['chopstick','spoon'],                                   goals: { chopstick: 3, spoon: 3 },                                                       timeLimit: null, initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 2,  layerCount: 1, utensilTypes: ['chopstick','spoon'],                                   goals: { chopstick: 6, spoon: 3 },                                                       timeLimit: null, initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 3,  layerCount: 2, utensilTypes: ['chopstick','spoon'],                                   goals: { chopstick: 6, spoon: 6 },                                                       timeLimit: null, initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 4,  layerCount: 2, utensilTypes: ['chopstick','spoon','fork'],                            goals: { chopstick: 3, spoon: 3, fork: 3 },                                              timeLimit: null, initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 5,  layerCount: 2, utensilTypes: ['chopstick','spoon','fork'],                            goals: { chopstick: 6, spoon: 3, fork: 3 },                                              timeLimit: null, initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 6,  layerCount: 2, utensilTypes: ['chopstick','spoon','fork'],                            goals: { chopstick: 6, spoon: 6, fork: 3 },                                              timeLimit: 180,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 7,  layerCount: 3, utensilTypes: ['chopstick','spoon','fork'],                            goals: { chopstick: 6, spoon: 6, fork: 6 },                                              timeLimit: 180,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 8,  layerCount: 3, utensilTypes: ['chopstick','spoon','fork','spatula'],                  goals: { chopstick: 3, spoon: 3, fork: 3, spatula: 3 },                                  timeLimit: 150,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 9,  layerCount: 3, utensilTypes: ['chopstick','spoon','fork','spatula'],                  goals: { chopstick: 6, spoon: 3, fork: 3, spatula: 3 },                                  timeLimit: 150,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 10, layerCount: 3, utensilTypes: ['chopstick','spoon','fork','spatula'],                  goals: { chopstick: 6, spoon: 6, fork: 3, spatula: 3 },                                  timeLimit: 150,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 11, layerCount: 3, utensilTypes: ['chopstick','spoon','fork','spatula'],                  goals: { chopstick: 6, spoon: 6, fork: 6, spatula: 3 },                                  timeLimit: 200,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 12, layerCount: 4, utensilTypes: ['chopstick','spoon','fork','spatula','whisk'],          goals: { chopstick: 3, spoon: 3, fork: 3, spatula: 3, whisk: 3 },                        timeLimit: 200,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 13, layerCount: 4, utensilTypes: ['chopstick','spoon','fork','spatula','whisk'],          goals: { chopstick: 6, spoon: 3, fork: 3, spatula: 3, whisk: 3 },                        timeLimit: 200,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 14, layerCount: 4, utensilTypes: ['chopstick','spoon','fork','spatula','whisk'],          goals: { chopstick: 6, spoon: 6, fork: 6, spatula: 3, whisk: 3 },                        timeLimit: 240,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 15, layerCount: 4, utensilTypes: ['chopstick','spoon','fork','spatula','whisk'],          goals: { chopstick: 6, spoon: 6, fork: 6, spatula: 6, whisk: 3 },                        timeLimit: 240,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 16, layerCount: 4, utensilTypes: ['chopstick','spoon','fork','spatula','whisk','ladle'],  goals: { chopstick: 3, spoon: 3, fork: 3, spatula: 3, whisk: 3, ladle: 3 },              timeLimit: 200,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 17, layerCount: 5, utensilTypes: ['chopstick','spoon','fork','spatula','whisk','ladle'],  goals: { chopstick: 6, spoon: 3, fork: 3, spatula: 3, whisk: 3, ladle: 3 },              timeLimit: 240,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 18, layerCount: 5, utensilTypes: ['chopstick','spoon','fork','spatula','whisk','ladle'],  goals: { chopstick: 6, spoon: 6, fork: 6, spatula: 3, whisk: 3, ladle: 3 },              timeLimit: 240,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 19, layerCount: 5, utensilTypes: ['chopstick','spoon','fork','spatula','whisk','ladle'],  goals: { chopstick: 6, spoon: 6, fork: 6, spatula: 6, whisk: 6, ladle: 3 },              timeLimit: 300,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } },
    { levelId: 20, layerCount: 5, utensilTypes: ['chopstick','spoon','fork','spatula','whisk','ladle'],  goals: { chopstick: 6, spoon: 6, fork: 6, spatula: 6, whisk: 6, ladle: 6 },              timeLimit: 300,  initialSlots: 2, unlockableSlots: 2, powerUps: { addSlot: 1, remove: 1, shuffle: 1 } }
];
