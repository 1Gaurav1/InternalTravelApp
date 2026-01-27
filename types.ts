// src/types.ts

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

// --- BOOKING DETAILS STRUCTURES (Updated for Agent Dashboard) ---

export interface FlightBookingDetails {
  from: string;        // Auto-populated & Locked
  to: string;          // Auto-populated & Locked
  mode?: 'Flight' | 'Train'; // <--- ADDED: Support for Train toggle
  airline: string;     // Can hold "Indigo" or "Rajdhani Express"
  flightNumber: string; // Can hold Flight No or Train No
  departureTime: string; 
  arrivalTime: string;
  cost: number;
  agentFee: number;
  ticketFile?: string; // Stores filename of uploaded PDF
}

export interface HotelBookingDetails {
  city: string;        // Auto-populated & Locked
  hotelName: string;
  checkIn: string;
  checkOut: string;
  cost: number;
  agentFee: number;
  bookingStatus: 'Confirmed' | 'Book Later' | 'Pending';
  bookingFile?: string; // Upload Hotel Voucher PDF
  location?: string;
}

export interface CabBookingDetails {
  required: boolean;
  cost: number;
  agentFee: number;
  remarks?: string;
}

export interface OtherCostDetails {
  cost: number;
  agentFee: number;
  description?: string;
}

export interface CostBreakdown {
  flights: FlightBookingDetails[]; // Matches 'segments' from the form
  hotels: HotelBookingDetails[];
  cab: CabBookingDetails;
  other: OtherCostDetails;
  totalAmount: number; // Sum of all costs + agent fees
  
  // Optional alias if needed for specific reports, 
  // essentially the same as 'flights' above
  flightCosts?: FlightBookingDetails[]; 
}

// --- MAIN REQUEST INTERFACE ---

export interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  isSelected?: boolean;
}

export interface TravelRequest {
  id: string; 
  destination: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  status: RequestStatus; 
  amount: number; // Total Trip Cost
  
  // Employee Details
  employeeName: string;
  employeeAvatar?: string;
  department: string;
  branch?: string;      // <--- ADDED for Admin reporting
  type: 'Domestic' | 'International';
  submittedDate: string;
  
  // User Inputs
  purpose?: string;
  preferredFlight?: string; // "Special Instructions"
  
  // Workflow Data
  managerName?: string;     // <--- ADDED to track who approved
  rejectionReason?: string; // <--- ADDED for rejection modal
  agentNotes?: string;      // Stores Origin, Chat history, etc.
  
  // Agent Data
  agentOptions?: string[]; // Legacy text options
  flightOptions?: FlightOption[]; // Structured options (if used)
  selectedOptionId?: string;
  
  // Final Booking
  bookingDetails?: CostBreakdown;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string[]; 
  department: string;
  branch?: string; // <--- ADDED
  status: UserStatus;
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