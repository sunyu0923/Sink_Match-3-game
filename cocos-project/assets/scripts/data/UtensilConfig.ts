/**
 * 厨具类型定义（移植自旧版 utensils.js）
 */

export interface UtensilDef {
    type: string;
    name: string;
    icon: string;        // 资源路径（textures/utensils/xxx）
    width: number;
    height: number;
    color: string;       // 占位色（无图时使用）
}

export const UTENSILS: UtensilDef[] = [
    { type: 'chopstick',   name: '筷子',     icon: 'textures/utensils/chopstick',   width: 90, height: 110, color: '#8B4513' },
    { type: 'spoon',       name: '勺子',     icon: 'textures/utensils/spoon',       width: 90, height: 110, color: '#C0C0C0' },
    { type: 'fork',        name: '叉子',     icon: 'textures/utensils/fork',        width: 90, height: 110, color: '#A9A9A9' },
    { type: 'spatula',     name: '锅铲',     icon: 'textures/utensils/spatula',     width: 100, height: 120, color: '#2F4F4F' },
    { type: 'whisk',       name: '打蛋器',   icon: 'textures/utensils/whisk',       width: 90, height: 120, color: '#D2691E' },
    { type: 'ladle',       name: '漏勺',     icon: 'textures/utensils/ladle',       width: 100, height: 110, color: '#708090' },
    { type: 'board',       name: '砧板',     icon: 'textures/utensils/board',       width: 110, height: 90,  color: '#DEB887' },
    { type: 'rolling_pin', name: '擀面杖',   icon: 'textures/utensils/rolling_pin', width: 120, height: 70,  color: '#F5DEB3' }
];

export const UTENSILS_MAP: Record<string, UtensilDef> = UTENSILS.reduce((acc, u) => {
    acc[u.type] = u;
    return acc;
}, {} as Record<string, UtensilDef>);
