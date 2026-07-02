import type { KeyboardEvent, RefObject } from 'react';

export type DetailMemoPanelItem = {
  id: string;
  date: string;
  author: string;
  body: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

type TextareaComposer = {
  mode: 'textarea';
  title: string;
  submitLabel: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  rows?: number;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

type ActionComposer = {
  mode: 'action';
  title: string;
  submitLabel: string;
  onSubmit: () => void;
};

type DetailMemoPanelComposer = TextareaComposer | ActionComposer;

export function DetailMemoPanel({
  ariaLabel,
  title = '메모',
  note,
  items,
  emptyMessage,
  collapsed,
  onToggleCollapsed,
  loading = false,
  composer,
}: {
  ariaLabel: string;
  title?: string;
  note?: string;
  items: DetailMemoPanelItem[];
  emptyMessage: string;
  collapsed: boolean;
  onToggleCollapsed: (next: boolean) => void;
  loading?: boolean;
  composer?: DetailMemoPanelComposer;
}) {
  return (
    <aside className={`company-detail-memo-panel ${collapsed ? 'company-detail-memo-panel--collapsed' : ''}`} aria-label={ariaLabel}>
      {collapsed ? (
        <button
          type="button"
          className="company-detail__memo-floating-toggle company-detail__memo-floating-toggle--collapsed company-detail__memo-floating-toggle--with-tooltip"
          aria-label="메모 열기"
          aria-pressed={collapsed}
          onClick={() => onToggleCollapsed(false)}
          data-tooltip="메모 열기"
          data-tooltip-side="left"
        >
          <img src="/assets/pannel.svg" alt="" aria-hidden="true" className="company-detail__memo-floating-toggle-icon" />
        </button>
      ) : null}

      <div className="company-detail__memo-section">
        <div className="company-detail__memo-title-row">
          <div className="company-detail__memo-title">{title}</div>
          <button
            type="button"
            className="company-detail__memo-toggle company-detail__memo-toggle--with-tooltip"
            aria-label="메모 닫기"
            aria-pressed={false}
            onClick={() => onToggleCollapsed(true)}
            data-tooltip="메모 닫기"
            data-tooltip-side="left"
          >
            <img src="/assets/pannel.svg" alt="" aria-hidden="true" className="company-detail__memo-toggle-icon" />
          </button>
        </div>

        {note ? <div className="company-detail__memo-note">{note}</div> : null}

        {!collapsed ? (
          <>
            <div className="company-detail__memo-list">
              {loading ? (
                <div className="company-detail__memo-empty">메모를 불러오는 중입니다.</div>
              ) : items.length ? (
                items.map((item) => (
                  <article key={item.id} className="company-detail__memo-item">
                    <div className="company-detail__memo-head">
                      <div className="company-detail__memo-meta">
                        <span className="company-detail__memo-date">{item.date}</span>
                        <span className="company-detail__memo-author">{item.author}</span>
                      </div>
                      {item.onEdit || item.onDelete ? (
                        <div className="company-detail__memo-actions">
                          {item.onEdit ? (
                            <button type="button" className="company-detail__memo-action" aria-label="메모 편집" onClick={item.onEdit}>
                              <img src="/assets/edit.svg" alt="" aria-hidden="true" className="company-detail__memo-action-icon" />
                            </button>
                          ) : null}
                          {item.onDelete ? (
                            <button type="button" className="company-detail__memo-action" aria-label="메모 삭제" onClick={item.onDelete}>
                              <img src="/assets/trash.svg" alt="" aria-hidden="true" className="company-detail__memo-action-icon" />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="company-detail__memo-body">{item.body}</div>
                  </article>
                ))
              ) : (
                <div className="company-detail__memo-empty">{emptyMessage}</div>
              )}
            </div>

            {composer ? (
              <div className="company-detail__memo-editor">
                <div className="company-detail__memo-editor-head">
                  <div className="company-detail__memo-editor-title">{composer.title}</div>
                  <button type="button" className="company-detail__memo-submit" onClick={composer.onSubmit}>
                    {composer.submitLabel}
                  </button>
                </div>

                {composer.mode === 'textarea' ? (
                  <textarea
                    ref={composer.inputRef}
                    className="company-detail__memo-input"
                    value={composer.value}
                    onChange={(event) => composer.onChange(event.target.value)}
                    onKeyDown={composer.onKeyDown}
                    placeholder={composer.placeholder}
                    rows={composer.rows ?? 4}
                  />
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </aside>
  );
}
