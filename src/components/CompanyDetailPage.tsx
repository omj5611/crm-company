import type { CSSProperties, ReactNode } from 'react';

type CompanyContact = {
  name: string;
  department: string;
  phone: string;
  email: string;
  joinedAt: string;
  role: string;
  courses: string[];
};

type UploadedAsset = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy?: string;
  previewUrl?: string;
};

type Company = {
  name: string;
  address: string;
  representativeName: string;
  website: string;
  businessNo: string;
  employeeBand: string;
  industryPrimary: string;
  industryDetails: string[];
  description: string;
  membership: '가입완료' | '미가입';
  participation: '참여 이력 있음' | '참여 이력 없음';
  revenue: number;
  contacts?: CompanyContact[];
  updatedAt?: string;
};

type CompanyDetailSection = '기업 정보' | '담당자' | '참여 이력' | '파일' | '기업 로고';

const CURRENT_USER_NAME = '홍길동';
const COPY_ICON_SRC = '/assets/copy.svg';
const DEFAULT_COMPANY_UPDATED_AT = '2026.06.19 00:00';

const formatDateTimeDisplay = (value: string) => {
  if (!value) return '-';
  if (/\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}/.test(value)) return value;
  if (/\d{4}\.\d{2}\.\d{2}/.test(value)) return `${value} 00:00`;
  return value;
};

const normalizeCompanyContact = (contact: Partial<CompanyContact>): CompanyContact => ({
  name: contact.name ?? '',
  department: contact.department ?? '',
  phone: contact.phone ?? '',
  email: contact.email ?? '',
  joinedAt: contact.joinedAt ?? '',
  role: contact.role ?? '',
  courses: contact.courses ?? [],
});

const getFallbackCompanyContacts = (): CompanyContact[] => [
  {
    name: '오민진',
    department: '사업운영팀',
    role: '대표 담당자',
    phone: '010-1516-1516',
    email: 'anna@gmail.com',
    joinedAt: '2026.03.01 09:00',
    courses: ['프론트엔드 부트캠프', '서비스 기획 실무'],
  },
  {
    name: '김서연',
    department: '교육운영팀',
    role: '운영 담당자',
    phone: '010-2244-7788',
    email: 'sy.kim@company.com',
    joinedAt: '2026.04.17 10:30',
    courses: ['데이터 분석 입문', 'AI 활용 프로젝트'],
  },
  {
    name: '박지훈',
    department: '정산팀',
    role: '정산 담당자',
    phone: '010-8899-1122',
    email: 'jh.park@company.com',
    joinedAt: '2026.05.02 14:15',
    courses: ['백엔드 개발 심화'],
  },
];

