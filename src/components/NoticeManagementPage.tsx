import { useEffect, useMemo, useRef, useState } from 'react';

type NoticeCategory = '공지' | '점검' | '시스템' | '운영';

type NoticeAttachment = {
  id: string;
  name: string;
  type: string;
  url: string;
  sizeLabel: string;
  width: number;
  isImage: boolean;
};

type NoticeRecord = {
  id: string;
  title: string;
  category: NoticeCategory;
  content: string;
  attachments: NoticeAttachment[];
  authorName: string;
  authorRole: string;
  createdAt: string;
  isNew: boolean;
};

type NoticeDraft = {
  title: string;
  category: NoticeCategory;
  content: string;
  attachments: NoticeAttachment[];
};

const NOTICE_CATEGORIES: NoticeCategory[] = ['공지', '점검', '시스템', '운영'];

const INITIAL_NOTICES: NoticeRecord[] = [
  {
    id: 'notice-1',
    title: '정기 점검 안내',
    category: '점검',
    content: '# 서비스 점검 안내\n\n- 점검 시간: 07:00 ~ 08:00\n- 영향 범위: 일부 페이지 접속 지연\n\n업데이트 후 다시 확인해 주세요.',
    attachments: [],
    authorName: '오민진',
    authorRole: 'MASTER',
    createdAt: '2026-07-02T01:30:00.000Z',
    isNew: false,
  },
  {
    id: 'notice-2',
    title: '공지사항 카테고리 정리',
    category: '공지',
    content: '## 공지 카테고리 안내\n\n1. 공지\n2. 점검\n3. 시스템\n4. 운영',
    attachments: [],
    authorName: '오민진',
    authorRole: 'MASTER',
    createdAt: '2026-07-01T07:45:00.000Z',
    isNew: false,
  },
];

const NOTICE_STORAGE_KEY = 'crm-notices-v1';

function loadStoredNotices() {
  if (typeof window === 'undefined') return INITIAL_NOTICES;

  const storedValue = window.sessionStorage.getItem(NOTICE_STORAGE_KEY);
  if (!storedValue) return INITIAL_NOTICES;

  try {
    const parsed = JSON.parse(storedValue) as NoticeRecord[];
    if (!Array.isArray(parsed)) return INITIAL_NOTICES;

    return parsed.map((notice) => ({
      ...notice,
      isNew: Boolean(notice.isNew),
    }));
  } catch {
    return INITIAL_NOTICES;
  }
}

