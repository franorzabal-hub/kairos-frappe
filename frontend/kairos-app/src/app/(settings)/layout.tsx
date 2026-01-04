/**
 * Settings Layout
 *
 * Layout wrapper for all settings pages.
 * Uses SettingsLayout component with its own header and sidebar.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 flex h-12 items-center border-b bg-background px-4">
        <Skeleton className="h-6 w-24" />
        <div className="ml-auto flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1">
        <aside className="hidden md:flex md:w-[280px] border-r flex-col p-4">
          <Skeleton className="h-9 w-full mb-4" />
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SettingsRootLayout({
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
    return <SettingsLoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return <SettingsLoadingSkeleton />;
  }

  return <SettingsLayout>{children}</SettingsLayout>;
}
