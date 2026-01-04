/**
 * Dashboard Layout
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 flex h-16 items-center border-b bg-background px-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="ml-4 h-6 w-32" />
        <div className="ml-auto flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1">
        <aside className="hidden md:flex md:w-[220px] lg:w-[280px] border-r flex-col p-4">
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in via localStorage
    const userInfo = localStorage.getItem("kairos_user");
    if (userInfo) {
      setIsAuthenticated(true);
    } else {
      router.replace("/login");
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return <DashboardLoadingSkeleton />;
  }

  return <MainLayout>{children}</MainLayout>;
}
