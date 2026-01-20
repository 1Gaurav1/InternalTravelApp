// types.ts

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  TRAVEL_AGENT = 'TRAVEL_AGENT'
}

export enum ViewState {
  LOGIN = 'LOGIN',
  EMPLOYEE_DASHBOARD = 'EMPLOYEE_DASHBOARD',
  MANAGER_DASHBOARD = 'MANAGER_DASHBOARD',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  SUPER_ADMIN_DASHBOARD = 'SUPER_ADMIN_DASHBOARD', 
  TRAVEL_AGENT_DASHBOARD = 'TRAVEL_AGENT_DASHBOARD',
  CREATE_REQUEST = 'CREATE_REQUEST',
  REQUEST_DETAILS = 'REQUEST_DETAILS',
  APPROVAL_LIST = 'APPROVAL_LIST',
  ADMIN_REPORTS = 'ADMIN_REPORTS',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  MY_REQUESTS = 'MY_REQUESTS',
  SHARE_OPTIONS = 'SHARE_OPTIONS'
}

// Status for Travel Requests (Trip Progress)
export type RequestStatus = 
  | 'Pending Manager' 
  | 'Pending Admin' 
  | 'Processing (Agent)' 
  | 'Action Required' 
  | 'Booked' 
  | 'Rejected';

// Status for Users (Account Status)
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface TravelRequest {
  id?: string; 
  destination: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  status: RequestStatus; // Use RequestStatus here
  amount: number;
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  type: 'Domestic' | 'International';
  submittedDate: string;
  purpose?: string;
  agentNotes?: string;
  preferredFlight?: string;
  
  flightOptions?: FlightOption[];
  selectedOptionId?: string;
}

export interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  isSelected?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string[]; 
  department: string;
  status: UserStatus; // Use UserStatus here (Active/Inactive/Suspended)
  lastActive?: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}