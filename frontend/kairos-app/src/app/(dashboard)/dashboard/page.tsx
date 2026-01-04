/**
 * Dashboard Page
 *
 * Main dashboard view showing overview, statistics, and quick actions.
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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Statistics card data (placeholder - will be dynamic later)
const statsCards = [
  {
    title: "Total Students",
    value: "1,234",
    description: "+12% from last month",
    icon: GraduationCap,
  },
  {
    title: "Total Messages",
    value: "856",
    description: "23 pending responses",
    icon: MessageSquare,
  },
  {
    title: "Active Guardians",
    value: "2,456",
    description: "98% engagement rate",
    icon: Users,
  },
  {
    title: "Institutions",
    value: "12",
    description: "3 campuses active",
    icon: Building2,
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
    title: "Events",
    description: "Schedule and manage school events",
    href: "/School-Event",
    icon: Calendar,
  },
  {
    title: "News",
    description: "Publish news and announcements",
    href: "/News",
    icon: FileText,
  },
];

export default function DashboardPage() {
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get user from localStorage
  const getUserName = () => {
    if (typeof window === "undefined") return "User";
    const userInfo = localStorage.getItem("kairos_user");
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        return parsed.fullName || parsed.username || "User";
      } catch {
        return "User";
      }
    }
    return "User";
  };

  return (
    <div className="space-y-8">
      {/* Header section with greeting */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()},{" "}
            <span className="text-primary">{getUserName()}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to Kairos School Management System.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button size="sm" asChild>
            <Link href="/Message">
              <MessageSquare className="mr-2 h-4 w-4" />
              New Message
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
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
