import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import * as XLSX from 'xlsx';

import { DropdownSelect } from './DropdownSelect';
import type { InstructorResumeFile, InstructorRow } from './InstructorManagementPage';

type InstructorEducationEntry = {
  id: string;
  schoolName: string;
  department: string;
  major: string;
  degree: string;
  period: string;
};

type InstructorCareerEntry = {
  id: string;
  period: string;
  workplace: string;
  roleName: string;
};

type InstructorAttachmentFile = {
  id: string;
  name: string;
  url: string;
};

type InstructorRegisterDraft = {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  lectureRegions: string[];
  lectureFieldTargets: string[];
  organization: string;
  hasNoOrganization: boolean;
  ncsEnrolled: boolean;
  ncsField: string;
  finalEducation: string;
  educations: InstructorEducationEntry[];
  careers: InstructorCareerEntry[];
  resumeUrl: string;
  resumeFiles: InstructorResumeFile[];
  certificateFiles: InstructorAttachmentFile[];
  participationItems: string[];
};

type ExcelPreview = {
  headers: string[];
  rows: string[][];
};

type DraftFieldErrors = {
  name?: boolean;
  birthDate?: boolean;
  phone?: boolean;
  email?: boolean;
  organization?: boolean;
  ncsField?: boolean;
  finalEducation?: boolean;
  resumeUrl?: boolean;
};

type DraftValidation = {
  messages: string[];
  missingMessages: string[];
  duplicateMessages: string[];
  invalidMessages: string[];
  fieldErrors: DraftFieldErrors;
  educationFieldErrors: Record<string, Partial<Record<'schoolName' | 'department' | 'major' | 'degree' | 'period', boolean>>>;
  careerFieldErrors: Record<string, Partial<Record<'period' | 'workplace' | 'roleName', boolean>>>;
};

const lectureRegionOptions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const lectureFieldTargetOptions = [
  '프론트엔드 / 취준생',
  '백엔드 / 취준생',
  '데이터 분석 / 재직자',
  'AI 활용 / 재직자',
  '서비스 기획 / 취준생',
  '마케팅 / 재직자',
  'UX/UI / 취준생',
  '커뮤니케이션 / 대학생',
];
const finalEducationOptions = ['고등학교 졸업', '전문학사', '학사', '석사', '박사', '기타'];
const degreeOptions = ['전문학사', '학사', '석사', '박사', '수료', '기타'];

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEducationEntry = (): InstructorEducationEntry => ({
  id: createId('education'),
  schoolName: '',
  department: '',
  major: '',
  degree: '',
  period: '',
});

const createCareerEntry = (): InstructorCareerEntry => ({
  id: createId('career'),
  period: '',
  workplace: '',
  roleName: '',
});

const createDraft = (): InstructorRegisterDraft => ({
  id: createId('instructor-draft'),
  name: '',
  birthDate: '',
  phone: '',
  email: '',
  lectureRegions: [],
  lectureFieldTargets: [],
  organization: '',
  hasNoOrganization: false,
  ncsEnrolled: false,
  ncsField: '',
  finalEducation: '',
  educations: [createEducationEntry()],
  careers: [createCareerEntry()],
  resumeUrl: '',
  resumeFiles: [],
  certificateFiles: [],
  participationItems: [],
});

const normalizePhone = (value: string) => value.replace(/[^\d]/g, '');

