import apiClient from './client';

/**
 * API client for Dynamic Document Flow Configuration and Transitions.
 */
export const documentFlowApi = {
  /**
   * Get dynamic tabs configuration for a module and authenticated company.
   * @param {string} module - SALES, PURCHASE, INVENTORY, EXPENSES, ACCOUNT
   * @param {string} [companyId] - Optional explicit companyId override
   */
  async getTabs(module, companyId) {
    const params = { module };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get('/api/v1/workflow/document-flows/tabs', { params });
    return response.data?.data || response.data;
  },

  /**
   * Get allowed document transitions from a source document.
   * @param {string} module - SALES, PURCHASE, INVENTORY, etc.
   * @param {string} sourceDocumentType - QUOTATION, SALES_ORDER, etc.
   * @param {string} [companyId] - Optional companyId override
   */
  async getTransitions(module, sourceDocumentType, companyId) {
    const params = { module, sourceDocumentType };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get('/api/v1/workflow/document-flows/transitions', { params });
    return response.data?.data || response.data || [];
  },

  /**
   * Get complete document flow configuration for a company and module.
   */
  async getFlowConfig(module, companyId) {
    const params = { module };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get('/api/v1/workflow/document-flows', { params });
    return response.data?.data || response.data;
  },

  /**
   * Save or update company-specific document flow configuration.
   */
  async saveFlowConfig(flowConfig) {
    const response = await apiClient.post('/api/v1/workflow/document-flows', flowConfig);
    return response.data?.data || response.data;
  },

  /**
   * Get all registered document types and capabilities from registry.
   */
  async getDocumentTypes(module) {
    const params = module ? { module } : {};
    const response = await apiClient.get('/api/v1/workflow/document-types', { params });
    return response.data?.data || response.data || [];
  },

  /**
   * Get workflow UI state and permitted actions for a document.
   */
  async getDocumentWorkflowUi(documentType, documentId, companyId) {
    const params = { documentType, documentId };
    if (companyId) params.companyId = companyId;
    const response = await apiClient.get('/api/v1/workflow/transactions/document/ui', { params });
    return response.data?.data || response.data;
  }
};

export default documentFlowApi;
