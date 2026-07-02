import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

export type MemberWorkspace = '스팩' | '인사';
export type MemberBrand = 'SNIPERFACTORY' | 'SFACSPACE' | 'INSIDEOUT';

export type MemberUserRecord = {
  id: string;
  name?: string | null;
  phone?: string | null;
  role?: 'MASTER' | 'USER' | 'ADMIN' | 'COMPANY' | string | null;
  brand?: string | null;
  organization?: string | null;
  metadata?: Record<string, unknown> | null;
  sms_consent?: boolean | null;
  created_at?: string | null;
  birth_date?: string | null;
  birthdate?: string | null;
  tag?: string | string[] | null;
  memos?: unknown;
};

export type MemberApplicationRecord = {
  id: string;
  name?: string | null;
  phone?: string | null;
  user_id?: string | null;
  program_id?: string | null;
  brand?: string | null;
};

export type MemberProgramRecord = {
  id: string;
  name?: string | null;
  title?: string | null;
  program_name?: string | null;
  course_name?: string | null;
  brand?: string | null;
};

export type MemberViewRow = {
  id: string;
  name: string;
  ageLabel: string;
  age: number | null;
  phone: string;
  status: string;
  interest: string;
  smsConsent: boolean | null;
  signupLabel: string;
  joinedAt: string;
  joinedAtLabel: string;
  major: string;
  job: string;
  supportPrograms: string[];
  courseHistory: string[];
  brand: MemberBrand;
  role: string;
  tagValue: string | null;
  memos: MemberMemoRecord[];
  rawMetadata: Record<string, unknown>;
};

export type MemberMemoRecord = {
  id: string;
  brand: MemberBrand | string | null;
  content: string;
  authorId: string;
  authorOrg: string;
  createdAt: string;
  authorName: string;
};

type MemberDataLoadResult = {
  rows: MemberViewRow[];
  warning?: string;
};

const WORKSPACE_BRAND_MAP: Record<MemberWorkspace, MemberBrand> = {
  스팩: 'SNIPERFACTORY',
  인사: 'INSIDEOUT',
};

const WORKSPACE_BRAND_ALIASES: Record<MemberWorkspace, MemberBrand[]> = {
  스팩: ['SNIPERFACTORY', 'SFACSPACE'],
  인사: ['INSIDEOUT'],
};

const MOCK_PROGRAMS: MemberProgramRecord[] = [
  { id: 'program-1', name: '데이터 분석 기초 과정', brand: 'SFACSPACE' },
  { id: 'program-2', name: 'AI 업무 자동화 실무', brand: 'SFACSPACE' },
  { id: 'program-3', name: '브랜딩 콘텐츠 제작', brand: 'SFACSPACE' },
  { id: 'program-4', name: '커리어 전환 부트캠프', brand: 'INSIDEOUT' },
  { id: 'program-5', name: '직무 역량 강화 과정', brand: 'INSIDEOUT' },
  { id: 'program-6', name: '현업형 포트폴리오 과정', brand: 'INSIDEOUT' },
];

