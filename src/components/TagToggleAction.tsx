import type { MouseEvent } from 'react';

type DotMode = 'decorative' | 'button';

export function TagToggleAction({
  isTagged,
  activeLabel = '태그 해제',
  inactiveLabel = '태그 추가',
  dotMode = 'button',
  dotClassName,
  dotActiveClassName,
  markClassName,
  labelClassName,
  labelActiveClassName,
  ariaLabel,
  onClick,
  stopPropagation = false,
}: {
  isTagged: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  dotMode?: DotMode;
  dotClassName: string;
  dotActiveClassName?: string;
  markClassName: string;
  labelClassName: string;
  labelActiveClassName?: string;
  ariaLabel: string;
  onClick: (event?: MouseEvent<HTMLButtonElement>) => void;
  stopPropagation?: boolean;
}) {
  const dotClasses = [dotClassName, isTagged && dotActiveClassName].filter(Boolean).join(' ');
  const labelClasses = [labelClassName, isTagged && labelActiveClassName].filter(Boolean).join(' ');
  const label = isTagged ? activeLabel : inactiveLabel;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onClick(event);
  };

  return (
    <>
      {dotMode === 'button' ? (
        <button type="button" className={dotClasses} aria-label={ariaLabel} aria-pressed={isTagged} onClick={handleClick}>
          <span className={markClassName} aria-hidden="true" />
        </button>
      ) : (
        <span className={dotClasses} aria-hidden="true">
          <span className={markClassName} aria-hidden="true" />
        </span>
      )}
      <button type="button" className={labelClasses} aria-label={ariaLabel} onClick={handleClick}>
        <span>{label}</span>
      </button>
    </>
  );
}
