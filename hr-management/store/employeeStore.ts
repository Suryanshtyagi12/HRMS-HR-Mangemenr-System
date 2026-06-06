import { create } from 'zustand';

interface EmployeeState {
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (dept: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  employmentTypeFilter: string;
  setEmploymentTypeFilter: (type: string) => void;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  resetFilters: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  viewMode: 'table',
  setViewMode: (mode) => set({ viewMode: mode }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  departmentFilter: 'ALL',
  setDepartmentFilter: (dept) => set({ departmentFilter: dept }),
  statusFilter: 'ALL',
  setStatusFilter: (status) => set({ statusFilter: status }),
  employmentTypeFilter: 'ALL',
  setEmploymentTypeFilter: (type) => set({ employmentTypeFilter: type }),
  selectedEmployeeId: null,
  setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id }),
  resetFilters: () => set({ 
    searchQuery: '', 
    departmentFilter: 'ALL', 
    statusFilter: 'ALL',
    employmentTypeFilter: 'ALL'
  }),
}));
