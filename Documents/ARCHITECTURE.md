# 🏗️ Architecture Overview

## API Design Philosophy

This project uses a **hybrid API architecture** with clear separation of concerns:

---

## 🔄 REST API (Public Registration Flow)

**Purpose:** Handle the public-facing registration form

**Endpoints:**
- `POST /api/send-otp` - Send OTP for email verification
- `POST /api/verify-otp` - Verify OTP and create session
- `POST /api/register` - Complete team registration

**Why REST for Registration?**
1. **Simplicity** - Form submission is straightforward HTTP POST
2. **No Auth Required** - Public endpoints don't need session management
3. **Idempotency** - Easy to implement with UUID keys
4. **Rate Limiting** - IP-based limits work well with REST
5. **Already Implemented** - HackathonForm.tsx uses fetch()

**Features:**
- ✅ OTP hashing (SHA-256)
- ✅ Rate limiting (Redis-based)
- ✅ Idempotency keys
- ✅ Input validation (Zod)
- ✅ Structured error responses
- ✅ Transaction safety

---

## 🔌 tRPC API (Authenticated Features)

**Purpose:** Handle post-registration authenticated features

**Routers:**

### 1. Auth Router (`auth.*`)
**For:** Session management and profile updates

```typescript
auth.me()                      // Get current user
auth.updateProfile(data)       // Update user profile
auth.logout()                  // End session
auth.getNotifications()        // Get notifications
auth.markNotificationRead(id)  // Mark as read
auth.getUnreadCount()          // Notification count
auth.getActivityLogs()         // User activity history
```

### 2. Team Router (`team.*`)
**For:** Team management after registration

```typescript
team.getMyTeams()              // List user's teams
team.getById(id)               // Get team details
team.updateSubmission(data)    // Update submission
team.submitForReview(id)       // Submit for review
team.withdraw(id)              // Withdraw submission
```

### 3. Admin Router (`admin.*`)
**For:** Admin dashboard and team management

```typescript
admin.getStats()               // Dashboard statistics
admin.getTeams(filters)        // List all teams
admin.getTeamById(id)          // Team details
admin.updateTeamStatus(...)    // Approve/reject
admin.bulkUpdateStatus(...)    // Bulk operations
admin.addComment(...)          // Add review comments
admin.addTag(...)              // Tag teams
admin.getAnalytics()           // Analytics data
admin.exportTeams(filters)     // Export to CSV
admin.getActivityLogs()        // Audit trail
```

**Why tRPC for Post-Registration?**
1. **Type Safety** - End-to-end TypeScript types
2. **Auth Built-in** - Middleware handles session validation
3. **Better DX** - Auto-complete and type checking
4. **React Query** - Built-in caching and optimistic updates
5. **Real-time** - Easy to add subscriptions later

**Features:**
- ✅ Type-safe procedures
- ✅ Protected routes (middleware)
- ✅ Role-based access control
- ✅ Automatic serialization (SuperJSON)
- ✅ React Query integration

---

## 📊 Data Flow

### Registration Flow (REST)
```
User Form → /api/send-otp → Email
         ↓
User enters OTP → /api/verify-otp → Session Token
         ↓
User fills form → /api/register → Team Created
```

### Post-Registration Flow (tRPC)
```
User Dashboard → team.getMyTeams() → Display Teams
         ↓
Edit Submission → team.updateSubmission() → Update DB
         ↓
Submit → team.submitForReview() → Status: PENDING
         ↓
Admin Reviews → admin.updateTeamStatus() → Status: APPROVED
```

---

## 🔐 Authentication Flow

### Initial Registration (REST)
1. User enters email
2. OTP sent via `/api/send-otp`
3. User verifies OTP via `/api/verify-otp`
4. **Session token returned** and stored in localStorage
5. User completes registration via `/api/register`

### Subsequent Requests (tRPC)
1. Client includes session token in headers
2. tRPC middleware validates token
3. Loads user from database
4. Attaches to context (`ctx.session.user`)
5. Protected procedures can access user

---

## 🗂️ File Structure

```
app/
├── api/                        # REST API Routes
│   ├── send-otp/
│   │   └── route.ts           # ✅ OTP generation
│   ├── verify-otp/
│   │   └── route.ts           # ✅ OTP verification
│   └── register/
│       └── route.ts           # ✅ Team registration
│
├── components/
│   └── HackathonForm.tsx      # Uses REST API
│
server/
├── trpc.ts                     # tRPC setup
└── routers/
    ├── _app.ts                # Main router
    ├── auth.ts                # ✅ Profile & notifications
    ├── team.ts                # ✅ Team management
    └── admin.ts               # ✅ Admin features
│
lib/
├── prisma.ts                  # Database client
├── trpc-client.ts             # tRPC client
├── rate-limit.ts              # ✅ Redis rate limiting
├── email.ts                   # Email service
└── auth.ts                    # Auth helpers
```

