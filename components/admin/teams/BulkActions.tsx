// Bulk Actions - Stub Component
export function BulkActions({ selectedTeams, onComplete: _onComplete }: { selectedTeams: string[]; onComplete: () => void }) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="text-sm text-blue-800">{selectedTeams.length} teams selected</div>
    </div>
  );
}
