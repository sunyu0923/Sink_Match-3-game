/**
 * 程序化生成占位 PNG 素材（无外部依赖，纯 zlib + Buffer）
 * 运行: npx tsx tools/gen-placeholders.ts
 *
 * 生成的图片放到 assets/resources/textures/ 下，可被 resources.load 加载。
 * 后续用 AI 生成的真实素材替换同名文件即可。
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { deflateSync } from 'zlib';

// ---- 极简 PNG 编码（RGBA） ----
function crc32(buf: Buffer): number {
    let table = (crc32 as any)._t as number[] | undefined;
    if (!table) {
        table = [];
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            table[n] = c >>> 0;
        }
        (crc32 as any)._t = table;
    }
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table![(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
}

function encodePng(width: number, height: number, pixels: Uint8Array): Buffer {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;            // bit depth
    ihdr[9] = 6;            // RGBA
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    // 加 filter byte (0) 每行
    const stride = width * 4;
    const filtered = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        filtered[y * (stride + 1)] = 0;
        Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(filtered, y * (stride + 1) + 1);
    }
    const idat = deflateSync(filtered);

    return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- 简易绘制 ----
interface RGBA { r: number; g: number; b: number; a: number }

function hex(h: string): RGBA {
    const m = h.replace('#', '');
    return { r: parseInt(m.substr(0, 2), 16), g: parseInt(m.substr(2, 2), 16), b: parseInt(m.substr(4, 2), 16), a: 255 };
}

function makeCanvas(w: number, h: number, bg: RGBA = { r: 0, g: 0, b: 0, a: 0 }): Uint8Array {
    const buf = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
        buf[i * 4] = bg.r; buf[i * 4 + 1] = bg.g; buf[i * 4 + 2] = bg.b; buf[i * 4 + 3] = bg.a;
    }
    return buf;
}

function fillCircle(buf: Uint8Array, w: number, h: number, cx: number, cy: number, r: number, c: RGBA): void {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dx = x - cx, dy = y - cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d <= r) {
                // 抗锯齿 1 像素
                const a = d > r - 1 ? Math.max(0, r - d) : 1;
                const idx = (y * w + x) * 4;
                buf[idx] = c.r; buf[idx + 1] = c.g; buf[idx + 2] = c.b;
                buf[idx + 3] = Math.floor(c.a * a);
            }
        }
    }
}

function fillEllipse(buf: Uint8Array, w: number, h: number, cx: number, cy: number, rx: number, ry: number, c: RGBA): void {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const nx = (x - cx) / rx, ny = (y - cy) / ry;
            const d2 = nx * nx + ny * ny;
            if (d2 <= 1) {
                const idx = (y * w + x) * 4;
                buf[idx] = c.r; buf[idx + 1] = c.g; buf[idx + 2] = c.b; buf[idx + 3] = c.a;
            }
        }
    }
}

function fillRect(buf: Uint8Array, w: number, _h: number, x0: number, y0: number, ww: number, hh: number, c: RGBA): void {
    for (let y = y0; y < y0 + hh; y++) {
        for (let x = x0; x < x0 + ww; x++) {
            if (x < 0 || x >= w || y < 0) continue;
            const idx = (y * w + x) * 4;
            buf[idx] = c.r; buf[idx + 1] = c.g; buf[idx + 2] = c.b; buf[idx + 3] = c.a;
        }
    }
}

function save(path: string, w: number, h: number, pixels: Uint8Array): void {
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(path, encodePng(w, h, pixels));
    console.log('  ✔', path);
}

// ---- 生成各种素材 ----
const ROOT = join(__dirname, '..', 'assets', 'resources', 'textures');

function genUtensil(name: string, color: string, shape: 'long' | 'round' | 'wide'): void {
    const w = 128, h = 128;
    const px = makeCanvas(w, h);
    const c = hex(color);
    const dark: RGBA = { r: Math.max(0, c.r - 40), g: Math.max(0, c.g - 40), b: Math.max(0, c.b - 40), a: 255 };
    if (shape === 'long') {
        // 长杆 + 顶部小圆
        fillRect(px, w, h, 56, 30, 16, 80, c);
        fillCircle(px, w, h, 64, 30, 18, c);
        fillCircle(px, w, h, 64, 30, 12, dark);
    } else if (shape === 'round') {
        fillCircle(px, w, h, 64, 64, 50, c);
        fillCircle(px, w, h, 64, 64, 38, dark);
    } else {
        // wide: 横长方
        fillRect(px, w, h, 14, 50, 100, 28, c);
        fillRect(px, w, h, 14, 50, 100, 4, dark);
    }
    save(join(ROOT, 'utensils', name + '.png'), w, h, px);
}

function genBg(): void {
    const w = 720, h = 1280;
    const px = makeCanvas(w, h, hex('#a8835a'));
    // 上方木板纹理
    fillRect(px, w, h, 0, 0, w, 80, hex('#8a6b46'));
    // 下方土色
    fillRect(px, w, h, 0, h - 200, w, 200, hex('#9c7a52'));
    save(join(ROOT, 'bg.png'), w, h, px);
}

function genPlate(): void {
    const w = 128, h = 128;
    const px = makeCanvas(w, h);
    fillCircle(px, w, h, 64, 64, 60, hex('#FFF8DC'));
    fillCircle(px, w, h, 64, 64, 48, hex('#FFE4B5'));
    save(join(ROOT, 'plate.png'), w, h, px);
}

function genCell(): void {
    const w = 96, h = 96;
    const px = makeCanvas(w, h);
    fillRect(px, w, h, 4, 4, w - 8, h - 8, hex('#D9D5C8'));
    fillRect(px, w, h, 8, 8, w - 16, h - 16, hex('#E8E4D6'));
    save(join(ROOT, 'queue_cell.png'), w, h, px);
}

console.log('Generating placeholder textures...');
genBg();
genPlate();
genCell();
genUtensil('chopstick',   '#8B4513', 'long');
genUtensil('spoon',       '#C0C0C0', 'long');
genUtensil('fork',        '#A9A9A9', 'long');
genUtensil('spatula',     '#2F4F4F', 'long');
genUtensil('whisk',       '#D2691E', 'long');
genUtensil('ladle',       '#708090', 'round');
genUtensil('board',       '#DEB887', 'wide');
genUtensil('rolling_pin', '#F5DEB3', 'wide');
console.log('Done.');
