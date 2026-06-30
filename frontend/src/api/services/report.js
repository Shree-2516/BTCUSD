import { apiClient } from '../client.js';

export const reportService = {
  getReports: () => {
    return apiClient.get('/api/reports');
  },

  getLiveReport: () => {
    return apiClient.get('/api/live/report');
  },

  getReportDetails: (id) => {
    return apiClient.get(`/api/reports/${id}`);
  },

  deleteReport: (id) => {
    return apiClient.delete(`/api/reports/${id}`);
  },

  saveReport: (reportData) => {
    return apiClient.post('/api/reports/save', { report_data: reportData });
  },

  /**
   * Export report using native browser download rather than XHR/fetch
   * because it returns a file stream.
   */
  exportReportUrl: (id, format) => {
    return `/api/reports/${id}/export/${format}`;
  }
};
