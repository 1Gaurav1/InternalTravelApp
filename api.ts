
import { TravelRequest, User, RequestStatus } from './types';

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
// Add this inside the api = { ... } object in api.ts

  login: async (email: string, password: string): Promise<User> => {
    // In the final backend step, we will create a specific '/login' route.
    // For now, this uses your existing GET /users to find a match (Transition Step).
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
     // This uses your existing POST /users route
     const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...user,
            id: crypto.randomUUID(), // Temp ID generation until backend handles it
            role: 'EMPLOYEE', // Default role
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


