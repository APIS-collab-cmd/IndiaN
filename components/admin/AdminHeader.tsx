// Admin Header - Stub Component
export function AdminHeader({ user }: { user: any }) {
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <div className="text-sm text-gray-600">{user.email}</div>
      </div>
    </header>
  );
}
