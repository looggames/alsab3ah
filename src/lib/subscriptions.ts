import { AppUser, UnlockRequest, SubscriptionPlan, SubscriptionStatus, UserRole } from '../types';

const USERS_STORAGE_KEY = 'alsab3ah_system_users';
const UNLOCK_REQUESTS_KEY = 'alsab3ah_unlock_requests';
const SUPPORT_CONFIG_KEY = 'alsab3ah_support_config';

export interface SupportContactConfig {
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  supportMessage: string;
}

export const DEFAULT_SUPPORT_CONFIG: SupportContactConfig = {
  phone: '+966 50 123 4567',
  whatsapp: '966501234567',
  email: 'sales@alsab3ah.com',
  website: 'https://alsab3ah.com',
  supportMessage: 'مرحباً، أود تفعيل اشتراكي وفتح قفل الحساب في نظام السابعة للمحاسبة والفاتورة الإلكترونية.',
};

// Default initial accounts for demonstration & system setup
const INITIAL_SYSTEM_USERS: AppUser[] = [
  {
    id: 'superadmin-root-01',
    email: 'seven@superadmin.com',
    companyName: 'إدارة منظومة السابعة (المشرف العام)',
    role: 'superadmin',
    subscriptionPlan: 'lifetime',
    subscriptionStatus: 'active',
    trialStartDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    trialEndDate: new Date(Date.now() + 3650 * 86400000).toISOString(),
    isLocked: false,
    phone: '0678793039',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    notes: 'حساب المشرف العام والمسؤول عن النظام (Superadmin)',
  },
  {
    id: 'demo-trial-active',
    email: 'riyadh.store@company.sa',
    companyName: 'مؤسسة الرياض للتجارة والخدمات',
    role: 'user',
    subscriptionPlan: 'trial',
    subscriptionStatus: 'trial',
    trialStartDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    trialEndDate: new Date(Date.now() + 5 * 86400000).toISOString(), // 5 days left
    isLocked: false,
    phone: '0555112233',
    taxNumber: '310123456700003',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: 'فترة تجريبية مجانية (متبقي 5 أيام)',
  },
  {
    id: 'demo-trial-expired-locked',
    email: 'jeddah.tech@business.sa',
    companyName: 'شركة تقنية جدة للحلول الرقمية',
    role: 'user',
    subscriptionPlan: 'trial',
    subscriptionStatus: 'locked',
    trialStartDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    trialEndDate: new Date(Date.now() - 3 * 86400000).toISOString(), // Expired 3 days ago
    isLocked: true,
    lockReason: 'انتهت فترة التجربة المجانية (7 أيام). يرجى التواصل مع إدارة النظام لتفعيل الاشتراك.',
    phone: '0544889900',
    taxNumber: '300987654300003',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    notes: 'حساب منتهي التجربة ومقفل آلياً',
  },
  {
    id: 'demo-paid-pro',
    email: 'khobar.malls@saudi.com',
    companyName: 'مجموعة مراكز الخبر التجارية',
    role: 'user',
    subscriptionPlan: 'pro',
    subscriptionStatus: 'active',
    trialStartDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    trialEndDate: new Date(Date.now() + 300 * 86400000).toISOString(),
    isLocked: false,
    phone: '0566334455',
    taxNumber: '311223344500003',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    notes: 'اشتراك باقة احترافية سنوية مدفوعة',
  },
];

/**
 * Load all registered users from storage
 */
export function getAllUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure root superadmin is always present and accurate
        const superIdx = parsed.findIndex((u: AppUser) => u.email.toLowerCase() === 'seven@superadmin.com' || u.id === 'superadmin-root-01');
        if (superIdx >= 0) {
          parsed[superIdx].role = 'superadmin';
          parsed[superIdx].isLocked = false;
          parsed[superIdx].email = 'seven@superadmin.com';
        } else {
          parsed.unshift(INITIAL_SYSTEM_USERS[0]);
          saveAllUsers(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading users from localStorage:', e);
  }
  // Initialize with seed data
  saveAllUsers(INITIAL_SYSTEM_USERS);
  return INITIAL_SYSTEM_USERS;
}

/**
 * Get single user by ID or email
 */
export function getUserAccount(userIdOrEmail: string): AppUser | null {
  const users = getAllUsers();
  const clean = userIdOrEmail.trim().toLowerCase();
  return users.find((u) => u.id === userIdOrEmail || u.email.toLowerCase() === clean) || null;
}

/**
 * Save all users to storage
 */
export function saveAllUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Error saving users to localStorage:', e);
  }
}

/**
 * Check if an account is locked.
 * Superadmin is NEVER locked.
 * Regular accounts are locked if isLocked=true, status='locked', status='expired', or trial date is past.
 */
