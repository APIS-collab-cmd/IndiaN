// Teams Table - Stub Component
export function TeamsTable({ teams, totalCount, currentPage, pageSize, isLoading, selectedTeams, onSelectionChange, onPageChange, onSort }: any) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4">
        <div className="text-gray-500">Teams table placeholder - {totalCount} teams</div>
      </div>
    </div>
  );
}
