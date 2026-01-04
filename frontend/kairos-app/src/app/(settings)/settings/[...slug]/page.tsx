/**
 * Settings Sub-page (Catch-all)
 *
 * Handles all settings sub-routes like /settings/profile, /settings/appearance, etc.
 * Shows a placeholder for pages that aren't implemented yet.
 */

import { Construction } from "lucide-react";

interface SettingsSubPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function SettingsSubPage({ params }: SettingsSubPageProps) {
  const { slug } = await params;
  const pageName = slug
    .map((s) =>
      s
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(" / ");

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
          <Construction className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{pageName}</h1>
        <p className="text-muted-foreground mt-2">
          This settings page is coming soon.
        </p>
      </div>
    </div>
  );
}
