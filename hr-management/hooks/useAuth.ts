import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, logout, getStoredUser } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async ({ email, password }: any) => {
      return login(email, password);
    },
    onSuccess: (user) => {
      setUser(user);
      if (user.role === "ADMIN") router.push("/admin/dashboard");
      else if (user.role === "SENIOR_MANAGER") router.push("/manager/dashboard");
      else if (user.role === "HR_RECRUITER") router.push("/hr/dashboard");
      else router.push("/employee/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/logout`, { method: "POST" });
      } catch (e) {}
      logout();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getStoredUser(),
    staleTime: Infinity,
  });
}
