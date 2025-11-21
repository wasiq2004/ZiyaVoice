export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
};

export const fetchCampaigns = async (userId: string) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const createCampaign = async (userId: string, name: string) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchCampaign = async (id: string, userId: string) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns/${id}?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const setCallerPhone = async (id: string, userId: string, callerPhone: string) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns/${id}/set-caller-phone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, callerPhone })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const importRecords = async (id: string, userId: string, csvData: any[]) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns/${id}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, csvData })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const addRecord = async (id: string, userId: string, phone: string) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns/${id}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, phone })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const deleteRecord = async (campaignId: string, recordId: string, userId: string) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns/${campaignId}/records/${recordId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const startCampaign = async (id: string, userId: string) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns/${id}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const stopCampaign = async (id: string, userId: string) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns/${id}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchRecords = async (id: string, page: number = 1, limit: number = 20) => {
  const response = await fetch(`${getApiBaseUrl()}/campaigns/${id}/records?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};