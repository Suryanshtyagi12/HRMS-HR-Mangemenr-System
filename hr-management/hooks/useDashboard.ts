import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/admin");
      return data;
    },
  });
}

export function useManagerDashboard() {
  return useQuery({
    queryKey: ["managerDashboard"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/manager");
      return data;
    },
  });
}

export function useHRDashboard() {
  return useQuery({
    queryKey: ["hrDashboard"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/hr");
      return data;
    },
  });
}

export function useEmployeeDashboard(id: string) {
  return useQuery({
    queryKey: ["employeeDashboard", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/dashboard/employee/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
