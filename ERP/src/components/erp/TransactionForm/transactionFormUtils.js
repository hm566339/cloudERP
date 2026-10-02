export function createItem(config = {}) {
  return { ...(config.itemDefaults || {}), id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
}

export function validateTransaction(values, config) {
  const errors = {};
  const fields = [...(config.header?.fields || []), ...(config.sidebar?.sections || []).flatMap(section => section.fields || [])];
  fields.forEach(field => {
    if (field.required && (values[field.key] === undefined || values[field.key] === null || String(values[field.key]).trim() === '')) errors[field.key] = field.validation?.required || `${field.label} is required`;
    if (field.validation?.custom) { const result = field.validation.custom(values[field.key], values); if (result) errors[field.key] = result; }
  });
  return errors;
}

export function calculateItemSubtotal(item, config = {}) {
  if (config.calculations?.calculateItem) return config.calculations.calculateItem(item);
  return Number(item.quantity || 0) * Number(item.price ?? item.unitPrice ?? 0);
}

export function calculateSubtotal(items, config) {
  if (config?.calculations?.calculateSubtotal) return config.calculations.calculateSubtotal(items);
  return items.reduce((total, item) => total + calculateItemSubtotal(item, config), 0);
}
