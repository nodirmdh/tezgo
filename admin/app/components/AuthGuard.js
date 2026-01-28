"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, mustChangePassword } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (pathname === "/login") {
      if (user) {
        router.replace(mustChangePassword ? "/change-password" : "/");
      }
      return;
    }
    if (!user) {
      router.replace("/login");
      return;
    }
    if (mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password");
    }
  }, [loading, pathname, router, user, mustChangePassword]);

  return children;
}