export function isAccountLocked(user: AppUser): { isLocked: boolean; reason: string; daysLeft: number } {
  if (user.role === 'superadmin') {
    return { isLocked: false, reason: '', daysLeft: 9999 };
  }

  // Explicitly locked
  if (user.isLocked || user.subscriptionStatus === 'locked') {
    return {
      isLocked: true,
      reason: user.lockReason || 'تم قفل الحساب. يرجى التواصل مع إدارة النظام لتفعيل الاشتراك.',
      daysLeft: 0,
    };
  }

  // If on paid active plan
  if (user.subscriptionStatus === 'active') {
    const end = new Date(user.trialEndDate).getTime();
    const now = Date.now();
    if (end > 0 && now > end && user.subscriptionPlan !== 'lifetime') {
      return {
        isLocked: true,
        reason: 'انتهت مدة اشتراكك الحالي. يرجى تجديد الاشتراك للاستمرار.',
        daysLeft: 0,
      };
    }
    const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
    return { isLocked: false, reason: '', daysLeft };
  }

  // If on trial
  const trialEnd = new Date(user.trialEndDate).getTime();
  const now = Date.now();
  const diffMs = trialEnd - now;
  const daysLeft = Math.ceil(diffMs / 86400000);

  if (diffMs <= 0 || user.subscriptionStatus === 'expired') {
    return {
      isLocked: true,
      reason: 'انتهت فترة التجربة المجانية (7 أيام) - تم قفل الحساب.',
      daysLeft: 0,
    };
  }

  return {
    isLocked: false,
    reason: '',
    daysLeft: Math.max(0, daysLeft),
  };
}

/**
 * Get or register user account record on login/signup.
 * If new, assigns 7-day free trial.
 */
export function getOrRegisterUserAccount(
  userId: string,
  email: string,
  meta?: string | { company_name?: string; role?: UserRole; phone?: string; tax_number?: string; cr_number?: string }
): AppUser {
  const users = getAllUsers();
  const cleanEmail = (email || '').trim().toLowerCase();

  const metaObj = typeof meta === 'string' ? { company_name: meta } : (meta || {});

  // Find existing by ID or email
  let existingIndex = users.findIndex(
    (u) => u.id === userId || (cleanEmail && u.email.toLowerCase() === cleanEmail)
  );

  const isSuperadminEmail =
    cleanEmail === 'seven@superadmin.com' ||
    cleanEmail === 'admin@system.sa' ||
    cleanEmail === 'superadmin@sabah.sa' ||
    userId === 'superadmin-root-01' ||
    metaObj.role === 'superadmin';

  if (existingIndex !== -1) {
    const user = users[existingIndex];
    // Check if trial expired and update status
    const lockCheck = isAccountLocked(user);
    const resolvedRole: UserRole = isSuperadminEmail ? 'superadmin' : (user.role === 'superadmin' ? 'superadmin' : (metaObj.role || 'user'));

    const updatedUser: AppUser = {
      ...user,
      id: userId || user.id,
      lastLoginAt: new Date().toISOString(),
      companyName: metaObj.company_name && metaObj.company_name !== 'مؤسسة تجارية' ? metaObj.company_name : user.companyName,
      role: resolvedRole,
      isLocked: isSuperadminEmail ? false : lockCheck.isLocked,
      lockReason: isSuperadminEmail ? undefined : (lockCheck.isLocked ? lockCheck.reason : user.lockReason),
      subscriptionStatus: isSuperadminEmail
        ? 'active'
        : lockCheck.isLocked && user.subscriptionStatus === 'trial'
        ? 'locked'
        : user.subscriptionStatus,
    };
    users[existingIndex] = updatedUser;
    saveAllUsers(users);
    return updatedUser;
  }

  // Create new user with 7-DAY FREE TRIAL
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 86400000); // exactly 7 days

  const newUser: AppUser = {
    id: userId,
    email: cleanEmail,
    companyName: metaObj.company_name || (isSuperadminEmail ? 'إدارة منظومة السابعة' : 'منشأة تجارية جديدة'),
    role: isSuperadminEmail ? 'superadmin' : (metaObj.role || 'user'),
    subscriptionPlan: isSuperadminEmail ? 'lifetime' : 'trial',
    subscriptionStatus: isSuperadminEmail ? 'active' : 'trial',
    trialStartDate: now.toISOString(),
    trialEndDate: isSuperadminEmail ? new Date(now.getTime() + 3650 * 86400000).toISOString() : trialEnd.toISOString(),
    isLocked: false,
    phone: metaObj.phone || '',
    taxNumber: metaObj.tax_number || '',
    crNumber: metaObj.cr_number || '',
    createdAt: now.toISOString(),
    lastLoginAt: now.toISOString(),
    notes: isSuperadminEmail ? 'مسؤول النظام الرئيسي' : 'حساب جديد - فترة تجريبية مجانية 7 أيام',
  };

  users.unshift(newUser);
  saveAllUsers(users);
  return newUser;
}

