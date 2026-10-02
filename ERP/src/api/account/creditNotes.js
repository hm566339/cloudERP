import { accountHttpClient } from '../common/client';

export const creditNotesApi = {
  /**
   * Fetch credit notes list with pagination and filters
   * GET /api/account/credit-notes
   */
  getCreditNotes: async (params) => {
    const response = await accountHttpClient.get('/api/account/credit-notes', { params });
    return response.data;
  },

  /**
   * Get full credit note profile by ID
   * GET /api/account/credit-notes/{creditNoteId}
   */
  getCreditNoteById: async (id) => {
    const response = await accountHttpClient.get(`/api/account/credit-notes/${id}`);
    return response.data;
  },

  /**
   * Create a new credit note
   * POST /api/account/credit-notes
   * Request body wrapped in RequestWrapper: { data: CreditNoteRequest }
   */
  createCreditNote: async (payload, config = {}) => {
    const requestData = payload && typeof payload === 'object' && 'data' in payload ? payload : { data: payload };
    const response = await accountHttpClient.post('/api/account/credit-notes', requestData, config);
    return response.data;
  },

  /**
   * Update an existing DRAFT credit note
   * PUT /api/account/credit-notes/{creditNoteId}
   * Request body wrapped in RequestWrapper: { data: CreditNoteRequest }
   */
  updateCreditNote: async (args, config = {}) => {
    const id = typeof args === 'object' ? args.id : arguments[0];
    const rawData = typeof args === 'object' ? (args.data || args.payload || args) : arguments[1];
    const { id: _, ...cleanData } = rawData;
    const requestData = 'data' in rawData ? rawData : { data: cleanData };
    const response = await accountHttpClient.put(`/api/account/credit-notes/${id}`, requestData, config);
    return response.data;
  },

  /**
   * Delete a DRAFT credit note
   * DELETE /api/account/credit-notes/{creditNoteId}
   */
  deleteCreditNote: async (id) => {
    const response = await accountHttpClient.delete(`/api/account/credit-notes/${id}`);
    return response.data;
  },

  /**
   * Submit a DRAFT credit note for approval
   * POST /api/account/credit-notes/{creditNoteId}/submit
   */
  submitCreditNote: async (id) => {
    const response = await accountHttpClient.post(`/api/account/credit-notes/${id}/submit`);
    return response.data;
  },

  /**
   * Approve a SUBMITTED credit note
   * POST /api/account/credit-notes/{creditNoteId}/approve
   */
  approveCreditNote: async (id) => {
    const response = await accountHttpClient.post(`/api/account/credit-notes/${id}/approve`);
    return response.data;
  },

  /**
   * Reject a SUBMITTED credit note
   * POST /api/account/credit-notes/{creditNoteId}/reject
   */
  rejectCreditNote: async (id) => {
    const response = await accountHttpClient.post(`/api/account/credit-notes/${id}/reject`);
    return response.data;
  },

  /**
   * Post an APPROVED credit note to General Ledger
   * POST /api/account/credit-notes/{creditNoteId}/post
   */
  postCreditNote: async (id) => {
    const response = await accountHttpClient.post(`/api/account/credit-notes/${id}/post`);
    return response.data;
  },

  /**
   * Reverse a POSTED credit note
   * POST /api/account/credit-notes/{creditNoteId}/reverse
   */
  reverseCreditNote: async (id) => {
    const response = await accountHttpClient.post(`/api/account/credit-notes/${id}/reverse`);
    return response.data;
  },

  /**
   * Cancel a DRAFT or REVERSED credit note
   * POST /api/account/credit-notes/{creditNoteId}/cancel
   */
  cancelCreditNote: async (id) => {
    const response = await accountHttpClient.post(`/api/account/credit-notes/${id}/cancel`);
    return response.data;
  },

  // Backward compatibility & convenience aliases
  getById: (id) => creditNotesApi.getCreditNoteById(id),
  create: (payload) => creditNotesApi.createCreditNote(payload),
  update: (args) => creditNotesApi.updateCreditNote(args),
  delete: (id) => creditNotesApi.deleteCreditNote(id),
  submit: (id) => creditNotesApi.submitCreditNote(id),
  approve: (id) => creditNotesApi.approveCreditNote(id),
  reject: (id) => creditNotesApi.rejectCreditNote(id),
  post: (id) => creditNotesApi.postCreditNote(id),
  reverse: (id) => creditNotesApi.reverseCreditNote(id),
  cancel: (id) => creditNotesApi.cancelCreditNote(id)
};

export default creditNotesApi;