const MOCK_USERS: MemberUserRecord[] = [
  {
    id: 'member-1',
    name: '김민지',
    phone: '010-1234-5678',
    role: 'USER',
    brand: 'SFACSPACE',
    sms_consent: true,
    created_at: '2026-06-18T09:10:00Z',
    birth_date: '1998-03-14',
    metadata: {
      birth: '1998-03-14',
      status: '취업준비',
      interest: '데이터분석',
      major: '경영학',
      job: '기획',
      signup_channel: 'kakao',
    },
  },
  {
    id: 'member-2',
    name: '이서연',
    phone: '010-2222-3344',
    role: 'USER',
    brand: 'SFACSPACE',
    sms_consent: false,
    created_at: '2026-05-02T03:20:00Z',
    birthdate: '1995-11-22',
    metadata: {
      birth: '1995-11-22',
      status: '재직',
      interest: '마케팅',
      major: '광고홍보학',
      job: '마케팅',
    },
  },
  {
    id: 'member-3',
    name: '박준호',
    phone: '010-7788-9911',
    role: 'USER',
    brand: 'SFACSPACE',
    sms_consent: true,
    created_at: '2026-03-16T13:05:00Z',
    birth_date: '1989-08-05',
    metadata: {
      birth: '1989-08-05',
      status: '재직',
      interest: 'AI활용',
      major: '컴퓨터공학',
      job: '개발',
      signup_channel: 'kakao',
    },
  },
  {
    id: 'member-4',
    name: '최유진',
    phone: '010-4444-2211',
    role: 'USER',
    brand: 'INSIDEOUT',
    sms_consent: true,
    created_at: '2026-06-28T11:40:00Z',
    birth_date: '2000-01-03',
    metadata: {
      birth: '2000-01-03',
      status: '구직',
      interest: 'UIUX',
      major: '시각디자인',
      job: '디자인',
    },
  },
  {
    id: 'member-5',
    name: '정다은',
    phone: '010-5555-9988',
    role: 'USER',
    brand: 'INSIDEOUT',
    sms_consent: false,
    created_at: '2026-04-23T02:00:00Z',
    birth_date: '1992-07-19',
    metadata: {
      birth: '1992-07-19',
      status: '취업준비',
      interest: '기획',
      major: '교육학',
      job: '운영',
      signup_channel: 'kakao',
    },
  },
  {
    id: 'member-6',
    name: '한지우',
    phone: '010-6633-4411',
    role: 'USER',
    brand: 'INSIDEOUT',
    sms_consent: true,
    created_at: '2026-02-11T05:45:00Z',
    birth_date: '1986-09-30',
    metadata: {
      birth: '1986-09-30',
      status: '재직',
      interest: '퍼실리테이션',
      major: '교육공학',
      job: '교육운영',
    },
  },
];

const MOCK_APPLICATIONS: MemberApplicationRecord[] = [
  { id: 'app-1', user_id: 'member-1', program_id: 'program-1', brand: 'SFACSPACE', name: '김민지', phone: '010-1234-5678' },
  { id: 'app-2', user_id: 'member-1', program_id: 'program-2', brand: 'SFACSPACE', name: '김민지', phone: '010-1234-5678' },
  { id: 'app-3', user_id: 'member-2', program_id: 'program-3', brand: 'SFACSPACE', name: '이서연', phone: '010-2222-3344' },
  { id: 'app-4', user_id: 'member-4', program_id: 'program-4', brand: 'INSIDEOUT', name: '최유진', phone: '010-4444-2211' },
  { id: 'app-5', user_id: 'member-5', program_id: 'program-5', brand: 'INSIDEOUT', name: '정다은', phone: '010-5555-9988' },
  { id: 'app-6', user_id: 'member-6', program_id: 'program-6', brand: 'INSIDEOUT', name: '한지우', phone: '010-6633-4411' },
];

const MOCK_COURSES_BY_INDEX = [
  ['챗GPT 업무 자동화', 'AI로 만드는 제안서'],
  ['포트폴리오 실전 제작', '데이터 기반 문제 해결'],
  ['프로젝트 기획과 실행'],
  ['UX 리서치 입문', '서비스 기획 실무'],
  ['취업 포트폴리오 완성', '직무 인터뷰 대비'],
  ['강의 운영 설계', '코칭 커뮤니케이션'],
];

export function getMemberWorkspaceBrand(workspace: MemberWorkspace): MemberBrand {
  return WORKSPACE_BRAND_MAP[workspace];
}

function getMemberWorkspaceBrandAliases(workspace: MemberWorkspace): MemberBrand[] {
  return WORKSPACE_BRAND_ALIASES[workspace];
}

