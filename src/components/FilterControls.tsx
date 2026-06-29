import { useState, type ReactNode } from 'react';

type RegionCity = {
  name: string;
  districts: Array<{
    name: string;
    dongs: string[];
  }>;
};

export function FilterSection({
  title,
  icon,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon?: ReactNode;
  summary?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="filter-section">
      <button type="button" className="filter-section__header" onClick={onToggle}>
        <span className="filter-section__title">
          {icon ? icon : null}
          <span>{title}</span>
        </span>
        {summary ? <span className="filter-section__summary">{summary}</span> : null}
        <ChevronIcon rotated={open} />
      </button>
      {open ? <div className="filter-section__body">{children}</div> : null}
    </section>
  );
}

export function RegionPicker({
  regionSearch,
  onRegionSearchChange,
  cities,
  activeCityIndex,
  onCityChange,
  activeDistrictName,
  onDistrictChange,
  selectedRegions,
  onToggleRegion,
  onRemoveRegion,
  onClearSelected,
  onSelectCityAll,
  onSelectDistrict,
}: {
  regionSearch: string;
  onRegionSearchChange: (value: string) => void;
  cities: RegionCity[];
  activeCityIndex: number;
  onCityChange: (index: number) => void;
  activeDistrictName: string;
  onDistrictChange: (value: string) => void;
  selectedRegions: string[];
  onToggleRegion: (city: string, district: string, dong: string) => void;
  onRemoveRegion: (value: string) => void;
  onClearSelected: () => void;
  onSelectCityAll: (cityName: string) => void;
  onSelectDistrict: (cityName: string, districtName: string) => void;
}) {
  const activeCity = cities[activeCityIndex] ?? cities[0];
  const query = regionSearch.trim().toLowerCase();
  const visibleCities = query
    ? cities
        .map((city, index) => ({ city, index }))
        .filter(({ city }) =>
          city.name.toLowerCase().includes(query) ||
          city.districts.some((district) => district.name.toLowerCase().includes(query) || district.dongs.some((dong) => dong.toLowerCase().includes(query))),
        )
    : cities.map((city, index) => ({ city, index }));
  const districtList = activeCity.districts.filter((district) => {
    if (!query) return true;
    return district.name.toLowerCase().includes(query) || district.dongs.some((dong) => dong.toLowerCase().includes(query));
  });
  const cityScope = regionScopeLabel(activeCity.name);
  const isCityScopeSelected = selectedRegions.includes(cityScope);

  return (
    <div className="region-picker">
      <div className="region-picker__search">
        <SearchIcon />
        <input value={regionSearch} onChange={(event) => onRegionSearchChange(event.target.value)} placeholder="지역 검색" />
      </div>

      <div className="region-picker__layout">
        <div className="region-picker__city-list">
          {visibleCities.map(({ city, index }) => (
            <button
              key={city.name}
              type="button"
              className={`region-picker__city ${index === activeCityIndex ? 'region-picker__city--active' : ''}`}
              onClick={() => onCityChange(index)}
            >
              {city.name}
            </button>
          ))}
        </div>

        <div className="region-picker__district-panel">
          <div className="region-picker__district-list">
            <button
              type="button"
              className={`region-picker__district region-picker__district--all ${isCityScopeSelected ? 'region-picker__district--active' : ''}`}
              onClick={() => onSelectCityAll(activeCity.name)}
            >
              {cityScope}
            </button>
            {districtList.map((district) => {
              const districtLabel = districtScopeLabel(activeCity.name, district.name);
              const districtSelected =
                selectedRegions.includes(districtLabel) || district.dongs.some((dong) => selectedRegions.includes(dongScopeLabel(activeCity.name, district.name, dong)));
              const districtOpen = activeDistrictName === district.name;

              return (
                <div key={district.name} className="region-picker__district-group">
                  <button
                    type="button"
                    className={`region-picker__district ${districtSelected ? 'region-picker__district--active' : ''}`}
                    onClick={() => {
                      onDistrictChange(district.name);
                      onSelectDistrict(activeCity.name, district.name);
                    }}
                  >
                    <span>{district.name}</span>
                  </button>
                  {districtOpen ? (
                    <div className="region-picker__dong-list region-picker__dong-list--inline">
                      {district.dongs
                        .filter((dong) => {
                          if (!query) return true;
                          return dong.toLowerCase().includes(query);
                        })
                        .map((dong) => {
                          const regionLabel = dongScopeLabel(activeCity.name, district.name, dong);
                          const selected = selectedRegions.includes(regionLabel);
                          return (
                            <button
                              key={dong}
                              type="button"
                              className={`region-picker__dong ${selected ? 'region-picker__dong--selected' : ''}`}
                              onClick={() => onToggleRegion(activeCity.name, district.name, dong)}
                            >
                              {dong}
                            </button>
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
  );
}

export function CheckboxOptions({
  options,
  selected,
  onToggle,
  onRemove,
  selectedLabel,
  showDirectInputs = false,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onRemove: (value: string) => void;
  selectedLabel: string;
  showDirectInputs?: boolean;
}) {
  const [directMin, setDirectMin] = useState('');
  const [directMax, setDirectMax] = useState('');
  const formatDirectInput = (value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('ko-KR').format(Number(digits));
  };

  return (
    <div className="checkbox-group">
      <div className="checkbox-list">
        {options.map((option) => (
          <label className="checkbox-option" key={option}>
            <input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>

      {showDirectInputs ? (
        <div className="direct-input-grid">
          <div className="direct-input">
            <span>최소</span>
            <input
              type="text"
              inputMode="numeric"
              value={directMin}
              onChange={(event) => setDirectMin(formatDirectInput(event.target.value))}
              placeholder="0"
            />
          </div>
          <div className="direct-input">
            <span>최대</span>
            <input
              type="text"
              inputMode="numeric"
              value={directMax}
              onChange={(event) => setDirectMax(formatDirectInput(event.target.value))}
              placeholder="0"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function IndustryHierarchyFilter({
  groups,
  selectedPrimaries,
  selectedDetails,
  openPrimaries,
  onTogglePrimary,
  onToggleDetail,
  onToggleOpen,
  onRemovePrimary,
  onRemoveDetail,
}: {
  groups: Array<{ primary: string; details: string[] }>;
  selectedPrimaries: string[];
  selectedDetails: string[];
  openPrimaries: string[];
  onTogglePrimary: (primary: string, details: string[], checked: boolean) => void;
  onToggleDetail: (primary: string, details: string[], detail: string) => void;
  onToggleOpen: (value: string) => void;
  onRemovePrimary: (value: string, details: string[]) => void;
  onRemoveDetail: (value: string) => void;
}) {
  return (
    <div className="industry-filter">
      <div className="industry-filter__list">
        {groups.map((group) => {
          const allDetailsSelected = group.details.every((detail) => selectedDetails.includes(detail));
          const isSelected = selectedPrimaries.includes(group.primary) || allDetailsSelected;
          const isOpen = openPrimaries.includes(group.primary) || isSelected;
          const selectedCount = group.details.filter((detail) => selectedDetails.includes(detail)).length;

          return (
            <div className="industry-filter__group" key={group.primary}>
              <div
                className={`industry-filter__primary-row ${isSelected ? 'industry-filter__primary-row--selected' : ''}`}
                onClick={() => onToggleOpen(group.primary)}
                role="presentation"
              >
                <label className="industry-filter__primary-check" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onTogglePrimary(group.primary, group.details, event.currentTarget.checked)}
                  />
                </label>
                <button
                  type="button"
                  className="industry-filter__primary-label"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleOpen(group.primary);
                  }}
                >
                  <span>{group.primary}</span>
                  {selectedCount > 0 ? <span className="industry-filter__primary-count">{selectedCount}</span> : null}
                </button>
                <button
                  type="button"
                  className={`industry-filter__chevron ${isOpen ? 'industry-filter__chevron--open' : ''}`}
                  aria-label={`${group.primary} 펼치기`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleOpen(group.primary);
                  }}
                >
                  <ChevronIcon rotated={isOpen} />
                </button>
              </div>

              {isOpen ? (
                <div className="industry-filter__detail-list">
                  {group.details.map((detail) => (
                    <label className="industry-filter__detail" key={detail}>
                      <input
                        type="checkbox"
                        checked={selectedDetails.includes(detail)}
                        onChange={() => onToggleDetail(group.primary, group.details, detail)}
                      />
                      <span>{detail}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

    </div>
  );
}

export function RevenueFilter({
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  return (
    <div className="revenue-filter">
      <div className="direct-input-grid direct-input-grid--revenue">
        <div className="direct-input">
          <span>최소 매출</span>
          <input
            value={min}
            onChange={(event) => onMinChange(event.target.value)}
            type="text"
            inputMode="numeric"
            placeholder="0"
          />
        </div>
        <div className="direct-input">
          <span>최대 매출</span>
          <input
            value={max}
            onChange={(event) => onMaxChange(event.target.value)}
            type="text"
            inputMode="numeric"
            placeholder="0"
          />
        </div>
      </div>
      <div className="revenue-filter__hint">단위는 원 기준으로 입력하세요.</div>
    </div>
  );
}

export function SelectedChips({
  label,
  values,
  onRemove,
}: {
  label: string;
  values: string[];
  onRemove: (value: string) => void;
}) {
  return (
    <div className="selected-chip-wrap">
      <div className="selected-chip-wrap__label">{label}</div>
      <div className="selected-chip-list">
        {values.length ? (
          values.map((value) => (
            <button type="button" className="selected-chip" key={value} onClick={() => onRemove(value)}>
              <span>{value}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))
        ) : (
          <div className="selected-region-empty">선택된 항목이 없습니다.</div>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.75" stroke="#475569" strokeWidth="1.5" />
      <path d="M12.75 12.75L16.5 16.5" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
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

const regionScopeLabel = (city: string) => `${city} 전체`;
const districtScopeLabel = (city: string, district: string) => `${city} ${district}`;
const dongScopeLabel = (city: string, district: string, dong: string) => `${city} ${district} ${dong}`;
