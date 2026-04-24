/**
 * UI 工具：通过代码批量构造常用 Cocos UI 节点
 */
import { Color, Label, Node, Sprite, SpriteFrame, SpriteAtlas, UITransform, Vec3, Graphics, color, instantiate, resources, Layers, HorizontalTextAlignment, VerticalTextAlignment } from 'cc';

export interface MakeNodeOpts {
    name?: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    parent?: Node;
    color?: string;          // hex string '#RRGGBB'
}

export function makeNode(opts: MakeNodeOpts = {}): Node {
    const n = new Node(opts.name || 'Node');
    n.layer = Layers.Enum.UI_2D;
    const tr = n.addComponent(UITransform);
    if (opts.width != null && opts.height != null) {
        tr.setContentSize(opts.width, opts.height);
    }
    if (opts.x != null || opts.y != null) {
        n.setPosition(new Vec3(opts.x || 0, opts.y || 0, 0));
    }
    if (opts.parent) opts.parent.addChild(n);
    return n;
}

export function makeSprite(spriteFrame: SpriteFrame | null, opts: MakeNodeOpts = {}): { node: Node; sprite: Sprite } {
    const n = makeNode(opts);
    const sp = n.addComponent(Sprite);
    sp.sizeMode = Sprite.SizeMode.CUSTOM;
    sp.spriteFrame = spriteFrame;
    if (opts.color) sp.color = parseColor(opts.color);
    return { node: n, sprite: sp };
}

export function makeLabel(text: string, opts: MakeNodeOpts & { fontSize?: number; bold?: boolean; align?: 'left' | 'center' | 'right' } = {}): { node: Node; label: Label } {
    const n = makeNode(opts);
    const lb = n.addComponent(Label);
    lb.string = text;
    lb.fontSize = opts.fontSize || 24;
    lb.lineHeight = lb.fontSize + 4;
    lb.isBold = !!opts.bold;
    lb.color = opts.color ? parseColor(opts.color) : new Color(255, 255, 255, 255);
    lb.horizontalAlign = opts.align === 'left' ? HorizontalTextAlignment.LEFT : opts.align === 'right' ? HorizontalTextAlignment.RIGHT : HorizontalTextAlignment.CENTER;
    lb.verticalAlign = VerticalTextAlignment.CENTER;
    return { node: n, label: lb };
}

/** 用 Graphics 画一个圆角矩形作为占位背景 */
export function makeRoundRect(width: number, height: number, radius: number, fillHex: string, opts: MakeNodeOpts = {}): { node: Node; graphics: Graphics } {
    const n = makeNode({ ...opts, width, height });
    const g = n.addComponent(Graphics);
    const c = parseColor(fillHex);
    g.fillColor = c;
    g.roundRect(-width / 2, -height / 2, width, height, radius);
    g.fill();
    return { node: n, graphics: g };
}

export function makeCircle(radius: number, fillHex: string, opts: MakeNodeOpts = {}): { node: Node; graphics: Graphics } {
    const n = makeNode({ ...opts, width: radius * 2, height: radius * 2 });
    const g = n.addComponent(Graphics);
    g.fillColor = parseColor(fillHex);
    g.circle(0, 0, radius);
    g.fill();
    return { node: n, graphics: g };
}

export function parseColor(hex: string): Color {
    const m = hex.replace('#', '');
    const r = parseInt(m.substr(0, 2), 16);
    const g = parseInt(m.substr(2, 2), 16);
    const b = parseInt(m.substr(4, 2), 16);
    const a = m.length >= 8 ? parseInt(m.substr(6, 2), 16) : 255;
    return new Color(r, g, b, a);
}

/** 加载 resources/ 下的精灵帧 */
export function loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
    return new Promise(resolve => {
        resources.load(path + '/spriteFrame', SpriteFrame, (err, sf) => {
            if (err || !sf) {
                // 回退尝试不带 /spriteFrame
                resources.load(path, SpriteFrame, (e2, sf2) => resolve(e2 ? null : sf2));
            } else resolve(sf);
        });
    });
}

/** 从 SpriteAtlas（plist）加载指定帧 */
export function loadFromAtlas(atlasPath: string, frameName: string): Promise<SpriteFrame | null> {
    return new Promise(resolve => {
        resources.load(atlasPath, SpriteAtlas, (err, atlas) => {
            if (err || !atlas) {
                // 回退为普通精灵帧加载
                loadSpriteFrame(atlasPath).then(resolve);
                return;
            }
            const sf = atlas.getSpriteFrame(frameName);
            resolve(sf || null);
        });
    });
}