export async function loadMemberManagementRows(workspace: MemberWorkspace): Promise<MemberDataLoadResult> {
  const brand = getMemberWorkspaceBrand(workspace);
  const allowedBrands = getMemberWorkspaceBrandAliases(workspace);

  if (!isSupabaseConfigured) {
    return { rows: createMockRows(brand, allowedBrands) };
  }

  const client = getSupabaseClient();

  const [usersResult, applicationsResult, programsResult] = await Promise.all([
    client.from('users').select('*').eq('role', 'USER'),
    client.from('applications').select('*'),
    client.from('programs').select('*'),
  ]);

  const users = (usersResult.data ?? []) as MemberUserRecord[];
  const applications = (applicationsResult.data ?? []) as MemberApplicationRecord[];
  const programs = (programsResult.data ?? []) as MemberProgramRecord[];

  const rows = buildRowsFromSupabase(users, applications, programs, allowedBrands, brand);
  const warning = [usersResult.error, applicationsResult.error, programsResult.error].filter(Boolean).map((error) => error?.message ?? '알 수 없는 오류');

  return {
    rows,
    warning: warning.length ? warning.join(' / ') : undefined,
  };
}

export async function persistMemberTagState(memberId: string, isTagged: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;

  const client = getSupabaseClient();
  const { error } = await client.from('users').update({ tag: isTagged ? 'marked' : null }).eq('id', memberId);

  if (error) throw error;
}

