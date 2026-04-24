/**
 * 角色类型定义（动物主题 — 精灵图来自 kaixinxiaoxiaole）
 */

export interface UtensilDef {
    type: string;
    name: string;
    icon: string;        // atlas 路径（textures/animals/xxx），resources.load 用
    atlasFrame: string;  // 默认帧名（在 plist 中）
    width: number;
    height: number;
    color: string;       // 占位色（无图时使用）
}

export const UTENSILS: UtensilDef[] = [
    { type: 'chopstick', name: '熊',   icon: 'textures/animals/bear',    atlasFrame: 'bear_click_00',    width: 70, height: 69, color: '#8B4513' },
    { type: 'spoon',     name: '鸟',   icon: 'textures/animals/bird',    atlasFrame: 'bird_click_00',    width: 70, height: 69, color: '#4FC3F7' },
    { type: 'fork',      name: '猫',   icon: 'textures/animals/cat',     atlasFrame: 'cat_click_00',     width: 70, height: 69, color: '#FF9800' },
    { type: 'spatula',   name: '鸡',   icon: 'textures/animals/chicken', atlasFrame: 'chicken_click_00', width: 70, height: 69, color: '#FFEB3B' },
    { type: 'whisk',     name: '狐狸', icon: 'textures/animals/fox',     atlasFrame: 'fox_click_00',     width: 70, height: 69, color: '#FF5722' },
    { type: 'ladle',     name: '青蛙', icon: 'textures/animals/frog',    atlasFrame: 'frog_click_00',    width: 70, height: 69, color: '#4CAF50' },
    { type: 'board',     name: '马',   icon: 'textures/animals/horse',   atlasFrame: 'horse_click_00',   width: 70, height: 69, color: '#795548' }
];

export const UTENSILS_MAP: Record<string, UtensilDef> = UTENSILS.reduce((acc, u) => {
    acc[u.type] = u;
    return acc;
}, {} as Record<string, UtensilDef>);
