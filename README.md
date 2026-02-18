# IndiaNext - Hackathon Platform

> **Enterprise-Grade Scalable System Design**  
> Next.js 16 · React 19 · PostgreSQL (Neon) · Prisma 7 · Redis (Upstash) · Cloudinary · Resend · tRPC

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Generate Prisma Client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Start development server
npm run dev
```

Visit: http://localhost:3000

---

## 📊 System Architecture

```
┌──────────────────────────────────────┐
│      Cloudflare / Vercel CDN         │
│  • Static Assets • Edge Caching      │
│  • DDoS Protection & WAF             │
└──────────────┬───────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────────┐    ┌───────▼──────────┐
│ Vercel Edge│    │ Admin Dashboard  │
│ Middleware │    │ Protected Route  │
└───┬────────┘    └───────┬──────────┘
    │                     │
┌───▼─────────────────────▼───┐
│      tRPC API Layer         │
│  • Type Safety • Validation │
└───┬─────────────────────────┘
    │
    ├──────┬──────┬──────┬──────┐
    │      │      │      │      │
┌───▼──┐ ┌▼───┐ ┌▼────┐ ┌▼───┐ ┌▼─────┐
│Neon  │ │Redis│ │Cloud│ │Queue│ │Search│
│DB    │ │Cache│ │inary│ │Email│ │      │
└──────┘ └─────┘ └─────┘ └─────┘ └──────┘
```

---

## 🗄️ Database Schema

### Production-Ready Normalized Schema

**13 Models | 8 Enums | 30+ Indexes | Zero Data Duplication**

#### Core Models

```prisma
// Users & Authentication
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  phone         String?
  college       String?
  degree        String?
  role          UserRole  @default(PARTICIPANT)
  emailVerified Boolean   @default(false)
  
  teamMemberships TeamMember[]
  sessions        Session[]
  notifications   Notification[]
  
  @@index([email])
  @@index([college])
}

