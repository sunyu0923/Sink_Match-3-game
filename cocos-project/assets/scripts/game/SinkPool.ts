/**
 * 水槽容器：管理厨具实体集合（纯逻辑，渲染由 GameController 同步到 Cocos 节点）
 */
import { LevelConfig } from '../data/LevelConfig';
import { UTENSILS_MAP } from '../data/UtensilConfig';
import { UtensilEntity } from './UtensilEntity';
import { randomRange, shuffle, pointInEllipse } from '../utils/MathUtil';

export interface SinkRegion {
    cx: number;        // 水槽中心 X（Cocos 局部坐标）
    cy: number;        // 水槽中心 Y
    rx: number;        // 椭圆半长轴
    ry: number;        // 椭圆半短轴
}

export class SinkPool {
    items: UtensilEntity[] = [];
    region: SinkRegion;

    constructor(region: SinkRegion) {
        this.region = region;
    }

    /** 根据关卡配置生成厨具 */
    generate(config: LevelConfig): void {
        this.items = [];
        const typeList: string[] = [];
        for (const t in config.goals) {
            const n = config.goals[t];
            for (let i = 0; i < n; i++) typeList.push(t);
        }
        // 加点干扰：补足总数为 layerCount * 12 左右（保证够多）
        const minTotal = config.layerCount * 6;
        while (typeList.length < minTotal) {
            const t = config.utensilTypes[Math.floor(Math.random() * config.utensilTypes.length)];
            // 仅添加非目标多余项时确保仍是 3 倍数。简化处理：直接补 3 个
            for (let i = 0; i < 3; i++) typeList.push(t);
        }
        const shuffled = shuffle(typeList);
        const perLayer = Math.ceil(shuffled.length / config.layerCount);

        for (let i = 0; i < shuffled.length; i++) {
            const layer = Math.min(config.layerCount - 1, Math.floor(i / perLayer));
            const def = UTENSILS_MAP[shuffled[i]];
            const margin = 0.78 - layer * 0.08;
            // 椭圆内随机点
            let x = 0, y = 0, ok = false;
            for (let tries = 0; tries < 30; tries++) {
                x = randomRange(this.region.cx - this.region.rx * margin, this.region.cx + this.region.rx * margin);
                y = randomRange(this.region.cy - this.region.ry * margin, this.region.cy + this.region.ry * margin);
                if (pointInEllipse(x, y, this.region.cx, this.region.cy, this.region.rx * margin, this.region.ry * margin)) {
                    ok = true; break;
                }
            }
            if (!ok) { x = this.region.cx; y = this.region.cy; }
            const item = new UtensilEntity(shuffled[i], x, y, layer, def.width, def.height);
            this.items.push(item);
        }
        this.updateClickable();
    }

    getVisible(): UtensilEntity[] {
        return this.items.filter(it => it.isVisible);
    }

    removeItem(item: UtensilEntity): void {
        item.isVisible = false;
        this.updateClickable();
    }

    /** 道具：打乱所有可见厨具位置 */
    shuffleItems(): void {
        const visible = this.getVisible();
        const positions = visible.map(it => ({ x: it.x, y: it.y, layer: it.layer }));
        const shuffled = shuffle(positions);
        for (let i = 0; i < visible.length; i++) {
            visible[i].x = shuffled[i].x;
            visible[i].y = shuffled[i].y;
            visible[i].layer = shuffled[i].layer;
        }
        this.updateClickable();
    }

    /** 顶层物品才可点击：被任何更高 layer 物品 AABB 覆盖中心点的不可点 */
    updateClickable(): void {
        const visible = this.getVisible();
        for (const it of visible) {
            it.isClickable = true;
            for (const other of visible) {
                if (other === it || other.layer <= it.layer) continue;
                const b = other.getBounds();
                if (it.x >= b.x && it.x <= b.x + b.w && it.y >= b.y && it.y <= b.y + b.h) {
                    it.isClickable = false;
                    break;
                }
            }
        }
    }
}
