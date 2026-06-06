import { create } from 'zustand';

interface LeaveState {
  selectedRequest: any | null;
  leaveBalances: any | null;
  leaveCalendar: any[];
  filters: { status?: string; leaveType?: string; month?: number; year?: number };
  loading: boolean;
  
  setSelectedRequest: (request: any | null) => void;
  setLeaveBalances: (balances: any | null) => void;
  setLeaveCalendar: (calendar: any[]) => void;
  setFilters: (filters: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useLeaveStore = create<LeaveState>((set) => ({
  selectedRequest: null,
  leaveBalances: null,
  leaveCalendar: [],
  filters: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
  loading: false,

  setSelectedRequest: (request) => set({ selectedRequest: request }),
  setLeaveBalances: (balances) => set({ leaveBalances: balances }),
  setLeaveCalendar: (calendar) => set({ leaveCalendar: calendar }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setLoading: (loading) => set({ loading }),
}));
