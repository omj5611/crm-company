import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';

type SidebarItem = {
  label: string;
  iconSrc: string;
  active?: boolean;
  children?: SidebarItem[];
};

type FavoriteCourse = {
  label: string;
  featured?: boolean;
};

type CompanyRow = {
  name: string;
  businessRegistrationNumber: string;
  tags: string[];
  primaryIndustry: string;
  detailIndustry: string;
  address: string;
  websiteUrl: string;
  websiteLabel: string;
  status: '가입완료' | '미가입';
  region: string;
  industry: string;
  insuredCount: number;
  insuredBand: string;
  participation: string;
  revenueAmount: number;
  revenueBand: string;
  sourcePath: string;
  joinedAt: string;
  updatedAt: string;
  updatedBy?: string;
  description?: string;
  replies: number;
};

type CompanyDetailEditDraft = {
  name: string;
  businessRegistrationNumber: string;
  address: string;
  websiteUrl: string;
  primaryIndustry: string;
  detailIndustries: string[];
  revenueAmount: string;
  insuredCount: string;
  sourcePath: string;
  description: string;
};

type CompanyRegisterDraft = {
  id: string;
  name: string;
  businessRegistrationNumber: string;
  primaryIndustry: string;
  detailIndustry: string;
  detailIndustries: string[];
  address: string;
  websiteLabel: string;
  insuredCount: string;
  participationItems: string[];
  revenueAmount: string;
  description: string;
  contacts: CompanyRegisterContactDraft[];
};

type CompanyRegisterContactDraft = {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  participationItems: string[];
  department: string;
};

type SearchResultKind = '메뉴' | '필터' | '기업' | '즐겨찾기' | '작업';

type SearchResult = {
  id: string;
  label: string;
  kind: SearchResultKind;
  meta?: string;
  targetKey?: string;
  targetPath?: string[];
  targetIconSrc?: string;
};

type OpenTab = {
  id: string;
  label: string;
  iconSrc: string;
  path: string[];
  sidebarLabel?: string;
  companyKey?: string;
};

type CompanyDetailTab = '기업 정보' | '담당자' | '참여 이력' | '보낸 문자' | '파일';

type CompanyDetailContact = {
  id: string;
  companyName: string;
  name: string;
  status: '가입완료' | '미가입';
  joinedAt?: string;
  department: string;
  email: string;
  phone: string;
  participationSummary: string;
  participationItems?: string[];
  marketingConsent: boolean;
};

type CompanyDetailContactEditDraft = {
  id: string;
  companyName: string;
  status: CompanyDetailContact['status'];
  name: string;
  department: string;
  email: string;
  phone: string;
  participationItems: string[];
};

type CompanyParticipationRow = {
  id: string;
  course: string;
  thumbnailLabel: string;
  contactName: string;
  phone: string;
  email: string;
};

type CompanyContactRegisterWarningTooltip = {
  message: string;
  top: number;
  left: number;
};

type RegisterWarningState = {
  messages: string[];
  missingMessages: string[];
  duplicateMessages: string[];
};

type DialogPickerMenuProps = {
  className?: string;
  style?: CSSProperties;
  note?: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchClassName?: string;
  children: ReactNode;
};

type PendingDialogCloseConfirmTarget = 'company_register' | 'company_contact_register';

type ToolbarMenuKey = 'company_page_size' | 'company_sort' | 'contact_page_size' | 'contact_sort' | 'detail_contact_sort';

type ListSortOrder = 'recent_registered' | 'recent_joined' | 'name' | 'oldest_registered';

type ListPageSize = 10 | 20 | 50 | 100;

type ParticipationPopoverState = {
  contactId: string;
  items: string[];
  left: number;
  top: number;
  maxHeight: number;
};

type DownloadHistoryEntry = {
  id: string;
  scope: '기업' | '기업 담당자';
  downloadedAt: string;
  downloadedBy: string;
  appliedFilter: string;
  downloadTarget: string;
  fileName: string;
};

type TableContactMemoPopoverState = {
  contactId: string;
  left: number;
  top: number;
  maxHeight: number;
  pinned: boolean;
};

type StatusToastTone = 'success' | 'error';

type CompanyMemoEntry = {
  id: string;
  date: string;
  author: string;
  memo: string;
  isMine: boolean;
};

type CompanyMemoEditTarget = {
  companyKey: string;
  memoId: string;
} | null;

type PendingDeleteDialog =
  | { kind: 'company_memo'; companyKey: string; memoId: string }
  | { kind: 'contact_memo'; contactId: string; memoId: string }
  | { kind: 'contact_delete'; contactId: string }
  | { kind: 'company_file'; fileId: string }
  | { kind: 'register_draft'; draftId: string }
  | { kind: 'excel_file' }
  | null;

type ContactMemoEntry = {
  id: string;
  memo: string;
  author: string;
  createdAt: string;
  isMine: boolean;
};

type CompanyFileEntry = {
  id: string;
  category: string;
  name: string;
  extension: string;
  sizeLabel: string;
  uploadedAt: string;
  uploadedBy: string;
  previewUrl: string;
  objectUrl: string;
  isImage: boolean;
};

type CompanyExcelPreview = {
  sheetName: string;
  headers: string[];
  rows: string[][];
};

type SidebarUtilityItem = {
  label: string;
  iconSrc: string;
  path?: string[];
  children?: SidebarUtilityItem[];
};

const sidebarItems: SidebarItem[] = [
  {
    label: '교육과정 관리',
    iconSrc: '/assets/edu.svg',
    children: [
      { label: '전체 교육과정 리스트', iconSrc: '/assets/edu.svg' },
      { label: '교육과정 캘린더', iconSrc: '/assets/edu.svg' },
      { label: '상세페이지 FAQ 관리', iconSrc: '/assets/edu.svg' },
    ],
  },
  {
    label: '회원 관리',
    iconSrc: '/assets/users.svg',
    children: [
      { label: '가입 회원 리스트', iconSrc: '/assets/users.svg' },
      { label: '사전 지원자 리스트', iconSrc: '/assets/users.svg' },
      { label: '정식 지원자 리스트', iconSrc: '/assets/users.svg' },
      { label: '오픈 알림 지원자', iconSrc: '/assets/users.svg' },
    ],
  },
  { label: '기업 관리', iconSrc: '/assets/company.svg', active: true },
  { label: '강사 관리', iconSrc: '/assets/lecture.svg' },
  {
    label: '웹사이트 관리',
    iconSrc: '/assets/website.svg',
    children: [
      { label: '배너', iconSrc: '/assets/website.svg' },
      { label: '팝업', iconSrc: '/assets/website.svg' },
      { label: '메인 FAQ', iconSrc: '/assets/website.svg' },
      {
        label: '사업페이지 FAQ',
        iconSrc: '/assets/website.svg',
        children: [
          { label: 'KDT', iconSrc: '/assets/website.svg' },
          { label: '중소기업인재키움', iconSrc: '/assets/website.svg' },
        ],
      },
    ],
  },
  {
    label: '설정 관리',
    iconSrc: '/assets/settings.svg',
    children: [
      { label: '계정 및 권한', iconSrc: '/assets/settings.svg' },
      { label: '약관 관리', iconSrc: '/assets/settings.svg' },
      { label: '내 프로필', iconSrc: '/assets/settings.svg' },
    ],
  },
];

const favoriteCourses: FavoriteCourse[] = [
  { label: 'AI로 완성하는 SNS 마케팅 프로젝트' },
  { label: 'AI로 완성하는 SNS 마케팅 프로젝트' },
  { label: 'AI로 완성하는 SNS 마케팅 프로젝트', featured: true },
];

const contactParticipationCourseOptions = [
  '[미래내일일경험] UXUI 인턴형 프로그램 9기',
  '[미래내일일경험] UXUI 인턴형 프로그램 8기',
  '[미래내일일경험] PM 실무 프로젝트 5기',
  '[KDT] 디지털 서비스 UX 리서치 과정',
  '[미래내일일경험] 데이터 분석 인턴형 프로그램 4기',
  '[미래내일일경험] 프론트엔드 실무 부트캠프 2기',
  'AI로 완성하는 SNS 마케팅 프로젝트',
];

const sidebarQuickLinks: SidebarUtilityItem[] = [
  {
    label: '서비스 바로가기',
    iconSrc: '/assets/service.svg',
    children: [
      { label: '캐치폼', iconSrc: '/assets/catchform.png', path: ['서비스 바로가기', '캐치폼'] },
      { label: 'SFAC 메일 빌더', iconSrc: '/assets/mailbuilder.png', path: ['서비스 바로가기', 'SFAC 메일 빌더'] },
      { label: '알리고', iconSrc: '/assets/alligo.png', path: ['서비스 바로가기', '알리고'] },
      { label: '채널톡', iconSrc: '/assets/channeltalk.png', path: ['서비스 바로가기', '채널톡'] },
      { label: '디자인 요청 노션 페이지', iconSrc: '/assets/notion.png', path: ['서비스 바로가기', '디자인 요청 노션 페이지'] },
    ],
  },
  { label: '사용가이드', iconSrc: '/assets/guide.svg', path: ['사용가이드'] },
  { label: '건의사항', iconSrc: '/assets/problem.svg', path: ['건의사항'] },
];

const initialCompanyDetailContacts: CompanyDetailContact[] = [
  {
    id: 'contact-1',
    companyName: '스나이퍼팩토리',
    name: '홍길동',
    status: '가입완료',
    joinedAt: '2026.02.20',
    department: '교육마케팅',
    email: 'abc@company.com',
    phone: '010-1234-1234',
    participationSummary: '[미래내일일경험] UXUI 인턴형 프로그램 9기 외 3개',
    participationItems: [
      '[미래내일일경험] UXUI 인턴형 프로그램 9기',
      '[미래내일일경험] UXUI 인턴형 프로그램 8기',
      '[미래내일일경험] PM 실무 프로젝트 5기',
      '[KDT] 디지털 서비스 UX 리서치 과정',
    ],
    marketingConsent: true,
  },
  {
    id: 'contact-2',
    companyName: '스나이퍼팩토리',
    name: '김민지',
    status: '미가입',
    department: '교육마케팅',
    email: 'minji@company.com',
    phone: '010-3355-8899',
    participationSummary: '없음',
    participationItems: [],
    marketingConsent: false,
  },
  {
    id: 'contact-3',
    companyName: '스나이퍼팩토리',
    name: '박서준',
    status: '가입완료',
    joinedAt: '2026.01.18',
    department: '사업기획',
    email: 'sj.park@company.com',
    phone: '010-4421-9900',
    participationSummary: '[미래내일일경험] 데이터 분석 인턴형 프로그램 4기',
    participationItems: ['[미래내일일경험] 데이터 분석 인턴형 프로그램 4기'],
    marketingConsent: true,
  },
  {
    id: 'contact-4',
    companyName: '스나이퍼팩토리',
    name: '이하늘',
    status: '가입완료',
    joinedAt: '2025.12.09',
    department: '운영지원',
    email: 'sky.lee@company.com',
    phone: '010-8282-4477',
    participationSummary: '[미래내일일경험] 프론트엔드 실무 부트캠프 2기',
    participationItems: ['[미래내일일경험] 프론트엔드 실무 부트캠프 2기'],
    marketingConsent: true,
  },
];

const initialDownloadHistoryEntries: DownloadHistoryEntry[] = [
  {
    id: 'download-history-1',
    scope: '기업',
    downloadedAt: '2026.06.26 10:32',
    downloadedBy: '오민진(안나)',
    appliedFilter: '검색: 스팩 · 상태: 가입완료 · 점 태그: ON',
    downloadTarget: '선택 다운로드 12건',
    fileName: '기업_선택다운로드_20260626.xlsx',
  },
  {
    id: 'download-history-2',
    scope: '기업',
    downloadedAt: '2026.06.25 15:08',
    downloadedBy: '오민진(안나)',
    appliedFilter: '지역: 서울 · 업종: IT·소프트웨어 외 1 · 참여이력: 참여 이력 있음',
    downloadTarget: '전체 다운로드 48건',
    fileName: '기업_전체다운로드_20260625.xlsx',
  },
  {
    id: 'download-history-3',
    scope: '기업 담당자',
    downloadedAt: '2026.06.26 09:14',
    downloadedBy: '오민진(안나)',
    appliedFilter: '기업: 스나이퍼팩토리 외 1 · 참여 교육과정: UXUI 인턴형 프로그램 9기 · 마케팅수신동의: ON',
    downloadTarget: '선택 다운로드 4건',
    fileName: '기업담당자_선택다운로드_20260626.xlsx',
  },
  {
    id: 'download-history-4',
    scope: '기업 담당자',
    downloadedAt: '2026.06.24 18:22',
    downloadedBy: '오민진(안나)',
    appliedFilter: '가입여부: 가입완료 · 점 태그: ON',
    downloadTarget: '전체 다운로드 31건',
    fileName: '기업담당자_전체다운로드_20260624.xlsx',
  },
];

const actionLabels = ['기업 등록', '문자 보내기', '전체 다운로드', '초기화'];
const defaultSearchHistory = ['기업 등록', '스나이퍼팩토리', '전체 다운로드', '참여이력', '서비스 바로가기'];
const toolbarTagFilterLabel = 'SaaS';
const filterGroups = [
  {
    key: 'region',
    label: '지역 선택',
    iconSrc: '/assets/location.svg',
    options: ['전체', '서울', '경기', '인천'],
  },
  {
    key: 'industry',
    label: '업종 선택',
    options: ['전체', 'IT·소프트웨어', '앱/웹 서비스', '시스템 개발', 'SaaS'],
  },
  {
    key: 'insuredBand',
    label: '피보험자수',
    options: ['전체', '5인 이하', '6인 이상-10인 이하', '11인 이상 - 20인 이하', '21인 이상', '직접 설정'],
  },
  {
    key: 'participation',
    label: '참여이력',
    options: ['전체', '참여 이력 있음', '참여 이력 없음'],
  },
  {
    key: 'revenueBand',
    label: '매출액',
    options: ['전체'],
  },
  {
    key: 'status',
    label: '가입여부',
    options: ['전체', '가입완료', '미가입'],
  },
] as const;
const industryOptions = [
  {
    primary: 'IT·소프트웨어',
    details: ['SaaS', '플랫폼', '앱/웹 서비스', '시스템 개발', 'SI/SM'],
  },
  {
    primary: 'AI·데이터',
    details: ['인공지능', '데이터 분석', '머신러닝', '빅데이터', '자동화'],
  },
  {
    primary: '제조·하드웨어',
    details: ['전자기기', '부품', '장비', '기계', 'IoT 디바이스'],
  },
  {
    primary: '커머스·유통',
    details: ['이커머스', '온라인몰', '리테일', '도소매', '물류 유통'],
  },
  {
    primary: '마케팅·광고',
    details: ['퍼포먼스 마케팅', '콘텐츠 마케팅', '브랜딩', '광고대행'],
  },
  {
    primary: '디자인·콘텐츠',
    details: ['UX/UI', '그래픽 디자인', '영상', '3D', '콘텐츠 제작'],
  },
  {
    primary: '교육·에듀테크',
    details: ['온라인 교육', '직무교육', '학습 플랫폼', '교육 콘텐츠'],
  },
  {
    primary: '금융·핀테크',
    details: ['결제', '투자', '보험', '자산관리', '금융 플랫폼'],
  },
  {
    primary: '헬스케어·바이오',
    details: ['병원', '의료기기', '디지털 헬스케어', '제약', '바이오'],
  },
  {
    primary: '게임·엔터테인먼트',
    details: ['게임 개발', '퍼블리싱', '음악', '영상', 'IP 비즈니스'],
  },
  {
    primary: '미디어·출판',
    details: ['뉴스', '매거진', '출판', '방송', 'MCN'],
  },
  {
    primary: '식품·외식',
    details: ['F&B', '프랜차이즈', '식품 제조', '카페', '레스토랑'],
  },
  {
    primary: '패션·뷰티',
    details: ['의류', '잡화', '화장품', '뷰티 서비스', '라이프스타일 브랜드'],
  },
  {
    primary: '부동산·건설',
    details: ['프롭테크', '건축', '인테리어', '시공', '부동산 플랫폼'],
  },
  {
    primary: '모빌리티·자동차',
    details: ['차량 서비스', '운송', '렌탈', '전기차', '자율주행'],
  },
  {
    primary: '여행·숙박',
    details: ['여행 플랫폼', '숙박', '액티비티', '관광', '레저'],
  },
  {
    primary: '물류·운송',
    details: ['배송', '풀필먼트', '창고', '운송', 'SCM'],
  },
  {
    primary: '환경·에너지',
    details: ['친환경', '재생에너지', '탄소관리', 'ESG', '폐기물 관리'],
  },
  {
    primary: '공공·비영리',
    details: ['공공기관', '지자체', '협회', '재단', 'NGO'],
  },
  {
    primary: '전문서비스',
    details: ['법률', '회계', '컨설팅', 'HR', '리서치'],
  },
  {
    primary: '스타트업·벤처',
    details: ['초기 스타트업', '액셀러레이터', '벤처기업', '창업지원'],
  },
  {
    primary: '기타',
    details: ['분류가 어려운 기업 또는 복합 업종'],
  },
] as const;
const regionOptions = [
  {
    province: '서울특별시',
    districts: [
      { name: '전체', dongs: [] },
      { name: '강남구', dongs: ['역삼동', '삼성동', '논현동'] },
      { name: '마포구', dongs: ['합정동', '서교동', '상암동'] },
      { name: '송파구', dongs: ['잠실동', '가락동', '문정동'] },
    ],
  },
  {
    province: '부산광역시',
    districts: [
      { name: '전체', dongs: [] },
      { name: '해운대구', dongs: ['우동', '좌동', '중동'] },
      { name: '수영구', dongs: ['광안동', '남천동'] },
      { name: '부산진구', dongs: ['서면', '전포동'] },
    ],
  },
  {
    province: '대구광역시',
    districts: [
      { name: '전체', dongs: [] },
      { name: '중구', dongs: ['삼덕동', '동인동'] },
      { name: '수성구', dongs: ['범어동', '만촌동'] },
      { name: '달서구', dongs: ['상인동', '이곡동'] },
    ],
  },
  {
    province: '인천광역시',
    districts: [
      { name: '전체', dongs: [] },
      { name: '연수구', dongs: ['송도동', '옥련동'] },
      { name: '남동구', dongs: ['구월동', '간석동'] },
      { name: '부평구', dongs: ['부평동', '산곡동'] },
    ],
  },
  {
    province: '광주광역시',
    districts: [
      { name: '전체', dongs: [] },
      { name: '서구', dongs: ['치평동', '쌍촌동'] },
      { name: '북구', dongs: ['운암동', '용봉동'] },
      { name: '광산구', dongs: ['수완동', '신가동'] },
    ],
  },
  {
    province: '대전광역시',
    districts: [
      { name: '전체', dongs: [] },
      { name: '서구', dongs: ['둔산동', '탄방동'] },
      { name: '유성구', dongs: ['봉명동', '노은동'] },
      { name: '중구', dongs: ['은행동', '대흥동'] },
    ],
  },
  {
    province: '울산광역시',
    districts: [
      { name: '전체', dongs: [] },
      { name: '남구', dongs: ['삼산동', '무거동'] },
      { name: '중구', dongs: ['성남동', '학성동'] },
      { name: '북구', dongs: ['화봉동', '송정동'] },
    ],
  },
  {
    province: '세종특별자치시',
    districts: [{ name: '전체', dongs: [] }, { name: '세종특별자치시 전체', dongs: ['전체'] }],
  },
] as const;
type FilterKey = (typeof filterGroups)[number]['key'];
type ContactFilterKey = 'contactCompany' | 'contactCourse' | 'contactStatus' | 'companyCourse';
type FilterSelectionState = Record<FilterKey, string>;
const searchResultKinds: SearchResultKind[] = ['기업', '메뉴', '필터', '즐겨찾기', '작업'];
const makeTabId = (path: string[]) => path.join('>');
const insuredBandOptions = ['5인 이하', '6인 이상-10인 이하', '11인 이상 - 20인 이하', '21인 이상'] as const;
const directInsuredLabel = '직접 설정';

const formatNumberWithCommas = (value: string | number) => {
  const normalized = String(value).replace(/[^\d]/g, '');
  if (!normalized) return '';
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/[^\d]/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const formatBusinessRegistrationNumber = (value: string) => {
  const digits = value.replace(/[^\d]/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
};

const isValidEmailFormat = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidPhoneFormat = (value: string) => {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length >= 9 && digits.length <= 11;
};

const parseIndustryDetailList = (value: string) =>
  value
    .split(/[·/|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);

const createCompanyRegisterContactDraft = (companyName = ''): CompanyRegisterContactDraft => ({
  id: `contact-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  companyName,
  phone: '',
  email: '',
  participationItems: [],
  department: '',
});

const createCompanyContactRegisterDraft = (companyName = ''): CompanyRegisterContactDraft => ({
  id: `company-contact-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  companyName,
  phone: '',
  email: '',
  participationItems: [],
  department: '',
});

const createCompanyRegisterDraft = (): CompanyRegisterDraft => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  businessRegistrationNumber: '',
  primaryIndustry: industryOptions[0]?.primary ?? '',
  detailIndustry: industryOptions[0]?.details[0] ?? '',
  detailIndustries: [industryOptions[0]?.details[0] ?? ''].filter(Boolean),
  address: '',
  websiteLabel: '',
  insuredCount: '',
  participationItems: [],
  revenueAmount: '',
  description: '',
  contacts: [],
});

const parseNumericInput = (value: string) => {
  const normalized = value.replace(/[^\d]/g, '');
  return normalized ? Number(normalized) : null;
};

const clampNumericRange = (minValue: number | null, maxValue: number | null) => {
  if (minValue !== null && maxValue !== null && minValue > maxValue) {
    return { minValue: maxValue, maxValue: minValue };
  }
  return { minValue, maxValue };
};

const formatCurrencyLabel = (value: number | null) => (value === null ? '' : `${formatNumberWithCommas(value)}원`);

const formatMemoDate = (date: Date) =>
  `${String(date.getFullYear()).slice(2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

const formatDateTimeLabel = (dateText: string, timeText: string) => (/\d{2}:\d{2}/.test(dateText) ? dateText : `${dateText} ${timeText}`);

const createCompanyDetailContactEditDraft = (contact: CompanyDetailContact): CompanyDetailContactEditDraft => ({
  id: contact.id,
  companyName: contact.companyName,
  status: contact.status,
  name: contact.name,
  department: contact.department,
  email: contact.email,
  phone: contact.phone,
  participationItems:
    contact.participationItems?.length
      ? contact.participationItems
      : contact.participationSummary === '없음'
        ? []
        : [contact.participationSummary.replace(/\s외\s\d+개$/, '')],
});

const summarizeParticipationItems = (items: string[]) => {
  if (!items.length) return '없음';
  return items.length > 1 ? `${items[0]} 외 ${items.length - 1}개` : items[0];
};

const collectCompanyParticipationItems = (contacts: CompanyDetailContact[]) => {
  const itemsByCompany = new Map<string, string[]>();

  contacts.forEach((contact) => {
    const companyName = contact.companyName.trim();
    const participationItems = contact.participationItems ?? [];

    if (!companyName || !participationItems.length) return;

    const nextItems = itemsByCompany.get(companyName) ?? [];
    participationItems.forEach((item) => {
      if (!nextItems.includes(item)) {
        nextItems.push(item);
      }
    });
    itemsByCompany.set(companyName, nextItems);
  });

  return itemsByCompany;
};

function flattenSidebarUtilityItems(items: SidebarUtilityItem[]): SidebarUtilityItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenSidebarUtilityItems(item.children) : [])]);
}

const formatCompanyUpdateDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

const formatUploadDateTime = (date: Date) =>
  `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (name: string) => {
  const lastDotIndex = name.lastIndexOf('.');
  return lastDotIndex >= 0 ? name.slice(lastDotIndex + 1).toLowerCase() : 'file';
};

const isImageFile = (file: File) => file.type.startsWith('image/');

const getInsuredBandRange = (label: string) => {
  switch (label) {
    case '5인 이하':
      return { min: null, max: 5 };
    case '6인 이상-10인 이하':
      return { min: 6, max: 10 };
    case '11인 이상 - 20인 이하':
      return { min: 11, max: 20 };
    case '21인 이상':
      return { min: 21, max: null };
    default:
      return null;
  }
};

const companyMatchesInsuredSelection = (company: CompanyRow, selectedBands: string[], customMin: number | null, customMax: number | null) => {
  const hasBandSelection = selectedBands.length > 0;
  const hasCustomSelection = customMin !== null || customMax !== null;

  if (!hasBandSelection && !hasCustomSelection) return true;

  const matchesBand = hasBandSelection && selectedBands.includes(company.insuredBand);
  const matchesCustom =
    hasCustomSelection &&
    ((customMin === null || company.insuredCount >= customMin) &&
      (customMax === null || company.insuredCount <= customMax));

  return matchesBand || matchesCustom;
};

const companyMatchesRevenueSelection = (company: CompanyRow, minValue: number | null, maxValue: number | null) => {
  if (minValue === null && maxValue === null) return true;

  return (minValue === null || company.revenueAmount >= minValue) && (maxValue === null || company.revenueAmount <= maxValue);
};

const DROPDOWN_EDGE_PADDING = 16;

const formatDownloadTimestamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

const formatDownloadDateStamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

function useDropdownAlignment(isOpen: boolean) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [alignRight, setAlignRight] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen) {
      setAlignRight(false);
      return;
    }

    const updateAlignment = () => {
      const root = rootRef.current;
      const menu = root?.querySelector<HTMLElement>('.filter-dropdown__menu');

      if (!root || !menu) return;

      const rootRect = root.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const wouldOverflowRight = rootRect.left + menuRect.width > window.innerWidth - DROPDOWN_EDGE_PADDING;
      setAlignRight(wouldOverflowRight);
    };

    const rafId = window.requestAnimationFrame(updateAlignment);
    window.addEventListener('resize', updateAlignment);
    window.addEventListener('scroll', updateAlignment, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateAlignment);
      window.removeEventListener('scroll', updateAlignment, true);
    };
  }, [isOpen]);

  return { rootRef, alignRight };
}

const initialCompanyRows: CompanyRow[] = [
  {
    name: '스팩스페이스',
    businessRegistrationNumber: '123-45-67890',
    tags: ['IT·소프트웨어', '앱/웹 서비스', '시스템 개발', 'SaaS'],
    primaryIndustry: 'IT·소프트웨어',
    detailIndustry: 'SaaS',
    address: '서울 강서구 마곡중앙로 59-5 마곡595빌딩 4층',
    websiteUrl: 'https://example.com/spacspace',
    websiteLabel: '홈페이지',
    status: '가입완료',
    region: '서울',
    industry: 'IT·소프트웨어',
    insuredCount: 24,
    insuredBand: '21인 이상',
    participation: '참여 이력 있음',
    revenueAmount: 5200000000,
    revenueBand: '5,200,000,000원',
    sourcePath: '홈페이지 문의',
    joinedAt: '2026.02.20',
    updatedAt: '2026.06.10',
    replies: 1,
    description:
      '디지털 교육과 실무 개발을 결합한 기업 맞춤형 솔루션을 제공합니다.',
  },
  {
    name: '메타플로우',
    businessRegistrationNumber: '234-56-78901',
    tags: ['AI·데이터', '데이터 분석', '머신러닝', '자동화'],
    primaryIndustry: 'AI·데이터',
    detailIndustry: '데이터 분석',
    address: '서울 마포구 월드컵북로 402 KGIT센터 12층',
    websiteUrl: 'https://example.com/metaflow',
    websiteLabel: '홈페이지',
    status: '가입완료',
    region: '서울',
    industry: 'AI·데이터',
    insuredCount: 18,
    insuredBand: '11인 이상 - 20인 이하',
    participation: '참여 이력 있음',
    revenueAmount: 3400000000,
    revenueBand: '3,400,000,000원',
    sourcePath: '검색 광고',
    joinedAt: '2026.01.18',
    updatedAt: '2026.06.03',
    replies: 2,
    description: '데이터 기반 의사결정과 예측 모델링을 지원하는 분석 플랫폼입니다.',
  },
  {
    name: '넥스트코어',
    businessRegistrationNumber: '345-67-89012',
    tags: ['제조·하드웨어', '전자기기', 'IoT 디바이스', '장비'],
    primaryIndustry: '제조·하드웨어',
    detailIndustry: 'IoT 디바이스',
    address: '경기 성남시 분당구 판교역로 235 에이치스퀘어 N동',
    websiteUrl: 'https://example.com/nextcore',
    websiteLabel: '홈페이지',
    status: '미가입',
    region: '경기',
    industry: '제조·하드웨어',
    insuredCount: 9,
    insuredBand: '6인 이상-10인 이하',
    participation: '참여 이력 없음',
    revenueAmount: 980000000,
    revenueBand: '980,000,000원',
    sourcePath: '지인 소개',
    joinedAt: '2025.12.04',
    updatedAt: '2026.05.21',
    replies: 0,
  },
  {
    name: '브릿지커머스',
    businessRegistrationNumber: '456-78-90123',
    tags: ['커머스·유통', '이커머스', '리테일', '물류 유통'],
    primaryIndustry: '커머스·유통',
    detailIndustry: '이커머스',
    address: '서울 송파구 올림픽로 300 롯데월드타워 18층',
    websiteUrl: 'https://example.com/bridgecommerce',
    websiteLabel: '홈페이지',
    status: '가입완료',
    region: '서울',
    industry: '커머스·유통',
    insuredCount: 31,
    insuredBand: '21인 이상',
    participation: '참여 이력 있음',
    revenueAmount: 11200000000,
    revenueBand: '11,200,000,000원',
    sourcePath: '박람회',
    joinedAt: '2026.03.02',
    updatedAt: '2026.06.14',
    replies: 3,
  },
  {
    name: '애드브릿지',
    businessRegistrationNumber: '567-89-01234',
    tags: ['마케팅·광고', '퍼포먼스 마케팅', '브랜딩', '콘텐츠 마케팅'],
    primaryIndustry: '마케팅·광고',
    detailIndustry: '퍼포먼스 마케팅',
    address: '서울 강남구 테헤란로 518 섬유센터빌딩 14층',
    websiteUrl: 'https://example.com/addbridge',
    websiteLabel: '홈페이지',
    status: '미가입',
    region: '서울',
    industry: '마케팅·광고',
    insuredCount: 6,
    insuredBand: '6인 이상-10인 이하',
    participation: '참여 이력 없음',
    revenueAmount: 720000000,
    revenueBand: '720,000,000원',
    sourcePath: '홈페이지 문의',
    joinedAt: '2026.01.09',
    updatedAt: '2026.05.30',
    replies: 1,
  },
  {
    name: '크리에이티브랩',
    businessRegistrationNumber: '678-90-12345',
    tags: ['디자인·콘텐츠', 'UX/UI', '그래픽 디자인', '영상'],
    primaryIndustry: '디자인·콘텐츠',
    detailIndustry: 'UX/UI',
    address: '부산 해운대구 센텀동로 45 센텀벤처타운 9층',
    websiteUrl: 'https://example.com/creativelab',
    websiteLabel: '홈페이지',
    status: '가입완료',
    region: '부산',
    industry: '디자인·콘텐츠',
    insuredCount: 12,
    insuredBand: '11인 이상 - 20인 이하',
    participation: '참여 이력 있음',
    revenueAmount: 2100000000,
    revenueBand: '2,100,000,000원',
    sourcePath: '추천 메일',
    joinedAt: '2026.02.14',
    updatedAt: '2026.06.08',
    replies: 2,
  },
  {
    name: '에듀하버',
    businessRegistrationNumber: '789-01-23456',
    tags: ['교육·에듀테크', '온라인 교육', '학습 플랫폼', '교육 콘텐츠'],
    primaryIndustry: '교육·에듀테크',
    detailIndustry: '온라인 교육',
    address: '대전 유성구 대학로 99 KAIST 연구개발센터',
    websiteUrl: 'https://example.com/eduharbor',
    websiteLabel: '홈페이지',
    status: '미가입',
    region: '대전',
    industry: '교육·에듀테크',
    insuredCount: 4,
    insuredBand: '5인 이하',
    participation: '참여 이력 없음',
    revenueAmount: 380000000,
    revenueBand: '380,000,000원',
    sourcePath: '검색 유입',
    joinedAt: '2025.11.27',
    updatedAt: '2026.05.18',
    replies: 0,
  },
  {
    name: '파이낸스링크',
    businessRegistrationNumber: '890-12-34567',
    tags: ['금융·핀테크', '결제', '자산관리', '금융 플랫폼'],
    primaryIndustry: '금융·핀테크',
    detailIndustry: '금융 플랫폼',
    address: '서울 중구 을지로 100 파이낸스타워 20층',
    websiteUrl: 'https://example.com/financelink',
    websiteLabel: '홈페이지',
    status: '가입완료',
    region: '서울',
    industry: '금융·핀테크',
    insuredCount: 26,
    insuredBand: '21인 이상',
    participation: '참여 이력 있음',
    revenueAmount: 8400000000,
    revenueBand: '8,400,000,000원',
    sourcePath: '파트너 소개',
    joinedAt: '2026.03.18',
    updatedAt: '2026.06.16',
    replies: 4,
  },
  {
    name: '헬스코어',
    businessRegistrationNumber: '901-23-45678',
    tags: ['헬스케어·바이오', '디지털 헬스케어', '의료기기', '바이오'],
    primaryIndustry: '헬스케어·바이오',
    detailIndustry: '디지털 헬스케어',
    address: '인천 연수구 송도과학로 32 송도테크노파크 IT센터',
    websiteUrl: 'https://example.com/healthcore',
    websiteLabel: '홈페이지',
    status: '미가입',
    region: '인천',
    industry: '헬스케어·바이오',
    insuredCount: 15,
    insuredBand: '11인 이상 - 20인 이하',
    participation: '참여 이력 없음',
    revenueAmount: 1450000000,
    revenueBand: '1,450,000,000원',
    sourcePath: '현장 상담',
    joinedAt: '2026.02.08',
    updatedAt: '2026.06.11',
    replies: 1,
  },
  {
    name: '플레이웍스',
    businessRegistrationNumber: '012-34-56789',
    tags: ['게임·엔터테인먼트', '게임 개발', '퍼블리싱', 'IP 비즈니스'],
    primaryIndustry: '게임·엔터테인먼트',
    detailIndustry: '게임 개발',
    address: '서울 강남구 언주로 726 두산빌딩 10층',
    websiteUrl: 'https://example.com/playworks',
    websiteLabel: '홈페이지',
    status: '가입완료',
    region: '서울',
    industry: '게임·엔터테인먼트',
    insuredCount: 22,
    insuredBand: '21인 이상',
    participation: '참여 이력 있음',
    revenueAmount: 6300000000,
    revenueBand: '6,300,000,000원',
    sourcePath: '홈페이지 문의',
    joinedAt: '2026.01.30',
    updatedAt: '2026.06.18',
    replies: 2,
  },
  {
    name: '미디어웨이브',
    businessRegistrationNumber: '123-56-78901',
    tags: ['미디어·출판', '뉴스', 'MCN', '출판'],
    primaryIndustry: '미디어·출판',
    detailIndustry: '뉴스',
    address: '부산 수영구 광안해변로 219 센텀시티빌딩 7층',
    websiteUrl: 'https://example.com/mediawave',
    websiteLabel: '홈페이지',
    status: '미가입',
    region: '부산',
    industry: '미디어·출판',
    insuredCount: 8,
    insuredBand: '6인 이상-10인 이하',
    participation: '참여 이력 없음',
    revenueAmount: 560000000,
    revenueBand: '560,000,000원',
    sourcePath: '이벤트 배너',
    joinedAt: '2025.12.19',
    updatedAt: '2026.05.25',
    replies: 0,
  },
  {
    name: '푸드플래닛',
    businessRegistrationNumber: '234-67-89012',
    tags: ['식품·외식', 'F&B', '프랜차이즈', '레스토랑'],
    primaryIndustry: '식품·외식',
    detailIndustry: 'F&B',
    address: '광주 서구 상무중앙로 110 상무타워 15층',
    websiteUrl: 'https://example.com/foodplanet',
    websiteLabel: '홈페이지',
    status: '가입완료',
    region: '광주',
    industry: '식품·외식',
    insuredCount: 13,
    insuredBand: '11인 이상 - 20인 이하',
    participation: '참여 이력 있음',
    revenueAmount: 2900000000,
    revenueBand: '2,900,000,000원',
    sourcePath: '지인 소개',
    joinedAt: '2026.03.12',
    updatedAt: '2026.06.15',
    replies: 2,
  },
  {
    name: '리빙스톤',
    businessRegistrationNumber: '345-78-90123',
    tags: ['부동산·건설', '프롭테크', '인테리어', '시공'],
    primaryIndustry: '부동산·건설',
    detailIndustry: '프롭테크',
    address: '대구 수성구 동대구로 334 수성아트센터 11층',
    websiteUrl: 'https://example.com/livingstone',
    websiteLabel: '홈페이지',
    status: '미가입',
    region: '대구',
    industry: '부동산·건설',
    insuredCount: 5,
    insuredBand: '5인 이하',
    participation: '참여 이력 없음',
    revenueAmount: 930000000,
    revenueBand: '930,000,000원',
    sourcePath: '검색 유입',
    joinedAt: '2025.11.13',
    updatedAt: '2026.05.09',
    replies: 1,
  },
  {
    name: '모빌리티원',
    businessRegistrationNumber: '456-89-01234',
    tags: ['모빌리티·자동차', '차량 서비스', '운송', '자율주행'],
    primaryIndustry: '모빌리티·자동차',
    detailIndustry: '차량 서비스',
    address: '울산 남구 삼산로 247 현대백화점빌딩 8층',
    websiteUrl: 'https://example.com/mobilityone',
    websiteLabel: '홈페이지',
    status: '가입완료',
    region: '울산',
    industry: '모빌리티·자동차',
    insuredCount: 17,
    insuredBand: '11인 이상 - 20인 이하',
    participation: '참여 이력 있음',
    revenueAmount: 4100000000,
    revenueBand: '4,100,000,000원',
    sourcePath: '파트너 소개',
    joinedAt: '2026.02.27',
    updatedAt: '2026.06.19',
    replies: 2,
  },
  {
    name: '그린웨이브',
    businessRegistrationNumber: '567-90-12345',
    tags: ['환경·에너지', '재생에너지', 'ESG', '탄소관리'],
    primaryIndustry: '환경·에너지',
    detailIndustry: '재생에너지',
    address: '세종특별자치시 한누리대로 2130 세종파이낸스센터 13층',
    websiteUrl: 'https://example.com/greenwave',
    websiteLabel: '홈페이지',
    status: '미가입',
    region: '세종',
    industry: '환경·에너지',
    insuredCount: 7,
    insuredBand: '6인 이상-10인 이하',
    participation: '참여 이력 없음',
    revenueAmount: 650000000,
    revenueBand: '650,000,000원',
    sourcePath: '현장 상담',
    joinedAt: '2025.12.08',
    updatedAt: '2026.05.28',
    replies: 0,
  },
];

const getCompanyKey = (company: CompanyRow, index: number) => `${company.name}-${index}`;

const matchesSearch = (value: string, query: string) => value.toLowerCase().includes(query);

const listPageSizeOptions: ListPageSize[] = [10, 20, 50, 100];

const listSortLabels: Record<ListSortOrder, string> = {
  recent_registered: '최근 등록순',
  recent_joined: '최근 가입순',
  name: '이름순(가나다)',
  oldest_registered: '오래된 등록순',
};

const parseKoreanDateLabel = (value?: string) => {
  if (!value) return 0;
  const normalized = value.trim().replace(/\./g, '-');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

export default function App() {
  const initialCompanyRegisterDraftIdRef = useRef<string>('');
  const sidebarProfileMenuRef = useRef<HTMLDivElement | null>(null);
  const profilePasswordInputRef = useRef<HTMLInputElement | null>(null);
  const defaultSelectedFilters: FilterSelectionState = {
    region: '전체',
    industry: '전체',
    insuredBand: '전체',
    participation: '전체',
    revenueBand: '전체',
    status: '전체',
  };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<'스팩' | '인사'>('스팩');
  const [activeCompanyView, setActiveCompanyView] = useState<'기업' | '기업 담당자'>('기업');
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isCompanyRegisterDialogOpen, setIsCompanyRegisterDialogOpen] = useState(false);
  const [isCompanyExcelRegisterDialogOpen, setIsCompanyExcelRegisterDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => defaultSearchHistory);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [highlightedCompanyKey, setHighlightedCompanyKey] = useState<string | null>(null);
  const [isToolbarTagFilterEnabled, setIsToolbarTagFilterEnabled] = useState(false);
  const [isRegisterMenuOpen, setIsRegisterMenuOpen] = useState(false);
  const [isSidebarProfileMenuOpen, setIsSidebarProfileMenuOpen] = useState(false);
  const [isSidebarServiceMenuOpen, setIsSidebarServiceMenuOpen] = useState(false);
  const [isPasswordChangeDialogOpen, setIsPasswordChangeDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [profilePasswordDraft, setProfilePasswordDraft] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [openFilterKey, setOpenFilterKey] = useState<FilterKey | ContactFilterKey | null>(null);
  const [openToolbarMenuKey, setOpenToolbarMenuKey] = useState<ToolbarMenuKey | null>(null);
  const [companyListPageSize, setCompanyListPageSize] = useState<ListPageSize>(10);
  const [companyListSortOrder, setCompanyListSortOrder] = useState<ListSortOrder>('recent_registered');
  const [contactListPageSize, setContactListPageSize] = useState<ListPageSize>(10);
  const [contactListSortOrder, setContactListSortOrder] = useState<ListSortOrder>('recent_registered');
  const [detailContactSortOrder, setDetailContactSortOrder] = useState<ListSortOrder>('recent_registered');
  const [openCompanyMenuKey, setOpenCompanyMenuKey] = useState<string | null>(null);
  const [activeCompanyReplyPopoverKey, setActiveCompanyReplyPopoverKey] = useState<string | null>(null);
  const [openContactMenuId, setOpenContactMenuId] = useState<string | null>(null);
  const [selectedCompanyKeys, setSelectedCompanyKeys] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [copyToastMounted, setCopyToastMounted] = useState(false);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [statusToastMounted, setStatusToastMounted] = useState(false);
  const [statusToastVisible, setStatusToastVisible] = useState(false);
  const [statusToastMessage, setStatusToastMessage] = useState('');
  const [statusToastTone, setStatusToastTone] = useState<StatusToastTone>('success');
  const [companyTaggedByKey, setCompanyTaggedByKey] = useState<Record<string, boolean>>({});
  const [contactTaggedById, setContactTaggedById] = useState<Record<string, boolean>>({});
  const [contactMemosById, setContactMemosById] = useState<Record<string, ContactMemoEntry[]>>({});
  const [companyTagNotesByKey, setCompanyTagNotesByKey] = useState<Record<string, string>>({});
  const [isCompanyTagDialogOpen, setIsCompanyTagDialogOpen] = useState(false);
  const [isContactTagDialogOpen, setIsContactTagDialogOpen] = useState(false);
  const [activeCompanyTagKey, setActiveCompanyTagKey] = useState<string | null>(null);
  const [activeContactTagId, setActiveContactTagId] = useState<string | null>(null);
  const [activeContactTagDialogSource, setActiveContactTagDialogSource] = useState<'tag' | 'memo'>('tag');
  const [companyTagDialogMode, setCompanyTagDialogMode] = useState<'edit' | 'remove'>('edit');
  const [contactTagDialogMode, setContactTagDialogMode] = useState<'edit' | 'remove'>('edit');
  const [companyTagMemoDraft, setCompanyTagMemoDraft] = useState('');
  const [contactTagMemoDraft, setContactTagMemoDraft] = useState('');
  const [activeContactMemoEditId, setActiveContactMemoEditId] = useState<string | null>(null);
  const [activeContactMemoPopoverId, setActiveContactMemoPopoverId] = useState<string | null>(null);
  const [activeCompanyReplyComposerKey, setActiveCompanyReplyComposerKey] = useState<string | null>(null);
  const [companyDetailTab, setCompanyDetailTab] = useState<CompanyDetailTab>('기업 정보');
  const [isCompanyDetailEditing, setIsCompanyDetailEditing] = useState(false);
  const [companyDetailEditDraft, setCompanyDetailEditDraft] = useState<CompanyDetailEditDraft | null>(null);
  const [companyMemosByKey, setCompanyMemosByKey] = useState<Record<string, CompanyMemoEntry[]>>({});
  const [companyMemoDraftByKey, setCompanyMemoDraftByKey] = useState<Record<string, string>>({});
  const [activeCompanyMemoEditContext, setActiveCompanyMemoEditContext] = useState<CompanyMemoEditTarget>(null);
  const [companyFilesByKey, setCompanyFilesByKey] = useState<Record<string, CompanyFileEntry[]>>({});
  const [companyLogoByKey, setCompanyLogoByKey] = useState<Record<string, string>>({});
  const [isCompanyDetailLogoMenuOpen, setIsCompanyDetailLogoMenuOpen] = useState(false);
  const [companyDetailContacts, setCompanyDetailContacts] = useState<CompanyDetailContact[]>(() => initialCompanyDetailContacts);
  const [isContactEditDialogOpen, setIsContactEditDialogOpen] = useState(false);
  const [contactEditDraft, setContactEditDraft] = useState<CompanyDetailContactEditDraft | null>(null);
  const [openContactEditPicker, setOpenContactEditPicker] = useState<'company' | 'course' | null>(null);
  const [contactEditCompanySearchQuery, setContactEditCompanySearchQuery] = useState('');
  const [contactEditCourseSearchQuery, setContactEditCourseSearchQuery] = useState('');
  const [isCompanyContactRegisterDialogOpen, setIsCompanyContactRegisterDialogOpen] = useState(false);
  const [companyContactRegisterDrafts, setCompanyContactRegisterDrafts] = useState<CompanyRegisterContactDraft[]>([]);
  const [activeCompanyContactRegisterDraftId, setActiveCompanyContactRegisterDraftId] = useState<string | null>(null);
  const [openCompanyContactRegisterCompanyPickerId, setOpenCompanyContactRegisterCompanyPickerId] = useState<string | null>(null);
  const [openCompanyContactRegisterCoursePickerId, setOpenCompanyContactRegisterCoursePickerId] = useState<string | null>(null);
  const [companyContactRegisterCompanySearchQueryById, setCompanyContactRegisterCompanySearchQueryById] = useState<Record<string, string>>({});
  const [companyContactRegisterCourseSearchQueryById, setCompanyContactRegisterCourseSearchQueryById] = useState<Record<string, string>>({});
  const [companyContactRegisterCourseSelectionById, setCompanyContactRegisterCourseSelectionById] = useState<
    Record<string, string[]>
  >({});
  const [companyContactRegisterMode, setCompanyContactRegisterMode] = useState<'detail' | 'company_register'>('detail');
  const [companyContactRegisterTargetCompanyRegisterDraftId, setCompanyContactRegisterTargetCompanyRegisterDraftId] = useState<string | null>(null);
  const [companyContactRegisterLockedCompanyName, setCompanyContactRegisterLockedCompanyName] = useState('');
  const [companyContactRegisterWarningTooltip, setCompanyContactRegisterWarningTooltip] =
    useState<CompanyContactRegisterWarningTooltip | null>(null);
  const [companyRegisterWarningTooltip, setCompanyRegisterWarningTooltip] = useState<CompanyContactRegisterWarningTooltip | null>(
    null,
  );
  const [companyRows, setCompanyRows] = useState<CompanyRow[]>(() => initialCompanyRows);
  const [companyDeleteDialogMode, setCompanyDeleteDialogMode] = useState<'blocked' | 'confirm' | null>(null);
  const [pendingDeleteDialog, setPendingDeleteDialog] = useState<PendingDeleteDialog>(null);
  const [pendingDialogCloseConfirmTarget, setPendingDialogCloseConfirmTarget] = useState<PendingDialogCloseConfirmTarget | null>(null);
  const [isCompanyMemoPanelCollapsed, setIsCompanyMemoPanelCollapsed] = useState(false);
  const [companyRegisterDrafts, setCompanyRegisterDrafts] = useState<CompanyRegisterDraft[]>(() => {
    const firstDraft = createCompanyRegisterDraft();
    initialCompanyRegisterDraftIdRef.current = firstDraft.id;
    return [firstDraft];
  });
  const [activeCompanyRegisterDraftId, setActiveCompanyRegisterDraftId] = useState<string>(
    () => initialCompanyRegisterDraftIdRef.current,
  );
  const [openCompanyRegisterCoursePickerDraftId, setOpenCompanyRegisterCoursePickerDraftId] = useState<string | null>(null);
  const [companyRegisterCourseSearchQuery, setCompanyRegisterCourseSearchQuery] = useState('');
  const [openCompanyRegisterIndustryPickerDraftId, setOpenCompanyRegisterIndustryPickerDraftId] = useState<string | null>(null);
  const [companyRegisterIndustryPickerMode, setCompanyRegisterIndustryPickerMode] = useState<'primary' | 'detail' | null>(null);
  const [companyRegisterIndustrySearchQuery, setCompanyRegisterIndustrySearchQuery] = useState('');
  const companyRegisterPickerAnchorRef = useRef<HTMLElement | null>(null);
  const [companyRegisterPickerMenuStyle, setCompanyRegisterPickerMenuStyle] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const [openCompanyRegisterContactCompanyPickerId, setOpenCompanyRegisterContactCompanyPickerId] = useState<string | null>(null);
  const [openCompanyRegisterContactCoursePickerId, setOpenCompanyRegisterContactCoursePickerId] = useState<string | null>(null);
  const [companyRegisterContactCompanySearchQueryById, setCompanyRegisterContactCompanySearchQueryById] = useState<Record<string, string>>({});
  const [companyRegisterContactCourseSearchQueryById, setCompanyRegisterContactCourseSearchQueryById] = useState<Record<string, string>>({});
  const [regionSearchQuery, setRegionSearchQuery] = useState('');
  const [selectedRegionProvince, setSelectedRegionProvince] = useState<string>('전체');
  const [selectedRegionDistricts, setSelectedRegionDistricts] = useState<string[]>([]);
  const [selectedRegionDongs, setSelectedRegionDongs] = useState<string[]>([]);
  const [industrySearchQuery, setIndustrySearchQuery] = useState('');
  const [activeIndustryPrimary, setActiveIndustryPrimary] = useState<string>(industryOptions[0].primary);
  const [selectedIndustryPrimaries, setSelectedIndustryPrimaries] = useState<string[]>([]);
  const [selectedIndustryDetails, setSelectedIndustryDetails] = useState<string[]>([]);
  const [selectedInsuredBands, setSelectedInsuredBands] = useState<string[]>([]);
  const [insuredCustomMin, setInsuredCustomMin] = useState('');
  const [insuredCustomMax, setInsuredCustomMax] = useState('');
  const [revenueMin, setRevenueMin] = useState('');
  const [revenueMax, setRevenueMax] = useState('');
  const [companyExcelFileName, setCompanyExcelFileName] = useState('');
  const [companyExcelFileMeta, setCompanyExcelFileMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [companyExcelPreview, setCompanyExcelPreview] = useState<CompanyExcelPreview | null>(null);
  const [isCompanyExcelDragging, setIsCompanyExcelDragging] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const companyExcelFileInputRef = useRef<HTMLInputElement | null>(null);
  const companyDetailFileInputRef = useRef<HTMLInputElement | null>(null);
  const companyDetailLogoInputRef = useRef<HTMLInputElement | null>(null);
  const companyDetailLogoMenuRef = useRef<HTMLDivElement | null>(null);
  const titleActionsRef = useRef<HTMLDivElement | null>(null);
  const filtersControlsRef = useRef<HTMLDivElement | null>(null);
  const companyCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimerRef = useRef<number | null>(null);
  const copyToastFrameRef = useRef<number | null>(null);
  const copyToastTimerRef = useRef<number | null>(null);
  const copyToastExitTimerRef = useRef<number | null>(null);
  const statusToastFrameRef = useRef<number | null>(null);
  const statusToastTimerRef = useRef<number | null>(null);
  const statusToastExitTimerRef = useRef<number | null>(null);
  const downloadHistoryPanelCloseTimerRef = useRef<number | null>(null);
  const companyTagDialogInputRef = useRef<HTMLTextAreaElement | null>(null);
  const contactTagDialogInputRef = useRef<HTMLTextAreaElement | null>(null);
  const companyMemoInputRef = useRef<HTMLTextAreaElement | null>(null);
  const participationPopoverHideTimerRef = useRef<number | null>(null);
  const tableContactMemoPopoverHideTimerRef = useRef<number | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<FilterSelectionState>(() => defaultSelectedFilters);
  const [companyCourseFilterQuery, setCompanyCourseFilterQuery] = useState('');
  const [selectedCompanyCourseFilters, setSelectedCompanyCourseFilters] = useState<string[]>([]);
  const [contactCompanyFilterQuery, setContactCompanyFilterQuery] = useState('');
  const [contactCourseFilterQuery, setContactCourseFilterQuery] = useState('');
  const [selectedContactCompanyFilters, setSelectedContactCompanyFilters] = useState<string[]>([]);
  const [selectedContactCourseFilters, setSelectedContactCourseFilters] = useState<string[]>([]);
  const [selectedContactStatusFilter, setSelectedContactStatusFilter] = useState('전체');
  const [isContactMarketingFilterEnabled, setIsContactMarketingFilterEnabled] = useState(false);
  const [isContactTaggedFilterEnabled, setIsContactTaggedFilterEnabled] = useState(false);
  const [activeParticipationPopover, setActiveParticipationPopover] = useState<ParticipationPopoverState | null>(null);
  const [activeTableContactMemoPopover, setActiveTableContactMemoPopover] = useState<TableContactMemoPopoverState | null>(null);
  const [isDownloadHistoryPanelOpen, setIsDownloadHistoryPanelOpen] = useState(false);
  const [isDownloadHistoryPanelMounted, setIsDownloadHistoryPanelMounted] = useState(false);
  const [downloadHistoryEntries, setDownloadHistoryEntries] = useState<DownloadHistoryEntry[]>(() => initialDownloadHistoryEntries);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>(() => [
  {
    id: makeTabId(['기업 관리']),
    label: '기업 관리',
    iconSrc: '/assets/company.svg',
    path: ['기업 관리'],
    sidebarLabel: '기업 관리',
  },
  ]);
  const [activeTabId, setActiveTabId] = useState(() => makeTabId(['기업 관리']));
  const [tabHistory, setTabHistory] = useState<{ stack: string[]; index: number }>(() => ({
    stack: [makeTabId(['기업 관리'])],
    index: 0,
  }));
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      sidebarItems
        .filter((item) => item.children?.length)
        .map((item) => [item.label, false]),
    ),
  );
  const activeCompanyRegisterDraft =
    companyRegisterDrafts.find((draft) => draft.id === activeCompanyRegisterDraftId) ?? companyRegisterDrafts[0];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const flatSidebarItems = useMemo(() => flattenSidebarItems(sidebarItems), []);

  const searchResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];
    if (!normalizedQuery) return results;

    const matchesQuery = (value: string) => !normalizedQuery || matchesSearch(value, normalizedQuery);

    flatSidebarItems.forEach((item) => {
      if (matchesQuery(item.label)) {
        results.push({
          id: `menu-${makeTabId(item.path)}`,
          label: item.label,
          kind: '메뉴',
          meta: item.path.length > 1 ? item.path.slice(0, -1).join(' · ') : '사이드바 메뉴',
          targetPath: item.path,
          targetIconSrc: item.iconSrc,
        });
      }
    });

    filterGroups.forEach(({ label }) => {
      if (matchesQuery(label)) {
        results.push({
          id: `filter-${label}`,
          label,
          kind: '필터',
          meta: '필터 영역',
        });
      }
    });

    actionLabels.forEach((label) => {
      if (matchesQuery(label)) {
        results.push({
          id: `action-${label}`,
          label,
          kind: '작업',
          meta: '목록 작업',
        });
      }
    });

    favoriteCourses.forEach((course, index) => {
      if (matchesQuery(course.label)) {
        results.push({
          id: `favorite-${index}`,
          label: course.label,
          kind: '즐겨찾기',
          meta: '즐겨찾는 교육과정',
        });
      }
    });

    flattenSidebarUtilityItems(sidebarQuickLinks).forEach((item) => {
      if (!item.path) return;
      if (matchesQuery(item.label)) {
        results.push({
          id: `utility-${makeTabId(item.path)}`,
          label: item.label,
          kind: '메뉴',
          meta: '사이드바 도움 메뉴',
          targetPath: item.path,
          targetIconSrc: item.iconSrc,
        });
      }
    });

    companyRows.forEach((company, index) => {
      const haystack = [company.name, company.address, company.websiteLabel, company.status, company.description ?? '', ...company.tags].join(' ');
      if (matchesQuery(haystack)) {
        const companyKey = getCompanyKey(company, index);
        results.push({
          id: `company-${companyKey}`,
          label: company.name,
          kind: '기업',
          meta: [company.address, company.status, company.tags[0]].filter(Boolean).join(' · '),
          targetKey: companyKey,
        });
      }
    });

    return results;
  }, [normalizedQuery]);

  const searchResultsByKind = useMemo(() => {
    return searchResultKinds.reduce<Record<SearchResultKind, SearchResult[]>>((acc, kind) => {
      acc[kind] = searchResults.filter((result) => result.kind === kind);
      return acc;
    }, { 메뉴: [], 필터: [], 기업: [], 즐겨찾기: [], 작업: [] });
  }, [searchResults]);
  const companyParticipationItemsByName = useMemo(
    () => collectCompanyParticipationItems(companyDetailContacts),
    [companyDetailContacts],
  );

  const visibleCompanyRows = useMemo(() => {
    const normalizedCompanyQuery = companySearchQuery.trim().toLowerCase();
    const selectedProvinceLabel = selectedRegionProvince === '전체' ? '' : selectedRegionProvince.replace(/특별시|광역시|특별자치시/g, '');
    const selectedIndustryPrimarySet = new Set(selectedIndustryPrimaries);
    const selectedIndustryDetailSet = new Set(selectedIndustryDetails);
    const parsedInsuredMin = parseNumericInput(insuredCustomMin);
    const parsedInsuredMax = parseNumericInput(insuredCustomMax);
    const parsedRevenueMin = parseNumericInput(revenueMin);
    const parsedRevenueMax = parseNumericInput(revenueMax);
    const insuredRange = clampNumericRange(parsedInsuredMin, parsedInsuredMax);
    const revenueRange = clampNumericRange(parsedRevenueMin, parsedRevenueMax);

    return companyRows.flatMap((company, index) => {
      const companyKey = getCompanyKey(company, index);
      const companyParticipationItems = companyParticipationItemsByName.get(company.name) ?? [];
      const matchesCompanyQuery =
        !normalizedCompanyQuery ||
        [company.name, company.address, company.websiteLabel, company.status, company.region, company.industry, company.insuredBand, company.participation, company.revenueBand, company.description ?? '', ...company.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalizedCompanyQuery);

      const matchesCompanyCourse =
        selectedCompanyCourseFilters.length === 0 ||
        selectedCompanyCourseFilters.some((course) => companyParticipationItems.includes(course));

      const matchesSelectedFilters =
        (selectedRegionProvince === '전체' || company.region === selectedProvinceLabel || company.address.includes(selectedProvinceLabel)) &&
        (selectedRegionDistricts.length === 0 || selectedRegionDistricts.some((district) => district === '전체' || company.address.includes(district))) &&
        (selectedRegionDongs.length === 0 || selectedRegionDongs.some((dong) => company.address.includes(dong))) &&
        (selectedIndustryPrimarySet.size === 0 || Array.from(selectedIndustryPrimarySet).some((primary) => company.industry === primary || company.tags.includes(primary))) &&
        (selectedIndustryDetailSet.size === 0 ||
          company.tags.some((tag) =>
            Array.from(selectedIndustryDetailSet).some((selected) => {
              if (selected.endsWith(' 전체')) {
                const primary = selected.replace(/\s전체$/, '');
                const option = industryOptions.find((item) => item.primary === primary);
                return option ? company.industry === primary || company.tags.some((companyTag) => option.details.includes(companyTag)) : false;
              }

              return tag === selected;
            }),
          )) &&
        companyMatchesInsuredSelection(
          company,
          selectedInsuredBands.filter((band) => band !== directInsuredLabel),
          selectedInsuredBands.includes(directInsuredLabel) ? insuredRange.minValue : null,
          selectedInsuredBands.includes(directInsuredLabel) ? insuredRange.maxValue : null,
        ) &&
        companyMatchesRevenueSelection(company, revenueRange.minValue, revenueRange.maxValue) &&
        (selectedFilters.participation === '전체' || company.participation === selectedFilters.participation) &&
        (selectedFilters.status === '전체' || company.status === selectedFilters.status) &&
        (!isToolbarTagFilterEnabled || company.tags.includes(toolbarTagFilterLabel));

      if (!matchesCompanyQuery || !matchesCompanyCourse || !matchesSelectedFilters) return [];
      return [{ company, companyKey }];
    });
  }, [
    companySearchQuery,
    companyParticipationItemsByName,
    isToolbarTagFilterEnabled,
    selectedFilters,
    selectedCompanyCourseFilters,
    selectedRegionProvince,
    selectedRegionDistricts,
    selectedRegionDongs,
    selectedIndustryPrimaries,
    selectedIndustryDetails,
    selectedInsuredBands,
    insuredCustomMin,
    insuredCustomMax,
    revenueMin,
    revenueMax,
  ]);

  const activeTab = openTabs.find((tab) => tab.id === activeTabId) ?? openTabs[0];
  const activeTabLabel = activeTab?.sidebarLabel ?? activeTab?.label ?? '기업 관리';
  const canGoBack = tabHistory.index > 0;
  const canGoForward = tabHistory.index < tabHistory.stack.length - 1;
  const selectedDetailCompany = useMemo(() => {
    if (!highlightedCompanyKey) return null;

    const matched =
      visibleCompanyRows.find((entry) => entry.companyKey === highlightedCompanyKey)?.company ??
      companyRows.find((company, index) => getCompanyKey(company, index) === highlightedCompanyKey) ??
      null;

    return matched;
  }, [highlightedCompanyKey, visibleCompanyRows, companyRows]);
  const isCompanyDetailView = activeCompanyView === '기업' && Boolean(selectedDetailCompany);
  const defaultCompanyMemoEntries = useMemo<CompanyMemoEntry[]>(
    () => [
      {
        id: 'sample-memo-1',
        date: '26.02.20',
        author: '오민진(안나)',
        memo: '다음 일경험 교육과정에 참여하고 싶어함. 나중에 메일 보내기',
        isMine: true,
      },
      {
        id: 'sample-memo-2',
        date: '26.02.20',
        author: '오민진(안나)',
        memo: '다음 일경험 교육과정에 참여하고 싶어함. 나중에 메일 보내기',
        isMine: true,
      },
    ],
    [],
  );
  const selectedDetailCompanyKey = highlightedCompanyKey;
  const activeCompanyMemoEntries = selectedDetailCompanyKey
    ? companyMemosByKey[selectedDetailCompanyKey] ?? defaultCompanyMemoEntries
    : defaultCompanyMemoEntries;
  const orderedCompanyMemoEntries = useMemo(() => [...activeCompanyMemoEntries].reverse(), [activeCompanyMemoEntries]);
  const activeCompanyMemoDraft = selectedDetailCompanyKey ? companyMemoDraftByKey[selectedDetailCompanyKey] ?? '' : '';
  const activeCompanyMemoEditTarget =
    activeCompanyMemoEditContext?.companyKey === selectedDetailCompanyKey
      ? activeCompanyMemoEntries.find((memo) => memo.id === activeCompanyMemoEditContext.memoId) ?? null
      : null;
  const activeCompanyFiles = selectedDetailCompanyKey ? companyFilesByKey[selectedDetailCompanyKey] ?? [] : [];
  const activeCompanyLogoFiles = activeCompanyFiles.filter((file) => file.category === '로고');
  const activeCompanyLogoSrc = selectedDetailCompanyKey ? companyLogoByKey[selectedDetailCompanyKey] ?? '' : '';
  const isDetailCompanyTagged = selectedDetailCompanyKey ? Boolean(companyTaggedByKey[selectedDetailCompanyKey]) : false;
  const hasJoinedCompanyContact = companyDetailContacts.some((contact) => contact.status === '가입완료');
  const isCompanyDeleteDisabled = Boolean(selectedDetailCompany && (selectedDetailCompany.status === '가입완료' || hasJoinedCompanyContact));
  const contactCompanyOptions = useMemo(() => Array.from(new Set(companyRows.map((company) => company.name))), [companyRows]);
  const contactParticipationOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...contactParticipationCourseOptions,
          ...favoriteCourses.map((course) => course.label),
          ...companyDetailContacts.flatMap((contact) => contact.participationItems ?? []),
        ]),
      ),
    [companyDetailContacts],
  );
  const companyRegisterCompanyOptions = useMemo(
    () => Array.from(new Set([...companyRows.map((company) => company.name), ...companyRegisterDrafts.map((draft) => draft.name).filter(Boolean)])),
    [companyRows, companyRegisterDrafts],
  );
  const activeCompanyContactRegisterDraft = useMemo(
    () => companyContactRegisterDrafts.find((draft) => draft.id === activeCompanyContactRegisterDraftId) ?? companyContactRegisterDrafts[0] ?? null,
    [companyContactRegisterDrafts, activeCompanyContactRegisterDraftId],
  );
  const activeCompanyContactRegisterDraftCourses = useMemo(
    () => activeCompanyContactRegisterDraft?.participationItems ?? [],
    [activeCompanyContactRegisterDraft],
  );
  const companyContactRegisterWarningsById = useMemo(() => {
    const contactKeyToIds = new Map<string, string[]>();

    companyContactRegisterDrafts.forEach((draft) => {
      const normalizedName = draft.name.trim().toLowerCase();
      const normalizedPhone = draft.phone.replace(/[^\d]/g, '');
      if (!normalizedName || !normalizedPhone) return;

      const contactKey = `${normalizedName}|${normalizedPhone}`;
      contactKeyToIds.set(contactKey, [...(contactKeyToIds.get(contactKey) ?? []), draft.id]);
    });

    return Object.fromEntries(
      companyContactRegisterDrafts.map((draft) => {
        const normalizedName = draft.name.trim().toLowerCase();
        const normalizedPhone = draft.phone.replace(/[^\d]/g, '');
        const duplicateIds =
          normalizedName && normalizedPhone ? (contactKeyToIds.get(`${normalizedName}|${normalizedPhone}`) ?? []).filter((id) => id !== draft.id) : [];
        const missingMessages: string[] = [];
        const duplicateMessages: string[] = [];

        if (!draft.name.trim()) missingMessages.push('담당자명을 입력해 주세요.');
        if (!draft.companyName.trim()) missingMessages.push('기업을 선택해 주세요.');
        if (!draft.phone.trim()) missingMessages.push('연락처를 입력해 주세요.');

        if (duplicateIds.length) {
          const duplicateLabels = duplicateIds
            .map((id) => {
              const matched = companyContactRegisterDrafts.find((item) => item.id === id);
              return matched?.name.trim() || '담당자';
            })
            .filter(Boolean);

          duplicateMessages.push(
            `담당자 리스트에서 ${duplicateLabels.map((label) => `"${label}"`).join(', ')}와 담당자명과 연락처가 중복됩니다.`,
          );
        }

        const messages = [...missingMessages, ...duplicateMessages];

        return [
          draft.id,
          {
            messages,
            missingMessages,
            duplicateMessages,
          },
        ] as const;
      }),
    ) as Record<string, RegisterWarningState>;
  }, [companyContactRegisterDrafts]);
  const companyContactRegisterValidationById = useMemo(() => {
    return Object.fromEntries(
      companyContactRegisterDrafts.map((draft) => {
        const errors: string[] = [];
        if (!draft.name.trim()) errors.push('담당자명을 입력해 주세요.');
        if (!draft.companyName.trim()) errors.push('기업을 선택해 주세요.');
        if (!draft.phone.trim()) errors.push('연락처를 입력해 주세요.');
        if (draft.email.trim() && !isValidEmailFormat(draft.email)) errors.push('이메일 형식이 올바르지 않습니다.');
        if (draft.phone.trim() && !isValidPhoneFormat(draft.phone)) errors.push('연락처 형식이 올바르지 않습니다.');
        return [draft.id, errors] as const;
      }),
    ) as Record<string, string[]>;
  }, [companyContactRegisterDrafts]);
  const filteredContactEditCompanyOptions = useMemo(() => {
    const normalizedQuery = contactEditCompanySearchQuery.trim().toLowerCase();
    return contactCompanyOptions.filter((companyName) => !normalizedQuery || companyName.toLowerCase().includes(normalizedQuery));
  }, [contactCompanyOptions, contactEditCompanySearchQuery]);
  const filteredContactEditCourseOptions = useMemo(() => {
    const normalizedQuery = contactEditCourseSearchQuery.trim().toLowerCase();
    return contactParticipationOptions.filter((course) => !normalizedQuery || course.toLowerCase().includes(normalizedQuery));
  }, [contactParticipationOptions, contactEditCourseSearchQuery]);
  const activeCompanyRegisterPrimaryOption =
    industryOptions.find((option) => option.primary === activeCompanyRegisterDraft?.primaryIndustry) ?? industryOptions[0];
  const filteredCompanyRegisterIndustryOptions = industryOptions.filter((option) => {
    const normalizedIndustryQuery = companyRegisterIndustrySearchQuery.trim().toLowerCase();
    if (!normalizedIndustryQuery) return true;
    return (
      option.primary.toLowerCase().includes(normalizedIndustryQuery) ||
      option.details.some((detail) => detail.toLowerCase().includes(normalizedIndustryQuery))
    );
  });
  const companyRegisterIndustryDetailOptions = [
    `${activeCompanyRegisterPrimaryOption.primary} 전체`,
    ...activeCompanyRegisterPrimaryOption.details,
  ].filter((detail) => {
    const normalizedIndustryQuery = companyRegisterIndustrySearchQuery.trim().toLowerCase();
    if (!normalizedIndustryQuery) return true;
    return (
      detail.toLowerCase().includes(normalizedIndustryQuery) ||
      activeCompanyRegisterPrimaryOption.primary.toLowerCase().includes(normalizedIndustryQuery)
    );
  });
  const companyRegisterDetailIndustryLabels = activeCompanyRegisterDraft
    ? activeCompanyRegisterDraft.detailIndustries.length
      ? activeCompanyRegisterDraft.detailIndustries.join(', ')
      : activeCompanyRegisterDraft.detailIndustry
    : '';
  const companyRegisterWarningsById = useMemo(() => {
    const companyNameToIds = new Map<string, string[]>();
    const businessNumberToIds = new Map<string, string[]>();

    [...companyRows.map((company, index) => ({ id: `row-${index}`, name: company.name, businessRegistrationNumber: company.businessRegistrationNumber })), ...companyRegisterDrafts].forEach(
      (company) => {
        const normalizedName = company.name.trim().toLowerCase();
        const normalizedBusinessNumber = company.businessRegistrationNumber.replace(/[^\d]/g, '');

        if (normalizedName) {
          companyNameToIds.set(normalizedName, [...(companyNameToIds.get(normalizedName) ?? []), company.id]);
        }

        if (normalizedBusinessNumber) {
          businessNumberToIds.set(normalizedBusinessNumber, [
            ...(businessNumberToIds.get(normalizedBusinessNumber) ?? []),
            company.id,
          ]);
        }
      },
    );

    return Object.fromEntries(
      companyRegisterDrafts.map((draft) => {
        const normalizedName = draft.name.trim().toLowerCase();
        const normalizedBusinessNumber = draft.businessRegistrationNumber.replace(/[^\d]/g, '');
        const missingMessages: string[] = [];
        const duplicateMessages: string[] = [];

        if (!draft.name.trim()) missingMessages.push('기업명을 입력해 주세요.');
        if (!draft.businessRegistrationNumber.trim()) missingMessages.push('사업자등록번호를 입력해 주세요.');
        if (!draft.primaryIndustry.trim()) missingMessages.push('1차 업종을 선택해 주세요.');
        if (!draft.detailIndustries.length) missingMessages.push('세부 업종을 선택해 주세요.');

        const duplicateNameIds =
          normalizedName ? (companyNameToIds.get(normalizedName) ?? []).filter((id) => id !== draft.id) : [];
        const duplicateBusinessNumberIds =
          normalizedBusinessNumber ? (businessNumberToIds.get(normalizedBusinessNumber) ?? []).filter((id) => id !== draft.id) : [];

        if (duplicateNameIds.length) {
          const duplicateLabels = duplicateNameIds
            .map((id) => {
              const matchedDraft = companyRegisterDrafts.find((item) => item.id === id);
              if (matchedDraft) return matchedDraft.name.trim() || `기업 ${companyRegisterDrafts.findIndex((item) => item.id === id) + 1}`;

              const matchedRow = companyRows.find((company) => company.name.trim().toLowerCase() === normalizedName);
              return matchedRow?.name ?? '기존 기업';
            })
            .filter(Boolean);

          duplicateMessages.push(
            `기업 리스트에서 ${duplicateLabels.map((label) => `"${label}"`).join(', ')}와 기업명이 중복됩니다.`,
          );
        }

        if (duplicateBusinessNumberIds.length) {
          const duplicateLabels = duplicateBusinessNumberIds
            .map((id) => {
              const matchedDraft = companyRegisterDrafts.find((item) => item.id === id);
              if (matchedDraft) return matchedDraft.businessRegistrationNumber || `기업 ${companyRegisterDrafts.findIndex((item) => item.id === id) + 1}`;

              const matchedRow = companyRows.find(
                (company) => company.businessRegistrationNumber.replace(/[^\d]/g, '') === normalizedBusinessNumber,
              );
              return matchedRow?.businessRegistrationNumber ?? '기존 기업';
            })
            .filter(Boolean);

          duplicateMessages.push(
            `기업 리스트에서 ${duplicateLabels.map((label) => `"${label}"`).join(', ')}와 사업자등록번호가 중복됩니다.`,
          );
        }

        const messages = [...missingMessages, ...duplicateMessages];

        return [
          draft.id,
          {
            messages,
            missingMessages,
            duplicateMessages,
          },
        ] as const;
      }),
    ) as Record<string, RegisterWarningState>;
  }, [companyRegisterDrafts, companyRows]);
  const companyRegisterContactWarningsByDraftId = useMemo(() => {
    return Object.fromEntries(
      companyRegisterDrafts.map((draft) => {
        const warningByContactId = Object.fromEntries(
          draft.contacts.map((contact) => {
            const normalizedName = contact.name.trim().toLowerCase();
            const normalizedPhone = contact.phone.replace(/[^\d]/g, '');
            const missingMessages: string[] = [];
            const duplicateMessages: string[] = [];

            if (!contact.name.trim()) missingMessages.push('담당자명을 입력해 주세요.');
            if (!contact.phone.trim()) missingMessages.push('연락처를 입력해 주세요.');

            if (normalizedName && normalizedPhone) {
              const contactKey = `${normalizedName}|${normalizedPhone}`;
              const duplicateIds = draft.contacts
                .map((item, itemIndex) => ({ item, itemIndex }))
                .filter(({ item }) => item.id !== contact.id && `${item.name.trim().toLowerCase()}|${item.phone.replace(/[^\d]/g, '')}` === contactKey);

              if (duplicateIds.length) {
                const duplicateLabels = duplicateIds.map(({ item, itemIndex }) => item.name.trim() || `담당자 ${itemIndex + 1}`);
                duplicateMessages.push(
                  `담당자 리스트에서 ${duplicateLabels.map((label) => `"${label}"`).join(', ')}와 담당자명과 연락처가 중복됩니다.`,
                );
              }
            }

            const messages = [...missingMessages, ...duplicateMessages];

            return [
              contact.id,
              {
                messages,
                missingMessages,
                duplicateMessages,
              },
            ] as const;
          }),
        );

        return [draft.id, warningByContactId] as const;
      }),
    ) as Record<string, Record<string, RegisterWarningState>>;
  }, [companyRegisterDrafts]);
  const activeCompanyRegisterWarnings = activeCompanyRegisterDraft ? companyRegisterWarningsById[activeCompanyRegisterDraft.id] : null;

  const updateCompanyRegisterPickerMenuPosition = (anchorElement: HTMLElement) => {
    const anchorRect = anchorElement.getBoundingClientRect();
    const viewportGap = 16;
    const menuWidth = Math.min(700, window.innerWidth - viewportGap * 2);
    const left = Math.min(Math.max(anchorRect.left, viewportGap), Math.max(viewportGap, window.innerWidth - viewportGap - menuWidth));
    const top = anchorRect.bottom + 8;

    companyRegisterPickerAnchorRef.current = anchorElement;
    setCompanyRegisterPickerMenuStyle((current) => {
      if (current && current.left === left && current.top === top && current.width === menuWidth) {
        return current;
      }

      return {
        left,
        top,
        width: menuWidth,
      };
    });
  };

  useLayoutEffect(() => {
    if (!companyRegisterPickerMenuStyle || !companyRegisterPickerAnchorRef.current) return;

    const updateMenuPosition = () => {
      if (!companyRegisterPickerAnchorRef.current) return;
      updateCompanyRegisterPickerMenuPosition(companyRegisterPickerAnchorRef.current);
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [companyRegisterPickerMenuStyle]);

  const filteredCompanyRegisterCourseOptions = contactParticipationOptions.filter((course) =>
    course.toLowerCase().includes(companyRegisterCourseSearchQuery.trim().toLowerCase()),
  );
  const companyCourseFilterOptions = useMemo(() => contactParticipationOptions, [contactParticipationOptions]);
  const contactCompanyFilterOptions = useMemo(() => contactCompanyOptions, [contactCompanyOptions]);
  const contactCourseFilterOptions = useMemo(() => contactParticipationOptions, [contactParticipationOptions]);
  const contactStatusFilterOptions = useMemo(() => ['전체', '가입완료', '미가입'], []);
  const companyCourseFilterLabel = selectedCompanyCourseFilters.length
    ? `${selectedCompanyCourseFilters[0]}${selectedCompanyCourseFilters.length > 1 ? ` 외 ${selectedCompanyCourseFilters.length - 1}` : ''}`
    : '참여 교육과정';
  const contactCompanyFilterLabel = selectedContactCompanyFilters.length
    ? `${selectedContactCompanyFilters[0]}${selectedContactCompanyFilters.length > 1 ? ` 외 ${selectedContactCompanyFilters.length - 1}` : ''}`
    : '기업 필터';
  const contactCourseFilterLabel = selectedContactCourseFilters.length
    ? `${selectedContactCourseFilters[0]}${selectedContactCourseFilters.length > 1 ? ` 외 ${selectedContactCourseFilters.length - 1}` : ''}`
    : '참여 교육과정';
  const visibleCompanyContacts = useMemo(() => {
    const normalizedContactQuery = contactSearchQuery.trim().toLowerCase();

    return companyDetailContacts.filter((contact) => {
      const matchesQuery =
        !normalizedContactQuery ||
        [contact.name, contact.companyName, contact.department, contact.email, contact.phone, ...(contact.participationItems ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(normalizedContactQuery);

      const matchesCompany =
        selectedContactCompanyFilters.length === 0 || selectedContactCompanyFilters.includes(contact.companyName);
      const matchesCourse =
        selectedContactCourseFilters.length === 0 ||
        selectedContactCourseFilters.some((course) => Boolean(contact.participationItems?.includes(course)));
      const matchesStatus = selectedContactStatusFilter === '전체' || contact.status === selectedContactStatusFilter;
      const matchesMarketing = !isContactMarketingFilterEnabled || contact.marketingConsent;
      const matchesTagged = !isContactTaggedFilterEnabled || Boolean(contactTaggedById[contact.id]);

      return matchesQuery && matchesCompany && matchesCourse && matchesStatus && matchesMarketing && matchesTagged;
    });
  }, [
    companyDetailContacts,
    contactSearchQuery,
    selectedContactCompanyFilters,
    selectedContactCourseFilters,
    selectedContactStatusFilter,
    isContactMarketingFilterEnabled,
    isContactTaggedFilterEnabled,
    contactTaggedById,
  ]);
  const sortedCompanyDetailContacts = useMemo(() => {
    const next = [...companyDetailContacts];

    next.sort((left, right) => {
      if (detailContactSortOrder === 'name') {
        return left.name.localeCompare(right.name, 'ko');
      }

      const leftDate = parseKoreanDateLabel(left.joinedAt);
      const rightDate = parseKoreanDateLabel(right.joinedAt);
      return detailContactSortOrder === 'oldest_registered' ? leftDate - rightDate : rightDate - leftDate;
    });

    return next;
  }, [companyDetailContacts, detailContactSortOrder]);
  const selectedCompanyParticipationRows = useMemo<CompanyParticipationRow[]>(() => {
    if (!selectedDetailCompany) return [];

    return sortedCompanyDetailContacts.flatMap((contact) => {
      const participationItems =
        contact.participationItems?.length
          ? contact.participationItems
          : contact.participationSummary === '없음'
            ? []
            : [contact.participationSummary.replace(/\s외\s\d+개$/, '')];

      return participationItems.map((course, index) => ({
        id: `${contact.id}-${course}-${index}`,
        course,
        thumbnailLabel: course.trim().slice(0, 2) || 'ED',
        contactName: contact.name,
        phone: contact.phone,
        email: contact.email,
      }));
    });
  }, [selectedDetailCompany, sortedCompanyDetailContacts]);
  const sortedVisibleCompanyRows = useMemo(() => {
    const next = [...visibleCompanyRows];

    next.sort((left, right) => {
      if (companyListSortOrder === 'name') {
        return left.company.name.localeCompare(right.company.name, 'ko');
      }

      const leftDate =
        companyListSortOrder === 'recent_joined' || companyListSortOrder === 'oldest_registered'
          ? parseKoreanDateLabel(left.company.joinedAt)
          : parseKoreanDateLabel(left.company.updatedAt);
      const rightDate =
        companyListSortOrder === 'recent_joined' || companyListSortOrder === 'oldest_registered'
          ? parseKoreanDateLabel(right.company.joinedAt)
          : parseKoreanDateLabel(right.company.updatedAt);

      return companyListSortOrder === 'oldest_registered' ? leftDate - rightDate : rightDate - leftDate;
    });

    return next;
  }, [companyListSortOrder, visibleCompanyRows]);
  const pagedVisibleCompanyRows = useMemo(
    () => sortedVisibleCompanyRows.slice(0, companyListPageSize),
    [companyListPageSize, sortedVisibleCompanyRows],
  );
  const sortedVisibleCompanyContacts = useMemo(() => {
    const next = [...visibleCompanyContacts];

    next.sort((left, right) => {
      if (contactListSortOrder === 'name') {
        return left.name.localeCompare(right.name, 'ko');
      }

      const leftDate =
        contactListSortOrder === 'oldest_registered'
          ? parseKoreanDateLabel(left.joinedAt)
          : parseKoreanDateLabel(left.joinedAt);
      const rightDate =
        contactListSortOrder === 'oldest_registered'
          ? parseKoreanDateLabel(right.joinedAt)
          : parseKoreanDateLabel(right.joinedAt);

      return contactListSortOrder === 'oldest_registered' ? leftDate - rightDate : rightDate - leftDate;
    });

    return next;
  }, [contactListSortOrder, visibleCompanyContacts]);
  const pagedVisibleCompanyContacts = useMemo(
    () => sortedVisibleCompanyContacts.slice(0, contactListPageSize),
    [contactListPageSize, sortedVisibleCompanyContacts],
  );
  const companyDetailPrimaryIndustryOption = companyDetailEditDraft
    ? industryOptions.find((option) => option.primary === companyDetailEditDraft.primaryIndustry) ?? null
    : null;
  const allVisibleCompanyKeys = useMemo(() => pagedVisibleCompanyRows.map((entry) => entry.companyKey), [pagedVisibleCompanyRows]);
  const selectedVisibleCompanyKeys = useMemo(
    () => selectedCompanyKeys.filter((key) => allVisibleCompanyKeys.includes(key)),
    [allVisibleCompanyKeys, selectedCompanyKeys],
  );
  const areAllVisibleCompaniesSelected = allVisibleCompanyKeys.length > 0 && selectedVisibleCompanyKeys.length === allVisibleCompanyKeys.length;
  const hasAnyCompanySelection = selectedCompanyKeys.length > 0;
  const allCompanyContactIds = useMemo(() => pagedVisibleCompanyContacts.map((contact) => contact.id), [pagedVisibleCompanyContacts]);
  const selectedVisibleContactIds = useMemo(
    () => selectedContactIds.filter((id) => allCompanyContactIds.includes(id)),
    [selectedContactIds, allCompanyContactIds],
  );
  const areAllCompanyContactsSelected = allCompanyContactIds.length > 0 && selectedVisibleContactIds.length === allCompanyContactIds.length;
  const hasAnyCompanyContactSelection = selectedVisibleContactIds.length > 0;
  const visibleDownloadHistoryEntries = useMemo(
    () => downloadHistoryEntries.filter((entry) => entry.scope === activeCompanyView),
    [activeCompanyView, downloadHistoryEntries],
  );

  const regionDisplayLabel =
    selectedRegionProvince === '전체'
      ? '지역 선택'
      : selectedRegionDistricts.length || selectedRegionDongs.length
        ? `${selectedRegionProvince} ${[...selectedRegionDistricts, ...selectedRegionDongs].slice(0, 1).join(' ')}${
            selectedRegionDistricts.length + selectedRegionDongs.length > 1 ? ` 외 ${selectedRegionDistricts.length + selectedRegionDongs.length - 1}` : ''
          }`
        : selectedRegionProvince;

  const industryDisplayLabel =
    selectedIndustryPrimaries.length || selectedIndustryDetails.length
      ? `${selectedIndustryPrimaries[0] ?? selectedIndustryDetails[0] ?? '업종 선택'}${
          selectedIndustryPrimaries.length + selectedIndustryDetails.length > 1 ? ` 외 ${selectedIndustryPrimaries.length + selectedIndustryDetails.length - 1}` : ''
        }`
      : '업종 선택';

  const insuredDisplayLabel = useMemo(() => {
    const selectedBands = selectedInsuredBands.filter((band) => band !== directInsuredLabel);
    const hasDirect = selectedInsuredBands.includes(directInsuredLabel);
    const customRangeLabel =
      hasDirect && (insuredCustomMin || insuredCustomMax)
        ? `${insuredCustomMin || '0'}${insuredCustomMax ? `~${insuredCustomMax}` : '~'}명`
        : '';
    const displayValues = [...selectedBands, customRangeLabel, hasDirect && !customRangeLabel ? directInsuredLabel : ''].filter(Boolean);

    if (!displayValues.length) return '피보험자수';
    return `${displayValues[0]}${displayValues.length > 1 ? ` 외 ${displayValues.length - 1}` : ''}`;
  }, [insuredCustomMax, insuredCustomMin, selectedInsuredBands]);

  const revenueDisplayLabel = useMemo(() => {
    if (!revenueMin && !revenueMax) return '매출액';
    const minLabel = revenueMin ? `${revenueMin}원` : '';
    const maxLabel = revenueMax ? `${revenueMax}원` : '';
    if (minLabel && maxLabel) return `${minLabel}~${maxLabel}`;
    return minLabel || maxLabel || '매출액';
  }, [revenueMax, revenueMin]);

  const companyDownloadFilterSummary = useMemo(() => {
    const parts = [
      companySearchQuery.trim() ? `검색: ${companySearchQuery.trim()}` : '',
      selectedCompanyCourseFilters.length ? `참여 교육과정: ${companyCourseFilterLabel}` : '',
      selectedRegionProvince !== '전체' ? `지역: ${regionDisplayLabel}` : '',
      selectedIndustryPrimaries.length || selectedIndustryDetails.length ? `업종: ${industryDisplayLabel}` : '',
      selectedInsuredBands.length ? `피보험자수: ${insuredDisplayLabel}` : '',
      selectedFilters.participation !== '전체' ? `참여이력: ${selectedFilters.participation}` : '',
      selectedFilters.status !== '전체' ? `가입여부: ${selectedFilters.status}` : '',
      revenueMin || revenueMax ? `매출액: ${revenueDisplayLabel}` : '',
      isToolbarTagFilterEnabled ? '점 태그: ON' : '',
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : '적용 필터 없음';
  }, [
    companySearchQuery,
    companyCourseFilterLabel,
    industryDisplayLabel,
    insuredDisplayLabel,
    isToolbarTagFilterEnabled,
    regionDisplayLabel,
    revenueDisplayLabel,
    revenueMax,
    revenueMin,
    selectedCompanyCourseFilters.length,
    selectedFilters.participation,
    selectedFilters.status,
    selectedIndustryDetails.length,
    selectedIndustryPrimaries.length,
    selectedInsuredBands.length,
    selectedRegionProvince,
  ]);

  const contactDownloadFilterSummary = useMemo(() => {
    const parts = [
      contactSearchQuery.trim() ? `검색: ${contactSearchQuery.trim()}` : '',
      selectedContactCompanyFilters.length ? `기업: ${contactCompanyFilterLabel}` : '',
      selectedContactCourseFilters.length ? `참여 교육과정: ${contactCourseFilterLabel}` : '',
      selectedContactStatusFilter !== '전체' ? `가입여부: ${selectedContactStatusFilter}` : '',
      isContactMarketingFilterEnabled ? '마케팅수신동의: ON' : '',
      isContactTaggedFilterEnabled ? '점 태그: ON' : '',
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : '적용 필터 없음';
  }, [
    contactCompanyFilterLabel,
    contactCourseFilterLabel,
    contactSearchQuery,
    isContactMarketingFilterEnabled,
    isContactTaggedFilterEnabled,
    selectedContactCompanyFilters.length,
    selectedContactCourseFilters.length,
    selectedContactStatusFilter,
  ]);

  const openDownloadHistoryPanel = () => {
    if (downloadHistoryPanelCloseTimerRef.current !== null) {
      window.clearTimeout(downloadHistoryPanelCloseTimerRef.current);
      downloadHistoryPanelCloseTimerRef.current = null;
    }

    setIsDownloadHistoryPanelMounted(true);
    window.requestAnimationFrame(() => {
      setIsDownloadHistoryPanelOpen(true);
    });
  };

  const closeDownloadHistoryPanel = () => {
    setIsDownloadHistoryPanelOpen(false);
    if (downloadHistoryPanelCloseTimerRef.current !== null) {
      window.clearTimeout(downloadHistoryPanelCloseTimerRef.current);
    }
    downloadHistoryPanelCloseTimerRef.current = window.setTimeout(() => {
      setIsDownloadHistoryPanelMounted(false);
      downloadHistoryPanelCloseTimerRef.current = null;
    }, 240);
  };

  const appendDownloadHistoryEntry = (scope: '기업' | '기업 담당자', downloadTarget: string, fileName: string, appliedFilter: string) => {
    setDownloadHistoryEntries((current) => [
      {
        id: `download-history-${Date.now()}`,
        scope,
        downloadedAt: formatDownloadTimestamp(),
        downloadedBy: '오민진(안나)',
        appliedFilter,
        downloadTarget,
        fileName,
      },
      ...current,
    ]);
  };

  const handleCompanyDownload = () => {
    const itemCount = hasAnyCompanySelection ? selectedCompanyKeys.length : visibleCompanyRows.length;
    const downloadTarget = hasAnyCompanySelection ? `선택 다운로드 ${itemCount}건` : `전체 다운로드 ${itemCount}건`;
    const fileName = `기업_${hasAnyCompanySelection ? '선택' : '전체'}다운로드_${formatDownloadDateStamp()}.xlsx`;
    appendDownloadHistoryEntry('기업', downloadTarget, fileName, companyDownloadFilterSummary);
  };

  const handleCompanyContactDownload = () => {
    const itemCount = hasAnyCompanyContactSelection ? selectedVisibleContactIds.length : visibleCompanyContacts.length;
    const downloadTarget = hasAnyCompanyContactSelection ? `선택 다운로드 ${itemCount}건` : `전체 다운로드 ${itemCount}건`;
    const fileName = `기업담당자_${hasAnyCompanyContactSelection ? '선택' : '전체'}다운로드_${formatDownloadDateStamp()}.xlsx`;
    appendDownloadHistoryEntry('기업 담당자', downloadTarget, fileName, contactDownloadFilterSummary);
  };

  const downloadHistoryPanel = (
    <aside
      className={`download-history-panel ${
        isDownloadHistoryPanelOpen ? 'download-history-panel--open' : 'download-history-panel--closing'
      }`}
      aria-label={`${activeCompanyView} 다운로드 이력`}
    >
      <div className="download-history-panel__header">
        <div>
          <div className="download-history-panel__eyebrow">히스토리</div>
          <h3 className="download-history-panel__title">{activeCompanyView} 다운로드 이력</h3>
        </div>
        <button type="button" className="download-history-panel__close" onClick={closeDownloadHistoryPanel} aria-label="다운로드 이력 패널 닫기">
          <AssetIcon src="/assets/close.svg" className="download-history-panel__close-icon" />
        </button>
      </div>

      <div className="download-history-panel__body">
        <div className="download-history-panel__summary">
          <span>총 {visibleDownloadHistoryEntries.length}건</span>
          <span>최근 기록 순</span>
        </div>

        <div className="download-history-panel__table-wrap">
          <table className="download-history-panel__table">
            <colgroup>
              <col className="download-history-panel__col download-history-panel__col--datetime" />
              <col className="download-history-panel__col download-history-panel__col--person" />
              <col className="download-history-panel__col download-history-panel__col--filter" />
              <col className="download-history-panel__col download-history-panel__col--target" />
              <col className="download-history-panel__col download-history-panel__col--file" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">다운로드 일시</th>
                <th scope="col">다운로드한 사람</th>
                <th scope="col">적용 필터</th>
                <th scope="col">다운로드 범위</th>
                <th scope="col">파일명</th>
              </tr>
            </thead>
            <tbody>
              {visibleDownloadHistoryEntries.length ? (
                visibleDownloadHistoryEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.downloadedAt}</td>
                    <td>{entry.downloadedBy}</td>
                    <td>{entry.appliedFilter}</td>
                    <td>{entry.downloadTarget}</td>
                    <td>{entry.fileName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="download-history-panel__empty">
                    아직 다운로드 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </aside>
  );

  const activeTableContactMemoItems = activeTableContactMemoPopover
    ? contactMemosById[activeTableContactMemoPopover.contactId] ?? []
    : [];

  const resetAllFilters = () => {
    setCompanySearchQuery('');
    setCompanyCourseFilterQuery('');
    setSelectedCompanyCourseFilters([]);
    setSelectedFilters(defaultSelectedFilters);
    setSelectedRegionProvince('전체');
    setSelectedRegionDistricts([]);
    setSelectedRegionDongs([]);
    setRegionSearchQuery('');
    setSelectedIndustryPrimaries([]);
    setSelectedIndustryDetails([]);
    setIndustrySearchQuery('');
    setActiveIndustryPrimary(industryOptions[0].primary);
    setSelectedInsuredBands([]);
    setInsuredCustomMin('');
    setInsuredCustomMax('');
    setRevenueMin('');
    setRevenueMax('');
    setOpenFilterKey(null);
  };

  const resetContactFilters = () => {
    setContactSearchQuery('');
    setContactCompanyFilterQuery('');
    setContactCourseFilterQuery('');
    setSelectedContactCompanyFilters([]);
    setSelectedContactCourseFilters([]);
    setSelectedContactStatusFilter('전체');
    setIsContactMarketingFilterEnabled(false);
    setIsContactTaggedFilterEnabled(false);
    setOpenFilterKey(null);
  };

  const toggleVisibleCompaniesSelection = (checked: boolean) => {
    setSelectedCompanyKeys((current) => {
      if (!checked) {
        return current.filter((key) => !allVisibleCompanyKeys.includes(key));
      }

      const merged = new Set(current);
      allVisibleCompanyKeys.forEach((key) => merged.add(key));
      return Array.from(merged);
    });
  };

  const toggleCompanySelection = (companyKey: string) => {
    setSelectedCompanyKeys((current) =>
      current.includes(companyKey) ? current.filter((key) => key !== companyKey) : [...current, companyKey],
    );
  };

  const toggleAllCompanyContactsSelection = (checked: boolean) => {
    setSelectedContactIds((current) => {
      if (!checked) {
        return current.filter((id) => !allCompanyContactIds.includes(id));
      }

      const merged = new Set(current);
      allCompanyContactIds.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
  };

  const clearParticipationPopoverHideTimer = () => {
    if (participationPopoverHideTimerRef.current !== null) {
      window.clearTimeout(participationPopoverHideTimerRef.current);
      participationPopoverHideTimerRef.current = null;
    }
  };

  const closeParticipationPopover = () => {
    clearParticipationPopoverHideTimer();
    setActiveParticipationPopover(null);
  };

  const clearTableContactMemoPopoverHideTimer = () => {
    if (tableContactMemoPopoverHideTimerRef.current !== null) {
      window.clearTimeout(tableContactMemoPopoverHideTimerRef.current);
      tableContactMemoPopoverHideTimerRef.current = null;
    }
  };

  const closeTableContactMemoPopover = () => {
    clearTableContactMemoPopoverHideTimer();
    setActiveTableContactMemoPopover(null);
  };

  const scheduleTableContactMemoPopoverClose = () => {
    clearTableContactMemoPopoverHideTimer();
    tableContactMemoPopoverHideTimerRef.current = window.setTimeout(() => {
      setActiveTableContactMemoPopover((current) => (current?.pinned ? current : null));
      tableContactMemoPopoverHideTimerRef.current = null;
    }, 80);
  };

  const openTableContactMemoPopover = (contactId: string, anchorElement: HTMLElement, pinned = false) => {
    clearTableContactMemoPopoverHideTimer();

    const overlayGap = 16;
    const desiredWidth = Math.min(300, window.innerWidth - overlayGap * 2);
    const anchorRect = anchorElement.getBoundingClientRect();
    const left = Math.min(
      Math.max(anchorRect.left + anchorRect.width / 2 - desiredWidth / 2, overlayGap),
      Math.max(overlayGap, window.innerWidth - desiredWidth - overlayGap),
    );
    const top = Math.min(
      Math.max(anchorRect.bottom + 8, overlayGap),
      Math.max(overlayGap, window.innerHeight - overlayGap - 160),
    );
    const maxHeight = Math.max(160, window.innerHeight - top - overlayGap);

    setActiveTableContactMemoPopover({
      contactId,
      left,
      top,
      maxHeight,
      pinned,
    });
  };

  const scheduleParticipationPopoverClose = () => {
    clearParticipationPopoverHideTimer();
    participationPopoverHideTimerRef.current = window.setTimeout(() => {
      setActiveParticipationPopover(null);
      participationPopoverHideTimerRef.current = null;
    }, 80);
  };

  const openParticipationPopover = (contactId: string, items: string[], anchorElement: HTMLElement) => {
    clearParticipationPopoverHideTimer();

    const overlayGap = 16;
    const desiredWidth = Math.min(280, window.innerWidth - overlayGap * 2);
    const anchorRect = anchorElement.getBoundingClientRect();
    const left = Math.min(
      Math.max(anchorRect.left, overlayGap),
      Math.max(overlayGap, window.innerWidth - desiredWidth - overlayGap),
    );
    const top = anchorRect.bottom + 8;
    const maxHeight = Math.max(120, window.innerHeight - top - overlayGap);

    setActiveParticipationPopover({
      contactId,
      items,
      left,
      top,
      maxHeight,
    });
  };

  useEffect(() => {
    if (!activeParticipationPopover) return;

    const handleViewportChange = () => {
      setActiveParticipationPopover(null);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [activeParticipationPopover]);

  useEffect(() => {
    return () => {
      if (participationPopoverHideTimerRef.current !== null) {
        window.clearTimeout(participationPopoverHideTimerRef.current);
      }
      if (tableContactMemoPopoverHideTimerRef.current !== null) {
        window.clearTimeout(tableContactMemoPopoverHideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeTableContactMemoPopover) return;

    const handleViewportChange = () => {
      setActiveTableContactMemoPopover(null);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [activeTableContactMemoPopover]);

  const toggleCompanyContactSelection = (contactId: string) => {
    setSelectedContactIds((current) =>
      current.includes(contactId) ? current.filter((id) => id !== contactId) : [...current, contactId],
    );
  };

  const toggleContactCompanyFilter = (companyName: string) => {
    setSelectedContactCompanyFilters((current) =>
      current.includes(companyName) ? current.filter((item) => item !== companyName) : [...current, companyName],
    );
  };

  const toggleCompanyCourseFilter = (courseName: string) => {
    setSelectedCompanyCourseFilters((current) =>
      current.includes(courseName) ? current.filter((item) => item !== courseName) : [...current, courseName],
    );
  };

  const toggleContactCourseFilter = (courseName: string) => {
    setSelectedContactCourseFilters((current) =>
      current.includes(courseName) ? current.filter((item) => item !== courseName) : [...current, courseName],
    );
  };

  const openCompanyTagDialog = (companyKey: string) => {
    setCompanyTagDialogMode('edit');
    setActiveCompanyTagKey(companyKey);
    setCompanyTagMemoDraft('');
    setIsCompanyTagDialogOpen(true);
  };

  const openCompanyTagRemovalDialog = (companyKey: string) => {
    setCompanyTagDialogMode('remove');
    setActiveCompanyTagKey(companyKey);
    setCompanyTagMemoDraft(companyTagNotesByKey[companyKey] ?? '');
    setIsCompanyTagDialogOpen(true);
  };

  const closeCompanyTagDialog = () => {
    setIsCompanyTagDialogOpen(false);
    setActiveCompanyTagKey(null);
    setCompanyTagMemoDraft('');
  };

  const saveCompanyTagMemo = () => {
    if (!activeCompanyTagKey) return;

    const nextMemo = companyTagMemoDraft.trim();
    setCompanyTagNotesByKey((current) => {
      const next = { ...current };
      if (nextMemo) next[activeCompanyTagKey] = nextMemo;
      else delete next[activeCompanyTagKey];
      return next;
    });
    setCompanyTaggedByKey((current) => ({
      ...current,
      [activeCompanyTagKey]: true,
    }));

    if (nextMemo) {
      const nextTagMemoEntry: CompanyMemoEntry = {
        id: `tag-memo-${activeCompanyTagKey}-${Date.now()}`,
        date: formatMemoDate(new Date()),
        author: '오민진(안나)',
        memo: nextMemo,
        isMine: true,
      };

      setCompanyMemosByKey((current) => ({
        ...current,
        [activeCompanyTagKey]: [...(current[activeCompanyTagKey] ?? []), nextTagMemoEntry],
      }));
    }

    closeCompanyTagDialog();
  };

  const confirmCompanyTagRemoval = () => {
    if (!activeCompanyTagKey) return;

    setCompanyTaggedByKey((current) => ({
      ...current,
      [activeCompanyTagKey]: false,
    }));
    setCompanyTagNotesByKey((current) => {
      const next = { ...current };
      delete next[activeCompanyTagKey];
      return next;
    });
    closeCompanyTagDialog();
  };

const createCompanyDetailEditDraft = (company: CompanyRow): CompanyDetailEditDraft => ({
  name: company.name,
  businessRegistrationNumber: company.businessRegistrationNumber,
  address: company.address,
  websiteUrl: company.websiteUrl,
  primaryIndustry: company.primaryIndustry,
  detailIndustries: parseIndustryDetailList(company.detailIndustry),
  revenueAmount: company.revenueAmount.toLocaleString('ko-KR'),
  insuredCount: company.insuredCount.toLocaleString('ko-KR'),
  sourcePath: company.sourcePath,
  description: company.description ?? '',
});

  const startCompanyDetailEdit = () => {
    if (!selectedDetailCompany) return;
    setCompanyDetailEditDraft(createCompanyDetailEditDraft(selectedDetailCompany));
    setIsCompanyDetailEditing(true);
  };

  const cancelCompanyDetailEdit = () => {
    setIsCompanyDetailEditing(false);
    setCompanyDetailEditDraft(null);
  };

  const updateCompanyDetailEditDraft = (field: keyof CompanyDetailEditDraft, value: string) => {
    setCompanyDetailEditDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const updateCompanyDetailIndustryDraft = (primaryIndustry: string) => {
    const matchedOption = industryOptions.find((option) => option.primary === primaryIndustry) ?? industryOptions[0];
    setCompanyDetailEditDraft((current) =>
      current
        ? {
            ...current,
            primaryIndustry: matchedOption.primary,
            detailIndustries: matchedOption.details[0] ? [matchedOption.details[0]] : [],
          }
        : current,
    );
  };

  const toggleCompanyDetailIndustryDraft = (detailIndustry: string) => {
    setCompanyDetailEditDraft((current) =>
      current
        ? {
            ...current,
            detailIndustries: current.detailIndustries.includes(detailIndustry)
              ? current.detailIndustries.filter((item) => item !== detailIndustry)
              : [...current.detailIndustries, detailIndustry],
          }
        : current,
    );
  };

  const saveCompanyDetailEdit = () => {
    if (!selectedDetailCompanyKey || !companyDetailEditDraft) return;

    let nextSelectedKey = selectedDetailCompanyKey;
    setCompanyRows((current) =>
      current.map((company, index) => {
        if (getCompanyKey(company, index) !== selectedDetailCompanyKey) return company;

        const revenueAmount = parseNumericInput(companyDetailEditDraft.revenueAmount) ?? 0;
        const insuredCount = parseNumericInput(companyDetailEditDraft.insuredCount) ?? 0;
        const nextCompany: CompanyRow = {
          ...company,
          name: companyDetailEditDraft.name.trim() || company.name,
          businessRegistrationNumber: companyDetailEditDraft.businessRegistrationNumber.trim() || company.businessRegistrationNumber,
          address: companyDetailEditDraft.address.trim(),
          websiteUrl: companyDetailEditDraft.websiteUrl.trim(),
          websiteLabel: companyDetailEditDraft.websiteUrl.trim() || company.websiteLabel,
          primaryIndustry: companyDetailEditDraft.primaryIndustry.trim() || company.primaryIndustry,
          detailIndustry: companyDetailEditDraft.detailIndustries.length
            ? companyDetailEditDraft.detailIndustries.join(' · ')
            : company.detailIndustry,
          industry: companyDetailEditDraft.primaryIndustry.trim() || company.industry,
          revenueAmount,
          revenueBand: formatCurrencyLabel(revenueAmount),
          insuredCount,
          insuredBand: insuredCount >= 21 ? '21인 이상' : insuredCount >= 11 ? '11인 이상 - 20인 이하' : insuredCount >= 6 ? '6인 이상-10인 이하' : '5인 이하',
          sourcePath: companyDetailEditDraft.sourcePath.trim(),
          description: companyDetailEditDraft.description.trim() || undefined,
          updatedAt: formatCompanyUpdateDateTime(new Date()),
          updatedBy: '오민진(안나)',
        };
        nextSelectedKey = getCompanyKey(nextCompany, index);
        return nextCompany;
      }),
    );
    setHighlightedCompanyKey(nextSelectedKey);
    cancelCompanyDetailEdit();
  };

  const openContactEditDialog = (contact: CompanyDetailContact) => {
    setOpenContactMenuId(null);
    setContactEditDraft(createCompanyDetailContactEditDraft(contact));
    setOpenContactEditPicker(null);
    setContactEditCompanySearchQuery('');
    setContactEditCourseSearchQuery('');
    setIsContactEditDialogOpen(true);
  };

  const closeContactEditDialog = () => {
    setIsContactEditDialogOpen(false);
    setContactEditDraft(null);
    setOpenContactEditPicker(null);
    setContactEditCompanySearchQuery('');
    setContactEditCourseSearchQuery('');
  };

  const handleContactEditDraftChange = (
    field: keyof Omit<CompanyDetailContactEditDraft, 'id' | 'participationItems' | 'status'>,
    value: string,
  ) => {
    setContactEditDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const toggleContactEditParticipationItem = (course: string) => {
    setContactEditDraft((current) =>
      current
        ? {
            ...current,
            participationItems: current.participationItems.includes(course)
              ? current.participationItems.filter((item) => item !== course)
              : [...current.participationItems, course],
          }
        : current,
    );
  };

  const saveContactEdit = () => {
    if (!contactEditDraft) return;
    const isJoinedContact = contactEditDraft.status === '가입완료';
    const nextParticipationItems = contactEditDraft.participationItems;
    const nextParticipationSummary = summarizeParticipationItems(nextParticipationItems);
    const companyParticipationItemsByName = collectCompanyParticipationItems(
      companyDetailContacts.map((contact) =>
        contact.id === contactEditDraft.id
          ? {
              ...contact,
              companyName: isJoinedContact ? contact.companyName : contactEditDraft.companyName.trim() || contact.companyName,
              participationItems: nextParticipationItems,
            }
          : contact,
      ),
    );

    setCompanyDetailContacts((current) =>
      current.map((contact) =>
        contact.id === contactEditDraft.id
          ? {
              ...contact,
              companyName: isJoinedContact ? contact.companyName : contactEditDraft.companyName.trim() || contact.companyName,
              name: isJoinedContact ? contact.name : contactEditDraft.name.trim() || contact.name,
              department: isJoinedContact ? contact.department : contactEditDraft.department.trim(),
              email: isJoinedContact ? contact.email : contactEditDraft.email.trim(),
              phone: isJoinedContact ? contact.phone : contactEditDraft.phone.trim(),
              participationSummary: nextParticipationSummary,
              participationItems: nextParticipationItems,
            }
          : contact,
      ),
    );

    setCompanyRows((current) =>
      current.map((company) => {
        const participationItems = companyParticipationItemsByName.get(company.name);

        if (!participationItems) return company;

        return {
          ...company,
          participation: participationItems.length ? '참여 이력 있음' : '참여 이력 없음',
        };
      }),
    );

    closeContactEditDialog();
  };

  const openContactTagDialog = (contactId: string) => {
    openContactTagDialogWithSource(contactId, 'tag');
  };

  const openContactTagDialogWithSource = (contactId: string, source: 'tag' | 'memo') => {
    setContactTagDialogMode('edit');
    setActiveContactTagId(contactId);
    setActiveContactMemoEditId(null);
    setContactTagMemoDraft('');
    setActiveContactTagDialogSource(source);
    setIsContactTagDialogOpen(true);
    setActiveContactMemoPopoverId(null);
  };

  const openContactTagRemovalDialog = (contactId: string) => {
    setContactTagDialogMode('remove');
    setActiveContactTagId(contactId);
    setActiveContactMemoEditId(null);
    setContactTagMemoDraft('');
    setActiveContactTagDialogSource('tag');
    setIsContactTagDialogOpen(true);
    setActiveContactMemoPopoverId(null);
  };

  const openContactMemoEditDialog = (contactId: string, memo: ContactMemoEntry) => {
    if (!memo.isMine) return;
    setContactTagDialogMode('edit');
    setActiveContactTagId(contactId);
    setActiveContactMemoEditId(memo.id);
    setContactTagMemoDraft(memo.memo);
    setActiveContactTagDialogSource('memo');
    setIsContactTagDialogOpen(true);
    setActiveContactMemoPopoverId(null);
  };

  const closeContactTagDialog = () => {
    setIsContactTagDialogOpen(false);
    setActiveContactTagId(null);
    setActiveContactMemoEditId(null);
    setContactTagMemoDraft('');
    setActiveContactTagDialogSource('tag');
  };

  const saveContactTagMemo = () => {
    if (!activeContactTagId) return;

    const nextMemo = contactTagMemoDraft.trim();
    if (!nextMemo) return;

    setContactMemosById((current) => {
      const currentMemos = current[activeContactTagId] ?? [];
      const nextMemos = activeContactMemoEditId
        ? currentMemos.map((memo) =>
            memo.id === activeContactMemoEditId
              ? {
                  ...memo,
                  memo: nextMemo,
                  createdAt: formatCompanyUpdateDateTime(new Date()),
                }
              : memo,
          )
        : [
            ...currentMemos,
            {
              id: `contact-memo-${activeContactTagId}-${Date.now()}`,
              memo: nextMemo,
              author: '오민진(안나)',
              createdAt: formatCompanyUpdateDateTime(new Date()),
              isMine: true,
            },
          ];

      return {
        ...current,
        [activeContactTagId]: nextMemos,
      };
    });
    if (activeContactTagDialogSource === 'tag') {
      setContactTaggedById((current) => ({
        ...current,
        [activeContactTagId]: true,
      }));
    }
    closeContactTagDialog();
  };

  const confirmContactTagRemoval = () => {
    if (!activeContactTagId) return;

    setContactTaggedById((current) => ({
      ...current,
      [activeContactTagId]: false,
    }));
    closeContactTagDialog();
  };

  const deleteContactMemo = (contactId: string, memoId: string) => {
    setContactMemosById((current) => {
      const next = { ...current };
      const nextMemos = (current[contactId] ?? []).filter((memo) => memo.id !== memoId);

      if (nextMemos.length) {
        next[contactId] = nextMemos;
      } else {
        delete next[contactId];
      }

      return next;
    });
    setActiveContactMemoPopoverId((current) => (current === contactId ? null : current));
    setActiveTableContactMemoPopover((current) => (current?.contactId === contactId ? null : current));
    setActiveContactMemoEditId((current) => (current === memoId ? null : current));
  };

  const handleDeleteContactMemoAction = (contactId: string, memoId: string) => {
    const targetMemo = (contactMemosById[contactId] ?? []).find((memo) => memo.id === memoId);

    if (!targetMemo || !targetMemo.isMine) {
      showStatusToast('메모 삭제에 실패했습니다.', 'error');
      return;
    }

    deleteContactMemo(contactId, memoId);
    showStatusToast('메모가 삭제되었습니다.');
  };

  const removeCompanyContact = (contactId: string) => {
    setOpenContactMenuId(null);
    setActiveContactMemoPopoverId((current) => (current === contactId ? null : current));
    setSelectedContactIds((current) => current.filter((id) => id !== contactId));
    setCompanyDetailContacts((current) => current.filter((contact) => contact.id !== contactId || contact.status === '가입완료'));
    setContactTaggedById((current) => {
      const next = { ...current };
      delete next[contactId];
      return next;
    });
    setContactMemosById((current) => {
      const next = { ...current };
      delete next[contactId];
      return next;
    });
  };

  const deleteCompanyContact = (contactId: string) => {
    setOpenContactMenuId(null);
    setPendingDeleteDialog({ kind: 'contact_delete', contactId });
  };

  const toggleContactMemoPopover = (contactId: string) => {
    setActiveContactMemoPopoverId((current) => (current === contactId ? null : contactId));
  };

  const toggleCompanyReplyPopover = (companyKey: string) => {
    setActiveCompanyReplyPopoverKey((current) => (current === companyKey ? null : companyKey));
  };

  const openCompanyReplyComposer = (companyKey: string) => {
    setActiveCompanyReplyComposerKey(companyKey);
    setActiveCompanyMemoEditContext(null);
    setCompanyMemoDraftByKey((current) => ({
      ...current,
      [companyKey]: '',
    }));
  };

  const closeCompanyReplyComposer = () => {
    setActiveCompanyReplyComposerKey(null);
    setActiveCompanyMemoEditContext(null);
  };

  const handleCompanyMemoDraftChange = (companyKey: string, nextValue: string) => {
    setCompanyMemoDraftByKey((current) => ({
      ...current,
      [companyKey]: nextValue,
    }));
  };

  const handleSaveCompanyMemo = (companyKey: string) => {
    const memoText = (companyMemoDraftByKey[companyKey] ?? '').trim();
    if (!memoText) return;

    const editTarget = activeCompanyMemoEditContext?.companyKey === companyKey ? activeCompanyMemoEditContext : null;

    if (editTarget) {
      setCompanyMemosByKey((current) => ({
        ...current,
        [companyKey]: (current[companyKey] ?? []).map((memo) =>
          memo.id === editTarget.memoId
            ? {
                ...memo,
                date: formatMemoDate(new Date()),
                memo: memoText,
              }
            : memo,
        ),
      }));
      setActiveCompanyMemoEditContext(null);
    } else {
      const nextMemo: CompanyMemoEntry = {
        id: `memo-${companyKey}-${Date.now()}`,
        date: formatMemoDate(new Date()),
        author: '오민진(안나)',
        memo: memoText,
        isMine: true,
      };

      setCompanyMemosByKey((current) => ({
        ...current,
        [companyKey]: [...(current[companyKey] ?? []), nextMemo],
      }));
    }

    setCompanyMemoDraftByKey((current) => ({
      ...current,
      [companyKey]: '',
    }));
    setActiveCompanyReplyComposerKey(null);
  };

  const handleEditCompanyMemo = (companyKey: string, memo: CompanyMemoEntry) => {
    if (!memo.isMine) return;
    setCompanyMemoDraftByKey((current) => ({
      ...current,
      [companyKey]: memo.memo,
    }));
    setActiveCompanyMemoEditContext({ companyKey, memoId: memo.id });
    window.requestAnimationFrame(() => {
      companyMemoInputRef.current?.focus();
      companyMemoInputRef.current?.select();
    });
  };

  const handleDeleteCompanyMemo = (companyKey: string, memoId: string) => {
    setCompanyMemosByKey((current) => ({
      ...current,
      [companyKey]: (current[companyKey] ?? []).filter((memo) => memo.id !== memoId || !memo.isMine),
    }));
  };

  const handleCompanyDetailFilesUpload = async (files?: FileList | null) => {
    if (!selectedDetailCompanyKey || !files?.length) return;

    const nextFiles = Array.from(files).map((file) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        id: `file-${selectedDetailCompanyKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category: isImageFile(file) ? '이미지' : '파일',
        name: file.name,
        extension: getFileExtension(file.name),
        sizeLabel: formatFileSize(file.size),
        uploadedAt: formatUploadDateTime(new Date()),
        uploadedBy: '오민진(안나)',
        previewUrl: isImageFile(file) ? objectUrl : '',
        objectUrl,
        isImage: isImageFile(file),
      } satisfies CompanyFileEntry;
    });

    setCompanyFilesByKey((current) => ({
      ...current,
      [selectedDetailCompanyKey]: [...(current[selectedDetailCompanyKey] ?? []), ...nextFiles],
    }));

    if (companyDetailFileInputRef.current) {
      companyDetailFileInputRef.current.value = '';
    }
  };

  const triggerCompanyDetailFilePicker = () => {
    companyDetailFileInputRef.current?.click();
  };

  const createCompanyFileEntry = (file: File, category: string, objectUrl: string): CompanyFileEntry => ({
    id: `file-${selectedDetailCompanyKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category,
    name: file.name,
    extension: getFileExtension(file.name),
    sizeLabel: formatFileSize(file.size),
    uploadedAt: formatUploadDateTime(new Date()),
    uploadedBy: '오민진(안나)',
    previewUrl: isImageFile(file) ? objectUrl : '',
    objectUrl,
    isImage: isImageFile(file),
  });

  const handleDeleteCompanyFile = (fileId: string) => {
    if (!selectedDetailCompanyKey) return;

    setCompanyFilesByKey((current) => {
      const currentFiles = current[selectedDetailCompanyKey] ?? [];
      const target = currentFiles.find((file) => file.id === fileId);
      const nextFiles = currentFiles.filter((file) => file.id !== fileId);

      if (target && target.objectUrl === (companyLogoByKey[selectedDetailCompanyKey] ?? '')) {
        const nextRepresentativeLogo = nextFiles.find((file) => file.category === '로고')?.objectUrl ?? '';
        setCompanyLogoByKey((currentLogos) => ({
          ...currentLogos,
          [selectedDetailCompanyKey]: nextRepresentativeLogo,
        }));
      }

      if (target) {
        URL.revokeObjectURL(target.objectUrl);
      }

      return {
        ...current,
        [selectedDetailCompanyKey]: nextFiles,
      };
    });
  };

  const handleCompanyDetailLogoUpload = async (files?: FileList | null) => {
    if (!selectedDetailCompanyKey || !files?.length) {
      showStatusToast('파일 추가에 실패하였습니다.', 'error');
      return;
    }

    const file = files[0];
    if (!isImageFile(file)) {
      if (companyDetailLogoInputRef.current) {
        companyDetailLogoInputRef.current.value = '';
      }
      showStatusToast('파일 추가에 실패하였습니다.', 'error');
      return;
    }

    const nextFileObjectUrl = URL.createObjectURL(file);
    const nextFileEntry = createCompanyFileEntry(file, '로고', nextFileObjectUrl);

    setCompanyLogoByKey((current) => {
      const previousObjectUrl = current[selectedDetailCompanyKey];
      if (previousObjectUrl && previousObjectUrl !== nextFileObjectUrl) {
        URL.revokeObjectURL(previousObjectUrl);
      }

      return {
        ...current,
        [selectedDetailCompanyKey]: nextFileObjectUrl,
      };
    });

    setCompanyFilesByKey((current) => ({
      ...current,
      [selectedDetailCompanyKey]: [...(current[selectedDetailCompanyKey] ?? []), nextFileEntry],
    }));

    if (companyDetailLogoInputRef.current) {
      companyDetailLogoInputRef.current.value = '';
    }
    setIsCompanyDetailLogoMenuOpen(false);
    showStatusToast('파일이 추가되었습니다.');
  };

  const triggerCompanyDetailLogoPicker = () => {
    companyDetailLogoInputRef.current?.click();
  };

  const handleSelectCompanyRepresentativeLogo = (file: CompanyFileEntry) => {
    if (!selectedDetailCompanyKey) {
      showStatusToast('대표 이미지 설정에 실패하였습니다.', 'error');
      return;
    }

    setCompanyLogoByKey((current) => ({
      ...current,
      [selectedDetailCompanyKey]: file.objectUrl,
    }));
    showStatusToast('대표 이미지로 설정되었습니다.');
  };

  const handleDownloadCompanyFile = (file: CompanyFileEntry) => {
    const link = document.createElement('a');
    link.href = file.objectUrl;
    link.download = file.name;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMultipleCompanyFiles = (files: CompanyFileEntry[]) => {
    files.forEach((file, index) => {
      window.setTimeout(() => {
        handleDownloadCompanyFile(file);
      }, index * 120);
    });
  };

  const resetRegionFilter = () => {
    setSelectedRegionProvince('전체');
    setSelectedRegionDistricts([]);
    setSelectedRegionDongs([]);
    setRegionSearchQuery('');
    setOpenFilterKey(null);
  };

  const resetIndustryFilter = () => {
    setSelectedIndustryPrimaries([]);
    setSelectedIndustryDetails([]);
    setIndustrySearchQuery('');
    setActiveIndustryPrimary(industryOptions[0].primary);
    setOpenFilterKey(null);
  };

  const resetInsuredFilter = () => {
    setSelectedInsuredBands([]);
    setInsuredCustomMin('');
    setInsuredCustomMax('');
    setOpenFilterKey(null);
  };

  const resetRevenueFilter = () => {
    setRevenueMin('');
    setRevenueMax('');
    setOpenFilterKey(null);
  };

  const copyTextToClipboard = async (text: string, options?: { showToast?: boolean }) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (options?.showToast === false) {
      return;
    }

    setCopyToastMounted(true);
    setCopyToastVisible(false);
    if (copyToastFrameRef.current !== null) {
      window.cancelAnimationFrame(copyToastFrameRef.current);
    }
    copyToastFrameRef.current = window.requestAnimationFrame(() => {
      setCopyToastVisible(true);
      copyToastFrameRef.current = null;
    });
    if (copyToastTimerRef.current !== null) {
      window.clearTimeout(copyToastTimerRef.current);
    }
    copyToastTimerRef.current = window.setTimeout(() => {
      setCopyToastVisible(false);
      if (copyToastExitTimerRef.current !== null) {
        window.clearTimeout(copyToastExitTimerRef.current);
      }
      copyToastExitTimerRef.current = window.setTimeout(() => {
        setCopyToastMounted(false);
        copyToastExitTimerRef.current = null;
      }, 180);
      copyToastTimerRef.current = null;
    }, 2200);
  };

  const showStatusToast = (message: string, tone: StatusToastTone = 'success') => {
    const visibleDuration = tone === 'error' ? 2600 : 2200;

    setStatusToastMessage(message);
    setStatusToastTone(tone);
    setStatusToastMounted(true);
    setStatusToastVisible(false);

    if (statusToastFrameRef.current !== null) {
      window.cancelAnimationFrame(statusToastFrameRef.current);
    }
    statusToastFrameRef.current = window.requestAnimationFrame(() => {
      setStatusToastVisible(true);
      statusToastFrameRef.current = null;
    });

    if (statusToastTimerRef.current !== null) {
      window.clearTimeout(statusToastTimerRef.current);
    }
    statusToastTimerRef.current = window.setTimeout(() => {
      setStatusToastVisible(false);
      if (statusToastExitTimerRef.current !== null) {
        window.clearTimeout(statusToastExitTimerRef.current);
      }
      statusToastExitTimerRef.current = window.setTimeout(() => {
        setStatusToastMounted(false);
        statusToastExitTimerRef.current = null;
      }, 180);
      statusToastTimerRef.current = null;
    }, visibleDuration);
  };

  const handleCopyCompanyAddress = async (address: string) => {
    await copyTextToClipboard(address);
  };

  const handleCopyCompanyShareLink = async () => {
    if (!selectedDetailCompanyKey) return;
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('company', selectedDetailCompanyKey);
    await copyTextToClipboard(shareUrl.toString());
  };

  const openCompanyDeleteDialog = () => {
    if (!selectedDetailCompany) return;
    setCompanyDeleteDialogMode(isCompanyDeleteDisabled ? 'blocked' : 'confirm');
  };

  const closeCompanyDeleteDialog = () => {
    setCompanyDeleteDialogMode(null);
  };

  const openSidebarProfileMenu = () => {
    setIsSidebarServiceMenuOpen(false);
    setIsSidebarProfileMenuOpen((current) => !current);
  };

  const toggleSidebarServiceMenu = () => {
    setIsSidebarProfileMenuOpen(false);
    setIsSidebarServiceMenuOpen((current) => !current);
  };

  const openPasswordChangeDialog = () => {
    setIsSidebarProfileMenuOpen(false);
    setIsLogoutDialogOpen(false);
    setIsPasswordChangeDialogOpen(true);
  };

  const closePasswordChangeDialog = () => {
    setIsPasswordChangeDialogOpen(false);
    setProfilePasswordDraft({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const openLogoutDialog = () => {
    setIsSidebarProfileMenuOpen(false);
    setIsPasswordChangeDialogOpen(false);
    setIsLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    setIsLogoutDialogOpen(false);
  };

  const confirmLogout = () => {
    setIsSidebarProfileMenuOpen(false);
    setIsLogoutDialogOpen(false);
    setActiveWorkspace('스팩');
    setActiveCompanyView('기업');
    setHighlightedCompanyKey(null);
    setSelectedCompanyKeys([]);
    setIsRegisterMenuOpen(false);
    setOpenFilterKey(null);
    setOpenCompanyMenuKey(null);
    setActiveCompanyReplyPopoverKey(null);
    setActiveCompanyReplyComposerKey(null);
    setOpenContactMenuId(null);
    setActiveContactMemoPopoverId(null);
  };

  const savePasswordChange = () => {
    if (
      !profilePasswordDraft.currentPassword.trim() ||
      !profilePasswordDraft.newPassword.trim() ||
      profilePasswordDraft.newPassword !== profilePasswordDraft.confirmPassword
    )
      return;

    closePasswordChangeDialog();
  };

  const confirmCompanyDelete = () => {
    if (!selectedDetailCompany || !selectedDetailCompanyKey) return;

    const targetBusinessNumber = selectedDetailCompany.businessRegistrationNumber;
    const filesToRevoke = companyFilesByKey[selectedDetailCompanyKey] ?? [];
    filesToRevoke.forEach((file) => URL.revokeObjectURL(file.objectUrl));
    const logoObjectUrl = companyLogoByKey[selectedDetailCompanyKey];
    if (logoObjectUrl) {
      URL.revokeObjectURL(logoObjectUrl);
    }
    setCompanyRows((current) => current.filter((company) => company.businessRegistrationNumber !== targetBusinessNumber));
    setSelectedCompanyKeys((current) => current.filter((key) => key !== selectedDetailCompanyKey));
    setCompanyFilesByKey((current) => {
      const next = { ...current };
      delete next[selectedDetailCompanyKey];
      return next;
    });
    setCompanyLogoByKey((current) => {
      const next = { ...current };
      delete next[selectedDetailCompanyKey];
      return next;
    });
    setHighlightedCompanyKey(null);
    setActiveCompanyView('기업');
    closeCompanyDeleteDialog();
    closeTab(activeTabId);
  };

  const pushTabHistory = (tabId: string) => {
    setTabHistory((current) => {
      const stack = current.stack.slice(0, current.index + 1);
      const nextStack = stack[stack.length - 1] === tabId ? stack : [...stack, tabId];
      return { stack: nextStack, index: nextStack.length - 1 };
    });
  };

  const syncTabSelection = (tabId: string) => {
    const nextTab = openTabs.find((tab) => tab.id === tabId);

    if (!nextTab) return;

    if (nextTab.companyKey) {
      setActiveCompanyView('기업');
      setHighlightedCompanyKey(nextTab.companyKey);
      return;
    }

    if (nextTab.sidebarLabel === '기업 관리' || tabId === makeTabId(['기업 관리'])) {
      setHighlightedCompanyKey(null);
    }
  };

  const openCompanyDetailFromContactCompanyName = (companyName: string) => {
    if (!companyName || companyName === '-') return;

    const companyIndex = companyRows.findIndex((company) => company.name === companyName);
    if (companyIndex < 0) return;

    const company = companyRows[companyIndex];
    openCompanyDetailTab(company, getCompanyKey(company, companyIndex));
  };

  const companyContactsListContent = (
    <>
      <section className="filters-panel" aria-label="기업 담당자 필터">
        <div className="filters-panel__topline">
          <div className="filters-panel__title">필터</div>
          <button className="filters-panel__reset" type="button" onClick={resetContactFilters}>
            초기화
          </button>
        </div>

        <div className="filters-panel__controls" ref={filtersControlsRef}>
          <label className="search-field" role="search" aria-label="기업 담당자 검색">
            <SearchIcon />
            <input
              type="text"
              value={contactSearchQuery}
              onChange={(event) => setContactSearchQuery(event.target.value)}
              placeholder="담당자명 / 기업명 / 이메일 / 연락처 / 참여 교육과정 검색"
            />
          </label>

          <SearchMultiSelectDropdown
            filterKey="contactCompany"
            label="기업 필터"
            value={contactCompanyFilterLabel}
            options={contactCompanyFilterOptions}
            isOpen={openFilterKey === 'contactCompany'}
            searchQuery={contactCompanyFilterQuery}
            onSearchQueryChange={setContactCompanyFilterQuery}
            selectedOptions={selectedContactCompanyFilters}
            onToggle={() => setOpenFilterKey((current) => (current === 'contactCompany' ? null : 'contactCompany'))}
            onToggleOption={toggleContactCompanyFilter}
            onReset={() => {
              setContactCompanyFilterQuery('');
              setSelectedContactCompanyFilters([]);
            }}
            onClose={() => setOpenFilterKey(null)}
          />

          <SearchMultiSelectDropdown
            filterKey="contactCourse"
            label="참여 교육과정"
            value={contactCourseFilterLabel}
            options={contactCourseFilterOptions}
            isOpen={openFilterKey === 'contactCourse'}
            searchQuery={contactCourseFilterQuery}
            onSearchQueryChange={setContactCourseFilterQuery}
            selectedOptions={selectedContactCourseFilters}
            onToggle={() => setOpenFilterKey((current) => (current === 'contactCourse' ? null : 'contactCourse'))}
            onToggleOption={toggleContactCourseFilter}
            onReset={() => {
              setContactCourseFilterQuery('');
              setSelectedContactCourseFilters([]);
            }}
            onClose={() => setOpenFilterKey(null)}
          />

          <FilterDropdown
            filterKey="contactStatus"
            label="가입여부"
            value={selectedContactStatusFilter}
            options={contactStatusFilterOptions}
            isOpen={openFilterKey === 'contactStatus'}
            onToggle={() => setOpenFilterKey((current) => (current === 'contactStatus' ? null : 'contactStatus'))}
            onSelect={setSelectedContactStatusFilter}
            onReset={() => setSelectedContactStatusFilter('전체')}
            onClose={() => setOpenFilterKey(null)}
          />
        </div>
      </section>

    <>
      <section className="company-board" aria-label="기업 담당자 목록">
        <section className="results-toolbar" aria-label="담당자 목록 도구">
        <div className="results-toolbar__left">
            <strong className="results-toolbar__count">전체 {visibleCompanyContacts.length}명</strong>
            <div className="results-toolbar__selects">
              <button
                className={`select-chip ${hasAnyCompanyContactSelection ? 'select-chip--active' : ''}`}
                type="button"
                onClick={() => toggleAllCompanyContactsSelection(!areAllCompanyContactsSelected)}
              >
                <span>{areAllCompanyContactsSelected ? '전체 선택 해제' : '전체 선택'}</span>
              </button>
              <ToolbarMenuDropdown
                menuKey="contact_page_size"
                label="10개씩 보기"
                value={`${contactListPageSize}개씩 보기`}
                options={listPageSizeOptions.map((size) => ({ label: `${size}개씩 보기`, value: `${size}개씩 보기` }))}
                isOpen={openToolbarMenuKey === 'contact_page_size'}
                onToggle={() => setOpenToolbarMenuKey((current) => (current === 'contact_page_size' ? null : 'contact_page_size'))}
                onSelect={(nextValue) => {
                  setContactListPageSize(Number(nextValue.replace(/개씩 보기$/, '')) as ListPageSize);
                }}
              />
              <ToolbarMenuDropdown
                menuKey="contact_sort"
                label="최근 등록순"
                value={listSortLabels[contactListSortOrder]}
                options={[
                  { label: '최근 가입순', value: 'recent_joined' },
                  { label: '최근 등록순', value: 'recent_registered' },
                  { label: '이름순(가나다)', value: 'name' },
                  { label: '오래된 등록순', value: 'oldest_registered' },
                ]}
                isOpen={openToolbarMenuKey === 'contact_sort'}
                onToggle={() => setOpenToolbarMenuKey((current) => (current === 'contact_sort' ? null : 'contact_sort'))}
                onSelect={(nextValue) => setContactListSortOrder(nextValue as ListSortOrder)}
              />
            </div>
          </div>

        <div className="results-toolbar__right">
            <button
              className={`ghost-button ${hasAnyCompanyContactSelection ? 'ghost-button--active' : ''}`}
              type="button"
              onClick={handleCompanyContactDownload}
            >
              <AssetIcon src="/assets/download.svg" className="toolbar-button__icon" />
              <span>{hasAnyCompanyContactSelection ? `선택 다운로드 (${selectedVisibleContactIds.length})` : '전체 다운로드'}</span>
            </button>
          <button className="ghost-button" type="button">
            <AssetIcon src="/assets/message.svg" className="toolbar-button__icon" />
            <span>문자 보내기</span>
          </button>
          <label className="results-toolbar__toggle-filter" aria-label="마케팅수신동의 필터">
            <span className="selection-checkbox">
              <input
                type="checkbox"
                checked={isContactMarketingFilterEnabled}
                onChange={(event) => setIsContactMarketingFilterEnabled(event.target.checked)}
              />
              <span />
            </span>
            <span className="results-toolbar__toggle-label">마케팅수신동의</span>
          </label>
          <label className="results-toolbar__toggle-filter" aria-label="점 태그 필터">
            <span className="selection-checkbox">
              <input
                type="checkbox"
                checked={isContactTaggedFilterEnabled}
                onChange={(event) => setIsContactTaggedFilterEnabled(event.target.checked)}
              />
              <span />
            </span>
            <span className="results-toolbar__dot" aria-hidden="true" />
          </label>
        </div>
        </section>

        <section className="company-list company-list--contacts" aria-label="기업 담당자 표">
          <div className="company-contacts-board">
            <div className="company-contacts-board__scroll">
          <table className="company-contacts-board__table">
            <colgroup>
	              <col className="company-contacts-board__col company-contacts-board__col--check" />
	              <col className="company-contacts-board__col company-contacts-board__col--name" />
	              <col className="company-contacts-board__col company-contacts-board__col--company" />
	              <col className="company-contacts-board__col company-contacts-board__col--email" />
              <col className="company-contacts-board__col company-contacts-board__col--phone" />
              <col className="company-contacts-board__col company-contacts-board__col--participation" />
              <col className="company-contacts-board__col company-contacts-board__col--joined" />
              <col className="company-contacts-board__col company-contacts-board__col--marketing" />
              <col className="company-contacts-board__col company-contacts-board__col--meta" />
              <col className="company-contacts-board__col company-contacts-board__col--menu" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">
                  <label className="selection-checkbox" aria-label="담당자 전체 선택">
                    <input
                      type="checkbox"
                      checked={areAllCompanyContactsSelected}
                      onChange={(event) => toggleAllCompanyContactsSelection(event.target.checked)}
                    />
                    <span />
                  </label>
	                </th>
	                <th scope="col">담당자 명</th>
	                <th scope="col">기업명 / 소속부서</th>
	                <th scope="col">이메일</th>
                <th scope="col">연락처</th>
                <th scope="col">참여이력</th>
                <th scope="col">가입여부</th>
                <th scope="col">마케팅수신동의</th>
                <th scope="col">태그 / 메모</th>
                <th scope="col">더보기</th>
              </tr>
            </thead>
            <tbody>
              {pagedVisibleCompanyContacts.map((contact) => {
                const participationItems =
                  contact.participationItems?.length
                    ? contact.participationItems
                    : contact.participationSummary === '없음'
                      ? ['없음']
                      : [contact.participationSummary.replace(/\s외\s\d+개$/, '')];
                const contactMemoItems = contactMemosById[contact.id] ?? [];
                const messageCount = contactMemoItems.length;
                const isJoinedContact = contact.status === '가입완료';
                const companyName = contact.companyName || selectedDetailCompany?.name || '-';
                const participationSummary =
                  participationItems[0] === '없음'
                    ? '없음'
                    : contact.participationItems?.length && contact.participationItems.length > 1
                      ? `${participationItems[0]} 외 ${contact.participationItems.length - 1}개`
                      : participationItems[0];

                return (
                  <tr key={contact.id}>
                    <td>
                      <label className="selection-checkbox selection-checkbox--small" aria-label={`${contact.name} 선택`}>
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => toggleCompanyContactSelection(contact.id)}
                        />
                        <span />
                      </label>
                    </td>
                    <td>
                      <div className="company-contacts-board__name-cell">
                        <span className="company-contacts-board__name">{contact.name}</span>
                      </div>
	                    </td>
	                    <td>
	                      <div className="company-contacts-board__company-cell">
	                        <button
	                          type="button"
	                          className="company-contacts-board__company-name-button"
	                          onClick={(event) => {
	                            event.stopPropagation();
	                            openCompanyDetailFromContactCompanyName(companyName);
	                          }}
	                          disabled={!companyName || companyName === '-'}
	                          aria-label={`${companyName} 기업 상세보기`}
	                        >
	                          <span className="company-contacts-board__company-name company-contacts-board__company-name--link">{companyName}</span>
	                        </button>
	                        <span className="company-contacts-board__department-name">{contact.department || '-'}</span>
	                      </div>
	                    </td>
	                    <td>
                      <div className="company-contacts-board__copy-cell">
                        <span className="company-contacts-board__ellipsis">{contact.email || '-'}</span>
                        {contact.email ? (
                          <button
                            type="button"
                            className="company-detail__copy-button"
                            aria-label="이메일 복사"
                            onClick={() => void copyTextToClipboard(contact.email)}
                          >
                            <AssetIcon src="/assets/copy.svg" className="company-detail__copy-icon" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="company-contacts-board__copy-cell">
                        <span className="company-contacts-board__ellipsis">{contact.phone || '-'}</span>
                        {contact.phone ? (
                          <button
                            type="button"
                            className="company-detail__copy-button"
                            aria-label="연락처 복사"
                            onClick={() => void copyTextToClipboard(contact.phone)}
                          >
                            <AssetIcon src="/assets/copy.svg" className="company-detail__copy-icon" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div
                        className={`company-contacts-board__participation-wrap ${
                          participationSummary === '없음' ? 'company-contacts-board__participation-wrap--muted' : ''
                        }`}
                        tabIndex={participationSummary === '없음' ? -1 : 0}
                        onMouseEnter={
                          participationSummary !== '없음'
                            ? (event) => openParticipationPopover(contact.id, participationItems, event.currentTarget)
                            : undefined
                        }
                        onMouseLeave={participationSummary !== '없음' ? scheduleParticipationPopoverClose : undefined}
                        onFocus={
                          participationSummary !== '없음'
                            ? (event) => openParticipationPopover(contact.id, participationItems, event.currentTarget)
                            : undefined
                        }
                        onBlur={
                          participationSummary !== '없음'
                            ? (event) => {
                                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                  closeParticipationPopover();
                                }
                              }
                            : undefined
                        }
                      >
                        <span className={participationSummary === '없음' ? 'company-detail__contact-value--muted' : undefined}>
                          {participationSummary}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={isJoinedContact ? undefined : 'company-detail__contact-value--muted'}>
                        {isJoinedContact ? '가입완료' : '미가입'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`company-detail__contact-consent ${
                          contact.marketingConsent ? 'company-detail__contact-consent--active' : 'company-detail__contact-consent--inactive'
                        }`}
                      >
                        {contact.marketingConsent ? '동의' : '미동의'}
                      </span>
                    </td>
                    <td>
                      <div className="company-detail__contact-inline-actions">
                        <button
                          type="button"
                          className="company-detail__contact-tag-dot"
                          aria-label={contactTaggedById[contact.id] ? '태그 해제' : '태그 추가'}
                          onClick={() =>
                            contactTaggedById[contact.id]
                              ? openContactTagRemovalDialog(contact.id)
                              : openContactTagDialog(contact.id)
                          }
                          >
                            <span
                              className={`company-detail__title-dot ${
                                contactTaggedById[contact.id] ? 'company-detail__title-dot--active' : ''
                              }`}
                              aria-hidden="true"
                            />
                        </button>
                        <button
                          type="button"
                          className={`company-detail__contact-tag-action ${contactTaggedById[contact.id] ? 'company-detail__contact-tag-action--active' : ''}`}
                          onClick={() => openContactTagDialog(contact.id)}
                        >
                          {contactTaggedById[contact.id] ? '태그 해제' : '태그 추가'}
                        </button>
                        <div
                          className={`company-detail__contact-message-wrap ${
                            activeTableContactMemoPopover?.contactId === contact.id ? 'company-detail__contact-message-wrap--open' : ''
                          }`}
                          onMouseEnter={(event) => openTableContactMemoPopover(contact.id, event.currentTarget)}
                          onMouseLeave={scheduleTableContactMemoPopoverClose}
                        >
                          <button
                            type="button"
                            className="company-detail__contact-message-meta"
                            aria-label={`${contact.name} 메모 ${messageCount}개 보기`}
                            aria-expanded={activeTableContactMemoPopover?.contactId === contact.id}
                            onClick={(event) => {
                              if (
                                activeTableContactMemoPopover?.contactId === contact.id &&
                                activeTableContactMemoPopover.pinned
                              ) {
                                closeTableContactMemoPopover();
                                return;
                              }

                              openTableContactMemoPopover(contact.id, event.currentTarget, true);
                            }}
                          >
                            <AssetIcon src="/assets/chat.svg" className="company-detail__contact-message-icon" />
                            <span className="company-detail__contact-message-count">{messageCount}</span>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="company-detail__contact-table-menu-cell">
                        <div
                          className={`company-detail__contact-menu-wrap ${
                            openContactMenuId === contact.id ? 'company-detail__contact-menu-wrap--open' : ''
                          }`}
                        >
                          <button
                            type="button"
                            className="company-detail__contact-more"
                            aria-label="담당자 더보기"
                            aria-haspopup="menu"
                            aria-expanded={openContactMenuId === contact.id}
                            onClick={() => setOpenContactMenuId((current) => (current === contact.id ? null : contact.id))}
                          >
                            <AssetIcon src="/assets/dots.svg" className="company-detail__contact-more-icon" />
                          </button>
                          <div className="company-detail__contact-menu" role="menu" aria-label={`${contact.name} 메뉴`}>
                            <button
                              type="button"
                              className="company-detail__contact-menu-item"
                              role="menuitem"
                              onClick={() => openContactEditDialog(contact)}
                            >
                              정보 편집
                            </button>
                            <button
                              type="button"
                              className="company-detail__contact-menu-item company-detail__contact-menu-item--danger"
                              role="menuitem"
                              disabled={isJoinedContact}
                              onClick={() => deleteCompanyContact(contact.id)}
                            >
                              삭제
                            </button>
                            {isJoinedContact ? <p className="company-detail__contact-menu-help">가입한 담당자는 삭제할 수 없습니다.</p> : null}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
            {activeParticipationPopover ? (
              <div
                className="company-contacts-board__participation-popover company-contacts-board__participation-popover--floating"
                role="tooltip"
                style={{
                  left: activeParticipationPopover.left,
                  top: activeParticipationPopover.top,
                  maxHeight: activeParticipationPopover.maxHeight,
                }}
              >
                <div className="company-contacts-board__participation-popover-title">참여이력</div>
                <div className="company-contacts-board__participation-list">
                  {activeParticipationPopover.items.map((item, index) => (
                    <span key={`${activeParticipationPopover.contactId}-table-participation-floating-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {activeTableContactMemoPopover ? (
              <div
                className="company-detail__contact-memo-popover company-detail__contact-memo-popover--floating"
                role="tooltip"
                style={{
                  left: activeTableContactMemoPopover.left,
                  top: activeTableContactMemoPopover.top,
                  maxHeight: activeTableContactMemoPopover.maxHeight,
                }}
                onMouseEnter={clearTableContactMemoPopoverHideTimer}
                onMouseLeave={scheduleTableContactMemoPopoverClose}
              >
                <div className="company-detail__contact-memo-popover-head">
                  <div className="company-detail__contact-memo-popover-title">담당자 메모</div>
                  <button
                    type="button"
                    className="company-detail__contact-memo-add"
                    onClick={() => openContactTagDialogWithSource(activeTableContactMemoPopover.contactId, 'memo')}
                  >
                    메모 추가
                  </button>
                </div>
                {activeTableContactMemoItems.length ? (
                  <div className="company-detail__contact-memo-popover-list">
                    {activeTableContactMemoItems.map((memo) => (
                      <div key={memo.id} className="company-detail__contact-memo-item">
                        <div className="company-detail__contact-memo-meta">
                          <span>{memo.author}</span>
                          <span>{memo.createdAt}</span>
                        </div>
                        <p>{memo.memo}</p>
                        {memo.isMine ? (
                          <div className="company-detail__contact-memo-actions">
                            <button
                              type="button"
                              onClick={() => openContactMemoEditDialog(activeTableContactMemoPopover.contactId, memo)}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteContactMemoAction(activeTableContactMemoPopover.contactId, memo.id)}
                            >
                              삭제
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="company-detail__contact-memo-popover-empty">남긴 메모가 없습니다.</p>
                )}
              </div>
            ) : null}
            {activeTableContactMemoPopover?.pinned ? (
              <div
                className="company-detail__contact-memo-backdrop"
                aria-hidden="true"
                onPointerDown={closeTableContactMemoPopover}
              />
            ) : null}
          </div>
        </section>
      </section>
      {isDownloadHistoryPanelMounted ? downloadHistoryPanel : null}
    </>
    </>
  );

  const companyListContent = (
    <>
      <section className="filters-panel" aria-label="필터">
        <div className="filters-panel__topline">
          <div className="filters-panel__title">필터</div>
          <button className="filters-panel__reset" type="button" onClick={resetAllFilters}>
            초기화
          </button>
        </div>

        <div className="filters-panel__controls" ref={filtersControlsRef}>
          <label className="search-field" role="search" aria-label="기업 검색">
            <SearchIcon />
            <input
              type="text"
              value={companySearchQuery}
              onChange={(event) => setCompanySearchQuery(event.target.value)}
              placeholder="기업명 / 담당자 이메일 및 연락처 / 사업자등록번호 / 태그 / 주소"
              aria-label="기업 검색어 입력"
            />
          </label>

          <SearchMultiSelectDropdown
            filterKey="companyCourse"
            label="참여 교육과정"
            value={companyCourseFilterLabel}
            options={companyCourseFilterOptions}
            isOpen={openFilterKey === 'companyCourse'}
            searchQuery={companyCourseFilterQuery}
            onSearchQueryChange={setCompanyCourseFilterQuery}
            selectedOptions={selectedCompanyCourseFilters}
            onToggle={() => setOpenFilterKey((current) => (current === 'companyCourse' ? null : 'companyCourse'))}
            onToggleOption={toggleCompanyCourseFilter}
            onReset={() => {
              setCompanyCourseFilterQuery('');
              setSelectedCompanyCourseFilters([]);
            }}
            onClose={() => setOpenFilterKey(null)}
          />

          {filterGroups.map((filter) =>
            filter.key === 'region' ? (
              <RegionDropdown
                key={filter.key}
                label={filter.label}
                iconSrc={filter.iconSrc}
                value={regionDisplayLabel}
                isOpen={openFilterKey === filter.key}
                searchQuery={regionSearchQuery}
                onSearchQueryChange={setRegionSearchQuery}
                selectedProvince={selectedRegionProvince}
                selectedDistricts={selectedRegionDistricts}
                selectedDongs={selectedRegionDongs}
                onToggle={() => setOpenFilterKey((current) => (current === filter.key ? null : filter.key))}
                onSelectProvince={(province) => {
                  setSelectedRegionProvince(province);
                  setSelectedRegionDistricts([]);
                  setSelectedRegionDongs([]);
                }}
                onToggleDistrict={(province, district) => {
                  setSelectedRegionProvince(province);
                  setSelectedRegionDistricts((current) =>
                    district === '전체'
                      ? current.includes('전체')
                        ? []
                        : ['전체']
                      : current.includes(district)
                        ? current.filter((item) => item !== district)
                        : [...current.filter((item) => item !== '전체'), district],
                  );
                  setSelectedRegionDongs([]);
                }}
                onToggleDong={(province, district, dong) => {
                  setSelectedRegionProvince(province);
                  setSelectedRegionDistricts((current) => (current.includes(district) ? current : [...current, district]));
                  setSelectedRegionDongs((current) =>
                    dong === '전체'
                      ? current.includes('전체')
                        ? []
                        : ['전체']
                      : current.includes(dong)
                        ? current.filter((item) => item !== dong)
                        : [...current.filter((item) => item !== '전체'), dong],
                  );
                }}
                onReset={resetRegionFilter}
                onClose={() => setOpenFilterKey(null)}
              />
            ) : filter.key === 'industry' ? (
              <IndustryDropdown
                key={filter.key}
                label={filter.label}
                isOpen={openFilterKey === filter.key}
                value={industryDisplayLabel}
                activePrimary={activeIndustryPrimary}
                searchQuery={industrySearchQuery}
                selectedPrimaries={selectedIndustryPrimaries}
                selectedDetails={selectedIndustryDetails}
                onToggle={() => setOpenFilterKey((current) => (current === filter.key ? null : filter.key))}
                onSearchQueryChange={setIndustrySearchQuery}
                onSelectPrimary={(primary) => {
                  setSelectedIndustryPrimaries((current) => {
                    const next = current.includes(primary) ? current.filter((item) => item !== primary) : [...current, primary];
                    setActiveIndustryPrimary(next.includes(primary) ? primary : next[0] ?? industryOptions[0].primary);
                    return next;
                  });
                }}
                onSelectDetail={(detail) => {
                  setSelectedIndustryDetails((current) =>
                    current.includes(detail) ? current.filter((item) => item !== detail) : [...current.filter((item) => item !== `${activeIndustryPrimary} 전체`), detail],
                  );
                  if (detail.endsWith(' 전체')) {
                    setSelectedIndustryPrimaries((current) =>
                      current.includes(activeIndustryPrimary) ? current : [...current, activeIndustryPrimary],
                    );
                  }
                }}
                onReset={resetIndustryFilter}
                onClose={() => setOpenFilterKey(null)}
              />
            ) : filter.key === 'insuredBand' ? (
              <InsuredBandDropdown
                key={filter.key}
                label={filter.label}
                isOpen={openFilterKey === filter.key}
                value={insuredDisplayLabel}
                selectedOptions={selectedInsuredBands}
                customMin={insuredCustomMin}
                customMax={insuredCustomMax}
                onToggle={() => setOpenFilterKey((current) => (current === filter.key ? null : filter.key))}
                onToggleOption={(option) => {
                  setSelectedInsuredBands((current) => {
                    const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
                    if (option === directInsuredLabel && current.includes(option)) {
                      setInsuredCustomMin('');
                      setInsuredCustomMax('');
                    }
                    return next;
                  });
                }}
                onCustomMinChange={setInsuredCustomMin}
                onCustomMaxChange={setInsuredCustomMax}
                onReset={resetInsuredFilter}
              />
            ) : filter.key === 'revenueBand' ? (
              <RevenueDropdown
                key={filter.key}
                label={filter.label}
                isOpen={openFilterKey === filter.key}
                value={revenueDisplayLabel}
                minValue={revenueMin}
                maxValue={revenueMax}
                onToggle={() => setOpenFilterKey((current) => (current === filter.key ? null : filter.key))}
                onMinChange={setRevenueMin}
                onMaxChange={setRevenueMax}
                onReset={resetRevenueFilter}
              />
            ) : (
              <FilterDropdown
                key={filter.key}
                filterKey={filter.key}
                label={filter.label}
                iconSrc={filter.iconSrc}
                value={selectedFilters[filter.key]}
                options={[...filter.options]}
                isOpen={openFilterKey === filter.key}
                onToggle={() => setOpenFilterKey((current) => (current === filter.key ? null : filter.key))}
                onSelect={(nextValue) =>
                  setSelectedFilters((current) => ({
                    ...current,
                    [filter.key]: nextValue,
                  }))
                }
                onReset={() =>
                  setSelectedFilters((current) => ({
                    ...current,
                    [filter.key]: '전체',
                  }))
                }
                onClose={() => setOpenFilterKey(null)}
              />
            ),
          )}
        </div>
      </section>

      <>
        <section className="company-board" aria-label="기업 목록 카드">
          <section className="results-toolbar" aria-label="목록 도구">
          <div className="results-toolbar__left">
            <label className="selection-checkbox" aria-label="전체 선택">
              <input
                type="checkbox"
                checked={areAllVisibleCompaniesSelected}
                onChange={(event) => toggleVisibleCompaniesSelection(event.target.checked)}
              />
              <span />
            </label>
            <strong className="results-toolbar__count">전체 {visibleCompanyRows.length}명</strong>
            <div className="results-toolbar__selects">
              <button
                className={`select-chip ${hasAnyCompanySelection ? 'select-chip--active' : ''}`}
                type="button"
                onClick={() => toggleVisibleCompaniesSelection(!areAllVisibleCompaniesSelected)}
              >
                <span>{areAllVisibleCompaniesSelected ? '전체 선택 해제' : '전체 선택'}</span>
              </button>
              <ToolbarMenuDropdown
                menuKey="company_page_size"
                label="10개씩 보기"
                value={`${companyListPageSize}개씩 보기`}
                options={listPageSizeOptions.map((size) => ({ label: `${size}개씩 보기`, value: `${size}개씩 보기` }))}
                isOpen={openToolbarMenuKey === 'company_page_size'}
                onToggle={() => setOpenToolbarMenuKey((current) => (current === 'company_page_size' ? null : 'company_page_size'))}
                onSelect={(nextValue) => {
                  setCompanyListPageSize(Number(nextValue.replace(/개씩 보기$/, '')) as ListPageSize);
                }}
              />
              <ToolbarMenuDropdown
                menuKey="company_sort"
                label="최근 등록순"
                value={listSortLabels[companyListSortOrder]}
                options={[
                  { label: '최근 가입순', value: 'recent_joined' },
                  { label: '최근 등록순', value: 'recent_registered' },
                  { label: '이름순(가나다)', value: 'name' },
                  { label: '오래된 등록순', value: 'oldest_registered' },
                ]}
                isOpen={openToolbarMenuKey === 'company_sort'}
                onToggle={() => setOpenToolbarMenuKey((current) => (current === 'company_sort' ? null : 'company_sort'))}
                onSelect={(nextValue) => setCompanyListSortOrder(nextValue as ListSortOrder)}
              />
            </div>
          </div>

          <div className="results-toolbar__right">
            <button className="ghost-button" type="button">
              <AssetIcon src="/assets/message.svg" className="toolbar-button__icon" />
              <span>문자 보내기</span>
            </button>
            <button
              className={`ghost-button ${hasAnyCompanySelection ? 'ghost-button--active' : ''}`}
              type="button"
              onClick={handleCompanyDownload}
            >
              <AssetIcon src="/assets/download.svg" className="toolbar-button__icon" />
              <span>{hasAnyCompanySelection ? `선택 다운로드 (${selectedCompanyKeys.length})` : '전체 다운로드'}</span>
            </button>
            <label className="results-toolbar__tag-filter" aria-label={`${toolbarTagFilterLabel} 태그 필터`}>
              <input
                type="checkbox"
                checked={isToolbarTagFilterEnabled}
                onChange={(event) => setIsToolbarTagFilterEnabled(event.target.checked)}
              />
              <span className="results-toolbar__tag-filter-box" aria-hidden="true" />
              <span className="results-toolbar__dot" aria-hidden="true" />
            </label>
          </div>
          </section>

          <section className="company-list" aria-label="기업 목록">
          {pagedVisibleCompanyRows.map(({ company, companyKey }) => {
            const companyLogoSrc = companyLogoByKey[companyKey] ?? '';
            const companyReplyMemos = companyMemosByKey[companyKey] ?? [];
            const companyReplyDraft = companyMemoDraftByKey[companyKey] ?? '';
            const isEditingCompanyReply = activeCompanyMemoEditContext?.companyKey === companyKey;
            const isCompanyReplyPopoverOpen = activeCompanyReplyPopoverKey === companyKey;

            return (
              <article
                key={companyKey}
                ref={(node) => {
                  companyCardRefs.current[companyKey] = node;
                }}
                className={`company-card ${company.description ? 'company-card--with-description' : ''} ${highlightedCompanyKey === companyKey ? 'company-card--highlighted' : ''}`}
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('button, a, input, label')) return;
                  openCompanyDetailTab(company, companyKey);
                }}
              >
                <div className="company-card__top">
                  <div className="company-card__lead">
                    <label className="selection-checkbox selection-checkbox--small" aria-label={`${company.name} 선택`} onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCompanyKeys.includes(companyKey)}
                        onChange={() => toggleCompanySelection(companyKey)}
                      />
                      <span />
                    </label>
                    <div className="company-detail__hero-logo company-card__logo" aria-hidden="true">
                      {companyLogoSrc ? (
                        <img src={companyLogoSrc} alt="" className="company-detail__hero-logo-image company-card__logo-image" />
                      ) : (
                        <img src="/assets/company-profile-default.svg" alt="" className="company-detail__hero-logo-fallback company-card__logo-fallback" />
                      )}
                    </div>
                    <h2 className="company-card__name">{company.name}</h2>
                    <div className={`company-card__menu-wrap ${openCompanyMenuKey === companyKey ? 'company-card__menu-wrap--open' : ''}`}>
                      <button
                        className="company-card__menu-button"
                        type="button"
                        aria-label={`${company.name} 더보기`}
                        aria-haspopup="menu"
                        aria-expanded={openCompanyMenuKey === companyKey}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenCompanyMenuKey((current) => (current === companyKey ? null : companyKey));
                        }}
                      >
                        <AssetIcon src="/assets/dots.svg" className="company-card__menu-icon" />
                      </button>

                      <div className="company-card__menu" role="menu" aria-label={`${company.name} 메뉴`}>
                        <button type="button" className="company-card__menu-item" role="menuitem">
                          정보 수정
                        </button>
                        <button type="button" className="company-card__menu-item company-card__menu-item--danger" role="menuitem">
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="company-card__meta-right">
                    <span
                      className={`company-card__reply-tag-dot ${companyTaggedByKey[companyKey] ? 'company-card__reply-tag-dot--active' : ''}`}
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      className={`company-card__tag-action ${companyTaggedByKey[companyKey] ? 'company-card__tag-action--active' : ''}`}
                      aria-label={`${company.name} ${companyTaggedByKey[companyKey] ? '태그 해제' : '태그 추가'}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (companyTaggedByKey[companyKey]) {
                          openCompanyTagRemovalDialog(companyKey);
                          return;
                        }
                        openCompanyTagDialog(companyKey);
                      }}
                    >
                      <span>{companyTaggedByKey[companyKey] ? '태그 해제' : '태그 추가'}</span>
                    </button>
                    <div className={`company-card__reply-wrap ${isCompanyReplyPopoverOpen ? 'company-card__reply-wrap--open' : ''}`}>
                      <button
                        type="button"
                        className="company-card__reply-count"
                        aria-label={`${company.name} 메모 ${companyReplyMemos.length}개 보기`}
                        aria-expanded={isCompanyReplyPopoverOpen}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleCompanyReplyPopover(companyKey);
                        }}
                      >
                        <AssetIcon src="/assets/chat.svg" className="company-card__reply-icon" />
                        <span>{companyReplyMemos.length}</span>
                      </button>
                      <div className="company-card__reply-popover" role="tooltip">
                        <div className="company-card__reply-popover-head">
                          <div className="company-card__reply-popover-title">메모</div>
                          <button
                            type="button"
                            className="company-card__reply-add"
                            onClick={() => openCompanyReplyComposer(companyKey)}
                          >
                            메모 추가
                          </button>
                        </div>
                        {isCompanyReplyPopoverOpen && activeCompanyReplyComposerKey === companyKey ? (
                          <div className="company-card__reply-composer">
                            <textarea
                              className="company-card__reply-input"
                              value={companyReplyDraft}
                              onChange={(event) => handleCompanyMemoDraftChange(companyKey, event.target.value)}
                              placeholder="메모를 입력하세요"
                              rows={3}
                            />
                            <div className="company-card__reply-editor-actions">
                              <button type="button" className="company-card__reply-save" onClick={() => handleSaveCompanyMemo(companyKey)}>
                                {isEditingCompanyReply ? '수정' : '추가'}
                              </button>
                              {isEditingCompanyReply ? (
                                <button
                                  type="button"
                                  className="company-card__reply-cancel"
                                  onClick={() => {
                                    closeCompanyReplyComposer();
                                    handleCompanyMemoDraftChange(companyKey, '');
                                  }}
                                >
                                  취소
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="company-card__reply-cancel"
                                  onClick={() => {
                                    closeCompanyReplyComposer();
                                    handleCompanyMemoDraftChange(companyKey, '');
                                  }}
                                >
                                  닫기
                                </button>
                              )}
                            </div>
                          </div>
                        ) : null}
                        {companyReplyMemos.length > 0 ? (
                          <div className="company-card__reply-popover-list">
                            {companyReplyMemos.map((memo) => (
                              <div key={memo.id} className="company-card__reply-popover-item">
                                <div className="company-card__reply-popover-meta">
                                  <span>{memo.date}</span>
                                  <span>{memo.author}</span>
                                </div>
                                <p>{memo.memo}</p>
                                {memo.isMine ? (
                                  <div className="company-card__reply-popover-actions">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        openCompanyReplyComposer(companyKey);
                                        handleEditCompanyMemo(companyKey, memo);
                                      }}
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPendingDeleteDialog({ kind: 'company_memo', companyKey, memoId: memo.id })}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="company-card__reply-popover-empty">남긴 메모가 없습니다.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="company-card__tag-row" aria-label="업종 태그">
                  {company.tags.map((tag, tagIndex) => (
                    <span key={tag} className={`tag-chip ${tagIndex === 0 ? 'tag-chip--primary' : ''}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="company-card__info">
                  <div className="company-card__address-line">
                    <div className="company-card__address">
                      <span>{company.address}</span>
                      <button
                        type="button"
                        className="company-card__copy-button"
                        aria-label="주소 복사"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleCopyCompanyAddress(company.address);
                        }}
                      >
                        <AssetIcon src="/assets/copy.svg" className="company-card__copy-icon" />
                      </button>
                    </div>
                    <span className="company-card__separator">|</span>
                    <a href="#" className="company-card__website" onClick={(event) => event.preventDefault()}>
                      {company.websiteLabel}
                    </a>
                    <span className="company-card__separator">|</span>
                    <span className={`company-card__status ${company.status === '가입완료' ? 'company-card__status--active' : 'company-card__status--inactive'}`}>
                      {company.status}
                    </span>
                  </div>

                  {company.description ? <p className="company-card__description">{company.description}</p> : null}
                </div>
              </article>
            );
          })}
          {!visibleCompanyRows.length ? <div className="company-list__empty">조건에 맞는 기업이 없습니다.</div> : null}
          </section>
        </section>
        {isDownloadHistoryPanelMounted ? downloadHistoryPanel : null}
      </>
      {companyDeleteDialogMode ? (
        <div
          className="company-delete-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCompanyDeleteDialog();
            }
          }}
        >
          <div className="company-delete-dialog__panel" role="dialog" aria-modal="true" aria-label="기업 삭제 안내">
            <div className="company-delete-dialog__content">
              <strong className="company-delete-dialog__title">
                {companyDeleteDialogMode === 'blocked' ? '삭제할 수 없습니다' : '기업을 삭제하시겠습니까?'}
              </strong>
              <p className="company-delete-dialog__description">
                {companyDeleteDialogMode === 'blocked'
                  ? '가입된 기업 또는 가입된 기업 담당자가 있는 경우 삭제할 수 없습니다'
                  : '해당 기업을 삭제하시겠습니까? 담당자도 모두 삭제됩니다.'}
              </p>
            </div>
            <div className="company-delete-dialog__actions">
              {companyDeleteDialogMode === 'blocked' ? (
                <button type="button" className="company-delete-dialog__button company-delete-dialog__button--primary" onClick={closeCompanyDeleteDialog}>
                  확인
                </button>
              ) : (
                <>
                  <button type="button" className="company-delete-dialog__button company-delete-dialog__button--secondary" onClick={closeCompanyDeleteDialog}>
                    취소
                  </button>
                  <button type="button" className="company-delete-dialog__button company-delete-dialog__button--danger" onClick={confirmCompanyDelete}>
                    삭제하기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteDialog && pendingDeleteDialog.kind !== 'company_memo' ? (
        <div
          className="company-delete-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePendingDeleteDialog();
            }
          }}
        >
          <div className="company-delete-dialog__panel" role="dialog" aria-modal="true" aria-label="삭제 확인">
            <div className="company-delete-dialog__content">
              <strong className="company-delete-dialog__title">삭제하시겠습니까?</strong>
              <p className="company-delete-dialog__description">
                {pendingDeleteDialog.kind === 'company_memo' || pendingDeleteDialog.kind === 'contact_memo'
                  ? '선택한 메모를 삭제하시겠습니까? 삭제한 내용은 되돌릴 수 없습니다.'
                  : pendingDeleteDialog.kind === 'contact_delete'
                    ? '선택한 담당자를 삭제하시겠습니까? 삭제한 내용은 되돌릴 수 없습니다.'
                  : pendingDeleteDialog.kind === 'company_file'
                    ? '선택한 파일을 삭제하시겠습니까? 삭제한 파일은 되돌릴 수 없습니다.'
                    : pendingDeleteDialog.kind === 'register_draft'
                      ? '선택한 기업 입력 항목을 삭제하시겠습니까? 입력 중인 내용은 복구할 수 없습니다.'
                      : '첨부한 엑셀 파일을 삭제하시겠습니까? 미리보기 정보도 함께 사라집니다.'}
              </p>
            </div>
            <div className="company-delete-dialog__actions">
              <button type="button" className="company-delete-dialog__button company-delete-dialog__button--secondary" onClick={closePendingDeleteDialog}>
                취소
              </button>
              <button type="button" className="company-delete-dialog__button company-delete-dialog__button--danger" onClick={confirmPendingDelete}>
                삭제하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPasswordChangeDialogOpen ? (
        <div
          className="sidebar-profile-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePasswordChangeDialog();
            }
          }}
        >
          <div className="sidebar-profile-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="profile-password-dialog-title">
            <div className="sidebar-profile-dialog__header">
              <div>
                <div className="sidebar-profile-dialog__eyebrow">프로필</div>
                <h2 id="profile-password-dialog-title" className="sidebar-profile-dialog__title">
                  비밀번호 변경
                </h2>
              </div>
              <button type="button" className="sidebar-profile-dialog__close" onClick={closePasswordChangeDialog} aria-label="비밀번호 변경 창 닫기">
                ×
              </button>
            </div>

            <div className="sidebar-profile-dialog__body">
              <label className="sidebar-profile-dialog__field">
                <span className="sidebar-profile-dialog__label">현재 비밀번호</span>
                <input
                  ref={profilePasswordInputRef}
                  type="password"
                  value={profilePasswordDraft.currentPassword}
                  onChange={(event) => setProfilePasswordDraft((current) => ({ ...current, currentPassword: event.target.value }))}
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </label>
              <label className="sidebar-profile-dialog__field">
                <span className="sidebar-profile-dialog__label">새 비밀번호</span>
                <input
                  type="password"
                  value={profilePasswordDraft.newPassword}
                  onChange={(event) => setProfilePasswordDraft((current) => ({ ...current, newPassword: event.target.value }))}
                  placeholder="새 비밀번호를 입력하세요"
                />
              </label>
              <label className="sidebar-profile-dialog__field">
                <span className="sidebar-profile-dialog__label">새 비밀번호 확인</span>
                <input
                  type="password"
                  value={profilePasswordDraft.confirmPassword}
                  onChange={(event) => setProfilePasswordDraft((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </label>
            </div>

            <div className="sidebar-profile-dialog__actions">
              <button type="button" className="sidebar-profile-dialog__button sidebar-profile-dialog__button--secondary" onClick={closePasswordChangeDialog}>
                취소
              </button>
              <button type="button" className="sidebar-profile-dialog__button sidebar-profile-dialog__button--primary" onClick={savePasswordChange}>
                변경
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLogoutDialogOpen ? (
        <div
          className="sidebar-profile-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLogoutDialog();
            }
          }}
        >
          <div className="sidebar-profile-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="profile-logout-dialog-title">
            <div className="sidebar-profile-dialog__header">
              <div>
                <div className="sidebar-profile-dialog__eyebrow">프로필</div>
                <h2 id="profile-logout-dialog-title" className="sidebar-profile-dialog__title">
                  로그아웃
                </h2>
              </div>
              <button type="button" className="sidebar-profile-dialog__close" onClick={closeLogoutDialog} aria-label="로그아웃 창 닫기">
                ×
              </button>
            </div>

            <div className="sidebar-profile-dialog__body">
              <p className="sidebar-profile-dialog__description">정말 로그아웃하시겠습니까?</p>
            </div>

            <div className="sidebar-profile-dialog__actions">
              <button type="button" className="sidebar-profile-dialog__button sidebar-profile-dialog__button--secondary" onClick={closeLogoutDialog}>
                취소
              </button>
              <button type="button" className="sidebar-profile-dialog__button sidebar-profile-dialog__button--danger" onClick={confirmLogout}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  useEffect(() => {
    if (!isSearchDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchDialogOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchDialogOpen]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
      if (copyToastFrameRef.current !== null) {
        window.cancelAnimationFrame(copyToastFrameRef.current);
      }
      if (copyToastTimerRef.current !== null) {
        window.clearTimeout(copyToastTimerRef.current);
      }
      if (copyToastExitTimerRef.current !== null) {
        window.clearTimeout(copyToastExitTimerRef.current);
      }
      if (statusToastFrameRef.current !== null) {
        window.cancelAnimationFrame(statusToastFrameRef.current);
      }
      if (statusToastTimerRef.current !== null) {
        window.clearTimeout(statusToastTimerRef.current);
      }
      if (statusToastExitTimerRef.current !== null) {
        window.clearTimeout(statusToastExitTimerRef.current);
      }
      if (downloadHistoryPanelCloseTimerRef.current !== null) {
        window.clearTimeout(downloadHistoryPanelCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!companyDeleteDialogMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCompanyDeleteDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [companyDeleteDialogMode]);

  useEffect(() => {
    if (!pendingDeleteDialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePendingDeleteDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingDeleteDialog]);

  useEffect(() => {
    if (!isPasswordChangeDialogOpen && !isLogoutDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => {
      if (isPasswordChangeDialogOpen) {
        profilePasswordInputRef.current?.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePasswordChangeDialog();
        closeLogoutDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPasswordChangeDialogOpen, isLogoutDialogOpen]);

  useEffect(() => {
    if (!companyRegisterDrafts.length) return;
    if (companyRegisterDrafts.some((draft) => draft.id === activeCompanyRegisterDraftId)) return;
    setActiveCompanyRegisterDraftId(companyRegisterDrafts[0].id);
  }, [activeCompanyRegisterDraftId, companyRegisterDrafts]);

  useEffect(() => {
    setActiveCompanyMemoEditContext(null);
  }, [selectedDetailCompanyKey]);

  useEffect(() => {
    setIsCompanyMemoPanelCollapsed(false);
  }, [selectedDetailCompanyKey]);

  useEffect(() => {
    return () => {
      Object.values(companyLogoByKey).forEach((objectUrl) => {
        URL.revokeObjectURL(objectUrl);
      });
    };
  }, [companyLogoByKey]);

  useEffect(() => {
    setIsCompanyDetailEditing(false);
    setCompanyDetailEditDraft(null);
  }, [selectedDetailCompanyKey, companyDetailTab]);

  useEffect(() => {
    if (!isCompanyTagDialogOpen && !isContactTagDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => {
      if (isContactTagDialogOpen) {
        contactTagDialogInputRef.current?.focus();
      } else {
        companyTagDialogInputRef.current?.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCompanyTagDialog();
        closeContactTagDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCompanyTagDialogOpen, isContactTagDialogOpen]);

  useEffect(() => {
    if (!isContactEditDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContactEditDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isContactEditDialogOpen]);

  useEffect(() => {
    if (
      !isRegisterMenuOpen &&
      !isCompanyDetailLogoMenuOpen &&
      !openFilterKey &&
      !openCompanyMenuKey &&
      !activeCompanyReplyPopoverKey &&
      !activeCompanyReplyComposerKey &&
      !openContactMenuId &&
      !activeContactMemoPopoverId &&
      !isSidebarServiceMenuOpen &&
      !isSidebarProfileMenuOpen
    )
      return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const clickedRegisterMenu = Boolean(titleActionsRef.current?.contains(target));
      const clickedCompanyLogoMenu = Boolean(companyDetailLogoMenuRef.current?.contains(target));
      const clickedFilterMenu = Boolean(filtersControlsRef.current?.contains(target));
      const clickedCompanyMenu = Boolean((target as Element | null)?.closest?.('.company-card__menu-wrap'));
      const clickedCompanyReply = Boolean((target as Element | null)?.closest?.('.company-card__reply-wrap'));
      const clickedContactMenu = Boolean((target as Element | null)?.closest?.('.company-detail__contact-menu-wrap'));
      const clickedContactMemo = Boolean((target as Element | null)?.closest?.('.company-detail__contact-message-wrap'));
      const clickedSidebarProfile = Boolean((target as Element | null)?.closest?.('.crm-sidebar__profile-wrap'));

      if (!clickedRegisterMenu) {
        setIsRegisterMenuOpen(false);
      }

      if (!clickedCompanyLogoMenu) {
        setIsCompanyDetailLogoMenuOpen(false);
      }

      if (!clickedFilterMenu) {
        setOpenFilterKey(null);
      }

      if (!clickedCompanyMenu) {
        setOpenCompanyMenuKey(null);
      }

      if (!clickedCompanyReply) {
        setActiveCompanyReplyPopoverKey(null);
        setActiveCompanyReplyComposerKey(null);
      }

      if (!clickedContactMenu) {
        setOpenContactMenuId(null);
      }

      if (!clickedContactMemo) {
        setActiveContactMemoPopoverId(null);
      }

      if (!clickedSidebarProfile) {
        setIsSidebarServiceMenuOpen(false);
        setIsSidebarProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRegisterMenuOpen(false);
        setIsCompanyDetailLogoMenuOpen(false);
        setOpenFilterKey(null);
        setOpenCompanyMenuKey(null);
        setActiveCompanyReplyPopoverKey(null);
        setActiveCompanyReplyComposerKey(null);
        setOpenContactMenuId(null);
        setActiveContactMemoPopoverId(null);
        setIsSidebarServiceMenuOpen(false);
        setIsSidebarProfileMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isRegisterMenuOpen,
    openFilterKey,
    openCompanyMenuKey,
    activeCompanyReplyPopoverKey,
    activeCompanyReplyComposerKey,
    isCompanyDetailLogoMenuOpen,
    openContactMenuId,
    activeContactMemoPopoverId,
    isSidebarServiceMenuOpen,
    isSidebarProfileMenuOpen,
  ]);

  const handleSearchResultSelect = (result: SearchResult) => {
    setSearchHistory((current) => [result.label, ...current.filter((item) => item !== result.label)].slice(0, 6));
    setIsSearchDialogOpen(false);

    if (result.kind === '메뉴' && result.targetPath && result.targetIconSrc) {
      openSidebarTab(result.targetPath, result.label, result.targetIconSrc);
      return;
    }

    if (!result.targetKey) return;

    openCompanyDetailTab(
      companyRows.find((company, index) => getCompanyKey(company, index) === result.targetKey) ?? companyRows[0],
      result.targetKey,
    );
  };

  const openSidebarTab = (path: string[], label: string, iconSrc: string) => {
    const id = makeTabId(path);
    setOpenTabs((current) => {
      const existing = current.find((tab) => tab.id === id);
      if (existing) return current;
      return [...current, { id, label, iconSrc, path, sidebarLabel: label }];
    });
    setActiveTabId(id);
    setActiveCompanyView('기업');
    setHighlightedCompanyKey(null);
    pushTabHistory(id);
  };

  const openCompanyDetailTab = (company: CompanyRow, companyKey: string) => {
    const id = `company:${companyKey}`;
    setOpenTabs((current) => {
      const existing = current.find((tab) => tab.id === id);
      if (existing) return current;
      return [
        ...current,
        {
          id,
          label: company.name,
          iconSrc: '/assets/company.svg',
          path: ['기업 관리', company.name],
          sidebarLabel: '기업 관리',
          companyKey,
        },
      ];
    });
    setActiveTabId(id);
    setActiveCompanyView('기업');
    setCompanyDetailTab('기업 정보');
    setHighlightedCompanyKey(companyKey);
    pushTabHistory(id);
  };

  const openCompanyRegisterDialog = () => {
    setIsRegisterMenuOpen(false);
    const firstDraft = createCompanyRegisterDraft();
    initialCompanyRegisterDraftIdRef.current = firstDraft.id;
    closeCompanyRegisterPickers();
    setCompanyRegisterDrafts([firstDraft]);
    setActiveCompanyRegisterDraftId(firstDraft.id);
    setIsCompanyRegisterDialogOpen(true);
  };

  const finalizeCloseCompanyRegisterDialog = () => {
    setOpenCompanyRegisterIndustryPickerDraftId(null);
    setOpenCompanyRegisterCoursePickerDraftId(null);
    setOpenCompanyRegisterContactCompanyPickerId(null);
    setOpenCompanyRegisterContactCoursePickerId(null);
    setCompanyRegisterIndustrySearchQuery('');
    setCompanyRegisterCourseSearchQuery('');
    setCompanyRegisterContactCompanySearchQueryById({});
    setCompanyRegisterContactCourseSearchQueryById({});
    setCompanyRegisterDrafts([]);
    setActiveCompanyRegisterDraftId('');
    setIsCompanyRegisterDialogOpen(false);
  };

  const requestCloseCompanyRegisterDialog = () => {
    setPendingDialogCloseConfirmTarget('company_register');
  };

  const handleCompanyRegisterDialogCloseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    requestCloseCompanyRegisterDialog();
  };

  const openCompanyExcelRegisterDialog = () => {
    setIsRegisterMenuOpen(false);
    setCompanyExcelFileName('');
    setCompanyExcelFileMeta(null);
    setCompanyExcelPreview(null);
    setIsCompanyExcelDragging(false);
    setIsCompanyExcelRegisterDialogOpen(true);
    if (companyExcelFileInputRef.current) {
      companyExcelFileInputRef.current.value = '';
    }
  };

  const closeCompanyExcelRegisterDialog = () => {
    setIsCompanyExcelRegisterDialogOpen(false);
    setIsCompanyExcelDragging(false);
    setCompanyExcelFileName('');
    setCompanyExcelFileMeta(null);
    setCompanyExcelPreview(null);
    if (companyExcelFileInputRef.current) {
      companyExcelFileInputRef.current.value = '';
    }
  };

  const readCompanyExcelFile = async (file?: File) => {
    if (!file) {
      clearCompanyExcelFile();
      return;
    }

    setCompanyExcelFileName(file.name);
    setCompanyExcelFileMeta({ name: file.name, size: file.size, type: file.type });

    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      setCompanyExcelPreview(null);
      return;
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' }) as Array<
      Array<string | number | boolean | null | undefined>
    >;
    const normalizedRows = rawRows.map((row) => row.map((cell) => (cell === null || cell === undefined ? '' : String(cell))));
    const headers = normalizedRows[0] ?? [];
    const rows = normalizedRows.slice(1, 6);

    setCompanyExcelPreview({
      sheetName,
      headers,
      rows,
    });
  };

  const clearCompanyExcelFile = () => {
    setCompanyExcelFileName('');
    setCompanyExcelFileMeta(null);
    setCompanyExcelPreview(null);
    if (companyExcelFileInputRef.current) {
      companyExcelFileInputRef.current.value = '';
    }
  };

  const handleCompanyExcelFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void readCompanyExcelFile(event.target.files?.[0]);
  };

  const triggerCompanyExcelFilePicker = () => {
    companyExcelFileInputRef.current?.click();
  };

  const downloadCompanyExcelTemplate = () => {
    const columns = ['기업명', '사업자등록번호', '1차 업종', '세부 업종', '기업 주소', '기업 홈페이지', '피보험자 수', '매출액', '유입경로', '가입일자', '업데이트일자'];
    const sample = ['스팩스페이스', '123-45-67890', 'IT·소프트웨어', 'SaaS', '서울 강서구 마곡중앙로 59-5', 'https://example.com', '24', '5200000000', '홈페이지 문의', '2026.02.20', '2026.06.10'];
    const csv = [columns, sample].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'company_excel_template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCompanyExcelUpload = () => {
    if (!companyExcelFileName) {
      triggerCompanyExcelFilePicker();
      return;
    }

    closeCompanyExcelRegisterDialog();
  };

  const closeCompanyRegisterPickers = () => {
    setOpenCompanyRegisterIndustryPickerDraftId(null);
    setOpenCompanyRegisterCoursePickerDraftId(null);
    setOpenCompanyRegisterContactCompanyPickerId(null);
    setOpenCompanyRegisterContactCoursePickerId(null);
    setCompanyRegisterIndustryPickerMode(null);
    setCompanyRegisterIndustrySearchQuery('');
    setCompanyRegisterCourseSearchQuery('');
    setCompanyRegisterContactCompanySearchQueryById({});
    setCompanyRegisterContactCourseSearchQueryById({});
    setCompanyRegisterPickerMenuStyle(null);
    companyRegisterPickerAnchorRef.current = null;
  };

  useEffect(() => {
    if (!isCompanyRegisterDialogOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('.company-register-dialog__picker') || target.closest('.company-register-dialog__picker-menu')) return;

      closeCompanyRegisterPickers();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [
    isCompanyRegisterDialogOpen,
    openCompanyRegisterIndustryPickerDraftId,
    openCompanyRegisterCoursePickerDraftId,
    openCompanyRegisterContactCompanyPickerId,
    openCompanyRegisterContactCoursePickerId,
  ]);

  const handleCompanyRegisterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalidRegisterDraft = companyRegisterDrafts.find((draft) => companyRegisterWarningsById[draft.id]?.messages.length);

    if (invalidRegisterDraft) {
      showStatusToast('기업명, 사업자등록번호, 업종을 확인해 주세요. 필수 항목이 비어 있거나 중복된 값이 있습니다.', 'error');
      return;
    }

    const invalidContactWarning = companyRegisterDrafts
      .flatMap((draft) => Object.values(companyRegisterContactWarningsByDraftId[draft.id] ?? {}))
      .find((warning) => warning.messages.length);

    if (invalidContactWarning) {
      showStatusToast('담당자명, 연락처는 필수입니다. 담당자 정보가 비어 있거나 중복된 값을 확인해 주세요.', 'error');
      return;
    }

    closeCompanyRegisterPickers();
    finalizeCloseCompanyRegisterDialog();
  };

  const updateCompanyRegisterDraft = <K extends keyof Omit<CompanyRegisterDraft, 'id'>>(
    draftId: string,
    field: K,
    value: CompanyRegisterDraft[K],
  ) => {
    setCompanyRegisterDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              [field]: value,
              ...(field === 'name'
                ? {
                    contacts: draft.contacts.map((contact) => ({
                      ...contact,
                      companyName: String(value),
                    })),
                  }
                : {}),
            }
          : draft,
      ),
    );
  };

  const toggleCompanyRegisterParticipation = (draftId: string, course: string) => {
    setCompanyRegisterDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              participationItems: draft.participationItems.includes(course)
                ? draft.participationItems.filter((item) => item !== course)
                : [...draft.participationItems, course],
            }
          : draft,
      ),
    );
  };

  const setCompanyRegisterIndustrySelection = (draftId: string, primaryIndustry: string) => {
    const matchedIndustry = industryOptions.find((option) => option.primary === primaryIndustry) ?? industryOptions[0];

    setCompanyRegisterDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== draftId) return draft;

        const nextDetailIndustries = matchedIndustry.details.slice(0, 1);
        return {
          ...draft,
          primaryIndustry: matchedIndustry.primary,
          detailIndustries: nextDetailIndustries,
          detailIndustry: nextDetailIndustries.join(', '),
        };
      }),
    );
  };

  const toggleCompanyRegisterDetailIndustry = (draftId: string, detailIndustry: string) => {
    setCompanyRegisterDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== draftId) return draft;

        const nextDetailIndustries = draft.detailIndustries.includes(detailIndustry)
          ? draft.detailIndustries.filter((item) => item !== detailIndustry)
          : [...draft.detailIndustries, detailIndustry];

        return {
          ...draft,
          detailIndustries: nextDetailIndustries,
          detailIndustry: nextDetailIndustries.join(', '),
        };
      }),
    );
  };

  const addCompanyRegisterContact = (draftId: string) => {
    setCompanyRegisterDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              contacts: [...draft.contacts, createCompanyRegisterContactDraft(draft.name.trim() || companyRows[0]?.name || '')],
            }
          : draft,
      ),
    );
  };

  const openCompanyContactRegisterDialog = (options?: {
    mode?: 'detail' | 'company_register';
    companyRegisterDraftId?: string;
    lockedCompanyName?: string;
  }) => {
    const mode = options?.mode ?? 'detail';
    const lockedCompanyName = options?.lockedCompanyName ?? '';
    const sourceDrafts =
      mode === 'company_register' && options?.companyRegisterDraftId
        ? companyRegisterDrafts.find((draft) => draft.id === options.companyRegisterDraftId)?.contacts ?? []
        : [];
    const nextDrafts =
      sourceDrafts.length > 0
        ? sourceDrafts.map((draft) => ({
            ...draft,
            companyName: lockedCompanyName || draft.companyName,
          }))
        : [createCompanyContactRegisterDraft(lockedCompanyName)];
    const firstDraft = nextDrafts[0];

    setCompanyContactRegisterMode(mode);
    setCompanyContactRegisterTargetCompanyRegisterDraftId(options?.companyRegisterDraftId ?? null);
    setCompanyContactRegisterLockedCompanyName(lockedCompanyName);
    setCompanyContactRegisterDrafts(nextDrafts);
    setActiveCompanyContactRegisterDraftId(firstDraft.id);
    setOpenCompanyContactRegisterCompanyPickerId(null);
    setOpenCompanyContactRegisterCoursePickerId(null);
    setCompanyContactRegisterCompanySearchQueryById({});
    setCompanyContactRegisterCourseSearchQueryById({});
    setCompanyContactRegisterCourseSelectionById(
      Object.fromEntries(nextDrafts.map((draft) => [draft.id, draft.participationItems])) as Record<string, string[]>,
    );
    setIsCompanyContactRegisterDialogOpen(true);
  };

  const finalizeCloseCompanyContactRegisterDialog = () => {
    setIsCompanyContactRegisterDialogOpen(false);
    setCompanyContactRegisterDrafts([]);
    setActiveCompanyContactRegisterDraftId(null);
    setOpenCompanyContactRegisterCompanyPickerId(null);
    setOpenCompanyContactRegisterCoursePickerId(null);
    setCompanyContactRegisterCompanySearchQueryById({});
    setCompanyContactRegisterCourseSearchQueryById({});
    setCompanyContactRegisterCourseSelectionById({});
    setCompanyContactRegisterMode('detail');
    setCompanyContactRegisterTargetCompanyRegisterDraftId(null);
    setCompanyContactRegisterLockedCompanyName('');
  };

  const requestCloseCompanyContactRegisterDialog = () => {
    setPendingDialogCloseConfirmTarget('company_contact_register');
  };

  const handleCompanyContactRegisterDialogCloseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    requestCloseCompanyContactRegisterDialog();
  };

  const addCompanyContactRegisterDraft = () => {
    const nextDraft = createCompanyContactRegisterDraft(companyContactRegisterLockedCompanyName);
    setCompanyContactRegisterDrafts((current) => [...current, nextDraft]);
    setActiveCompanyContactRegisterDraftId(nextDraft.id);
    setCompanyContactRegisterCourseSelectionById((current) => ({
      ...current,
      [nextDraft.id]: [],
    }));
  };

  const removeCompanyContactRegisterDraft = (draftId: string) => {
    setCompanyContactRegisterDrafts((current) => {
      if (current.length <= 1) {
        const nextDraft = createCompanyContactRegisterDraft(companyContactRegisterLockedCompanyName);
        setActiveCompanyContactRegisterDraftId(nextDraft.id);
        setCompanyContactRegisterCourseSelectionById((currentSelection) => ({
          ...currentSelection,
          [nextDraft.id]: [],
        }));
        return [nextDraft];
      }

      const nextDrafts = current.filter((draft) => draft.id !== draftId);
      setActiveCompanyContactRegisterDraftId((currentActive) => {
        if (currentActive !== draftId) return currentActive;
        const nextActiveId = nextDrafts[0]?.id ?? null;
        if (nextActiveId) {
          setCompanyContactRegisterCourseSelectionById((currentSelection) => ({
            ...currentSelection,
            [nextActiveId]: nextDrafts[0]?.participationItems ?? [],
          }));
        }
        return nextActiveId;
      });
      return nextDrafts;
    });
    setOpenCompanyContactRegisterCompanyPickerId((current) => (current === draftId ? null : current));
    setOpenCompanyContactRegisterCoursePickerId((current) => (current === draftId ? null : current));
    setCompanyContactRegisterCompanySearchQueryById((current) => {
      const next = { ...current };
      delete next[draftId];
      return next;
    });
    setCompanyContactRegisterCourseSearchQueryById((current) => {
      const next = { ...current };
      delete next[draftId];
      return next;
    });
    setCompanyContactRegisterCourseSelectionById((current) => {
      const next = { ...current };
      delete next[draftId];
      return next;
    });
  };

  const updateCompanyContactRegisterDraft = <K extends keyof Omit<CompanyRegisterContactDraft, 'id'>>(
    draftId: string,
    field: K,
    value: CompanyRegisterContactDraft[K],
  ) => {
    setCompanyContactRegisterDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              [field]: value,
            }
          : draft,
      ),
    );
  };

  const updateCompanyContactRegisterPhone = (draftId: string, value: string) => {
    updateCompanyContactRegisterDraft(draftId, 'phone', formatPhoneNumber(value));
  };

  const toggleCompanyContactRegisterCompanyPicker = (draftId: string) => {
    setOpenCompanyContactRegisterCoursePickerId(null);
    setOpenCompanyContactRegisterCompanyPickerId((current) => (current === draftId ? null : draftId));
  };

  const toggleCompanyContactRegisterCoursePicker = (draftId: string) => {
    setOpenCompanyContactRegisterCompanyPickerId(null);
    setOpenCompanyContactRegisterCoursePickerId((current) => {
      if (current === draftId) return null;
      setCompanyContactRegisterCourseSelectionById((selectionCurrent) => ({
        ...selectionCurrent,
        [draftId]: companyContactRegisterDrafts.find((draft) => draft.id === draftId)?.participationItems ?? [],
      }));
      return draftId;
    });
  };

  const updateCompanyContactRegisterCourseSelection = (draftId: string, course: string) => {
    setCompanyContactRegisterCourseSelectionById((current) => {
      const currentSelection = current[draftId] ?? [];
      return {
        ...current,
        [draftId]: currentSelection.includes(course)
          ? currentSelection.filter((item) => item !== course)
          : [...currentSelection, course],
      };
    });
  };

  const confirmCompanyContactRegisterCourseSelection = (draftId: string) => {
    const nextSelection = companyContactRegisterCourseSelectionById[draftId] ?? [];
    updateCompanyContactRegisterDraft(draftId, 'participationItems', nextSelection);
    setCompanyContactRegisterCourseSelectionById((current) => ({
      ...current,
      [draftId]: nextSelection,
    }));
    setOpenCompanyContactRegisterCoursePickerId(null);
  };

  const cancelCompanyContactRegisterCourseSelection = (draftId: string) => {
    const currentDraft = companyContactRegisterDrafts.find((draft) => draft.id === draftId);
    setCompanyContactRegisterCourseSelectionById((current) => ({
      ...current,
      [draftId]: currentDraft?.participationItems ?? [],
    }));
    setOpenCompanyContactRegisterCoursePickerId(null);
  };

  const toggleCompanyContactRegisterParticipation = (draftId: string, course: string) => {
    setCompanyContactRegisterDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              participationItems: draft.participationItems.includes(course)
                ? draft.participationItems.filter((item) => item !== course)
                : [...draft.participationItems, course],
            }
          : draft,
      ),
    );
  };

  const saveCompanyContactRegister = () => {
    const firstInvalidMessage = companyContactRegisterDrafts.flatMap((draft) => [
      ...(companyContactRegisterWarningsById[draft.id]?.messages ?? []),
      ...(companyContactRegisterValidationById[draft.id] ?? []),
    ])[0];
    if (firstInvalidMessage) {
      showStatusToast(firstInvalidMessage, 'error');
      return;
    }

    const invalidDraft = companyContactRegisterDrafts.find(
      (draft) => !draft.name.trim() || !draft.companyName.trim() || !draft.phone.trim(),
    );

    if (invalidDraft) {
      showStatusToast('담당자명, 기업, 연락처는 필수입니다. 중복된 값이 있는지도 확인해 주세요.', 'error');
      return;
    }

    const nextContacts: CompanyDetailContact[] = companyContactRegisterDrafts.map((draft) => ({
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      companyName: draft.companyName.trim(),
      name: draft.name.trim(),
      status: '미가입',
      department: draft.department.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      participationSummary: summarizeParticipationItems(draft.participationItems),
      participationItems: draft.participationItems,
      marketingConsent: false,
    }));

    if (companyContactRegisterMode === 'company_register') {
      if (!companyContactRegisterTargetCompanyRegisterDraftId) {
        showStatusToast('담당자 정보를 저장할 기업을 찾을 수 없습니다.', 'error');
        return;
      }

      setCompanyRegisterDrafts((current) =>
        current.map((draft) =>
          draft.id === companyContactRegisterTargetCompanyRegisterDraftId
            ? {
                ...draft,
                contacts: nextContacts.map((contact) => ({
                  ...contact,
                  companyName: companyContactRegisterLockedCompanyName || contact.companyName,
                })),
              }
            : draft,
        ),
      );

      finalizeCloseCompanyContactRegisterDialog();
      showStatusToast('기업 담당자를 추가했습니다.', 'success');
      return;
    }

    setCompanyDetailContacts((current) => {
      const nextContactsList = [...current, ...nextContacts];
      const companyParticipationItemsByName = collectCompanyParticipationItems(nextContactsList);

      setCompanyRows((companies) =>
        companies.map((company) => {
          const participationItems = companyParticipationItemsByName.get(company.name);
          if (!participationItems) return company;

          return {
            ...company,
            participation: participationItems.length ? '참여 이력 있음' : '참여 이력 없음',
          };
        }),
      );

      return nextContactsList;
    });

    finalizeCloseCompanyContactRegisterDialog();
    showStatusToast('기업 담당자를 추가했습니다.', 'success');
  };

  const hideCompanyContactRegisterWarningTooltip = () => {
    setCompanyContactRegisterWarningTooltip(null);
  };

  const hideCompanyRegisterWarningTooltip = () => {
    setCompanyRegisterWarningTooltip(null);
  };

  const showCompanyContactRegisterWarningTooltip = (element: HTMLElement, message: string) => {
    const rect = element.getBoundingClientRect();
    const maxTooltipWidth = 360;
    const viewportPadding = 20;
    const nextLeft = Math.min(
      Math.max(rect.left + rect.width / 2, viewportPadding + maxTooltipWidth / 2),
      window.innerWidth - viewportPadding - maxTooltipWidth / 2,
    );

    setCompanyContactRegisterWarningTooltip({
      message,
      top: rect.bottom + 10,
      left: nextLeft,
    });
  };

  const showCompanyRegisterWarningTooltip = (element: HTMLElement, message: string) => {
    const rect = element.getBoundingClientRect();
    const maxTooltipWidth = 360;
    const viewportPadding = 20;
    const nextLeft = Math.min(
      Math.max(rect.left + rect.width / 2, viewportPadding + maxTooltipWidth / 2),
      window.innerWidth - viewportPadding - maxTooltipWidth / 2,
    );

    setCompanyRegisterWarningTooltip({
      message,
      top: rect.bottom + 10,
      left: nextLeft,
    });
  };

  useEffect(() => {
    if (!isCompanyContactRegisterDialogOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('.company-register-dialog__picker') || target.closest('.company-register-dialog__picker-menu')) return;

      if (
        openCompanyContactRegisterCompanyPickerId &&
        !target.closest(`[data-company-contact-company-picker="${openCompanyContactRegisterCompanyPickerId}"]`)
      ) {
        setOpenCompanyContactRegisterCompanyPickerId(null);
      }

      if (
        openCompanyContactRegisterCoursePickerId &&
        !target.closest(`[data-company-contact-course-picker="${openCompanyContactRegisterCoursePickerId}"]`)
      ) {
        cancelCompanyContactRegisterCourseSelection(openCompanyContactRegisterCoursePickerId);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCompanyContactRegisterDialogOpen, openCompanyContactRegisterCompanyPickerId, openCompanyContactRegisterCoursePickerId]);

  useEffect(() => {
    if (!isCompanyContactRegisterDialogOpen) {
      setCompanyContactRegisterWarningTooltip(null);
    }
  }, [isCompanyContactRegisterDialogOpen]);

  useEffect(() => {
    if (!isCompanyRegisterDialogOpen) {
      setCompanyRegisterWarningTooltip(null);
    }
  }, [isCompanyRegisterDialogOpen]);

  useEffect(() => {
    if (!companyContactRegisterWarningTooltip) return;

    const handleViewportChange = () => {
      setCompanyContactRegisterWarningTooltip(null);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [companyContactRegisterWarningTooltip]);

  useEffect(() => {
    if (!companyRegisterWarningTooltip) return;

    const handleViewportChange = () => {
      setCompanyRegisterWarningTooltip(null);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [companyRegisterWarningTooltip]);

  useEffect(() => {
    if (!isContactEditDialogOpen || !openContactEditPicker) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('.company-register-dialog__picker') || target.closest('.company-register-dialog__picker-menu')) return;

      setOpenContactEditPicker(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isContactEditDialogOpen, openContactEditPicker]);

  const removeCompanyRegisterContact = (draftId: string, contactId: string) => {
    setCompanyRegisterDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              contacts: draft.contacts.filter((contact) => contact.id !== contactId),
            }
          : draft,
      ),
    );
    setOpenCompanyRegisterContactCoursePickerId((current) => (current === contactId ? null : current));
    setOpenCompanyRegisterContactCompanyPickerId((current) => (current === contactId ? null : current));
    setCompanyRegisterContactCompanySearchQueryById((current) => {
      const next = { ...current };
      delete next[contactId];
      return next;
    });
    setCompanyRegisterContactCourseSearchQueryById((current) => {
      const next = { ...current };
      delete next[contactId];
      return next;
    });
  };

  const toggleCompanyRegisterContactCompanyPicker = (contactId: string, anchorElement?: HTMLElement) => {
    setOpenCompanyRegisterContactCoursePickerId(null);
    setCompanyRegisterIndustryPickerMode(null);
    setOpenCompanyRegisterContactCompanyPickerId((current) => {
      const next = current === contactId ? null : contactId;
      if (next && anchorElement) {
        updateCompanyRegisterPickerMenuPosition(anchorElement);
      } else if (!next) {
        setCompanyRegisterPickerMenuStyle(null);
        companyRegisterPickerAnchorRef.current = null;
      }
      return next;
    });
  };

  const toggleCompanyRegisterContactCoursePicker = (contactId: string, anchorElement?: HTMLElement) => {
    setOpenCompanyRegisterContactCompanyPickerId(null);
    setCompanyRegisterIndustryPickerMode(null);
    setOpenCompanyRegisterContactCoursePickerId((current) => {
      const next = current === contactId ? null : contactId;
      if (next && anchorElement) {
        updateCompanyRegisterPickerMenuPosition(anchorElement);
      } else if (!next) {
        setCompanyRegisterPickerMenuStyle(null);
        companyRegisterPickerAnchorRef.current = null;
      }
      return next;
    });
  };

  const updateCompanyRegisterContact = <K extends keyof Omit<CompanyRegisterContactDraft, 'id'>>(
    draftId: string,
    contactId: string,
    field: K,
    value: CompanyRegisterContactDraft[K],
  ) => {
    setCompanyRegisterDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              contacts: draft.contacts.map((contact) =>
                contact.id === contactId
                  ? {
                      ...contact,
                      [field]: value,
                    }
                  : contact,
              ),
            }
          : draft,
      ),
    );
  };

  const updateCompanyRegisterContactPhone = (draftId: string, contactId: string, value: string) => {
    updateCompanyRegisterContact(draftId, contactId, 'phone', formatPhoneNumber(value));
  };

  const toggleCompanyRegisterContactParticipation = (draftId: string, contactId: string, course: string) => {
    setCompanyRegisterDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              contacts: draft.contacts.map((contact) =>
                contact.id === contactId
                  ? {
                      ...contact,
                      participationItems: contact.participationItems.includes(course)
                        ? contact.participationItems.filter((item) => item !== course)
                        : [...contact.participationItems, course],
                    }
                  : contact,
              ),
            }
          : draft,
      ),
    );
  };

  const addCompanyRegisterDraft = () => {
    const nextDraft = createCompanyRegisterDraft();
    setCompanyRegisterDrafts((current) => [...current, nextDraft]);
    setActiveCompanyRegisterDraftId(nextDraft.id);
    closeCompanyRegisterPickers();
  };

  const removeCompanyRegisterDraft = (draftId: string) => {
    setCompanyRegisterDrafts((current) => {
      if (current.length <= 1) {
        const nextDraft = createCompanyRegisterDraft();
        setActiveCompanyRegisterDraftId(nextDraft.id);
        return [nextDraft];
      }

      const nextDrafts = current.filter((draft) => draft.id !== draftId);
      if (draftId === activeCompanyRegisterDraftId) {
        const removedIndex = current.findIndex((draft) => draft.id === draftId);
        const fallbackDraft = nextDrafts[removedIndex] ?? nextDrafts[removedIndex - 1] ?? nextDrafts[0];
        if (fallbackDraft) {
          setActiveCompanyRegisterDraftId(fallbackDraft.id);
        }
      }

      return nextDrafts;
    });
  };

  function closePendingDeleteDialog() {
    setPendingDeleteDialog(null);
  }

  function closePendingDialogCloseConfirm() {
    setPendingDialogCloseConfirmTarget(null);
  }

  function confirmPendingDialogClose() {
    if (pendingDialogCloseConfirmTarget === 'company_register') {
      finalizeCloseCompanyRegisterDialog();
    } else if (pendingDialogCloseConfirmTarget === 'company_contact_register') {
      finalizeCloseCompanyContactRegisterDialog();
    }

    setPendingDialogCloseConfirmTarget(null);
  }

  function confirmPendingDelete() {
    if (!pendingDeleteDialog) return;

    if (pendingDeleteDialog.kind === 'company_memo') {
      handleDeleteCompanyMemo(pendingDeleteDialog.companyKey, pendingDeleteDialog.memoId);
    } else if (pendingDeleteDialog.kind === 'contact_memo') {
      handleDeleteContactMemoAction(pendingDeleteDialog.contactId, pendingDeleteDialog.memoId);
    } else if (pendingDeleteDialog.kind === 'contact_delete') {
      removeCompanyContact(pendingDeleteDialog.contactId);
    } else if (pendingDeleteDialog.kind === 'company_file') {
      handleDeleteCompanyFile(pendingDeleteDialog.fileId);
    } else if (pendingDeleteDialog.kind === 'register_draft') {
      removeCompanyRegisterDraft(pendingDeleteDialog.draftId);
    } else if (pendingDeleteDialog.kind === 'excel_file') {
      clearCompanyExcelFile();
    }

    setPendingDeleteDialog(null);
  }

  const selectCompanyRegisterDraft = (draftId: string) => {
    setActiveCompanyRegisterDraftId(draftId);
    closeCompanyRegisterPickers();
  };

  const focusTabById = (tabId: string) => {
    setActiveTabId(tabId);
    syncTabSelection(tabId);
  };

  const closeTab = (tabId: string) => {
    setOpenTabs((current) => current.filter((tab) => tab.id !== tabId));
    setTabHistory((current) => {
      const filtered = current.stack.filter((id) => id !== tabId);
      const nextStack = filtered.length ? filtered : [makeTabId(['기업 관리'])];
      const nextIndex = Math.min(current.index, nextStack.length - 1);
      const nextActive = nextStack[nextIndex];
      setActiveTabId(nextActive);
      syncTabSelection(nextActive);
      return { stack: nextStack, index: nextIndex };
    });
  };

  const goBackInHistory = () => {
    setTabHistory((current) => {
      if (current.index <= 0) return current;
      const nextIndex = current.index - 1;
      const nextActive = current.stack[nextIndex];
      setActiveTabId(nextActive);
      syncTabSelection(nextActive);
      return { ...current, index: nextIndex };
    });
  };

  const goForwardInHistory = () => {
    setTabHistory((current) => {
      if (current.index >= current.stack.length - 1) return current;
      const nextIndex = current.index + 1;
      const nextActive = current.stack[nextIndex];
      setActiveTabId(nextActive);
      syncTabSelection(nextActive);
      return { ...current, index: nextIndex };
    });
  };

  return (
    <div className={`crm-shell ${isSidebarCollapsed ? 'crm-shell--sidebar-collapsed' : ''}`}>
      <aside className={`crm-sidebar ${isSidebarCollapsed ? 'crm-sidebar--collapsed' : ''}`} aria-label="사이드바">
        <div className="crm-sidebar__scroll-area">
          <div className="crm-sidebar__brand-row">
            <img className="crm-sidebar__brand" src="/assets/crm-logo.svg" alt="통합관리솔루션" />
            <div className="crm-sidebar__brand-actions" aria-label="도구">
              <IconButton
                label="통합검색 열기"
                src="/assets/search.svg"
                onClick={() => setIsSearchDialogOpen(true)}
                ariaHaspopup="dialog"
                ariaExpanded={isSearchDialogOpen}
              />
              <IconButton
                label={isSidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
                src="/assets/pannel.svg"
                onClick={() => setIsSidebarCollapsed((value) => !value)}
                pressed={isSidebarCollapsed}
                tooltip={isSidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
                tooltipSide="right"
              />
            </div>
          </div>

          <div className="workspace-switch" role="tablist" aria-label="워크스페이스 전환">
            <button
              className={`workspace-switch__item ${activeWorkspace === '스팩' ? 'workspace-switch__item--active' : ''}`}
              type="button"
              aria-pressed={activeWorkspace === '스팩'}
              onClick={() => setActiveWorkspace('스팩')}
            >
              <img className="workspace-switch__logo" src="/assets/sniperfactory.svg" alt="" aria-hidden="true" />
              <span>스팩</span>
            </button>
            <button
              className={`workspace-switch__item ${activeWorkspace === '인사' ? 'workspace-switch__item--active' : ''}`}
              type="button"
              aria-pressed={activeWorkspace === '인사'}
              onClick={() => setActiveWorkspace('인사')}
            >
              <img className="workspace-switch__logo" src="/assets/insideout.svg" alt="" aria-hidden="true" />
              <span>인사</span>
            </button>
          </div>

          <nav className="sidebar-nav" aria-label="주요 메뉴">
            {sidebarItems.map((item) => (
              <SidebarMenuGroup
                key={item.label}
                item={item}
                open={Boolean(openSections[item.label])}
                activeLabel={activeTabLabel}
                onToggle={() =>
                  setOpenSections((current) => ({
                    ...current,
                    [item.label]: !current[item.label],
                  }))
                }
                collapsed={isSidebarCollapsed}
                onOpenPage={openSidebarTab}
              />
            ))}
          </nav>

          <section className="favorites" aria-label="즐겨찾는 교육과정">
            <div className="favorites__title">즐겨찾는 교육과정</div>
            {favoriteCourses.map((course, index) => (
              <div key={`${course.label}-${index}`} className={`favorite-card ${course.featured ? 'favorite-card--featured' : ''}`}>
                <span className="favorite-card__label">{course.label}</span>
                <FavoriteStarIcon featured={Boolean(course.featured)} />
              </div>
            ))}
          </section>

        </div>

        <div className={`crm-sidebar__profile-wrap ${isSidebarProfileMenuOpen ? 'crm-sidebar__profile-wrap--open' : ''}`} ref={sidebarProfileMenuRef}>
          <div className="crm-sidebar__utility" aria-label="도움 메뉴">
            {sidebarQuickLinks.map((item) => (
              <SidebarUtilityMenuItem
                key={item.label}
                item={item}
                isServiceMenuOpen={isSidebarServiceMenuOpen}
                onToggleServiceMenu={toggleSidebarServiceMenu}
                onOpenPage={openSidebarTab}
                onCloseServiceMenu={() => setIsSidebarServiceMenuOpen(false)}
              />
            ))}
          </div>

          <button
            type="button"
            className="crm-sidebar__profile-button"
            aria-haspopup="menu"
            aria-expanded={isSidebarProfileMenuOpen}
            aria-label="프로필 메뉴 열기"
            onClick={openSidebarProfileMenu}
          >
            <span className="crm-sidebar__profile-avatar" aria-hidden="true">
              오
            </span>
            <span className="crm-sidebar__profile-copy">
              <span className="crm-sidebar__profile-name">오민진(안나)</span>
              <span className="crm-sidebar__profile-role">운영 관리자</span>
            </span>
          </button>

          <div className="crm-sidebar__profile-menu" role="menu" aria-label="프로필 메뉴">
            <button type="button" className="crm-sidebar__profile-menu-item" role="menuitem" onClick={openPasswordChangeDialog}>
              비밀번호 변경
            </button>
            <button type="button" className="crm-sidebar__profile-menu-item crm-sidebar__profile-menu-item--danger" role="menuitem" onClick={openLogoutDialog}>
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      <main className="crm-main">
        <div className="content-tabs-bar" role="navigation" aria-label="열어본 페이지 탭">
          <div className="content-tabs-bar__nav">
            <button type="button" className="content-tabs-bar__arrow" onClick={goBackInHistory} aria-label="이전 탭으로 이동" disabled={!canGoBack}>
              <ArrowIcon direction="left" />
            </button>
            <button type="button" className="content-tabs-bar__arrow" onClick={goForwardInHistory} aria-label="다음 탭으로 이동" disabled={!canGoForward}>
              <ArrowIcon direction="right" />
            </button>
          </div>

          <div className="content-tabs-bar__tabs">
            {openTabs.map((tab) => (
              <div key={tab.id} className={`content-tab ${tab.id === activeTabId ? 'content-tab--active' : ''}`}>
                <button type="button" className="content-tab__main" onClick={() => focusTabById(tab.id)}>
                  <span className="content-tab__icon" aria-hidden="true">
                    <SidebarIcon src={tab.iconSrc} />
                  </span>
                  <span className="content-tab__label">{tab.label}</span>
                </button>
                <button type="button" className="content-tab__close" aria-label={`${tab.label} 닫기`} onClick={() => closeTab(tab.id)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {!isCompanyDetailView ? (
          <section className="title-section" aria-label="페이지 제목">
            <div className="title-section__tabs" role="tablist" aria-label="주요 보기 전환">
              <button
                type="button"
                className={`title-section__tab ${activeCompanyView === '기업' ? 'title-section__tab--active' : ''}`}
                role="tab"
                aria-selected={activeCompanyView === '기업'}
                onClick={() => {
                  setIsRegisterMenuOpen(false);
                  setActiveCompanyView('기업');
                  setHighlightedCompanyKey(null);
                }}
              >
                <span>기업</span>
              </button>
              <button
                type="button"
                className={`title-section__tab ${activeCompanyView === '기업 담당자' ? 'title-section__tab--active' : ''}`}
                role="tab"
                aria-selected={activeCompanyView === '기업 담당자'}
                onClick={() => {
                  setIsRegisterMenuOpen(false);
                  setActiveCompanyView('기업 담당자');
                }}
              >
                <span>기업 담당자</span>
              </button>
            </div>

            <div className="title-section__actions" ref={titleActionsRef}>
              <button
                type="button"
                className={`title-section__link ${isDownloadHistoryPanelOpen ? 'title-section__link--active' : ''}`}
                onClick={openDownloadHistoryPanel}
              >
                <TitleSectionIcon src="/assets/download-history.svg" />
                <span>다운로드 이력</span>
              </button>

              <div className={`register-dropdown ${isRegisterMenuOpen ? 'register-dropdown--open' : ''}`}>
                <button
                  type="button"
                  className="register-dropdown__trigger"
                  aria-haspopup="menu"
                  aria-expanded={activeCompanyView === '기업' ? isRegisterMenuOpen : false}
                  onClick={() => {
                    if (activeCompanyView === '기업 담당자') {
                      setIsRegisterMenuOpen(false);
                      openCompanyContactRegisterDialog();
                      return;
                    }

                    setIsRegisterMenuOpen((current) => !current);
                  }}
                >
                  <TitleSectionIcon src="/assets/plus.svg" />
                  <span>{activeCompanyView === '기업 담당자' ? '담당자 추가' : '기업 등록'}</span>
                </button>

                {activeCompanyView === '기업' ? (
                  <div
                    className="register-dropdown__menu"
                    role="menu"
                    aria-label="기업 등록 메뉴"
                  >
                    <button type="button" className="register-dropdown__menu-item" role="menuitem" onClick={openCompanyRegisterDialog}>
                      직접 입력
                    </button>
                    <button type="button" className="register-dropdown__menu-item" role="menuitem" onClick={openCompanyExcelRegisterDialog}>
                      엑셀로 일괄 등록
                    </button>
                    <button type="button" className="register-dropdown__menu-item" role="menuitem">
                      엑셀 템플릿 다운
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {activeCompanyView === '기업' ? (
          selectedDetailCompany ? (
            <div
              className={`company-detail-layout ${
                isCompanyMemoPanelCollapsed ? 'company-detail-layout--memo-collapsed' : ''
              }`}
            >
              <section className="company-detail company-detail--frame" aria-label="기업 상세">
                <div className="company-detail__workspace">
                  <div className="company-detail__main-column">
                    <div className="company-detail__hero-shell">
                      <div className="company-detail__banner" aria-hidden="true" />
                      <div className="company-detail__header">
                        <div
                          ref={companyDetailLogoMenuRef}
                          className={`company-detail__hero-logo-wrap ${isCompanyDetailLogoMenuOpen ? 'company-detail__hero-logo-wrap--open' : ''}`}
                        >
                          <input
                            ref={companyDetailLogoInputRef}
                            className="company-detail__hero-logo-input"
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              void handleCompanyDetailLogoUpload(event.target.files);
                            }}
                          />
                          <div className="company-detail__hero-logo">
                            <div className="company-detail__hero-logo-media">
                              {activeCompanyLogoSrc ? (
                                <img
                                  className="company-detail__hero-logo-image"
                                  src={activeCompanyLogoSrc}
                                  alt={`${selectedDetailCompany.name} 로고`}
                                />
                              ) : (
                                <img
                                  className="company-detail__hero-logo-fallback"
                                  src="/assets/company-profile-default.svg"
                                  alt="기본 기업 프로필"
                                />
                              )}
                            </div>
                            <button
                              type="button"
                              className="company-detail__hero-logo-add"
                              aria-label="로고 메뉴 열기"
                              aria-haspopup="menu"
                              aria-expanded={isCompanyDetailLogoMenuOpen}
                              onClick={() => setIsCompanyDetailLogoMenuOpen((current) => !current)}
                            >
                              <AssetIcon src="/assets/plus.svg" className="company-detail__hero-logo-add-icon" />
                            </button>
                          </div>
                          <div className="company-detail__hero-logo-menu" role="dialog" aria-label="로고 파일">
                            <div className="company-detail__hero-logo-menu-header">
                              <div className="company-detail__hero-logo-menu-title">로고 파일</div>
                              <div className="company-detail__hero-logo-menu-actions">
                                <button
                                  type="button"
                                  className="company-detail__hero-logo-menu-action company-detail__hero-logo-menu-action--ghost"
                                  onClick={() => handleDownloadMultipleCompanyFiles(activeCompanyLogoFiles)}
                                  disabled={!activeCompanyLogoFiles.length}
                                >
                                  전체 파일 다운로드
                                </button>
                                <button
                                  type="button"
                                  className="company-detail__hero-logo-menu-action company-detail__hero-logo-menu-action--ghost"
                                  onClick={triggerCompanyDetailLogoPicker}
                                >
                                  파일 추가
                                </button>
                              </div>
                            </div>

                            {activeCompanyLogoFiles.length ? (
                              <div className="company-detail__hero-logo-file-grid">
                                {activeCompanyLogoFiles.map((file) => (
                                  <article
                                    key={file.id}
                                    className={`company-detail__hero-logo-file-card ${
                                      activeCompanyLogoSrc === file.objectUrl ? 'company-detail__hero-logo-file-card--selected' : ''
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      className="company-detail__hero-logo-file-select"
                                      aria-pressed={activeCompanyLogoSrc === file.objectUrl}
                                      aria-label={`${file.name} 대표 로고로 선택`}
                                      onClick={() => handleSelectCompanyRepresentativeLogo(file)}
                                    >
                                      {activeCompanyLogoSrc === file.objectUrl ? (
                                        <span className="company-detail__hero-logo-file-badge">대표 로고</span>
                                      ) : null}
                                    <div className="company-detail__hero-logo-file-preview">
                                      {file.isImage && file.previewUrl ? (
                                        <img src={file.previewUrl} alt={file.name} className="company-detail__hero-logo-file-preview-image" />
                                      ) : (
                                        <div className="company-detail__hero-logo-file-preview-fallback">{file.extension.toUpperCase()}</div>
                                      )}
                                    </div>
                                    </button>
                                    <div className="company-detail__hero-logo-file-actions">
                                      <button
                                        type="button"
                                        className="company-detail__hero-logo-file-action company-detail__hero-logo-file-action--danger"
                                        onClick={() => setPendingDeleteDialog({ kind: 'company_file', fileId: file.id })}
                                      >
                                        삭제
                                      </button>
                                      <button
                                        type="button"
                                        className="company-detail__hero-logo-file-action company-detail__hero-logo-file-action--primary"
                                        onClick={() => handleDownloadCompanyFile(file)}
                                      >
                                        다운
                                      </button>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            ) : (
                              <div className="company-detail__hero-logo-file-empty">등록된 로고 파일이 없습니다.</div>
                            )}
                          </div>
                        </div>
                        <div className="company-detail__header-main">
                          <div className="company-detail__title-row">
                            <h3 className="company-detail__title">{selectedDetailCompany.name}</h3>
                            <span
                              className={`company-detail__title-dot ${isDetailCompanyTagged ? 'company-detail__title-dot--active' : ''}`}
                              aria-hidden="true"
                            />
                            <button
                              type="button"
                              className={`company-detail__tag-edit ${isDetailCompanyTagged ? 'company-detail__tag-edit--active' : ''}`}
                              onClick={() => {
                                if (!selectedDetailCompanyKey) return;
                                if (isDetailCompanyTagged) {
                                  openCompanyTagRemovalDialog(selectedDetailCompanyKey);
                                  return;
                                }
                                openCompanyTagDialog(selectedDetailCompanyKey);
                              }}
                            >
                              {isDetailCompanyTagged ? '태그 해제' : '태그 추가'}
                            </button>
                          </div>
                          <p className="company-detail__header-subtitle">
                            {selectedDetailCompany.primaryIndustry} / {selectedDetailCompany.detailIndustry}
                          </p>
                        </div>

                        <div className="company-detail__header-actions" aria-label="기업 작업">
                          <button type="button" className="company-detail__quick-action" onClick={handleCopyCompanyShareLink}>
                            <AssetIcon src="/assets/share.svg" className="company-detail__quick-action-symbol" />
                            <span className="company-detail__quick-action-label">공유</span>
                          </button>
                          <button type="button" className="company-detail__quick-action">
                            <AssetIcon src="/assets/message.svg" className="company-detail__quick-action-symbol" />
                            <span className="company-detail__quick-action-label">문자 보내기</span>
                          </button>
                          <div className="company-detail__delete-group">
                            <button
                              type="button"
                              className="company-detail__quick-action company-detail__quick-action--delete"
                              onClick={openCompanyDeleteDialog}
                              disabled={isCompanyDeleteDisabled}
                            >
                              <span className="company-detail__delete-icon">
                                <AssetIcon src="/assets/trash.svg" className="company-detail__delete-icon-symbol" />
                              </span>
                              <span className="company-detail__quick-action-label">기업 삭제</span>
                            </button>
                            <div className="company-detail__delete-guide" aria-label="기업 삭제 안내">
                              <button type="button" className="company-detail__delete-guide-button" aria-label="기업 삭제 조건 안내">
                                <AssetIcon src="/assets/guide.svg" className="company-detail__delete-guide-icon" />
                              </button>
                              <div className="company-detail__delete-guide-tooltip" role="tooltip">
                                기업 또는 담당자 계정이 가입 완료 상태인 경우에는 삭제할 수 없습니다.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="company-detail__tabs" role="tablist" aria-label="기업 상세 탭">
                      {(['기업 정보', '담당자', '참여 이력', '파일', '보낸 문자'] satisfies CompanyDetailTab[]).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          className={`company-detail__tab ${companyDetailTab === tab ? 'company-detail__tab--active' : ''}`}
                          role="tab"
                          aria-selected={companyDetailTab === tab}
                          onClick={() => setCompanyDetailTab(tab)}
                        >
                          <span>{tab}</span>
                        </button>
                      ))}
                    </div>

                    {companyDetailTab === '기업 정보' ? (
                      <section className="company-detail__summary-card" aria-label="기업 정보 요약">
                        <div className="company-detail__summary-head">
                          <div className="company-detail__summary-title">기업 정보</div>
                          {isCompanyDetailEditing ? (
                            <div className="company-detail__summary-edit-actions">
                              <button type="button" className="company-detail__summary-cancel" onClick={cancelCompanyDetailEdit}>
                                취소
                              </button>
                              <button type="button" className="company-detail__summary-save" onClick={saveCompanyDetailEdit}>
                                저장
                              </button>
                            </div>
                          ) : (
                            <button type="button" className="company-detail__summary-edit" onClick={startCompanyDetailEdit}>
                              <AssetIcon src="/assets/edit.svg" className="company-detail__summary-edit-icon" />
                              <span>정보 편집</span>
                            </button>
                          )}
                        </div>

                        <div className="company-detail__summary-grid">
                          <div className="company-detail__summary-row company-detail__summary-row--half">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">기업명</div>
                              <div className="company-detail__summary-value-box">
                                {isCompanyDetailEditing && companyDetailEditDraft ? (
                                  <input
                                    className="company-detail__summary-input"
                                    value={companyDetailEditDraft.name}
                                    onChange={(event) => updateCompanyDetailEditDraft('name', event.target.value)}
                                  />
                                ) : (
                                  <div className="company-detail__summary-value">{selectedDetailCompany.name}</div>
                                )}
                              </div>
                            </div>
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">사업자등록번호</div>
                              <div className="company-detail__summary-value-box">
                                {isCompanyDetailEditing && companyDetailEditDraft ? (
                                  <input
                                    className="company-detail__summary-input"
                                    value={companyDetailEditDraft.businessRegistrationNumber}
                                    onChange={(event) => updateCompanyDetailEditDraft('businessRegistrationNumber', event.target.value)}
                                  />
                                ) : (
                                  <>
                                    <div className="company-detail__summary-value">{selectedDetailCompany.businessRegistrationNumber}</div>
                                    <button
                                      type="button"
                                      className="company-detail__copy-button"
                                      aria-label="사업자등록번호 복사"
                                      onClick={() => void copyTextToClipboard(selectedDetailCompany.businessRegistrationNumber)}
                                    >
                                      <AssetIcon src="/assets/copy.svg" className="company-detail__copy-icon" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="company-detail__summary-row">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">기업 주소</div>
                              <div className="company-detail__summary-value-box">
                                {isCompanyDetailEditing && companyDetailEditDraft ? (
                                  <input
                                    className="company-detail__summary-input"
                                    value={companyDetailEditDraft.address}
                                    onChange={(event) => updateCompanyDetailEditDraft('address', event.target.value)}
                                  />
                                ) : (
                                  <>
                                    <div className="company-detail__summary-value">{selectedDetailCompany.address}</div>
                                    <button
                                      type="button"
                                      className="company-detail__copy-button"
                                      aria-label="기업 주소 복사"
                                      onClick={() => void handleCopyCompanyAddress(selectedDetailCompany.address)}
                                    >
                                      <AssetIcon src="/assets/copy.svg" className="company-detail__copy-icon" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="company-detail__summary-row">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">기업 홈페이지</div>
                              <div className="company-detail__summary-value-box">
                                {isCompanyDetailEditing && companyDetailEditDraft ? (
                                  <input
                                    className="company-detail__summary-input"
                                    value={companyDetailEditDraft.websiteUrl}
                                    onChange={(event) => updateCompanyDetailEditDraft('websiteUrl', event.target.value)}
                                  />
                                ) : (
                                  <>
                                    <a
                                      href={selectedDetailCompany.websiteUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="company-detail__summary-link"
                                    >
                                      {selectedDetailCompany.websiteUrl || selectedDetailCompany.websiteLabel}
                                    </a>
                                    <button
                                      type="button"
                                      className="company-detail__copy-button"
                                      aria-label="기업 홈페이지 주소 복사"
                                      onClick={() => void copyTextToClipboard(selectedDetailCompany.websiteUrl || selectedDetailCompany.websiteLabel)}
                                    >
                                      <AssetIcon src="/assets/copy.svg" className="company-detail__copy-icon" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="company-detail__summary-row company-detail__summary-row--half">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">매출액</div>
                              <div className="company-detail__summary-value-box">
                                {isCompanyDetailEditing && companyDetailEditDraft ? (
                                  <input
                                    className="company-detail__summary-input"
                                    value={companyDetailEditDraft.revenueAmount}
                                    onChange={(event) => updateCompanyDetailEditDraft('revenueAmount', event.target.value)}
                                  />
                                ) : (
                                  <div className="company-detail__summary-value">
                                    {selectedDetailCompany.revenueAmount.toLocaleString('ko-KR')}원
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">피보험자 수</div>
                              <div className="company-detail__summary-value-box">
                                {isCompanyDetailEditing && companyDetailEditDraft ? (
                                  <input
                                    className="company-detail__summary-input"
                                    value={companyDetailEditDraft.insuredCount}
                                    onChange={(event) => updateCompanyDetailEditDraft('insuredCount', event.target.value)}
                                  />
                                ) : (
                                  <div className="company-detail__summary-value">{selectedDetailCompany.insuredCount}명</div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="company-detail__summary-row">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">업종</div>
                              <div className="company-detail__summary-value-box">
                                {isCompanyDetailEditing && companyDetailEditDraft ? (
                                  <div className="company-detail__summary-split-fields">
                                    <select
                                      className="company-detail__summary-input company-detail__summary-select"
                                      value={companyDetailEditDraft.primaryIndustry}
                                      onChange={(event) => updateCompanyDetailIndustryDraft(event.target.value)}
                                      aria-label="1차 업종"
                                    >
                                      {industryOptions.map((option) => (
                                        <option key={option.primary} value={option.primary}>
                                          {option.primary}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="company-detail__summary-checklist-shell" aria-label="세부 업종">
                                      <div className="company-detail__summary-checklist-head">
                                        <span className="company-detail__summary-checklist-title">세부 업종</span>
                                        <span className="company-detail__summary-checklist-count">
                                          {companyDetailEditDraft.detailIndustries.length
                                            ? `${companyDetailEditDraft.detailIndustries.length}개 선택`
                                            : '선택 없음'}
                                        </span>
                                      </div>
                                      <div className="company-detail__summary-checklist">
                                        {(companyDetailPrimaryIndustryOption?.details ?? []).map((detail) => {
                                          const isSelected = companyDetailEditDraft.detailIndustries.includes(detail);

                                          return (
                                            <label
                                              key={detail}
                                              className={`company-detail__summary-checkitem ${isSelected ? 'company-detail__summary-checkitem--active' : ''}`}
                                            >
                                              <span className="selection-checkbox selection-checkbox--small company-detail__summary-check">
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={() => toggleCompanyDetailIndustryDraft(detail)}
                                                />
                                                <span />
                                              </span>
                                              <span className="company-detail__summary-checktext">{detail}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="company-detail__summary-value">
                                    {selectedDetailCompany.primaryIndustry} / {selectedDetailCompany.detailIndustry}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="company-detail__summary-row">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">기업 소개</div>
                              <div className="company-detail__summary-value-box company-detail__summary-value-box--multiline">
                                {isCompanyDetailEditing && companyDetailEditDraft ? (
                                  <textarea
                                    className="company-detail__summary-textarea"
                                    value={companyDetailEditDraft.description}
                                    onChange={(event) => updateCompanyDetailEditDraft('description', event.target.value)}
                                  />
                                ) : (
                                  <div className="company-detail__summary-value">
                                    {selectedDetailCompany.description ?? '기업 소개가 아직 등록되지 않았습니다.'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="company-detail__summary-row">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">유입경로</div>
                              <div className="company-detail__summary-value-box">
                                <div className="company-detail__summary-value">{selectedDetailCompany.sourcePath}</div>
                              </div>
                            </div>
                          </div>

                          <div className="company-detail__summary-row">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">마케팅 수신 동의</div>
                              <div className="company-detail__summary-value-box company-detail__summary-value-box--checkbox">
                                <span className="company-detail__checkbox is-checked" aria-hidden="true">
                                  <span className="company-detail__checkbox-mark" />
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="company-detail__summary-row company-detail__summary-row--half">
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">가입일자</div>
                              <div className="company-detail__summary-value-box company-detail__summary-value-box--status">
                                <span
                                  className={`company-detail__status-badge ${
                                    selectedDetailCompany.status === '가입완료'
                                      ? 'company-detail__status-badge--active'
                                      : 'company-detail__status-badge--inactive'
                                  }`}
                                >
                                  {selectedDetailCompany.status}
                                </span>
                                <div className="company-detail__summary-value">{formatDateTimeLabel(selectedDetailCompany.joinedAt, '09:00')}</div>
                              </div>
                            </div>
                            <div className="company-detail__summary-item">
                              <div className="company-detail__summary-label">업데이트일자</div>
                              <div className="company-detail__summary-value-box">
                                <div className="company-detail__summary-value">
                                  {formatDateTimeLabel(selectedDetailCompany.updatedAt, '18:00')} · {selectedDetailCompany.updatedBy ?? '오민진(안나)'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    ) : (
                      <section className="company-detail__tab-panel" aria-label="기업 상세 탭 패널">
                        <div className="company-detail__tab-content">
                          {companyDetailTab === '담당자' ? (
                          <>
                            <div className="company-detail__contacts-toolbar">
                              <div className="company-detail__contacts-summary">
                                <div className="company-detail__contacts-title">담당자</div>
                                <span className="company-detail__contacts-count">{companyDetailContacts.length}</span>
                                <ToolbarMenuDropdown
                                  menuKey="detail_contact_sort"
                                  label="최근 등록순"
                                  value={listSortLabels[detailContactSortOrder]}
                                  options={[
                                    { label: '최근 가입순', value: 'recent_joined' },
                                    { label: '최근 등록순', value: 'recent_registered' },
                                    { label: '이름순(가나다)', value: 'name' },
                                    { label: '오래된 등록순', value: 'oldest_registered' },
                                  ]}
                                  isOpen={openToolbarMenuKey === 'detail_contact_sort'}
                                  onToggle={() =>
                                    setOpenToolbarMenuKey((current) => (current === 'detail_contact_sort' ? null : 'detail_contact_sort'))
                                  }
                                  onSelect={(nextValue) => setDetailContactSortOrder(nextValue as ListSortOrder)}
                                />
                              </div>

                              <div className="company-detail__contacts-toolbar-actions">
                                <button type="button" className="company-detail__toolbar-message">
                                  <AssetIcon src="/assets/message.svg" className="company-detail__toolbar-message-icon" />
                                  <span>문자 보내기</span>
                                </button>
                                <button type="button" className="company-detail__toolbar-message" onClick={openCompanyContactRegisterDialog}>
                                  <AssetIcon src="/assets/plus.svg" className="company-detail__toolbar-message-icon" />
                                  <span>담당자 추가</span>
                                </button>
                              </div>
                            </div>

                            <div className="company-detail__contact-list">
                              {sortedCompanyDetailContacts.map((contact) => {
                                const participationItems =
                                  contact.participationItems?.length
                                    ? contact.participationItems
                                    : contact.participationSummary === '없음'
                                      ? ['없음']
                                      : [contact.participationSummary.replace(/\s외\s\d+개$/, '')];
                                const contactMemoItems = contactMemosById[contact.id] ?? [];
                                const messageCount = contactMemoItems.length;
                                const isJoinedContact = contact.status === '가입완료';

                                return (
                                  <article key={contact.id} className="company-detail__contact-card">
                                    <div className="company-detail__contact-card-head">
                                      <div className="company-detail__contact-person">
                                        <span className="company-detail__contact-checkbox" aria-hidden="true" />
                                        <div className="company-detail__contact-name-meta">
                                          <div className="company-detail__contact-name">{contact.name}</div>
                                          <span
                                            className={`company-detail__title-dot ${contactTaggedById[contact.id] ? 'company-detail__title-dot--active' : ''}`}
                                            aria-hidden="true"
                                          />
                                          <button
                                            type="button"
                                            className={`company-detail__contact-tag-action ${contactTaggedById[contact.id] ? 'company-detail__contact-tag-action--active' : ''}`}
                                            onClick={() =>
                                              contactTaggedById[contact.id]
                                                ? openContactTagRemovalDialog(contact.id)
                                                : openContactTagDialog(contact.id)
                                            }
                                          >
                                            {contactTaggedById[contact.id] ? '태그 해제' : '태그 추가'}
                                          </button>
                                          <div
                                            className={`company-detail__contact-message-wrap ${
                                              activeContactMemoPopoverId === contact.id ? 'company-detail__contact-message-wrap--open' : ''
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              className="company-detail__contact-message-meta"
                                              aria-label={`${contact.name} 메모 ${messageCount}개 보기`}
                                              aria-expanded={activeContactMemoPopoverId === contact.id}
                                              onClick={() => toggleContactMemoPopover(contact.id)}
                                            >
                                              <AssetIcon src="/assets/chat.svg" className="company-detail__contact-message-icon" />
                                              <span className="company-detail__contact-message-count">{messageCount}</span>
                                            </button>
                                            <div className="company-detail__contact-memo-popover" role="tooltip">
                                              <div className="company-detail__contact-memo-popover-head">
                                                <div className="company-detail__contact-memo-popover-title">담당자 메모</div>
                                                <button
                                                  type="button"
                                                  className="company-detail__contact-memo-add"
                                                  onClick={() => openContactTagDialogWithSource(contact.id, 'memo')}
                                                >
                                                  메모 추가
                                                </button>
                                              </div>
                                              {contactMemoItems.length ? (
                                                <div className="company-detail__contact-memo-popover-list">
                                                  {contactMemoItems.map((memo) => (
                                                    <div key={memo.id} className="company-detail__contact-memo-item">
                                                      <div className="company-detail__contact-memo-meta">
                                                        <span>{memo.author}</span>
                                                        <span>{memo.createdAt}</span>
                                                      </div>
                                                      <p>{memo.memo}</p>
                                                      {memo.isMine ? (
                                                        <div className="company-detail__contact-memo-actions">
                                                          <button type="button" onClick={() => openContactMemoEditDialog(contact.id, memo)}>
                                                            수정
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setPendingDeleteDialog({ kind: 'contact_memo', contactId: contact.id, memoId: memo.id })
                                                            }
                                                          >
                                                            삭제
                                                          </button>
                                                        </div>
                                                      ) : null}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="company-detail__contact-memo-popover-empty">남긴 메모가 없습니다.</p>
                                              )}
                                            </div>
                                            {activeContactMemoPopoverId === contact.id ? (
                                              <div
                                                className="company-detail__contact-memo-backdrop"
                                                aria-hidden="true"
                                                onPointerDown={() => setActiveContactMemoPopoverId(null)}
                                              />
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="company-detail__contact-actions">
                                        <div
                                          className={`company-detail__contact-menu-wrap ${
                                            openContactMenuId === contact.id ? 'company-detail__contact-menu-wrap--open' : ''
                                          }`}
                                        >
                                          <button
                                            type="button"
                                            className="company-detail__contact-more"
                                            aria-label="담당자 더보기"
                                            aria-haspopup="menu"
                                            aria-expanded={openContactMenuId === contact.id}
                                            onClick={() => {
                                              setOpenContactMenuId((current) => (current === contact.id ? null : contact.id));
                                            }}
                                          >
                                            <AssetIcon src="/assets/dots.svg" className="company-detail__contact-more-icon" />
                                          </button>

                                          <div className="company-detail__contact-menu" role="menu" aria-label={`${contact.name} 메뉴`}>
                                            <button
                                              type="button"
                                              className="company-detail__contact-menu-item"
                                              role="menuitem"
                                              onClick={() => openContactEditDialog(contact)}
                                            >
                                              편집하기
                                            </button>
                                            <button
                                              type="button"
                                              className="company-detail__contact-menu-item company-detail__contact-menu-item--danger"
                                              role="menuitem"
                                              disabled={isJoinedContact}
                                              onClick={() => deleteCompanyContact(contact.id)}
                                            >
                                              삭제하기
                                            </button>
                                            {isJoinedContact ? (
                                              <p className="company-detail__contact-menu-help">
                                                가입한 담당자의 경우는 삭제할 수 없습니다.
                                              </p>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="company-detail__contact-body">
                                      <div className="company-detail__contact-info-list">
                                        <div className="company-detail__contact-info-row">
                                          <div className="company-detail__contact-label">소속 부서</div>
                                          <div className="company-detail__contact-value">{contact.department}</div>
                                        </div>
                                        <div className="company-detail__contact-info-row">
                                          <div className="company-detail__contact-label">이메일</div>
                                          <div className="company-detail__contact-copy-row">
                                            <div className="company-detail__contact-value">{contact.email}</div>
                                            <button
                                              type="button"
                                              className="company-detail__copy-button"
                                              aria-label="이메일 복사"
                                              onClick={() => void copyTextToClipboard(contact.email)}
                                            >
                                              <AssetIcon src="/assets/copy.svg" className="company-detail__copy-icon" />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="company-detail__contact-info-row">
                                          <div className="company-detail__contact-label">연락처</div>
                                          <div className="company-detail__contact-copy-row">
                                            <div className="company-detail__contact-value">{contact.phone}</div>
                                            <button
                                              type="button"
                                              className="company-detail__copy-button"
                                              aria-label="연락처 복사"
                                              onClick={() => void copyTextToClipboard(contact.phone)}
                                            >
                                              <AssetIcon src="/assets/copy.svg" className="company-detail__copy-icon" />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="company-detail__contact-info-row">
                                          <div className="company-detail__contact-label">가입일자</div>
                                          <div className="company-detail__contact-joined-row">
                                            <div
                                              className={`company-detail__contact-value ${
                                                contact.joinedAt ? '' : 'company-detail__contact-value--muted'
                                              }`}
                                            >
                                              {contact.joinedAt ?? '미가입'}
                                            </div>
                                            {contact.joinedAt ? (
                                              <span className="company-detail__contact-joined-badge">가입완료</span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="company-detail__contact-participation">
                                        <div className="company-detail__contact-label">참여이력</div>
                                        <div className="company-detail__contact-participation-list">
                                          {participationItems.map((item, index) => (
                                            <div
                                              key={`${contact.id}-participation-${index}`}
                                              className={`company-detail__contact-value ${
                                                item === '없음' ? 'company-detail__contact-value--muted' : ''
                                              }`}
                                            >
                                              {item}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </>
                          ) : companyDetailTab === '참여 이력' ? (
                            selectedCompanyParticipationRows.length ? (
                              <section className="company-detail__participation-section" aria-label="참여 이력">
                                <div className="company-detail__file-toolbar">
                                  <div className="company-detail__file-toolbar-copy">
                                    <div className="company-detail__file-toolbar-title">참여 이력</div>
                                    <div className="company-detail__file-toolbar-subtitle">
                                      교육과정별 참여 담당자 정보를 한 번에 확인할 수 있습니다.
                                    </div>
                                  </div>
                                </div>
                                <div className="company-detail__file-table-shell">
                                  <table className="company-detail__participation-table">
                                    <colgroup>
                                      <col className="company-detail__participation-col company-detail__participation-col--course" />
                                      <col className="company-detail__participation-col company-detail__participation-col--contact" />
                                      <col className="company-detail__participation-col company-detail__participation-col--phone" />
                                      <col className="company-detail__participation-col company-detail__participation-col--email" />
                                    </colgroup>
                                    <thead>
                                      <tr>
                                        <th scope="col">교육과정명</th>
                                        <th scope="col">참여 담당자명</th>
                                        <th scope="col">전화번호</th>
                                        <th scope="col">이메일</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedCompanyParticipationRows.map((row) => (
                                        <tr key={row.id}>
                                          <td>
                                            <div className="company-detail__participation-course-cell">
                                              <div className="company-detail__participation-thumb" aria-hidden="true">
                                                <AssetIcon src="/assets/edu.svg" className="company-detail__participation-thumb-icon" />
                                                <span>{row.thumbnailLabel}</span>
                                              </div>
                                              <div className="company-detail__participation-course" title={row.course}>
                                                {row.course}
                                              </div>
                                            </div>
                                          </td>
                                          <td>
                                            <div className="company-detail__participation-text">{row.contactName}</div>
                                          </td>
                                          <td>
                                            <div className="company-detail__participation-text">{row.phone}</div>
                                          </td>
                                          <td>
                                            <div className="company-detail__participation-text">{row.email}</div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </section>
                            ) : (
                              <div className="company-detail__tab-placeholder">현재 참여 이력이 없습니다.</div>
                            )
                          ) : companyDetailTab === '파일' ? (
                            <section className="company-detail__file-section" aria-label="기업 파일">
                              <div className="company-detail__file-toolbar">
                                <div className="company-detail__file-toolbar-copy">
                                  <div className="company-detail__file-toolbar-title">파일 업로드</div>
                                  <div className="company-detail__file-toolbar-subtitle">
                                    파일 미리보기, 다운로드, 삭제까지 한 번에 관리할 수 있습니다.
                                  </div>
                                </div>
                                <input
                                  ref={companyDetailFileInputRef}
                                  className="company-detail__file-input"
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                                  onChange={(event) => {
                                    void handleCompanyDetailFilesUpload(event.target.files);
                                  }}
                                />
                                <button type="button" className="company-detail__file-upload-button" onClick={triggerCompanyDetailFilePicker}>
                                  파일 업로드
                                </button>
                              </div>

                              <div className="company-detail__file-table-shell">
                                <table className="company-detail__file-table">
                                  <thead>
                                    <tr>
                                      <th>파일</th>
                                      <th>파일 카테고리</th>
                                      <th>파일 사이즈</th>
                                      <th>업로드</th>
                                      <th>관리</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeCompanyFiles.length ? (
                                      activeCompanyFiles.map((file) => (
                                        <tr key={file.id}>
                                          <td>
                                            <div className="company-detail__file-info">
                                              <div className="company-detail__file-preview">
                                                {file.isImage && file.previewUrl ? (
                                                  <img src={file.previewUrl} alt="" className="company-detail__file-preview-image" />
                                                ) : (
                                                  <div className="company-detail__file-preview-fallback">
                                                    <span>{file.extension.toUpperCase()}</span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="company-detail__file-name-group">
                                                <div className="company-detail__file-name">{file.name}</div>
                                                <div className="company-detail__file-meta-inline">.{file.extension}</div>
                                              </div>
                                            </div>
                                          </td>
                                          <td>
                                            <span className="company-detail__file-category">{file.category}</span>
                                          </td>
                                          <td>
                                            <div className="company-detail__file-text">{file.sizeLabel}</div>
                                          </td>
                                          <td>
                                            <div className="company-detail__file-text">{file.uploadedAt}</div>
                                            <div className="company-detail__file-subtext">{file.uploadedBy}</div>
                                          </td>
                                          <td>
                                            <div className="company-detail__file-actions">
                                              <button
                                                type="button"
                                                className="company-detail__file-action company-detail__file-action--danger"
                                                onClick={() => setPendingDeleteDialog({ kind: 'company_file', fileId: file.id })}
                                              >
                                                삭제
                                              </button>
                                              <button
                                                type="button"
                                                className="company-detail__file-action"
                                                onClick={() => handleDownloadCompanyFile(file)}
                                              >
                                                다운로드
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={5}>
                                          <div className="company-detail__file-empty">업로드된 파일이 없습니다.</div>
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </section>
                          ) : (
                            <div className="company-detail__tab-placeholder">보낸 문자가 없습니다.</div>
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </section>

              <aside
                className={`company-detail-memo-panel ${
                  isCompanyMemoPanelCollapsed ? 'company-detail-memo-panel--collapsed' : ''
                }`}
                aria-label="담당자 메모"
              >
                {isCompanyMemoPanelCollapsed ? (
                  <button
                    type="button"
                    className="company-detail__memo-floating-toggle company-detail__memo-floating-toggle--collapsed company-detail__memo-floating-toggle--with-tooltip"
                    aria-label="메모 열기"
                    aria-pressed={isCompanyMemoPanelCollapsed}
                    onClick={() => setIsCompanyMemoPanelCollapsed(false)}
                    data-tooltip="메모 열기"
                    data-tooltip-side="left"
                  >
                    <AssetIcon src="/assets/pannel.svg" className="company-detail__memo-floating-toggle-icon" />
                  </button>
                ) : null}
                <div className="company-detail__memo-section">
                  <div className="company-detail__memo-title-row">
                    <div className="company-detail__memo-title">메모</div>
                    <button
                      type="button"
                      className="company-detail__memo-toggle company-detail__memo-toggle--with-tooltip"
                      aria-label="메모 닫기"
                      aria-pressed={false}
                      onClick={() => setIsCompanyMemoPanelCollapsed(true)}
                      data-tooltip="메모 닫기"
                      data-tooltip-side="left"
                    >
                      <AssetIcon src="/assets/pannel.svg" className="company-detail__memo-toggle-icon" />
                    </button>
                  </div>
                  <div className="company-detail__memo-note">가장 최근에 작성한 메모가 상단에 표시됩니다.</div>

                  {!isCompanyMemoPanelCollapsed ? (
                    <>
                      <div className="company-detail__memo-list">
                        {orderedCompanyMemoEntries.map((memo) => (
                          <article key={memo.id} className="company-detail__memo-item">
                            <div className="company-detail__memo-head">
                              <div className="company-detail__memo-meta">
                                <span className="company-detail__memo-date">{memo.date}</span>
                                <span className="company-detail__memo-author">{memo.author}</span>
                              </div>
                              <div className="company-detail__memo-actions">
                                {memo.isMine ? (
                                  <>
                                    <button
                                      type="button"
                                      className="company-detail__memo-action"
                                      aria-label="메모 편집"
                                      onClick={() => handleEditCompanyMemo(selectedDetailCompanyKey!, memo)}
                                    >
                                      <AssetIcon src="/assets/edit.svg" className="company-detail__memo-action-icon" />
                                    </button>
                                    <button
                                      type="button"
                                      className="company-detail__memo-action"
                                      aria-label="메모 삭제"
                                      onClick={() =>
                                        setPendingDeleteDialog({
                                          kind: 'company_memo',
                                          companyKey: selectedDetailCompanyKey!,
                                          memoId: memo.id,
                                        })
                                      }
                                    >
                                      <AssetIcon src="/assets/trash.svg" className="company-detail__memo-action-icon" />
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <div className="company-detail__memo-body">{memo.memo}</div>
                          </article>
                        ))}
                      </div>

                      <div className="company-detail__memo-editor">
                        <div className="company-detail__memo-editor-head">
                          <div className="company-detail__memo-editor-title">
                            {activeCompanyMemoEditTarget ? '메모 수정 : Enter / 줄바꿈 : Shift + Enter' : '메모 등록 : Enter / 줄바꿈 : Shift + Enter'}
                          </div>
                          <button type="button" className="company-detail__memo-submit" onClick={() => handleSaveCompanyMemo(selectedDetailCompanyKey!)}>
                            {activeCompanyMemoEditTarget ? '수정' : '등록'}
                          </button>
                        </div>
                        <textarea
                          ref={companyMemoInputRef}
                          className="company-detail__memo-input"
                          value={activeCompanyMemoDraft}
                          onChange={(event) => handleCompanyMemoDraftChange(selectedDetailCompanyKey!, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key !== 'Enter' || event.shiftKey) return;
                            event.preventDefault();
                            handleSaveCompanyMemo(selectedDetailCompanyKey!);
                          }}
                          placeholder="메모를 입력하세요"
                          rows={4}
                        />
                      </div>
                    </>
	                  ) : null}
	                </div>
	              </aside>

              {pendingDeleteDialog?.kind === 'company_memo' ? (
                <div
                  className="company-delete-dialog"
                  role="presentation"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                      closePendingDeleteDialog();
                    }
                  }}
                >
                  <div className="company-delete-dialog__panel" role="dialog" aria-modal="true" aria-label="메모 삭제 확인">
                    <div className="company-delete-dialog__content">
                      <strong className="company-delete-dialog__title">삭제하시겠습니까?</strong>
                      <p className="company-delete-dialog__description">
                        선택한 메모를 삭제하시겠습니까? 삭제한 내용은 되돌릴 수 없습니다.
                      </p>
                    </div>
                    <div className="company-delete-dialog__actions">
                      <button
                        type="button"
                        className="company-delete-dialog__button company-delete-dialog__button--secondary"
                        onClick={closePendingDeleteDialog}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="company-delete-dialog__button company-delete-dialog__button--danger"
                        onClick={confirmPendingDelete}
                      >
                        삭제하기
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
	            </div>
	          ) : (
	            companyListContent
          )
        ) : (
          companyContactsListContent
        )}
        {copyToastMounted ? (
          <div className={`copy-toast ${copyToastVisible ? 'copy-toast--visible' : 'copy-toast--hidden'}`} role="status" aria-live="polite">
            복사되었습니다.
          </div>
        ) : null}
        {statusToastMounted ? (
          <div
            className={`status-toast status-toast--${statusToastTone} ${statusToastVisible ? 'status-toast--visible' : 'status-toast--hidden'}`}
            role="status"
            aria-live="polite"
          >
            {statusToastMessage}
          </div>
        ) : null}
      </main>

      {isSearchDialogOpen ? (
        <div
          className="search-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsSearchDialogOpen(false);
            }
          }}
        >
          <div className="search-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="search-dialog-title">
            <div className="search-dialog__header">
              <div>
                <div className="search-dialog__eyebrow">통합검색</div>
                <h2 id="search-dialog-title" className="search-dialog__title">
                  메뉴, 필터, 기업을 한 번에 찾기
                </h2>
              </div>
              <button type="button" className="search-dialog__close" onClick={() => setIsSearchDialogOpen(false)} aria-label="검색창 닫기">
                ×
              </button>
            </div>

            <label className="search-dialog__input-shell" aria-label="통합검색 입력">
              <img src="/assets/search.svg" alt="" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchResults.length > 0) {
                    handleSearchResultSelect(searchResults[0]);
                  }
                }}
                placeholder="메뉴, 필터, 기업을 검색하세요"
              />
            </label>

            <div className="search-dialog__summary">{normalizedQuery ? `${searchResults.length}개의 결과` : '최근 검색어'}</div>

            <div className="search-dialog__results" aria-live="polite">
              {!normalizedQuery ? (
                <div className="search-dialog__history" aria-label="최근 검색어">
                  {searchHistory.map((historyItem) => (
                    <button
                      key={historyItem}
                      type="button"
                      className="search-dialog__history-chip"
                      onClick={() => {
                        setSearchQuery(historyItem);
                        window.requestAnimationFrame(() => searchInputRef.current?.focus());
                      }}
                    >
                      {historyItem}
                    </button>
                  ))}
                </div>
              ) : searchResultKinds.some((kind) => searchResultsByKind[kind].length) ? (
                searchResultKinds.map((kind) => {
                  const items = searchResultsByKind[kind];

                  if (!items.length) return null;

                  return (
                    <section key={kind} className="search-dialog__group" aria-label={kind}>
                      <div className="search-dialog__group-title">
                        <span>{kind}</span>
                        <strong>{items.length}</strong>
                      </div>

                      <div className="search-dialog__group-list">
                        {items.map((result) => (
                          <button key={result.id} type="button" className="search-dialog__result" onClick={() => handleSearchResultSelect(result)}>
                            <div className="search-dialog__result-main">
                              <span className="search-dialog__result-label">{result.label}</span>
                              {result.meta ? <span className="search-dialog__result-meta">{result.meta}</span> : null}
                            </div>
                            <span className="search-dialog__result-kind">{result.kind}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })
              ) : (
                <div className="search-dialog__empty">검색 결과가 없습니다. 다른 키워드로 다시 시도해보세요.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isCompanyRegisterDialogOpen ? (
        <div
          className="company-register-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              requestCloseCompanyRegisterDialog();
            }
          }}
        >
          <div
            className="company-register-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-register-dialog-title"
          >
            <div className="company-register-dialog__header">
              <div>
                <div className="company-register-dialog__eyebrow">기업 등록</div>
                <h2 id="company-register-dialog-title" className="company-register-dialog__title">
                  여러 기업을 한 번에 직접 입력해서 등록합니다.
                </h2>
              </div>
              <button
                type="button"
                className="company-register-dialog__close company-register-dialog__close--small"
                onClick={handleCompanyRegisterDialogCloseClick}
                aria-label="기업 등록 창 닫기"
              >
                <img src="/assets/close.svg" alt="" aria-hidden="true" className="company-register-dialog__close-icon" />
              </button>
            </div>

            <div className="company-register-dialog__body">
              <aside className="company-register-dialog__list-pane company-register-dialog__sidebar" aria-label="기업 목록">
                <div className="company-register-dialog__list-pane-header">
                  <div>
                    <div className="company-register-dialog__pane-title">기업 리스트</div>
                  </div>
                  <button type="button" className="company-register-dialog__add-button" onClick={addCompanyRegisterDraft}>
                    <img className="company-register-dialog__add-icon" src="/assets/plus.svg" alt="" aria-hidden="true" />
                    <span className="company-register-dialog__add-text">추가</span>
                  </button>
                </div>

                <div className="company-register-dialog__list" role="list">
                  {companyRegisterDrafts.map((draft, index) => (
                    <div
                      key={draft.id}
                      className={`company-register-dialog__list-item ${
                        draft.id === activeCompanyRegisterDraftId ? 'is-active' : ''
                      }`}
                      role="listitem"
                    >
                      <button
                        type="button"
                        className="company-register-dialog__list-main"
                        onClick={() => selectCompanyRegisterDraft(draft.id)}
                      >
                        <span className="company-register-dialog__list-content">
                          <strong>{draft.name || `기업 ${index + 1}`}</strong>
                          <span>{draft.detailIndustries.length ? draft.detailIndustries.join(', ') : draft.primaryIndustry || '기업 정보 입력 전'}</span>
                        </span>
                      </button>

                      <div className="company-register-dialog__list-statuses">
                        {companyRegisterWarningsById[draft.id]?.messages.length ? (
                          <button
                            type="button"
                            className="company-register-dialog__list-warning"
                            aria-label="중복 경고"
                            onMouseEnter={(event) =>
                              showCompanyRegisterWarningTooltip(event.currentTarget, companyRegisterWarningsById[draft.id].messages.join(' / '))
                            }
                            onMouseLeave={hideCompanyRegisterWarningTooltip}
                            onFocus={(event) =>
                              showCompanyRegisterWarningTooltip(event.currentTarget, companyRegisterWarningsById[draft.id].messages.join(' / '))
                            }
                            onBlur={hideCompanyRegisterWarningTooltip}
                          >
                            <img src="/assets/problem.svg" alt="" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="company-register-dialog__list-remove"
                        onClick={() => setPendingDeleteDialog({ kind: 'register_draft', draftId: draft.id })}
                        aria-label={`${draft.name || `기업 ${index + 1}`} 삭제`}
                      >
                        <img className="company-register-dialog__list-remove-icon" src="/assets/trash.svg" alt="" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </aside>

              <form
                id="company-register-form"
                className="company-register-dialog__form-shell company-register-dialog__form-shell--company"
                onSubmit={handleCompanyRegisterSubmit}
              >
                <div className="company-register-dialog__form-header">
                  <div>
                    <div className="company-register-dialog__pane-title">기업 정보</div>
                  </div>
                </div>

                <div className="company-register-dialog__form-scroll company-register-dialog__form-scroll--company">
		                <div className="company-register-dialog__grid">
	                  <div className="company-register-dialog__field-row company-register-dialog__field-row--company">
	                    <label className="company-register-dialog__field">
	                      <span className="company-register-dialog__label">
	                        기업명 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span>
	                      </span>
	                      <input
	                        type="text"
	                        value={activeCompanyRegisterDraft?.name ?? ''}
	                        onChange={(event) => {
	                          if (!activeCompanyRegisterDraft) return;
	                          updateCompanyRegisterDraft(activeCompanyRegisterDraft.id, 'name', event.target.value);
	                        }}
	                        placeholder="기업명을 입력하세요"
	                        aria-invalid={Boolean(activeCompanyRegisterWarnings?.missingMessages.includes('기업명을 입력해 주세요.'))}
	                      />
	                      {activeCompanyRegisterWarnings?.missingMessages.includes('기업명을 입력해 주세요.') ? (
	                        <div className="company-register-dialog__field-error">기업명을 입력해 주세요.</div>
	                      ) : null}
	                    </label>
	                    <label className="company-register-dialog__field">
	                      <span className="company-register-dialog__label">
	                        사업자등록번호 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span>
	                      </span>
	                      <input
	                        type="text"
	                        inputMode="numeric"
	                        value={activeCompanyRegisterDraft?.businessRegistrationNumber ?? ''}
	                        onChange={(event) => {
	                          if (!activeCompanyRegisterDraft) return;
	                          updateCompanyRegisterDraft(
	                            activeCompanyRegisterDraft.id,
	                            'businessRegistrationNumber',
	                            formatBusinessRegistrationNumber(event.target.value),
	                          );
	                        }}
	                        placeholder="123-45-67890"
	                        aria-invalid={Boolean(activeCompanyRegisterWarnings?.missingMessages.includes('사업자등록번호를 입력해 주세요.'))}
	                      />
	                      {activeCompanyRegisterWarnings?.missingMessages.includes('사업자등록번호를 입력해 주세요.') ? (
	                        <div className="company-register-dialog__field-error">사업자등록번호를 입력해 주세요.</div>
	                      ) : null}
	                    </label>
	                  </div>

	                  <div
	                    className={`company-register-dialog__field-row company-register-dialog__field-row--company company-register-dialog__industry-values ${
	                      openCompanyRegisterIndustryPickerDraftId === activeCompanyRegisterDraft?.id ? 'is-open' : ''
	                    }`}
	                  >
	                    <label className="company-register-dialog__field">
	                      <span className="company-register-dialog__label">
	                        1차 업종 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span>
	                      </span>
	                      <input
	                        type="text"
	                        readOnly
	                        value={activeCompanyRegisterDraft?.primaryIndustry ?? ''}
	                        placeholder="1차 업종을 선택하세요"
	                        onClick={(event) => {
	                          if (!activeCompanyRegisterDraft) return;
	                          setOpenCompanyRegisterCoursePickerDraftId(null);
	                          setOpenCompanyRegisterContactCompanyPickerId(null);
	                          setOpenCompanyRegisterContactCoursePickerId(null);
	                          setCompanyRegisterIndustrySearchQuery('');
	                          setCompanyRegisterIndustryPickerMode('primary');
	                          setOpenCompanyRegisterIndustryPickerDraftId(activeCompanyRegisterDraft.id);
	                          updateCompanyRegisterPickerMenuPosition(event.currentTarget);
	                        }}
	                        onFocus={(event) => {
	                          if (!activeCompanyRegisterDraft) return;
	                          setCompanyRegisterIndustryPickerMode('primary');
	                          setOpenCompanyRegisterIndustryPickerDraftId(activeCompanyRegisterDraft.id);
	                          updateCompanyRegisterPickerMenuPosition(event.currentTarget);
	                        }}
	                      />
	                      {activeCompanyRegisterWarnings?.missingMessages.includes('1차 업종을 선택해 주세요.') ? (
	                        <div className="company-register-dialog__field-error">1차 업종을 선택해 주세요.</div>
	                      ) : null}
	                    </label>
	                    <label className="company-register-dialog__field">
	                      <span className="company-register-dialog__label">
	                        세부 업종 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span>
	                      </span>
	                      <input
	                        type="text"
	                        readOnly
	                        value={companyRegisterDetailIndustryLabels}
	                        placeholder="세부 업종을 선택하세요"
	                        onClick={(event) => {
	                          if (!activeCompanyRegisterDraft) return;
	                          setOpenCompanyRegisterCoursePickerDraftId(null);
	                          setOpenCompanyRegisterContactCompanyPickerId(null);
	                          setOpenCompanyRegisterContactCoursePickerId(null);
	                          setCompanyRegisterIndustrySearchQuery('');
	                          setCompanyRegisterIndustryPickerMode('detail');
	                          setOpenCompanyRegisterIndustryPickerDraftId(activeCompanyRegisterDraft.id);
	                          updateCompanyRegisterPickerMenuPosition(event.currentTarget);
	                        }}
	                        onFocus={(event) => {
	                          if (!activeCompanyRegisterDraft) return;
	                          setCompanyRegisterIndustryPickerMode('detail');
	                          setOpenCompanyRegisterIndustryPickerDraftId(activeCompanyRegisterDraft.id);
	                          updateCompanyRegisterPickerMenuPosition(event.currentTarget);
	                        }}
	                      />
	                      {activeCompanyRegisterWarnings?.missingMessages.includes('세부 업종을 선택해 주세요.') ? (
	                        <div className="company-register-dialog__field-error">세부 업종을 선택해 주세요.</div>
	                      ) : null}
	                    </label>
	                  </div>

	                  {openCompanyRegisterIndustryPickerDraftId === activeCompanyRegisterDraft?.id ? (
	                    <DialogPickerMenu
	                      className="company-register-dialog__industry-menu"
	                      style={companyRegisterPickerMenuStyle ? { ...companyRegisterPickerMenuStyle, position: 'fixed' } : undefined}
	                      searchValue={companyRegisterIndustrySearchQuery}
	                      onSearchChange={setCompanyRegisterIndustrySearchQuery}
	                      searchPlaceholder="업종 검색"
	                      searchClassName="company-register-dialog__industry-search"
	                    >
	                      <div className="company-register-dialog__industry-columns">
	                        <div className="company-register-dialog__industry-column">
	                          <div className="company-register-dialog__industry-heading">1차 업종</div>
	                          {filteredCompanyRegisterIndustryOptions.length ? (
	                            filteredCompanyRegisterIndustryOptions.map((option) => {
	                              const isSelected = activeCompanyRegisterDraft?.primaryIndustry === option.primary;

	                              return (
	                                <button
	                                  key={option.primary}
	                                  type="button"
	                                  className={`company-register-dialog__industry-option ${isSelected ? 'is-selected' : ''}`}
	                                  onClick={() => {
	                                    if (!activeCompanyRegisterDraft) return;
	                                    setCompanyRegisterIndustrySelection(activeCompanyRegisterDraft.id, option.primary);
	                                  }}
	                                >
	                                  <span>{option.primary}</span>
	                                </button>
	                              );
	                            })
	                          ) : (
	                            <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
	                          )}
	                        </div>
	                        <div className="company-register-dialog__industry-column company-register-dialog__industry-column--detail">
	                          <div className="company-register-dialog__industry-heading">세부 업종</div>
	                          {companyRegisterIndustryDetailOptions.length ? (
	                            companyRegisterIndustryDetailOptions.map((detail) => {
	                              const isPrimaryAll = detail === `${activeCompanyRegisterPrimaryOption.primary} 전체`;
	                              const matchedIndustry =
	                                industryOptions.find((option) => option.primary === activeCompanyRegisterPrimaryOption.primary) ?? null;
	                              const isSelected = activeCompanyRegisterDraft
	                                ? isPrimaryAll
	                                  ? Boolean(
	                                      matchedIndustry?.details.length &&
	                                        matchedIndustry.details.every((item) => activeCompanyRegisterDraft.detailIndustries.includes(item)),
	                                    )
	                                  : activeCompanyRegisterDraft.detailIndustries.includes(detail)
	                                : false;

	                              return (
	                                <button
	                                  key={detail}
	                                  type="button"
	                                  className={`company-register-dialog__industry-option ${isSelected ? 'is-selected' : ''}`}
	                                  onClick={() => {
	                                    if (!activeCompanyRegisterDraft) return;
	                                    if (isPrimaryAll) {
	                                      const matchedIndustry =
	                                        industryOptions.find((option) => option.primary === activeCompanyRegisterPrimaryOption.primary);
	                                      const nextDetailIndustries = isSelected ? [] : matchedIndustry?.details ?? [];

	                                      setCompanyRegisterDrafts((current) =>
	                                        current.map((draft) =>
	                                          draft.id === activeCompanyRegisterDraft.id
	                                            ? {
	                                                ...draft,
	                                                primaryIndustry: matchedIndustry?.primary ?? activeCompanyRegisterPrimaryOption.primary,
	                                                detailIndustries: nextDetailIndustries,
	                                                detailIndustry: nextDetailIndustries.join(', '),
	                                              }
	                                            : draft,
	                                        ),
	                                      );
	                                      return;
	                                    }
	                                    toggleCompanyRegisterDetailIndustry(activeCompanyRegisterDraft.id, detail);
	                                  }}
	                                >
	                                  <span className="company-register-dialog__picker-check" aria-hidden="true" />
	                                  <span>{detail}</span>
	                                </button>
	                              );
	                            })
	                          ) : (
	                            <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
	                          )}
	                        </div>
	                      </div>
	                    </DialogPickerMenu>
	                  ) : null}

	                  <label className="company-register-dialog__field company-register-dialog__field--wide">
                    <span className="company-register-dialog__label">주소</span>
                    <input
                      type="text"
                      value={activeCompanyRegisterDraft?.address ?? ''}
                      onChange={(event) => {
                        if (!activeCompanyRegisterDraft) return;
                        updateCompanyRegisterDraft(activeCompanyRegisterDraft.id, 'address', event.target.value);
                      }}
                      placeholder="사업장 주소를 입력하세요"
                    />
                  </label>

                  <label className="company-register-dialog__field company-register-dialog__field--wide">
                    <span className="company-register-dialog__label">홈페이지 주소</span>
                    <input
                      type="text"
                      value={activeCompanyRegisterDraft?.websiteLabel ?? ''}
                      onChange={(event) => {
                        if (!activeCompanyRegisterDraft) return;
                        updateCompanyRegisterDraft(activeCompanyRegisterDraft.id, 'websiteLabel', event.target.value);
                      }}
                      placeholder="예: https://..."
                    />
                  </label>

                  <div className="company-register-dialog__field-row company-register-dialog__field-row--company">
                    <label className="company-register-dialog__field">
                      <span className="company-register-dialog__label">피보험자 수</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={activeCompanyRegisterDraft?.insuredCount ?? ''}
                        onChange={(event) => {
                          if (!activeCompanyRegisterDraft) return;
                          updateCompanyRegisterDraft(
                            activeCompanyRegisterDraft.id,
                            'insuredCount',
                            formatNumberWithCommas(event.target.value),
                          );
                        }}
                        placeholder="숫자 입력"
                      />
                    </label>

                    <label className="company-register-dialog__field">
                      <span className="company-register-dialog__label">매출액</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={activeCompanyRegisterDraft?.revenueAmount ?? ''}
                      onChange={(event) => {
                        if (!activeCompanyRegisterDraft) return;
                        updateCompanyRegisterDraft(
                          activeCompanyRegisterDraft.id,
                          'revenueAmount',
                          formatNumberWithCommas(event.target.value),
                        );
                      }}
                      placeholder="원 단위 숫자 입력"
                      />
                    </label>
                  </div>

                  <div className="company-register-dialog__field company-register-dialog__field--wide">
                    <span className="company-register-dialog__label">교육과정 참여이력</span>
                    <div
                      className={`company-register-dialog__picker ${
                        openCompanyRegisterCoursePickerDraftId === activeCompanyRegisterDraft?.id ? 'is-open' : ''
                      }`}
                      data-company-register-picker="course"
                    >
                      <button
                        type="button"
                        className="company-register-dialog__picker-trigger"
                        onClick={(event) => {
                          if (!activeCompanyRegisterDraft) return;
                          setOpenCompanyRegisterIndustryPickerDraftId(null);
                          setOpenCompanyRegisterContactCompanyPickerId(null);
                          setOpenCompanyRegisterContactCoursePickerId(null);
                          setCompanyRegisterIndustryPickerMode(null);
                          const nextOpen =
                            openCompanyRegisterCoursePickerDraftId === activeCompanyRegisterDraft.id ? null : activeCompanyRegisterDraft.id;
                          setOpenCompanyRegisterCoursePickerDraftId(nextOpen);
                          if (nextOpen) {
                            updateCompanyRegisterPickerMenuPosition(event.currentTarget);
                          } else {
                            setCompanyRegisterPickerMenuStyle(null);
                            companyRegisterPickerAnchorRef.current = null;
                          }
                        }}
                      >
                        <span>
                          {activeCompanyRegisterDraft?.participationItems.length
                            ? `${activeCompanyRegisterDraft.participationItems[0]}${
                                activeCompanyRegisterDraft.participationItems.length > 1
                                  ? ` 외 ${activeCompanyRegisterDraft.participationItems.length - 1}`
                                  : ''
                              }`
                            : '교육과정을 선택하세요'}
                        </span>
                        <ToggleArrowIcon open={openCompanyRegisterCoursePickerDraftId === activeCompanyRegisterDraft?.id} />
	                      </button>
	                      {openCompanyRegisterCoursePickerDraftId === activeCompanyRegisterDraft?.id ? (
	                        <DialogPickerMenu
	                          style={companyRegisterPickerMenuStyle ? { ...companyRegisterPickerMenuStyle, position: 'fixed' } : undefined}
	                          searchValue={companyRegisterCourseSearchQuery}
	                          onSearchChange={setCompanyRegisterCourseSearchQuery}
	                          searchPlaceholder="교육과정 검색"
	                        >
	                          <div className="company-register-dialog__picker-list">
	                            {filteredCompanyRegisterCourseOptions.length ? (
	                              filteredCompanyRegisterCourseOptions.map((course) => {
                                const isSelected = Boolean(activeCompanyRegisterDraft?.participationItems.includes(course));

                                return (
                                  <button
                                    key={course}
                                    type="button"
                                    className={`company-register-dialog__picker-option ${isSelected ? 'is-selected' : ''}`}
                                    onClick={() => {
                                      if (!activeCompanyRegisterDraft) return;
                                      toggleCompanyRegisterParticipation(activeCompanyRegisterDraft.id, course);
                                    }}
                                  >
                                    <span className="company-register-dialog__picker-check" aria-hidden="true" />
                                    <span>{course}</span>
                                  </button>
                                );
                              })
	                            ) : (
	                              <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
	                            )}
	                          </div>
	                        </DialogPickerMenu>
	                      ) : null}
                    </div>
                    {activeCompanyRegisterDraft?.participationItems.length ? (
                      <div className="company-register-dialog__selected-list">
                        {activeCompanyRegisterDraft.participationItems.map((course) => (
                          <button
                            key={course}
                            type="button"
                            className="company-register-dialog__selected-chip"
                            onClick={() => toggleCompanyRegisterParticipation(activeCompanyRegisterDraft.id, course)}
                          >
                            {course}
                            <span aria-hidden="true">×</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

	                  <label className="company-register-dialog__field company-register-dialog__field--wide">
	                    <span className="company-register-dialog__label-row">
	                      <span className="company-register-dialog__label">기업 설명</span>
	                      <span className="company-register-dialog__counter">{activeCompanyRegisterDraft?.description.length ?? 0}/200</span>
	                    </span>
	                    <textarea
	                      value={activeCompanyRegisterDraft?.description ?? ''}
	                      onChange={(event) => {
	                        if (!activeCompanyRegisterDraft) return;
	                        updateCompanyRegisterDraft(activeCompanyRegisterDraft.id, 'description', event.target.value.slice(0, 200));
	                      }}
	                      placeholder="기업 소개를 입력하세요"
	                      maxLength={200}
	                      rows={4}
	                    />
	                  </label>

                  <section className="company-register-dialog__section company-register-dialog__field--wide">
                    <div className="company-register-dialog__section-head">
                      <div>
                        <div className="company-register-dialog__section-title">해당기업 담당자</div>
                      </div>
                      <button
                        type="button"
                        className="company-register-dialog__section-action"
                        onClick={() => {
                          if (!activeCompanyRegisterDraft) return;
                          addCompanyRegisterContact(activeCompanyRegisterDraft.id);
                        }}
                      >
                        담당자 추가
                      </button>
                    </div>

	                    {activeCompanyRegisterDraft?.contacts.length ? (
	                      <div className="company-register-dialog__contacts">
	                        {activeCompanyRegisterDraft.contacts.map((contact, contactIndex) => {
	                          const contactCourseSearchQuery = companyRegisterContactCourseSearchQueryById[contact.id] ?? '';
	                          const filteredContactCourseOptions = contactParticipationOptions.filter((course) =>
	                            course.toLowerCase().includes(contactCourseSearchQuery.trim().toLowerCase()),
	                          );
	                          const isContactCoursePickerOpen = openCompanyRegisterContactCoursePickerId === contact.id;
	                          const contactWarning = companyRegisterContactWarningsByDraftId[activeCompanyRegisterDraft.id]?.[contact.id];

	                          return (
	                            <article key={contact.id} className="company-register-dialog__contact-card">
	                              <div className="company-register-dialog__contact-head">
	                                <strong>담당자 {contactIndex + 1}</strong>
	                                <div className="company-register-dialog__contact-head-actions">
	                                  {contactWarning?.messages.length ? (
	                                    <button
	                                      type="button"
	                                      className="company-register-dialog__list-warning"
	                                      aria-label="중복 오류"
	                                      onMouseEnter={(event) =>
	                                        showCompanyRegisterWarningTooltip(
	                                          event.currentTarget,
	                                          contactWarning.messages.join(' / '),
	                                        )
	                                      }
	                                      onMouseLeave={hideCompanyRegisterWarningTooltip}
	                                      onFocus={(event) =>
	                                        showCompanyRegisterWarningTooltip(
	                                          event.currentTarget,
	                                          contactWarning.messages.join(' / '),
	                                        )
	                                      }
	                                      onBlur={hideCompanyRegisterWarningTooltip}
	                                    >
	                                      <img src="/assets/problem.svg" alt="" aria-hidden="true" />
	                                    </button>
	                                  ) : null}
	                                  <button
	                                    type="button"
	                                    className="company-register-dialog__contact-remove"
	                                    onClick={() => removeCompanyRegisterContact(activeCompanyRegisterDraft.id, contact.id)}
	                                  >
	                                    삭제
	                                  </button>
	                                </div>
	                              </div>
	                              <div className="company-register-dialog__contact-grid">
	                                <label className="company-register-dialog__field company-register-dialog__field--wide">
	                                  <span className="company-register-dialog__label">
	                                    담당자명 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span>
	                                  </span>
	                                  <input
	                                    type="text"
	                                    value={contact.name}
	                                    onChange={(event) =>
	                                      updateCompanyRegisterContact(activeCompanyRegisterDraft.id, contact.id, 'name', event.target.value)
	                                    }
	                                    placeholder="담당자명"
	                                    aria-invalid={Boolean(contactWarning?.missingMessages.includes('담당자명을 입력해 주세요.'))}
	                                  />
	                                  {contactWarning?.missingMessages.includes('담당자명을 입력해 주세요.') ? (
	                                    <div className="company-register-dialog__field-error">담당자명을 입력해 주세요.</div>
	                                  ) : null}
	                                </label>
	                                  <div className="company-register-dialog__field-row">
	                                  <label className="company-register-dialog__field">
	                                    <span className="company-register-dialog__label">기업</span>
	                                  <input
	                                    type="text"
	                                    value={contact.companyName || activeCompanyRegisterDraft.name}
	                                    disabled
	                                    placeholder="기업이 지정됩니다"
	                                    />
	                                  </label>
	                                  <label className="company-register-dialog__field">
	                                  <span className="company-register-dialog__label">소속부서</span>
	                                  <input
	                                    type="text"
	                                    value={contact.department}
	                                    onChange={(event) =>
	                                      updateCompanyRegisterContact(activeCompanyRegisterDraft.id, contact.id, 'department', event.target.value)
	                                    }
	                                    placeholder="예: HRD팀"
	                                  />
	                                  </label>
	                                </div>
	                                <div className="company-register-dialog__field-row">
	                                <label className="company-register-dialog__field">
	                                  <span className="company-register-dialog__label">이메일</span>
	                                  <input
	                                    type="email"
	                                    value={contact.email}
	                                    onChange={(event) =>
	                                      updateCompanyRegisterContact(activeCompanyRegisterDraft.id, contact.id, 'email', event.target.value)
	                                    }
	                                    placeholder="name@company.com"
	                                  />
	                                </label>
	                                <label className="company-register-dialog__field">
	                                  <span className="company-register-dialog__label">
	                                    연락처 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span>
	                                  </span>
	                                  <input
	                                    type="tel"
	                                    value={contact.phone}
	                                    onChange={(event) =>
	                                      updateCompanyRegisterContactPhone(activeCompanyRegisterDraft.id, contact.id, event.target.value)
	                                    }
	                                    placeholder="010-0000-0000"
	                                    aria-invalid={Boolean(contactWarning?.missingMessages.includes('연락처를 입력해 주세요.'))}
	                                  />
	                                  {contactWarning?.missingMessages.includes('연락처를 입력해 주세요.') ? (
	                                    <div className="company-register-dialog__field-error">연락처를 입력해 주세요.</div>
	                                  ) : null}
	                                </label>
	                                </div>
	                                <div className="company-register-dialog__field company-register-dialog__field--wide">
	                                  <span className="company-register-dialog__label">참여이력</span>
		                                  <div
                                        className={`company-register-dialog__picker ${isContactCoursePickerOpen ? 'is-open' : ''}`}
                                        data-company-register-picker={`contact-course-${contact.id}`}
                                      >
	                                    <button
	                                      type="button"
	                                      className="company-register-dialog__picker-trigger"
	                                      onClick={(event) => {
	                                        toggleCompanyRegisterContactCoursePicker(contact.id, event.currentTarget);
	                                      }}
	                                    >
	                                      <span>
	                                        {contact.participationItems.length
	                                          ? `${contact.participationItems[0]}${
	                                              contact.participationItems.length > 1
	                                                ? ` 외 ${contact.participationItems.length - 1}`
	                                                : ''
	                                            }`
	                                          : '교육과정을 선택하세요'}
	                                      </span>
	                                      <ToggleArrowIcon open={isContactCoursePickerOpen} />
	                                    </button>
	                                    {isContactCoursePickerOpen ? (
	                                      <DialogPickerMenu
	                                        style={companyRegisterPickerMenuStyle ? { ...companyRegisterPickerMenuStyle, position: 'fixed' } : undefined}
	                                        searchValue={contactCourseSearchQuery}
	                                        onSearchChange={(value) =>
	                                          setCompanyRegisterContactCourseSearchQueryById((current) => ({
	                                            ...current,
	                                            [contact.id]: value,
	                                          }))
	                                        }
	                                        searchPlaceholder="교육과정 검색"
	                                      >
	                                        <div className="company-register-dialog__picker-list">
	                                          {filteredContactCourseOptions.length ? (
	                                            filteredContactCourseOptions.map((course) => {
	                                              const isSelected = contact.participationItems.includes(course);

	                                              return (
	                                                <button
	                                                  key={course}
	                                                  type="button"
	                                                  className={`company-register-dialog__picker-option ${
	                                                    isSelected ? 'is-selected' : ''
	                                                  }`}
	                                                  onClick={() =>
	                                                    toggleCompanyRegisterContactParticipation(
	                                                      activeCompanyRegisterDraft.id,
	                                                      contact.id,
	                                                      course,
	                                                    )
	                                                  }
	                                                >
	                                                  <span className="company-register-dialog__picker-check" aria-hidden="true" />
	                                                  <span>{course}</span>
	                                                </button>
	                                              );
	                                            })
	                                          ) : (
	                                            <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
	                                          )}
	                                        </div>
	                                      </DialogPickerMenu>
	                                    ) : null}
	                                  </div>
	                                  {contact.participationItems.length ? (
	                                    <div className="company-register-dialog__selected-list">
	                                      {contact.participationItems.map((course) => (
	                                        <button
	                                          key={course}
	                                          type="button"
	                                          className="company-register-dialog__selected-chip"
	                                          onClick={() =>
	                                            toggleCompanyRegisterContactParticipation(activeCompanyRegisterDraft.id, contact.id, course)
	                                          }
	                                        >
	                                          {course}
	                                          <span aria-hidden="true">×</span>
	                                        </button>
	                                      ))}
	                                    </div>
	                                  ) : null}
	                                </div>
	                              </div>
	                            </article>
	                          );
	                        })}
	                      </div>
	                    ) : (
	                      <div className="company-register-dialog__empty-contact">아직 추가된 담당자가 없습니다.</div>
	                    )}
		                  </section>
		                </div>
                </div>
              </form>
            </div>

            <div className="company-register-dialog__footer">
              <button type="button" className="company-register-dialog__secondary" onClick={handleCompanyRegisterDialogCloseClick}>
                취소
              </button>
              <button type="submit" form="company-register-form" className="company-register-dialog__primary">
                등록하기
              </button>
            </div>
          </div>

          <DialogFloatingTooltip tooltip={companyRegisterWarningTooltip} />
        </div>
      ) : null}

      {isCompanyContactRegisterDialogOpen ? (
        <div
          className="company-register-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              requestCloseCompanyContactRegisterDialog();
            }
          }}
        >
          <div
            className="company-register-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-contact-register-dialog-title"
          >
            <div className="company-register-dialog__header">
              <div>
                <div className="company-register-dialog__eyebrow">기업 담당자 추가</div>
                <h2 id="company-contact-register-dialog-title" className="company-register-dialog__title">
                  담당자를 여러 명 한 번에 직접 입력해서 등록합니다.
                </h2>
              </div>
              <button
                type="button"
                className="company-register-dialog__close company-register-dialog__close--small"
                onClick={handleCompanyContactRegisterDialogCloseClick}
                aria-label="기업 담당자 추가 창 닫기"
              >
                <img src="/assets/close.svg" alt="" aria-hidden="true" className="company-register-dialog__close-icon" />
              </button>
            </div>

            <div className="company-register-dialog__body company-register-dialog__body--contacts">
              <aside className="company-register-dialog__sidebar" aria-label="담당자 목록">
                <div className="company-register-dialog__list-pane-header">
                  <div>
                    <div className="company-register-dialog__pane-title">담당자 리스트</div>
                  </div>
                  <button type="button" className="company-register-dialog__add-button" onClick={addCompanyContactRegisterDraft}>
                    <img className="company-register-dialog__add-icon" src="/assets/plus.svg" alt="" aria-hidden="true" />
                    <span className="company-register-dialog__add-text">추가</span>
                  </button>
                </div>

                <div className="company-register-dialog__list" role="list" onScroll={hideCompanyContactRegisterWarningTooltip}>
                  {companyContactRegisterDrafts.map((contact, contactIndex) => (
                    <div
                      key={contact.id}
                      className={`company-register-dialog__list-item ${
                        contact.id === activeCompanyContactRegisterDraft?.id ? 'is-active' : ''
                      }`}
                      role="listitem"
                    >
                      <button
                        type="button"
                        className="company-register-dialog__list-main"
                        onClick={() => {
                          setActiveCompanyContactRegisterDraftId(contact.id);
                          setOpenCompanyContactRegisterCompanyPickerId(null);
                          setOpenCompanyContactRegisterCoursePickerId(null);
                          setCompanyContactRegisterCourseSelectionById((current) => ({
                            ...current,
                            [contact.id]: contact.participationItems,
                          }));
                        }}
                      >
                        <span className="company-register-dialog__list-content">
                          <strong>{contact.name || `담당자 ${contactIndex + 1}`}</strong>
                          <span>{contact.companyName || '기업 미선택'}</span>
                        </span>
                      </button>
                      <div className="company-register-dialog__list-statuses">
                        {companyContactRegisterWarningsById[contact.id]?.messages.length ? (
                          <button
                            type="button"
                            className="company-register-dialog__list-warning"
                            aria-label="경고"
                            onMouseEnter={(event) =>
                              showCompanyContactRegisterWarningTooltip(
                                event.currentTarget,
                                companyContactRegisterWarningsById[contact.id].messages.join(' / '),
                              )
                            }
                            onMouseLeave={hideCompanyContactRegisterWarningTooltip}
                            onFocus={(event) =>
                              showCompanyContactRegisterWarningTooltip(
                                event.currentTarget,
                                companyContactRegisterWarningsById[contact.id].messages.join(' / '),
                              )
                            }
                            onBlur={hideCompanyContactRegisterWarningTooltip}
                          >
                            <img src="/assets/problem.svg" alt="" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="company-register-dialog__list-remove"
                        onClick={() => removeCompanyContactRegisterDraft(contact.id)}
                        aria-label={`${contact.name || `담당자 ${contactIndex + 1}`} 삭제`}
                      >
                        <img className="company-register-dialog__list-remove-icon" src="/assets/trash.svg" alt="" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </aside>

              <form
                id="company-contact-register-form"
                className="company-register-dialog__form-shell company-register-dialog__form-shell--contacts"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveCompanyContactRegister();
                }}
              >
                <div className="company-register-dialog__form-header">
                  <div>
                    <div className="company-register-dialog__pane-title">담당자 정보</div>
                  </div>
                </div>

                {activeCompanyContactRegisterDraft ? (
                  <div className="company-register-dialog__grid company-register-dialog__grid--contact">
                    <label className="company-register-dialog__field company-register-dialog__field--wide">
                      <span className="company-register-dialog__label">
                        담당자명 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span>
                      </span>
                      <input
                        type="text"
                        value={activeCompanyContactRegisterDraft.name}
                        onChange={(event) =>
                          updateCompanyContactRegisterDraft(activeCompanyContactRegisterDraft.id, 'name', event.target.value)
                        }
                        placeholder="담당자명"
                        aria-invalid={Boolean(companyContactRegisterValidationById[activeCompanyContactRegisterDraft.id]?.includes('담당자명을 입력해 주세요.'))}
                      />
                      {companyContactRegisterValidationById[activeCompanyContactRegisterDraft.id]?.includes('담당자명을 입력해 주세요.') ? (
                        <div className="company-register-dialog__field-error">담당자명을 입력해 주세요.</div>
                      ) : null}
                    </label>

                    <div className="company-register-dialog__field-row">
                      <div className="company-register-dialog__field">
                        <span className="company-register-dialog__label">기업</span>
                        {companyContactRegisterMode === 'company_register' ? (
                          <input
                            type="text"
                            value={companyContactRegisterLockedCompanyName || activeCompanyContactRegisterDraft.companyName}
                            disabled
                            placeholder="기업이 지정됩니다"
                          />
                        ) : (
                          <div
                            className={`company-register-dialog__picker ${
                              openCompanyContactRegisterCompanyPickerId === activeCompanyContactRegisterDraft.id ? 'is-open' : ''
                            }`}
                            data-company-contact-company-picker={activeCompanyContactRegisterDraft.id}
                          >
                            <button
                              type="button"
                              className="company-register-dialog__picker-trigger"
                              onClick={(event) => toggleCompanyContactRegisterCompanyPicker(activeCompanyContactRegisterDraft.id, event.currentTarget)}
                            >
                              <span>{activeCompanyContactRegisterDraft.companyName || '기업을 선택하세요'}</span>
                              <ToggleArrowIcon open={openCompanyContactRegisterCompanyPickerId === activeCompanyContactRegisterDraft.id} />
                            </button>
                            {openCompanyContactRegisterCompanyPickerId === activeCompanyContactRegisterDraft.id ? (
                              <DialogPickerMenu
                                style={companyRegisterPickerMenuStyle ? { ...companyRegisterPickerMenuStyle, position: 'fixed' } : undefined}
                                note="등록된 기업만 선택할 수 있습니다."
                                searchValue={companyContactRegisterCompanySearchQueryById[activeCompanyContactRegisterDraft.id] ?? ''}
                                onSearchChange={(value) =>
                                  setCompanyContactRegisterCompanySearchQueryById((current) => ({
                                    ...current,
                                    [activeCompanyContactRegisterDraft.id]: value,
                                  }))
                                }
                                searchPlaceholder="기업 검색"
                              >
                                <div className="company-register-dialog__picker-list">
                                  {contactCompanyOptions.filter((companyName) => {
                                    const normalizedQuery = (companyContactRegisterCompanySearchQueryById[activeCompanyContactRegisterDraft.id] ?? '')
                                      .trim()
                                      .toLowerCase();
                                    return !normalizedQuery || companyName.toLowerCase().includes(normalizedQuery);
                                  }).length ? (
                                    contactCompanyOptions
                                      .filter((companyName) => {
                                        const normalizedQuery = (companyContactRegisterCompanySearchQueryById[activeCompanyContactRegisterDraft.id] ?? '')
                                          .trim()
                                          .toLowerCase();
                                        return !normalizedQuery || companyName.toLowerCase().includes(normalizedQuery);
                                      })
                                      .map((companyName) => {
                                        return (
                                          <button
                                            key={companyName}
                                            type="button"
                                            className="company-register-dialog__picker-option"
                                            onClick={() => {
                                              updateCompanyContactRegisterDraft(activeCompanyContactRegisterDraft.id, 'companyName', companyName);
                                              setOpenCompanyContactRegisterCompanyPickerId(null);
                                              setCompanyContactRegisterCompanySearchQueryById((current) => ({
                                                ...current,
                                                [activeCompanyContactRegisterDraft.id]: '',
                                              }));
                                            }}
                                          >
                                            <span>{companyName}</span>
                                          </button>
                                        );
                                      })
                                  ) : (
                                    <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
                                  )}
                                </div>
                              </DialogPickerMenu>
                            ) : null}
                          </div>
                        )}
                      </div>

                      <label className="company-register-dialog__field">
                        <span className="company-register-dialog__label">소속부서</span>
                        <input
                          type="text"
                          value={activeCompanyContactRegisterDraft.department}
                          onChange={(event) =>
                            updateCompanyContactRegisterDraft(activeCompanyContactRegisterDraft.id, 'department', event.target.value)
                          }
                          placeholder="예: HRD팀"
                        />
                      </label>
                    </div>

                    <div className="company-register-dialog__field-row">
                      <label className="company-register-dialog__field">
                        <span className="company-register-dialog__label">이메일</span>
                        <input
                          type="email"
                          value={activeCompanyContactRegisterDraft.email}
                          onChange={(event) =>
                            updateCompanyContactRegisterDraft(activeCompanyContactRegisterDraft.id, 'email', event.target.value)
                          }
                          placeholder="name@company.com"
                          aria-invalid={Boolean(companyContactRegisterValidationById[activeCompanyContactRegisterDraft.id]?.find((message) =>
                            message === '이메일 형식이 올바르지 않습니다.',
                          ))}
                        />
                        {companyContactRegisterValidationById[activeCompanyContactRegisterDraft.id]?.find(
                          (message) => message === '이메일 형식이 올바르지 않습니다.',
                        ) ? (
                          <div className="company-register-dialog__field-error">이메일 형식이 올바르지 않습니다.</div>
                        ) : null}
                      </label>

                      <label className="company-register-dialog__field">
                        <span className="company-register-dialog__label">
                          연락처 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span>
                        </span>
                        <input
                          type="tel"
                          value={activeCompanyContactRegisterDraft.phone}
                          onChange={(event) => updateCompanyContactRegisterPhone(activeCompanyContactRegisterDraft.id, event.target.value)}
                          placeholder="010-0000-0000"
                          aria-invalid={Boolean(
                            companyContactRegisterValidationById[activeCompanyContactRegisterDraft.id]?.find((message) =>
                              message === '연락처 형식이 올바르지 않습니다.' || message === '연락처를 입력해 주세요.',
                            ),
                          )}
                        />
                        {companyContactRegisterValidationById[activeCompanyContactRegisterDraft.id]?.find(
                          (message) => message === '연락처 형식이 올바르지 않습니다.',
                        ) ? (
                          <div className="company-register-dialog__field-error">연락처 형식이 올바르지 않습니다.</div>
                        ) : companyContactRegisterValidationById[activeCompanyContactRegisterDraft.id]?.find(
                          (message) => message === '연락처를 입력해 주세요.',
                        ) ? (
                          <div className="company-register-dialog__field-error">연락처를 입력해 주세요.</div>
                        ) : null}
                      </label>
                    </div>

                    <div className="company-register-dialog__field company-register-dialog__field--wide">
                      <span className="company-register-dialog__label">교육과정 참여이력</span>
                      <div
                        className={`company-register-dialog__picker ${
                          openCompanyContactRegisterCoursePickerId === activeCompanyContactRegisterDraft.id ? 'is-open' : ''
                        }`}
                        data-company-contact-course-picker={activeCompanyContactRegisterDraft.id}
                      >
                        <button
                          type="button"
                          className="company-register-dialog__picker-trigger"
                          onClick={(event) => toggleCompanyContactRegisterCoursePicker(activeCompanyContactRegisterDraft.id, event.currentTarget)}
                        >
                          <span>
                            {(
                              companyContactRegisterCourseSelectionById[activeCompanyContactRegisterDraft.id] ??
                              activeCompanyContactRegisterDraft.participationItems
                            ).length
                              ? `${(
                                  companyContactRegisterCourseSelectionById[activeCompanyContactRegisterDraft.id] ??
                                  activeCompanyContactRegisterDraft.participationItems
                                )[0]}${
                                  (companyContactRegisterCourseSelectionById[activeCompanyContactRegisterDraft.id] ??
                                    activeCompanyContactRegisterDraft.participationItems).length > 1
                                    ? ` 외 ${
                                        (companyContactRegisterCourseSelectionById[activeCompanyContactRegisterDraft.id] ??
                                          activeCompanyContactRegisterDraft.participationItems).length - 1
                                      }`
                                    : ''
                                }`
                              : '교육과정을 선택하세요'}
                          </span>
                          <ToggleArrowIcon open={openCompanyContactRegisterCoursePickerId === activeCompanyContactRegisterDraft.id} />
                        </button>
                        {openCompanyContactRegisterCoursePickerId === activeCompanyContactRegisterDraft.id ? (
                          <DialogPickerMenu
                            style={companyRegisterPickerMenuStyle ? { ...companyRegisterPickerMenuStyle, position: 'fixed' } : undefined}
                            searchValue={companyContactRegisterCourseSearchQueryById[activeCompanyContactRegisterDraft.id] ?? ''}
                            onSearchChange={(value) =>
                              setCompanyContactRegisterCourseSearchQueryById((current) => ({
                                ...current,
                                [activeCompanyContactRegisterDraft.id]: value,
                              }))
                            }
                            searchPlaceholder="교육과정 검색"
                          >
                            <div className="company-register-dialog__picker-list">
                              {contactParticipationOptions.filter((course) => {
                                const normalizedQuery = (companyContactRegisterCourseSearchQueryById[activeCompanyContactRegisterDraft.id] ?? '')
                                  .trim()
                                  .toLowerCase();
                                return !normalizedQuery || course.toLowerCase().includes(normalizedQuery);
                              }).length ? (
                                contactParticipationOptions
                                  .filter((course) => {
                                    const normalizedQuery = (companyContactRegisterCourseSearchQueryById[activeCompanyContactRegisterDraft.id] ?? '')
                                      .trim()
                                      .toLowerCase();
                                    return !normalizedQuery || course.toLowerCase().includes(normalizedQuery);
                                  })
                                  .map((course) => {
                                    const isSelected = (
                                      companyContactRegisterCourseSelectionById[activeCompanyContactRegisterDraft.id] ??
                                      activeCompanyContactRegisterDraft.participationItems
                                    ).includes(course);

                                    return (
                                      <button
                                        key={course}
                                        type="button"
                                        className={`company-register-dialog__picker-option ${isSelected ? 'is-selected' : ''}`}
                                        onClick={() =>
                                          updateCompanyContactRegisterCourseSelection(activeCompanyContactRegisterDraft.id, course)
                                        }
                                      >
                                        <span className="company-register-dialog__picker-checkbox" aria-hidden="true" />
                                        <span>{course}</span>
                                      </button>
                                    );
                                  })
                              ) : (
                                <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
                              )}
                            </div>
                            <div className="company-register-dialog__picker-actions">
                              <button
                                type="button"
                                className="company-register-dialog__picker-action"
                                onClick={() => confirmCompanyContactRegisterCourseSelection(activeCompanyContactRegisterDraft.id)}
                              >
                                선택완료
                              </button>
                              <button
                                type="button"
                                className="company-register-dialog__picker-action company-register-dialog__picker-action--secondary"
                                onClick={() => cancelCompanyContactRegisterCourseSelection(activeCompanyContactRegisterDraft.id)}
                              >
                                선택 취소
                              </button>
                            </div>
                          </DialogPickerMenu>
                        ) : null}
                      </div>
                      {(companyContactRegisterCourseSelectionById[activeCompanyContactRegisterDraft.id] ??
                        activeCompanyContactRegisterDraftCourses).length ? (
                        <div className="company-register-dialog__selected-list">
                          {activeCompanyContactRegisterDraftCourses.map((course) => (
                            <button
                              key={course}
                              type="button"
                              className="company-register-dialog__selected-chip"
                              onClick={() => {
                                updateCompanyContactRegisterDraft(activeCompanyContactRegisterDraft.id, 'participationItems', [
                                  ...activeCompanyContactRegisterDraftCourses.filter((item) => item !== course),
                                ]);
                                setCompanyContactRegisterCourseSelectionById((current) => ({
                                  ...current,
                                  [activeCompanyContactRegisterDraft.id]: activeCompanyContactRegisterDraftCourses.filter((item) => item !== course),
                                }));
                              }}
                            >
                              {course}
                              <span aria-hidden="true">×</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </form>
            </div>

            <div className="company-register-dialog__footer">
              <button type="button" className="company-register-dialog__secondary" onClick={handleCompanyContactRegisterDialogCloseClick}>
                취소
              </button>
              <button type="submit" form="company-contact-register-form" className="company-register-dialog__primary">
                등록하기
              </button>
            </div>
          </div>

          <DialogFloatingTooltip tooltip={companyContactRegisterWarningTooltip} />
        </div>
      ) : null}

      {isCompanyExcelRegisterDialogOpen ? (
        <div
          className="company-excel-register-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCompanyExcelRegisterDialog();
            }
          }}
        >
          <div
            className="company-excel-register-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-excel-register-dialog-title"
          >
            <div className="company-excel-register-dialog__header">
              <div>
                <div className="company-excel-register-dialog__eyebrow">엑셀로 일괄 등록</div>
                <h2 id="company-excel-register-dialog-title" className="company-excel-register-dialog__title">
                  기업 정보를 엑셀 파일로 한 번에 업로드
                </h2>
              </div>
              <button
                type="button"
                className="company-excel-register-dialog__close"
                onClick={closeCompanyExcelRegisterDialog}
                aria-label="일괄 등록창 닫기"
              >
                ×
              </button>
            </div>

            <div className="company-excel-register-dialog__body">
              <section className="company-excel-register-dialog__guide" aria-label="업로드 안내">
                <div className="company-excel-register-dialog__guide-title">업로드 전 확인</div>
                <div className="company-excel-register-dialog__guide-list">
                  <div className="company-excel-register-dialog__guide-item">
                    <span className="company-excel-register-dialog__guide-bullet" aria-hidden="true" />
                    <div>
                      <strong>1행은 컬럼명</strong>
                      <span>기업명, 사업자등록번호, 업종, 주소 등 필수 항목을 먼저 넣어주세요.</span>
                    </div>
                  </div>
                  <div className="company-excel-register-dialog__guide-item">
                    <span className="company-excel-register-dialog__guide-bullet" aria-hidden="true" />
                    <div>
                      <strong>숫자 필드는 숫자만</strong>
                      <span>피보험자 수와 매출액은 천단위 쉼표 없이 숫자만 입력하면 자동 인식됩니다.</span>
                    </div>
                  </div>
                  <div className="company-excel-register-dialog__guide-item">
                    <span className="company-excel-register-dialog__guide-bullet" aria-hidden="true" />
                    <div>
                      <strong>업로드 후 검토</strong>
                      <span>업로드 후 좌측 리스트에서 개별 기업 정보를 다시 확인할 수 있습니다.</span>
                    </div>
                  </div>
                </div>

                <div className="company-excel-register-dialog__template-card">
                  <div className="company-excel-register-dialog__template-card-top">
                    <AssetIcon src="/assets/download.svg" className="company-excel-register-dialog__template-icon" />
                    <div>
                      <div className="company-excel-register-dialog__template-title">엑셀 템플릿</div>
                      <div className="company-excel-register-dialog__template-subtitle">샘플 컬럼이 들어간 템플릿을 내려받아 사용하세요.</div>
                    </div>
                  </div>
                  <button type="button" className="company-excel-register-dialog__template-button" onClick={downloadCompanyExcelTemplate}>
                    템플릿 다운로드
                  </button>
                </div>
              </section>

              <section className="company-excel-register-dialog__upload" aria-label="파일 업로드">
                <input
                  ref={companyExcelFileInputRef}
                  className="company-excel-register-dialog__file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleCompanyExcelFileChange}
                />

                <button
                  type="button"
                  className={`company-excel-register-dialog__dropzone ${isCompanyExcelDragging ? 'company-excel-register-dialog__dropzone--dragging' : ''}`}
                  onClick={triggerCompanyExcelFilePicker}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsCompanyExcelDragging(true);
                  }}
                  onDragLeave={() => setIsCompanyExcelDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsCompanyExcelDragging(false);
                    void readCompanyExcelFile(event.dataTransfer.files?.[0]);
                  }}
                >
                  <span className="company-excel-register-dialog__dropzone-icon">
                    <AssetIcon src="/assets/plus.svg" className="company-excel-register-dialog__dropzone-icon-symbol" />
                  </span>
                  <strong>엑셀 파일을 드래그하거나 클릭해서 선택하세요</strong>
                  <span>xlsx, xls, csv 파일을 지원합니다.</span>
                </button>

                <div className="company-excel-register-dialog__file-summary">
                  <div className="company-excel-register-dialog__file-summary-label">선택된 파일</div>
                  <div className="company-excel-register-dialog__file-summary-row">
                    <div className="company-excel-register-dialog__file-summary-name">
                      {companyExcelFileName || '아직 선택된 파일이 없습니다.'}
                    </div>
                    {companyExcelFileName ? (
                      <button
                        type="button"
                        className="company-excel-register-dialog__file-clear"
                        onClick={() => setPendingDeleteDialog({ kind: 'excel_file' })}
                        aria-label="선택된 파일 삭제"
                      >
                        <AssetIcon src="/assets/trash.svg" className="company-excel-register-dialog__file-clear-icon" />
                        <span>삭제</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="company-excel-register-dialog__preview">
                  <div className="company-excel-register-dialog__preview-title">
                    {companyExcelFileMeta ? '첨부된 파일 미리보기' : '파일 미리보기'}
                  </div>
                  {companyExcelFileMeta ? (
                    companyExcelPreview ? (
                      <div className="company-excel-register-dialog__sheet-preview">
                        <div className="company-excel-register-dialog__sheet-meta">
                          <div className="company-excel-register-dialog__file-card-top">
                            <span className="company-excel-register-dialog__file-card-icon" aria-hidden="true">
                              <AssetIcon
                                src="/assets/download-history.svg"
                                className="company-excel-register-dialog__file-card-icon-symbol"
                              />
                            </span>
                            <div className="company-excel-register-dialog__file-card-meta">
                              <strong>{companyExcelFileMeta.name}</strong>
                              <span>
                                {companyExcelPreview.sheetName}
                                {companyExcelFileMeta.type ? ` · ${companyExcelFileMeta.type}` : ''}
                              </span>
                            </div>
                          </div>
                          <div className="company-excel-register-dialog__sheet-count">
                            {Math.max(companyExcelPreview.rows.length, 0)}개 행 미리보기
                          </div>
                        </div>

                        <div className="company-excel-register-dialog__sheet-table-wrap">
                          <table className="company-excel-register-dialog__sheet-table">
                            <thead>
                              <tr>
                                {companyExcelPreview.headers.length ? (
                                  companyExcelPreview.headers.map((header, index) => (
                                    <th key={`${header}-${index}`}>{header || `컬럼 ${index + 1}`}</th>
                                  ))
                                ) : (
                                  <th>데이터</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {companyExcelPreview.rows.length ? (
                                companyExcelPreview.rows.map((row, rowIndex) => (
                                  <tr key={`${companyExcelPreview.sheetName}-${rowIndex}`}>
                                    {row.map((cell, cellIndex) => (
                                      <td key={`${rowIndex}-${cellIndex}`}>{cell || '-'}</td>
                                    ))}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={Math.max(companyExcelPreview.headers.length, 1)}>
                                    미리보기할 데이터가 없습니다.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="company-excel-register-dialog__file-card-body">
                          업로드한 엑셀 파일의 첫 시트 일부를 확인한 뒤 일괄 등록을 진행할 수 있습니다.
                        </div>
                      </div>
                    ) : (
                      <div className="company-excel-register-dialog__file-card">
                        <div className="company-excel-register-dialog__file-card-top">
                          <span className="company-excel-register-dialog__file-card-icon" aria-hidden="true">
                            <AssetIcon src="/assets/download-history.svg" className="company-excel-register-dialog__file-card-icon-symbol" />
                          </span>
                          <div className="company-excel-register-dialog__file-card-meta">
                            <strong>{companyExcelFileMeta.name}</strong>
                            <span>
                              {(companyExcelFileMeta.size / 1024).toFixed(1)} KB
                              {companyExcelFileMeta.type ? ` · ${companyExcelFileMeta.type}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="company-excel-register-dialog__file-card-body">
                          업로드한 엑셀 파일을 확인한 뒤 일괄 등록을 진행할 수 있습니다.
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="company-excel-register-dialog__preview-empty">
                      파일을 첨부하면 여기에서 미리보기가 표시됩니다.
                    </div>
                  )}
                </div>

                <div className="company-excel-register-dialog__actions">
                  <button type="button" className="company-excel-register-dialog__secondary" onClick={closeCompanyExcelRegisterDialog}>
                    취소
                  </button>
                  <button type="button" className="company-excel-register-dialog__primary" onClick={handleCompanyExcelUpload}>
                    {companyExcelFileName ? '일괄 등록 시작' : '파일 선택하기'}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {isCompanyTagDialogOpen && activeCompanyTagKey ? (
        <div
          className="company-tag-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCompanyTagDialog();
            }
          }}
        >
          <div className="company-tag-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="company-tag-dialog-title">
            <div className="company-tag-dialog__header">
              <div>
                <div className="company-tag-dialog__eyebrow">{companyTagDialogMode === 'remove' ? '태그 해제' : '태그 추가'}</div>
                <h2 id="company-tag-dialog-title" className="company-tag-dialog__title">
                  {companyTagDialogMode === 'remove' ? '태그를 해제 하시겠습니까?' : '태그를 설정하시겠습니까?'}
                </h2>
              </div>
              <button type="button" className="company-tag-dialog__close" onClick={closeCompanyTagDialog} aria-label="태그 설정 창 닫기">
                ×
              </button>
            </div>

            <div className="company-tag-dialog__body">
              {companyTagDialogMode === 'remove' ? (
                <p className="company-tag-dialog__description">작성된 메모는 삭제되지 않습니다.</p>
              ) : (
                <>
                  <p className="company-tag-dialog__description">메모는 선택 사항입니다. 필요하면 태그와 함께 참고 메모를 남겨두세요.</p>

                  <label className="company-tag-dialog__field">
                    <span className="company-tag-dialog__label">메모</span>
                    <textarea
                      ref={companyTagDialogInputRef}
                      value={companyTagMemoDraft}
                      onChange={(event) => setCompanyTagMemoDraft(event.target.value)}
                      placeholder="예: 이번 분기 우선 연락"
                      rows={5}
                    />
                  </label>
                </>
              )}
            </div>

            <div className="company-tag-dialog__actions">
              <button type="button" className="company-tag-dialog__secondary" onClick={closeCompanyTagDialog}>
                취소
              </button>
              <button
                type="button"
                className="company-tag-dialog__primary"
                onClick={companyTagDialogMode === 'remove' ? confirmCompanyTagRemoval : saveCompanyTagMemo}
              >
                {companyTagDialogMode === 'remove' ? '확인' : '저장'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isContactTagDialogOpen && activeContactTagId ? (
        <div
          className="company-tag-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeContactTagDialog();
            }
          }}
        >
          <div className="company-tag-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="contact-tag-dialog-title">
            <div className="company-tag-dialog__header">
              <div>
                <div className="company-tag-dialog__eyebrow">{contactTagDialogMode === 'remove' ? '태그 해제' : '담당자 태그'}</div>
                <h2 id="contact-tag-dialog-title" className="company-tag-dialog__title">
                  {contactTagDialogMode === 'remove'
                    ? '태그를 해제 하시겠습니까?'
                    : activeContactMemoEditId
                      ? '담당자 메모를 수정하세요'
                      : '담당자 메모를 남기세요'}
                </h2>
              </div>
              <button type="button" className="company-tag-dialog__close" onClick={closeContactTagDialog} aria-label="담당자 태그 메모 창 닫기">
                ×
              </button>
            </div>

            <div className="company-tag-dialog__body">
              {contactTagDialogMode === 'remove' ? (
                <p className="company-tag-dialog__description">작성된 메모는 삭제되지 않습니다.</p>
              ) : (
                <>
                  <p className="company-tag-dialog__description">
                    저장한 메모는 chat 아이콘 툴팁에서 작성자와 작성 시간까지 함께 확인할 수 있습니다.
                  </p>

                  <label className="company-tag-dialog__field">
                    <span className="company-tag-dialog__label">메모</span>
                    <textarea
                      ref={contactTagDialogInputRef}
                      value={contactTagMemoDraft}
                      onChange={(event) => setContactTagMemoDraft(event.target.value)}
                      placeholder="예: 다음 캠페인 안내 시 우선 연락"
                      rows={5}
                    />
                  </label>
                </>
              )}
            </div>

            <div className="company-tag-dialog__actions">
              <button type="button" className="company-tag-dialog__secondary" onClick={closeContactTagDialog}>
                취소
              </button>
              <button
                type="button"
                className="company-tag-dialog__primary"
                onClick={contactTagDialogMode === 'remove' ? confirmContactTagRemoval : saveContactTagMemo}
              >
                {contactTagDialogMode === 'remove' ? '확인' : activeContactMemoEditId ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isContactEditDialogOpen && contactEditDraft ? (
        <div
          className="sidebar-profile-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeContactEditDialog();
            }
          }}
        >
          <div
            className="sidebar-profile-dialog__panel sidebar-profile-dialog__panel--contact-edit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-edit-dialog-title"
          >
            {(() => {
              const isJoinedContact = contactEditDraft.status === '가입완료';
              return (
                <>
            <div className="sidebar-profile-dialog__header">
              <div>
                <div className="sidebar-profile-dialog__eyebrow">담당자</div>
                <h2 id="contact-edit-dialog-title" className="sidebar-profile-dialog__title">
                  담당자 정보 편집
                </h2>
              </div>
              <button type="button" className="sidebar-profile-dialog__close" onClick={closeContactEditDialog} aria-label="담당자 편집 창 닫기">
                ×
              </button>
            </div>

            <div className="sidebar-profile-dialog__body">
              {isJoinedContact ? (
                <p className="sidebar-profile-dialog__description">
                  가입한 담당자는 이름, 부서, 이메일, 연락처를 수정할 수 없습니다. 소속기업은 고정되고 참여이력만 변경할 수 있습니다.
                </p>
              ) : null}
              {isJoinedContact ? (
                <label className="sidebar-profile-dialog__field">
                  <span className="sidebar-profile-dialog__label">소속기업</span>
                  <input type="text" value={contactEditDraft.companyName} disabled />
                </label>
              ) : (
                <label className="sidebar-profile-dialog__field">
                  <span className="sidebar-profile-dialog__label">소속기업</span>
                  <div
                    className={`company-register-dialog__picker ${openContactEditPicker === 'company' ? 'is-open' : ''}`}
                    data-contact-edit-picker="company"
                  >
                    <button
                      type="button"
                      className="company-register-dialog__picker-trigger"
                      onClick={(event) => {
                        const next = openContactEditPicker === 'company' ? null : 'company';
                        setOpenContactEditPicker(next);
                        if (next) {
                          updateCompanyRegisterPickerMenuPosition(event.currentTarget);
                        } else {
                          setCompanyRegisterPickerMenuStyle(null);
                          companyRegisterPickerAnchorRef.current = null;
                        }
                      }}
                    >
                      <span>{contactEditDraft.companyName || '소속기업을 선택하세요'}</span>
                      <ToggleArrowIcon open={openContactEditPicker === 'company'} />
                    </button>
                    {openContactEditPicker === 'company' ? (
                      <DialogPickerMenu
                        style={companyRegisterPickerMenuStyle ? { ...companyRegisterPickerMenuStyle, position: 'fixed' } : undefined}
                        searchValue={contactEditCompanySearchQuery}
                        onSearchChange={setContactEditCompanySearchQuery}
                        searchPlaceholder="기업명 검색"
                      >
                        <div className="company-register-dialog__picker-list">
                          {filteredContactEditCompanyOptions.length ? (
                            filteredContactEditCompanyOptions.map((companyName) => {
                              const isSelected = companyName === contactEditDraft.companyName;
                              return (
                                <button
                                  key={companyName}
                                  type="button"
                                  className={`company-register-dialog__picker-option ${isSelected ? 'is-selected' : ''}`}
                                  onClick={() => {
                                    handleContactEditDraftChange('companyName', companyName);
                                    setOpenContactEditPicker(null);
                                    setContactEditCompanySearchQuery('');
                                  }}
                                >
                                  <span className="company-register-dialog__picker-check" aria-hidden="true" />
                                  <span>{companyName}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
                          )}
                        </div>
                      </DialogPickerMenu>
                    ) : null}
                  </div>
                </label>
              )}
              <label className="sidebar-profile-dialog__field">
                <span className="sidebar-profile-dialog__label">이름</span>
                <input
                  type="text"
                  value={contactEditDraft.name}
                  onChange={(event) => handleContactEditDraftChange('name', event.target.value)}
                  placeholder="담당자 이름을 입력하세요"
                  disabled={isJoinedContact}
                />
              </label>
              <label className="sidebar-profile-dialog__field">
                <span className="sidebar-profile-dialog__label">부서</span>
                <input
                  type="text"
                  value={contactEditDraft.department}
                  onChange={(event) => handleContactEditDraftChange('department', event.target.value)}
                  placeholder="부서명을 입력하세요"
                  disabled={isJoinedContact}
                />
              </label>
              <label className="sidebar-profile-dialog__field">
                <span className="sidebar-profile-dialog__label">이메일</span>
                <input
                  type="email"
                  value={contactEditDraft.email}
                  onChange={(event) => handleContactEditDraftChange('email', event.target.value)}
                  placeholder="이메일을 입력하세요"
                  disabled={isJoinedContact}
                />
              </label>
              <label className="sidebar-profile-dialog__field">
                <span className="sidebar-profile-dialog__label">연락처</span>
                <input
                  type="text"
                  value={contactEditDraft.phone}
                  onChange={(event) => handleContactEditDraftChange('phone', event.target.value)}
                  placeholder="연락처를 입력하세요"
                  disabled={isJoinedContact}
                />
                </label>
              <div className="sidebar-profile-dialog__field">
                <span className="sidebar-profile-dialog__label">참여 이력 교육과정</span>
                <div
                  className={`company-register-dialog__picker ${openContactEditPicker === 'course' ? 'is-open' : ''}`}
                  data-contact-edit-picker="course"
                >
                  <button
                    type="button"
                    className="company-register-dialog__picker-trigger"
                    onClick={(event) => {
                      const next = openContactEditPicker === 'course' ? null : 'course';
                      setOpenContactEditPicker(next);
                      if (next) {
                        updateCompanyRegisterPickerMenuPosition(event.currentTarget);
                      } else {
                        setCompanyRegisterPickerMenuStyle(null);
                        companyRegisterPickerAnchorRef.current = null;
                      }
                    }}
                  >
                    <span>
                      {contactEditDraft.participationItems.length
                        ? `${contactEditDraft.participationItems[0]}${
                            contactEditDraft.participationItems.length > 1
                              ? ` 외 ${contactEditDraft.participationItems.length - 1}`
                              : ''
                          }`
                        : '교육과정을 선택하세요'}
                    </span>
                    <ToggleArrowIcon open={openContactEditPicker === 'course'} />
                  </button>
                  {openContactEditPicker === 'course' ? (
                    <DialogPickerMenu
                      style={companyRegisterPickerMenuStyle ? { ...companyRegisterPickerMenuStyle, position: 'fixed' } : undefined}
                      searchValue={contactEditCourseSearchQuery}
                      onSearchChange={setContactEditCourseSearchQuery}
                      searchPlaceholder="교육과정 검색"
                    >
                      <div className="company-register-dialog__picker-list">
                        {filteredContactEditCourseOptions.length ? (
                          filteredContactEditCourseOptions.map((course) => {
                            const checked = contactEditDraft.participationItems.includes(course);
                            return (
                              <button
                                key={course}
                                type="button"
                                className={`company-register-dialog__picker-option ${checked ? 'is-selected' : ''}`}
                                onClick={() => toggleContactEditParticipationItem(course)}
                              >
                                <span className="company-register-dialog__picker-check" aria-hidden="true" />
                                <span>{course}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
                        )}
                      </div>
                    </DialogPickerMenu>
                  ) : null}
                </div>
                {contactEditDraft.participationItems.length ? (
                  <div className="company-register-dialog__selected-list">
                    {contactEditDraft.participationItems.map((course) => (
                      <button
                        key={course}
                        type="button"
                        className="company-register-dialog__selected-chip"
                        onClick={() => toggleContactEditParticipationItem(course)}
                      >
                        {course}
                        <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <p className="sidebar-profile-dialog__help">여러 교육과정을 선택할 수 있습니다.</p>
              </div>
            </div>

            <div className="sidebar-profile-dialog__actions">
              <button type="button" className="sidebar-profile-dialog__button sidebar-profile-dialog__button--secondary" onClick={closeContactEditDialog}>
                취소
              </button>
              <button type="button" className="sidebar-profile-dialog__button sidebar-profile-dialog__button--primary" onClick={saveContactEdit}>
                저장
              </button>
            </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}

      {pendingDialogCloseConfirmTarget ? (
        <div
          className={`company-delete-dialog company-delete-dialog--close-confirm ${
            pendingDialogCloseConfirmTarget === 'company_contact_register' ? 'company-delete-dialog--contact-close-confirm' : ''
          }`}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePendingDialogCloseConfirm();
            }
          }}
        >
          <div className="company-delete-dialog__panel" role="dialog" aria-modal="true" aria-label="닫기 확인">
            <div className="company-delete-dialog__content">
              <strong className="company-delete-dialog__title">등록을 취소하시겠습니까?</strong>
              <p className="company-delete-dialog__description">
                {pendingDialogCloseConfirmTarget === 'company_contact_register'
                  ? '작성한 내용은 저장되지 않습니다.'
                  : '내용은 저장되지 않습니다.'}
              </p>
            </div>
            <div className="company-delete-dialog__actions">
              <button
                type="button"
                className="company-delete-dialog__button company-delete-dialog__button--secondary"
                onClick={closePendingDialogCloseConfirm}
              >
                취소
              </button>
              <button
                type="button"
                className="company-delete-dialog__button company-delete-dialog__button--danger"
                onClick={confirmPendingDialogClose}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function flattenSidebarItems(
  items: SidebarItem[],
  parentPath: string[] = [],
): Array<{ label: string; path: string[]; iconSrc: string }> {
  return items.flatMap((item) => {
    const path = [...parentPath, item.label];
    return [{ label: item.label, path, iconSrc: item.iconSrc }, ...(item.children ? flattenSidebarItems(item.children, path) : [])];
  });
}

function containsSidebarLabel(item: SidebarItem, label: string): boolean {
  if (item.label === label) return true;
  return Boolean(item.children?.some((child) => containsSidebarLabel(child, label)));
}

function IconButton({
  label,
  src,
  onClick,
  pressed,
  ariaHaspopup,
  ariaExpanded,
  tooltip,
  tooltipSide = 'right',
}: {
  label: string;
  src: string;
  onClick?: () => void;
  pressed?: boolean;
  ariaHaspopup?: 'dialog' | 'menu' | 'listbox';
  ariaExpanded?: boolean;
  tooltip?: string;
  tooltipSide?: 'left' | 'right' | 'bottom';
}) {
  return (
    <button
      type="button"
      className={`icon-button ${pressed ? 'icon-button--active' : ''} ${tooltip ? 'icon-button--with-tooltip' : ''}`}
      aria-label={label}
      aria-haspopup={ariaHaspopup}
      aria-expanded={ariaExpanded}
      aria-pressed={pressed}
      onClick={onClick}
      data-tooltip={tooltip}
      data-tooltip-side={tooltipSide}
    >
      <img className="icon-button__image" src={src} alt="" aria-hidden="true" />
    </button>
  );
}

function SidebarMenuGroup({
  item,
  open,
  onToggle,
  collapsed,
  activeLabel,
  onOpenPage,
}: {
  item: SidebarItem;
  open: boolean;
  onToggle: () => void;
  collapsed: boolean;
  activeLabel: string;
  onOpenPage: (path: string[], label: string, iconSrc: string) => void;
}) {
  const hasChildren = Boolean(item.children?.length);
  const isActive = item.label === activeLabel || Boolean(item.children?.some((child) => containsSidebarLabel(child, activeLabel)));

  return (
    <div className="sidebar-group">
      <button
        type="button"
        className={`sidebar-nav__item ${isActive ? 'sidebar-nav__item--active' : ''} ${hasChildren ? 'sidebar-nav__item--group' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        aria-expanded={hasChildren ? open : undefined}
        onClick={hasChildren ? onToggle : () => onOpenPage([item.label], item.label, item.iconSrc)}
      >
        <span className="sidebar-nav__icon" aria-hidden="true">
          <SidebarIcon src={item.iconSrc} />
        </span>
        <span className="sidebar-nav__label">{item.label}</span>
        {hasChildren ? <ToggleArrowIcon className="sidebar-nav__toggle-icon" open={open} /> : null}
      </button>

      {hasChildren && open && !collapsed ? (
        <div className="sidebar-group__children">
          {item.children.map((child) => (
            <SidebarMenuLeaf key={child.label} item={child} activeLabel={activeLabel} onOpenPage={onOpenPage} parentPath={[item.label]} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarMenuLeaf({
  item,
  activeLabel,
  onOpenPage,
  parentPath,
}: {
  item: SidebarItem;
  activeLabel: string;
  onOpenPage: (path: string[], label: string, iconSrc: string) => void;
  parentPath: string[];
}) {
  const hasChildren = Boolean(item.children?.length);
  const path = [...parentPath, item.label];
  const isActive = item.label === activeLabel;

  return (
    <div className="sidebar-leaf-group">
      <button
        type="button"
        className={`sidebar-nav__item sidebar-nav__item--leaf ${isActive ? 'sidebar-nav__item--active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => onOpenPage(path, item.label, item.iconSrc)}
      >
        <span className="sidebar-nav__spacer" aria-hidden="true" />
        <span className="sidebar-nav__label">{item.label}</span>
        {hasChildren ? <ToggleArrowIcon className="sidebar-nav__toggle-icon" /> : null}
      </button>
      {hasChildren ? (
        <div className="sidebar-group__children sidebar-group__children--nested">
          {item.children.map((child) => (
            <SidebarMenuLeaf key={child.label} item={child} activeLabel={activeLabel} onOpenPage={onOpenPage} parentPath={path} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarUtilityMenuItem({
  item,
  isServiceMenuOpen,
  onToggleServiceMenu,
  onOpenPage,
  onCloseServiceMenu,
}: {
  item: SidebarUtilityItem;
  isServiceMenuOpen: boolean;
  onToggleServiceMenu: () => void;
  onOpenPage: (path: string[], label: string, iconSrc: string) => void;
  onCloseServiceMenu: () => void;
}) {
  if (item.children?.length) {
    return (
      <div className={`crm-sidebar__utility-group ${isServiceMenuOpen ? 'crm-sidebar__utility-group--open' : ''}`}>
        <button
          type="button"
          className="sidebar-nav__item crm-sidebar__utility-item"
          aria-haspopup="menu"
          aria-expanded={isServiceMenuOpen}
          onClick={onToggleServiceMenu}
        >
          <span className="sidebar-nav__icon" aria-hidden="true">
            <SidebarIcon src={item.iconSrc} />
          </span>
          <span className="sidebar-nav__label">{item.label}</span>
          <ToggleArrowIcon className="sidebar-nav__toggle-icon" open={isServiceMenuOpen} />
        </button>

        <SidebarUtilityChildrenMenu item={item} onOpenPage={onOpenPage} onCloseServiceMenu={onCloseServiceMenu} />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="sidebar-nav__item sidebar-nav__item--leaf crm-sidebar__utility-item"
      onClick={() => {
        if (!item.path) return;
        onOpenPage(item.path, item.label, item.iconSrc);
        onCloseServiceMenu();
      }}
    >
      <span className="sidebar-nav__icon" aria-hidden="true">
        <SidebarIcon src={item.iconSrc} />
      </span>
      <span className="sidebar-nav__label">{item.label}</span>
    </button>
  );
}

function SidebarUtilityChildrenMenu({
  item,
  onOpenPage,
  onCloseServiceMenu,
}: {
  item: SidebarUtilityItem & { children: SidebarUtilityItem[] };
  onOpenPage: (path: string[], label: string, iconSrc: string) => void;
  onCloseServiceMenu: () => void;
}) {
  return (
    <div className="crm-sidebar__utility-children" role="menu" aria-label={`${item.label} 메뉴`}>
      <div className="crm-sidebar__utility-tooltip-title">{item.label}</div>
      {item.children.map((child) => (
        <button
          key={child.label}
          type="button"
          role="menuitem"
          className="sidebar-nav__item sidebar-nav__item--leaf crm-sidebar__utility-item crm-sidebar__utility-subitem"
          onClick={() => {
            if (!child.path) return;
            onOpenPage(child.path, child.label, child.iconSrc);
            onCloseServiceMenu();
          }}
        >
          <span className="sidebar-nav__icon" aria-hidden="true">
            <SidebarIcon src={child.iconSrc} />
          </span>
          <span className="sidebar-nav__label">{child.label}</span>
        </button>
      ))}
    </div>
  );
}

function FilterDropdown({
  filterKey,
  label,
  iconSrc,
  value,
  options,
  isLocation,
  isOpen,
  onToggle,
  onSelect,
  onReset,
  onClose,
}: {
  filterKey: string;
  label: string;
  iconSrc?: string;
  value: string;
  options: string[];
  isLocation?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (nextValue: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const displayLabel = value === '전체' ? label : value;
  const { rootRef, alignRight } = useDropdownAlignment(isOpen);

  return (
    <div
      ref={rootRef}
      className={`filter-dropdown ${isLocation ? 'filter-dropdown--location' : ''} ${alignRight ? 'filter-dropdown--align-right' : ''} ${isOpen ? 'filter-dropdown--open' : ''}`}
      data-filter-key={filterKey}
    >
      <button
        type="button"
        className={`filter-chip ${value !== '전체' ? 'filter-chip--active' : ''} ${isLocation ? 'filter-chip--location' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {iconSrc ? <AssetIcon src={iconSrc} className="filter-chip__location-icon" /> : null}
        <span className="filter-chip__label">{displayLabel}</span>
        <ToggleArrowIcon className="filter-chip__arrow" />
      </button>

      <div className="filter-dropdown__menu" role="menu" aria-label={`${label} 메뉴`}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`filter-dropdown__item ${option === value ? 'filter-dropdown__item--active' : ''}`}
            role="menuitem"
            onClick={() => {
              onSelect(option);
              onClose();
            }}
          >
            {option}
          </button>
        ))}
        <button type="button" className="filter-dropdown__reset" onClick={onReset}>
          초기화
        </button>
      </div>
    </div>
  );
}

function SearchMultiSelectDropdown({
  filterKey,
  label,
  value,
  options,
  isOpen,
  searchQuery,
  selectedOptions,
  onToggle,
  onSearchQueryChange,
  onToggleOption,
  onReset,
  onClose,
}: {
  filterKey: string;
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  searchQuery: string;
  selectedOptions: string[];
  onToggle: () => void;
  onSearchQueryChange: (nextValue: string) => void;
  onToggleOption: (option: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const { rootRef, alignRight } = useDropdownAlignment(isOpen);
  const filteredOptions = options.filter((option) => !normalizedQuery || option.toLowerCase().includes(normalizedQuery));

  return (
    <div
      ref={rootRef}
      className={`filter-dropdown filter-dropdown--multi ${alignRight ? 'filter-dropdown--align-right' : ''} ${isOpen ? 'filter-dropdown--open' : ''}`}
      data-filter-key={filterKey}
    >
      <button
        type="button"
        className={`filter-chip ${selectedOptions.length ? 'filter-chip--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="filter-chip__label">{value}</span>
        <ToggleArrowIcon className="filter-chip__arrow" />
      </button>

      <div className="filter-dropdown__menu filter-dropdown__menu--multi" role="menu" aria-label={`${label} 메뉴`}>
        <label className="industry-dropdown__search" aria-label={`${label} 검색`}>
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={`${label} 검색`}
          />
        </label>

        <div className="filter-dropdown__multi-list" role="group" aria-label={`${label} 선택`}>
          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const isChecked = selectedOptions.includes(option);
              return (
                <label key={option} className={`industry-dropdown__checkbox-item ${isChecked ? 'industry-dropdown__checkbox-item--active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleOption(option)}
                  />
                  <span className="industry-dropdown__checkbox-box" aria-hidden="true" />
                  <span className="industry-dropdown__checkbox-label">{option}</span>
                </label>
              );
            })
          ) : (
            <div className="filter-dropdown__empty">검색 결과가 없습니다.</div>
          )}
        </div>

        <div className="filter-dropdown__multi-actions">
          <button type="button" className="filter-dropdown__reset" onClick={onReset}>
            초기화
          </button>
          <button type="button" className="filter-dropdown__apply" onClick={onClose}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarMenuDropdown({
  menuKey,
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  menuKey: ToolbarMenuKey;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (nextValue: string) => void;
}) {
  const { rootRef, alignRight } = useDropdownAlignment(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (rootRef.current?.contains(target)) return;
      onToggle();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggle();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onToggle, rootRef]);

  return (
    <div
      ref={rootRef}
      className={`toolbar-menu-dropdown filter-dropdown ${alignRight ? 'filter-dropdown--align-right' : ''} ${
        isOpen ? 'filter-dropdown--open' : ''
      }`}
      data-toolbar-menu-key={menuKey}
    >
      <button
        type="button"
        className={`select-chip ${value ? 'select-chip--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{value || label}</span>
        <ToggleArrowIcon />
      </button>

      <div className="filter-dropdown__menu toolbar-menu-dropdown__menu" role="menu" aria-label={`${label} 메뉴`}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              className={`filter-dropdown__item ${isSelected ? 'filter-dropdown__item--active' : ''}`}
              role="menuitem"
              onClick={() => {
                onSelect(option.value);
                onToggle();
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RegionDropdown({
  label,
  iconSrc,
  value,
  isOpen,
  searchQuery,
  onSearchQueryChange,
  selectedProvince,
  selectedDistricts,
  selectedDongs,
  onToggle,
  onSelectProvince,
  onToggleDistrict,
  onToggleDong,
  onReset,
  onClose,
}: {
  label: string;
  iconSrc?: string;
  value: string;
  isOpen: boolean;
  searchQuery: string;
  onSearchQueryChange: (nextValue: string) => void;
  selectedProvince: string;
  selectedDistricts: string[];
  selectedDongs: string[];
  onToggle: () => void;
  onSelectProvince: (province: string) => void;
  onToggleDistrict: (province: string, district: string) => void;
  onToggleDong: (province: string, district: string, dong: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const { rootRef, alignRight } = useDropdownAlignment(isOpen);
  const filteredProvinces = regionOptions.filter((region) => {
    if (!normalizedQuery) return true;
    return region.province.toLowerCase().includes(normalizedQuery) || region.districts.some((district) => district.name.toLowerCase().includes(normalizedQuery) || district.dongs.some((dong) => dong.toLowerCase().includes(normalizedQuery)));
  });

  const activeProvince = filteredProvinces.some((region) => region.province === selectedProvince)
    ? selectedProvince
    : filteredProvinces[0]?.province ?? regionOptions[0].province;

  const activeProvinceData = regionOptions.find((region) => region.province === activeProvince) ?? regionOptions[0];
  const provinceList = filteredProvinces.length ? filteredProvinces : regionOptions;
  const districtList = activeProvinceData.districts.filter((district) => {
    if (!normalizedQuery) return true;
    return district.name.toLowerCase().includes(normalizedQuery) || district.dongs.some((dong) => dong.toLowerCase().includes(normalizedQuery)) || activeProvinceData.province.toLowerCase().includes(normalizedQuery);
  });

  return (
    <div
      ref={rootRef}
      className={`filter-dropdown filter-dropdown--location ${alignRight ? 'filter-dropdown--align-right' : ''} ${isOpen ? 'filter-dropdown--open' : ''}`}
      data-filter-key="region"
    >
      <button
        type="button"
        className={`filter-chip filter-chip--location ${value !== '지역 선택' ? 'filter-chip--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {iconSrc ? <AssetIcon src={iconSrc} className="filter-chip__location-icon" /> : null}
        <span className="filter-chip__label">{value}</span>
        <ToggleArrowIcon className="filter-chip__arrow" />
      </button>

      <div className="filter-dropdown__menu filter-dropdown__menu--region" role="menu" aria-label={`${label} 메뉴`}>
        <label className="region-dropdown__search" aria-label="지역 검색">
          <SearchIcon />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="지역 검색"
          />
        </label>

        <div className="region-dropdown__content">
          <div className="region-dropdown__body">
            <div className="region-dropdown__column">
              <div className="region-dropdown__list">
                {provinceList.map((region) => (
                  <button
                    key={region.province}
                    type="button"
                    className={`region-dropdown__item ${region.province === activeProvince ? 'region-dropdown__item--active' : ''}`}
                    role="menuitem"
                    onClick={() => {
                      onSelectProvince(region.province);
                    }}
                  >
                    {region.province}
                  </button>
                ))}
              </div>
            </div>

            <div className="region-dropdown__column region-dropdown__column--district">
              <div className="region-dropdown__list">
                {districtList.map((district) => {
                  const isSelectedDistrict = selectedDistricts.includes(district.name);
                  const activeDongData = district.dongs.length ? district.dongs : [];
                  return (
                    <div key={`${activeProvince}-${district.name}`} className="region-dropdown__group">
                      <label className={`region-dropdown__checkbox-item region-dropdown__checkbox-item--district ${isSelectedDistrict ? 'region-dropdown__checkbox-item--active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelectedDistrict}
                          onChange={() => onToggleDistrict(activeProvince, district.name)}
                        />
                        <span className="region-dropdown__checkbox-box" aria-hidden="true" />
                        <span className="region-dropdown__checkbox-label">{district.name}{district.name !== '전체' ? ' 전체' : ''}</span>
                      </label>
                      {isSelectedDistrict && activeDongData.length > 0 ? (
                        <div className="region-dropdown__dong-list">
                          {activeDongData.map((dong) => {
                            const isDongActive = selectedDongs.includes(dong);
                            return (
                              <label
                                key={`${activeProvince}-${district.name}-${dong}`}
                                className={`region-dropdown__checkbox-item region-dropdown__checkbox-item--dong ${isDongActive ? 'region-dropdown__checkbox-item--active' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isDongActive}
                                  onChange={() => onToggleDong(activeProvince, district.name, dong)}
                                />
                                <span className="region-dropdown__checkbox-box" aria-hidden="true" />
                                <span className="region-dropdown__checkbox-label">{dong}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button type="button" className="filter-dropdown__reset filter-dropdown__reset--region" onClick={onReset}>
            초기화
          </button>
        </div>
      </div>
    </div>
  );
}

function IndustryDropdown({
  label,
  isOpen,
  value,
  activePrimary,
  searchQuery,
  selectedPrimaries,
  selectedDetails,
  onToggle,
  onSearchQueryChange,
  onSelectPrimary,
  onSelectDetail,
  onReset,
  onClose,
}: {
  label: string;
  isOpen: boolean;
  value: string;
  activePrimary: string;
  searchQuery: string;
  selectedPrimaries: string[];
  selectedDetails: string[];
  onToggle: () => void;
  onSearchQueryChange: (nextValue: string) => void;
  onSelectPrimary: (primary: string) => void;
  onSelectDetail: (detail: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const { rootRef, alignRight } = useDropdownAlignment(isOpen);
  const filteredPrimaryOptions = industryOptions.filter((item) => {
    if (!normalizedQuery) return true;
    return item.primary.toLowerCase().includes(normalizedQuery) || item.details.some((detail) => detail.toLowerCase().includes(normalizedQuery));
  });

  const activePrimaryData = industryOptions.find((item) => item.primary === activePrimary) ?? filteredPrimaryOptions[0] ?? industryOptions[0];
  const detailOptions = [
    `${activePrimaryData.primary} 전체`,
    ...activePrimaryData.details,
  ].filter((detail) => !normalizedQuery || detail.toLowerCase().includes(normalizedQuery) || activePrimaryData.primary.toLowerCase().includes(normalizedQuery));

  return (
    <div
      ref={rootRef}
      className={`filter-dropdown filter-dropdown--industry ${alignRight ? 'filter-dropdown--align-right' : ''} ${isOpen ? 'filter-dropdown--open' : ''}`}
      data-filter-key="industry"
    >
      <button
        type="button"
        className={`filter-chip ${value !== '업종 선택' ? 'filter-chip--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="filter-chip__label">{value}</span>
        <ToggleArrowIcon className="filter-chip__arrow" />
      </button>

      <div className="filter-dropdown__menu filter-dropdown__menu--industry" role="menu" aria-label={`${label} 메뉴`}>
        <label className="industry-dropdown__search" aria-label="업종 검색">
          <SearchIcon />
          <input type="text" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="업종 검색" />
        </label>

        <div className="industry-dropdown__body">
          <div className="industry-dropdown__column">
            <div className="industry-dropdown__heading">1차 업종</div>
            <div className="industry-dropdown__list">
              {filteredPrimaryOptions.map((item) => {
                const isActive = item.primary === activePrimary;
                const isChecked = selectedPrimaries.includes(item.primary);
                return (
                  <label key={item.primary} className={`industry-dropdown__checkbox-item ${isActive ? 'industry-dropdown__checkbox-item--active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        onSelectPrimary(item.primary);
                      }}
                    />
                    <span className="industry-dropdown__checkbox-box" aria-hidden="true" />
                    <span className="industry-dropdown__checkbox-label">{item.primary}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="industry-dropdown__column industry-dropdown__column--detail">
            <div className="industry-dropdown__heading">세부 업종</div>
            <div className="industry-dropdown__list">
              {detailOptions.map((detail) => {
                const isChecked = selectedDetails.includes(detail);
                return (
                  <label key={`${activePrimaryData.primary}-${detail}`} className={`industry-dropdown__checkbox-item industry-dropdown__checkbox-item--detail ${isChecked ? 'industry-dropdown__checkbox-item--active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        onSelectDetail(detail);
                      }}
                    />
                    <span className="industry-dropdown__checkbox-box" aria-hidden="true" />
                    <span className="industry-dropdown__checkbox-label">{detail}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <button type="button" className="filter-dropdown__reset" onClick={onReset}>
          초기화
        </button>
      </div>
    </div>
  );
}

function InsuredBandDropdown({
  label,
  isOpen,
  value,
  selectedOptions,
  customMin,
  customMax,
  onToggle,
  onToggleOption,
  onCustomMinChange,
  onCustomMaxChange,
  onReset,
}: {
  label: string;
  isOpen: boolean;
  value: string;
  selectedOptions: string[];
  customMin: string;
  customMax: string;
  onToggle: () => void;
  onToggleOption: (option: string) => void;
  onCustomMinChange: (nextValue: string) => void;
  onCustomMaxChange: (nextValue: string) => void;
  onReset: () => void;
}) {
  const isDirectSelected = selectedOptions.includes(directInsuredLabel);
  const displayValue = value;
  const { rootRef, alignRight } = useDropdownAlignment(isOpen);

  return (
    <div
      ref={rootRef}
      className={`filter-dropdown filter-dropdown--insured ${alignRight ? 'filter-dropdown--align-right' : ''} ${isOpen ? 'filter-dropdown--open' : ''}`}
      data-filter-key="insuredBand"
    >
      <button
        type="button"
        className={`filter-chip ${displayValue !== '피보험자수' ? 'filter-chip--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="filter-chip__label">{displayValue}</span>
        <ToggleArrowIcon className="filter-chip__arrow" />
      </button>

      <div className="filter-dropdown__menu filter-dropdown__menu--insured" role="menu" aria-label={`${label} 메뉴`}>
        <div className="filter-dropdown__stack">
          {insuredBandOptions.map((option) => {
            const isChecked = selectedOptions.includes(option);
            return (
              <label key={option} className={`industry-dropdown__checkbox-item ${isChecked ? 'industry-dropdown__checkbox-item--active' : ''}`}>
                <input type="checkbox" checked={isChecked} onChange={() => onToggleOption(option)} />
                <span className="industry-dropdown__checkbox-box" aria-hidden="true" />
                <span className="industry-dropdown__checkbox-label">{option}</span>
              </label>
            );
          })}

          <label className={`industry-dropdown__checkbox-item ${isDirectSelected ? 'industry-dropdown__checkbox-item--active' : ''}`}>
            <input type="checkbox" checked={isDirectSelected} onChange={() => onToggleOption(directInsuredLabel)} />
            <span className="industry-dropdown__checkbox-box" aria-hidden="true" />
            <span className="industry-dropdown__checkbox-label">{directInsuredLabel}</span>
          </label>

          {isDirectSelected ? (
            <div className="filter-dropdown__range-fields" aria-label="직접 설정">
              <label className="filter-dropdown__range-field">
                <span className="filter-dropdown__range-field-label">최소</span>
                <div className="filter-dropdown__range-input-wrap">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customMin}
                    onChange={(event) => onCustomMinChange(formatNumberWithCommas(event.target.value))}
                    placeholder="0"
                  />
                  <span className="filter-dropdown__range-unit">명</span>
                </div>
              </label>
              <label className="filter-dropdown__range-field">
                <span className="filter-dropdown__range-field-label">최대</span>
                <div className="filter-dropdown__range-input-wrap">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customMax}
                    onChange={(event) => onCustomMaxChange(formatNumberWithCommas(event.target.value))}
                    placeholder="0"
                  />
                  <span className="filter-dropdown__range-unit">명</span>
                </div>
              </label>
            </div>
          ) : null}
        </div>

        <button type="button" className="filter-dropdown__reset" onClick={onReset}>
          초기화
        </button>
      </div>
    </div>
  );
}

function RevenueDropdown({
  label,
  isOpen,
  value,
  minValue,
  maxValue,
  onToggle,
  onMinChange,
  onMaxChange,
  onReset,
}: {
  label: string;
  isOpen: boolean;
  value: string;
  minValue: string;
  maxValue: string;
  onToggle: () => void;
  onMinChange: (nextValue: string) => void;
  onMaxChange: (nextValue: string) => void;
  onReset: () => void;
}) {
  const isActive = value !== '매출액';
  const { rootRef, alignRight } = useDropdownAlignment(isOpen);

  return (
    <div
      ref={rootRef}
      className={`filter-dropdown filter-dropdown--revenue ${alignRight ? 'filter-dropdown--align-right' : ''} ${isOpen ? 'filter-dropdown--open' : ''}`}
      data-filter-key="revenueBand"
    >
      <button
        type="button"
        className={`filter-chip ${isActive ? 'filter-chip--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="filter-chip__label">{value}</span>
        <ToggleArrowIcon className="filter-chip__arrow" />
      </button>

      <div className="filter-dropdown__menu filter-dropdown__menu--revenue" role="menu" aria-label={`${label} 메뉴`}>
        <div className="filter-dropdown__range-fields filter-dropdown__range-fields--revenue">
          <label className="filter-dropdown__range-field">
            <span className="filter-dropdown__range-field-label">최소매출</span>
            <div className="filter-dropdown__range-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={minValue}
                onChange={(event) => onMinChange(formatNumberWithCommas(event.target.value))}
                placeholder="0"
              />
              <span className="filter-dropdown__range-unit">원</span>
            </div>
          </label>
          <label className="filter-dropdown__range-field">
            <span className="filter-dropdown__range-field-label">최대매출</span>
            <div className="filter-dropdown__range-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={maxValue}
                onChange={(event) => onMaxChange(formatNumberWithCommas(event.target.value))}
                placeholder="0"
              />
              <span className="filter-dropdown__range-unit">원</span>
            </div>
          </label>
        </div>

        <button type="button" className="filter-dropdown__reset" onClick={onReset}>
          초기화
        </button>
      </div>
    </div>
  );
}

function SidebarIcon({ src }: { src: string }) {
  if (/\.(png|jpe?g|webp|gif)$/i.test(src)) {
    return <img src={src} alt="" aria-hidden="true" />;
  }

  return <AssetIcon src={src} className="sidebar-nav__icon-mask" />;
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  const isLeft = direction === 'left';

  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path d={isLeft ? 'M8.5 3.5L5 7L8.5 10.5' : 'M5.5 3.5L9 7L5.5 10.5'} />
    </svg>
  );
}

function SearchIcon() {
  return (
    <img src="/assets/search.svg" alt="" aria-hidden="true" className="search-icon" />
  );
}

function DialogPickerMenu({
  className = '',
  style,
  note,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchClassName = 'company-register-dialog__picker-search',
  children,
}: DialogPickerMenuProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`company-register-dialog__picker-menu ${className}`.trim()} style={style ? { ...style, right: 'auto' } : undefined}>
      {note ? <div className="company-register-dialog__picker-note">{note}</div> : null}
      <label className={searchClassName}>
        <SearchIcon />
        <input type="search" value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} />
      </label>
      {children}
    </div>,
    document.body,
  );
}

function DialogFloatingTooltip({ tooltip }: { tooltip: CompanyContactRegisterWarningTooltip | null }) {
  if (!tooltip || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="company-register-dialog__floating-tooltip"
      style={{
        top: tooltip.top,
        left: tooltip.left,
      }}
      role="tooltip"
    >
      {tooltip.message}
    </div>,
    document.body,
  );
}

function ToggleArrowIcon({ open, className = '' }: { open?: boolean; className?: string }) {
  return <AssetIcon src="/assets/arrow-down.svg" className={`toggle-arrow-icon ${open ? 'toggle-arrow-icon--open' : ''} ${className}`.trim()} />;
}

function TitleSectionIcon({ src }: { src: string }) {
  return <AssetIcon src={src} className="title-section__icon" />;
}

function AssetIcon({ src, className = '' }: { src: string; className?: string }) {
  return <span className={`asset-icon ${className}`.trim()} style={{ ['--icon-url' as string]: `url(${src})` }} aria-hidden="true" />;
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 13.5C8 13.5 4.5 9.9 4.5 7C4.5 5.067 6.067 3.5 8 3.5C9.933 3.5 11.5 5.067 11.5 7C11.5 9.9 8 13.5 8 13.5Z" />
      <circle cx="8" cy="7" r="1.25" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.75 13.5H13.25" />
      <path d="M4 13.5V3.25H8.5V13.5" />
      <path d="M8.5 13.5V6.5H12V13.5" />
      <path d="M4.75 5.25H6.5" />
      <path d="M4.75 7.75H6.5" />
      <path d="M4.75 10.25H6.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M6.25 7.25C7.49264 7.25 8.5 6.24264 8.5 5C8.5 3.75736 7.49264 2.75 6.25 2.75C5.00736 2.75 4 3.75736 4 5C4 6.24264 5.00736 7.25 6.25 7.25Z" />
      <path d="M2.75 13.5C3.353 11.84 4.841 10.75 6.5 10.75C8.159 10.75 9.647 11.84 10.25 13.5" />
      <path d="M10.25 7.25C11.0808 7.25 11.75 6.58083 11.75 5.75C11.75 4.91917 11.0808 4.25 10.25 4.25C9.41917 4.25 8.75 4.91917 8.75 5.75C8.75 6.58083 9.41917 7.25 10.25 7.25Z" />
      <path d="M11.25 10.25C12.139 10.25 12.994 10.58 13.65 11.19C14.035 11.544 14.343 11.979 14.55 12.5" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.25 13.5H11.25C12.3546 13.5 13.25 12.6046 13.25 11.5V3.5H5.25C4.14543 3.5 3.25 4.39543 3.25 5.5V13.5Z" />
      <path d="M5.25 3.5V13.5" />
      <path d="M6.5 6H10.5" />
      <path d="M6.5 8.5H10.5" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 9V8C3 5.239 5.239 3 8 3C10.761 3 13 5.239 13 8V9" />
      <path d="M2.75 9.25V11.5C2.75 12.3284 3.42157 13 4.25 13H5.25V9.25H2.75Z" />
      <path d="M13.25 9.25V11.5C13.25 12.3284 12.5784 13 11.75 13H10.75V9.25H13.25Z" />
      <path d="M4.5 13.5C4.5 14.0523 4.94772 14.5 5.5 14.5H6.75" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="2.25" y="3.25" width="11.5" height="8.5" rx="1.25" />
      <path d="M6.25 12V13.25" />
      <path d="M4.5 13.25H11.5" />
      <path d="M5.25 6H10.75" />
      <path d="M5.25 8.5H10.75" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 5.25C9.51878 5.25 10.75 6.48122 10.75 8C10.75 9.51878 9.51878 10.75 8 10.75C6.48122 10.75 5.25 9.51878 5.25 8C5.25 6.48122 6.48122 5.25 8 5.25Z" />
      <path d="M8 2.75V4.25" />
      <path d="M8 11.75V13.25" />
      <path d="M3.75 8H5.25" />
      <path d="M10.75 8H12.25" />
      <path d="M4.9 4.9L5.95 5.95" />
      <path d="M10.05 10.05L11.1 11.1" />
      <path d="M11.1 4.9L10.05 5.95" />
      <path d="M5.95 10.05L4.9 11.1" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.5 3.75H12.5C13.0523 3.75 13.5 4.19772 13.5 4.75V9.25C13.5 9.80228 13.0523 10.25 12.5 10.25H8.5L5.5 12.25V10.25H3.5C2.94772 10.25 2.5 9.80228 2.5 9.25V4.75C2.5 4.19772 2.94772 3.75 3.5 3.75Z" />
    </svg>
  );
}

function TrashIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.75 4H13.25" />
      <path d="M6 4V2.75H10V4" />
      <path d="M5.5 4L6 12.25H10L10.5 4" />
      <path d="M7 6.25V10" />
      <path d="M9 6.25V10" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M5 3.25H3.75C3.19772 3.25 2.75 3.69772 2.75 4.25V11.25C2.75 11.8023 3.19772 12.25 3.75 12.25H9.25C9.80228 12.25 10.25 11.8023 10.25 11.25V10" />
      <path d="M6.75 10.25H12.25C12.8023 10.25 13.25 9.80228 13.25 9.25V4.25C13.25 3.69772 12.8023 3.25 12.25 3.25H6.75C6.19772 3.25 5.75 3.69772 5.75 4.25V9.25C5.75 9.80228 6.19772 10.25 6.75 10.25Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.5 13.25H13.5" />
      <path d="M8.5 9.75L5.5 10.25L6 7.25L12.5 0.75L15.25 3.5L8.5 9.75Z" />
    </svg>
  );
}

function FavoriteStarIcon({ featured }: { featured: boolean }) {
  return <AssetIcon src="/assets/star.svg" className={`favorite-card__star ${featured ? 'favorite-card__star--featured' : ''}`} />;
}
