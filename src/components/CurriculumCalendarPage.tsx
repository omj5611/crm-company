import { useMemo, useState } from 'react';

type CalendarEvent = {
  day: number;
  title: string;
  time: string;
  track: string;
  programType?: '인턴형' | '프로젝트형';
  assignedToMe: boolean;
  tone: 'blue' | 'green' | 'amber' | 'violet';
};

type BusinessFilterGroup = {
  label: string;
  children?: string[];
};

const BUSINESS_FILTERS: BusinessFilterGroup[] = [
  { label: 'KDT' },
  { label: '새싹(SeSAC)', children: ['인턴형', '프로젝트형'] },
  { label: '중소기업인재키움', children: ['인턴형', '프로젝트형'] },
  { label: '미래내일일경험', children: ['인턴형', '프로젝트형'] },
];

const DEFAULT_EVENTS: CalendarEvent[] = [
  { day: 2, title: '프론트엔드 부트캠프', time: '10:00', track: 'KDT', assignedToMe: true, tone: 'blue' },
  { day: 4, title: 'AI 서비스 기획', time: '13:30', track: '새싹(SeSAC)', programType: '인턴형', assignedToMe: true, tone: 'green' },
  { day: 8, title: '데이터 분석 실무', time: '09:40', track: '중소기업인재키움', programType: '프로젝트형', assignedToMe: false, tone: 'amber' },
  { day: 13, title: '프로젝트형 실습', time: '15:20', track: '미래내일일경험', programType: '프로젝트형', assignedToMe: true, tone: 'violet' },
  { day: 18, title: '인턴형 멘토링', time: '11:00', track: '미래내일일경험', programType: '인턴형', assignedToMe: false, tone: 'blue' },
  { day: 23, title: '취업 포트폴리오 리뷰', time: '14:00', track: '새싹(SeSAC)', programType: '프로젝트형', assignedToMe: true, tone: 'green' },
  { day: 27, title: '성과 발표회', time: '16:30', track: 'KDT', assignedToMe: false, tone: 'amber' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const toneLabel: Record<CalendarEvent['tone'], string> = {
  blue: 'calendar-pill--blue',
  green: 'calendar-pill--green',
  amber: 'calendar-pill--amber',
  violet: 'calendar-pill--violet',
};

const toneAccent: Record<CalendarEvent['tone'], string> = {
  blue: 'calendar-card__event--blue',
  green: 'calendar-card__event--green',
  amber: 'calendar-card__event--amber',
  violet: 'calendar-card__event--violet',
};

const getMonthGrid = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const startIndex = firstDay.getDay();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startIndex + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - startIndex + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  return cells;
};

const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(date);

const formatDayLabel = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  }).format(date);