const formatPhoneNumber = (value: string) => {
  const digits = normalizePhone(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const formatBirthDate = (value: string) => {
  const digits = value.replace(/[^\d]/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const normalizeBirthDate = (value: string) => formatBirthDate(String(value).replace(/[./]/g, '-'));

const isValidBirthDate = (value: string) => {
  if (!value.trim()) return true;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear) return false;

  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
};

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidMonthRange = (value: string) => {
  if (!value.trim()) return true;
  return /^\d{4}[.-](0[1-9]|1[0-2])\s*-\s*(\d{4}[.-](0[1-9]|1[0-2])|현재)$/.test(value.trim());
};

const hasAnyEducationValue = (education: InstructorEducationEntry) =>
  [education.schoolName, education.department, education.major, education.degree, education.period].some((value) => value.trim());

const hasAnyCareerValue = (career: InstructorCareerEntry) => [career.period, career.workplace, career.roleName].some((value) => value.trim());

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isValidPhone = (value: string) => {
  const digits = normalizePhone(value);
  return digits.length >= 9 && digits.length <= 11;
};

function createObjectFileItems(fileList: FileList | null) {
  if (!fileList) return [];
  return Array.from(fileList).map((file) => ({
    id: createId('file'),
    name: file.name,
    url: URL.createObjectURL(file),
  }));
}

function MultiSelectPicker({
  label,
  options,
  selected,
  placeholder,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  placeholder: string;
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const filteredOptions = options.filter((option) => !query.trim() || option.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className={`company-register-dialog__picker ${open ? 'is-open' : ''}`} ref={rootRef}>
      <span className="company-register-dialog__label">{label}</span>
      <button type="button" className="company-register-dialog__picker-trigger" onClick={() => setOpen((current) => !current)}>
        <span>{selected.length ? `${selected[0]}${selected.length > 1 ? ` 외 ${selected.length - 1}` : ''}` : placeholder}</span>
        <span className="toggle-arrow-icon" aria-hidden="true" />
      </button>
      {open ? (
        <div className="company-register-dialog__picker-menu">
          <label className="company-register-dialog__picker-search">
            <img src="/assets/search.svg" alt="" aria-hidden="true" className="search-icon" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${label} 검색`} />
          </label>
          <div className="company-register-dialog__picker-list">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className={`company-register-dialog__picker-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onToggle(option)}
                  >
                    <span className="company-register-dialog__picker-checkbox" aria-hidden="true" />
                    <span>{option}</span>
                  </button>
                );
              })
            ) : (
              <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      ) : null}
      {selected.length ? (
        <div className="company-register-dialog__selected-list">
          {selected.map((item) => (
            <button key={item} type="button" className="company-register-dialog__selected-chip" onClick={() => onToggle(item)}>
              {item}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function InstructorRegistrationDialogs({
  isDirectOpen,
  isExcelOpen,
  existingInstructors,
  organizationOptions,
  courseOptions,
  onCloseDirect,
  onCloseExcel,
  onSaveDirect,
  onSaveExcel,
  onNotify,
}: {
  isDirectOpen: boolean;
  isExcelOpen: boolean;
  existingInstructors: InstructorRow[];
  organizationOptions: string[];
  courseOptions: string[];
  onCloseDirect: () => void;
  onCloseExcel: () => void;
  onSaveDirect: (rows: InstructorRow[]) => void;
  onSaveExcel: (rows: InstructorRow[]) => void;
  onNotify: (message: string, tone?: 'success' | 'error') => void;
}) {
  const [drafts, setDrafts] = useState<InstructorRegisterDraft[]>([createDraft()]);
  const [activeDraftId, setActiveDraftId] = useState<string>(drafts[0].id);
  const [excelPreview, setExcelPreview] = useState<ExcelPreview | null>(null);
  const [excelRows, setExcelRows] = useState<InstructorRow[]>([]);
  const [excelFileName, setExcelFileName] = useState('');

  useEffect(() => {
    if (!isDirectOpen) return;
    const first = createDraft();
    setDrafts([first]);
    setActiveDraftId(first.id);
  }, [isDirectOpen]);

  useEffect(() => {
    if (!isExcelOpen) return;
    setExcelPreview(null);
    setExcelRows([]);
    setExcelFileName('');
  }, [isExcelOpen]);

  const activeDraft = drafts.find((draft) => draft.id === activeDraftId) ?? drafts[0];

  const draftWarnings = useMemo(() => {
    const existingKeys = new Set(
      existingInstructors.map((instructor) => `${instructor.name.trim().toLowerCase()}|${normalizePhone(instructor.phone)}`).filter((key) => !key.endsWith('|')),
    );

    return Object.fromEntries(
      drafts.map((draft) => {
        const missing: string[] = [];
        const duplicate: string[] = [];
        const invalid: string[] = [];
        const fieldErrors: DraftFieldErrors = {};
        const educationFieldErrors: DraftValidation['educationFieldErrors'] = {};
        const careerFieldErrors: DraftValidation['careerFieldErrors'] = {};
        const nameKey = draft.name.trim().toLowerCase();
        const phoneKey = normalizePhone(draft.phone);
        const selfKey = `${nameKey}|${phoneKey}`;

        if (!draft.name.trim()) {
          missing.push('이름을 입력해 주세요.');
          fieldErrors.name = true;
        }
        if (!draft.phone.trim()) {
          missing.push('연락처를 입력해 주세요.');
          fieldErrors.phone = true;
        }
        if (!draft.email.trim()) {
          missing.push('이메일을 입력해 주세요.');
          fieldErrors.email = true;
        }
        if (!draft.hasNoOrganization && !draft.organization.trim()) {
          missing.push('소속(회사)을 선택하거나 소속 없음을 체크해 주세요.');
          fieldErrors.organization = true;
        }
        if (draft.ncsEnrolled && !draft.ncsField.trim()) {
          missing.push('NCS 가입여부를 체크한 경우 NCS(직종분야)를 입력해 주세요.');
          fieldErrors.ncsField = true;
        }

        if (draft.birthDate.trim() && !isValidBirthDate(draft.birthDate)) {
          invalid.push('생년월일 형식 또는 날짜가 올바르지 않습니다.');
          fieldErrors.birthDate = true;
        }
        if (draft.phone.trim() && !isValidPhone(draft.phone)) {
          invalid.push('연락처 형식이 올바르지 않습니다.');
          fieldErrors.phone = true;
        }
        if (draft.email.trim() && !isValidEmail(draft.email)) {
          invalid.push('이메일 형식이 올바르지 않습니다.');
          fieldErrors.email = true;
        }
        if (draft.resumeUrl.trim() && !isValidHttpUrl(draft.resumeUrl.trim())) {
          invalid.push('이력서 링크는 http 또는 https 주소로 입력해 주세요.');
          fieldErrors.resumeUrl = true;
        }
        if (draft.finalEducation && !finalEducationOptions.includes(draft.finalEducation)) {
          invalid.push('최종학력 선택값이 올바르지 않습니다.');
          fieldErrors.finalEducation = true;
        }
        if (draft.lectureRegions.some((item) => !lectureRegionOptions.includes(item))) {
          invalid.push('강의 지역 선택값이 올바르지 않습니다.');
        }
        if (draft.lectureFieldTargets.some((item) => !lectureFieldTargetOptions.includes(item))) {
          invalid.push('강의 분야 및 대상 선택값이 올바르지 않습니다.');
        }
        if (draft.participationItems.some((item) => !courseOptions.includes(item))) {
          invalid.push('참여한 교육과정 선택값이 올바르지 않습니다.');
        }

        draft.educations.forEach((education, index) => {
          if (!hasAnyEducationValue(education)) return;
          const entryErrors: DraftValidation['educationFieldErrors'][string] = {};

          if (!education.schoolName.trim()) {
            missing.push(`학력 ${index + 1}의 학교명을 입력해 주세요.`);
            entryErrors.schoolName = true;
          }
          if (!education.department.trim()) {
            missing.push(`학력 ${index + 1}의 학과를 입력해 주세요.`);
            entryErrors.department = true;
          }
          if (!education.major.trim()) {
            missing.push(`학력 ${index + 1}의 전공을 입력해 주세요.`);
            entryErrors.major = true;
          }
          if (!education.degree.trim()) {
            missing.push(`학력 ${index + 1}의 학위를 선택해 주세요.`);
            entryErrors.degree = true;
          } else if (!degreeOptions.includes(education.degree)) {
            invalid.push(`학력 ${index + 1}의 학위 선택값이 올바르지 않습니다.`);
            entryErrors.degree = true;
          }
          if (!education.period.trim()) {
            missing.push(`학력 ${index + 1}의 교육기간을 입력해 주세요.`);
            entryErrors.period = true;
          } else if (!isValidMonthRange(education.period)) {
            invalid.push(`학력 ${index + 1}의 교육기간 형식이 올바르지 않습니다. 예: 2010.03 - 2014.02`);
            entryErrors.period = true;
          }

          if (Object.keys(entryErrors).length) {
            educationFieldErrors[education.id] = entryErrors;
          }
        });

        draft.careers.forEach((career, index) => {
          if (!hasAnyCareerValue(career)) return;
          const entryErrors: DraftValidation['careerFieldErrors'][string] = {};

          if (!career.period.trim()) {
            missing.push(`경력 ${index + 1}의 경력 기간을 입력해 주세요.`);
            entryErrors.period = true;
          } else if (!isValidMonthRange(career.period)) {
            invalid.push(`경력 ${index + 1}의 경력 기간 형식이 올바르지 않습니다. 예: 2021.01 - 2023.02`);
            entryErrors.period = true;
          }
          if (!career.workplace.trim()) {
            missing.push(`경력 ${index + 1}의 근무처를 입력해 주세요.`);
            entryErrors.workplace = true;
          }
          if (!career.roleName.trim()) {
            missing.push(`경력 ${index + 1}의 경력 명을 입력해 주세요.`);
            entryErrors.roleName = true;
          }

          if (Object.keys(entryErrors).length) {
            careerFieldErrors[career.id] = entryErrors;
          }
        });

        if (nameKey && phoneKey) {
          if (existingKeys.has(selfKey)) {
            duplicate.push('기존 강사 리스트와 강사명과 연락처가 중복됩니다.');
            fieldErrors.name = true;
            fieldErrors.phone = true;
          }
          const duplicatedDrafts = drafts.filter((item) => item.id !== draft.id && item.name.trim().toLowerCase() === nameKey && normalizePhone(item.phone) === phoneKey);
          if (duplicatedDrafts.length) {
            duplicate.push('현재 등록 목록 안에서 강사명과 연락처가 중복됩니다.');
            fieldErrors.name = true;
            fieldErrors.phone = true;
          }
        }

        return [
          draft.id,
          {
            messages: [...missing, ...invalid, ...duplicate],
            missingMessages: missing,
            duplicateMessages: duplicate,
            invalidMessages: invalid,
            fieldErrors,
            educationFieldErrors,
            careerFieldErrors,
          } satisfies DraftValidation,
        ] as const;
      }),
    );
  }, [courseOptions, drafts, existingInstructors]);

  const activeDraftWarnings = activeDraft ? draftWarnings[activeDraft.id] : null;

  const updateDraft = <K extends keyof InstructorRegisterDraft>(draftId: string, field: K, value: InstructorRegisterDraft[K]) => {
    setDrafts((current) => current.map((draft) => (draft.id === draftId ? { ...draft, [field]: value } : draft)));
  };

  const addDraft = () => {
    const next = createDraft();
    setDrafts((current) => [...current, next]);
    setActiveDraftId(next.id);
  };

  const removeDraft = (draftId: string) => {
    setDrafts((current) => {
      if (current.length === 1) {
        const next = createDraft();
        setActiveDraftId(next.id);
        return [next];
      }
      const next = current.filter((draft) => draft.id !== draftId);
      if (draftId === activeDraftId) {
        setActiveDraftId(next[0].id);
      }
      return next;
    });
  };

  const toggleMultiValue = (draftId: string, field: 'lectureRegions' | 'lectureFieldTargets' | 'participationItems', value: string) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              [field]: draft[field].includes(value) ? draft[field].filter((item) => item !== value) : [...draft[field], value],
            }
          : draft,
      ),
    );
  };

  const mapDraftToInstructor = (draft: InstructorRegisterDraft): InstructorRow => ({
    id: createId('instructor'),
    name: draft.name.trim(),
    birthDate: draft.birthDate.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    organization: draft.hasNoOrganization ? '소속 없음' : draft.organization.trim(),
    nscEnrolled: draft.ncsEnrolled,
    lectureRegions: draft.lectureRegions,
    lectureFields: draft.lectureFieldTargets,
    resumeUrl: draft.resumeUrl.trim(),
    resumeFiles: draft.resumeFiles,
    ncsField: draft.ncsField.trim(),
    finalEducation: draft.finalEducation,
    educations: draft.educations,
    careers: draft.careers,
    certificateFiles: draft.certificateFiles,
    participationItems: draft.participationItems,
    hasNoOrganization: draft.hasNoOrganization,
  } as InstructorRow);

  const handleDirectSubmit = (event: FormEvent) => {
    event.preventDefault();
    const invalidDraft = drafts.find((draft) => draftWarnings[draft.id]?.messages.length);
    if (invalidDraft) {
      onNotify(draftWarnings[invalidDraft.id]?.messages[0] ?? '입력값을 확인해 주세요.', 'error');
      setActiveDraftId(invalidDraft.id);
      return;
    }
    onSaveDirect(drafts.map(mapDraftToInstructor));
  };

  const handleExcelFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const previewRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
    const headers = (previewRows[0] ?? []).map((cell) => String(cell));
    const bodyRows = previewRows.slice(1, 8).map((row) => row.map((cell) => String(cell)));

    const mapped = rows.map((row) => ({
      id: createId('excel-instructor'),
      name: String(row['이름'] ?? '').trim(),
      birthDate: normalizeBirthDate(String(row['생년월일'] ?? '').trim()),
      phone: formatPhoneNumber(String(row['연락처'] ?? '')),
      email: String(row['이메일'] ?? '').trim(),
      organization: String(row['소속(회사)'] ?? row['소속'] ?? '').trim(),
      nscEnrolled: ['true', '1', 'y', 'yes', '가입'].includes(String(row['NCS 가입여부'] ?? '').trim().toLowerCase()),
      lectureRegions: String(row['강의 지역'] ?? '')
        .split(/[,/|]/)
        .map((item) => item.trim())
        .filter(Boolean),
      lectureFields: String(row['강의 분야 및 대상'] ?? row['강의 분야'] ?? '')
        .split(/[,/|]/)
        .map((item) => item.trim())
        .filter(Boolean),
      resumeUrl: String(row['이력서 링크'] ?? '').trim(),
      resumeFiles: [],
      ncsField: String(row['NCS(직종분야)'] ?? '').trim(),
      finalEducation: String(row['최종학력'] ?? '').trim(),
      educations: [],
      careers: [],
      certificateFiles: [],
      participationItems: String(row['참여한 교육과정'] ?? '')
        .split(/[,/|]/)
        .map((item) => item.trim())
        .filter(Boolean),
      hasNoOrganization: !String(row['소속(회사)'] ?? row['소속'] ?? '').trim(),
    })) as InstructorRow[];

    setExcelFileName(file.name);
    setExcelPreview({ headers, rows: bodyRows });
    setExcelRows(mapped);
  };

  const handleExcelSubmit = () => {
    if (!excelRows.length) {
      onNotify('엑셀 파일을 먼저 업로드해 주세요.', 'error');
      return;
    }

    const existingKeys = new Set(
      existingInstructors.map((instructor) => `${instructor.name.trim().toLowerCase()}|${normalizePhone(instructor.phone)}`).filter((key) => !key.endsWith('|')),
    );
    const seen = new Set<string>();

    for (const [index, row] of excelRows.entries()) {
      const key = `${row.name.trim().toLowerCase()}|${normalizePhone(row.phone)}`;
      if (!row.name.trim() || !row.phone.trim() || !row.email.trim()) {
        onNotify(`엑셀 ${index + 2}행에 이름, 연락처, 이메일 필수값이 비어 있습니다.`, 'error');
        return;
      }
      if (!isValidPhone(row.phone) || !isValidEmail(row.email)) {
        onNotify(`엑셀 ${index + 2}행의 연락처 또는 이메일 형식이 올바르지 않습니다.`, 'error');
        return;
      }
      if (row.birthDate.trim() && !isValidBirthDate(row.birthDate)) {
        onNotify(`엑셀 ${index + 2}행의 생년월일이 올바르지 않습니다.`, 'error');
        return;
      }
      if (row.resumeUrl.trim() && !isValidHttpUrl(row.resumeUrl.trim())) {
        onNotify(`엑셀 ${index + 2}행의 이력서 링크 형식이 올바르지 않습니다.`, 'error');
        return;
      }
      if (row.finalEducation && !finalEducationOptions.includes(row.finalEducation)) {
        onNotify(`엑셀 ${index + 2}행의 최종학력 값이 올바르지 않습니다.`, 'error');
        return;
      }
      if (row.lectureRegions.some((item) => !lectureRegionOptions.includes(item))) {
        onNotify(`엑셀 ${index + 2}행의 강의 지역 값이 올바르지 않습니다.`, 'error');
        return;
      }
      if (row.lectureFields.some((item) => !lectureFieldTargetOptions.includes(item))) {
        onNotify(`엑셀 ${index + 2}행의 강의 분야 및 대상 값이 올바르지 않습니다.`, 'error');
        return;
      }
      if (row.participationItems?.some((item) => !courseOptions.includes(item))) {
        onNotify(`엑셀 ${index + 2}행의 참여한 교육과정 값이 올바르지 않습니다.`, 'error');
        return;
      }
      if (row.nscEnrolled && !row.ncsField?.trim()) {
        onNotify(`엑셀 ${index + 2}행은 NCS 가입여부가 체크되어 있어 직종분야 입력이 필요합니다.`, 'error');
        return;
      }
      if (existingKeys.has(key) || seen.has(key)) {
        onNotify(`엑셀 ${index + 2}행에 기존 강사 또는 업로드 목록과 중복되는 강사명/연락처가 있습니다.`, 'error');
        return;
      }
      seen.add(key);
    }

    onSaveExcel(excelRows);
  };

  if (!isDirectOpen && !isExcelOpen) return null;

  return (
    <>
      {isDirectOpen ? (
        <div className="company-register-dialog" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCloseDirect()}>
          <div className="company-register-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="instructor-register-dialog-title">
            <div className="company-register-dialog__header">
              <div>
                <div className="company-register-dialog__eyebrow">강사 등록</div>
                <h2 id="instructor-register-dialog-title" className="company-register-dialog__title">
                  여러 강사를 한 번에 직접 입력해서 등록합니다.
                </h2>
              </div>
              <button type="button" className="company-register-dialog__close company-register-dialog__close--small" onClick={onCloseDirect} aria-label="강사 등록 창 닫기">
                <img src="/assets/close.svg" alt="" aria-hidden="true" className="company-register-dialog__close-icon" />
              </button>
            </div>

            <div className="company-register-dialog__body">
              <aside className="company-register-dialog__list-pane company-register-dialog__sidebar" aria-label="강사 목록">
                <div className="company-register-dialog__list-pane-header">
                  <div>
                    <div className="company-register-dialog__pane-title">강사 리스트</div>
                  </div>
                  <button type="button" className="company-register-dialog__add-button" onClick={addDraft}>
                    <img className="company-register-dialog__add-icon" src="/assets/plus.svg" alt="" aria-hidden="true" />
                    <span className="company-register-dialog__add-text">추가</span>
                  </button>
                </div>

                <div className="company-register-dialog__list" role="list">
                  {drafts.map((draft, index) => (
                    <div key={draft.id} className={`company-register-dialog__list-item ${draft.id === activeDraftId ? 'is-active' : ''}`} role="listitem">
                      <button type="button" className="company-register-dialog__list-main" onClick={() => setActiveDraftId(draft.id)}>
                        <span className="company-register-dialog__list-content">
                          <strong>{draft.name || `강사 ${index + 1}`}</strong>
                          <span>{draft.organization || (draft.hasNoOrganization ? '소속 없음' : '강사 정보 입력 전')}</span>
                        </span>
                      </button>
                      <div className="company-register-dialog__list-statuses">
                        {draftWarnings[draft.id]?.messages.length ? (
                          <button type="button" className="company-register-dialog__list-warning" aria-label={draftWarnings[draft.id].messages.join(' / ')}>
                            <img src="/assets/problem.svg" alt="" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                      <button type="button" className="company-register-dialog__list-remove" onClick={() => removeDraft(draft.id)} aria-label={`${draft.name || `강사 ${index + 1}`} 삭제`}>
                        <img className="company-register-dialog__list-remove-icon" src="/assets/trash.svg" alt="" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </aside>

              {activeDraft ? (
                <form className="company-register-dialog__form-shell company-register-dialog__form-shell--company" onSubmit={handleDirectSubmit}>
                  <div className="company-register-dialog__form-header">
                    <div>
                      <div className="company-register-dialog__pane-title">강사 정보</div>
                    </div>
                  </div>
                  <div className="company-register-dialog__form-scroll company-register-dialog__form-scroll--company">
                    <div className="company-register-dialog__grid">
                      <div className="company-register-dialog__field-row">
                        <label className="company-register-dialog__field">
                          <span className="company-register-dialog__label">이름 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span></span>
                          <input
                            value={activeDraft.name}
                            onChange={(event) => updateDraft(activeDraft.id, 'name', event.target.value)}
                            placeholder="강사명"
                            aria-invalid={Boolean(activeDraftWarnings?.fieldErrors.name)}
                          />
                        </label>
                        <label className="company-register-dialog__field">
                          <span className="company-register-dialog__label">생년월일</span>
                          <input
                            value={activeDraft.birthDate}
                            onChange={(event) => updateDraft(activeDraft.id, 'birthDate', formatBirthDate(event.target.value))}
                            placeholder="1990-01-01"
                            inputMode="numeric"
                            aria-invalid={Boolean(activeDraftWarnings?.fieldErrors.birthDate)}
                          />
                        </label>
                      </div>

                      <div className="company-register-dialog__field-row">
                        <label className="company-register-dialog__field">
                          <span className="company-register-dialog__label">연락처 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span></span>
                          <input
                            value={activeDraft.phone}
                            onChange={(event) => updateDraft(activeDraft.id, 'phone', formatPhoneNumber(event.target.value))}
                            placeholder="010-0000-0000"
                            aria-invalid={Boolean(activeDraftWarnings?.fieldErrors.phone)}
                          />
                        </label>
                        <label className="company-register-dialog__field">
                          <span className="company-register-dialog__label">이메일 <span className="company-register-dialog__label-required company-register-dialog__label-required--red">필수</span></span>
                          <input
                            value={activeDraft.email}
                            onChange={(event) => updateDraft(activeDraft.id, 'email', event.target.value)}
                            placeholder="name@company.com"
                            aria-invalid={Boolean(activeDraftWarnings?.fieldErrors.email)}
                          />
                        </label>
                      </div>

                      <MultiSelectPicker
                        label="강의 지역"
                        options={lectureRegionOptions}
                        selected={activeDraft.lectureRegions}
                        placeholder="강의 지역을 선택하세요"
                        onToggle={(value) => toggleMultiValue(activeDraft.id, 'lectureRegions', value)}
                      />

                      <MultiSelectPicker
                        label="강의 분야 및 대상"
                        options={lectureFieldTargetOptions}
                        selected={activeDraft.lectureFieldTargets}
                        placeholder="강의 분야 및 대상을 선택하세요"
                        onToggle={(value) => toggleMultiValue(activeDraft.id, 'lectureFieldTargets', value)}
                      />

                      <div className="company-register-dialog__field-row">
                        <div className="company-register-dialog__field">
                          <span className="company-register-dialog__label">소속(회사)</span>
                          <DropdownSelect
                            label="소속(회사)"
                            value={activeDraft.organization}
                            placeholder="소속 회사를 선택하세요"
                            options={organizationOptions.map((option) => ({ label: option, value: option }))}
                            disabled={activeDraft.hasNoOrganization}
                            ariaInvalid={Boolean(activeDraftWarnings?.fieldErrors.organization)}
                            onChange={(nextValue) => updateDraft(activeDraft.id, 'organization', nextValue)}
                          />
                        </div>
                        <label className="instructor-register-dialog__inline-check">
                          <input
                            type="checkbox"
                            checked={activeDraft.hasNoOrganization}
                            onChange={(event) => {
                              updateDraft(activeDraft.id, 'hasNoOrganization', event.target.checked);
                              if (event.target.checked) {
                                updateDraft(activeDraft.id, 'organization', '');
                              }
                            }}
                          />
                          <span>소속 없음</span>
                        </label>
                      </div>

                      <div className="company-register-dialog__field-row">
                        <label className="instructor-register-dialog__inline-check">
                          <input
                            type="checkbox"
                            checked={activeDraft.ncsEnrolled}
                            onChange={(event) => updateDraft(activeDraft.id, 'ncsEnrolled', event.target.checked)}
                          />
                          <span>NCS 가입여부</span>
                        </label>
                        {activeDraft.ncsEnrolled ? (
                          <label className="company-register-dialog__field">
                            <span className="company-register-dialog__label">NCS(직종분야)</span>
                            <input
                              value={activeDraft.ncsField}
                              onChange={(event) => updateDraft(activeDraft.id, 'ncsField', event.target.value)}
                              placeholder="예: 정보기술개발"
                              aria-invalid={Boolean(activeDraftWarnings?.fieldErrors.ncsField)}
                            />
                          </label>
                        ) : <div />}
                      </div>

                      <label className="company-register-dialog__field">
                        <span className="company-register-dialog__label">최종학력</span>
                        <DropdownSelect
                          label="최종학력"
                          value={activeDraft.finalEducation}
                          placeholder="최종학력을 선택하세요"
                          options={finalEducationOptions.map((option) => ({ label: option, value: option }))}
                          ariaInvalid={Boolean(activeDraftWarnings?.fieldErrors.finalEducation)}
                          onChange={(nextValue) => updateDraft(activeDraft.id, 'finalEducation', nextValue)}
                        />
                      </label>

                      <section className="company-register-dialog__section company-register-dialog__field--wide">
                        <div className="company-register-dialog__section-head">
                          <div>
                            <div className="company-register-dialog__section-title">학력</div>
                            <div className="company-register-dialog__section-subtitle">학교명, 학과, 전공, 학위, 교육기간을 여러 개 추가할 수 있습니다.</div>
                          </div>
                          <button
                            type="button"
                            className="company-register-dialog__section-action"
                            onClick={() => updateDraft(activeDraft.id, 'educations', [...activeDraft.educations, createEducationEntry()])}
                          >
                            학력 추가
                          </button>
                        </div>
                        <div className="company-register-dialog__contacts company-register-dialog__contacts--register">
                          {activeDraft.educations.map((education, index) => (
                            <article key={education.id} className="company-register-dialog__contact-card">
                              <div className="company-register-dialog__contact-head">
                                <strong>{`학력 ${index + 1}`}</strong>
                                <button
                                  type="button"
                                  className="company-register-dialog__contact-remove"
                                  onClick={() =>
                                    updateDraft(
                                      activeDraft.id,
                                      'educations',
                                      activeDraft.educations.length === 1
                                        ? [createEducationEntry()]
                                        : activeDraft.educations.filter((item) => item.id !== education.id),
                                    )
                                  }
                                >
                                  삭제
                                </button>
                              </div>
                              <div className="company-register-dialog__contact-grid">
                                <label className="company-register-dialog__field"><span className="company-register-dialog__label">학교명</span><input value={education.schoolName} onChange={(event) => updateDraft(activeDraft.id, 'educations', activeDraft.educations.map((item) => item.id === education.id ? { ...item, schoolName: event.target.value } : item))} aria-invalid={Boolean(activeDraftWarnings?.educationFieldErrors[education.id]?.schoolName)} /></label>
                                <label className="company-register-dialog__field"><span className="company-register-dialog__label">학과</span><input value={education.department} onChange={(event) => updateDraft(activeDraft.id, 'educations', activeDraft.educations.map((item) => item.id === education.id ? { ...item, department: event.target.value } : item))} aria-invalid={Boolean(activeDraftWarnings?.educationFieldErrors[education.id]?.department)} /></label>
                                <label className="company-register-dialog__field"><span className="company-register-dialog__label">전공</span><input value={education.major} onChange={(event) => updateDraft(activeDraft.id, 'educations', activeDraft.educations.map((item) => item.id === education.id ? { ...item, major: event.target.value } : item))} aria-invalid={Boolean(activeDraftWarnings?.educationFieldErrors[education.id]?.major)} /></label>
                                <label className="company-register-dialog__field">
                                  <span className="company-register-dialog__label">학위</span>
                                  <DropdownSelect
                                    label="학위"
                                    value={education.degree}
                                    placeholder="선택"
                                    options={degreeOptions.map((option) => ({ label: option, value: option }))}
                                    ariaInvalid={Boolean(activeDraftWarnings?.educationFieldErrors[education.id]?.degree)}
                                    onChange={(nextValue) =>
                                      updateDraft(
                                        activeDraft.id,
                                        'educations',
                                        activeDraft.educations.map((item) => (item.id === education.id ? { ...item, degree: nextValue } : item)),
                                      )
                                    }
                                  />
                                </label>
                                <label className="company-register-dialog__field company-register-dialog__field--wide"><span className="company-register-dialog__label">교육기간</span><input value={education.period} onChange={(event) => updateDraft(activeDraft.id, 'educations', activeDraft.educations.map((item) => item.id === education.id ? { ...item, period: event.target.value } : item))} placeholder="예: 2010.03 - 2014.02" aria-invalid={Boolean(activeDraftWarnings?.educationFieldErrors[education.id]?.period)} /></label>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="company-register-dialog__section company-register-dialog__field--wide">
                        <div className="company-register-dialog__section-head">
                          <div>
                            <div className="company-register-dialog__section-title">경력</div>
                            <div className="company-register-dialog__section-subtitle">경력 기간, 근무처, 경력 명을 여러 개 추가할 수 있습니다.</div>
                          </div>
                          <button
                            type="button"
                            className="company-register-dialog__section-action"
                            onClick={() => updateDraft(activeDraft.id, 'careers', [...activeDraft.careers, createCareerEntry()])}
                          >
                            경력 추가
                          </button>
                        </div>
                        <div className="company-register-dialog__contacts company-register-dialog__contacts--register">
                          {activeDraft.careers.map((career, index) => (
                            <article key={career.id} className="company-register-dialog__contact-card">
                              <div className="company-register-dialog__contact-head">
                                <strong>{`경력 ${index + 1}`}</strong>
                                <button
                                  type="button"
                                  className="company-register-dialog__contact-remove"
                                  onClick={() =>
                                    updateDraft(
                                      activeDraft.id,
                                      'careers',
                                      activeDraft.careers.length === 1 ? [createCareerEntry()] : activeDraft.careers.filter((item) => item.id !== career.id),
                                    )
                                  }
                                >
                                  삭제
                                </button>
                              </div>
                              <div className="company-register-dialog__contact-grid">
                                <label className="company-register-dialog__field"><span className="company-register-dialog__label">경력 기간</span><input value={career.period} onChange={(event) => updateDraft(activeDraft.id, 'careers', activeDraft.careers.map((item) => item.id === career.id ? { ...item, period: event.target.value } : item))} placeholder="예: 2021.01 - 2023.02" aria-invalid={Boolean(activeDraftWarnings?.careerFieldErrors[career.id]?.period)} /></label>
                                <label className="company-register-dialog__field"><span className="company-register-dialog__label">근무처</span><input value={career.workplace} onChange={(event) => updateDraft(activeDraft.id, 'careers', activeDraft.careers.map((item) => item.id === career.id ? { ...item, workplace: event.target.value } : item))} aria-invalid={Boolean(activeDraftWarnings?.careerFieldErrors[career.id]?.workplace)} /></label>
                                <label className="company-register-dialog__field"><span className="company-register-dialog__label">경력 명</span><input value={career.roleName} onChange={(event) => updateDraft(activeDraft.id, 'careers', activeDraft.careers.map((item) => item.id === career.id ? { ...item, roleName: event.target.value } : item))} aria-invalid={Boolean(activeDraftWarnings?.careerFieldErrors[career.id]?.roleName)} /></label>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>

                      <label className="company-register-dialog__field company-register-dialog__field--wide">
                        <span className="company-register-dialog__label">이력서 링크</span>
                        <input
                          value={activeDraft.resumeUrl}
                          onChange={(event) => updateDraft(activeDraft.id, 'resumeUrl', event.target.value)}
                          placeholder="https://..."
                          aria-invalid={Boolean(activeDraftWarnings?.fieldErrors.resumeUrl)}
                        />
                      </label>

                      <div className="company-register-dialog__field-row">
                        <label className="company-register-dialog__field">
                          <span className="company-register-dialog__label">이력서 파일 첨부</span>
                          <input type="file" multiple onChange={(event) => updateDraft(activeDraft.id, 'resumeFiles', createObjectFileItems(event.target.files) as InstructorResumeFile[])} />
                        </label>
                        <label className="company-register-dialog__field">
                          <span className="company-register-dialog__label">첨부(증명)파일</span>
                          <input type="file" multiple onChange={(event) => updateDraft(activeDraft.id, 'certificateFiles', createObjectFileItems(event.target.files))} />
                        </label>
                      </div>

                      <MultiSelectPicker
                        label="참여한 교육과정"
                        options={courseOptions}
                        selected={activeDraft.participationItems}
                        placeholder="교육과정을 선택하세요"
                        onToggle={(value) => toggleMultiValue(activeDraft.id, 'participationItems', value)}
                      />
                    </div>
                  </div>

                  <div className="company-register-dialog__footer">
                    <button type="button" className="company-register-dialog__secondary" onClick={onCloseDirect}>
                      취소
                    </button>
                    <button type="submit" className="company-register-dialog__primary">
                      강사 등록
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isExcelOpen ? (
        <div className="company-excel-register-dialog" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCloseExcel()}>
          <div className="company-excel-register-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="instructor-excel-register-title">
            <div className="company-excel-register-dialog__header">
              <div>
                <div className="company-register-dialog__eyebrow">강사 엑셀 등록</div>
                <h2 id="instructor-excel-register-title" className="company-register-dialog__title">엑셀 파일로 강사를 일괄 등록합니다.</h2>
              </div>
              <button type="button" className="company-register-dialog__close company-register-dialog__close--small" onClick={onCloseExcel}>
                <img src="/assets/close.svg" alt="" aria-hidden="true" className="company-register-dialog__close-icon" />
              </button>
            </div>

            <div className="company-excel-register-dialog__body">
              <div className="company-excel-register-dialog__dropzone">
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelFileChange} />
                <div className="company-excel-register-dialog__dropzone-title">{excelFileName || '엑셀 파일 업로드'}</div>
                <div className="company-excel-register-dialog__dropzone-caption">필수 컬럼: 이름 / 연락처 / 이메일</div>
              </div>

              {excelPreview ? (
                <div className="company-excel-register-dialog__sheet-table-wrap">
                  <table className="company-excel-register-dialog__sheet-table">
                    <thead>
                      <tr>
                        {excelPreview.headers.map((header, index) => (
                          <th key={`${header}-${index}`}>{header || `컬럼 ${index + 1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelPreview.rows.map((row, rowIndex) => (
                        <tr key={`preview-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${rowIndex}-${cellIndex}`}>{cell || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="company-excel-register-dialog__preview-empty">파일을 첨부하면 여기에서 미리보기가 표시됩니다.</div>
              )}
            </div>

            <div className="company-excel-register-dialog__actions">
              <button type="button" className="company-excel-register-dialog__secondary" onClick={onCloseExcel}>
                취소
              </button>
              <button type="button" className="company-excel-register-dialog__primary" onClick={handleExcelSubmit}>
                일괄 등록 시작
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
