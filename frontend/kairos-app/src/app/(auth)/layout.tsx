/**
 * Auth Layout
 *
 * Layout for authentication pages (login, register, forgot password).
 * Provides a clean, centered layout without the dashboard sidebar.
 * Redirects authenticated users to dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    const userInfo = localStorage.getItem("kairos_user");
    if (userInfo) {
      router.replace("/dashboard");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // Show nothing while checking auth status
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwSDI4VjBoNHYzNHptLTYgMGgtNFYwaDR2MzR6bS02IDBoLTJWMGgydjM0em0tOCAwSDhWMGg0djM0em0tNiAwSDJWMGg0djM0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/50" />

      {/* Content */}
      <main className="relative flex min-h-screen items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
