class MatchSystem {
  /**
   * 检查队列中是否有 3 个同类型的厨具
   * @param {Array} queue - [{type, id}, ...]
   * @returns {Object|null} - {type, matchedIds: [id1, id2, id3]} 或 null
   */
  check(queue) {
    // 按类型分组
    const groups = {};
    for (const item of queue) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item.id);
    }

    // 找到第一组 >= 3 个的
    for (const [type, ids] of Object.entries(groups)) {
      if (ids.length >= 3) {
        return {
          type,
          matchedIds: ids.slice(0, 3) // 取前 3 个
        };
      }
    }

    return null;
  }
}

module.exports = MatchSystem;
