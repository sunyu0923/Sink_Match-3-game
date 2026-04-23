/**
 * Cocos Creator 3.x 模块声明（最小化存根，用于 IDE 类型检查）
 * 在 Cocos Creator 编辑器中打开项目时，引擎会提供完整类型。
 * 此文件仅供 VS Code / 命令行 tsc 检查使用。
 */
declare module 'cc' {
    // ---- 核心节点 ----
    export class Node {
        name: string;
        layer: number;
        active: boolean;
        parent: Node | null;
        children: readonly Node[];
        scene: any;

        constructor(name?: string);
        addChild(child: Node): void;
        removeChild(child: Node): void;
        removeAllChildren(): void;
        getChildByName(name: string): Node | null;
        addComponent<T extends Component>(cls: { new(): T } | string): T;
        getComponent<T extends Component>(cls: { new(): T } | string): T | null;
        setPosition(pos: Vec3): void;
        setPosition(x: number, y: number, z: number): void;
        getPosition(out?: Vec3): Vec3;
        getWorldPosition(out?: Vec3): Vec3;
        inverseTransformPoint(out: Vec3, worldPos: Vec3): Vec3;
        setScale(s: Vec3): void;
        setRotationFromEuler(x: number, y: number, z: number): void;
        setSiblingIndex(idx: number): void;
        on(type: string, callback: Function, target?: any): void;
        off(type: string, callback?: Function, target?: any): void;
        destroy(): boolean;
        isValid: boolean;

        position: Vec3;
        scale: Vec3;

        static readonly EventType: {
            TOUCH_START: string;
            TOUCH_MOVE: string;
            TOUCH_END: string;
            TOUCH_CANCEL: string;
        };
    }

    // ---- 数学 ----
    export class Vec2 {
        x: number; y: number;
        constructor(x?: number, y?: number);
    }
    export class Vec3 {
        x: number; y: number; z: number;
        constructor(x?: number, y?: number, z?: number);
    }
    export class Size {
        width: number; height: number;
        constructor(w?: number, h?: number);
    }
    export class Color {
        r: number; g: number; b: number; a: number;
        constructor(r?: number, g?: number, b?: number, a?: number);
    }
    export function color(r?: number, g?: number, b?: number, a?: number): Color;

    // ---- 组件基类 ----
    export class Component {
        node: Node;
        enabled: boolean;
        onLoad?(): void;
        start?(): void;
        update?(dt: number): void;
        onDestroy?(): void;
        schedule(callback: Function, interval?: number, repeat?: number, delay?: number): void;
        unscheduleAllCallbacks(): void;
    }

    // ---- UI 组件 ----
    export class UITransform extends Component {
        contentSize: Size;
        setContentSize(w: number | Size, h?: number): void;
        anchorX: number;
        anchorY: number;
    }
    export class Sprite extends Component {
        spriteFrame: SpriteFrame | null;
        sizeMode: number;
        color: Color;
        static readonly SizeMode: { RAW: number; TRIMMED: number; CUSTOM: number };
    }
    export class Label extends Component {
        string: string;
        fontSize: number;
        lineHeight: number;
        isBold: boolean;
        color: Color;
        horizontalAlign: number;
        verticalAlign: number;
    }
    export class Graphics extends Component {
        fillColor: Color;
        strokeColor: Color;
        lineWidth: number;
        roundRect(x: number, y: number, w: number, h: number, r: number): void;
        rect(x: number, y: number, w: number, h: number): void;
        circle(x: number, y: number, r: number): void;
        ellipse(cx: number, cy: number, rx: number, ry: number): void;
        fill(): void;
        stroke(): void;
        clear(): void;
        moveTo(x: number, y: number): void;
        lineTo(x: number, y: number): void;
        close(): void;
    }
    export class ScrollView extends Component {}
    export class Button extends Component {}

    // ---- 资源 ----
    export class Asset { name: string; }
    export class SpriteFrame extends Asset {}
    export class AudioClip extends Asset {}
    export class SpriteAtlas extends Asset {
        getSpriteFrame(name: string): SpriteFrame | null;
    }

    // ---- 音频 ----
    export class AudioSource extends Component {
        clip: AudioClip | null;
        volume: number;
        loop: boolean;
        play(): void;
        stop(): void;
        playOneShot(clip: AudioClip, volume?: number): void;
    }

    // ---- 资源加载 ----
    export const resources: {
        load<T extends Asset>(path: string, type: { new(): T }, callback: (err: Error | null, asset: T) => void): void;
        load<T extends Asset>(path: string, callback: (err: Error | null, asset: T) => void): void;
    };

    // ---- 场景管理 ----
    export const director: {
        getScene(): any;
        loadScene(name: string, callback?: Function): void;
        addPersistRootNode(node: Node): void;
    };

    // ---- Tween ----
    export function tween<T = any>(target: T): Tween<T>;
    export class Tween<T = any> {
        to(duration: number, props: Partial<T>, opts?: { easing?: string }): Tween<T>;
        by(duration: number, props: Partial<T>, opts?: { easing?: string }): Tween<T>;
        call(cb: () => void): Tween<T>;
        delay(duration: number): Tween<T>;
        repeat(times: number): Tween<T>;
        repeatForever(): Tween<T>;
        sequence(...tweens: Tween<T>[]): Tween<T>;
        start(): Tween<T>;
        stop(): Tween<T>;
        union(): Tween<T>;
    }

    // ---- 装饰器 ----
    export const _decorator: {
        ccclass(name?: string): ClassDecorator;
        property(opts?: any): PropertyDecorator;
        menu(path: string): ClassDecorator;
    };

    // ---- 枚举 ----
    export const Layers: {
        Enum: {
            UI_2D: number;
            DEFAULT: number;
        };
    };
    export enum HorizontalTextAlignment { LEFT = 0, CENTER = 1, RIGHT = 2 }
    export enum VerticalTextAlignment { TOP = 0, CENTER = 1, BOTTOM = 2 }
    export enum ResolutionPolicy { EXACT_FIT = 0, NO_BORDER = 1, SHOW_ALL = 2, FIXED_HEIGHT = 3, FIXED_WIDTH = 4 }

    // ---- 视图/系统 ----
    export const view: {
        setDesignResolutionSize(w: number, h: number, policy: ResolutionPolicy): void;
        getDesignResolutionSize(): Size;
        getVisibleSize(): Size;
    };
    export const screen: {
        windowSize: Size;
        devicePixelRatio: number;
    };
    export const sys: {
        localStorage: {
            getItem(key: string): string | null;
            setItem(key: string, value: string): void;
            removeItem(key: string): void;
        };
        platform: number;
        isMobile: boolean;
    };

    // ---- 工具 ----
    export function instantiate(original: Node): Node;
    export function find(path: string, referenceNode?: Node): Node | null;
}
