export function TagDialog({
  className,
  panelClassName,
  titleId,
  eyebrow,
  title,
  description,
  isRemoval = false,
  showField = true,
  value,
  label = '메모',
  placeholder,
  confirmLabel,
  onChange,
  onClose,
  onConfirm,
}: {
  className?: string;
  panelClassName?: string;
  titleId: string;
  eyebrow: string;
  title: string;
  description: string;
  isRemoval?: boolean;
  showField?: boolean;
  value: string;
  label?: string;
  placeholder?: string;
  confirmLabel: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className={['company-tag-dialog', className].filter(Boolean).join(' ')}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={['company-tag-dialog__panel', panelClassName].filter(Boolean).join(' ')} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="company-tag-dialog__header">
          <div>
            <div className="company-tag-dialog__eyebrow">{eyebrow}</div>
            <h2 id={titleId} className="company-tag-dialog__title">
              {title}
            </h2>
          </div>
          <button type="button" className="company-tag-dialog__close" onClick={onClose} aria-label="태그 설정 창 닫기">
            ×
          </button>
        </div>

        <div className="company-tag-dialog__body">
          {isRemoval || !showField ? (
            <p className="company-tag-dialog__description">{description}</p>
          ) : (
            <>
              <p className="company-tag-dialog__description">{description}</p>

              <label className="company-tag-dialog__field">
                <span className="company-tag-dialog__label">{label}</span>
                <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={5} />
              </label>
            </>
          )}
        </div>

        <div className="company-tag-dialog__actions">
          <button type="button" className="company-tag-dialog__secondary" onClick={onClose}>
            취소
          </button>
          <button type="button" className="company-tag-dialog__primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
