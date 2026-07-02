import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownSelectProps = {
  label: string;
  value: string;
  placeholder: string;
  options: DropdownOption[];
  onChange: (nextValue: string) => void;
  ariaInvalid?: boolean;
  disabled?: boolean;
};

type DropdownMenuPosition = {
  left: number;
  top: number;
  maxHeight: number;
};

const DROPDOWN_EDGE_PADDING = 16;
const DROPDOWN_GAP = 6;
const DROPDOWN_MIN_WIDTH = 280;
const DROPDOWN_MAX_HEIGHT = 320;

export function DropdownSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  ariaInvalid,
  disabled = false,
}: DropdownSelectProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<DropdownMenuPosition | null>(null);
  const selectedOption = options.find((option) => option.value === value);

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
      const menuWidth = Math.min(Math.max(menuRect.width || DROPDOWN_MIN_WIDTH, DROPDOWN_MIN_WIDTH), window.innerWidth - DROPDOWN_EDGE_PADDING * 2);
      const menuHeight = Math.min(Math.max(menuRect.height || 0, 0), DROPDOWN_MAX_HEIGHT);

      let left = rootRect.left;
      left = Math.min(left, window.innerWidth - menuWidth - DROPDOWN_EDGE_PADDING);
      left = Math.max(left, DROPDOWN_EDGE_PADDING);

      let top = rootRect.bottom + DROPDOWN_GAP;
      const preferredBottom = top + menuHeight;
      if (preferredBottom > window.innerHeight - DROPDOWN_EDGE_PADDING) {
        const aboveTop = rootRect.top - DROPDOWN_GAP - menuHeight;
        top = aboveTop >= DROPDOWN_EDGE_PADDING ? aboveTop : Math.max(DROPDOWN_EDGE_PADDING, window.innerHeight - menuHeight - DROPDOWN_EDGE_PADDING);
      }

      const maxHeight = Math.max(120, window.innerHeight - top - DROPDOWN_EDGE_PADDING);
      setMenuPosition({ left, top, maxHeight });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, options.length, value]);

  const displayLabel = selectedOption?.label || placeholder;
  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          className="filter-dropdown__menu filter-dropdown__menu--insured dropdown-select__menu dropdown-select__menu--floating"
          role="menu"
          aria-label={`${label} 메뉴`}
          style={
            menuPosition
              ? {
                  position: 'fixed',
                  left: `${menuPosition.left}px`,
                  top: `${menuPosition.top}px`,
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
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`filter-dropdown__item ${isSelected ? 'filter-dropdown__item--active' : ''}`}
                role="menuitem"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
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
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{displayLabel}</span>
        <img src="/assets/arrow-down.svg" alt="" aria-hidden="true" className="toggle-arrow-icon" />
      </button>

      {menu}
    </div>
  );
}
