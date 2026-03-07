if (typeof globalThis.structuredClone === 'undefined') {
    globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}