import { TravelRequest, User, RequestStatus, CostBreakdown } from './types';

const API_URL = 'https://internaltravelapp.onrender.com/api';

// Helper to handle response errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

export const api = {
  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/users`);
    return handleResponse(res);
  },

  async getStats() {
    const res = await fetch(`${API_URL}/stats`);
    return handleResponse(res);
  },

  login: async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error('Failed to connect to server');
    
    const users: User[] = await res.json();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) throw new Error('Account not found');
    if (user.password !== password) throw new Error('Incorrect password');
    if (user.status === 'Suspended') throw new Error('Account suspended');

    return user;
  },

  signup: async (user: Partial<User>): Promise<User> => {
     const res = await fetch(`${API_URL}/users`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
           ...user,
           id: crypto.randomUUID(), 
           role: 'EMPLOYEE',
           status: 'Active',
           lastActive: 'Just now',
           avatar: `https://ui-avatars.com/api/?name=${user.name}&background=random`
       }),
     });
     if (!res.ok) throw new Error('Failed to create account');
     return res.json();
  },

  createUser: async (user: User): Promise<User> => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return handleResponse(res);
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  deleteUser: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // --- REQUESTS ---
  getRequests: async (): Promise<TravelRequest[]> => {
    const res = await fetch(`${API_URL}/requests`);
    return handleResponse(res);
  },

  sendAgentOptions: async (id: string, options: string[]) => {
    const res = await fetch(`${API_URL}/requests/${id}/options`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options })
    });
    return res.json();
  },

  createRequest: async (request: TravelRequest): Promise<TravelRequest> => {
    const res = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(res);
  },

  // --- UPDATED FUNCTION ---
  updateRequestStatus: async (
    id: string, 
    status: RequestStatus, 
    agentNotes?: string, 
    bookingDetails?: CostBreakdown, // New Param
    amount?: number // New Param (Total Cost)
  ): Promise<TravelRequest> => {
    
    // We send a merged object. The backend should handle partial updates.
    const payload: any = { status, agentNotes };
    
    if (bookingDetails) payload.bookingDetails = bookingDetails;
    if (amount) payload.amount = amount;

    const res = await fetch(`${API_URL}/requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  deleteRequest: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/requests/${id}`, {
      method: 'DELETE',
    }); 
    return handleResponse(res);
  },
};