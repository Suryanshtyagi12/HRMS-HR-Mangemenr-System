import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function usePayrollRuns() {
  return useQuery({
    queryKey: ["payrollRuns"],
    queryFn: async () => {
      const { data } = await api.get("/payroll/runs");
      return data;
    },
  });
}

export function useRunPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { month: number; year: number }) => {
      const { data } = await api.post("/payroll/run", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrollRuns"] });
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
    },
  });
}

export function usePayslips(employeeId?: string) {
  return useQuery({
    queryKey: ["payslips", employeeId],
    queryFn: async () => {
      const params = employeeId ? { employee_id: employeeId } : {};
      const { data } = await api.get("/payroll/payslips", { params });
      return data;
    },
  });
}

export function useDownloadPayslip(id: string) {
  return useQuery({
    queryKey: ["downloadPayslip", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/payroll/payslips/${id}/pdf`);
      return data; // returns url
    },
    enabled: false, // only run on manual refetch
  });
}
