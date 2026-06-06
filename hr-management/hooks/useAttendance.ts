import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useClockInOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/attendance/clock", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceToday"] });
    },
  });
}

export function useAttendanceLogs(filters = {}) {
  return useQuery({
    queryKey: ["attendance", filters],
    queryFn: async () => {
      const { data } = await api.get("/attendance", { params: filters });
      return data;
    },
  });
}

export function useAttendanceSummary(employeeId: string) {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  return useQuery({
    queryKey: ["attendanceSummary", employeeId, year, month],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data } = await api.get(`/attendance/summary/${employeeId}?year=${year}&month=${month}`);
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useTodaySnapshot() {
  return useQuery({
    queryKey: ["attendanceToday"],
    queryFn: async () => {
      const { data } = await api.get("/attendance/today");
      return data;
    },
  });
}
