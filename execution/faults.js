const DEFAULT_FAULTS = {
  localQaLab: {
    cartTotal: {
      enabled: false,
      mode: 'undercharge',
      amount: 1,
    },
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function createFaultConfig() {
  let faults = clone(DEFAULT_FAULTS);

  function get() {
    return clone(faults);
  }

  function setCartTotal(input = {}) {
    if (typeof input.enabled !== 'boolean') {
      throw new Error('cartTotal.enabled must be a boolean');
    }
    const mode = input.mode || faults.localQaLab.cartTotal.mode;
    if (!['undercharge', 'overcharge'].includes(mode)) {
      throw new Error('cartTotal.mode must be undercharge or overcharge');
    }
    const amount = input.amount === undefined ? faults.localQaLab.cartTotal.amount : Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) {
      throw new Error('cartTotal.amount must be greater than 0 and at most 1000');
    }

    faults.localQaLab.cartTotal = {
      enabled: input.enabled,
      mode,
      amount: roundMoney(amount),
    };
    return get();
  }

  function transformLocalAppScript(source) {
    const cartTotal = faults.localQaLab.cartTotal;
    if (!cartTotal.enabled) return source;

    const needle = 'const total = subtotal + tax + shipping;';
    const sign = cartTotal.mode === 'overcharge' ? '+' : '-';
    const replacement = `const total = Math.max(0, subtotal + tax + shipping ${sign} ${cartTotal.amount}); // TestSphere local cart-total fault`;
    if (!source.includes(needle)) {
      throw new Error('local app cart total calculation was not found');
    }
    return source.replace(needle, replacement);
  }

  return {
    get,
    setCartTotal,
    transformLocalAppScript,
  };
}

module.exports = {
  DEFAULT_FAULTS,
  createFaultConfig,
};
