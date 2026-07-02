import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

export type AuthUserProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
  brand: string | null;
  organization: string | null;
};

const ALLOWED_LOGIN_ROLES = new Set(['MASTER', 'ADMIN']);
const AUTH_ERROR_MESSAGES = {
  invalidCredentials: '아이디 또는 비밀번호가 올바르지 않습니다.',
  emailNotConfirmed: '이메일 인증이 완료되지 않았습니다.',
  network: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  profileMissing: '로그인한 계정의 사용자 정보를 찾을 수 없습니다.',
  roleRestricted: 'MASTER 또는 ADMIN 계정만 로그인할 수 있습니다.',
  unknown: '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
} as const;

export async function signInWithEmailPassword(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data.session?.user ?? null;
}

export function resolveLoginErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const normalizedMessage = error.message.trim().toLowerCase();

    if (
      error.message === AUTH_ERROR_MESSAGES.invalidCredentials ||
      error.message === AUTH_ERROR_MESSAGES.emailNotConfirmed ||
      error.message === AUTH_ERROR_MESSAGES.network ||
      error.message === AUTH_ERROR_MESSAGES.profileMissing ||
      error.message === AUTH_ERROR_MESSAGES.roleRestricted ||
      normalizedMessage.includes('supabase 환경변수가 설정되지 않았습니다.')
    ) {
      return error.message;
    }

    if (
      normalizedMessage.includes('invalid login credentials') ||
      normalizedMessage.includes('invalid_credentials') ||
      normalizedMessage.includes('invalid credentials') ||
      normalizedMessage.includes('authentication failed') ||
      normalizedMessage.includes('wrong password') ||
      normalizedMessage.includes('password')
    ) {
      return AUTH_ERROR_MESSAGES.invalidCredentials;
    }

    if (normalizedMessage.includes('email not confirmed')) {
      return AUTH_ERROR_MESSAGES.emailNotConfirmed;
    }

    if (normalizedMessage.includes('fetch') || normalizedMessage.includes('network')) {
      return AUTH_ERROR_MESSAGES.network;
    }
  }

  return AUTH_ERROR_MESSAGES.unknown;
}

export async function loadAuthUserProfile(userId: string): Promise<AuthUserProfile | null> {
  if (!isSupabaseConfigured) return null;

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .select('id, email, name, role, brand, organization')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    email: data.email ?? '',
    name: data.name ?? data.email ?? '사용자',
    role: String(data.role ?? ''),
    brand: data.brand ?? null,
    organization: data.organization ?? null,
  };
}

export function getWorkspaceFromBrand(brand: string | null | undefined): '스팩' | '인사' {
  return brand === 'INSIDEOUT' ? '인사' : '스팩';
}

export function isAllowedLoginRole(role: string | null | undefined): boolean {
  return ALLOWED_LOGIN_ROLES.has(String(role ?? '').toUpperCase());
}
