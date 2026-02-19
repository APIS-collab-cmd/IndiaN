// Admin Teams Management Page
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { TeamsTable } from "@/components/admin/teams/TeamsTable";
import { TeamsFilters } from "@/components/admin/teams/TeamsFilters";
import { BulkActions } from "@/components/admin/teams/BulkActions";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function TeamsManagementPage() {
  const [filters, setFilters] = useState({
    status: "all",
    track: "all",
    college: "",
    search: "",
    dateRange: { from: undefined, to: undefined },
    sortBy: "createdAt" as "createdAt" | "name" | "status" | "college",
    sortOrder: "desc" as "asc" | "desc",
    page: 1,
    pageSize: 50,
  });

  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const { data, isLoading, refetch } = trpc.admin.getTeams.useQuery(filters);
  const exportMutation = trpc.admin.exportTeams.useMutation();

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        status: filters.status,
        track: filters.track,
        format: "csv",
      });

      // Convert to CSV
      const csv = convertToCSV(result.teams);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teams-export-${new Date().toISOString()}.csv`;
      a.click();

      toast.success(`Exported ${result.count} teams`);
    } catch (_error) {
      toast.error("Failed to export teams");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams Management</h1>
          <p className="text-gray-600 mt-1">
            {data?.totalCount || 0} total teams
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <TeamsFilters filters={filters} onChange={(newFilters) => setFilters({ ...filters, ...newFilters })} />

      {selectedTeams.length > 0 && (
        <BulkActions
          selectedTeams={selectedTeams}
          onComplete={() => {
            setSelectedTeams([]);
            refetch();
          }}
        />
      )}

      <TeamsTable
        teams={data?.teams || []}
        totalCount={data?.totalCount || 0}
        currentPage={filters.page}
        pageSize={filters.pageSize}
        isLoading={isLoading}
        selectedTeams={selectedTeams}
        onSelectionChange={setSelectedTeams}
        onPageChange={(page: number) => setFilters({ ...filters, page })}
        onSort={(field: string, order: string) => {
          if (field === "createdAt" || field === "name" || field === "status" || field === "college") {
            if (order === "asc" || order === "desc") {
              setFilters({ ...filters, sortBy: field, sortOrder: order });
            }
          }
        }}
      />
    </div>
  );
}

interface ExportTeam {
  name: string;
  track: string;
  status: string;
  college?: string | null;
  members: { role: string; user: { name?: string | null; email: string; phone?: string | null } }[];
  createdAt: string | Date;
  reviewedAt?: string | Date | null;
  reviewNotes?: string | null;
}

function convertToCSV(teams: ExportTeam[]): string {
  const headers = [
    "Team Name",
    "Track",
    "Status",
    "College",
    "Leader Name",
    "Leader Email",
    "Leader Phone",
    "Members Count",
    "Registered At",
    "Reviewed At",
    "Review Notes",
  ];

  const rows = teams.map((team) => {
    const leader = team.members.find((m: { role: string }) => m.role === "LEADER");
    return [
      team.name,
      team.track,
      team.status,
      team.college || "",
      leader?.user.name || "",
      leader?.user.email || "",
      leader?.user.phone || "",
      team.members.length,
      new Date(team.createdAt).toLocaleString(),
      team.reviewedAt ? new Date(team.reviewedAt).toLocaleString() : "",
      team.reviewNotes || "",
    ];
  });

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}
