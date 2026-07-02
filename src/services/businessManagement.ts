import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

export type BusinessOptionType = 'ministry' | 'agency';

export type BusinessOptionRecord = {
  id: string;
  type: BusinessOptionType | string;
  label: string;
  sort_order: number;
};

export type BusinessRecord = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  brand?: string | null;
  name: string;
  overview: string | null;
  ministries: string[] | null;
  agencies: string[] | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | string | null;
  manager_ids: string[] | null;
  target_groups: string[] | null;
  author_id: string | null;
  memos: unknown;
};

export type BusinessManagerRecord = {
  id: string;
  name: string | null;
  organization: string | null;
  role: string | null;
};

export type BusinessMemoRecord = {
  id: string;
  brand: string | null;
  content: string;
  authorId: string;
  authorOrg: string;
  createdAt: string;
  authorName: string;
};

export type BusinessRecordInput = {
  brand?: string | null;
  name: string;
  overview: string;
  ministries: string[];
  agencies: string[];
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  managerIds: string[];
  targetGroups: string[];
  authorId?: string | null;
};

type BusinessLoadResult = {
  businesses: BusinessRecord[];
  options: BusinessOptionRecord[];
  managers: BusinessManagerRecord[];
  warning?: string;
};

const DEFAULT_MINISTRY_OPTIONS = ['고용노동부', '중소벤처기업부', '과학기술정보통신부', '교육부', '문화체육관광부', '보건복지부'];
const DEFAULT_AGENCY_OPTIONS = ['한국산업인력공단', '중소기업기술정보진흥원', '한국디지털융합진흥원', '한국교육개발원', '한국문화정보원'];

export async function loadBusinessManagementData(): Promise<BusinessLoadResult> {
  if (!isSupabaseConfigured) {
    return {
      businesses: [],
      options: [],
      managers: [],
    };
  }

  const client = getSupabaseClient();
  const [businessesResult, optionsResult, managersResult] = await Promise.all([
    client.from('businesses').select('*').order('created_at', { ascending: false }),
    client.from('business_options').select('id,type,label,sort_order').order('sort_order', { ascending: true }),
    client.from('users').select('id,name,organization,role').in('role', ['MASTER', 'ADMIN']).order('name', { ascending: true }),
  ]);

  const warning = [businessesResult.error, optionsResult.error, managersResult.error].filter(Boolean).map((error) => error?.message ?? '알 수 없는 오류');

  return {
    businesses: (businessesResult.data ?? []) as BusinessRecord[],
    options: (optionsResult.data ?? []) as BusinessOptionRecord[],
    managers: (managersResult.data ?? []) as BusinessManagerRecord[],
    warning: warning.length ? warning.join(' / ') : undefined,
  };
}

export async function createBusinessRecord(input: BusinessRecordInput): Promise<BusinessRecord> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('businesses')
    .insert({
      name: input.name,
      brand: input.brand ?? null,
      overview: input.overview,
      ministries: input.ministries,
      agencies: input.agencies,
      start_date: input.startDate,
      end_date: input.endDate,
      budget: input.budget,
      manager_ids: input.managerIds,
      target_groups: input.targetGroups,
      author_id: input.authorId ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(resolveBusinessRecordErrorMessage(error, 'create'));
  }

  return data as BusinessRecord;
}

export async function updateBusinessRecord(businessId: string, input: BusinessRecordInput): Promise<BusinessRecord> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('businesses')
    .update({
      name: input.name,
      brand: input.brand ?? null,
      overview: input.overview,
      ministries: input.ministries,
      agencies: input.agencies,
      start_date: input.startDate,
      end_date: input.endDate,
      budget: input.budget,
      manager_ids: input.managerIds,
      target_groups: input.targetGroups,
      author_id: input.authorId ?? null,
    })
    .eq('id', businessId)
    .select('*')
    .single();

  if (error) {
    throw new Error(resolveBusinessRecordErrorMessage(error, 'update'));
  }

  return data as BusinessRecord;
}

export async function deleteBusinessRecord(businessId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  const client = getSupabaseClient();
  const { error } = await client.from('businesses').delete().eq('id', businessId);

  if (error) {
    throw new Error(resolveBusinessRecordErrorMessage(error, 'delete'));
  }
}

export async function createBusinessOption(type: BusinessOptionType, label: string, sortOrder = 0): Promise<BusinessOptionRecord> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from('business_options')
    .insert({
      type,
      label,
      sort_order: sortOrder,
    });

  if (error) {
    throw new Error(resolveBusinessOptionPermissionMessage(error, '추가'));
  }

  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `business-option-${type}-${Date.now()}`,
    type,
    label,
    sort_order: sortOrder,
  };
}

export async function deleteBusinessOption(type: BusinessOptionType, label: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  const client = getSupabaseClient();
  const { error } = await client.from('business_options').delete().eq('type', type).eq('label', label);

  if (error) {
    throw new Error(resolveBusinessOptionPermissionMessage(error, '삭제'));
  }
}

export async function persistBusinessMemos(businessId: string, memos: BusinessMemoRecord[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const client = getSupabaseClient();
  const { error } = await client.from('businesses').update({ memos }).eq('id', businessId);

  if (error) throw error;
}

export function getDefaultBusinessOptions(type: BusinessOptionType): string[] {
  return type === 'ministry' ? [...DEFAULT_MINISTRY_OPTIONS] : [...DEFAULT_AGENCY_OPTIONS];
}

function resolveBusinessOptionPermissionMessage(error: { message?: string; code?: string } | null, action: '추가' | '삭제') {
  const normalizedMessage = String(error?.message ?? '').toLowerCase();
  const normalizedCode = String(error?.code ?? '').toLowerCase();

  if (normalizedCode === '42501' || normalizedMessage.includes('row-level security') || normalizedMessage.includes('permission denied')) {
    return `주무부처/전담기관 ${action} 권한이 없습니다. Supabase business_options 테이블의 RLS 정책을 확인해 주세요.`;
  }

  return error?.message?.trim() || `주무부처/전담기관을 ${action}하지 못했습니다.`;
}

function resolveBusinessRecordErrorMessage(
  error: { message?: string; code?: string; details?: string | null; hint?: string | null } | null,
  action: 'create' | 'update' | 'delete',
) {
  const normalizedMessage = String(error?.message ?? '').toLowerCase();
  const normalizedCode = String(error?.code ?? '').toLowerCase();

  if (normalizedCode === '42501' || normalizedMessage.includes('row-level security') || normalizedMessage.includes('permission denied')) {
    if (action === 'delete') {
      return '사업 삭제 권한이 없습니다. Supabase businesses 테이블의 RLS 정책을 확인해 주세요.';
    }
    return '사업 등록/수정 권한이 없습니다. Supabase businesses 테이블의 RLS 정책을 확인해 주세요.';
  }

  if (normalizedMessage.includes('violates foreign key constraint') || normalizedMessage.includes('foreign key')) {
    return '담당팀 연결 정보가 올바르지 않습니다. users 테이블의 organization 또는 manager_ids 값을 확인해 주세요.';
  }

  if (normalizedMessage.includes('invalid input syntax for type uuid')) {
    return '담당팀 연결값이 올바르지 않습니다. users.id 형식과 manager_ids 저장값을 확인해 주세요.';
  }

  return error?.message?.trim() || error?.details?.trim() || error?.hint?.trim() || '사업 정보를 저장하지 못했습니다.';
}
