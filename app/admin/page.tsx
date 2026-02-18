// Admin Dashboard Home Page
"use client";

import { trpc } from "@/lib/trpc-client";
import { StatsCards } from "@/components/admin/dashboard/StatsCards";
import { RegistrationChart } from "@/components/admin/dashboard/RegistrationChart";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import { TopColleges } from "@/components/admin/dashboard/TopColleges";
import { TrackDistribution } from "@/components/admin/dashboard/TrackDistribution";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: analytics, isLoading: analyticsLoading } = trpc.admin.getAnalytics.useQuery();

  if (statsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to IndiaNext Admin Panel</p>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics && <RegistrationChart data={analytics.registrationTrends} />}
        {analytics && <TrackDistribution data={analytics.trackComparison} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics && <TopColleges data={analytics.collegeDistribution} />}
        <RecentActivity />
      </div>
    </div>
  );
}
