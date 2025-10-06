# Security Guidelines for ThreeLanes Kanban App

## 🔒 Security Status

Last Updated: 2025-01-06

## ✅ Implemented Security Measures

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ User isolation enforced via `auth.uid()` checks
- ✅ Cascading deletes prevent orphaned records
- ✅ Indexes for performance (reduces DOS risk)

### Authentication
- ✅ Supabase Auth (OAuth 2.0)
- ✅ Password hashing (bcrypt via Supabase)
- ✅ Session management
- ✅ Google OAuth integration

### Code Security
- ✅ No `dangerouslySetInnerHTML` usage
- ✅ No `eval()` calls
- ✅ React's automatic XSS protection
- ✅ Environment variables excluded from git
- ✅ TypeScript for type safety

## 🔴 Critical Issues to Fix Immediately

### 1. Remove Console Logging (HIGH PRIORITY)
**Files to Update:**
- `lib/api/boards.ts` - Lines 66, 79, 108, 130, 146, 230, 247, 262, etc.
- `contexts/auth-context.tsx` - Lines 27-28, 38
- `components/board-selector.tsx` - Remove all console.log statements

**Action:**
```bash
# Search for all console.log
grep -r "console.log" --include="*.ts" --include="*.tsx" ./
```

Replace with environment-aware logging:
```typescript
// lib/logger.ts
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    console.error(...args) // Always log errors
  },
}
```

### 2. Add Input Validation (HIGH PRIORITY)
**Files to Update:**
- `lib/api/boards.ts` - Use validation functions
- `components/add-task-dialog.tsx` - Validate before submit
- `components/edit-task-dialog.tsx` - Validate before submit

**Implementation:**
See `lib/validation.ts` for validation utilities.

Example usage:
```typescript
import { validateTaskTitle, validateTaskDescription, ValidationError } from '@/lib/validation'

try {
  const validTitle = validateTaskTitle(title)
  const validDescription = validateTaskDescription(description)
  // Proceed with valid data
} catch (error) {
  if (error instanceof ValidationError) {
    // Show error to user
  }
}
```

### 3. Add Rate Limiting (HIGH PRIORITY)
**Implementation:**
See `lib/rate-limit.ts` for rate limiting utilities.

Example usage in API calls:
```typescript
import { isRateLimited, RATE_LIMITS, RateLimitError } from '@/lib/rate-limit'

export async function createTask(task: TaskInsert) {
  const key = `createTask:${user.id}`
  
  if (isRateLimited(key, RATE_LIMITS.WRITE)) {
    throw new RateLimitError('Too many requests. Please try again later.', Date.now() + 60000)
  }
  
  // Proceed with task creation
}
```

## 🟡 Medium Priority Improvements

### 4. Strengthen Password Requirements
**Supabase Dashboard → Authentication → Policies:**
```
Minimum password length: 10 characters
Password strength: Good (default)
```

**Client-side validation** in `components/auth/auth-form.tsx`:
```typescript
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter'
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain a number'
  }
  return null
}
```

### 5. Enable Email Verification
**Supabase Dashboard:**
1. Go to Authentication → Settings
2. Enable "Confirm email"
3. Customize email templates

**Update `AuthForm`** to show verification message.

### 6. Move Category Colors to Database
**Create migration:**
```sql
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_colors JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON public.user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### 7. Add Account Security Features

#### Rate Limit Auth Attempts
Configure in Supabase Dashboard:
- Max failed login attempts: 5
- Lockout duration: 15 minutes

#### Session Security
```typescript
// In auth-context.tsx
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

useEffect(() => {
  let timeoutId: NodeJS.Timeout
  
  const resetTimeout = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      signOut()
    }, SESSION_TIMEOUT)
  }
  
  // Reset timeout on user activity
  window.addEventListener('click', resetTimeout)
  window.addEventListener('keypress', resetTimeout)
  
  resetTimeout()
  
  return () => {
    clearTimeout(timeoutId)
    window.removeEventListener('click', resetTimeout)
    window.removeEventListener('keypress', resetTimeout)
  }
}, [])
```

## 🟢 Best Practices to Maintain

### Regular Security Updates
```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# Check outdated packages
pnpm outdated
```

### Environment Variables
**Never commit:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Any API keys or secrets

**Use Vercel/hosting provider's environment variable management.**

### Monitoring & Logging
1. **Supabase Dashboard → Logs**
   - Monitor failed auth attempts
   - Check for unusual database access patterns

2. **Set up alerts:**
   - Failed login spikes
   - Unusual API usage patterns
   - Database errors

### Security Headers
The `middleware.ts` file adds essential security headers:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Content-Security-Policy` - Restricts resource loading
- `Referrer-Policy` - Controls referrer information

### HTTPS Enforcement
The middleware automatically redirects HTTP to HTTPS in production.

## 📊 Security Checklist

### Before Launch
- [ ] Remove all console.log statements
- [ ] Add input validation to all forms
- [ ] Implement rate limiting
- [ ] Enable email verification
- [ ] Configure password strength requirements
- [ ] Review RLS policies
- [ ] Test authentication flows
- [ ] Run `pnpm audit`
- [ ] Set up monitoring

### Monthly Maintenance
- [ ] Update dependencies
- [ ] Review Supabase logs
- [ ] Check for security advisories
- [ ] Test backup/restore procedures
- [ ] Review user feedback for security issues

### Quarterly Review
- [ ] Penetration testing
- [ ] Code security audit
- [ ] Update security documentation
- [ ] Review access controls

## 🚨 Incident Response

### If a Security Issue is Discovered:

1. **Assess Impact**
   - What data is exposed?
   - How many users affected?
   - Is the vulnerability still exploitable?

2. **Immediate Actions**
   - Disable affected features if necessary
   - Rotate compromised keys
   - Notify affected users

3. **Fix & Deploy**
   - Develop and test fix
   - Deploy immediately
   - Verify fix effectiveness

4. **Post-Incident**
   - Document incident
   - Update security measures
   - Conduct team review

## 📞 Security Contacts

- **Supabase Support:** https://supabase.com/support
- **Security Advisories:** https://github.com/supabase/supabase/security/advisories

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-production#security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
