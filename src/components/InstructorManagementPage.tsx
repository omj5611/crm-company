import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { TagToggleAction } from './TagToggleAction';

export type InstructorResumeFile = {
  id: string;
  name: string;
  url: string;
};

export type InstructorRow = {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  organization: string;
  nscEnrolled: boolean;
  lectureRegions: string[];
  lectureFields: string[];
  resumeUrl: string;
  resumeFiles: InstructorResumeFile[];
  ncsField?: string;
  finalEducation?: string;
  educations?: {
    id: string;
    schoolName: string;
    department: string;
    major: string;
    degree: string;
    period: string;
  }[];
  careers?: {
    id: string;
    period: string;
    workplace: string;
    roleName: string;
  }[];
  certificateFiles?: InstructorResumeFile[];
  participationItems?: string[];
  hasNoOrganization?: boolean;
};

export function InstructorManagementPage({
  instructors,
  mentors,
  taggedInstructorIds,
  instructorMemoCountsById,
  activeInstructorId,
  onOpenInstructorTag,
  onOpenInstructorMemo,
  onOpenInstructorDetail,
  onOpenDirectRegister,
  onOpenExcelRegister,
}: {
  instructors: InstructorRow[];
  mentors: InstructorRow[];
  taggedInstructorIds: Record<string, boolean>;
  instructorMemoCountsById: Record<string, number>;
  activeInstructorId?: string | null;
  onOpenInstructorTag: (id: string) => void;
  onOpenInstructorMemo: (id: string) => void;
  onOpenInstructorDetail: (id: string) => void;
  onOpenDirectRegister: () => void;
  onOpenExcelRegister: () => void;
}) {
  const [activeRosterTab, setActiveRosterTab] = useState<'강사' | '멘토'>('강사');
  const [isRegisterMenuOpen, setIsRegisterMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipationCourse, setSelectedParticipationCourse] = useState('전체');
  const [showTaggedOnly, setShowTaggedOnly] = useState(false);
  const [nscFilter, setNscFilter] = useState<'전체' | '가입' | '미가입'>('전체');
  const [selectedRegionFilters, setSelectedRegionFilters] = useState<string[]>([]);
  const [selectedFieldFilters, setSelectedFieldFilters] = useState<string[]>([]);
  const [openHeaderFilter, setOpenHeaderFilter] = useState<'participation' | 'nsc' | 'region' | 'field' | null>(null);
  const registerMenuRef = useRef<HTMLDivElement | null>(null);
  const filterLayerRef = useRef<HTMLDivElement | null>(null);
  const rosterRows = activeRosterTab === '강사' ? instructors : mentors;

  const participationOptions = useMemo(
    () => ['전체', ...Array.from(new Set(rosterRows.flatMap((row) => row.participationItems ?? []).filter(Boolean)))],
    [rosterRows],
  );
  const regionOptions = useMemo(
    () => Array.from(new Set(rosterRows.flatMap((row) => row.lectureRegions).filter(Boolean))),
    [rosterRows],
  );
  const fieldOptions = useMemo(
    () => Array.from(new Set(rosterRows.flatMap((row) => row.lectureFields).filter(Boolean))),
    [rosterRows],
  );
  const visibleInstructors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return rosterRows.filter((instructor) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          instructor.name,
          instructor.phone,
          instructor.email,
          instructor.organization,
          instructor.birthDate,
          instructor.ncsField ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesParticipation =
        selectedParticipationCourse === '전체' ||
        (instructor.participationItems ?? []).includes(selectedParticipationCourse);

      const matchesTag = !showTaggedOnly || Boolean(taggedInstructorIds[instructor.id]);
      const matchesNsc =
        nscFilter === '전체' ||
        (nscFilter === '가입' ? instructor.nscEnrolled : !instructor.nscEnrolled);
      const matchesRegion =
        selectedRegionFilters.length === 0 || selectedRegionFilters.some((region) => instructor.lectureRegions.includes(region));
      const matchesField =
        selectedFieldFilters.length === 0 || selectedFieldFilters.some((field) => instructor.lectureFields.includes(field));

      return matchesSearch && matchesParticipation && matchesTag && matchesNsc && matchesRegion && matchesField;
    });
  }, [nscFilter, rosterRows, searchQuery, selectedFieldFilters, selectedParticipationCourse, selectedRegionFilters, showTaggedOnly, taggedInstructorIds]);

  useEffect(() => {
    if (!isRegisterMenuOpen && !openHeaderFilter) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!registerMenuRef.current?.contains(event.target as Node)) {
        setIsRegisterMenuOpen(false);
      }
      if (!filterLayerRef.current?.contains(event.target as Node)) {
        setOpenHeaderFilter(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isRegisterMenuOpen, openHeaderFilter]);

  const toggleArrayFilter = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  return (
    <section className="instructor-page" aria-label="강사/멘토 관리">
      <div className="instructor-page__hero">
        <div className="instructor-page__hero-copy">
          <h1 className="instructor-page__title">강사/멘토 관리</h1>
          <p className="instructor-page__description">
            강사와 멘토의 기본 정보, 강의 가능 지역과 분야, NSC 가입 여부, 이력서 링크 및 파일을 한 화면에서 관리할 수 있습니다.
          </p>
        </div>
        <div className="instructor-page__summary">
          <div className="instructor-page__summary-card">
            <strong>{instructors.length}</strong>
            <span>등록 강사</span>
          </div>
          <div className="instructor-page__summary-card">
            <strong>{mentors.length}</strong>
            <span>등록 멘토</span>
          </div>
        </div>
      </div>

      <div className="instructor-page__tabs" role="tablist" aria-label="강사와 멘토 목록 전환">
        {(['강사', '멘토'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeRosterTab === tab}
            className={`instructor-page__tab ${activeRosterTab === tab ? 'instructor-page__tab--active' : ''}`}
            onClick={() => {
              setActiveRosterTab(tab);
              setSearchQuery('');
              setSelectedParticipationCourse('전체');
              setShowTaggedOnly(false);
              setNscFilter('전체');
              setSelectedRegionFilters([]);
              setSelectedFieldFilters([]);
              setOpenHeaderFilter(null);
              setIsRegisterMenuOpen(false);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="instructor-board">
        <div className="instructor-board__head">
          <div>
            <div className="instructor-board__title">{activeRosterTab} 표 테이블</div>
            <div className="instructor-board__subtitle">{activeRosterTab} 정보를 열 단위로 빠르게 확인하고 필요한 조건으로 바로 필터링할 수 있습니다.</div>
          </div>
          <div className={`instructor-board__register-menu ${isRegisterMenuOpen ? 'is-open' : ''}`} ref={registerMenuRef}>
            <button
              type="button"
              className="instructor-board__register-trigger"
              aria-haspopup="menu"
              aria-expanded={isRegisterMenuOpen}
              onClick={() => setIsRegisterMenuOpen((current) => !current)}
            >
              <span>{activeRosterTab} 등록</span>
              <span className="toggle-arrow-icon" aria-hidden="true" />
            </button>
            {isRegisterMenuOpen ? (
              <div className="instructor-board__register-dropdown" role="menu" aria-label={`${activeRosterTab} 등록 메뉴`}>
                <button
                  type="button"
                  className="instructor-board__register-option"
                  role="menuitem"
                  onClick={() => {
                    setIsRegisterMenuOpen(false);
                    onOpenDirectRegister();
                  }}
                >
                  직접 입력
                </button>
                <button
                  type="button"
                  className="instructor-board__register-option"
                  role="menuitem"
                  onClick={() => {
                    setIsRegisterMenuOpen(false);
                    onOpenExcelRegister();
                  }}
                >
                  엑셀로 일괄 등록
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <section className="results-toolbar instructor-board__filters" aria-label={`${activeRosterTab} 목록 필터`} ref={filterLayerRef}>
          <div className="results-toolbar__left">
            <strong className="results-toolbar__count">전체 {visibleInstructors.length}명</strong>
            <div className="results-toolbar__selects">
              <label className="instructor-board__search-chip">
                <img src="/assets/search.svg" alt="" aria-hidden="true" className="instructor-board__search-icon" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={`${activeRosterTab}명, 연락처, 이메일, 소속 검색`}
                />
              </label>

              <div className={`instructor-board__filter-dropdown ${openHeaderFilter === 'participation' ? 'is-open' : ''}`}>
                <button type="button" className={`filter-chip ${selectedParticipationCourse !== '전체' ? 'filter-chip--active' : ''}`} onClick={() => setOpenHeaderFilter((current) => (current === 'participation' ? null : 'participation'))}>
                  <span className="filter-chip__label">
                    {selectedParticipationCourse === '전체' ? '참여 교육과정' : selectedParticipationCourse}
                  </span>
                  <span className="toggle-arrow-icon" aria-hidden="true" />
                </button>
                {openHeaderFilter === 'participation' ? (
                  <div className="filter-dropdown__menu instructor-board__menu" role="menu" aria-label="참여 교육과정 필터">
                    {participationOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`instructor-board__menu-item ${selectedParticipationCourse === option ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedParticipationCourse(option);
                          setOpenHeaderFilter(null);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="results-toolbar__right">
            <label className="results-toolbar__tag-filter instructor-board__tag-filter" aria-label="태그 필터">
              <input type="checkbox" checked={showTaggedOnly} onChange={() => setShowTaggedOnly((current) => !current)} />
              <span className="results-toolbar__tag-filter-box" aria-hidden="true" />
              <span className="results-toolbar__dot" aria-hidden="true" />
              <span>태그만 보기</span>
            </label>
          </div>
        </section>

        <div className="instructor-board__scroll">
          <table className="instructor-board__table">
            <colgroup>
              <col className="instructor-board__col instructor-board__col--name" />
              <col className="instructor-board__col instructor-board__col--birth" />
              <col className="instructor-board__col instructor-board__col--phone" />
              <col className="instructor-board__col instructor-board__col--email" />
              <col className="instructor-board__col instructor-board__col--organization" />
              <col className="instructor-board__col instructor-board__col--nsc" />
              <col className="instructor-board__col instructor-board__col--regions" />
              <col className="instructor-board__col instructor-board__col--fields" />
              <col className="instructor-board__col instructor-board__col--resume" />
              <col className="instructor-board__col instructor-board__col--career" />
              <col className="instructor-board__col instructor-board__col--tag" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{activeRosterTab}명</th>
                <th scope="col">생년월일</th>
                <th scope="col">연락처</th>
                <th scope="col">이메일</th>
                <th scope="col">소속(회사)</th>
                <th scope="col">
                  <div className="instructor-board__header-filter">
                    <span>NSC 가입여부</span>
                    <button type="button" className={`instructor-board__header-filter-button ${nscFilter !== '전체' ? 'is-active' : ''}`} onClick={() => setOpenHeaderFilter((current) => (current === 'nsc' ? null : 'nsc'))}>
                      <span className="toggle-arrow-icon" aria-hidden="true" />
                    </button>
                    {openHeaderFilter === 'nsc' ? (
                      <div className="filter-dropdown__menu instructor-board__menu instructor-board__menu--header" role="menu" aria-label="NSC 가입여부 필터">
                        {(['전체', '가입', '미가입'] as const).map((option) => (
                          <button key={option} type="button" className={`instructor-board__menu-item ${nscFilter === option ? 'is-selected' : ''}`} onClick={() => { setNscFilter(option); setOpenHeaderFilter(null); }}>
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </th>
                <th scope="col">
                  <div className="instructor-board__header-filter">
                    <span>강의 지역</span>
                    <button type="button" className={`instructor-board__header-filter-button ${selectedRegionFilters.length ? 'is-active' : ''}`} onClick={() => setOpenHeaderFilter((current) => (current === 'region' ? null : 'region'))}>
                      <span className="toggle-arrow-icon" aria-hidden="true" />
                    </button>
                    {openHeaderFilter === 'region' ? (
                      <div className="filter-dropdown__menu instructor-board__menu instructor-board__menu--header" role="menu" aria-label="강의 지역 필터">
                        {regionOptions.map((option) => {
                          const isSelected = selectedRegionFilters.includes(option);
                          return (
                            <label key={option} className={`industry-dropdown__checkbox-item ${isSelected ? 'industry-dropdown__checkbox-item--active' : ''}`}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleArrayFilter(option, setSelectedRegionFilters)} />
                              <span className="industry-dropdown__checkbox-box" aria-hidden="true" />
                              <span className="industry-dropdown__checkbox-label">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </th>
                <th scope="col">
                  <div className="instructor-board__header-filter">
                    <span>강의 분야</span>
                    <button type="button" className={`instructor-board__header-filter-button ${selectedFieldFilters.length ? 'is-active' : ''}`} onClick={() => setOpenHeaderFilter((current) => (current === 'field' ? null : 'field'))}>
                      <span className="toggle-arrow-icon" aria-hidden="true" />
                    </button>
                    {openHeaderFilter === 'field' ? (
                      <div className="filter-dropdown__menu instructor-board__menu instructor-board__menu--header" role="menu" aria-label="강의 분야 필터">
                        {fieldOptions.map((option) => {
                          const isSelected = selectedFieldFilters.includes(option);
                          return (
                            <label key={option} className={`industry-dropdown__checkbox-item ${isSelected ? 'industry-dropdown__checkbox-item--active' : ''}`}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleArrayFilter(option, setSelectedFieldFilters)} />
                              <span className="industry-dropdown__checkbox-box" aria-hidden="true" />
                              <span className="industry-dropdown__checkbox-label">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </th>
                <th scope="col">이력서 링크 및 파일</th>
                <th scope="col">경력사항</th>
                <th scope="col">태그</th>
              </tr>
            </thead>
            <tbody>
              {visibleInstructors.map((instructor) => {
                const isTagged = Boolean(taggedInstructorIds[instructor.id]);
                const memoCount = instructorMemoCountsById[instructor.id] ?? 0;

                return (
                  <tr
                    key={instructor.id}
                    className={`instructor-board__row ${activeInstructorId === instructor.id ? 'is-active' : ''}`}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest('button, a, input, label')) return;
                      onOpenInstructorDetail(instructor.id);
                    }}
                  >
                    <td>
                      <div className="instructor-board__name-cell">
                        <div className="instructor-board__name">{instructor.name}</div>
                      </div>
                    </td>
                    <td>{instructor.birthDate}</td>
                    <td>{instructor.phone}</td>
                    <td>
                      <a className="instructor-board__link" href={`mailto:${instructor.email}`}>
                        {instructor.email}
                      </a>
                    </td>
                    <td>{instructor.organization}</td>
                    <td>
                      <span className={`instructor-board__status-chip ${instructor.nscEnrolled ? 'instructor-board__status-chip--active' : ''}`}>
                        {instructor.nscEnrolled ? '가입' : '미가입'}
                      </span>
                    </td>
                    <td>
                      <div className="instructor-board__chip-row">
                        {instructor.lectureRegions.map((region) => (
                          <span key={region} className="instructor-board__chip">
                            {region}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="instructor-board__chip-row">
                        {instructor.lectureFields.map((field) => (
                          <span key={field} className="instructor-board__chip instructor-board__chip--primary">
                            {field}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="instructor-board__resume">
                        <a className="instructor-board__link instructor-board__link--resume" href={instructor.resumeUrl} target="_blank" rel="noreferrer">
                          이력서 링크 열기
                        </a>
                        <div className="instructor-board__file-list">
                          {instructor.resumeFiles.map((file) => (
                            <a
                              key={file.id}
                              className="instructor-board__file-pill"
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {file.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="instructor-board__career-list">
                        {instructor.careers?.length ? (
                          instructor.careers.map((career) => (
                            <div key={career.id} className="instructor-board__career-item">
                              <strong>{career.roleName || '경력명 미입력'}</strong>
                              <span>{career.workplace || '근무처 미입력'}</span>
                              <span>{career.period || '기간 미입력'}</span>
                            </div>
                          ))
                        ) : (
                          <span className="instructor-board__muted">등록된 경력 없음</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="company-card__meta-right instructor-board__tag-cell">
                        <TagToggleAction
                          isTagged={isTagged}
                          dotMode="decorative"
                          dotClassName="company-detail__contact-tag-dot"
                          dotActiveClassName="company-detail__contact-tag-dot--active"
                          markClassName="company-detail__contact-tag-dot-mark"
                          labelClassName="company-detail__contact-tag-action"
                          labelActiveClassName="company-detail__contact-tag-action--active"
                          ariaLabel={`${instructor.name} 태그 ${isTagged ? '해제' : '추가'}`}
                          onClick={() => onOpenInstructorTag(instructor.id)}
                        />
                        <div className="company-detail__contact-message-wrap">
                          <button
                            type="button"
                            className="company-detail__contact-message-meta"
                            aria-label={`${instructor.name} 메모 ${memoCount}개 보기`}
                            onClick={() => onOpenInstructorMemo(instructor.id)}
                          >
                            <img src="/assets/chat.svg" alt="" aria-hidden="true" className="company-detail__contact-message-icon" />
                            <span className="company-detail__contact-message-count">{memoCount}</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleInstructors.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="instructor-board__empty">필터 조건에 맞는 {activeRosterTab === '강사' ? '강사' : '멘토'}가 없습니다.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
