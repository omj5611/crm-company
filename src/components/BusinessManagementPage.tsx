import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { TagDialog } from './TagDialog';
import { TagToggleAction } from './TagToggleAction';
import {
  createBusinessOption,
  createBusinessRecord,
  deleteBusinessOption,
  deleteBusinessRecord,
  loadBusinessManagementData,
  persistBusinessMemos,
  updateBusinessRecord,
  type BusinessManagerRecord,
  type BusinessMemoRecord,
  type BusinessOptionRecord,
  type BusinessRecord,
} from '../services/businessManagement';

type BusinessManagementPageProps = {
  companyOptions: string[];
  instructorOptions: string[];
  mentorOptions: string[];
  workspace: '스팩' | '인사';
  currentUser?: {
    id: string;
    name: string;
    role?: string;
    brand: string | null;
    organization: string | null;
  } | null;
};

type BusinessTarget = '청소년' | '청년(구직자)' | '재직자' | '소상공인' | '기타';

type BusinessFilters = {
  query: string;
  team: string;
  ministry: string;
  agency: string;
  target: string;
};

type BusinessDraft = {
  name: string;
  overview: string;
  targetGroups: BusinessTarget[];
  ministries: string[];
  agencies: string[];
  startDate: string;
  endDate: string;
  budget: string;
  teams: string[];
};

type BusinessCardCourse = {
  id: string;
  name: string;
  targetGroup?: string;
  period?: string;
  status?: string;
};

type BusinessCardRow = {
  id: string;
  name: string;
  overview: string;
  ministries: string[];
  agencies: string[];
  targetGroups: string[];
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  managerIds: string[];
  teamLabel: string;
  managerLabel: string;
  courses: BusinessCardCourse[];
  memos: BusinessMemoRecord[];
  isTagged: boolean;
  createdAt: string | null;
};

type BusinessMemoPopoverPosition = {
  left: number;
  top: number;
  maxHeight: number;
};

type PendingBusinessOptionDelete = {
  type: 'ministry' | 'agency';
  label: string;
};

const BUSINESS_TARGET_OPTIONS: BusinessTarget[] = ['청소년', '청년(구직자)', '재직자', '소상공인', '기타'];
const BUSINESS_TAG_STORAGE_KEY = 'crm-business-tags-v1';
const BUSINESS_COURSE_STORAGE_KEY = 'crm-business-courses-v1';
const MEMO_POPOVER_EDGE_PADDING = 16;
const MEMO_POPOVER_GAP = 8;
const MEMO_POPOVER_WIDTH = 280;
const MEMO_POPOVER_HEIGHT = 260;
const FILTER_MENU_EDGE_PADDING = 16;
const FILTER_MENU_GAP = 6;
const FILTER_MENU_WIDTH = 280;
const DATE_PICKER_EDGE_PADDING = 16;
const DATE_PICKER_GAP = 6;
const DATE_PICKER_WIDTH = 288;

const defaultFilters: BusinessFilters = {
  query: '',
  team: '전체',
  ministry: '전체',
  agency: '전체',
  target: '전체',
};

const emptyDraft: BusinessDraft = {
  name: '',
  overview: '',
  targetGroups: [],
  ministries: [],
  agencies: [],
  startDate: '',
  endDate: '',
  budget: '',
  teams: [],
};

