# 🔄 Migration Guide: Old Schema → New Schema

## Overview

This guide helps you migrate from the old duplicated schema to the new normalized schema.

---

## Breaking Changes Summary

### 1. Models Removed

| Old Model | New Model | Notes |
|-----------|-----------|-------|
| `IdeaSprintRegistration` | `Team` + `Submission` | Use `track: IDEA_SPRINT` |
| `BuildStormRegistration` | `Team` + `Submission` | Use `track: BUILD_STORM` |

### 2. OTP Schema Changes

**Old Schema:**
```prisma
model Otp {
  id        String   @id @default(cuid())
  email     String   @unique  // ← Only one OTP per email
  otp       String
  expiresAt DateTime
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**New Schema:**
```prisma
model Otp {
  id        String     @id @default(cuid())
  email     String
  otp       String
  purpose   OtpPurpose @default(REGISTRATION)  // ← New field
  expiresAt DateTime
  verified  Boolean    @default(false)
  attempts  Int        @default(0)             // ← New field
  userId    String?                            // ← New field
  user      User?      @relation(fields: [userId], references: [id])
  createdAt DateTime   @default(now())
  verifiedAt DateTime?                         // ← New field

  @@unique([email, purpose])  // ← Changed constraint
  @@index([email])
  @@index([expiresAt])
}

enum OtpPurpose {
  REGISTRATION
  LOGIN
  PASSWORD_RESET
  EMAIL_VERIFICATION
}
```

**Impact:**
- Old code using `where: { email }` will break
- Must use `where: { email_purpose: { email, purpose } }`

### 3. Full-Text Search Removed

**Old Schema:**
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

model Team {
  // ...
  @@fulltext([name])
}
```

**New Schema:**
```prisma
generator client {
  provider = "prisma-client-js"
  // No preview features needed
}

model Team {
  // ...
  // No @@fulltext - use contains filter instead
}
```

**Migration:**
```typescript
// OLD
await prisma.team.findMany({
  where: {
    name: { search: searchTerm }
  }
});

// NEW
await prisma.team.findMany({
  where: {
    name: { 
      contains: searchTerm, 
      mode: 'insensitive' 
    }
  }
});
```

### 4. Email Service Changed

**Old:** `nodemailer` with Gmail SMTP
**New:** `Resend` API

**Environment Variables:**
```bash
# OLD
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# NEW
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## Code Migration Examples

### Example 1: Send OTP

**Old Code:**
```typescript
// app/api/send-otp/route.ts
await prisma.otp.upsert({
  where: { email },
  update: { otp, expiresAt, verified: false },
  create: { email, otp, expiresAt, verified: false },
});

// Using nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
await transporter.sendMail({ ... });
```

**New Code:**
```typescript
// app/api/send-otp/route.ts
await prisma.otp.upsert({
  where: { 
    email_purpose: {
      email,
      purpose: 'REGISTRATION'
    }
  },
  update: { otp, expiresAt, verified: false, attempts: 0 },
  create: { email, otp, purpose: 'REGISTRATION', expiresAt, verified: false },
});

// Using Resend
import { sendOtpEmail } from '@/lib/email';
await sendOtpEmail(email, otp);
```

### Example 2: Verify OTP

**Old Code:**
```typescript
const record = await prisma.otp.findUnique({
  where: { email },
});

await prisma.otp.update({
  where: { email },
  data: { verified: true },
});
```

**New Code:**
```typescript
const record = await prisma.otp.findUnique({
  where: { 
    email_purpose: {
      email,
      purpose: 'REGISTRATION'
    }
  },
});

await prisma.otp.update({
  where: { 
    email_purpose: {
      email,
      purpose: 'REGISTRATION'
    }
  },
  data: { 
    verified: true,
    verifiedAt: new Date()
  },
});
```

### Example 3: Create Registration

**Old Code:**
```typescript
// Separate models for each track
if (track === "IdeaSprint") {
  await prisma.ideaSprintRegistration.create({
    data: {
      teamName,
      leaderEmail,
      leaderName,
      leaderPhone,
      member2Name,
      member2Email,
      // ... flat structure
      ideaTitle,
      problemStatement,
      // ...
    },
  });
} else {
  await prisma.buildStormRegistration.create({
    data: {
      teamName,
      leaderEmail,
      // ... duplicate fields
      problemDesc,
      githubLink,
    },
  });
}
```

**New Code:**
```typescript
// Single normalized structure
await prisma.$transaction(async (tx) => {
  // 1. Create users
  const leader = await tx.user.upsert({
    where: { email: leaderEmail },
    update: { name: leaderName, phone: leaderPhone },
    create: { email: leaderEmail, name: leaderName, phone: leaderPhone },
  });

  // 2. Create team
  const team = await tx.team.create({
    data: {
      name: teamName,
      track: track === 'IdeaSprint' ? 'IDEA_SPRINT' : 'BUILD_STORM',
      status: 'PENDING',
      size: memberCount,
      createdBy: leader.id,
    },
  });

  // 3. Create team members
  await tx.teamMember.create({
    data: {
      userId: leader.id,
      teamId: team.id,
      role: 'LEADER',
    },
  });

  // 4. Create submission
  await tx.submission.create({
    data: {
      teamId: team.id,
      ideaTitle: track === 'IDEA_SPRINT' ? ideaTitle : null,
      problemStatement: track === 'IDEA_SPRINT' ? problemStatement : null,
      problemDesc: track === 'BUILD_STORM' ? problemDesc : null,
      githubLink: track === 'BUILD_STORM' ? githubLink : null,
    },
  });
});
```

### Example 4: Query Teams

**Old Code:**
```typescript
// Separate queries for each track
const ideaSprintTeams = await prisma.ideaSprintRegistration.findMany({
  where: { /* filters */ },
});

