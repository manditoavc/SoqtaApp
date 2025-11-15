export type UserRole = 'admin' | 'employee';
export type WorkArea = 'cashier' | 'kitchen' | 'grill';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  workArea?: WorkArea;
  createdAt: Date;
}

export type AttendanceType = 'check-in' | 'check-out';

export interface CheckInRecord {
  id: string;
  userId: string;
  username: string;
  timestamp: Date;
  type: AttendanceType;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface PurchaseRecord {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  date: Date;
  addedBy: string;
}