/**
 * Superadmin Action: Lock user account
 */
export function lockUserAccount(userId: string, reason?: string): boolean {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  users[index].isLocked = true;
  users[index].subscriptionStatus = 'locked';
  users[index].lockReason = reason || 'تم قفل الحساب من قبل إدارة النظام.';
  saveAllUsers(users);
  return true;
}

/**
 * Superadmin Action: Unlock user account
 */
export function unlockUserAccount(
  userId: string,
  options?: {
    plan?: SubscriptionPlan;
    extendDays?: number;
    notes?: string;
  }
): boolean {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  const user = users[index];
  const extendDays = options?.extendDays ?? 30;
  const newEndDate = new Date(Date.now() + extendDays * 86400000).toISOString();

  users[index] = {
    ...user,
    isLocked: false,
    lockReason: undefined,
    subscriptionPlan: options?.plan || (user.subscriptionPlan === 'trial' ? 'pro' : user.subscriptionPlan),
    subscriptionStatus: 'active',
    trialEndDate: newEndDate,
    notes: options?.notes || user.notes,
  };

  saveAllUsers(users);
  return true;
}

/**
 * Superadmin Action: Extend Trial Period
 */
export function extendUserTrial(userId: string, additionalDays: number): boolean {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  const user = users[index];
  const currentEnd = new Date(user.trialEndDate).getTime();
  const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
  const newEnd = new Date(baseTime + additionalDays * 86400000).toISOString();

  users[index] = {
    ...user,
    isLocked: false,
    lockReason: undefined,
    subscriptionStatus: 'trial',
    trialEndDate: newEnd,
  };

  saveAllUsers(users);
  return true;
}

/**
 * Superadmin Action: Update User Role or Details
 */
export function updateUserAccount(userId: string, updates: Partial<AppUser>): boolean {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  users[index] = {
    ...users[index],
    ...updates,
  };
  saveAllUsers(users);
  return true;
}

/**
 * Superadmin Action: Delete User Account
 */
export function deleteUserAccount(userId: string): boolean {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveAllUsers(filtered);
  return true;
}

/**
 * Superadmin Action: Provision New Account
 */
export function createAccountBySuperadmin(newUser: Omit<AppUser, 'id' | 'createdAt'>): AppUser {
  const users = getAllUsers();
  const created: AppUser = {
    ...newUser,
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  users.unshift(created);
  saveAllUsers(users);
  return created;
}

// -------------------------------------------------------------
// Unlock Requests Management (from Locked users to Superadmin)
// -------------------------------------------------------------

export function getUnlockRequests(): UnlockRequest[] {
  try {
    const raw = localStorage.getItem(UNLOCK_REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading unlock requests:', e);
  }
  return [];
}

export function saveUnlockRequests(reqs: UnlockRequest[]): void {
  try {
    localStorage.setItem(UNLOCK_REQUESTS_KEY, JSON.stringify(reqs));
  } catch (e) {
    console.warn('Error saving unlock requests:', e);
  }
}

export function submitUnlockRequest(data: {
  userId: string;
  userEmail: string;
  companyName: string;
  phone?: string;
  message?: string;
  planRequested?: string;
}): UnlockRequest {
  const requests = getUnlockRequests();
  const newReq: UnlockRequest = {
    id: `req-${Date.now()}`,
    userId: data.userId,
    userEmail: data.userEmail,
    companyName: data.companyName,
    phone: data.phone,
    message: data.message,
    planRequested: data.planRequested || 'pro',
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };
  requests.unshift(newReq);
  saveUnlockRequests(requests);
  return newReq;
}

export function resolveUnlockRequest(requestId: string, status: 'approved' | 'rejected', extendDays = 30): boolean {
  const requests = getUnlockRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = status;
  saveUnlockRequests(requests);

  if (status === 'approved') {
    unlockUserAccount(req.userId, {
      plan: (req.planRequested as SubscriptionPlan) || 'pro',
      extendDays,
      notes: `تم اعتماد فتح الحساب وتفعيل الاشتراك بناءً على الطلب رقم ${requestId}`,
    });
  }
  return true;
}

// -------------------------------------------------------------
// Support Contact Config
// -------------------------------------------------------------

export function getSupportConfig(): SupportContactConfig {
  try {
    const raw = localStorage.getItem(SUPPORT_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_SUPPORT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Error reading support config:', e);
  }
  return DEFAULT_SUPPORT_CONFIG;
}

export function saveSupportConfig(config: SupportContactConfig): void {
  try {
    localStorage.setItem(SUPPORT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving support config:', e);
  }
}