export function BusinessManagementPage({
  companyOptions: _companyOptions,
  instructorOptions: _instructorOptions,
  mentorOptions: _mentorOptions,
  workspace,
  currentUser,
}: BusinessManagementPageProps) {
  const currentYear = new Date().getFullYear();
  const isMaster = currentUser?.role === 'MASTER';
  const currentBrandValue = workspace === '인사' ? 'INSIDEOUT' : 'SNIPERFACTORY';
  const currentBrandLabel = workspace === '인사' ? '인사이드아웃' : '스나이퍼팩토리';
  const memoHideTimerRef = useRef<number | null>(null);
  const menuWrapRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const memoActionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filters, setFilters] = useState<BusinessFilters>(defaultFilters);
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [businessOptions, setBusinessOptions] = useState<BusinessOptionRecord[]>([]);
  const [managerRecords, setManagerRecords] = useState<BusinessManagerRecord[]>([]);
  const [tagStateByBusinessId, setTagStateByBusinessId] = useState<Record<string, boolean>>(() => loadStoredTagState());
  const [coursesByBusinessId] = useState<Record<string, BusinessCardCourse[]>>(() => loadStoredCourses());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BusinessDraft>(emptyDraft);
  const [draftErrors, setDraftErrors] = useState<Partial<Record<keyof BusinessDraft, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptionEditorOpen, setIsOptionEditorOpen] = useState(false);
  const [isOptionEditorSubmitting, setIsOptionEditorSubmitting] = useState(false);
  const [pendingOptionDelete, setPendingOptionDelete] = useState<PendingBusinessOptionDelete | null>(null);
  const [openMenuBusinessId, setOpenMenuBusinessId] = useState<string | null>(null);
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
  const [tagDialogBusinessId, setTagDialogBusinessId] = useState<string | null>(null);
  const [tagDialogMode, setTagDialogMode] = useState<'add' | 'remove' | null>(null);
  const [tagMemoDraft, setTagMemoDraft] = useState('');
  const [activeMemoBusinessId, setActiveMemoBusinessId] = useState<string | null>(null);
  const [memoPopoverPosition, setMemoPopoverPosition] = useState<BusinessMemoPopoverPosition | null>(null);
  const [memoDialogBusinessId, setMemoDialogBusinessId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [memoEditTargetId, setMemoEditTargetId] = useState<string | null>(null);
  const [saveModalMessage, setSaveModalMessage] = useState('');
  const [saveModalMounted, setSaveModalMounted] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const saveModalFrameRef = useRef<number | null>(null);
  const saveModalTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      setLoadWarning(null);

      try {
        const result = await loadBusinessManagementData();
        if (cancelled) return;

        setBusinesses(result.businesses);
        setBusinessOptions(result.options);
        setManagerRecords(result.managers);
        setLoadWarning(result.warning ?? null);
      } catch {
        if (cancelled) return;
        setBusinesses([]);
        setBusinessOptions([]);
        setManagerRecords([]);
        setLoadError('사업 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistTagState(tagStateByBusinessId);
  }, [tagStateByBusinessId]);

  useEffect(() => {
    return () => {
      if (saveModalFrameRef.current !== null) {
        window.cancelAnimationFrame(saveModalFrameRef.current);
      }
      if (saveModalTimeoutRef.current !== null) {
        window.clearTimeout(saveModalTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!openMenuBusinessId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const activeRoot = menuWrapRefs.current[openMenuBusinessId];
      if (activeRoot?.contains(target)) return;
      setOpenMenuBusinessId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuBusinessId(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuBusinessId]);

  const ministryOptions = useMemo(() => ['전체', ...collectUniqueOptions(businessOptions, 'ministry')], [businessOptions]);
  const agencyOptions = useMemo(() => ['전체', ...collectUniqueOptions(businessOptions, 'agency')], [businessOptions]);

  const managerLookup = useMemo(() => new Map(managerRecords.map((manager) => [manager.id, manager])), [managerRecords]);
  const teamOptions = useMemo(
    () => ['전체', ...collectUnique(managerRecords.map((manager) => manager.organization ?? ''))],
    [managerRecords],
  );
  const teamSelectOptions = useMemo(
    () =>
      collectUnique(managerRecords.map((manager) => manager.organization ?? '')).map((organization) => ({
        label: organization,
        value: organization,
      })),
    [managerRecords],
  );

  const businessRows = useMemo<BusinessCardRow[]>(
    () =>
      businesses.map((business) => {
        const managerLabels = (business.manager_ids ?? [])
          .map((managerId) => managerLookup.get(managerId))
          .filter(Boolean) as BusinessManagerRecord[];
        const teamLabel = collectUnique(managerLabels.map((manager) => manager.organization ?? '')).join(', ') || '미지정';
        const managerLabel =
          managerLabels.map((manager) => manager.name).filter(Boolean).join(', ') || '미지정';

        return {
          id: business.id,
          name: business.name,
          overview: business.overview ?? '',
          ministries: normalizeStringArray(business.ministries),
          agencies: normalizeStringArray(business.agencies),
          targetGroups: normalizeStringArray(business.target_groups),
          startDate: business.start_date,
          endDate: business.end_date,
          budget: normalizeBudget(business.budget),
          managerIds: normalizeStringArray(business.manager_ids),
          teamLabel,
          managerLabel,
          courses: coursesByBusinessId[business.id] ?? [],
          memos: parseBusinessMemos(business.memos, currentUser?.brand ?? null),
          isTagged: Boolean(tagStateByBusinessId[business.id]),
          createdAt: business.created_at,
        };
      }),
    [businesses, coursesByBusinessId, currentUser?.brand, managerLookup, tagStateByBusinessId],
  );

  const visibleBusinesses = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return [...businessRows]
      .filter((business) => matchesBusinessYear(business, selectedYear))
      .filter((business) => {
        const searchableText = buildBusinessSearchText(business);
        const matchesQuery =
          !normalizedQuery ||
          searchableText.includes(normalizedQuery);

        const matchesTeam = filters.team === '전체' || business.teamLabel.split(', ').includes(filters.team);
        const matchesMinistry = filters.ministry === '전체' || business.ministries.includes(filters.ministry);
        const matchesAgency = filters.agency === '전체' || business.agencies.includes(filters.agency);
        const matchesTarget = filters.target === '전체' || business.targetGroups.includes(filters.target);

        return matchesQuery && matchesTeam && matchesMinistry && matchesAgency && matchesTarget;
      })
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });
  }, [businessRows, filters, selectedYear]);

  const clearMemoHideTimer = () => {
    if (memoHideTimerRef.current !== null) {
      window.clearTimeout(memoHideTimerRef.current);
      memoHideTimerRef.current = null;
    }
  };

  const updateMemoPopoverPosition = (businessId: string) => {
    const anchor = memoActionRefs.current[businessId];
    if (!anchor) {
      setMemoPopoverPosition(null);
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
    setMemoPopoverPosition({ left, top, maxHeight });
  };

  useLayoutEffect(() => {
    if (!activeMemoBusinessId) {
      setMemoPopoverPosition(null);
      return;
    }

    const refresh = () => updateMemoPopoverPosition(activeMemoBusinessId);
    refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);

    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
    };
  }, [activeMemoBusinessId]);

  const updateFilter = <K extends keyof BusinessFilters>(key: K, value: BusinessFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const showSaveModal = (message = '추가 및 저장되었습니다.') => {
    const visibleDuration = 2200;

    setSaveModalMessage(message);
    setSaveModalMounted(true);
    setSaveModalVisible(false);

    if (saveModalFrameRef.current !== null) {
      window.cancelAnimationFrame(saveModalFrameRef.current);
    }

    if (saveModalTimeoutRef.current !== null) {
      window.clearTimeout(saveModalTimeoutRef.current);
    }

    saveModalFrameRef.current = window.requestAnimationFrame(() => {
      setSaveModalVisible(true);
      saveModalFrameRef.current = null;
    });

    saveModalTimeoutRef.current = window.setTimeout(() => {
      setSaveModalVisible(false);
      saveModalTimeoutRef.current = window.setTimeout(() => {
        setSaveModalMounted(false);
        saveModalTimeoutRef.current = null;
      }, 180);
    }, visibleDuration);
  };

  const confirmBusinessOptionDelete = async () => {
    if (!pendingOptionDelete) return;

    setIsOptionEditorSubmitting(true);

    try {
      await deleteBusinessOption(pendingOptionDelete.type, pendingOptionDelete.label);
      setBusinessOptions((current) =>
        current.filter((option) => !(option.type === pendingOptionDelete.type && option.label === pendingOptionDelete.label)),
      );
      showSaveModal('삭제되었습니다.');
      setPendingOptionDelete(null);
    } catch (error) {
      setLoadWarning(error instanceof Error ? error.message : '항목을 삭제하지 못했습니다.');
    } finally {
      setIsOptionEditorSubmitting(false);
    }
  };

  const openCreateDialog = () => {
    if (!isMaster) return;
    setDialogMode('create');
    setEditingBusinessId(null);
    setDraft(emptyDraft);
    setDraftErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (business: BusinessCardRow) => {
    if (!isMaster) return;
    setDialogMode('edit');
    setEditingBusinessId(business.id);
    setDraft({
      name: business.name,
      overview: business.overview,
      targetGroups: business.targetGroups.filter((item): item is BusinessTarget => BUSINESS_TARGET_OPTIONS.includes(item as BusinessTarget)),
      ministries: business.ministries,
      agencies: business.agencies,
      startDate: business.startDate ?? '',
      endDate: business.endDate ?? '',
      budget: business.budget ? formatCurrency(String(business.budget)) : '',
      teams: business.teamLabel === '미지정' ? [] : business.teamLabel.split(', ').filter(Boolean),
    });
    setDraftErrors({});
    setOpenMenuBusinessId(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBusinessId(null);
    setDraft(emptyDraft);
    setDraftErrors({});
    setIsSubmitting(false);
  };

  const updateDraftDates = (field: 'startDate' | 'endDate', nextValue: string) => {
    setDraft((current) => {
      const nextDraft = { ...current, [field]: nextValue };
      const parsedStartDate = nextDraft.startDate ? parseDateValue(nextDraft.startDate) : null;
      const parsedEndDate = nextDraft.endDate ? parseDateValue(nextDraft.endDate) : null;

      setDraftErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };

        if (nextDraft.startDate && !parsedStartDate) {
          nextErrors.startDate = '올바른 시작일을 선택해 주세요.';
        } else if (nextErrors.startDate === '올바른 시작일을 선택해 주세요.' || nextErrors.startDate === '시작일이 종료일보다 늦을 수 없습니다.') {
          delete nextErrors.startDate;
        }

        if (nextDraft.endDate && !parsedEndDate) {
          nextErrors.endDate = '올바른 종료일을 선택해 주세요.';
        } else if (nextErrors.endDate === '올바른 종료일을 선택해 주세요.' || nextErrors.endDate === '종료일은 시작일보다 빠를 수 없습니다.') {
          delete nextErrors.endDate;
        }

        if (parsedStartDate && parsedEndDate && parsedStartDate.getTime() > parsedEndDate.getTime()) {
          nextErrors.startDate = '시작일이 종료일보다 늦을 수 없습니다.';
          nextErrors.endDate = '종료일은 시작일보다 빠를 수 없습니다.';
        } else {
          if (nextErrors.startDate === '시작일이 종료일보다 늦을 수 없습니다.') {
            delete nextErrors.startDate;
          }
          if (nextErrors.endDate === '종료일은 시작일보다 빠를 수 없습니다.') {
            delete nextErrors.endDate;
          }
        }

        return nextErrors;
      });

      return nextDraft;
    });
  };

  const validateDraft = () => {
    const nextErrors: Partial<Record<keyof BusinessDraft, string>> = {};
    const parsedStartDate = draft.startDate ? parseDateValue(draft.startDate) : null;
    const parsedEndDate = draft.endDate ? parseDateValue(draft.endDate) : null;

    if (!draft.name.trim()) nextErrors.name = '사업명을 입력해 주세요.';
    if (!draft.overview.trim()) nextErrors.overview = '사업 개요를 입력해 주세요.';
    if (!draft.targetGroups.length) nextErrors.targetGroups = '교육 대상을 1개 이상 선택해 주세요.';
    if (!draft.ministries.length) nextErrors.ministry = '주무부처를 1개 이상 선택해 주세요.';
    if (!draft.agencies.length) nextErrors.agency = '전담기관을 1개 이상 선택해 주세요.';
    if (!draft.startDate) nextErrors.startDate = '시작일을 선택해 주세요.';
    if (!draft.endDate) nextErrors.endDate = '종료일을 선택해 주세요.';
    if (!draft.teams.length) nextErrors.team = '담당팀을 1개 이상 선택해 주세요.';

    if (draft.startDate && !parsedStartDate) {
      nextErrors.startDate = '올바른 시작일을 선택해 주세요.';
    }

    if (draft.endDate && !parsedEndDate) {
      nextErrors.endDate = '올바른 종료일을 선택해 주세요.';
    }

    const budgetDigits = draft.budget.replace(/[^\d]/g, '');
    if (!budgetDigits) {
      nextErrors.budget = '사업비를 입력해 주세요.';
    }

    if (
      parsedStartDate &&
      parsedEndDate &&
      parsedStartDate.getTime() > parsedEndDate.getTime()
    ) {
      nextErrors.startDate = '시작일이 종료일보다 늦을 수 없습니다.';
      nextErrors.endDate = '종료일은 시작일보다 빠를 수 없습니다.';
    }

    setDraftErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitDialog = async () => {
    if (!isMaster) return;
    if (!validateDraft()) return;

    setIsSubmitting(true);

    const managerIds = collectUnique(
      managerRecords
        .filter((manager) => draft.teams.includes(manager.organization ?? ''))
        .map((manager) => manager.id),
    );

    if (!managerIds.length) {
      setDraftErrors((current) => ({ ...current, team: '선택한 담당팀에 연결된 운영 계정을 찾지 못했습니다.' }));
      setIsSubmitting(false);
      return;
    }

    const payload = {
      brand: currentBrandValue,
      name: draft.name.trim(),
      overview: draft.overview.trim(),
      ministries: draft.ministries,
      agencies: draft.agencies,
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      budget: Number(draft.budget.replace(/[^\d]/g, '')) || null,
      managerIds,
      targetGroups: draft.targetGroups,
      authorId: currentUser?.id ?? null,
    };

    try {
      if (dialogMode === 'edit' && editingBusinessId) {
        const updated = await updateBusinessRecord(editingBusinessId, payload);
        setBusinesses((current) => current.map((business) => (business.id === editingBusinessId ? updated : business)));
      } else {
        const created = await createBusinessRecord(payload);
        setBusinesses((current) => [created, ...current]);
      }

      if (draft.startDate) {
        setSelectedYear(new Date(draft.startDate).getFullYear());
      }
      closeDialog();
    } catch (error) {
      setLoadWarning(
        error instanceof Error
          ? error.message
          : dialogMode === 'edit'
            ? '사업 정보를 수정하지 못했습니다.'
            : '사업을 등록하지 못했습니다.',
      );
      setIsSubmitting(false);
    }
  };

  const durationLabel = formatDurationSummary(draft.startDate, draft.endDate);

  const confirmDeleteBusiness = async () => {
    if (!deletingBusinessId) return;

    const previousBusinesses = businesses;
    setBusinesses((current) => current.filter((business) => business.id !== deletingBusinessId));

    try {
      await deleteBusinessRecord(deletingBusinessId);
      showSaveModal('삭제되었습니다.');
      setDeletingBusinessId(null);
      setOpenMenuBusinessId(null);
    } catch {
      setBusinesses(previousBusinesses);
      setLoadWarning('사업을 삭제하지 못했습니다.');
      setDeletingBusinessId(null);
    }
  };

  const openTagDialog = (businessId: string, nextTagged: boolean) => {
    setTagDialogBusinessId(businessId);
    setTagDialogMode(nextTagged ? 'add' : 'remove');
    setTagMemoDraft('');
  };

  const closeTagDialog = () => {
    setTagDialogBusinessId(null);
    setTagDialogMode(null);
    setTagMemoDraft('');
  };

  const confirmTagDialog = async () => {
    if (!tagDialogBusinessId || !tagDialogMode) return;

    const nextTagged = tagDialogMode === 'add';
    const nextMemo = tagMemoDraft.trim();
    const targetBusiness = businessRows.find((row) => row.id === tagDialogBusinessId);
    const previousTagState = tagStateByBusinessId;
    const nextTagState = { ...previousTagState, [tagDialogBusinessId]: nextTagged };
    const nextMemoRecord = nextTagged && nextMemo ? createBusinessMemoRecord(nextMemo, currentUser) : null;

    setTagStateByBusinessId(nextTagState);

    if (nextMemoRecord && targetBusiness) {
      const nextMemos = [nextMemoRecord, ...targetBusiness.memos];
      setBusinesses((current) =>
        current.map((business) =>
          business.id === tagDialogBusinessId
            ? {
                ...business,
                memos: nextMemos,
              }
            : business,
        ),
      );

      try {
        await persistBusinessMemos(tagDialogBusinessId, nextMemos);
      } catch {
        setBusinesses((current) =>
          current.map((business) =>
            business.id === tagDialogBusinessId
              ? {
                  ...business,
                  memos: targetBusiness.memos,
                }
              : business,
          ),
        );
        setLoadWarning('사업 메모를 저장하지 못했습니다.');
      }
    }

    closeTagDialog();
  };

  const openMemoPopover = (businessId: string) => {
    clearMemoHideTimer();
    setActiveMemoBusinessId((current) => (current === businessId ? null : businessId));
    setMemoDialogBusinessId(null);
    setMemoEditTargetId(null);
    setMemoDraft('');
    if (activeMemoBusinessId !== businessId) {
      window.requestAnimationFrame(() => updateMemoPopoverPosition(businessId));
    }
  };

  const closeMemoPopover = () => {
    clearMemoHideTimer();
    setActiveMemoBusinessId(null);
    setMemoEditTargetId(null);
    setMemoDraft('');
  };

  const scheduleMemoPopoverClose = () => {
    clearMemoHideTimer();
    memoHideTimerRef.current = window.setTimeout(() => {
      setActiveMemoBusinessId((current) => (current ? null : current));
    }, 140);
  };

  const openMemoDialog = (businessId: string, memo?: BusinessMemoRecord) => {
    setActiveMemoBusinessId(null);
    setMemoDialogBusinessId(businessId);
    setMemoEditTargetId(memo?.id ?? null);
    setMemoDraft(memo?.content ?? '');
  };

  const closeMemoDialog = () => {
    setMemoDialogBusinessId(null);
    setMemoEditTargetId(null);
    setMemoDraft('');
  };

  const saveMemo = async (businessId: string) => {
    const nextMemoText = memoDraft.trim();
    if (!nextMemoText) return;

    const currentBusiness = businessRows.find((row) => row.id === businessId);
    if (!currentBusiness) return;

    const currentMemos = currentBusiness.memos;
    const nextMemos = memoEditTargetId
      ? currentMemos.map((memo) => (memo.id === memoEditTargetId ? { ...memo, content: nextMemoText } : memo))
      : [createBusinessMemoRecord(nextMemoText, currentUser), ...currentMemos];

    const previousBusinesses = businesses;
    setBusinesses((current) =>
      current.map((business) =>
        business.id === businessId
          ? {
              ...business,
              memos: nextMemos,
            }
          : business,
      ),
    );

    try {
      await persistBusinessMemos(businessId, nextMemos);
      closeMemoDialog();
    } catch {
      setBusinesses(previousBusinesses);
      setLoadWarning('사업 메모를 저장하지 못했습니다.');
    }
  };

  const deleteMemo = async (businessId: string, memoId: string) => {
    const currentBusiness = businessRows.find((row) => row.id === businessId);
    if (!currentBusiness) return;

    const nextMemos = currentBusiness.memos.filter((memo) => memo.id !== memoId);
    const previousBusinesses = businesses;
    setBusinesses((current) =>
      current.map((business) =>
        business.id === businessId
          ? {
              ...business,
              memos: nextMemos,
            }
          : business,
      ),
    );

    try {
      await persistBusinessMemos(businessId, nextMemos);
      if (memoEditTargetId === memoId) {
        setMemoEditTargetId(null);
        setMemoDraft('');
      }
    } catch {
      setBusinesses(previousBusinesses);
      setLoadWarning('사업 메모를 삭제하지 못했습니다.');
    }
  };

  return (
    <section className="business-page" aria-label="사업 관리">
      <div className="business-page__hero">
        <div className="business-page__hero-top business-page__hero-top--compact">
          <div className="business-page__hero-copy">
            <h1 className="business-page__title">사업 관리</h1>
          </div>

          <div className="business-page__hero-actions">
            {isMaster ? (
              <button type="button" className="business-page__option-button" onClick={() => setIsOptionEditorOpen(true)}>
                주무부처/전담기관 편집
              </button>
            ) : null}
            {isMaster ? (
              <button type="button" className="business-page__register-button" onClick={openCreateDialog}>
                사업 등록
              </button>
            ) : null}
          </div>
        </div>

        <div className="business-page__year-bar" aria-label="사업 연도 이동">
          <button type="button" className="business-page__year-button" onClick={() => setSelectedYear((current) => current - 1)} aria-label="이전 연도">
            ‹
          </button>
          <strong className="business-page__year-label">{selectedYear}년</strong>
          <button type="button" className="business-page__year-button" onClick={() => setSelectedYear((current) => current + 1)} aria-label="다음 연도">
            ›
          </button>
        </div>

        <div className="business-page__filter-panel">
          <label className="business-page__search-chip" aria-label="사업 검색">
            <img src="/assets/search.svg" alt="" aria-hidden="true" className="business-page__search-chip-icon" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="사업명 또는 교육과정명 검색"
            />
          </label>

          <FilterChipSelect
            label="주무부처"
            value={filters.ministry}
            options={ministryOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('ministry', nextValue)}
          />

          <FilterChipSelect
            label="전담기관"
            value={filters.agency}
            options={agencyOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('agency', nextValue)}
          />

          <FilterChipSelect
            label="교육대상"
            value={filters.target}
            options={['전체', ...BUSINESS_TARGET_OPTIONS].map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('target', nextValue)}
          />

          <FilterChipSelect
            label="담당팀"
            value={filters.team}
            options={teamOptions.map((option) => ({ label: option, value: option }))}
            onChange={(nextValue) => updateFilter('team', nextValue)}
          />
        </div>
      </div>

      {loadWarning ? <div className="business-page__alert">{loadWarning}</div> : null}
      {loadError ? <div className="business-page__alert business-page__alert--error">{loadError}</div> : null}

      <div className="business-page__results-head">
        <strong>전체 {visibleBusinesses.length}개</strong>
      </div>

      {isLoading ? (
        <div className="business-page__empty">사업 데이터를 불러오는 중입니다.</div>
      ) : visibleBusinesses.length ? (
        <div className="business-page__card-grid business-page__card-grid--businesses">
          {visibleBusinesses.map((business) => {
            const isMemoOpen = activeMemoBusinessId === business.id;

            return (
              <article key={business.id} className="business-card">
                <div className="business-card__head">
                  <div className="business-card__title-wrap">
                    <h2 className="business-card__title">{business.name}</h2>
                    <p className="business-card__overview">{business.overview || '사업 개요가 없습니다.'}</p>
                  </div>

                  <div
                    ref={(node) => {
                      menuWrapRefs.current[business.id] = node;
                    }}
                    className={`company-card__menu-wrap ${openMenuBusinessId === business.id ? 'company-card__menu-wrap--open' : ''}`}
                  >
                    <button
                      type="button"
                      className="company-card__menu-button"
                      aria-label={`${business.name} 더보기`}
                      aria-haspopup="menu"
                      aria-expanded={openMenuBusinessId === business.id}
                      onClick={() => setOpenMenuBusinessId((current) => (current === business.id ? null : business.id))}
                    >
                      <span className="company-card__menu-icon" aria-hidden="true">
                        ⋯
                      </span>
                    </button>

                    <div className="company-card__menu" role="menu" aria-label={`${business.name} 메뉴`}>
                      {isMaster ? (
                        <>
                          <button type="button" className="company-card__menu-item" role="menuitem" onClick={() => openEditDialog(business)}>
                            사업 정보 편집
                          </button>
                          <button
                            type="button"
                            className="company-card__menu-item company-card__menu-item--danger"
                            role="menuitem"
                            onClick={() => {
                              setDeletingBusinessId(business.id);
                              setOpenMenuBusinessId(null);
                            }}
                          >
                            삭제
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="business-card__meta-grid">
                  <div className="business-card__meta-item">
                    <span>교육 대상</span>
                    <strong>{business.targetGroups.length ? business.targetGroups.join(', ') : '미지정'}</strong>
                  </div>
                  <div className="business-card__meta-item">
                    <span>주무부처</span>
                    <strong>{business.ministries.join(', ') || '미지정'}</strong>
                  </div>
                  <div className="business-card__meta-item">
                    <span>전담기관</span>
                    <strong>{business.agencies.join(', ') || '미지정'}</strong>
                  </div>
                  <div className="business-card__meta-item">
                    <span>사업 기간</span>
                    <strong>{formatPeriod(business.startDate, business.endDate)}</strong>
                  </div>
                  <div className="business-card__meta-item">
                    <span>사업비</span>
                    <strong>{formatBudgetLabel(business.budget)}</strong>
                  </div>
                  <div className="business-card__meta-item">
                    <span>담당팀</span>
                    <strong>{business.teamLabel}</strong>
                  </div>
                </div>

                <div className="business-card__courses">
                  <div className="business-card__section-head">
                    <strong>교육과정</strong>
                    <span>{business.courses.length}개</span>
                  </div>
                  {business.courses.length ? (
                    <div className="business-card__course-list">
                      {business.courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="business-card__course-item">
                          <strong>{course.name}</strong>
                          <span>
                            {[course.targetGroup, course.status, course.period].filter(Boolean).join(' · ') || '상세 정보 없음'}
                          </span>
                        </div>
                      ))}
                      {business.courses.length > 3 ? <div className="business-card__course-more">+{business.courses.length - 3}개 과정 더 있음</div> : null}
                    </div>
                  ) : (
                    <div className="business-card__empty-text">등록된 교육과정이 없습니다.</div>
                  )}
                </div>

                <div className="business-card__footer">
                  <div className="company-card__meta-right">
                    <TagToggleAction
                      isTagged={business.isTagged}
                      dotMode="decorative"
                      dotClassName="company-card__reply-tag-dot"
                      dotActiveClassName="company-card__reply-tag-dot--active"
                      markClassName="company-card__tag-dot-mark"
                      labelClassName="company-card__tag-action"
                      labelActiveClassName="company-card__tag-action--active"
                      ariaLabel={`${business.name} ${business.isTagged ? '태그 해제' : '태그 추가'}`}
                      onClick={() => openTagDialog(business.id, !business.isTagged)}
                    />

                    <div
                      ref={(node) => {
                        memoActionRefs.current[business.id] = node;
                      }}
                      className={`company-card__reply-wrap ${isMemoOpen ? 'company-card__reply-wrap--open' : ''}`}
                      onMouseEnter={() => {
                        clearMemoHideTimer();
                        setActiveMemoBusinessId(business.id);
                        window.requestAnimationFrame(() => updateMemoPopoverPosition(business.id));
                      }}
                      onMouseLeave={scheduleMemoPopoverClose}
                    >
                      <button
                        type="button"
                        className="company-card__reply-count"
                        aria-label={`${business.name} 메모 ${business.memos.length}개 보기`}
                        aria-expanded={isMemoOpen}
                        onClick={() => openMemoPopover(business.id)}
                      >
                        <img src="/assets/chat.svg" alt="" aria-hidden="true" className="company-card__reply-icon" />
                        <span>{business.memos.length}</span>
                      </button>

                      {isMemoOpen && memoPopoverPosition
                        ? createPortal(
                            <div
                              className="company-card__reply-popover company-card__reply-popover--floating"
                              role="tooltip"
                              style={
                                {
                                  position: 'fixed',
                                  left: `${memoPopoverPosition.left}px`,
                                  top: `${memoPopoverPosition.top}px`,
                                  maxHeight: `${memoPopoverPosition.maxHeight}px`,
                                  opacity: 1,
                                  transform: 'none',
                                  pointerEvents: 'auto',
                                } as CSSProperties
                              }
                              onMouseEnter={clearMemoHideTimer}
                              onMouseLeave={scheduleMemoPopoverClose}
                            >
                              <div className="company-card__reply-popover-head">
                                <div className="company-card__reply-popover-title">메모</div>
                                <button type="button" className="company-card__reply-add" onClick={() => openMemoDialog(business.id)}>
                                  메모 추가
                                </button>
                              </div>
                              {business.memos.length ? (
                                <div className="company-card__reply-popover-list">
                                  {business.memos.map((memo) => {
                                    const isMine = memo.authorId === currentUser?.id;
                                    return (
                                      <div key={memo.id} className="company-card__reply-popover-item">
                                        <div className="company-card__reply-popover-meta">
                                          <span>{memo.authorName || '운영자'}</span>
                                          <span>{formatMemoDateLabel(memo.createdAt)}</span>
                                        </div>
                                        <p>{memo.content}</p>
                                        {isMine ? (
                                          <div className="company-card__reply-popover-actions">
                                            <button type="button" onClick={() => openMemoDialog(business.id, memo)}>
                                              수정
                                            </button>
                                            <button type="button" onClick={() => void deleteMemo(business.id, memo.id)}>
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
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="business-page__empty">선택한 조건에 맞는 사업이 없습니다.</div>
      )}

      {isDialogOpen ? (
        <div
          className="business-register-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div className="business-register-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="business-register-dialog-title">
            <div className="business-register-dialog__header">
              <div>
                <div className="business-register-dialog__eyebrow">{dialogMode === 'edit' ? '사업 정보 편집' : '사업 등록'}</div>
                <h2 id="business-register-dialog-title" className="business-register-dialog__title">
                  {dialogMode === 'edit' ? '사업 정보를 수정합니다' : '신규 사업을 등록합니다'}
                </h2>
              </div>
              <button type="button" className="business-register-dialog__close" aria-label="사업 등록 닫기" onClick={closeDialog}>
                ×
              </button>
            </div>

            <div className="business-register-dialog__body">
              <label className="business-register-dialog__field">
                <span className="business-register-dialog__label">사업명</span>
                <input
                  type="text"
                  value={draft.name}
                  aria-invalid={Boolean(draftErrors.name)}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="사업명을 입력해 주세요"
                />
                {draftErrors.name ? <div className="business-register-dialog__error">{draftErrors.name}</div> : null}
              </label>

              <label className="business-register-dialog__field">
                <span className="business-register-dialog__label">브랜드</span>
                <input type="text" value={currentBrandLabel} readOnly />
              </label>

              <label className="business-register-dialog__field business-register-dialog__field--wide">
                <span className="business-register-dialog__label">사업 개요</span>
                <textarea
                  value={draft.overview}
                  aria-invalid={Boolean(draftErrors.overview)}
                  onChange={(event) => setDraft((current) => ({ ...current, overview: event.target.value.slice(0, 200) }))}
                  placeholder="최대 200자까지 입력할 수 있습니다"
                />
                <div className="business-register-dialog__counter">{draft.overview.length}/200</div>
                {draftErrors.overview ? <div className="business-register-dialog__error">{draftErrors.overview}</div> : null}
              </label>

              <fieldset className="business-register-dialog__field business-register-dialog__field--wide">
                <legend className="business-register-dialog__label">교육 대상</legend>
                <div className="business-register-dialog__toggle-group">
                  {BUSINESS_TARGET_OPTIONS.map((target) => {
                    const isActive = draft.targetGroups.includes(target);
                    return (
                      <button
                        key={target}
                        type="button"
                        className={`business-register-dialog__toggle ${isActive ? 'business-register-dialog__toggle--active' : ''}`}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            targetGroups: current.targetGroups.includes(target)
                              ? current.targetGroups.filter((item) => item !== target)
                              : [...current.targetGroups, target],
                          }))
                        }
                      >
                        {target}
                      </button>
                    );
                  })}
                </div>
                {draftErrors.targetGroups ? <div className="business-register-dialog__error">{draftErrors.targetGroups}</div> : null}
              </fieldset>

              <label className="business-register-dialog__field">
                <span className="business-register-dialog__label">주무부처</span>
                <MultiDropdownSelect
                  label="주무부처"
                  values={draft.ministries}
                  placeholder="주무부처 선택"
                  options={ministryOptions.filter((option) => option !== '전체').map((option) => ({ label: option, value: option }))}
                  onChange={(nextValues) => setDraft((current) => ({ ...current, ministries: nextValues }))}
                  ariaInvalid={Boolean(draftErrors.ministry)}
                />
                {draftErrors.ministry ? <div className="business-register-dialog__error">{draftErrors.ministry}</div> : null}
              </label>

              <label className="business-register-dialog__field">
                <span className="business-register-dialog__label">전담기관</span>
                <MultiDropdownSelect
                  label="전담기관"
                  values={draft.agencies}
                  placeholder="전담기관 선택"
                  options={agencyOptions.filter((option) => option !== '전체').map((option) => ({ label: option, value: option }))}
                  onChange={(nextValues) => setDraft((current) => ({ ...current, agencies: nextValues }))}
                  ariaInvalid={Boolean(draftErrors.agency)}
                />
                {draftErrors.agency ? <div className="business-register-dialog__error">{draftErrors.agency}</div> : null}
              </label>

              <label className="business-register-dialog__field">
                <span className="business-register-dialog__label">시작일</span>
                <DateField
                  label="시작일"
                  value={draft.startDate}
                  ariaInvalid={Boolean(draftErrors.startDate)}
                  onChange={(nextValue) => updateDraftDates('startDate', nextValue)}
                />
                {draftErrors.startDate ? <div className="business-register-dialog__error">{draftErrors.startDate}</div> : null}
              </label>

              <label className="business-register-dialog__field">
                <span className="business-register-dialog__label">종료일</span>
                <DateField
                  label="종료일"
                  value={draft.endDate}
                  ariaInvalid={Boolean(draftErrors.endDate)}
                  onChange={(nextValue) => updateDraftDates('endDate', nextValue)}
                />
                {draftErrors.endDate ? <div className="business-register-dialog__error">{draftErrors.endDate}</div> : null}
              </label>

              <div className="business-register-dialog__field business-register-dialog__field--wide business-register-dialog__field--summary" aria-live="polite">
                <span className="business-register-dialog__label">기간</span>
                <div className={`business-register-dialog__summary-value${durationLabel ? '' : ' business-register-dialog__summary-value--placeholder'}`}>
                  {durationLabel ?? '시작일과 종료일을 선택하면 자동 계산됩니다.'}
                </div>
              </div>

              <label className="business-register-dialog__field">
                <span className="business-register-dialog__label">사업비</span>
                <div className="business-register-dialog__input-affix">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.budget}
                    aria-invalid={Boolean(draftErrors.budget)}
                    onChange={(event) => setDraft((current) => ({ ...current, budget: formatCurrency(event.target.value) }))}
                    placeholder="0"
                  />
                  <span className="business-register-dialog__input-suffix" aria-hidden="true">
                    원
                  </span>
                </div>
                {draftErrors.budget ? <div className="business-register-dialog__error">{draftErrors.budget}</div> : null}
              </label>

              <label className="business-register-dialog__field">
                <span className="business-register-dialog__label">담당팀</span>
                <MultiDropdownSelect
                  label="담당팀"
                  values={draft.teams}
                  placeholder="담당팀 선택"
                  options={teamSelectOptions}
                  onChange={(nextValues) => setDraft((current) => ({ ...current, teams: nextValues }))}
                  ariaInvalid={Boolean(draftErrors.team)}
                />
                {draftErrors.team ? <div className="business-register-dialog__error">{draftErrors.team}</div> : null}
              </label>
            </div>

            <div className="business-register-dialog__footer">
              <button type="button" className="business-register-dialog__button business-register-dialog__button--secondary" onClick={closeDialog}>
                취소
              </button>
              <button
                type="button"
                className="business-register-dialog__button business-register-dialog__button--primary"
                onClick={() => void submitDialog()}
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : dialogMode === 'edit' ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMaster && isOptionEditorOpen ? (
        <div
          className="business-register-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOptionEditorOpen(false);
            }
          }}
        >
          <div className="business-register-dialog__panel business-register-dialog__panel--options" role="dialog" aria-modal="true" aria-labelledby="business-option-dialog-title">
            <div className="business-register-dialog__header">
              <div>
                <div className="business-register-dialog__eyebrow">옵션 편집</div>
                <h2 id="business-option-dialog-title" className="business-register-dialog__title">
                  주무부처 / 전담기관 편집
                </h2>
              </div>
              <button type="button" className="business-register-dialog__close" aria-label="옵션 편집 닫기" onClick={() => setIsOptionEditorOpen(false)}>
                ×
              </button>
            </div>

            <div className="business-register-dialog__body business-register-dialog__body--options">
              <ManagedOptionColumn
                title="주무부처"
                items={ministryOptions.filter((option) => option !== '전체')}
                placeholder="주무부처 추가"
                onAdd={async (value) => {
                  setIsOptionEditorSubmitting(true);
                  try {
                    const created = await createBusinessOption('ministry', value, businessOptions.filter((option) => option.type === 'ministry').length);
                    setBusinessOptions((current) => [...current, created]);
                    showSaveModal('추가 및 저장되었습니다.');
                    return true;
                  } catch (error) {
                    setLoadWarning(error instanceof Error ? error.message : '주무부처를 저장하지 못했습니다.');
                    return false;
                  } finally {
                    setIsOptionEditorSubmitting(false);
                  }
                }}
                onRemove={async (value) => {
                  const isInUse = businesses.some((business) => normalizeStringArray(business.ministries).includes(value));
                  if (isInUse) {
                    setLoadWarning('등록된 사업에서 사용 중인 주무부처는 삭제할 수 없습니다.');
                    return;
                  }
                  setPendingOptionDelete({ type: 'ministry', label: value });
                }}
              />

              <ManagedOptionColumn
                title="전담기관"
                items={agencyOptions.filter((option) => option !== '전체')}
                placeholder="전담기관 추가"
                onAdd={async (value) => {
                  setIsOptionEditorSubmitting(true);
                  try {
                    const created = await createBusinessOption('agency', value, businessOptions.filter((option) => option.type === 'agency').length);
                    setBusinessOptions((current) => [...current, created]);
                    showSaveModal('추가 및 저장되었습니다.');
                    return true;
                  } catch (error) {
                    setLoadWarning(error instanceof Error ? error.message : '전담기관을 저장하지 못했습니다.');
                    return false;
                  } finally {
                    setIsOptionEditorSubmitting(false);
                  }
                }}
                onRemove={async (value) => {
                  const isInUse = businesses.some((business) => normalizeStringArray(business.agencies).includes(value));
                  if (isInUse) {
                    setLoadWarning('등록된 사업에서 사용 중인 전담기관은 삭제할 수 없습니다.');
                    return;
                  }
                  setPendingOptionDelete({ type: 'agency', label: value });
                }}
              />
            </div>

            <div className="business-register-dialog__footer">
              <button
                type="button"
                className="business-register-dialog__button business-register-dialog__button--secondary"
                onClick={() => setIsOptionEditorOpen(false)}
                disabled={isOptionEditorSubmitting}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingBusinessId ? (
        <TagDialog
          titleId="business-delete-dialog-title"
          eyebrow="사업 삭제"
          title="사업을 삭제하시겠습니까?"
          description="삭제한 사업 정보는 되돌릴 수 없습니다."
          isRemoval
          showField={false}
          value=""
          confirmLabel="확인"
          onChange={() => undefined}
          onClose={() => setDeletingBusinessId(null)}
          onConfirm={() => void confirmDeleteBusiness()}
        />
      ) : null}

      {pendingOptionDelete ? (
        <TagDialog
          titleId="business-option-delete-dialog-title"
          eyebrow={pendingOptionDelete.type === 'ministry' ? '주무부처 삭제' : '전담기관 삭제'}
          title={`${pendingOptionDelete.type === 'ministry' ? '주무부처' : '전담기관'}를 삭제하시겠습니까?`}
          description={`"${pendingOptionDelete.label}" 항목을 삭제합니다.`}
          isRemoval
          showField={false}
          value=""
          confirmLabel="확인"
          onChange={() => undefined}
          onClose={() => setPendingOptionDelete(null)}
          onConfirm={() => void confirmBusinessOptionDelete()}
        />
      ) : null}

      {tagDialogBusinessId && tagDialogMode ? (
        <TagDialog
          titleId="business-tag-dialog-title"
          eyebrow={tagDialogMode === 'remove' ? '태그 해제' : '태그 추가'}
          title={tagDialogMode === 'remove' ? '태그를 해제하시겠습니까?' : '태그를 설정하시겠습니까?'}
          description={
            tagDialogMode === 'remove'
              ? '태그를 해제하면 점 표시만 회색으로 돌아갑니다.'
              : '메모는 선택 사항입니다. 필요하면 태그와 함께 참고 메모를 남겨두세요.'
          }
          isRemoval={tagDialogMode === 'remove'}
          showField={tagDialogMode === 'add'}
          value={tagMemoDraft}
          label="메모"
          placeholder="예: 이번 분기 우선 연락"
          confirmLabel={tagDialogMode === 'remove' ? '확인' : '저장'}
          onChange={setTagMemoDraft}
          onClose={closeTagDialog}
          onConfirm={() => void confirmTagDialog()}
        />
      ) : null}

      {memoDialogBusinessId ? (
        <TagDialog
          titleId="business-memo-dialog-title"
          eyebrow={memoEditTargetId ? '메모 수정' : '메모 추가'}
          title={memoEditTargetId ? '메모를 수정하시겠습니까?' : '메모를 작성하시겠습니까?'}
          description={memoEditTargetId ? '수정한 메모는 기존 메모를 덮어씁니다.' : '메모를 남기면 툴팁에서 다시 확인할 수 있습니다.'}
          value={memoDraft}
          label="메모"
          placeholder="예: 이번 분기 우선 연락"
          confirmLabel={memoEditTargetId ? '수정' : '저장'}
          onChange={setMemoDraft}
          onClose={closeMemoDialog}
          onConfirm={() => void saveMemo(memoDialogBusinessId)}
        />
      ) : null}

      {saveModalMounted ? (
        <div className={`copy-toast save-modal ${saveModalVisible ? 'copy-toast--visible' : 'copy-toast--hidden'}`} role="status" aria-live="polite">
          {saveModalMessage}
        </div>
      ) : null}
    </section>
  );
}

function loadStoredTagState() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.sessionStorage.getItem(BUSINESS_TAG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistTagState(value: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(BUSINESS_TAG_STORAGE_KEY, JSON.stringify(value));
}

function loadStoredCourses() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.sessionStorage.getItem(BUSINESS_COURSE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, BusinessCardCourse[]>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function collectUnique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'ko'));
}

function collectUniqueOptions(options: BusinessOptionRecord[], type: string) {
  return collectUnique(options.filter((option) => option.type === type).map((option) => option.label));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function normalizeBudget(value: BusinessRecord['budget']) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const digits = Number(value.replace(/[^\d]/g, ''));
    return Number.isFinite(digits) ? digits : null;
  }
  return null;
}

function matchesBusinessYear(business: Pick<BusinessCardRow, 'startDate' | 'endDate' | 'createdAt'>, year: number) {
  if (business.startDate && business.endDate) {
    const startYear = new Date(business.startDate).getFullYear();
    const endYear = new Date(business.endDate).getFullYear();
    return year >= startYear && year <= endYear;
  }

  if (business.startDate) {
    return new Date(business.startDate).getFullYear() === year;
  }

  if (business.createdAt) {
    return new Date(business.createdAt).getFullYear() === year;
  }

  return false;
}

function formatCurrency(value: string) {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
}

function formatPeriod(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return '미지정';
  if (!startDate) return `~ ${formatDateLabel(endDate)}`;
  if (!endDate) return `${formatDateLabel(startDate)} ~`;
  return `${formatDateLabel(startDate)} ~ ${formatDateLabel(endDate)}`;
}

function formatDurationSummary(startDate: string, endDate: string) {
  const start = parseDateValue(startDate);
  const end = parseDateValue(endDate);

  if (!start || !end) return null;
  if (start.getTime() > end.getTime()) return null;

  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  let years = normalizedEnd.getFullYear() - normalizedStart.getFullYear();
  let months = normalizedEnd.getMonth() - normalizedStart.getMonth();
  let days = normalizedEnd.getDate() - normalizedStart.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonthDays = new Date(normalizedEnd.getFullYear(), normalizedEnd.getMonth(), 0).getDate();
    days += previousMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}년`);
  if (months > 0) parts.push(`${months}개월`);
  if (days > 0) parts.push(`${days}일`);

  return parts.length ? parts.join(' ') : '0일';
}

function formatDateLabel(value: string | null) {
  if (!value) return '';
  return value.replace(/-/g, '.');
}

function formatBudgetLabel(value: number | null) {
  if (!value) return '미지정';
  return `${value.toLocaleString('ko-KR')}원`;
}

function parseBusinessMemos(value: unknown, brand: string | null): BusinessMemoRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const record = item as Record<string, unknown>;
      const content = typeof record.content === 'string' ? record.content.trim() : '';
      if (!content) return null;

      return {
        id: typeof record.id === 'string' && record.id.trim() ? record.id : `business-memo-${Date.now()}`,
        brand: typeof record.brand === 'string' ? record.brand : brand,
        content,
        authorId: typeof record.authorId === 'string' ? record.authorId : '',
        authorOrg: typeof record.authorOrg === 'string' ? record.authorOrg : '',
        createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
        authorName: typeof record.authorName === 'string' ? record.authorName : '운영자',
      } satisfies BusinessMemoRecord;
    })
    .filter((item): item is BusinessMemoRecord => Boolean(item))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function createBusinessMemoRecord(nextMemo: string, currentUser: BusinessManagementPageProps['currentUser']): BusinessMemoRecord {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `business-memo-${Date.now()}`,
    brand: currentUser?.brand ?? null,
    content: nextMemo,
    authorId: currentUser?.id ?? '',
    authorOrg: currentUser?.organization ?? '',
    createdAt: new Date().toISOString(),
    authorName: currentUser?.name ?? '운영자',
  };
}

function formatMemoDateLabel(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function buildBusinessSearchText(business: BusinessCardRow) {
  return [
    business.name,
    business.overview,
    business.ministries.join(' '),
    business.agencies.join(' '),
    business.targetGroups.join(' '),
    business.teamLabel,
    business.managerLabel,
    business.courses
      .map((course) => [course.name, course.targetGroup, course.status, course.period].filter(Boolean).join(' '))
      .join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

function MultiDropdownSelect({
  label,
  values,
  placeholder,
  options,
  onChange,
  ariaInvalid = false,
}: {
  label: string;
  values: string[];
  placeholder: string;
  options: Array<{ label: string; value: string }>;
  onChange: (nextValues: string[]) => void;
  ariaInvalid?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (!root || !menu) return;

      const rootRect = root.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const menuWidth = Math.min(Math.max(rootRect.width, 220), 420, window.innerWidth - 32);
      const menuHeight = Math.min(Math.max(menuRect.height || 0, 0), 360);

      let left = rootRect.left;
      left = Math.min(left, window.innerWidth - menuWidth - 16);
      left = Math.max(left, 16);

      let top = rootRect.bottom + 6;
      const preferredBottom = top + menuHeight;
      if (preferredBottom > window.innerHeight - 16) {
        const aboveTop = rootRect.top - 6 - menuHeight;
        top = aboveTop >= 16 ? aboveTop : Math.max(16, window.innerHeight - menuHeight - 16);
      }

      const maxHeight = Math.max(120, window.innerHeight - top - 16);
      setMenuPosition({ left, top, width: menuWidth, maxHeight });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, options.length, values, query]);

  const filteredOptions = options.filter((option) => !query.trim() || option.label.toLowerCase().includes(query.trim().toLowerCase()));
  const displayLabel = values.length ? `${values[0]}${values.length > 1 ? ` 외 ${values.length - 1}` : ''}` : placeholder;

  const toggleValue = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          className="filter-dropdown__menu filter-dropdown__menu--insured dropdown-select__menu dropdown-select__menu--floating company-register-dialog__picker-menu"
          role="menu"
          aria-label={`${label} 메뉴`}
          style={
            menuPosition
              ? {
                  position: 'fixed',
                  left: `${menuPosition.left}px`,
                  top: `${menuPosition.top}px`,
                  width: `${menuPosition.width}px`,
                  maxHeight: `${menuPosition.maxHeight}px`,
                  opacity: 1,
                  transform: 'none',
                  pointerEvents: 'auto',
                }
              : {
                  position: 'fixed',
                  left: '-9999px',
                  top: '-9999px',
                  opacity: 0,
                  pointerEvents: 'none',
                }
          }
        >
          <label className="company-register-dialog__picker-search">
            <img src="/assets/search.svg" alt="" aria-hidden="true" className="search-icon" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${label} 검색`} />
          </label>
          <div className="company-register-dialog__picker-list">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`company-register-dialog__picker-option ${isSelected ? 'is-selected' : ''}`}
                    role="menuitemcheckbox"
                    aria-checked={isSelected}
                    onClick={() => toggleValue(option.value)}
                  >
                    <span className="company-register-dialog__picker-checkbox" aria-hidden="true" />
                    <span>{option.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="company-register-dialog__picker-empty">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className={`filter-dropdown company-register-dialog__picker ${isOpen ? 'filter-dropdown--open is-open' : ''}`}>
      <button
        type="button"
        className="company-register-dialog__picker-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-invalid={ariaInvalid}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{displayLabel}</span>
        <img src="/assets/arrow-down.svg" alt="" aria-hidden="true" className="toggle-arrow-icon" />
      </button>
      {menu}
      {values.length ? (
        <div className="company-register-dialog__selected-list">
          {values.map((item) => (
            <button key={item} type="button" className="company-register-dialog__selected-chip" onClick={() => toggleValue(item)}>
              {item}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  ariaInvalid = false,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  ariaInvalid?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDateValue(value) ?? new Date());

  useEffect(() => {
    if (!value) return;
    const parsed = parseDateValue(value);
    if (parsed) {
      setViewDate(parsed);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const selectedDate = parseDateValue(value);

  const panel = isOpen
    ? createPortal(
        <div
          ref={panelRef}
          className="business-date-picker"
          role="dialog"
          aria-modal="false"
          aria-label={`${label} 달력`}
          style={getDatePickerStyle(rootRef.current)}
        >
          <div className="business-date-picker__header">
            <button
              type="button"
              className="business-date-picker__nav"
              aria-label="이전 달"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <strong className="business-date-picker__title">{formatMonthTitle(viewDate)}</strong>
            <button
              type="button"
              className="business-date-picker__nav"
              aria-label="다음 달"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>

          <div className="business-date-picker__weekdays" aria-hidden="true">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="business-date-picker__grid">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} className="business-date-picker__day business-date-picker__day--empty" aria-hidden="true" />;
              }

              const isSelected = Boolean(selectedDate && isSameDate(selectedDate, day));
              const isToday = isSameDate(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`business-date-picker__day${isSelected ? ' business-date-picker__day--selected' : ''}${isToday ? ' business-date-picker__day--today' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(formatDateValue(day));
                    setIsOpen(false);
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="business-date-picker__footer">
            <button
              type="button"
              className="business-date-picker__action"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              초기화
            </button>
            <button
              type="button"
              className="business-date-picker__action business-date-picker__action--primary"
              onClick={() => {
                const today = new Date();
                onChange(formatDateValue(today));
                setViewDate(today);
                setIsOpen(false);
              }}
            >
              오늘
            </button>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className="business-date-field">
      <button
        type="button"
        className={`business-date-field__trigger${ariaInvalid ? ' business-date-field__trigger--error' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-invalid={ariaInvalid}
        onClick={() => {
          if (value) {
            const parsed = parseDateValue(value);
            if (parsed) {
              setViewDate(parsed);
            }
          }
          setIsOpen((current) => !current);
        }}
      >
        <span className={`business-date-field__value${value ? '' : ' business-date-field__value--placeholder'}`}>
          {value ? formatDateLabel(value) : `${label} 선택`}
        </span>
        <CalendarIcon />
      </button>
      {panel}
    </div>
  );
}

function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function parseDateValue(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isSameDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function getDatePickerStyle(root: HTMLDivElement | null): CSSProperties {
  if (!root) {
    return {
      position: 'fixed',
      left: '-9999px',
      top: '-9999px',
      opacity: 0,
      pointerEvents: 'none',
    };
  }

  const rect = root.getBoundingClientRect();
  const width = Math.min(DATE_PICKER_WIDTH, window.innerWidth - DATE_PICKER_EDGE_PADDING * 2);
  let left = rect.left;
  left = Math.min(left, window.innerWidth - width - DATE_PICKER_EDGE_PADDING);
  left = Math.max(left, DATE_PICKER_EDGE_PADDING);

  let top = rect.bottom + DATE_PICKER_GAP;
  const preferredBottom = top + 320;
  if (preferredBottom > window.innerHeight - DATE_PICKER_EDGE_PADDING) {
    const aboveTop = rect.top - DATE_PICKER_GAP - 320;
    top = aboveTop >= DATE_PICKER_EDGE_PADDING ? aboveTop : Math.max(DATE_PICKER_EDGE_PADDING, window.innerHeight - 320 - DATE_PICKER_EDGE_PADDING);
  }

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    zIndex: 'var(--z-overlay-top)',
  };
}

function CalendarIcon() {
  return (
    <svg className="business-date-field__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.5 2.75V4.25M14.5 2.75V4.25M3.25 6.25H16.75M4.5 4.25H15.5C16.1904 4.25 16.75 4.80964 16.75 5.5V15.5C16.75 16.1904 16.1904 16.75 15.5 16.75H4.5C3.80964 16.75 3.25 16.1904 3.25 15.5V5.5C3.25 4.80964 3.80964 4.25 4.5 4.25Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ManagedOptionColumn({
  title,
  items,
  placeholder,
  onAdd,
  onRemove,
}: {
  title: string;
  items: string[];
  placeholder: string;
  onAdd: (value: string) => Promise<boolean> | boolean;
  onRemove: (value: string) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const submitDraft = async () => {
    const nextValue = draft.trim();
    if (!nextValue || isAdding) return;

    const isDuplicate = items.some((item) => item.trim().toLowerCase() === nextValue.toLowerCase());
    if (isDuplicate) {
      setErrorMessage('이미 등록된 항목입니다.');
      return;
    }

    setIsAdding(true);
    setErrorMessage(null);

    try {
      const created = await onAdd(nextValue);
      if (created) {
        setDraft('');
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage('항목을 추가하지 못했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section className="business-option-column" aria-label={title}>
      <div className="business-option-column__head">
        <h3 className="business-option-column__title">{title}</h3>
        <span className="business-option-column__count">{items.length}</span>
      </div>

      <div className="business-option-column__composer">
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          aria-invalid={Boolean(errorMessage)}
          onChange={(event) => {
            setDraft(event.target.value);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submitDraft();
            }
          }}
        />
        <button
          type="button"
          className="business-option-column__add"
          onClick={() => {
            void submitDraft();
          }}
          disabled={isAdding}
        >
          {isAdding ? '추가 중...' : '추가'}
        </button>
      </div>

      {errorMessage ? <div className="business-option-column__error">{errorMessage}</div> : null}

      <div className="business-option-column__list">
        {items.length ? (
          items.map((item) => (
            <div key={item} className="business-option-column__item">
              <span className="business-option-column__label">{item}</span>
              <button type="button" className="business-option-column__remove" aria-label={`${item} 삭제`} onClick={() => void onRemove(item)}>
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="business-option-column__empty">등록된 항목이 없습니다.</div>
        )}
      </div>
    </section>
  );
}

function FilterChipSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (nextValue: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label ?? value;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updateAlignment = () => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      setAlignRight(rect.left + FILTER_MENU_WIDTH > window.innerWidth - FILTER_MENU_EDGE_PADDING);
    };

    updateAlignment();
    window.addEventListener('resize', updateAlignment);
    window.addEventListener('scroll', updateAlignment, true);

    return () => {
      window.removeEventListener('resize', updateAlignment);
      window.removeEventListener('scroll', updateAlignment, true);
    };
  }, [isOpen]);

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          className="filter-dropdown__menu filter-dropdown__menu--insured business-page__filter-menu"
          role="menu"
          aria-label={`${label} 메뉴`}
          style={getFilterMenuStyle(rootRef.current, alignRight)}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-dropdown__item ${option.value === value ? 'filter-dropdown__item--active' : ''}`}
              role="menuitem"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className="filter-dropdown__reset"
            onClick={() => {
              const resetTarget = options.find((option) => option.value === '전체') ?? options[0];
              if (resetTarget) {
                onChange(resetTarget.value);
              }
              setIsOpen(false);
            }}
          >
            초기화
          </button>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className={`filter-dropdown ${alignRight ? 'filter-dropdown--align-right' : ''} ${isOpen ? 'filter-dropdown--open' : ''}`}>
      <button type="button" className={`filter-chip ${value !== '전체' ? 'filter-chip--active' : ''}`} aria-haspopup="menu" aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
        <span className="filter-chip__label">{label}</span>
        <span className="business-page__filter-divider" aria-hidden="true" />
        <span className="filter-chip__label business-page__filter-value">{displayValue}</span>
        <span className="toggle-arrow-icon" aria-hidden="true" />
      </button>
      {menu}
    </div>
  );
}

function getFilterMenuStyle(root: HTMLDivElement | null, alignRight: boolean): CSSProperties {
  if (!root) {
    return {
      position: 'fixed',
      left: '-9999px',
      top: '-9999px',
      opacity: 0,
      pointerEvents: 'none',
    };
  }

  const rect = root.getBoundingClientRect();
  const width = Math.min(FILTER_MENU_WIDTH, window.innerWidth - FILTER_MENU_EDGE_PADDING * 2);
  const left = alignRight
    ? Math.max(FILTER_MENU_EDGE_PADDING, rect.right - width)
    : Math.min(Math.max(FILTER_MENU_EDGE_PADDING, rect.left), window.innerWidth - width - FILTER_MENU_EDGE_PADDING);
  const top = Math.min(rect.bottom + FILTER_MENU_GAP, window.innerHeight - FILTER_MENU_EDGE_PADDING - 280);

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    maxHeight: `${Math.max(160, window.innerHeight - top - FILTER_MENU_EDGE_PADDING)}px`,
    opacity: 1,
    transform: 'none',
    pointerEvents: 'auto',
    zIndex: 'var(--z-overlay-top)',
  };
}
