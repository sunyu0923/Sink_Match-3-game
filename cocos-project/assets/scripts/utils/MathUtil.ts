/**
 * 数学/工具函数
 */
export function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
export function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}
export function randomInt(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min + 1));
}
export function pointInEllipse(px: number, py: number, cx: number, cy: number, rx: number, ry: number): boolean {
    const dx = (px - cx) / rx;
    const dy = (py - cy) / ry;
    return dx * dx + dy * dy <= 1;
}
export function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