---

## 🎯 When to Use What?

### Use REST API When:
- ✅ Public endpoints (no auth required)
- ✅ Simple form submissions
- ✅ Need idempotency keys
- ✅ External integrations
- ✅ Webhooks

### Use tRPC When:
- ✅ Authenticated features
- ✅ Complex data fetching
- ✅ Need type safety
- ✅ Real-time updates
- ✅ Admin dashboards

---

## 🔄 Migration Path

### Current State
- ✅ REST API: Registration flow (complete)
- ✅ tRPC API: Post-registration features (complete)
- ✅ Clear separation of concerns

### Future Enhancements
1. **Add WebSocket support** for real-time notifications
2. **Add file upload** via tRPC procedures
3. **Add team chat** using tRPC subscriptions
4. **Add admin analytics** dashboard

### Optional: Full tRPC Migration
If you want to migrate the registration form to tRPC:

1. Create `auth.sendOtp` and `auth.verifyOtp` procedures
2. Update HackathonForm to use `trpc.auth.sendOtp.useMutation()`
3. Remove REST routes
4. Benefits: Type safety, better error handling
5. Trade-off: More complex setup, requires tRPC provider

**Recommendation:** Keep current hybrid approach. It works well and is production-ready.

---

## 🛡️ Security Layers

### REST API Security
1. **Rate Limiting** - IP + Email based (Redis)
2. **Input Validation** - Zod schemas
3. **OTP Hashing** - SHA-256
4. **Idempotency** - Prevents duplicates
5. **CORS** - Configured in Next.js

### tRPC Security
1. **Middleware Auth** - Session validation
2. **Role-Based Access** - Admin procedures
3. **Input Validation** - Zod schemas
4. **SQL Injection** - Prisma ORM
5. **XSS Protection** - Automatic escaping

---

## 📈 Performance Optimizations

### REST API
- ✅ Redis rate limiting (fast lookups)
- ✅ Database indexes (30+ indexes)
- ✅ Transaction batching
- ✅ Idempotency caching

### tRPC API
- ✅ React Query caching (5-minute stale time)
- ✅ Optimistic updates
- ✅ Batch requests
- ✅ Automatic retries

---

## 🧪 Testing Strategy

### REST API Tests
```bash
# Test OTP flow
curl -X POST /api/send-otp -d '{"email":"test@example.com"}'
curl -X POST /api/verify-otp -d '{"email":"test@example.com","otp":"123456"}'
curl -X POST /api/register -d '{...}'
```

### tRPC Tests
```typescript
// In React component
const { data } = trpc.team.getMyTeams.useQuery();
const updateMutation = trpc.team.updateSubmission.useMutation();
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `ARCHITECTURE.md` | This file - API design |
| `API_FIXES.md` | REST API improvements |
| `PRODUCTION_FIXES.md` | Security fixes |
| `DATA_FLOW.md` | Data flow diagrams |
| `MIGRATION_GUIDE.md` | Schema migration |

---

## 🎓 Best Practices

### DO ✅
- Use REST for public endpoints
- Use tRPC for authenticated features
- Validate all inputs with Zod
- Use transactions for multi-step operations
- Log all important actions
- Return structured errors

### DON'T ❌
- Mix REST and tRPC for same feature
- Skip input validation
- Store sensitive data in plain text
- Forget rate limiting
- Ignore error handling
- Skip activity logging

---

## 🚀 Deployment Checklist

### Environment Variables
```bash
# Required
DATABASE_URL="postgresql://..."
RESEND_API_KEY="re_..."

# Recommended (for rate limiting)
UPSTASH_REDIS_URL="https://..."
UPSTASH_REDIS_TOKEN="..."

# Optional
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Pre-Deployment
- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Test REST endpoints
- [ ] Test tRPC procedures
- [ ] Verify rate limiting works
- [ ] Check error responses

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check rate limit effectiveness
- [ ] Verify OTP delivery
- [ ] Test registration flow
- [ ] Monitor performance

---

## 🤝 Contributing

When adding new features:

1. **Public features** → Add to REST API
2. **Authenticated features** → Add to tRPC
3. **Always validate inputs** with Zod
4. **Always add rate limiting** where appropriate
5. **Always log activities** for audit trail
6. **Always write tests**

---

**Architecture Status:** ✅ Production-Ready

The hybrid REST + tRPC approach provides the best of both worlds:
- Simple, reliable registration flow (REST)
- Type-safe, powerful post-registration features (tRPC)
- Clear separation of concerns
- Easy to maintain and extend
