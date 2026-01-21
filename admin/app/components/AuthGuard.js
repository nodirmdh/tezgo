"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      router.replace("/login");
    }
  }, [pathname, router]);

  return children;
}
