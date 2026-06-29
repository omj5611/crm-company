import type { ReactNode } from 'react';

const EDU_ICON_SRC = '/assets/edu.svg';
const USERS_ICON_SRC = '/assets/users.svg';
const COMPANY_ICON_SRC = '/assets/company.svg';
const LECTURE_ICON_SRC = '/assets/lecture.svg';
const WEBSITE_ICON_SRC = '/assets/website.svg';
const SETTINGS_ICON_SRC = '/assets/settings.svg';
const SNIPERFACTORY_LOGO_SRC = '/assets/sniperfactory.svg';
const INSIDEOUT_LOGO_SRC = '/assets/insideout.svg';

export function Sidebar({
  sections,
  onToggleSection,
  globalQuery,
  onSearchOpen,
  onOpenPage,
  activePageLabel,
}: {
  sections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  globalQuery: string;
  onSearchOpen: () => void;
  onOpenPage: (label: string) => void;
  activePageLabel: string;
}) {
  const query = globalQuery.trim().toLowerCase();

  return (
    <aside className="sidebar">
      <div className="sidebar__content">
        <div className="workspace-switch">
          <button className="workspace-switch__item workspace-switch__item--active" type="button">
            <img className="workspace-switch__icon" src={SNIPERFACTORY_LOGO_SRC} alt="" aria-hidden="true" />
            <span>스팩</span>
          </button>
          <button className="workspace-switch__item" type="button">
            <img className="workspace-switch__icon" src={INSIDEOUT_LOGO_SRC} alt="" aria-hidden="true" />
            <span>인사</span>
          </button>
        </div>

        <div className="favorites">
          <div className="favorites__label">즐겨찾는 교육과정</div>
          {['AI로 완성하는 SNS 마케팅 프로젝트...', 'AI로 완성하는 SNS 마케팅 프로젝트...', 'AI로 완성하는 SNS 마케팅...'].map((item, index) => (
            <div className="favorite-item" key={`${item}-${index}`}>
              <span className="favorite-item__text">{item}</span>
              <StarIcon className="favorite-item__star" />
            </div>
          ))}
        </div>

        <nav className="menu">
          <SidebarSection
            icon={<MenuIcon src={EDU_ICON_SRC} className="sidebar-menu__icon" />}
            label="교육과정 관리"
            open={sections.curriculum}
            onToggle={() => onToggleSection('curriculum')}
            onOpenPage={() => onOpenPage('교육과정 관리')}
            highlighted={['교육과정 관리', '전체 교육과정 리스트', '교육과정 캘린더', '상세페이지 FAQ', '메인 FAQ', '사업페이지 FAQ', 'KDT', '중소기업인재키움'].some((item) =>
              item.toLowerCase().includes(query),
            )}
            items={[
              { label: '전체 교육과정 리스트' },
              { label: '교육과정 캘린더' },
              { label: '상세페이지 FAQ' },
            ]}
          />
          <SidebarSection
            label="회원관리"
            open={sections.member}
            onToggle={() => onToggleSection('member')}
            onOpenPage={() => onOpenPage('회원관리')}
            highlighted={['회원관리', '회원 관리', '가입 회원 리스트', '사전 지원자 리스트', '정식 지원자 리스트', '오픈 알림 지원자'].some((item) =>
              item.toLowerCase().includes(query),
            )}
            items={[
              { label: '가입 회원 리스트' },
              { label: '사전 지원자 리스트' },
              { label: '정식 지원자 리스트' },
              { label: '오픈 알림 지원자' },
            ]}
            icon={<MenuIcon src={USERS_ICON_SRC} className="sidebar-menu__icon" />}
          />
          <MenuItem icon={<MenuIcon src={COMPANY_ICON_SRC} className="sidebar-menu__icon" />} label="기업 관리" active={activePageLabel === '기업 관리'} highlighted={query ? '기업 관리'.includes(query) : false} onOpenPage={() => onOpenPage('기업 관리')} />
          <MenuItem icon={<MenuIcon src={LECTURE_ICON_SRC} className="sidebar-menu__icon" />} label="강사관리" highlighted={query ? '강사관리'.includes(query) : false} onOpenPage={() => onOpenPage('강사관리')} />
          <SidebarSection
            icon={<MenuIcon src={WEBSITE_ICON_SRC} className="sidebar-menu__icon" />}
            label="웹사이트관리"
            open={sections.website}
            onToggle={() => onToggleSection('website')}
            onOpenPage={() => onOpenPage('웹사이트관리')}
            highlighted={['웹사이트관리', '웹사이트 관리', '배너', '팝업', '메인 FAQ', '사업페이지 FAQ'].some((item) => item.toLowerCase().includes(query))}
            items={[
              { label: '배너' },
              { label: '팝업' },
              { label: '메인 FAQ' },
              { label: '사업페이지 FAQ', nested: [{ label: 'KDT' }, { label: '중소기업인재키움' }] },
            ]}
          />
          <SidebarSection
            icon={<MenuIcon src={SETTINGS_ICON_SRC} className="sidebar-menu__icon" />}
            label="설정 관리"
            open={sections.settings}
            onToggle={() => onToggleSection('settings')}
            onOpenPage={() => onOpenPage('설정 관리')}
            highlighted={['설정 관리', '계정 및 권한', '약관 관리', '내 프로필'].some((item) => item.toLowerCase().includes(query))}
            items={[{ label: '계정 및 권한' }, { label: '약관 관리' }, { label: '내 프로필' }]}
          />
        </nav>
      </div>

    </aside>
  );
}

