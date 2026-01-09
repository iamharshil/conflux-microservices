export interface User {
  id: string;
  email: string;
  businessId: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  name: string;
  domain?: string;
  timezone: string;
  settings: BusinessSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  duration: number; // minutes
  price?: number;
  description?: string;
  bufferTime: number; // minutes between appointments
  maxAdvanceBooking: number; // days
  cancellationPolicy: CancellationPolicy;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  timezone: string;
  workingHours: WorkingHours;
  services: string[]; // service IDs
  calendarIntegrations: CalendarIntegration[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Availability {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isAvailable: boolean;
  appointmentId?: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  timezone: string;
  preferences: CustomerPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  businessId: string;
  customerId: string;
  appointmentId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  content: string;
  scheduledAt?: Date;
  sentAt?: Date;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Enums
export enum Role {
  ADMIN = 'admin',
  STAFF = 'staff',
  CUSTOMER = 'customer'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

export enum NotificationType {
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_FAILED = 'payment_failed'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

// Supporting Types
export interface BusinessSettings {
  timezone: string;
  currency: string;
  appointmentReminders: {
    enabled: boolean;
    hoursBefore: number[];
  };
  cancellations: {
    allowed: boolean;
    minHoursBefore: number;
    refundPolicy: string;
  };
  payments: {
    required: boolean;
    providers: string[];
  };
}

export interface CancellationPolicy {
  allowed: boolean;
  minHoursBefore: number;
  refundPolicy: 'full' | 'partial' | 'none';
  refundPercentage?: number;
}

export interface WorkingHours {
  [key: string]: TimeSlot[]; // monday, tuesday, etc.
}

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'apple';
  connected: boolean;
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
  lastSyncAt?: Date;
}

export interface CustomerPreferences {
  timezone: string;
  preferredCommunication: NotificationChannel[];
  language: string;
  reminders: {
    enabled: boolean;
    hoursBefore: number[];
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface CreateAppointmentRequest {
  serviceId: string;
  staffId: string;
  customerId: string;
  startTime: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  startTime?: Date;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  businessName: string;
  timezone: string;
}

// JWT Token Types
export interface JwtPayload {
  userId: string;
  businessId: string;
  email: string;
  roles: Role[];
  iat: number;
  exp: number;
}