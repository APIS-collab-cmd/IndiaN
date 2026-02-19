// Stats Cards - Stub Component
export function StatsCards({ stats }: { stats: Record<string, number> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600">Total Teams</div>
        <div className="text-2xl font-bold">{stats.totalTeams || 0}</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600">Pending Review</div>
        <div className="text-2xl font-bold">{stats.pendingTeams || 0}</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600">Approved</div>
        <div className="text-2xl font-bold">{stats.approvedTeams || 0}</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-sm text-gray-600">Rejected</div>
        <div className="text-2xl font-bold">{stats.rejectedTeams || 0}</div>
      </div>
    </div>
  );
}
