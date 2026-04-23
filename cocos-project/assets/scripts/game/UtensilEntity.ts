/**
 * 厨具实体数据（纯数据 + 浮动状态计算）
 * 渲染部分由 UtensilNode (Cocos Component) 负责
 */
import { randomRange } from '../utils/MathUtil';
import { GAME_CONSTANTS } from '../data/GameConstants';

let _idSeed = 1;

export class UtensilEntity {
    id: number;
    type: string;
    /** 逻辑坐标（Cocos 局部坐标系：原点屏幕中心，y 向上） */
    x: number;
    y: number;
    layer: number;
    width: number;
    height: number;

    /** 浮动参数（每个个体随机化） */
    private floatPhase: number;
    private floatSpeed: number;
    private floatAmp: number;
    private rotPhase: number;
    private rotAmp: number;
    private baseRotation: number;

    /** 计算后的渲染量 */
    renderOffsetY: number = 0;
    renderRotation: number = 0;

    isVisible: boolean = true;
    isClickable: boolean = true;

    constructor(type: string, x: number, y: number, layer: number, width: number, height: number) {
        this.id = _idSeed++;
        this.type = type;
        this.x = x; this.y = y;
        this.layer = layer;
        this.width = width; this.height = height;

        this.floatPhase = Math.random() * Math.PI * 2;
        this.floatSpeed = randomRange(0.8, 1.4) * GAME_CONSTANTS.FLOAT_SPEED;
        this.floatAmp   = randomRange(2, GAME_CONSTANTS.FLOAT_AMPLITUDE);
        this.rotPhase   = Math.random() * Math.PI * 2;
        this.rotAmp     = randomRange(0.02, GAME_CONSTANTS.ROTATE_AMPLITUDE);
        this.baseRotation = randomRange(-0.2, 0.2);
    }

    updateFloat(time: number): void {
        this.renderOffsetY  = Math.sin(time * this.floatSpeed + this.floatPhase) * this.floatAmp;
        this.renderRotation = this.baseRotation + Math.sin(time * this.floatSpeed + this.rotPhase) * this.rotAmp;
    }

    /** 矩形包围盒（用于 hit-test） */
    getBounds(): { x: number; y: number; w: number; h: number } {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            w: this.width,
            h: this.height
        };
    }
}

export function resetIdSeedForTest(): void { _idSeed = 1; }