// Teams (Single model for both tracks)
model Team {
  id        String   @id @default(cuid())
  name      String
  track     Track    // IDEA_SPRINT or BUILD_STORM
  status    RegistrationStatus @default(PENDING)
  size      Int      @default(1)
  college   String?
  
  members    TeamMember[]
  submission Submission?
  comments   Comment[]
  tags       TeamTag[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([track, status])
  @@index([college])
  @@fulltext([name])
}

// Normalized Members (Many-to-Many)
model TeamMember {
  id     String     @id @default(cuid())
  role   MemberRole @default(MEMBER)
  userId String
  teamId String
  
  user User @relation(fields: [userId], references: [id])
  team Team @relation(fields: [teamId], references: [id])
  
  @@unique([userId, teamId])
  @@index([userId])
  @@index([teamId])
}

// Submissions
model Submission {
  id     String @id @default(cuid())
  teamId String @unique
  
  // IdeaSprint fields
  ideaTitle        String?
  problemStatement String?  @db.Text
  proposedSolution String?  @db.Text
  
  // BuildStorm fields
  problemDesc String?  @db.Text
  githubLink  String?
  
  files File[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// File Management
model File {
  id           String  @id @default(cuid())
  submissionId String
  fileName     String
  fileUrl      String   // Cloudinary URL
  fileSize     Int
  mimeType     String
  category     FileCategory
  
  uploadedAt DateTime @default(now())
  
  @@index([submissionId])
}
```

#### Enums

```prisma
enum UserRole {
  PARTICIPANT
  ORGANIZER
  JUDGE
  ADMIN
  SUPER_ADMIN
}

enum Track {
  IDEA_SPRINT
  BUILD_STORM
}

enum MemberRole {
  LEADER
  MEMBER
  CO_LEADER
}

enum RegistrationStatus {
  DRAFT
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  WAITLISTED
  WITHDRAWN
}

enum FileCategory {
  IDEA_DECK
  PITCH_VIDEO
  ARCHITECTURE_DIAGRAM
  DEMO_VIDEO
  SUPPORTING_DOC
}
```

### Schema Improvements

| Feature | Old Schema | New Schema |
|---------|-----------|------------|
| **Models** | 3 (duplicated) | 13 (normalized) |
| **Data Duplication** | 80% | 0% |
| **Normalization** | ❌ Violates 1NF | ✅ 3NF compliant |
| **Indexes** | 2 | 30+ |
| **Enums** | 0 | 8 |
| **Foreign Keys** | 0 | 15+ |
| **Extensibility** | ❌ Schema changes | ✅ Just add rows |
| **Full-Text Search** | ❌ Not configured | ✅ Use `contains` filter |

### Migration Notes

**Breaking Changes from Old Schema:**

1. **Models Removed:**
   - `IdeaSprintRegistration` → Use `Team` with `track: IDEA_SPRINT`
   - `BuildStormRegistration` → Use `Team` with `track: BUILD_STORM`

2. **OTP Unique Constraint Changed:**
   - Old: `@@unique([email])`
   - New: `@@unique([email, purpose])`
   - Allows multiple OTP types per email (registration, login, password reset)

3. **Full-Text Search:**
   - Removed `@@fulltext` indexes (PostgreSQL configuration required)
   - Use Prisma's `contains` filter for text search:
   ```typescript
   await prisma.team.findMany({
     where: {
       name: { contains: searchTerm, mode: 'insensitive' }
     }
   });
   ```

4. **Email Service:**
   - Changed from `nodemailer` to `Resend`
   - Update environment variables (see `.env.example`)

---

## 🔌 API Routes

### REST API Endpoints

#### Authentication & OTP

**POST /api/send-otp**
```typescript
// Request
{
  email: string;
  purpose?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET'; // default: REGISTRATION
}

// Response
{
  message: string;
  expiresIn: number; // seconds
  debugOtp?: string; // only in development
}
```

**POST /api/verify-otp**
```typescript
// Request
{
  email: string;
  otp: string;
  purpose?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET'; // default: REGISTRATION
}

// Response
{
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  expiresAt: Date;
}
```

**POST /api/register**
```typescript
// Request
{
  // Team Info
  track: 'IDEA_SPRINT' | 'BUILD_STORM';
  teamName: string;
  teamSize: number;
  
  // Leader Info
  leaderName: string;
  leaderEmail: string;
  leaderMobile: string;
  leaderCollege: string;
  leaderDegree: string;
  
  // Members (optional)
  member2Name?: string;
  member2Email?: string;
  member2College?: string;
  member2Degree?: string;
  // ... member3, member4
  
  // IdeaSprint Fields
  ideaTitle?: string;
  problemStatement?: string;
  proposedSolution?: string;
  targetUsers?: string;
  expectedImpact?: string;
  techStack?: string;
  
  // BuildStorm Fields
  problemDesc?: string;
  githubLink?: string;
  
  // Meta
  hearAbout?: string;
  additionalNotes?: string;
}

// Response
{
  message: string;
  teamId: string;
  submissionId: string;
}
```

### tRPC API

#### Admin Router (`admin.*`)
```typescript
admin.getStats()                    // Dashboard statistics
admin.getTeams(filters)             // List teams with filters
admin.getTeamById(id)               // Get team details
admin.updateTeamStatus(...)         // Update team status
admin.bulkUpdateStatus(...)         // Bulk operations
admin.addComment(...)               // Add comments
admin.addTag(...)                   // Tag teams
admin.getAnalytics()                // Analytics data
admin.exportTeams(filters)          // Export to CSV
```

#### Team Router (`team.*`)
```typescript
team.create(data)                   // Create new team
team.getMyTeams()                   // Get user's teams
team.updateSubmission(...)          // Update submission
team.submitForReview(id)            // Submit for review
```

#### Auth Router (`auth.*`)
```typescript
auth.sendOtp(email)                 // Send OTP email
auth.verifyOtp(email, otp)          // Verify OTP & login
auth.me()                           // Get current user
auth.updateProfile(data)            // Update profile
auth.getNotifications()             // Get notifications
```

### Usage Example

```typescript
"use client";
import { trpc } from "@/lib/trpc-client";

export function MyComponent() {
  // Query
  const { data, isLoading } = trpc.admin.getStats.useQuery();
  
  // Mutation
  const updateStatus = trpc.admin.updateTeamStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
    },
  });
  
  return <div>{/* Your UI */}</div>;
}
```

---

## 🎨 Admin Dashboard

### Features

- ✅ Real-time statistics dashboard
- ✅ Advanced team filtering & search
- ✅ Bulk operations (approve/reject)
- ✅ File viewer (PDF, video, images)
- ✅ Comments & tags system
- ✅ CSV export
- ✅ Activity logs (audit trail)
- ✅ User management
- ✅ Analytics & reports

### Pages

```
/admin
├── /dashboard          # Overview with stats
├── /teams              # Teams management
│   └── /[id]          # Team detail view
├── /users              # User management
├── /analytics          # Analytics & reports
└── /activity           # Activity logs
```

---

## 🌐 Free Services Stack

| Service | Free Tier | Purpose | Cost |
|---------|-----------|---------|------|
| **Neon** | 0.5 GB | PostgreSQL database | $0 |
| **Upstash** | 10K cmds/day | Redis cache | $0 |
| **Cloudinary** | 25 GB | File storage | $0 |
| **Resend** | 3K emails/mo | Transactional emails | $0 |
| **Cloudflare** | Unlimited | CDN & DDoS protection | $0 |
| **Sentry** | 5K errors/mo | Error tracking | $0 |
| **PostHog** | 1M events/mo | Analytics | $0 |

**Total: $0/month** (for 1K-2K teams)

---

## 📦 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TailwindCSS 4** - Styling
- **Framer Motion** - Animations
- **shadcn/ui** - UI components
- **Lucide React** - Icons

### Backend
- **tRPC** - Type-safe API
- **Prisma 7** - ORM
- **Zod** - Validation
- **React Query** - Data fetching

### Services
- **Neon** - PostgreSQL database
- **Upstash Redis** - Caching
- **Cloudinary** - File storage
- **Resend** - Email service
- **Cloudflare** - CDN

---

## 🔧 Environment Variables

```env
# Database (Neon)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/indianext"
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/indianext"

