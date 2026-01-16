
export enum ViewState {
  LOGIN = 'LOGIN',
  EMPLOYEE_DASHBOARD = 'EMPLOYEE_DASHBOARD',
  CREATE_REQUEST = 'CREATE_REQUEST',
  MY_REQUESTS = 'MY_REQUESTS',
  MANAGER_DASHBOARD = 'MANAGER_DASHBOARD',
  APPROVAL_LIST = 'APPROVAL_LIST',
  REQUEST_DETAILS = 'REQUEST_DETAILS',
  SHARE_OPTIONS = 'SHARE_OPTIONS',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_REPORTS = 'ADMIN_REPORTS',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  TRAVEL_AGENT_DASHBOARD = 'TRAVEL_AGENT_DASHBOARD',
}

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  TRAVEL_AGENT = 'TRAVEL_AGENT',
}

export type RequestStatus = 
  | 'Pending Manager' 
  | 'Pending Admin' 
  | 'Processing (Agent)' 
  | 'Action Required' 
  | 'Booked' 
  | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For prototype auth
  role: UserRole;
  department: string;
  status: 'Active' | 'Suspended';
  lastActive: string;
  avatar: string;
}

export interface TravelRequest {
  id?: string;
  destination: string;
  startDate: string;
  endDate: string;
  startTime: string; 
  endTime: string;   
  status: RequestStatus;
  amount: number; 
  policyViolations?: string[];
  employeeName: string;
  preferredFlight?: string;
  employeeAvatar?: string;
  department: string;
  type: 'Domestic' | 'International';
  purpose?: string;
  submittedDate: string;
  agentNotes?: string; // New field for agent options
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  logo: string;
}

export interface HotelOption {
  id: string;
  name: string;
  address: string;
  rating: number;
  pricePerNight: number;
  image: string;
}
