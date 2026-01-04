/**
 * Dashboard Layout
 *
 * Main layout wrapper for authenticated dashboard pages.
 * Includes sidebar navigation, header, and authentication verification.
 * Redirects unauthenticated users to the login page.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/frappe-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 flex h-16 items-center border-b bg-background px-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="ml-4 h-6 w-32" />
        <div className="ml-auto flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar skeleton */}
        <aside className="hidden md:flex md:w-[220px] lg:w-[280px] border-r flex-col p-4">
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Content skeleton */}
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
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading skeleton while checking authentication
  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return <DashboardLoadingSkeleton />;
  }

  return <MainLayout>{children}</MainLayout>;
}