# Redis (Upstash)
UPSTASH_REDIS_URL="https://xxx.upstash.io"
UPSTASH_REDIS_TOKEN="xxx"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email (Resend)
RESEND_API_KEY="re_xxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 📁 Project Structure

```
IndiaNext/
├── app/
│   ├── admin/              # Admin dashboard pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── teams/
│   ├── api/
│   │   ├── trpc/[trpc]/    # tRPC API handler
│   │   ├── register/
│   │   ├── send-otp/
│   │   └── verify-otp/
│   ├── components/         # React components
│   └── register/
├── components/
│   ├── admin/              # Admin components
│   ├── providers/          # Context providers
│   └── ui/                 # UI components
├── lib/
│   ├── prisma.ts           # Prisma client
│   ├── trpc-client.ts      # tRPC client
│   ├── auth.ts             # Auth helpers
│   ├── email.ts            # Email service
│   └── cloudinary.ts       # File upload
├── prisma/
│   └── schema.prisma       # Database schema
├── server/
│   ├── trpc.ts             # tRPC setup
│   └── routers/
│       ├── _app.ts         # Main router
│       ├── admin.ts        # Admin routes
│       ├── team.ts         # Team routes
│       └── auth.ts         # Auth routes
└── public/
```

---

## 🚀 Deployment

### Hostinger Deployment

```bash
# 1. Build
npm run build

# 2. Upload via FTP/Git

# 3. Install dependencies
npm install --production

# 4. Start with PM2
pm2 start npm --name "indianext" -- start
pm2 save
pm2 startup
```

### Environment Setup

1. **Neon Database**
   - Sign up at neon.tech
   - Create project
   - Copy DATABASE_URL

2. **Upstash Redis**
   - Sign up at upstash.com
   - Create database
   - Copy URL & token

3. **Cloudinary**
   - Sign up at cloudinary.com
   - Get credentials from dashboard

4. **Resend**
   - Sign up at resend.com
   - Get API key

5. **Cloudflare**
   - Add your domain
   - Update nameservers

---

## 📊 Performance

### Optimizations

- ✅ 30+ database indexes for fast queries
- ✅ Redis caching (OTP, sessions, rate limits)
- ✅ CDN for static assets
- ✅ Image optimization (Cloudinary)
- ✅ Full-text search
- ✅ Connection pooling
- ✅ Edge functions for auth

### Scalability

| Scenario | Mechanism |
|----------|-----------|
| **10x registrations** | Neon auto-scales, serverless functions |
| **Spike traffic** | Edge caching, rate limiting |
| **Large file uploads** | Direct to Cloudinary (no server bottleneck) |
| **Email bursts** | Queue-based async sending |
| **Global users** | Edge functions + global Redis |

---

## 🔒 Security

- ✅ Rate limiting on all API endpoints
- ✅ Input validation with Zod
- ✅ File type validation (MIME + magic bytes)
- ✅ CSRF protection
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Secure headers (CSP, HSTS)
- ✅ DDoS protection (Cloudflare)

---

## 📝 Development

### Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Database
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create migration
npx prisma generate        # Generate client

# Type checking
npm run type-check

# Linting
npm run lint
```

### Adding a New Feature

1. **Update Schema** (if needed)
   ```bash
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name feature_name
   ```

2. **Create tRPC Route**
   ```typescript
   // server/routers/feature.ts
   export const featureRouter = router({
     myEndpoint: protectedProcedure
       .input(z.object({ ... }))
       .mutation(async ({ ctx, input }) => {
         // Your logic
       }),
   });
   ```

3. **Add to Main Router**
   ```typescript
   // server/routers/_app.ts
   export const appRouter = router({
     feature: featureRouter,
   });
   ```

4. **Use in Component**
   ```typescript
   const { data } = trpc.feature.myEndpoint.useQuery();
   ```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Prisma Client not generated"**
```bash
npx prisma generate
```

**Issue: "Database connection failed"**
- Check DATABASE_URL in .env
- Ensure database is running
- Check firewall rules

**Issue: "tRPC endpoint not found"**
- Restart dev server
- Check router is added to _app.ts
- Verify endpoint name

**Issue: "File upload fails"**
- Check Cloudinary credentials
- Verify file size limits
- Check CORS settings

---

## 📚 Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **tRPC Docs:** https://trpc.io/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Neon Docs:** https://neon.tech/docs
- **Cloudinary Docs:** https://cloudinary.com/documentation

---

## 🤝 Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

---

## 📄 License

MIT License - feel free to use this project for your hackathon!

---

**Built with ❤️ for IndiaNext Hackathon**
