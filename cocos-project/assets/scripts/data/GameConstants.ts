/**
 * 全局常量
 */

export const GAME_CONSTANTS = {
    /** 设计分辨率 */
    DESIGN_WIDTH: 720,
    DESIGN_HEIGHT: 1280,

    /** 队列容量（底部小格子） */
    QUEUE_CAPACITY: 7,

    /** 盘子总数（含锁定） */
    TOTAL_PLATES: 4,

    /** 三消阈值 */
    MATCH_COUNT: 3,

    /** 水槽（锅）几何 */
    SINK_CENTER_Y_RATIO: 0.42,        // 相对于屏幕高（从底向上算 → cocos Y 向上）
    SINK_RADIUS_X_RATIO: 0.46,
    SINK_RADIUS_Y_RATIO: 0.30,

    /** 厨具浮动 */
    FLOAT_AMPLITUDE: 4,
    FLOAT_SPEED: 1.2,
    ROTATE_AMPLITUDE: 0.04,

    /** 飞入队列动画时长（秒） */
    FLY_DURATION: 0.35
};

export enum GameState {
    LOADING = 'LOADING',
    PLAYING = 'PLAYING',
    PAUSED  = 'PAUSED',
    WIN     = 'WIN',
    LOSE    = 'LOSE'
}
