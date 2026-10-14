import { ENUMS_REGISTRY, getEnumOptions, getEnumMeta } from '../metadata/enumsRegistry.js';

/**
 * Unified Enum Service
 * Exposes access to all backend enums with dynamic metadata (label, color, className)
 */
class EnumService {
  /**
   * Get all options for a given enum key
   * @param {string} enumKey
   * @returns {Array<{value: string, label: string, color: string, className: string}>}
   */
  getOptions(enumKey) {
    return getEnumOptions(enumKey);
  }

  /**
   * Get metadata for a specific enum value
   * @param {string} enumKey
   * @param {string} value
   * @returns {{value: string, label: string, color: string, className: string}}
   */
  getMeta(enumKey, value) {
    return getEnumMeta(enumKey, value);
  }

  /**
   * Check if an enum definition exists
   * @param {string} enumKey
   * @returns {boolean}
   */
  hasEnum(enumKey) {
    return Boolean(ENUMS_REGISTRY[enumKey]);
  }

  /**
   * Get raw values for an enum
   * @param {string} enumKey
   * @returns {string[]}
   */
  getValues(enumKey) {
    const entry = ENUMS_REGISTRY[enumKey];
    return entry ? entry.values : [];
  }
}

export const enumService = new EnumService();
export default enumService;
