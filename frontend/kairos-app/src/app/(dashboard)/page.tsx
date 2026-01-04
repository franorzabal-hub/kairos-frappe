/**
 * Dashboard Home Page
 *
 * Main dashboard view showing overview, statistics, and quick actions.
 * Displays a personalized greeting and key metrics for the institution.
 */

"use client";

import Link from "next/link";
import {
  Users,
  MessageSquare,
  GraduationCap,
  Building2,
  Calendar,
  ArrowRight,
  Bell,
  FileText,
} from "lucide-react";

import { useAuth } from "@/lib/frappe-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Statistics card data
const statsCards = [
  {
    title: "Total Students",
    value: "1,234",
    description: "+12% from last month",
    icon: GraduationCap,
    trend: "up",
  },
  {
    title: "Total Messages",
    value: "856",
    description: "23 pending responses",
    icon: MessageSquare,
    trend: "neutral",
  },
  {
    title: "Active Guardians",
    value: "2,456",
    description: "98% engagement rate",
    icon: Users,
    trend: "up",
  },
  {
    title: "Institutions",
    value: "12",
    description: "3 campuses active",
    icon: Building2,
    trend: "neutral",
  },
];

// Quick action links
const quickActions = [
  {
    title: "Students",
    description: "Manage student records and enrollments",
    href: "/Student",
    icon: GraduationCap,
  },
  {
    title: "Messages",
    description: "Send and view communications",
    href: "/Message",
    icon: MessageSquare,
  },
  {
    title: "Guardians",
    description: "View and manage guardian information",
    href: "/Guardian",
    icon: Users,
  },
  {
    title: "Institutions",
    description: "Manage institution settings",
    href: "/Institution",
    icon: Building2,
  },
  {
    title: "Academic Terms",
    description: "Configure academic periods",
    href: "/Academic Term",
    icon: Calendar,
  },
  {
    title: "Reports",
    description: "View analytics and reports",
    href: "/reports",
    icon: FileText,
  },
];

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="mt-1 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Header section with greeting */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()},{" "}
            {isLoading ? (
              <Skeleton className="inline-block h-8 w-32" />
            ) : (
              <span className="text-primary">{user?.full_name || "User"}</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to Kairos School Management System. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
      </div>

      {/* Statistics cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? [...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)
            : statsCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {action.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-medium">No recent activity</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your recent actions and notifications will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