function MenuItem({
  icon,
  label,
  active = false,
  highlighted = false,
  onOpenPage,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  highlighted?: boolean;
  onOpenPage?: () => void;
}) {
  return (
    <button
      type="button"
      className={`menu-item ${active ? 'menu-item--active' : ''} ${highlighted ? 'menu-item--highlighted' : ''}`}
      onClick={onOpenPage}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SidebarSection({
  icon,
  label,
  open,
  onToggle,
  items,
  highlighted = false,
  onOpenPage,
}: {
  icon: ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  items: Array<{ label: string; nested?: Array<{ label: string }> }>;
  highlighted?: boolean;
  onOpenPage?: (label?: string) => void;
}) {
  return (
    <div className="sidebar-section">
      <button
        type="button"
        className={`menu-item menu-item--section ${open ? 'menu-item--open' : ''} ${highlighted ? 'menu-item--highlighted' : ''}`}
        onClick={() => {
          onToggle();
          onOpenPage?.(label);
        }}
      >
        {icon}
        <span>{label}</span>
        <ChevronIcon rotated={open} />
      </button>

      {open ? (
        <div className="submenu">
          {items.map((item) => (
            <div key={item.label} className="submenu-block">
              <button type="button" className="submenu-item" onClick={() => onOpenPage?.(item.label)}>
                <span>{item.label}</span>
                {item.nested ? <ChevronIcon rotated /> : null}
              </button>
              {item.nested ? (
                <div className="submenu-nested">
                  {item.nested.map((nestedItem) => (
                    <button
                      type="button"
                      className="submenu-item submenu-item--nested"
                      key={nestedItem.label}
                      onClick={() => onOpenPage?.(nestedItem.label)}
                    >
                      <span>{nestedItem.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}

function ChevronIcon({ rotated = false }: { rotated?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={rotated ? 'chevron chevron--open' : 'chevron'}
    >
      <path d="M5 6L8 9L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 2.4L9.6 5.7L13.2 6.2L10.6 8.6L11.3 12.1L8 10.4L4.7 12.1L5.4 8.6L2.8 6.2L6.4 5.7L8 2.4Z" fill="#FBBF24" />
    </svg>
  );
}
