// Teams Table - Stub Component
interface TeamsTableProps {
  teams: unknown[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  selectedTeams: string[];
  onSelectionChange: (ids: string[]) => void;
  onPageChange: (page: number) => void;
  onSort: (field: string, order: string) => void;
}
export function TeamsTable({ teams: _teams, totalCount, currentPage: _currentPage, pageSize: _pageSize, isLoading: _isLoading, selectedTeams: _selectedTeams, onSelectionChange: _onSelectionChange, onPageChange: _onPageChange, onSort: _onSort }: TeamsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4">
        <div className="text-gray-500">Teams table placeholder - {totalCount} teams</div>
      </div>
    </div>
  );
}