export function CurriculumCalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [focusedDay, setFocusedDay] = useState(today.getDate());
  const [myCoursesOnly, setMyCoursesOnly] = useState(true);
  const [selectedBusinessFilters, setSelectedBusinessFilters] = useState<string[]>(['KDT']);
  const [selectedNestedFilters, setSelectedNestedFilters] = useState<string[]>(['미래내일일경험::프로젝트형']);
  const [openGroups, setOpenGroups] = useState<string[]>(['새싹(SeSAC)', '중소기업인재키움', '미래내일일경험']);

  const gridDays = useMemo(() => getMonthGrid(today), [today]);
  const matchesBusinessFilter = (event: CalendarEvent) => {
    if (!selectedBusinessFilters.length && !selectedNestedFilters.length) {
      return true;
    }

    const trackSelected = selectedBusinessFilters.includes(event.track);
    const nestedSelectionsForTrack = selectedNestedFilters.filter((item) => item.startsWith(`${event.track}::`));
    const nestedProgramsForTrack = nestedSelectionsForTrack.map((item) => item.split('::')[1]).filter(Boolean);

    if (trackSelected) {
      return true;
    }

    if (!nestedProgramsForTrack.length || !event.programType) {
      return false;
    }

    return nestedProgramsForTrack.includes(event.programType);
  };

  const monthEvents = useMemo(
    () =>
      DEFAULT_EVENTS.filter((event) => {
        const matchesMyCourses = myCoursesOnly ? event.assignedToMe : true;
        return matchesMyCourses && matchesBusinessFilter(event);
      }),
    [myCoursesOnly, selectedBusinessFilters, selectedNestedFilters],
  );
  const selectedDayEvents = monthEvents.filter((event) => event.day === focusedDay);
  const selectedDate = new Date(today.getFullYear(), today.getMonth(), focusedDay);
  const totalTracks = BUSINESS_FILTERS.length;
  const eventCount = monthEvents.length;
  const upcomingCount = monthEvents.filter((event) => event.day >= focusedDay).length;

  const toggleBusiness = (label: string) => {
    setSelectedBusinessFilters((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  };

  const toggleNested = (group: string, child: string) => {
    const key = `${group}::${child}`;
    setSelectedNestedFilters((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const toggleGroupOpen = (label: string) => {
    setOpenGroups((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  };

  return (
    <section className="calendar-shell" aria-label="교육과정 캘린더">
      <aside className="calendar-shell__sidebar">
        <div className="calendar-panel calendar-panel--calendar">
          <div className="calendar-panel__eyebrow">월간 달력</div>
          <div className="calendar-panel__title-row">
            <h2>{monthLabel(today)}</h2>
            <div className="calendar-panel__nav" aria-label="월 이동">
              <button type="button" aria-label="이전 달 보기">‹</button>
              <button type="button" aria-label="다음 달 보기">›</button>
            </div>
          </div>

          <div className="mini-calendar">
            <div className="mini-calendar__weekdays" aria-hidden="true">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className="mini-calendar__grid">
              {gridDays.map((day, index) => {
                const isToday = day === today.getDate();
                const isSelected = day === focusedDay;
                const hasEvent = day ? DEFAULT_EVENTS.some((event) => event.day === day) : false;

                return (
                  <button
                    key={`${day ?? 'empty'}-${index}`}
                    type="button"
                    className={`mini-calendar__day ${day ? '' : 'mini-calendar__day--empty'} ${isToday ? 'mini-calendar__day--today' : ''} ${
                      isSelected ? 'mini-calendar__day--selected' : ''
                    }`}
                    onClick={() => day && setFocusedDay(day)}
                    disabled={!day}
                    aria-label={day ? `${day}일` : '빈 칸'}
                  >
                    <span>{day ?? ''}</span>
                    {hasEvent ? <span className="mini-calendar__dot" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="calendar-panel">
          <div className="calendar-panel__header">
            <div>
              <div className="calendar-panel__eyebrow">필터</div>
              <h3>교육과정 범위</h3>
            </div>
            <button type="button" className="calendar-panel__reset" onClick={() => {
              setMyCoursesOnly(false);
              setSelectedBusinessFilters([]);
              setSelectedNestedFilters([]);
              setOpenGroups(BUSINESS_FILTERS.filter((group) => group.children?.length).map((group) => group.label));
            }}>
              전체 해제
            </button>
          </div>

          <div className="calendar-filters">
            <label className="calendar-check">
              <input type="checkbox" checked={myCoursesOnly} onChange={() => setMyCoursesOnly((current) => !current)} />
              <span>
                <strong>내 담당 교육과정만 보기</strong>
                <small>내가 담당한 일정만 압축해서 볼 수 있어요.</small>
              </span>
            </label>

            <div className="calendar-filter-group">
              <div className="calendar-filter-group__title">사업별</div>
              <div className="calendar-filter-tree">
                {BUSINESS_FILTERS.map((group) => {
                  const hasChildren = Boolean(group.children?.length);
                  const open = hasChildren ? openGroups.includes(group.label) : false;
                  const checked = selectedBusinessFilters.includes(group.label);

                  return (
                    <div key={group.label} className="calendar-filter-tree__group">
                      <div className={`calendar-filter-tree__row ${checked ? 'calendar-filter-tree__row--active' : ''}`}>
                        <label className="calendar-check calendar-check--compact">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBusiness(group.label)}
                          />
                          <span>{group.label}</span>
                        </label>
                        {hasChildren ? (
                          <button type="button" className="calendar-filter-tree__toggle" onClick={() => toggleGroupOpen(group.label)} aria-label={`${group.label} 펼치기`}>
                            {open ? '−' : '+'}
                          </button>
                        ) : null}
                      </div>

                      {hasChildren && open ? (
                        <div className="calendar-filter-tree__children">
                          {group.children?.map((child) => {
                            const key = `${group.label}::${child}`;
                            const childChecked = selectedNestedFilters.includes(key);
                            return (
                              <label key={key} className="calendar-check calendar-check--nested">
                                <input type="checkbox" checked={childChecked} onChange={() => toggleNested(group.label, child)} />
                                <span>{child}</span>
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
        </div>
      </aside>

      <main className="calendar-shell__main">
        <div className="calendar-hero">
          <div className="calendar-hero__copy">
            <div className="calendar-hero__eyebrow">교육과정 관리</div>
            <h1>교육과정 캘린더</h1>
            <p>달력과 사업별 필터를 한 화면에 배치해서, 교육과정 진행 상황을 빠르게 파악하는 레이아웃입니다.</p>
          </div>

          <div className="calendar-hero__meta">
            <div className="calendar-stat">
              <span>표시 중인 일정</span>
              <strong>{eventCount}개</strong>
            </div>
            <div className="calendar-stat">
              <span>사업 필터</span>
              <strong>{totalTracks}종</strong>
            </div>
            <div className="calendar-stat">
              <span>남은 일정</span>
              <strong>{upcomingCount}개</strong>
            </div>
          </div>
        </div>

        <div className="calendar-grid">
          <section className="calendar-board" aria-label="월간 일정">
            <div className="calendar-board__header">
              <div>
                <div className="calendar-board__eyebrow">이번 달</div>
                <h2>{formatDayLabel(selectedDate)}</h2>
              </div>
              <div className="calendar-board__legend">
                <span className="calendar-pill calendar-pill--blue">KDT</span>
                <span className="calendar-pill calendar-pill--green">새싹(SeSAC)</span>
                <span className="calendar-pill calendar-pill--amber">중소기업인재키움</span>
                <span className="calendar-pill calendar-pill--violet">미래내일일경험</span>
              </div>
            </div>

            <div className="calendar-board__timeline">
              {monthEvents.map((event) => (
                <article className="calendar-card" key={`${event.title}-${event.day}`}>
                  <div className={`calendar-card__event ${toneAccent[event.tone]}`}>
                    <span className={`calendar-pill ${toneLabel[event.tone]}`}>{event.track}</span>
                    <strong>{event.title}</strong>
                    <span>
                      {event.time}
                      {event.programType ? ` · ${event.programType}` : ''}
                    </span>
                  </div>
                  <div className="calendar-card__day">
                    <span>{event.day}일</span>
                    <small>{WEEKDAYS[new Date(today.getFullYear(), today.getMonth(), event.day).getDay()]}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="calendar-focus" aria-label="선택된 날짜 상세">
            <div className="calendar-focus__header">
              <div className="calendar-board__eyebrow">선택된 날짜</div>
              <h2>{focusedDay}일 일정</h2>
            </div>

            <div className="calendar-focus__empty">
              {selectedDayEvents.length ? (
                selectedDayEvents.map((event) => (
                  <div className="calendar-focus__item" key={`${event.title}-${event.day}`}>
                    <span className={`calendar-pill ${toneLabel[event.tone]}`}>{event.track}</span>
                    <strong>{event.title}</strong>
                    <p>
                      {event.time} 시작 · {event.programType ?? '공통'} · 담당자 홍길동
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <strong>{focusedDay}일에는 등록된 일정이 없습니다.</strong>
                  <p>필터를 바꾸거나 다른 날짜를 눌러보면 관련 교육과정을 바로 확인할 수 있어요.</p>
                </>
              )}
            </div>

            <div className="calendar-focus__summary">
              <div className="calendar-focus__summary-item">
                <span>내 담당 교육과정</span>
                <strong>{myCoursesOnly ? '적용 중' : '전체 보기'}</strong>
              </div>
              <div className="calendar-focus__summary-item">
                <span>선택된 사업</span>
                <strong>{selectedBusinessFilters.length + selectedNestedFilters.length}개</strong>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </section>
  );
}
