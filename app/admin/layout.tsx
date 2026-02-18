// Admin Layout
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { checkAdminAuth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkAdminAuth();
  
  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "ORGANIZER"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
