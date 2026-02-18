// Auth Router - For post-registration authentication features
// NOTE: Initial OTP verification uses REST API (/api/send-otp, /api/verify-otp)
// This router is for session management and profile updates

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.session.user;
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100).optional(),
        phone: z.string().optional(),
        college: z.string().optional(),
        degree: z.string().optional(),
        year: z.string().optional(),
        branch: z.string().optional(),
        bio: z.string().max(500).optional(),
        linkedIn: z.string().url().optional().or(z.literal('')),
        github: z.string().url().optional().or(z.literal('')),
        portfolio: z.string().url().optional().or(z.literal('')),
        avatar: z.string().url().optional().or(z.literal('')),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "profile.updated",
          entity: "User",
          entityId: ctx.session.user.id,
          metadata: {
            updatedFields: Object.keys(input),
          },
        },
      });

      return user;
    }),

  // Logout
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.session.delete({
      where: { token: ctx.session.token },
    });

    await ctx.prisma.activityLog.create({
      data: {
        userId: ctx.session.user.id,
        action: "user.logout",
        entity: "User",
        entityId: ctx.session.user.id,
      },
    });

    return { success: true };
  }),

  // Get notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.prisma.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return notifications;
    }),

  // Mark notification as read
  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification || notification.userId !== ctx.session.user.id) {
        throw new Error("Notification not found");
      }

      await ctx.prisma.notification.update({
        where: { id: input.notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return { success: true };
    }),

  // Mark all notifications as read
  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }),

  // Get unread notification count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
    });

    return { count };
  }),

  // Delete notification
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notification || notification.userId !== ctx.session.user.id) {
        throw new Error("Notification not found");
      }

      await ctx.prisma.notification.delete({
        where: { id: input.notificationId },
      });

      return { success: true };
    }),

  // Get user activity logs
  getActivityLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.prisma.activityLog.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return logs;
    }),
});
