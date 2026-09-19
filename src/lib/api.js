import { getDeviceFingerprint } from './deviceFingerprint';
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://laikipia-backend.onrender.com/api' : 'http://127.0.0.1:8000/api');
const API_URL = API_BASE_URL;

async function request(endpoint, { body, headers = {}, ...customConfig } = {}) {
  const token = localStorage.getItem('dcp_token');
  const finalHeaders = { ...headers };
  
  if (!(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  
  if (token) {
    finalHeaders['Authorization'] = `Token ${token}`;
  }
  try {
    const fp = await getDeviceFingerprint();
    if (fp) finalHeaders['X-Device-Fingerprint'] = fp;
  } catch (_) {}

  const config = {
    method: body ? (customConfig.method || 'POST') : (customConfig.method || 'GET'),
    ...customConfig,
    headers: finalHeaders,
  };

  if (body && !(body instanceof FormData)) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  } else if (body instanceof FormData) {
    config.body = body;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Auto-logout if token is invalid or user deactivated
    if (response.status === 401 || (response.status === 404 && endpoint.includes('members/me'))) {
      localStorage.removeItem('dcp_token');
      localStorage.removeItem('dcp_user');
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = await response.json();

    if (!response.ok) {
      const errMsg = typeof data.error === 'string' ? data.error : (data.detail || (typeof Object.values(data)[0] === 'string' ? Object.values(data)[0] : 'Something went wrong'));
      return { data: null, error: errMsg, errorData: data, status: response.status };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || 'Network connection failed' };
  }
}

export const api = {
  // ─── AUTH & IDENTITY ───────────────────────────────────────────────────────
  login: (credentials, nationalId) => {
    const payload = typeof credentials === 'object' ? credentials : { firstName: credentials, nationalId };
    return request('/login', { method: 'POST', body: payload });
  },
  
  register: (userData, inviteToken) => {
    const payload = { ...userData };
    if (inviteToken) payload.invite_token = inviteToken;
    return request('/register', { method: 'POST', body: payload });
  },

  getMe: () => 
    request('/members/me'),

  // ─── PUBLIC LOOKUPS ────────────────────────────────────────────────────────
  getPublicMember: (id) => 
    request(`/members/${id}/public`),
  getMemberPublic: (id) => 
    request(`/members/${id}/public`),

  // ─── MEMBERS & HIERARCHY ───────────────────────────────────────────────────
  downloadMembersCsv: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('dcp_token');
    const url = `${API_BASE_URL}/members/export-csv${query ? `?${query}` : ''}`;
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Export failed: ${res.statusText}`);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;

    const cd = res.headers.get('content-disposition');
    let filename = '';
    if (cd) {
      const match = cd.match(/filename="?([^";]+)"?/i);
      if (match) filename = match[1];
    }
    if (!filename) {
      const channelSuffix = params.source && params.source !== 'all' 
        ? `_${params.source.toLowerCase()}` 
        : (params.is_digital === 'true' ? '_all_channels' : '');
      const wardSuffix = params.ward && params.ward !== 'all' 
        ? `_${params.ward.toLowerCase().replace(/\s+/g, '_')}` 
        : '_all_wards';
      filename = `dcp_recruits_call_sms${channelSuffix}${wardSuffix}_${new Date().toISOString().split('T')[0]}.csv`;
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  getMembers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/members${query ? `?${query}` : ''}`);
  },

  getMemberDetail: (id) => 
    request(`/members/${id}`),

  getMemberInsights: (id) => 
    request(`/members/${id}/insights`),
  getInsights: (id) => 
    request(`/members/${id}/insights`),

  getTargets: (id) =>
    request(`/members/${id}/targets`),

  toggleMemberActive: (id) => 
    request(`/members/${id}/toggle-active/`, { method: 'POST' }),

  toggleMemberOptOut: (id) => 
    request(`/members/${id}/toggle-opt-out/`, { method: 'POST' }),

  updateMember: (id, data) =>
    request(`/members/${id}`, { method: 'PATCH', body: data }),
  updateMemberRole: (id, data) =>
    request(`/members/${id}`, { method: 'PATCH', body: data }),

  createInvite: (data) => 
    request('/invites', { method: 'POST', body: data }),

  getInvite: (id) => 
    request(`/invites/${id}`),

  // ─── STATS & ANALYTICS ─────────────────────────────────────────────────────
  getStats: () => 
    request('/stats'),

  getReportStats: () =>
    request('/stats/reports'),

  getWardHealthInsights: () =>
    request('/stats/ward-health'),

  getDemographicInsights: () =>
    request('/stats/demographics'),

  getFraudAlerts: () =>
    request('/stats/fraud-alerts'),

  getSaturation: () =>
    request('/stats/saturation'),

  getPollingCoverage: () => 
    request('/polling-coverage'),

  getLeaderboard: () => 
    request('/leaderboard'),

  // ─── VOTER REGISTRY ────────────────────────────────────────────────────────
  getVoterRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/voter-records${query ? `?${query}` : ''}`);
  },

  searchVoters: (query) => 
    request(`/voter-lookup?q=${encodeURIComponent(query)}`),
  lookupVoter: (query) => 
    request(`/voter-lookup?q=${encodeURIComponent(query)}`),

  // ─── GOTV STRIKE-OFF ───────────────────────────────────────────────────────
  getGotvList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/gotv${query ? `?${query}` : ''}`);
  },

  markGotvVoted: (id) => 
    request(`/gotv/${id}/voted`, { method: 'POST' }),
  markVoted: (id) => 
    request(`/gotv/${id}/voted`, { method: 'POST' }),

  // ─── PANNA PRAMUKH (CANVASS) ───────────────────────────────────────────────
  getCanvassList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/canvass${query ? `?${query}` : ''}`);
  },
  getCanvass: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/canvass${query ? `?${query}` : ''}`);
  },
  createCanvass: (data) => 
    request('/canvass', { method: 'POST', body: data }),
  toggleCanvassComplete: (id) => 
    request(`/canvass/${id}`, { method: 'PATCH' }),
  toggleCanvass: (id) => 
    request(`/canvass/${id}`, { method: 'PATCH' }),
  deleteCanvass: (id) => 
    request(`/canvass/${id}`, { method: 'DELETE' }),

  // ─── BODA-BODA TRANSPORT LOGISTICS ─────────────────────────────────────────
  getTransportList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transport${query ? `?${query}` : ''}`);
  },
  getTransport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transport${query ? `?${query}` : ''}`);
  },
  createTransport: (data) => 
    request('/transport', { method: 'POST', body: data }),
  requestTransport: (data) => 
    request('/transport', { method: 'POST', body: data }),
  updateTransportStatus: (id, status) => 
    request(`/transport/${id}`, { method: 'PATCH', body: { status } }),
  updateTransport: (id, data) => 
    request(`/transport/${id}`, { method: 'PATCH', body: typeof data === 'string' ? { status: data } : data }),

  // ─── POLLING AGENTS ────────────────────────────────────────────────────────
  getAgents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/agents${query ? `?${query}` : ''}`);
  },
  createAgent: (data) => 
    request('/agents', { method: 'POST', body: data }),
  assignAgent: (data) => 
    request('/agents', { method: 'POST', body: data }),
  checkinAgent: (id, data = {}) => 
    request(`/agents/${id}/checkin`, { method: 'POST', body: data }),
  checkInAgent: (id, data = {}) => 
    request(`/agents/${id}/checkin`, { method: 'POST', body: data }),

  // ─── PVT FORM 34A TALLIES ──────────────────────────────────────────────────
  getTallies: () => 
    request('/tally'),
  submitTally: (data) => 
    request('/tally', { method: 'POST', body: data }),

  // ─── BULK SMS EXPORT ───────────────────────────────────────────────────────
  exportSms: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sms-export${query ? `?${query}` : ''}`);
  },
  getSmsRecipients: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sms-export${query ? `?${query}` : ''}`);
  },

  // ─── RELATIONAL CONTACT MATCHER ────────────────────────────────────────────
  matchContacts: (phones) => 
    request('/contact-matcher', { method: 'POST', body: { phones } }),
  searchContacts: (phones) => 
    request('/contact-matcher', { method: 'POST', body: { phones } }),

  // ─── USHAHIDI INCIDENT RESPONSE ────────────────────────────────────────────
  getIncidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/incidents${query ? `?${query}` : ''}`);
  },
  createIncident: (data) => 
    request('/incidents', { method: 'POST', body: data }),
  reportIncident: (data) => 
    request('/incidents', { method: 'POST', body: data }),
  resolveIncident: (id, resolution_notes) => 
    request(`/incidents/${id}`, { method: 'PATCH', body: { resolution_notes } }),
  updateIncidentStatus: (id, resolution_notes) => 
    request(`/incidents/${id}`, { method: 'PATCH', body: { resolution_notes } }),

  // ─── VIRTUAL PHONE BANK ────────────────────────────────────────────────────
  getPhoneBankQueue: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/phone-bank/queue${query ? `?${query}` : ''}`);
  },
  getPhoneBankTarget: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/phone-bank/queue${query ? `?${query}` : ''}`);
  },
  submitCallRecord: (data) => 
    request('/phone-bank/call', { method: 'POST', body: data }),
  logCall: (data) => 
    request('/phone-bank/call', { method: 'POST', body: data }),

  // ─── EVENTS & RALLIES ──────────────────────────────────────────────────────
  getEvents: () => 
    request('/events'),
  createEvent: (data) => 
    request('/events', { method: 'POST', body: data }),
  getEventAttendance: (eventId) => 
    request(`/events/${eventId}/attendance`),
  checkInMember: (eventId, memberId) => 
    request(`/events/${eventId}/attendance`, { method: 'POST', body: { member_id: memberId } }),

  // ─── GOVERNOR CAMPAIGN DIARY & CHAMA FUNCTIONS ─────────────────────────────
  getFunctions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/functions${query ? `?${query}` : ''}`);
  },
  createFunction: (data) => 
    request('/functions', { method: 'POST', body: data }),
  updateFunction: (id, data) => 
    request(`/functions/${id}`, { method: 'PATCH', body: data }),
  deleteFunction: (id) => 
    request(`/functions/${id}`, { method: 'DELETE' }),

  // ─── EMERGENCY BROADCASTS ──────────────────────────────────────────────────
  getBroadcast: () => 
    request('/broadcasts'),
  adminCreateBroadcast: (data) => 
    request('/broadcasts', { method: 'POST', body: data }),
  adminClearBroadcast: () => 
    request('/broadcasts', { method: 'DELETE' }),

  getWardsAndStations: () => 
    request('/wards-and-stations'),
    
  // ─── SECURITY OPERATIONS ───────────────────────────────────────────────────
  getSecurityLogs: () => 
    request('/security-logs'),
  submitSecurityLog: (data) => 
    request('/security-logs', { method: 'POST', body: data }),
  resolveSecurityLog: (id, resolution_action) => 
    request(`/security-logs/${id}`, { method: 'PATCH', body: { resolution_action } }),
  getSecurityPersonnel: () => 
    request('/security-personnel'),
  getSecurityMIA: () => 
    request('/security-mia'),
  // ─── CAMPAIGN CONFIG & SOCIAL MEDIA RECRUITMENT ─────────────────────────
  getCampaignConfig: () =>
    request('/config'),
  updateCampaignConfig: (key, value) =>
    request('/config', { method: 'POST', body: { key, value } }),
  claimSocialRecruit: ({ national_id, phone }) =>
    request('/members/claim-social', { method: 'POST', body: { national_id, phone } }),
  checkMemberStatus: ({ national_id, phone }) =>
    request('/members/check-status', { method: 'POST', body: { national_id, phone } }),
};
