// Admin tRPC Router - Complete Implementation
import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  // ═══════════════════════════════════════════════════════════
  // DASHBOARD STATS
  // ═══════════════════════════════════════════════════════════
  
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalTeams,
      pendingTeams,
      approvedTeams,
      rejectedTeams,
      waitlistedTeams,
      underReviewTeams,
      totalUsers,
      totalSubmissions,
      newTeamsToday,
      newTeamsThisWeek,
    ] = await Promise.all([
      ctx.prisma.team.count({ where: { deletedAt: null } }),
      ctx.prisma.team.count({ where: { status: "PENDING", deletedAt: null } }),
      ctx.prisma.team.count({ where: { status: "APPROVED", deletedAt: null } }),
      ctx.prisma.team.count({ where: { status: "REJECTED", deletedAt: null } }),
      ctx.prisma.team.count({ where: { status: "WAITLISTED", deletedAt: null } }),
      ctx.prisma.team.count({ where: { status: "UNDER_REVIEW", deletedAt: null } }),
      ctx.prisma.user.count({ where: { deletedAt: null } }),
      ctx.prisma.submission.count(),
      ctx.prisma.team.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          deletedAt: null,
        },
      }),
      ctx.prisma.team.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          deletedAt: null,
        },
      }),
    ]);

    // Calculate average review time
    const reviewedTeams = await ctx.prisma.team.findMany({
      where: {
        reviewedAt: { not: null },
        deletedAt: null,
      },
      select: {
        createdAt: true,
        reviewedAt: true,
      },
      take: 100,
    });

    const avgReviewTime = reviewedTeams.length > 0
      ? reviewedTeams.reduce((acc: number, team: { createdAt: Date; reviewedAt: Date | null }) => {
          const diff = team.reviewedAt!.getTime() - team.createdAt.getTime();
          return acc + diff / (1000 * 60 * 60); // Convert to hours
        }, 0) / reviewedTeams.length
      : 0;

    return {
      totalTeams,
      pendingTeams,
      approvedTeams,
      rejectedTeams,
      waitlistedTeams,
      underReviewTeams,
      totalUsers,
      totalSubmissions,
      newTeamsToday,
      newTeamsThisWeek,
      approvalRate: totalTeams > 0 ? (approvedTeams / totalTeams) * 100 : 0,
      rejectionRate: totalTeams > 0 ? (rejectedTeams / totalTeams) * 100 : 0,
      avgReviewTime: Math.round(avgReviewTime * 10) / 10,
    };
  }),

  // ═══════════════════════════════════════════════════════════
  // TEAMS MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  getTeams: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        track: z.string().optional(),
        college: z.string().optional(),
        search: z.string().optional(),
        dateRange: z
          .object({
            from: z.date().optional(),
            to: z.date().optional(),
          })
          .optional(),
        sortBy: z.enum(["createdAt", "name", "status", "college"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        deletedAt: null,
      };

      // Status filter
      if (input.status && input.status !== "all") {
        where.status = input.status;
      }

      // Track filter
      if (input.track && input.track !== "all") {
        where.track = input.track;
      } 

      // College filter
      if (input.college) {
        where.college = { contains: input.college, mode: "insensitive" };
      }

      // Search filter
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { college: { contains: input.search, mode: "insensitive" } },
          {
            members: {
              some: {
                user: {
                  OR: [
                    { name: { contains: input.search, mode: "insensitive" } },
                    { email: { contains: input.search, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
        ];
      }

      // Date range filter
      if (input.dateRange?.from || input.dateRange?.to) {
        where.createdAt = {};
        if (input.dateRange.from) where.createdAt.gte = input.dateRange.from;
        if (input.dateRange.to) where.createdAt.lte = input.dateRange.to;
      }

      const [teams, totalCount] = await Promise.all([
        ctx.prisma.team.findMany({
          where,
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    college: true,
                    avatar: true,
                  },
                },
              },
            },
            submission: {
              select: {
                id: true,
                submittedAt: true,
                ideaTitle: true,
                _count: {
                  select: { files: true },
                },
              },
            },
            tags: true,
            _count: {
              select: {
                comments: true,
              },
            },
          },
          orderBy: { [input.sortBy]: input.sortOrder },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.team.count({ where }),
      ]);

      return {
        teams,
        totalCount,
        totalPages: Math.ceil(totalCount / input.pageSize),
        currentPage: input.page,
      };
    }),

  getTeamById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.prisma.team.findUnique({
        where: { id: input.id },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          submission: {
            include: {
              files: true,
            },
          },
          comments: {
            orderBy: { createdAt: "desc" },
          },
          tags: true,
        },
      });

      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      return team;
    }),

  updateTeamStatus: adminProcedure
    .input(
      z.object({
        teamId: z.string(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "WAITLISTED", "UNDER_REVIEW"]),
        reviewNotes: z.string().optional(),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new Error("Unauthorized");
      }
      
      const userId = ctx.session.user.id;
      
      const team = await ctx.prisma.team.update({
        where: { id: input.teamId },
        data: {
          status: input.status,
          reviewNotes: input.reviewNotes,
          rejectionReason: input.rejectionReason,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
        include: {
          members: {
            include: { user: true },
          },
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: "team.status_updated",
          entity: "Team",
          entityId: input.teamId,
          metadata: { status: input.status, previousStatus: team.status },
        },
      });

      // Send notification to team members
      const notifications = team.members.map((member: any) => ({
        userId: member.userId,
        type: "STATUS_UPDATE" as const,
        title: `Team Status Updated`,
        message: `Your team "${team.name}" status has been changed to ${input.status}`,
        link: `/team/${team.id}`,
      }));

      await ctx.prisma.notification.createMany({
        data: notifications,
      });

      return team;
    }),

  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        teamIds: z.array(z.string()),
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "WAITLISTED", "UNDER_REVIEW"]),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new Error("Unauthorized");
      }
      
      const userId = ctx.session.user.id;
      
      const result = await ctx.prisma.team.updateMany({
        where: { id: { in: input.teamIds } },
        data: {
          status: input.status,
          reviewNotes: input.reviewNotes,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      // Log activity for each team
      await ctx.prisma.activityLog.createMany({
        data: input.teamIds.map((teamId) => ({
          userId,
          action: "team.bulk_status_updated",
          entity: "Team",
          entityId: teamId,
          metadata: { status: input.status },
        })),
      });

      return { count: result.count };
    }),

  deleteTeam: adminProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new Error("Unauthorized");
      }
      
      const userId = ctx.session.user.id;
      
      // Soft delete
      await ctx.prisma.team.update({
        where: { id: input.teamId },
        data: { deletedAt: new Date() },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: "team.deleted",
          entity: "Team",
          entityId: input.teamId,
        },
      });

      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // COMMENTS & TAGS
  // ═══════════════════════════════════════════════════════════

  addComment: adminProcedure
    .input(
      z.object({
        teamId: z.string(),
        content: z.string().min(1),
        isInternal: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new Error("Unauthorized");
      }
      
      const userId = ctx.session.user.id;
      
      const comment = await ctx.prisma.comment.create({
        data: {
          teamId: input.teamId,
          authorId: userId,
          content: input.content,
          isInternal: input.isInternal,
        },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: "comment.created",
          entity: "Comment",
          entityId: comment.id,
          metadata: { teamId: input.teamId },
        },
      });

      return comment;
    }),

  addTag: adminProcedure
    .input(
      z.object({
        teamId: z.string(),
        tag: z.string(),
        color: z.string().default("#6366f1"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new Error("Unauthorized");
      }
      
      const userId = ctx.session.user.id;
      
      const teamTag = await ctx.prisma.teamTag.create({
        data: {
          teamId: input.teamId,
          tag: input.tag,
          color: input.color,
          addedBy: userId,
        },
      });

      return teamTag;
    }),

  removeTag: adminProcedure
    .input(z.object({ tagId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.teamTag.delete({
        where: { id: input.tagId },
      });

      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════

  getAnalytics: adminProcedure.query(async ({ ctx }) => {
    // Registration trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const registrationTrends = await ctx.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM teams
      WHERE created_at >= ${thirtyDaysAgo} AND deleted_at IS NULL
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    // Top colleges
    const collegeDistribution = await ctx.prisma.team.groupBy({
      by: ["college"],
      where: { deletedAt: null, college: { not: null } },
      _count: true,
      orderBy: { _count: { college: "desc" } },
      take: 10,
    });

    // Track comparison
    const trackComparison = await ctx.prisma.team.groupBy({
      by: ["track", "status"],
      where: { deletedAt: null },
      _count: true,
    });

    // Team size distribution
    const teamSizeDistribution = await ctx.prisma.team.groupBy({
      by: ["size"],
      where: { deletedAt: null },
      _count: true,
      orderBy: { size: "asc" },
    });

    return {
      registrationTrends: registrationTrends.map((r: { date: Date; count: bigint }) => ({
        date: r.date,
        count: Number(r.count),
      })),
      collegeDistribution,
      trackComparison,
      teamSizeDistribution,
    };
  }),

  // ═══════════════════════════════════════════════════════════
  // USERS MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  getUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        deletedAt: null,
      };

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { college: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input.role && input.role !== "all") {
        where.role = input.role as any;
      }

      const [users, totalCount] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          include: {
            _count: {
              select: {
                teamMemberships: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        totalCount,
        totalPages: Math.ceil(totalCount / input.pageSize),
      };
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["PARTICIPANT", "ORGANIZER", "JUDGE", "ADMIN", "SUPER_ADMIN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new Error("Unauthorized");
      }
      
      const userId = ctx.session.user.id;
      
      const user = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: "user.role_updated",
          entity: "User",
          entityId: input.userId,
          metadata: { newRole: input.role },
        },
      });

      return user;
    }),

  // ═══════════════════════════════════════════════════════════
  // ACTIVITY LOGS
  // ═══════════════════════════════════════════════════════════

  getActivityLogs: adminProcedure
    .input(
      z.object({
        action: z.string().optional(),
        userId: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.action) {
        where.action = { contains: input.action };
      }

      if (input.userId) {
        where.userId = input.userId;
      }

      const [logs, totalCount] = await Promise.all([
        ctx.prisma.activityLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.activityLog.count({ where }),
      ]);

      return {
        logs,
        totalCount,
        totalPages: Math.ceil(totalCount / input.pageSize),
      };
    }),

  // ═══════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════

  exportTeams: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        track: z.string().optional(),
        format: z.enum(["csv", "json"]).default("csv"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new Error("Unauthorized");
      }
      
      const userId = ctx.session.user.id;
      
      const where: any = {
        deletedAt: null,
      };

      if (input.status && input.status !== "all") {
        where.status = input.status as any;
      }

      if (input.track && input.track !== "all") {
        where.track = input.track as any;
      }

      const teams = await ctx.prisma.team.findMany({
        where,
        include: {
          members: {
            include: { user: true },
          },
          submission: true,
        },
      });

      // Log export activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: "teams.exported",
          entity: "Team",
          entityId: "bulk",
          metadata: { count: teams.length, format: input.format },
        },
      });

      return { teams, count: teams.length };
    }),
});
