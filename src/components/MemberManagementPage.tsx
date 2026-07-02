import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { TagToggleAction } from './TagToggleAction';
import { TagDialog } from './TagDialog';
import { DropdownSelect } from './DropdownSelect';
import {
  getMemberWorkspaceBrand,
  loadMemberManagementRows,
  persistMemberMemos,
  persistMemberTagState,
  type MemberMemoRecord,
  type MemberViewRow,
  type MemberWorkspace,
} from '../services/memberManagement';

type MemberManagementPageProps = {
  workspace: MemberWorkspace;
  currentUser?: {
    id: string;
    name: string;
    brand: string | null;
    organization: string | null;
  } | null;
};

type MemberFilters = {
  query: string;
  employmentStatus: string;
  supportProgram: string;
  courseProgram: string;
  major: string;
  job: string;
  interest: string;
  joinedDate: string;
  ageBand: string;
};

type MemberListSortOrder = 'recent_joined' | 'name' | 'oldest_joined';

type MemberMemoEntry = {
  id: string;
  date: string;
  author: string;
  body: string;
  isMine: boolean;
};

type MemberMemoPopoverPosition = {
  left: number;
  top: number;
  maxHeight: number;
};

const MEMO_POPOVER_EDGE_PADDING = 16;
const MEMO_POPOVER_GAP = 8;
const MEMO_POPOVER_WIDTH = 280;
const MEMO_POPOVER_HEIGHT = 260;

const defaultFilters: MemberFilters = {
  query: '',
  employmentStatus: '전체',
  supportProgram: '전체',
  courseProgram: '전체',
  major: '전체',
  job: '전체',
  interest: '전체',
  joinedDate: '',
  ageBand: '전체',
};

const AGE_BANDS = ['전체', '10대', '20대', '30대', '40대', '50대 이상'] as const;
const SORT_OPTIONS: Array<{ label: string; value: MemberListSortOrder }> = [
  { label: '최근 가입순', value: 'recent_joined' },
  { label: '이름순(가나다)', value: 'name' },
  { label: '오래된순', value: 'oldest_joined' },
];

