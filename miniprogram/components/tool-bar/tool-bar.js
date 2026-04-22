Component({
  properties: {
    powerUps: {
      type: Object,
      value: { addSlot: 0, remove: 0, shuffle: 0 }
    }
  },

  data: {
    tools: [
      { type: 'addSlot', name: '加厨具', icon: '📋', key: 'addSlot' },
      { type: 'remove', name: '移除', icon: '🧹', key: 'remove' },
      { type: 'shuffle', name: '打乱', icon: '🔀', key: 'shuffle' }
    ]
  },

  methods: {
    onToolTap(e) {
      const type = e.currentTarget.dataset.type;
      this.triggerEvent('powerup', { type });
    }
  }
});
