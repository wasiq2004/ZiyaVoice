const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'billing';
}

export interface UserListItem {
  id: string;
  email: string;
  username: string;
  created_at: string;
  elevenlabs_usage: number;
  gemini_usage: number;
  deepgram_usage: number;
}

export interface ServiceLimit {
  service_name: 'elevenlabs' | 'gemini' | 'deepgram';
  monthly_limit: number | null;
  daily_limit: number | null;
  is_enabled: boolean;
}

export interface ServiceUsage {
  service_name: string;
  total_usage: number;
}

export interface BillingRecord {
  id: string;
  user_id: string;
  billing_period_start: string;
  billing_period_end: string;
  elevenlabs_usage: number;
  gemini_usage: number;
  deepgram_usage: number;
  platform_fee: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  pendingBilling: number;
  serviceUsage: {
    service_name: string;
    user_count: number;
    total_usage: number;
  }[];
}

// Admin Authentication
export const adminLogin = async (email: string, password: string): Promise<Admin> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  return data.admin;
};

// Get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  const data = await response.json();
  return data.stats;
};

// Get all users with pagination
export const getUsers = async (page: number = 1, limit: number = 50, search: string = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search
  });

  const response = await fetch(`${API_BASE_URL}/api/admin/users?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  const data = await response.json();
  return {
    users: data.users as UserListItem[],
    pagination: data.pagination
  };
};

// Get user details
export const getUserDetails = async (userId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }

  const data = await response.json();
  return {
    user: data.user,
    limits: data.limits as ServiceLimit[],
    usage: data.usage as ServiceUsage[],
    billing: data.billing as BillingRecord[]
  };
};

// Set service limit
export const setServiceLimit = async (
  userId: string,
  serviceName: string,
  monthlyLimit: number | null,
  dailyLimit: number | null,
  isEnabled: boolean,
  adminId: string
) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/limits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceName,
      monthlyLimit,
      dailyLimit,
      isEnabled,
      adminId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to set service limit');
  }

  return response.json();
};

// Get service limits
export const getServiceLimits = async (userId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/limits`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch service limits');
  }

  const data = await response.json();
  return data.limits;
};

// Create billing record
export const createBillingRecord = async (
  userId: string,
  periodStart: string,
  periodEnd: string,
  usageData: {
    elevenlabs?: number;
    gemini?: number;
    deepgram?: number;
  },
  platformFee: number,
  adminId: string
) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/billing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      periodStart,
      periodEnd,
      usageData,
      platformFee,
      adminId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create billing record');
  }

  return response.json();
};

// Update billing status
export const updateBillingStatus = async (
  billingId: string,
  status: string,
  notes: string,
  adminId: string
) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/billing/${billingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      notes,
      adminId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update billing status');
  }

  return response.json();
};
