/**
 * Auth Layout
 *
 * Layout for authentication pages (login, register, forgot password).
 * Provides a clean, centered layout without the dashboard sidebar.
 * Note: FrappeProvider is now provided by the root layout.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