export function MemberManagementPage({ workspace, currentUser }: MemberManagementPageProps) {
  const brand = getMemberWorkspaceBrand(workspace);
  const memberMemoHideTimerRef = useRef<number | null>(null);
  const [rows, setRows] = useState<MemberViewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [filters, setFilters] = useState<MemberFilters>(defaultFilters);
  const [sortOrder, setSortOrder] = useState<MemberListSortOrder>('recent_joined');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberTagDialogMemberId, setMemberTagDialogMemberId] = useState<string | null>(null);
  const [memberTagDialogMode, setMemberTagDialogMode] = useState<'add' | 'remove' | null>(null);
  const [memberTagMemoDraft, setMemberTagMemoDraft] = useState('');
  const [activeMemoMemberId, setActiveMemoMemberId] = useState<string | null>(null);
  const [memberMemoDialogMemberId, setMemberMemoDialogMemberId] = useState<string | null>(null);
  const [memberMemoDraft, setMemberMemoDraft] = useState('');
  const [memberMemoEditTargetId, setMemberMemoEditTargetId] = useState<string | null>(null);
  const [memberMemoPopoverPosition, setMemberMemoPopoverPosition] = useState<MemberMemoPopoverPosition | null>(null);
  const memberMemoActionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      setIsLoading(true);
      setLoadError(null);
      setLoadWarning(null);

      try {
        const result = await loadMemberManagementRows(workspace);
        if (cancelled) return;
        setRows(result.rows);
        setLoadWarning(result.warning ?? null);
      } catch {
        if (cancelled) return;
        setRows([]);
        setLoadError('가입 회원 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRows();

    return () => {
      cancelled = true;
    };
  }, [workspace]);

  const visibleRows = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    const filteredRows = rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          row.name,
          row.phone,
          row.status,
          row.interest,
          row.major,
          row.job,
          row.signupLabel,
          row.supportPrograms.join(' '),
          row.courseHistory.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesEmployment =
        filters.employmentStatus === '전체' || row.status === filters.employmentStatus;
      const matchesSupport = filters.supportProgram === '전체' || row.supportPrograms.includes(filters.supportProgram);
      const matchesCourse = filters.courseProgram === '전체' || row.courseHistory.includes(filters.courseProgram);
      const matchesMajor = filters.major === '전체' || row.major === filters.major;
      const matchesJob = filters.job === '전체' || row.job === filters.job;
      const matchesInterest = filters.interest === '전체' || row.interest === filters.interest;
      const matchesJoinedDate = !filters.joinedDate || row.joinedAt === filters.joinedDate;
      const matchesAgeBand = filters.ageBand === '전체' || getAgeBand(row.age) === filters.ageBand;

      return (
        matchesQuery &&
        matchesEmployment &&
        matchesSupport &&
        matchesCourse &&
        matchesMajor &&
        matchesJob &&
        matchesInterest &&
        matchesJoinedDate &&
        matchesAgeBand
      );
    });

    const sortedRows = [...filteredRows].sort((left, right) => {
      if (sortOrder === 'name') {
        return left.name.localeCompare(right.name, 'ko');
      }

      const leftTime = left.joinedAt ? new Date(left.joinedAt).getTime() : 0;
      const rightTime = right.joinedAt ? new Date(right.joinedAt).getTime() : 0;

      return sortOrder === 'oldest_joined' ? leftTime - rightTime : rightTime - leftTime;
    });

    return sortedRows;
  }, [filters, rows, sortOrder]);

  const employmentOptions = useMemo(() => ['전체', ...collectUnique(rows.map((row) => row.status))], [rows]);
  const supportProgramOptions = useMemo(
    () => ['전체', ...collectUnique(rows.flatMap((row) => row.supportPrograms))],
    [rows],
  );
  const courseProgramOptions = useMemo(
    () => ['전체', ...collectUnique(rows.flatMap((row) => row.courseHistory))],
    [rows],
  );
  const majorOptions = useMemo(() => ['전체', ...collectUnique(rows.map((row) => row.major))], [rows]);
  const jobOptions = useMemo(() => ['전체', ...collectUnique(rows.map((row) => row.job))], [rows]);
  const interestOptions = useMemo(() => ['전체', ...collectUnique(rows.map((row) => row.interest))], [rows]);

  const selectedVisibleCount = visibleRows.filter((row) => selectedMemberIds.includes(row.id)).length;
  const allVisibleSelected = visibleRows.length > 0 && selectedVisibleCount === visibleRows.length;
  const someVisibleSelected = selectedVisibleCount > 0 && selectedVisibleCount < visibleRows.length;

  useEffect(() => {
    setSelectedMemberIds((current) => current.filter((id) => rows.some((row) => row.id === id)));
  }, [rows]);

  const updateFilter = <K extends keyof MemberFilters>(key: K, value: MemberFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSortOrder('recent_joined');
  };

  const clearMemberMemoHideTimer = () => {
    if (memberMemoHideTimerRef.current !== null) {
      window.clearTimeout(memberMemoHideTimerRef.current);
      memberMemoHideTimerRef.current = null;
    }
  };

  const updateMemberMemoPopoverPosition = (memberId: string) => {
    const anchor = memberMemoActionRefs.current[memberId];
    if (!anchor) {
      setMemberMemoPopoverPosition(null);
      return;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const width = Math.min(MEMO_POPOVER_WIDTH, window.innerWidth - MEMO_POPOVER_EDGE_PADDING * 2);

    let left = anchorRect.right - width;
    left = Math.min(left, window.innerWidth - width - MEMO_POPOVER_EDGE_PADDING);
    left = Math.max(left, MEMO_POPOVER_EDGE_PADDING);

    let top = anchorRect.bottom + MEMO_POPOVER_GAP;
    const preferredBottom = top + MEMO_POPOVER_HEIGHT;
    if (preferredBottom > window.innerHeight - MEMO_POPOVER_EDGE_PADDING) {
      const aboveTop = anchorRect.top - MEMO_POPOVER_GAP - MEMO_POPOVER_HEIGHT;
      top = aboveTop >= MEMO_POPOVER_EDGE_PADDING ? aboveTop : Math.max(MEMO_POPOVER_EDGE_PADDING, window.innerHeight - MEMO_POPOVER_HEIGHT - MEMO_POPOVER_EDGE_PADDING);
    }

    const maxHeight = Math.max(120, window.innerHeight - top - MEMO_POPOVER_EDGE_PADDING);
    setMemberMemoPopoverPosition({ left, top, maxHeight });
  };

  useLayoutEffect(() => {
    if (!activeMemoMemberId) {
      setMemberMemoPopoverPosition(null);
      return;
    }

    const refreshPosition = () => updateMemberMemoPopoverPosition(activeMemoMemberId);
    refreshPosition();

    window.addEventListener('resize', refreshPosition);
    window.addEventListener('scroll', refreshPosition, true);

    return () => {
      window.removeEventListener('resize', refreshPosition);
      window.removeEventListener('scroll', refreshPosition, true);
    };
  }, [activeMemoMemberId]);

  const openMemberTagDialog = (memberId: string, nextTagged: boolean) => {
    setMemberTagDialogMemberId(memberId);
    setMemberTagDialogMode(nextTagged ? 'add' : 'remove');
    setMemberTagMemoDraft('');
  };

  const closeMemberTagDialog = () => {
    setMemberTagDialogMemberId(null);
    setMemberTagDialogMode(null);
    setMemberTagMemoDraft('');
  };

  const confirmMemberTagDialog = async () => {
    if (!memberTagDialogMemberId || !memberTagDialogMode) return;

    const nextTagged = memberTagDialogMode === 'add';
    const nextMemo = memberTagMemoDraft.trim();
    const previousRows = rows;
    const nextMemoRecord = nextTagged && nextMemo ? createMemberMemoRecord(nextMemo, currentUser, brand) : null;
    const nextTaggedRows = previousRows.map((row) =>
      row.id === memberTagDialogMemberId
        ? {
            ...row,
            tagValue: nextTagged ? 'marked' : null,
          }
        : row,
    );
    const nextRows = nextMemoRecord
      ? nextTaggedRows.map((row) =>
          row.id === memberTagDialogMemberId
            ? {
                ...row,
                memos: [nextMemoRecord, ...(row.memos ?? [])],
              }
            : row,
        )
      : nextTaggedRows;

    setRows(nextRows);

    try {
      await persistMemberTagState(memberTagDialogMemberId, nextTagged);
      if (nextMemoRecord) {
        const currentRow = previousRows.find((row) => row.id === memberTagDialogMemberId);
        const nextMemos = [nextMemoRecord, ...(currentRow?.memos ?? [])];
        try {
          await persistMemberMemos(memberTagDialogMemberId, nextMemos);
        } catch {
          setRows(nextTaggedRows);
          setLoadWarning('회원 메모를 저장하지 못했습니다.');
        }
      }
      closeMemberTagDialog();
    } catch {
      setRows(previousRows);
      setLoadWarning('회원 태그를 저장하지 못했습니다.');
    }
  };

  const openMemberMemoPopover = (memberId: string) => {
    clearMemberMemoHideTimer();
    setActiveMemoMemberId((current) => (current === memberId ? null : memberId));
    setMemberMemoDraft('');
    setMemberMemoEditTargetId(null);
    setMemberMemoDialogMemberId(null);
    if (activeMemoMemberId !== memberId) {
      window.requestAnimationFrame(() => updateMemberMemoPopoverPosition(memberId));
    }
  };

  const closeMemberMemoPopover = () => {
    clearMemberMemoHideTimer();
    setActiveMemoMemberId(null);
    setMemberMemoDraft('');
    setMemberMemoEditTargetId(null);
    setMemberMemoDialogMemberId(null);
  };

  const openMemberMemoDialog = (memberId: string, memo?: MemberMemoRecord | MemberMemoEntry) => {
    setActiveMemoMemberId(null);
    setMemberMemoDialogMemberId(memberId);
    setMemberMemoEditTargetId(memo ? ('id' in memo ? memo.id : null) : null);
    setMemberMemoDraft(memo ? ('content' in memo ? memo.content : memo.body) : '');
  };

  const closeMemberMemoDialog = () => {
    setMemberMemoDialogMemberId(null);
    setMemberMemoDraft('');
    setMemberMemoEditTargetId(null);
  };

  const scheduleMemberMemoPopoverClose = () => {
    clearMemberMemoHideTimer();
    memberMemoHideTimerRef.current = window.setTimeout(() => {
      setActiveMemoMemberId((current) => (current ? null : current));
    }, 140);
  };

  const beginEditMemberMemo = (memberId: string, memo: MemberMemoEntry) => {
    setActiveMemoMemberId(memberId);
    setMemberMemoDraft(memo.body);
    setMemberMemoEditTargetId(memo.id);
  };

  const saveMemberMemo = async (memberId: string) => {
    const nextMemo = memberMemoDraft.trim();
    if (!nextMemo) return;

    const currentRow = rows.find((row) => row.id === memberId);
    if (!currentRow) return;

    const currentMemos = currentRow.memos ?? [];
    const nextMemos = memberMemoEditTargetId
      ? currentMemos.map((memo) =>
          memo.id === memberMemoEditTargetId
            ? {
                ...memo,
                content: nextMemo,
              }
            : memo,
        )
      : [
          createMemberMemoRecord(nextMemo, currentUser, brand),
          ...currentMemos,
        ];

    const previousRows = rows;
    setRows((current) => current.map((row) => (row.id === memberId ? { ...row, memos: nextMemos } : row)));

    try {
      await persistMemberMemos(memberId, nextMemos);
      closeMemberMemoDialog();
    } catch {
      setRows(previousRows);
      setLoadWarning('회원 메모를 저장하지 못했습니다.');
    }
  };

  const deleteMemberMemo = async (memberId: string, memoId: string) => {
    const currentRow = rows.find((row) => row.id === memberId);
    if (!currentRow) return;

    const nextMemos = (currentRow.memos ?? []).filter((memo) => memo.id !== memoId);
    const previousRows = rows;
    setRows((current) => current.map((row) => (row.id === memberId ? { ...row, memos: nextMemos } : row)));

    try {
      await persistMemberMemos(memberId, nextMemos);
      if (memberMemoEditTargetId === memoId) {
        setMemberMemoEditTargetId(null);
        setMemberMemoDraft('');
      }
    } catch {
      setRows(previousRows);
      setLoadWarning('회원 메모를 삭제하지 못했습니다.');
    }
  };

  return (
    <section className="member-page" aria-label="가입 회원 리스트">
      <div className="member-page__hero">
        <div className="member-page__hero-copy">
          <h1 className="member-page__title">가입 회원 리스트</h1>
        </div>

        <div className="member-page__summary">
          <article className="member-page__summary-card">
            <span className="member-page__summary-label">활성 브랜드</span>
            <strong className="member-page__summary-value">{brand}</strong>
            <span className="member-page__summary-note">{workspace}</span>
          </article>
          <article className="member-page__summary-card">
            <span className="member-page__summary-label">조회 회원</span>
            <strong className="member-page__summary-value">{visibleRows.length}명</strong>
            <span className="member-page__summary-note">필터 적용 결과</span>
          </article>
          <article className="member-page__summary-card">
            <span className="member-page__summary-label">선택 회원</span>
            <strong className="member-page__summary-value">{selectedVisibleCount}명</strong>
            <span className="member-page__summary-note">현재 목록에서 선택</span>
          </article>
        </div>
      </div>

      <div className="member-page__filters" aria-label="회원 필터">
        <label className="member-page__field member-page__field--search">
          <span className="member-page__field-label">검색</span>
          <input
            type="search"
            className="member-page__control"
            placeholder="이름, 전화번호, 관심분야 검색"
            value={filters.query}
            onChange={(event) => updateFilter('query', event.target.value)}
          />
        </label>

        <label className="member-page__field">
          <span className="member-page__field-label">취업/재직 상태</span>
          <DropdownSelect
            label="취업/재직 상태"
            value={filters.employmentStatus}
            placeholder="취업/재직 상태"
            options={employmentOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('employmentStatus', nextValue)}
          />
        </label>

        <label className="member-page__field">
          <span className="member-page__field-label">지원 프로그램</span>
          <DropdownSelect
            label="지원 프로그램"
            value={filters.supportProgram}
            placeholder="지원 프로그램"
            options={supportProgramOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('supportProgram', nextValue)}
          />
        </label>

        <label className="member-page__field">
          <span className="member-page__field-label">수강 프로그램</span>
          <DropdownSelect
            label="수강 프로그램"
            value={filters.courseProgram}
            placeholder="수강 프로그램"
            options={courseProgramOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('courseProgram', nextValue)}
          />
        </label>

        <label className="member-page__field">
          <span className="member-page__field-label">전공</span>
          <DropdownSelect
            label="전공"
            value={filters.major}
            placeholder="전공"
            options={majorOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('major', nextValue)}
          />
        </label>

        <label className="member-page__field">
          <span className="member-page__field-label">직무</span>
          <DropdownSelect
            label="직무"
            value={filters.job}
            placeholder="직무"
            options={jobOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('job', nextValue)}
          />
        </label>

        <label className="member-page__field">
          <span className="member-page__field-label">관심분야</span>
          <DropdownSelect
            label="관심분야"
            value={filters.interest}
            placeholder="관심분야"
            options={interestOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('interest', nextValue)}
          />
        </label>

        <label className="member-page__field">
          <span className="member-page__field-label">가입일</span>
          <input
            type="date"
            className="member-page__control"
            value={filters.joinedDate}
            onChange={(event) => updateFilter('joinedDate', event.target.value)}
          />
        </label>

        <label className="member-page__field">
          <span className="member-page__field-label">나이대</span>
          <DropdownSelect
            label="나이대"
            value={filters.ageBand}
            placeholder="나이대"
            options={AGE_BANDS.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('ageBand', nextValue)}
          />
        </label>

        <div className="member-page__filter-actions">
          <button type="button" className="member-page__secondary-button" onClick={resetFilters}>
            필터 초기화
          </button>
        </div>
      </div>

      <div className="member-page__table-card">
        <div className="member-page__table-head">
          <div className="member-page__table-summary">
            <div className={`member-page__status ${isLoading ? 'member-page__status--loading' : ''}`}>
              {isLoading ? '불러오는 중' : loadError ? '오류' : `전체 ${visibleRows.length}명`}
            </div>
            <label className="member-page__table-sort">
              <span className="member-page__table-sort-label">정렬</span>
              <DropdownSelect
                label="정렬"
                value={sortOrder}
                placeholder="최근 가입순"
                options={SORT_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
                onChange={(nextValue) => setSortOrder(nextValue as MemberListSortOrder)}
              />
            </label>
          </div>
        </div>

      {loadError ? <div className="member-page__alert member-page__alert--error">{loadError}</div> : null}
      {loadWarning ? <div className="member-page__alert member-page__alert--warning">{loadWarning}</div> : null}

        <div className="member-page__table-wrap">
          <table className="member-page__table">
            <thead>
              <tr>
                <th className="member-page__th member-page__th--check">
                  <input
                    type="checkbox"
                    aria-label="현재 목록 전체 선택"
                    checked={allVisibleSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = someVisibleSelected;
                      }
                    }}
                    onChange={(event) => {
                      const nextChecked = event.target.checked;
                      setSelectedMemberIds((current) => {
                        const visibleIds = visibleRows.map((row) => row.id);
                        if (!nextChecked) {
                          return current.filter((id) => !visibleIds.includes(id));
                        }
                        return Array.from(new Set([...current, ...visibleIds]));
                      });
                    }}
                  />
                </th>
                <th className="member-page__th">이름 / 나이</th>
                <th className="member-page__th">전화번호</th>
                <th className="member-page__th">상태</th>
                <th className="member-page__th">관심분야</th>
                <th className="member-page__th">마케팅수신동의</th>
                <th className="member-page__th">가입여부 및 가입경로</th>
                <th className="member-page__th">지원이력</th>
                <th className="member-page__th">수강이력</th>
                <th className="member-page__th member-page__th--tag-memo">태그/메모</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && visibleRows.length === 0 ? (
                <tr>
                  <td className="member-page__empty" colSpan={10}>
                    현재 조건에 맞는 회원이 없습니다.
                  </td>
                </tr>
              ) : null}
              {visibleRows.map((row) => {
                const isSelected = selectedMemberIds.includes(row.id);
                const isTagged = row.tagValue === 'marked';
                const memberMemos = row.memos ?? [];
                const isMemoOpen = activeMemoMemberId === row.id;
                const memberTagActionLabel = isTagged ? '태그 해제' : '태그 추가';
                return (
                  <tr key={row.id} className={isSelected ? 'member-page__row member-page__row--selected' : 'member-page__row'}>
                    <td className="member-page__td member-page__td--check">
                      <input
                        type="checkbox"
                        aria-label={`${row.name} 선택`}
                        checked={isSelected}
                        onChange={(event) => {
                          const nextChecked = event.target.checked;
                          setSelectedMemberIds((current) =>
                            nextChecked ? Array.from(new Set([...current, row.id])) : current.filter((id) => id !== row.id),
                          );
                        }}
                      />
                    </td>
                    <td className="member-page__td">
                      <div className="member-page__name-cell">
                        <strong className="member-page__name">{row.name}</strong>
                        <span className="member-page__meta">{row.ageLabel}</span>
                      </div>
                    </td>
                    <td className="member-page__td">{row.phone}</td>
                    <td className="member-page__td">
                      <span className="member-page__chip">{row.status}</span>
                    </td>
                    <td className="member-page__td">
                      <span className="member-page__meta">{row.interest}</span>
                    </td>
                    <td className="member-page__td">
                      <span className={`member-page__badge ${row.smsConsent ? 'member-page__badge--positive' : 'member-page__badge--neutral'}`}>
                        {row.smsConsent ? '동의' : '미동의'}
                      </span>
                    </td>
                    <td className="member-page__td">
                      <div className="member-page__joined">
                        <span className="member-page__joined-label">가입</span>
                        <span className="member-page__meta">{row.signupLabel}</span>
                        <span className="member-page__joined-date">{row.joinedAtLabel}</span>
                      </div>
                    </td>
                    <td className="member-page__td">
                      {row.supportPrograms.length ? (
                        <div className="member-page__history-stack">
                          {row.supportPrograms.map((program) => (
                            <span key={program} className="member-page__history-item">
                              {program}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="member-page__empty-text">지원 이력 없음</span>
                      )}
                    </td>
                    <td className="member-page__td">
                      {row.courseHistory.length ? (
                        <div className="member-page__tags">
                          {row.courseHistory.slice(0, 2).map((course) => (
                            <span key={course} className="member-page__tag member-page__tag--soft">
                              {course}
                            </span>
                          ))}
                          {row.courseHistory.length > 2 ? <span className="member-page__tag member-page__tag--muted">+{row.courseHistory.length - 2}</span> : null}
                        </div>
                      ) : (
                        <span className="member-page__empty-text">수강 이력 없음</span>
                      )}
                    </td>
                    <td className="member-page__td member-page__td--tag-memo">
                      <div className="company-card__meta-right">
                        <TagToggleAction
                          isTagged={isTagged}
                          dotMode="decorative"
                          dotClassName="company-card__reply-tag-dot"
                          dotActiveClassName="company-card__reply-tag-dot--active"
                          markClassName="company-card__tag-dot-mark"
                          labelClassName="company-card__tag-action"
                          labelActiveClassName="company-card__tag-action--active"
                          ariaLabel={`${row.name} ${memberTagActionLabel}`}
                          onClick={() => openMemberTagDialog(row.id, !isTagged)}
                        />

                        <div
                          ref={(node) => {
                            memberMemoActionRefs.current[row.id] = node;
                          }}
                          className={`company-card__reply-wrap ${isMemoOpen ? 'company-card__reply-wrap--open' : ''}`}
                          onMouseEnter={() => {
                            clearMemberMemoHideTimer();
                            setActiveMemoMemberId(row.id);
                            window.requestAnimationFrame(() => updateMemberMemoPopoverPosition(row.id));
                          }}
                          onMouseLeave={scheduleMemberMemoPopoverClose}
                        >
                          <button
                            type="button"
                            className="company-card__reply-count"
                            aria-label={`${row.name} 메모 ${memberMemos.length}개 보기`}
                            aria-expanded={isMemoOpen}
                            onClick={() => openMemberMemoPopover(row.id)}
                          >
                            <img src="/assets/chat.svg" alt="" aria-hidden="true" className="company-card__reply-icon" />
                            <span>{memberMemos.length}</span>
                          </button>

                          {isMemoOpen && memberMemoPopoverPosition
                            ? createPortal(
                                <div
                                  className="company-card__reply-popover company-card__reply-popover--floating"
                                  role="tooltip"
                                  style={
                                    {
                                      position: 'fixed',
                                      left: `${memberMemoPopoverPosition.left}px`,
                                      top: `${memberMemoPopoverPosition.top}px`,
                                      maxHeight: `${memberMemoPopoverPosition.maxHeight}px`,
                                      opacity: 1,
                                      transform: 'none',
                                      pointerEvents: 'auto',
                                    } as CSSProperties
                                  }
                                  onMouseEnter={clearMemberMemoHideTimer}
                                  onMouseLeave={scheduleMemberMemoPopoverClose}
                                >
                                  <div className="company-card__reply-popover-head">
                                    <div className="company-card__reply-popover-title">메모</div>
                                    <button
                                      type="button"
                                      className="company-card__reply-add"
                                      onClick={() => openMemberMemoDialog(row.id)}
                                    >
                                      메모 추가
                                    </button>
                                  </div>
                                  {memberMemos.length ? (
                                    <div className="company-card__reply-popover-list">
                                      {memberMemos.map((memo) => {
                                        const isMine = memo.authorId === currentUser?.id;
                                        const memoModel: MemberMemoEntry = {
                                          id: memo.id,
                                          date: formatMemoDateLabel(memo.createdAt),
                                          author: memo.authorName || '운영자',
                                          body: memo.content,
                                          isMine,
                                        };

                                        return (
                                          <div key={memo.id} className="company-card__reply-popover-item">
                                            <div className="company-card__reply-popover-meta">
                                              <span>{memo.authorName || '운영자'}</span>
                                              <span>{formatMemoDateLabel(memo.createdAt)}</span>
                                            </div>
                                            <p>{memo.content}</p>
                                            {isMine ? (
                                              <div className="company-card__reply-popover-actions">
                                                <button
                                                  type="button"
                                                  onClick={() => openMemberMemoDialog(row.id, memoModel)}
                                                >
                                                  수정
                                                </button>
                                                <button type="button" onClick={() => void deleteMemberMemo(row.id, memo.id)}>
                                                  삭제
                                                </button>
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="company-card__reply-popover-empty">남긴 메모가 없습니다.</p>
                                  )}
                                </div>,
                                document.body,
                              )
                            : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {memberTagDialogMemberId && memberTagDialogMode ? (
        <TagDialog
          titleId="member-tag-dialog-title"
          eyebrow={memberTagDialogMode === 'remove' ? '태그 해제' : '태그 추가'}
          title={memberTagDialogMode === 'remove' ? '태그를 해제하시겠습니까?' : '태그를 설정하시겠습니까?'}
          description={
            memberTagDialogMode === 'remove'
              ? '태그를 해제하면 점 표시만 회색으로 돌아갑니다.'
              : '메모는 선택 사항입니다. 필요하면 태그와 함께 참고 메모를 남겨두세요.'
          }
          isRemoval={memberTagDialogMode === 'remove'}
          showField={memberTagDialogMode === 'add'}
          value={memberTagMemoDraft}
          label="메모"
          placeholder="예: 이번 분기 우선 연락"
          confirmLabel={memberTagDialogMode === 'remove' ? '확인' : '저장'}
          onChange={setMemberTagMemoDraft}
          onClose={closeMemberTagDialog}
          onConfirm={() => void confirmMemberTagDialog()}
        />
      ) : null}

      {memberMemoDialogMemberId ? (
        <TagDialog
          titleId="member-memo-dialog-title"
          eyebrow={memberMemoEditTargetId ? '메모 수정' : '메모 추가'}
          title={memberMemoEditTargetId ? '메모를 수정하시겠습니까?' : '메모를 작성하시겠습니까?'}
          description={memberMemoEditTargetId ? '수정한 메모는 기존 메모를 덮어씁니다.' : '메모를 남기면 툴팁에서 다시 확인할 수 있습니다.'}
          isRemoval={false}
          showField
          value={memberMemoDraft}
          label="메모"
          placeholder="예: 이번 분기 우선 연락"
          confirmLabel={memberMemoEditTargetId ? '수정' : '저장'}
          onChange={setMemberMemoDraft}
          onClose={closeMemberMemoDialog}
          onConfirm={() => void saveMemberMemo(memberMemoDialogMemberId)}
        />
      ) : null}
    </section>
  );
}

function collectUnique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'ko'));
}

function getAgeBand(age: number | null) {
  if (age === null) return '전체';
  if (age < 20) return '10대';
  if (age < 30) return '20대';
  if (age < 40) return '30대';
  if (age < 50) return '40대';
  return '50대 이상';
}

function formatMemoDate(date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatMemoDateLabel(value: string) {
  if (!value) return '';
  if (/^\d{2}\.\d{2}\.\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return formatMemoDate(date);
}

function createMemberMemoRecord(nextMemo: string, currentUser: MemberManagementPageProps['currentUser'], brand: string): MemberMemoRecord {
  const now = new Date();
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `member-memo-${Date.now()}`,
    brand,
    content: nextMemo,
    authorId: currentUser?.id ?? '',
    authorOrg: currentUser?.organization ?? '',
    createdAt: now.toISOString(),
    authorName: currentUser?.name ?? '운영자',
  };
}
