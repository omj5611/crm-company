import type { CSSProperties } from 'react';

type PageTab = {
  id: string;
  label: string;
  iconSrc: string;
  isDraft?: boolean;
};

export function PageTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward,
}: {
  tabs: PageTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onCloseTab: (tabId: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}) {
  return (
    <div className="tabs-bar" role="navigation" aria-label="열어본 페이지 탭">
      <div className="tabs-bar__window-controls">
        <button type="button" className="tabs-bar__nav" onClick={onGoBack} aria-label="이전 페이지로 이동" disabled={!canGoBack}>
          <ArrowIcon direction="left" />
        </button>
        <button type="button" className="tabs-bar__nav" onClick={onGoForward} aria-label="다음 페이지로 이동" disabled={!canGoForward}>
          <ArrowIcon direction="right" />
        </button>
      </div>

      <div className="tabs-bar__track">
        {tabs.map((tab) => (
          <div key={tab.id} className={`page-tab ${activeTabId === tab.id ? 'page-tab--active' : ''}`}>
            <button type="button" className="page-tab__main" onClick={() => onSelectTab(tab.id)}>
              <MaskIcon src={tab.iconSrc} className="page-tab__icon" />
              <span className="page-tab__label">{tab.label}</span>
            </button>
            <button
              type="button"
              aria-label={`${tab.label} 닫기`}
              className="page-tab__close"
              onClick={(event) => {
                event.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="page-tab page-tab--add" onClick={onAddTab} aria-label="새 탭 추가">
          <PlusIcon small strokeWidth={1.5} color="#64748b" />
        </button>
      </div>
    </div>
  );
}

function MaskIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      className={`mask-icon ${className ?? ''}`.trim()}
      style={{ '--icon-url': `url(${src})` } as CSSProperties}
      aria-hidden="true"
    />
  );
}

function PlusIcon({
  small = false,
  strokeWidth = 1.75,
  color = '#ffffff',
}: {
  small?: boolean;
  strokeWidth?: number;
  color?: string;
}) {
  return (
    <svg width={small ? '14' : '18'} height={small ? '14' : '18'} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 3.5V14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M3.5 9H14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  const isLeft = direction === 'left';

  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d={isLeft ? 'M8.5 3.5L5 7L8.5 10.5' : 'M5.5 3.5L9 7L5.5 10.5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
