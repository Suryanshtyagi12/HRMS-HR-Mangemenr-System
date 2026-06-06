import { create } from 'zustand';

interface PayrollState {
  selectedRun: any | null;
  selectedPayslip: any | null;
  filters: { month: number; year: number; status?: string };
  summary: any | null;
  loading: boolean;
  
  setSelectedRun: (run: any | null) => void;
  setSelectedPayslip: (payslip: any | null) => void;
  setFilters: (filters: any) => void;
  setLoading: (loading: boolean) => void;
  setSummary: (summary: any | null) => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  selectedRun: null,
  selectedPayslip: null,
  filters: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
  summary: null,
  loading: false,

  setSelectedRun: (run) => set({ selectedRun: run }),
  setSelectedPayslip: (payslip) => set({ selectedPayslip: payslip }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setLoading: (loading) => set({ loading }),
  setSummary: (summary) => set({ summary }),
}));
