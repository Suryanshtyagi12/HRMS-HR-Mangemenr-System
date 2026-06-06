import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useLeaveBalance(employeeId: string) {
  return useQuery({
    queryKey: ["leaveBalance", employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data } = await api.get(`/leave/balance/${employeeId}`);
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useLeaveRequests(filters = {}) {
  return useQuery({
    queryKey: ["leaveRequests", filters],
    queryFn: async () => {
      const { data } = await api.get("/leave/requests", { params: filters });
      return data;
    },
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/leave/apply", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: string; comment?: string }) => {
      const { data } = await api.put(`/leave/requests/${id}`, { status, comment });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
    },
  });
}

export function useLeaveCalendar(filters = {}) {
  return useQuery({
    queryKey: ["leaveCalendar", filters],
    queryFn: async () => {
      const { data } = await api.get("/leave/calendar", { params: filters });
      return data;
    },
  });
}

export function useLeavePolicy() {
  return useQuery({
    queryKey: ["leavePolicy"],
    queryFn: async () => {
      const { data } = await api.get("/leave/policy");
      return data;
    },
  });
}