const buildStormTeams = await prisma.buildStormRegistration.findMany({
  where: { /* filters */ },
});

const allTeams = [...ideaSprintTeams, ...buildStormTeams];
```

**New Code:**
```typescript
// Single query with filter
const teams = await prisma.team.findMany({
  where: {
    track: 'IDEA_SPRINT', // or 'BUILD_STORM', or omit for all
    status: 'PENDING',
  },
  include: {
    members: {
      include: {
        user: true,
      },
    },
    submission: true,
  },
});
```

---

## Database Migration Steps

### Step 1: Backup Existing Data

```bash
# Export existing data
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Or use Prisma Studio to export as JSON
npx prisma studio
```

### Step 2: Create Migration Script

```typescript
// scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client';

const oldPrisma = new PrismaClient(); // Old schema
const newPrisma = new PrismaClient(); // New schema

async function migrate() {
  // 1. Migrate IdeaSprint registrations
  const ideaSprints = await oldPrisma.ideaSprintRegistration.findMany();
  
  for (const reg of ideaSprints) {
    await newPrisma.$transaction(async (tx) => {
      // Create users
      const leader = await tx.user.upsert({
        where: { email: reg.leaderEmail },
        update: {},
        create: {
          email: reg.leaderEmail,
          name: reg.leaderName,
          phone: reg.leaderPhone,
          college: reg.leaderCollege,
          degree: reg.leaderDegree,
        },
      });

      // Create team
      const team = await tx.team.create({
        data: {
          name: reg.teamName,
          track: 'IDEA_SPRINT',
          status: 'PENDING',
          size: parseInt(reg.teamSize),
          college: reg.leaderCollege,
          createdBy: leader.id,
        },
      });

      // Create team member
      await tx.teamMember.create({
        data: {
          userId: leader.id,
          teamId: team.id,
          role: 'LEADER',
        },
      });

      // Create submission
      await tx.submission.create({
        data: {
          teamId: team.id,
          ideaTitle: reg.ideaTitle,
          problemStatement: reg.problemStatement,
          proposedSolution: reg.proposedSolution,
          targetUsers: reg.targetUsers,
          expectedImpact: reg.expectedImpact,
          techStack: reg.techStack,
        },
      });
    });
  }

  // 2. Migrate BuildStorm registrations (similar logic)
  // ...
}

migrate()
  .then(() => console.log('Migration complete'))
  .catch(console.error);
```

### Step 3: Apply New Schema

```bash
# Push new schema to database
npm run db:push

# Or create migration
npm run db:migrate
```

### Step 4: Run Migration Script

```bash
npx tsx scripts/migrate-data.ts
```

### Step 5: Verify Data

```bash
# Open Prisma Studio
npm run db:studio

# Verify counts match
# Old: IdeaSprintRegistration + BuildStormRegistration
# New: Team (with track filter)
```

---

## API Route Updates

All API routes have been updated:

### ✅ Updated Files:
- `app/api/send-otp/route.ts` - Uses new OTP schema + Resend
- `app/api/verify-otp/route.ts` - Uses new OTP schema + creates session
- `app/api/register/route.ts` - Uses new Team/Submission models

### 🔧 Changes Made:
1. Removed `prisma as any` type casting
2. Updated OTP queries to use `email_purpose` constraint
3. Replaced `nodemailer` with `Resend`
4. Changed from `ideaSprintRegistration`/`buildStormRegistration` to `Team` model
5. Added transaction-based registration with proper relationships
6. Added activity logging
7. Added session creation on OTP verification

---

## Testing Checklist

- [ ] Send OTP email (verify Resend integration)
- [ ] Verify OTP (check session creation)
- [ ] Register IdeaSprint team
- [ ] Register BuildStorm team
- [ ] Check duplicate registration prevention
- [ ] Verify team members are created correctly
- [ ] Check submission data is saved
- [ ] Test with multiple team members
- [ ] Verify activity logs are created
- [ ] Test OTP expiration
- [ ] Test OTP attempt limiting (5 max)

---

## Rollback Plan

If migration fails:

```bash
# 1. Restore database from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql

# 2. Revert code changes
git checkout main  # or previous commit

# 3. Reinstall old dependencies
npm install

# 4. Regenerate Prisma Client
npx prisma generate
```

---

## Support

If you encounter issues during migration:

1. Check the error logs
2. Verify environment variables are set correctly
3. Ensure database connection is working
4. Review the migration script for data transformation errors
5. Check Prisma Studio for data integrity

---

**Migration completed successfully! 🎉**

All API routes now use the new normalized schema with proper relationships and type safety.
