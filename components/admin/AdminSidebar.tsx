// Admin Sidebar - Stub Component
export function AdminSidebar({ user }: { user: any }) {
  return (
    <aside className="w-64 bg-gray-900 text-white p-4">
      <div className="text-xl font-bold mb-8">IndiaNext Admin</div>
      <nav>
        <a href="/admin" className="block py-2 px-4 hover:bg-gray-800 rounded">Dashboard</a>
        <a href="/admin/teams" className="block py-2 px-4 hover:bg-gray-800 rounded">Teams</a>
      </nav>
    </aside>
  );
}
