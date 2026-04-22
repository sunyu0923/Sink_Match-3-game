Component({
  properties: {
    queue: { type: Array, value: [] },
    plates: { type: Array, value: [null, null, null, null] },
    plateUnlocked: { type: Array, value: [true, true, false, false] },
    extraSlots: { type: Number, value: 0 }
  },

  data: {
    queueSlots: [],
    emojiMap: {
      chopstick: '🥢',
      spoon: '🥄',
      fork: '🍴',
      spatula: '🔪',
      whisk: '🔄',
      ladle: '🥣',
      board: '🪵',
      rolling_pin: '📏'
    }
  },

  observers: {
    'queue, extraSlots': function (queue, extraSlots) {
      const totalSlots = 7 + (extraSlots || 0);
      const slots = [];
      for (let i = 0; i < totalSlots; i++) {
        slots.push(queue[i] || null);
      }
      this.setData({ queueSlots: slots });
    }
  },

  methods: {
    onPlateTap(e) {
      const index = parseInt(e.currentTarget.dataset.index);
      if (!this.properties.plateUnlocked[index]) {
        this.triggerEvent('unlockplate', { index });
      } else {
        this.triggerEvent('plateclick', { index });
      }
    }
  }
});