export function CompanyDetailPage({
  company,
  uploadedFiles,
  uploadedLogos,
  activeSection,
  activeTaggedCompanies,
  openContactMenuId,
  onToggleContactMenu,
  onCloseContactMenu,
  onChangeSection,
  onCopyValue,
  onUploadFiles,
  onUploadLogo,
  onRemoveFile,
  onRemoveLogo,
  onOpenTagDialog,
  onOpenEditDialog,
  onOpenContactEdit,
  onRemoveContact,
}: {
  company: Company;
  uploadedFiles: UploadedAsset[];
  uploadedLogos: UploadedAsset[];
  activeSection: CompanyDetailSection;
  activeTaggedCompanies: string[];
  openContactMenuId: string | null;
  onToggleContactMenu: (menuId: string) => void;
  onCloseContactMenu: () => void;
  onChangeSection: (section: CompanyDetailSection) => void;
  onCopyValue: (value: string) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onUploadLogo: (files: FileList | File[]) => void;
  onRemoveFile: (assetId: string) => void;
  onRemoveLogo: (assetId: string) => void;
  onOpenTagDialog: (company: Company) => void;
  onOpenEditDialog: (section: CompanyDetailSection) => void;
  onOpenContactEdit: (companyBusinessNo: string, contactIndex: number) => void;
  onRemoveContact: (companyBusinessNo: string, contactIndex: number) => void;
}) {
  const detailTabs: CompanyDetailSection[] = ['기업 정보', '담당자', '참여 이력', '파일', '기업 로고'];
  const contacts: CompanyContact[] = company.contacts?.length ? company.contacts.map(normalizeCompanyContact) : getFallbackCompanyContacts();
  const companyInfoRows: Array<{
    label: string;
    value: string;
    span?: 1 | 2;
    copyable?: boolean;
    multiline?: boolean;
    renderValue?: ReactNode;
  }> = [
    { label: '기업명', value: company.name, span: 2 },
    { label: '사업자등록번호', value: company.businessNo, copyable: true, span: 2 },
    { label: '대표자명', value: company.representativeName, span: 2 },
    { label: '본사 주소', value: company.address, copyable: true, span: 2 },
    { label: '피보험자 수', value: company.employeeBand },
    { label: '매출액', value: `${company.revenue.toLocaleString('ko-KR')}원` },
    { label: '1차 업종', value: company.industryPrimary },
    {
      label: '세부 업종',
      value: company.industryDetails.join(', '),
      renderValue: (
        <div className="detail-chip-group" aria-label="세부 업종">
          {company.industryDetails.map((tag) => (
            <span className="detail-chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      label: '회사 소개',
      value: company.description,
      span: 2,
      multiline: true,
    },
    {
      label: '홈페이지 주소',
      value: company.website,
      renderValue:
        company.website && company.website.trim() && company.website.trim() !== '홈페이지' ? (
          <div className="detail-link-row">
            <a href="#" className="company-detail__link">
              <span>{company.website}</span>
              <ExternalLinkIcon />
            </a>
          </div>
        ) : (
          <div className="detail-link-row">
            <span className="company-detail__meta-value company-detail__link--muted">홈페이지 미등록</span>
          </div>
        ),
      span: 2,
    },
    { label: '필수 약관 동의', value: '동의', span: 2 },
    { label: '마케팅 정보 수신 동의', value: '동의', span: 2 },
    { label: '가입일자', value: formatDateTimeDisplay('2026.03.01 00:00'), span: 2 },
    { label: '업데이트 일자', value: formatDateTimeDisplay(company.updatedAt ?? DEFAULT_COMPANY_UPDATED_AT), span: 2 },
  ];
  const uploadedLogoSummary = uploadedLogos.length ? uploadedLogos[0].name : '로고 파일이 없습니다.';

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatUploadDate = (value: string) =>
    new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));

  return (
    <section className="company-detail-layout">
      <div className="company-detail">
        <div className="company-detail__header">
          <div className="company-detail__title-block">
            <div className="company-detail__title-row">
              <h1 className="company-detail__title">{company.name}</h1>
              <button
                type="button"
                className={`company-dot-button company-detail__tag-button ${
                  activeTaggedCompanies.includes(company.businessNo) ? 'company-dot-button--active' : ''
                }`}
                aria-label="태그 및 메모 추가"
                title="태그 및 메모 추가"
                onClick={() => onOpenTagDialog(company)}
              >
                <span className={`dot ${activeTaggedCompanies.includes(company.businessNo) ? 'dot--dark' : ''}`} aria-hidden="true" />
              </button>
            </div>
            <div className="company-detail__meta">
              <div className="company-detail__meta-item">
                <span className="company-detail__meta-label">홈페이지</span>
                {company.website && company.website.trim() && company.website.trim() !== '홈페이지' ? (
                  <a href="#" className="company-detail__link">
                    <span>{company.website}</span>
                    <ExternalLinkIcon />
                  </a>
                ) : (
                  <span className="company-detail__meta-value company-detail__link--muted">홈페이지 미등록</span>
                )}
              </div>
              <div className="company-detail__meta-item">
                <span className="company-detail__meta-label">주소</span>
                <span className="company-detail__meta-value">{company.address}</span>
              </div>
            </div>
          </div>

          <div className="company-detail__header-actions">
            <button
              type="button"
              className="icon-circle-button"
              aria-label="공유 링크 복사"
              onClick={() => onCopyValue(window.location.href)}
            >
              <img className="icon-circle-button__icon" src="/assets/share.svg" alt="" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="company-detail__tabs" role="tablist" aria-label="기업 상세 탭">
          {detailTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeSection === tab}
              className={`company-detail__tab ${activeSection === tab ? 'company-detail__tab--active' : ''}`}
              onClick={() => onChangeSection(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="company-detail__content">
          {activeSection === '기업 정보' ? (
            <section className="detail-section">
              <div className="detail-section__header">
                <h2 className="detail-section__title">기업 정보</h2>
                <button type="button" className="detail-section__action" onClick={() => onOpenEditDialog('기업 정보')}>
                  수정
                </button>
              </div>
              <div className="detail-grid">
                {companyInfoRows.map((row) => (
                  <div
                    className={`detail-row ${row.copyable ? 'detail-row--copyable' : ''} ${row.multiline ? 'detail-row--multiline' : ''} ${
                      row.span === 2 ? 'detail-row--span-2' : ''
                    }`}
                    key={row.label}
                  >
                    <div className="detail-row__label">{row.label}</div>
                    <div className="detail-row__value">
                      {row.renderValue ?? (
                        <>
                          <span>{row.value}</span>
                          {row.copyable ? (
                            <button type="button" className="copy-button" aria-label={`${row.label} 복사`} onClick={() => onCopyValue(row.value)}>
                              <MaskIcon src={COPY_ICON_SRC} className="copy-button__icon" />
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : activeSection === '담당자' ? (
            <section className="detail-section detail-section--contacts">
              <div className="detail-section__header">
                <h2 className="detail-section__title">담당자 정보</h2>
                <button type="button" className="detail-section__action" onClick={() => onOpenEditDialog('담당자')}>
                  수정
                </button>
              </div>
              {contacts.length ? (
                <div className="contact-card-grid">
                  {contacts.map((contact, index) => {
                    const contactMenuId = `${company.businessNo}-${index}`;
                    return (
                      <article className="contact-card" key={`${company.businessNo}-${contact.email}-${index}`}>
                        <div className="contact-card__header">
                          <div className="contact-card__heading">
                            <div className="contact-card__name">{contact.name}</div>
                            <span
                              className={`contact-card__badge ${
                                company.membership === '가입완료' ? 'contact-card__badge--active' : 'contact-card__badge--muted'
                              }`}
                            >
                              {company.membership === '가입완료' ? '가입 완료' : '미가입'}
                            </span>
                          </div>
                          <div
                            className="contact-card__menu"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="contact-card__menu-button"
                              aria-label="담당자 더보기"
                              aria-haspopup="menu"
                              aria-expanded={openContactMenuId === contactMenuId}
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleContactMenu(contactMenuId);
                              }}
                            >
                              <MoreIcon />
                            </button>
                            {openContactMenuId === contactMenuId ? (
                              <div className="contact-card__menu-dropdown" role="menu" aria-label="담당자 메뉴">
                                <button
                                  type="button"
                                  className="contact-card__menu-item"
                                  role="menuitem"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenContactEdit(company.businessNo, index);
                                    onCloseContactMenu();
                                  }}
                                >
                                  <MaskIcon src="/assets/edit.svg" className="contact-card__menu-icon" />
                                  <span>수정</span>
                                </button>
                                <button
                                  type="button"
                                  className="contact-card__menu-item contact-card__menu-item--danger"
                                  role="menuitem"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onRemoveContact(company.businessNo, index);
                                  }}
                                >
                                  <TrashIcon />
                                  <span>삭제</span>
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="contact-card__body">
                          {[
                            { label: '직급', value: contact.role || '미등록' },
                            { label: '부서', value: contact.department || '미등록' },
                            { label: '담당자 연락처', value: contact.phone },
                            { label: '담당자 이메일', value: contact.email },
                            {
                              label: '참여 교육과정',
                              value: contact.courses.length ? (
                                <div className="detail-chip-group" aria-label="참여 교육과정">
                                  {contact.courses.map((course) => (
                                    <span className="detail-chip detail-chip--primary" key={course}>
                                      {course}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                '참여 교육과정 없음'
                              ),
                            },
                            { label: '가입일자', value: formatDateTimeDisplay(contact.joinedAt) },
                          ].map((row) => (
                            <div className="contact-card__row" key={row.label}>
                              <span className="contact-card__label">{row.label}</span>
                              <div className="contact-card__value">{row.value}</div>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="detail-empty-card">담당자가 없습니다.</div>
              )}
            </section>
          ) : activeSection === '참여 이력' ? (
            <section className="detail-placeholder">
              <div className="detail-section__header">
                <h2 className="detail-section__title">참여 이력</h2>
                <button type="button" className="detail-section__action" onClick={() => onOpenEditDialog('참여 이력')}>
                  수정
                </button>
              </div>
              <div className="detail-empty-card">현재 참여 이력이 없습니다.</div>
            </section>
          ) : activeSection === '파일' ? (
            <section className="detail-section detail-upload-section">
              <div className="detail-section__header">
                <h2 className="detail-section__title">파일</h2>
                <label className="detail-section__action detail-section__action--file-upload">
                  파일 추가
                  <input
                    type="file"
                    multiple
                    onChange={(event) => {
                      if (event.target.files) {
                        onUploadFiles(event.target.files);
                        event.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
              <div className="file-table">
                <div className="file-table__head">
                  <span>미리보기</span>
                  <span>파일명</span>
                  <span>파일 사이즈</span>
                  <span>업로드 일자</span>
                  <span>등록자</span>
                  <span>관리</span>
                </div>
                <div className="file-table__body">
                  {uploadedFiles.length ? (
                    uploadedFiles.map((file) => (
                      <div className="file-table__row" key={file.id}>
                        <div className="file-table__preview">
                          {file.previewUrl ? (
                            <img src={file.previewUrl} alt={file.name} />
                          ) : (
                            <div className="file-table__placeholder">{(file.type || 'FILE').split('/')[0].slice(0, 4).toUpperCase()}</div>
                          )}
                        </div>
                        <div className="file-table__name" title={file.name}>
                          {file.name}
                        </div>
                        <div className="file-table__meta">{formatFileSize(file.size)}</div>
                          <div className="file-table__meta">{formatUploadDate(file.uploadedAt)}</div>
                          <div className="file-table__meta">{file.uploadedBy || CURRENT_USER_NAME}</div>
                          <button
                            type="button"
                            className="file-table__remove"
                            onClick={() => onRemoveFile(file.id)}
                          >
                            삭제
                          </button>
                      </div>
                    ))
                  ) : (
                    <div className="detail-empty-card">업로드된 파일이 없습니다.</div>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="detail-section detail-upload-section">
              <div className="detail-section__header">
                <h2 className="detail-section__title">기업 로고</h2>
                <label className="detail-section__action detail-section__action--file-upload">
                  로고 추가
                  <input
                    type="file"
                    multiple
                    onChange={(event) => {
                      if (event.target.files) {
                        onUploadLogo(event.target.files);
                        event.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
              {uploadedLogos.length ? (
                <div className="logo-card-grid">
                  {uploadedLogos.map((file) => (
                    <article className="logo-card" key={file.id}>
                      <div className="logo-card__preview">
                        {file.previewUrl ? <img src={file.previewUrl} alt={file.name} /> : <div className="logo-card__placeholder">LOGO</div>}
                      </div>
                      <div className="logo-card__body">
                        <div className="logo-card__name" title={file.name}>
                          {file.name}
                        </div>
                        <div className="logo-card__meta">파일 크기 {formatFileSize(file.size)}</div>
                        <div className="logo-card__meta">업로드 일자 {formatUploadDate(file.uploadedAt)}</div>
                        <div className="logo-card__meta">업로드 한 사람 {file.uploadedBy || CURRENT_USER_NAME}</div>
                      </div>
                      <div className="logo-card__actions">
                        <button type="button" className="logo-card__remove" onClick={() => onRemoveLogo(file.id)}>
                          삭제
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="detail-empty-card">로고 파일이 없습니다.</div>
              )}
            </section>
          )}
        </div>
      </div>
    </section>
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

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="4.5" cy="9" r="1.2" fill="currentColor" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      <circle cx="13.5" cy="9" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3.8 5.5H14.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.2 5.5V4.3C6.2 3.8 6.6 3.4 7.1 3.4H10.9C11.4 3.4 11.8 3.8 11.8 4.3V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 5.5L6 14C6 14.5 6.4 14.9 6.9 14.9H11.1C11.6 14.9 12 14.5 12 14L12.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 8.2V12.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 8.2V12.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5.5 3.5H3.5C2.94772 3.5 2.5 3.94772 2.5 4.5V10.5C2.5 11.0523 2.94772 11.5 3.5 11.5H9.5C10.0523 11.5 10.5 11.0523 10.5 10.5V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7.5 2.5H11.5V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 2.5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
