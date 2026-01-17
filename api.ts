
import { TravelRequest, User, RequestStatus } from './types';

const API_URL = 'http://localhost:5000/api';

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
  return await res.json();
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

  updateRequestStatus: async (id: string, status: RequestStatus, agentNotes?: string): Promise<TravelRequest> => {
    const res = await fetch(`${API_URL}/requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, agentNotes }),
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
