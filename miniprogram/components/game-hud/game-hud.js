const utensilsData = require('../../game/data/utensils.json');

Component({
  properties: {
    levelId: { type: Number, value: 1 },
    goals: { type: Object, value: {} },
    gameState: { type: String, value: 'LOADING' }
  },

  data: {
    goalList: [],
    utensilMap: {}
  },

  lifetimes: {
    attached() {
      // 建立 type → name 映射
      const map = {};
      for (const u of utensilsData) {
        map[u.type] = u;
      }
      this.setData({ utensilMap: map });
    }
  },

  observers: {
    'goals': function (goals) {
      const list = Object.entries(goals || {}).map(([type, count]) => ({
        type,
        count,
        name: (this.data.utensilMap[type] || {}).name || type
      }));
      this.setData({ goalList: list });
    }
  },

  methods: {
    onPauseTap() {
      this.triggerEvent('pause');
    }
  }
});