export async function persistMemberMemos(memberId: string, memos: MemberMemoRecord[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const client = getSupabaseClient();
  const { error } = await client.from('users').update({ memos }).eq('id', memberId);

  if (error) throw error;
}

function buildRowsFromSupabase(
  users: MemberUserRecord[],
  applications: MemberApplicationRecord[],
  programs: MemberProgramRecord[],
  allowedBrands: MemberBrand[],
  brand: MemberBrand,
): MemberViewRow[] {
  const programNameById = new Map(programs.map((program) => [program.id, resolveProgramLabel(program)]));
  const scopedUsers = users.filter((user) => allowedBrands.includes((user.brand ?? '').toUpperCase() as MemberBrand));
  const userRows = scopedUsers.length ? scopedUsers : users;

  const appsByUserId = new Map<string, string[]>();
  const appsByContact = new Map<string, string[]>();

  applications
    .filter((application) => allowedBrands.includes((application.brand ?? '') as MemberBrand))
    .forEach((application) => {
      const programName = programNameById.get(application.program_id ?? '') ?? '';
      if (!programName) return;

      if (application.user_id) {
        const userPrograms = appsByUserId.get(application.user_id) ?? [];
        appsByUserId.set(application.user_id, uniqueList([...userPrograms, programName]));
      }

      const contactKey = makeContactKey(application.name ?? '', application.phone ?? '');
      if (contactKey) {
        const contactPrograms = appsByContact.get(contactKey) ?? [];
        appsByContact.set(contactKey, uniqueList([...contactPrograms, programName]));
      }
    });

  return userRows.map((user, index) => {
    const metadata = normalizeMetadata(user.metadata);
    const contactKey = makeContactKey(user.name ?? '', user.phone ?? '');
    const supportPrograms = uniqueList([
      ...(appsByUserId.get(user.id) ?? []),
      ...(contactKey ? appsByContact.get(contactKey) ?? [] : []),
    ]);

    return {
      id: user.id,
      name: user.name ?? '이름 없음',
      ageLabel: formatAgeLabel(resolveAge(user)),
      age: resolveAge(user),
      phone: formatPhone(user.phone),
      status: stringifyValue(metadata.status) || '미확인',
      interest: stringifyValue(metadata.interest) || '미지정',
      smsConsent: typeof user.sms_consent === 'boolean' ? user.sms_consent : null,
      signupLabel: buildSignupLabel(metadata),
      joinedAt: normalizeDateValue(user.created_at),
      joinedAtLabel: formatDateLabel(user.created_at),
      major: stringifyValue(metadata.major) || '미지정',
      job: stringifyValue(metadata.job) || '미지정',
      supportPrograms,
      courseHistory: MOCK_COURSES_BY_INDEX[index % MOCK_COURSES_BY_INDEX.length] ?? [],
      brand: (user.brand as MemberBrand) ?? brand,
      role: String(user.role ?? ''),
      tagValue: normalizeTagValue(user.tag),
      memos: parseMemberMemos(user.memos, brand),
      rawMetadata: metadata,
    };
  });
}

function createMockRows(brand: MemberBrand, allowedBrands: MemberBrand[]): MemberViewRow[] {
  const users = MOCK_USERS.filter((user) => allowedBrands.includes((user.brand ?? '').toUpperCase() as MemberBrand) && isUserRole(user.role));
  const applications = MOCK_APPLICATIONS.filter((application) => allowedBrands.includes((application.brand ?? '').toUpperCase() as MemberBrand));
  return buildRowsFromSupabase(users, applications, MOCK_PROGRAMS.filter((program) => allowedBrands.includes(program.brand as MemberBrand)), allowedBrands, brand);
}

function normalizeMetadata(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> {
  return metadata ?? {};
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).filter(Boolean).join(', ');
  return '';
}

function makeContactKey(name: string, phone: string): string {
  const trimmedName = name.trim();
  const normalizedPhone = phone.replace(/[^\d]/g, '');
  return trimmedName && normalizedPhone ? `${trimmedName}|${normalizedPhone}` : '';
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatPhone(phone?: string | null): string {
  if (!phone) return '미기재';

  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone.includes('-') ? phone : digits || phone;
}

function formatDateLabel(value?: string | null): string {
  if (!value) return '미기재';
  const normalized = normalizeDateValue(value);
  return normalized ? normalized.replace(/-/g, '.') : value;
}

function buildSignupLabel(metadata: Record<string, unknown>): string {
  return metadata.signup_channel === 'kakao' ? '카카오톡 가입' : '홈페이지 가입';
}

function normalizeTagValue(tag: MemberUserRecord['tag']): string | null {
  if (Array.isArray(tag)) {
    return tag.includes('marked') ? 'marked' : null;
  }

  if (typeof tag === 'string') {
    return tag.trim() || null;
  }

  return null;
}

function parseMemberMemos(value: unknown, brand: MemberBrand): MemberMemoRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const record = item as Record<string, unknown>;
      const content = typeof record.content === 'string' ? record.content.trim() : '';
      if (!content) return null;

      return {
        id: typeof record.id === 'string' && record.id.trim() ? record.id : `memo-${Date.now()}`,
        brand: typeof record.brand === 'string' ? record.brand : brand,
        content,
        authorId: typeof record.authorId === 'string' ? record.authorId : '',
        authorOrg: typeof record.authorOrg === 'string' ? record.authorOrg : '',
        createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
        authorName: typeof record.authorName === 'string' ? record.authorName : '',
      } satisfies MemberMemoRecord;
    })
    .filter(Boolean) as MemberMemoRecord[];
}

function resolveAge(user: MemberUserRecord): number | null {
  const rawBirth = extractMetadataBirth(user.metadata);
  if (!rawBirth) return null;

  const birthDate = new Date(rawBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function extractMetadataBirth(metadata?: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const value = metadata.birth ?? metadata.birth_date ?? metadata.birthdate ?? metadata.birthDate;
  return typeof value === 'string' ? value : null;
}

function formatAgeLabel(age: number | null): string {
  return age === null ? '-' : `${age}세`;
}

function resolveProgramLabel(program: MemberProgramRecord): string {
  return program.name ?? program.title ?? program.program_name ?? program.course_name ?? '';
}

function normalizeDateValue(value?: string | null): string {
  if (!value) return '';

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isUserRole(role?: MemberUserRecord['role']): boolean {
  return String(role ?? '').toUpperCase() === 'USER';
}
