/**
 * Report Page
 *
 * Displays a Frappe Query Report or Script Report
 * Supports dynamic filters, data table, and export
 */

"use client";

import { use } from "react";
import Link from "next/link";
import { ReportView } from "@/components/reports";
import { ChevronRight } from "lucide-react";

interface ReportPageProps {
  params: Promise<{
    name: string;
  }>;
}

export default function ReportPage({ params }: ReportPageProps) {
  const { name } = use(params);
  const reportName = decodeURIComponent(name);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{reportName}</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{reportName}</h1>
        <p className="text-muted-foreground">Query Report</p>
      </div>

      {/* Report View */}
      <ReportView reportName={reportName} />
    </div>
  );
}