export function NoticeManagementPage({
  currentUser,
  onUnreadCountChange,
}: {
  currentUser?: {
    id: string;
    name: string;
    role: string;
    brand: string | null;
    organization: string | null;
  } | null;
  onUnreadCountChange?: (count: number) => void;
}) {
  const isMaster = currentUser?.role === 'MASTER';
  const [notices, setNotices] = useState<NoticeRecord[]>(() => loadStoredNotices());
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory | '전체'>('전체');
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [draft, setDraft] = useState<NoticeDraft>({
    title: '',
    category: '공지',
    content: '',
    attachments: [],
  });
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleNotices = useMemo(
    () => notices.filter((notice) => selectedCategory === '전체' || notice.category === selectedCategory),
    [notices, selectedCategory],
  );

  const sortedNotices = useMemo(
    () => [...visibleNotices].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [visibleNotices],
  );

  const unreadCount = useMemo(() => notices.filter((notice) => notice.isNew).length, [notices]);

  const selectedNotice = useMemo(
    () => notices.find((notice) => notice.id === selectedNoticeId) ?? null,
    [notices, selectedNoticeId],
  );

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    if (selectedNoticeId && !visibleNotices.some((notice) => notice.id === selectedNoticeId)) {
      setSelectedNoticeId(null);
    }
  }, [selectedNoticeId, visibleNotices]);

  const openRegisterDialog = () => {
    if (!isMaster) return;
    setIsRegisterOpen(true);
  };

  const closeRegisterDialog = () => {
    setIsRegisterOpen(false);
  };

  const updateDraft = (patch: Partial<NoticeDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const insertText = (snippet: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      updateDraft({ content: `${draft.content}${snippet}` });
      return;
    }

    const start = textarea.selectionStart ?? draft.content.length;
    const end = textarea.selectionEnd ?? draft.content.length;
    const nextContent = `${draft.content.slice(0, start)}${snippet}${draft.content.slice(end)}`;
    updateDraft({ content: nextContent });

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextCursor = start + snippet.length;
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const insertHeading = (level: 1 | 2 | 3) => {
    insertText(`${'#'.repeat(level)} `);
  };

  const insertBullet = () => {
    insertText('- ');
  };

  const insertNumber = () => {
    insertText('1. ');
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files?.length) return;

    const nextAttachments = Array.from(files).map((file, index) => ({
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `notice-attachment-${Date.now()}-${index}`,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      sizeLabel: formatFileSize(file.size),
      width: 320,
      isImage: file.type.startsWith('image/'),
    }));

    setDraft((current) => ({
      ...current,
      attachments: [...current.attachments, ...nextAttachments],
      content: current.content + nextAttachments.map((attachment) => `\n![${attachment.name}](attachment:${attachment.id})`).join(''),
    }));
  };

  const openNoticeDetail = (notice: NoticeRecord) => {
    setSelectedNoticeId(notice.id);
    if (notice.isNew) {
      setNotices((current) => current.map((item) => (item.id === notice.id ? { ...item, isNew: false } : item)));
    }
  };

  const closeNoticeDetail = () => {
    setSelectedNoticeId(null);
  };

  const saveNotice = () => {
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title || !content) return;

    const nextNotice: NoticeRecord = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `notice-${Date.now()}`,
      title,
      category: draft.category,
      content,
      attachments: [...draft.attachments],
      authorName: currentUser?.name ?? '관리자',
      authorRole: currentUser?.role ?? 'MASTER',
      createdAt: new Date().toISOString(),
      isNew: true,
    };

    setNotices((current) => [nextNotice, ...current]);
    setDraft({
      title: '',
      category: '공지',
      content: '',
      attachments: [],
    });
    setIsRegisterOpen(false);
    setSelectedNoticeId(nextNotice.id);
  };

  return (
    <section className="notice-page" aria-label="공지사항">
      <div className="notice-page__hero">
        <div className="notice-page__hero-copy">
          <p className="notice-page__eyebrow">내부 공지사항</p>
          <h1 className="notice-page__title">공지사항</h1>
          <p className="notice-page__description">관리자 공지사항을 확인하고, MASTER 계정은 새 공지사항을 등록할 수 있습니다.</p>
        </div>

        <div className="notice-page__hero-actions">
          <div className="notice-page__summary">
            <article className="notice-page__summary-card">
              <span className="notice-page__summary-label">전체 공지</span>
              <strong className="notice-page__summary-value">{notices.length}</strong>
            </article>
            <article className="notice-page__summary-card">
              <span className="notice-page__summary-label">표시 중</span>
              <strong className="notice-page__summary-value">{sortedNotices.length}</strong>
            </article>
          </div>
          {isMaster ? (
            <button type="button" className="notice-page__register-button" onClick={openRegisterDialog}>
              공지사항 등록
            </button>
          ) : null}
        </div>
      </div>

      <div className="notice-page__filters" role="tablist" aria-label="공지사항 카테고리">
        {(['전체', ...NOTICE_CATEGORIES] as const).map((category) => (
          <button
            key={category}
            type="button"
            className={`notice-page__filter ${selectedCategory === category ? 'notice-page__filter--active' : ''}`}
            aria-selected={selectedCategory === category}
            role="tab"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="notice-page__list">
        {sortedNotices.length ? (
          sortedNotices.map((notice) => (
            <button
              key={notice.id}
              type="button"
              className={`notice-card ${notice.isNew ? 'notice-card--new' : ''}`}
              onClick={() => openNoticeDetail(notice)}
            >
              <div className="notice-card__head">
                <div className="notice-card__head-copy">
                  <div className="notice-card__category-row">
                    <div className="notice-card__category">{notice.category}</div>
                    {notice.isNew ? <span className="notice-card__new-badge">N</span> : null}
                  </div>
                  <h2 className="notice-card__title">{notice.title}</h2>
                </div>
                <div className="notice-card__meta">
                  <span>{notice.authorName}</span>
                  <span>{formatNoticeDate(notice.createdAt)}</span>
                </div>
              </div>
              <p className="notice-card__excerpt">{extractNoticeExcerpt(notice.content)}</p>
              <div className="notice-card__footer">
                <span className="notice-card__attachment-count">첨부 {notice.attachments.length}</span>
                <span className="notice-card__role">{notice.authorRole}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="notice-page__empty">선택한 카테고리에 공지사항이 없습니다.</div>
        )}
      </div>

      {selectedNotice ? (
        <div
          className="notice-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeNoticeDetail();
            }
          }}
        >
          <article className="notice-modal__panel" role="dialog" aria-modal="true" aria-labelledby="notice-detail-title">
            <div className="notice-modal__header">
              <div className="notice-modal__header-copy">
                <div className="notice-modal__badge-row">
                  <span className="notice-modal__category">{selectedNotice.category}</span>
                  {selectedNotice.isNew ? <span className="notice-modal__new-badge">N</span> : null}
                </div>
                <h2 id="notice-detail-title" className="notice-modal__title">
                  {selectedNotice.title}
                </h2>
                <div className="notice-modal__meta">
                  <span>{selectedNotice.authorName}</span>
                  <span>{selectedNotice.authorRole}</span>
                  <span>{formatNoticeDate(selectedNotice.createdAt)}</span>
                  <span>첨부 {selectedNotice.attachments.length}</span>
                </div>
              </div>
              <button type="button" className="notice-modal__close" aria-label="공지사항 상세 닫기" onClick={closeNoticeDetail}>
                ×
              </button>
            </div>

            <div className="notice-modal__body">
              <div className="notice-modal__content notice-preview">{renderNoticePreview(selectedNotice.content, selectedNotice.attachments)}</div>

              {selectedNotice.attachments.length ? (
                <div className="notice-modal__attachments">
                  <div className="notice-modal__section-title">첨부파일</div>
                  <div className="notice-modal__attachment-list">
                    {selectedNotice.attachments.map((attachment) => (
                      <div key={attachment.id} className="notice-modal__attachment-item">
                        <strong>{attachment.name}</strong>
                        <span>{attachment.sizeLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}

      {isRegisterOpen ? (
        <div
          className="notice-dialog"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRegisterDialog();
            }
          }}
        >
          <div className="notice-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="notice-register-title">
            <div className="notice-dialog__header">
              <div>
                <div className="notice-dialog__eyebrow">공지 등록</div>
                <h2 id="notice-register-title" className="notice-dialog__title">
                  공지사항 작성
                </h2>
              </div>
              <button type="button" className="notice-dialog__close" aria-label="공지사항 작성 닫기" onClick={closeRegisterDialog}>
                ×
              </button>
            </div>

            <div className="notice-dialog__body">
              <div className="notice-dialog__editor">
                <label className="notice-dialog__field notice-dialog__field--wide">
                  <span className="notice-dialog__label">공지사항 제목</span>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => updateDraft({ title: event.target.value })}
                    placeholder="제목을 입력하세요"
                  />
                </label>

                <div className="notice-dialog__field notice-dialog__field--wide">
                  <span className="notice-dialog__label">공지사항 카테고리</span>
                  <div className="notice-dialog__chip-group" role="radiogroup" aria-label="공지사항 카테고리">
                    {NOTICE_CATEGORIES.map((category) => {
                      const isSelected = draft.category === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`notice-dialog__chip ${isSelected ? 'notice-dialog__chip--active' : ''}`}
                          onClick={() => updateDraft({ category })}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="notice-dialog__field notice-dialog__field--wide">
                  <span className="notice-dialog__label">첨부파일</span>
                  <div className="notice-dialog__attachment-bar">
                    <button type="button" className="notice-dialog__chip notice-dialog__chip--button" onClick={() => fileInputRef.current?.click()}>
                      첨부파일 선택
                    </button>
                    <span className="notice-dialog__attachment-hint">이미지, 문서, 압축 파일을 여러 개 선택할 수 있습니다.</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.txt"
                    className="notice-file-input"
                    onChange={(event) => handleFileChange(event.target.files)}
                  />
                  <div className="notice-attachment-list">
                    {draft.attachments.length ? (
                      draft.attachments.map((attachment) => (
                        <div key={attachment.id} className="notice-attachment">
                          <div className="notice-attachment__meta">
                            <strong>{attachment.name}</strong>
                            <span>{attachment.sizeLabel}</span>
                          </div>
                          {attachment.isImage ? (
                            <div className="notice-attachment__image-controls">
                              <img src={attachment.url} alt={attachment.name} style={{ width: `${attachment.width}px` }} />
                              <label className="notice-attachment__range">
                                <span>이미지 너비</span>
                                <input
                                  type="range"
                                  min="160"
                                  max="960"
                                  step="10"
                                  value={attachment.width}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      attachments: current.attachments.map((item) =>
                                        item.id === attachment.id ? { ...item, width: Number(event.target.value) } : item,
                                      ),
                                    }))
                                  }
                                />
                              </label>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            className="notice-attachment__remove"
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                attachments: current.attachments.filter((item) => item.id !== attachment.id),
                              }))
                            }
                          >
                            삭제
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="notice-attachment-list__empty">첨부파일이 없습니다.</div>
                    )}
                  </div>
                </div>

                <div className="notice-dialog__field notice-dialog__field--wide">
                  <span className="notice-dialog__label">에디터</span>
                  <div className="notice-editor-toolbar" aria-label="에디터 도구">
                    <button type="button" className="notice-editor-toolbar__button" onClick={() => insertHeading(1)}>
                      H1
                    </button>
                    <button type="button" className="notice-editor-toolbar__button" onClick={() => insertHeading(2)}>
                      H2
                    </button>
                    <button type="button" className="notice-editor-toolbar__button" onClick={() => insertHeading(3)}>
                      H3
                    </button>
                    <button type="button" className="notice-editor-toolbar__button" onClick={insertBullet}>
                      - 목록
                    </button>
                    <button type="button" className="notice-editor-toolbar__button" onClick={insertNumber}>
                      1. 목록
                    </button>
                    <button type="button" className="notice-editor-toolbar__button" onClick={() => fileInputRef.current?.click()}>
                      이미지 / 파일 추가
                    </button>
                  </div>

                  <div className="notice-editor__canvas" aria-label="에디터 입력 내용">
                    {draft.content.trim() || draft.attachments.length ? (
                      renderNoticePreview(draft.content, draft.attachments)
                    ) : (
                      <div className="notice-editor__canvas-empty">텍스트를 입력하면 이 영역에 이미지와 함께 표시됩니다.</div>
                    )}
                  </div>

                  <textarea
                    ref={contentRef}
                    className="notice-editor"
                    value={draft.content}
                    onChange={(event) => updateDraft({ content: event.target.value })}
                    placeholder="# 제목\n## 소제목\n- 항목\n1. 순서\n![이미지](attachment:...)"
                  />
                </div>
              </div>

              <div className="notice-dialog__preview">
                <div className="notice-dialog__preview-head">
                  <span className="notice-dialog__label">미리보기</span>
                </div>
                <div className="notice-preview">
                  {renderNoticePreview(draft.content, draft.attachments)}
                </div>
              </div>
            </div>

            <div className="notice-dialog__actions">
              <button type="button" className="notice-dialog__button notice-dialog__button--secondary" onClick={closeRegisterDialog}>
                취소
              </button>
              <button type="button" className="notice-dialog__button notice-dialog__button--primary" onClick={saveNotice}>
                등록
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function extractNoticeExcerpt(content: string) {
  return content
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/!\[[^\]]*\]\(attachment:[^)]+\)/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 120);
}

function formatNoticeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderNoticePreview(content: string, attachments: NoticeAttachment[]) {
  const attachmentMap = new Map(attachments.map((attachment) => [attachment.id, attachment]));
  const lines = content.split('\n');

  return (
    <div className="notice-preview__content">
      {lines.map((line, index) => {
        const heading3 = line.match(/^###\s+(.*)$/);
        if (heading3) {
          return (
            <h3 key={`${index}-${line}`} className="notice-preview__heading notice-preview__heading--h3">
              {heading3[1]}
            </h3>
          );
        }

        const heading2 = line.match(/^##\s+(.*)$/);
        if (heading2) {
          return (
            <h2 key={`${index}-${line}`} className="notice-preview__heading notice-preview__heading--h2">
              {heading2[1]}
            </h2>
          );
        }

        const heading1 = line.match(/^#\s+(.*)$/);
        if (heading1) {
          return (
            <h1 key={`${index}-${line}`} className="notice-preview__heading notice-preview__heading--h1">
              {heading1[1]}
            </h1>
          );
        }

        const bullet = line.match(/^-+\s+(.*)$/);
        if (bullet) {
          return (
            <div key={`${index}-${line}`} className="notice-preview__bullet">
              <span aria-hidden="true">•</span>
              <span>{bullet[1]}</span>
            </div>
          );
        }

        const numbered = line.match(/^(\d+)\.\s+(.*)$/);
        if (numbered) {
          return (
            <div key={`${index}-${line}`} className="notice-preview__numbered">
              <span aria-hidden="true">{`${numbered[1]}.`}</span>
              <span>{numbered[2]}</span>
            </div>
          );
        }

        const imageMatch = line.match(/!\[([^\]]*)\]\(attachment:([^)]+)\)/);
        if (imageMatch) {
          const attachment = attachmentMap.get(imageMatch[2]);
          if (!attachment) return null;

          return (
            <figure key={`${index}-${line}`} className="notice-preview__figure">
              <img src={attachment.url} alt={imageMatch[1] || attachment.name} style={{ width: `${attachment.width}px` }} />
              <figcaption>{attachment.name}</figcaption>
            </figure>
          );
        }

        if (!line.trim()) {
          return <div key={`${index}-${line}`} className="notice-preview__spacer" aria-hidden="true" />;
        }

        return (
          <p key={`${index}-${line}`} className="notice-preview__paragraph">
            {line}
          </p>
        );
      })}
    </div>
  );
}
