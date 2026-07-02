import { useMemo, useState } from 'react';

import { DetailMemoPanel } from './DetailMemoPanel';
import type { InstructorRow } from './InstructorManagementPage';

type InstructorDetailTab = '강사 정보' | '참여 이력' | '보낸문자';

const instructorDetailTabs: InstructorDetailTab[] = ['강사 정보', '참여 이력', '보낸문자'];

const getInstructorInitial = (name: string) => name.trim().charAt(0) || '강';

export function InstructorDetailPage({
  instructor,
  isTagged,
  memoText,
  onBack,
  onCopyValue,
  onOpenTag,
  onOpenMemo,
}: {
  instructor: InstructorRow;
  isTagged: boolean;
  memoText: string;
  onBack: () => void;
  onCopyValue: (value: string) => void;
  onOpenTag: () => void;
  onOpenMemo: () => void;
}) {
  const [activeTab, setActiveTab] = useState<InstructorDetailTab>('강사 정보');
  const [isMemoPanelCollapsed, setIsMemoPanelCollapsed] = useState(false);

  const participationRows = useMemo(
    () =>
      (instructor.participationItems ?? []).map((course, index) => ({
        id: `${instructor.id}-course-${index}`,
        course,
        lectureFields: instructor.lectureFields.join(', ') || '-',
        lectureRegions: instructor.lectureRegions.join(', ') || '-',
        organization: instructor.organization || '-',
      })),
    [instructor],
  );

  const hasMemo = Boolean(memoText.trim());

  return (
    <div className={`company-detail-layout ${isMemoPanelCollapsed ? 'company-detail-layout--memo-collapsed' : ''}`}>
      <section className="company-detail company-detail--frame" aria-label="강사/멘토 상세">
        <div className="company-detail__workspace">
          <div className="company-detail__main-column">
            <div className="company-detail__hero-shell">
              <div className="company-detail__banner" aria-hidden="true" />
              <div className="company-detail__header">
                <div className="company-detail__hero-logo-wrap instructor-detail__hero-logo-wrap">
                  <div className="company-detail__hero-logo">
                    <div className="company-detail__hero-logo-media instructor-detail__hero-logo-media">
                      <span className="instructor-detail__hero-initial">{getInstructorInitial(instructor.name)}</span>
                    </div>
                  </div>
                </div>

                <div className="company-detail__header-main">
                  <div className="company-detail__title-row">
                    <h3 className="company-detail__title">{instructor.name}</h3>
                    <span className={`company-detail__title-dot ${isTagged ? 'company-detail__title-dot--active' : ''}`} aria-hidden="true" />
                    <button type="button" className={`company-detail__tag-edit ${isTagged ? 'company-detail__tag-edit--active' : ''}`} onClick={onOpenTag}>
                      {isTagged ? '태그 해제' : '태그 추가'}
                    </button>
                  </div>
                  <p className="company-detail__header-subtitle">
                    {instructor.organization || '소속 없음'} / {instructor.lectureFields.join(', ') || '강의 분야 미등록'}
                  </p>
                </div>

                <div className="company-detail__header-actions" aria-label="강사/멘토 작업">
                  <button type="button" className="company-detail__quick-action" onClick={onBack}>
                    <img src="/assets/arrow-down.svg" alt="" aria-hidden="true" className="company-detail__quick-action-symbol instructor-detail__back-icon" />
                    <span className="company-detail__quick-action-label">목록</span>
                  </button>
                  <button type="button" className="company-detail__quick-action" onClick={() => onCopyValue(window.location.href)}>
                    <img src="/assets/share.svg" alt="" aria-hidden="true" className="company-detail__quick-action-symbol" />
                    <span className="company-detail__quick-action-label">공유</span>
                  </button>
                  <button type="button" className="company-detail__quick-action" onClick={() => onCopyValue(instructor.phone)}>
                    <img src="/assets/copy.svg" alt="" aria-hidden="true" className="company-detail__quick-action-symbol" />
                    <span className="company-detail__quick-action-label">연락처 복사</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="company-detail__tabs" role="tablist" aria-label="강사 상세 탭">
              {instructorDetailTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`company-detail__tab ${activeTab === tab ? 'company-detail__tab--active' : ''}`}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                >
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            {activeTab === '강사 정보' ? (
              <section className="company-detail__summary-card" aria-label="강사 정보 요약">
                <div className="company-detail__summary-head">
                  <div className="company-detail__summary-title">강사 정보</div>
                </div>

                <div className="company-detail__summary-grid">
                  <div className="company-detail__summary-row company-detail__summary-row--half">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">강사명</div>
                      <div className="company-detail__summary-value-box">
                        <div className="company-detail__summary-value">{instructor.name}</div>
                      </div>
                    </div>
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">생년월일</div>
                      <div className="company-detail__summary-value-box">
                        <div className="company-detail__summary-value">{instructor.birthDate || '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="company-detail__summary-row company-detail__summary-row--half">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">연락처</div>
                      <div className="company-detail__summary-value-box">
                        <div className="company-detail__summary-value">{instructor.phone}</div>
                        <button type="button" className="company-detail__copy-button" aria-label="연락처 복사" onClick={() => onCopyValue(instructor.phone)}>
                          <img src="/assets/copy.svg" alt="" aria-hidden="true" className="company-detail__copy-icon" />
                        </button>
                      </div>
                    </div>
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">이메일</div>
                      <div className="company-detail__summary-value-box">
                        <div className="company-detail__summary-value">{instructor.email}</div>
                        <button type="button" className="company-detail__copy-button" aria-label="이메일 복사" onClick={() => onCopyValue(instructor.email)}>
                          <img src="/assets/copy.svg" alt="" aria-hidden="true" className="company-detail__copy-icon" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="company-detail__summary-row company-detail__summary-row--half">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">소속(회사)</div>
                      <div className="company-detail__summary-value-box">
                        <div className="company-detail__summary-value">{instructor.organization || '소속 없음'}</div>
                      </div>
                    </div>
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">최종학력</div>
                      <div className="company-detail__summary-value-box">
                        <div className="company-detail__summary-value">{instructor.finalEducation || '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="company-detail__summary-row company-detail__summary-row--half">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">NCS 가입여부</div>
                      <div className="company-detail__summary-value-box company-detail__summary-value-box--status">
                        <span className={`company-detail__status-badge ${instructor.nscEnrolled ? 'company-detail__status-badge--active' : 'company-detail__status-badge--inactive'}`}>
                          {instructor.nscEnrolled ? '가입' : '미가입'}
                        </span>
                        <div className="company-detail__summary-value">{instructor.ncsField || '-'}</div>
                      </div>
                    </div>
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">강의 지역</div>
                      <div className="company-detail__summary-value-box company-detail__summary-value-box--multiline">
                        <div className="instructor-detail__chip-list">
                          {instructor.lectureRegions.length ? instructor.lectureRegions.map((region) => <span key={region} className="instructor-detail__chip">{region}</span>) : <div className="company-detail__summary-value">-</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="company-detail__summary-row">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">강의 분야 및 대상</div>
                      <div className="company-detail__summary-value-box company-detail__summary-value-box--multiline">
                        <div className="instructor-detail__chip-list">
                          {instructor.lectureFields.length ? instructor.lectureFields.map((field) => <span key={field} className="instructor-detail__chip instructor-detail__chip--primary">{field}</span>) : <div className="company-detail__summary-value">-</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="company-detail__summary-row">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">이력서 링크</div>
                      <div className="company-detail__summary-value-box">
                        {instructor.resumeUrl ? (
                          <a href={instructor.resumeUrl} target="_blank" rel="noreferrer" className="company-detail__summary-link">
                            {instructor.resumeUrl}
                          </a>
                        ) : (
                          <div className="company-detail__summary-value">-</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="company-detail__summary-row">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">이력서 및 증명 파일</div>
                      <div className="company-detail__summary-value-box company-detail__summary-value-box--multiline">
                        <div className="instructor-detail__file-list">
                          {[...instructor.resumeFiles, ...(instructor.certificateFiles ?? [])].length ? (
                            [...instructor.resumeFiles, ...(instructor.certificateFiles ?? [])].map((file) => (
                              <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="instructor-detail__file-pill">
                                {file.name}
                              </a>
                            ))
                          ) : (
                            <div className="company-detail__summary-value">첨부된 파일이 없습니다.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="company-detail__summary-row">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">학력</div>
                      <div className="company-detail__summary-value-box company-detail__summary-value-box--multiline">
                        <div className="instructor-detail__stack-list">
                          {instructor.educations?.length ? (
                            instructor.educations.map((education) => (
                              <div key={education.id} className="instructor-detail__stack-item">
                                <strong>{education.schoolName || '학교명 미등록'}</strong>
                                <span>{[education.department, education.major, education.degree].filter(Boolean).join(' / ') || '학과 · 전공 · 학위 미등록'}</span>
                                <span>{education.period || '교육기간 미등록'}</span>
                              </div>
                            ))
                          ) : (
                            <div className="company-detail__summary-value">등록된 학력 정보가 없습니다.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="company-detail__summary-row">
                    <div className="company-detail__summary-item">
                      <div className="company-detail__summary-label">경력</div>
                      <div className="company-detail__summary-value-box company-detail__summary-value-box--multiline">
                        <div className="instructor-detail__stack-list">
                          {instructor.careers?.length ? (
                            instructor.careers.map((career) => (
                              <div key={career.id} className="instructor-detail__stack-item">
                                <strong>{career.roleName || '경력명 미등록'}</strong>
                                <span>{career.workplace || '근무처 미등록'}</span>
                                <span>{career.period || '경력 기간 미등록'}</span>
                              </div>
                            ))
                          ) : (
                            <div className="company-detail__summary-value">등록된 경력 정보가 없습니다.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : activeTab === '참여 이력' ? (
              participationRows.length ? (
                <section className="company-detail__participation-section" aria-label="강사 참여 이력">
                  <div className="company-detail__file-toolbar">
                    <div className="company-detail__file-toolbar-copy">
                      <div className="company-detail__file-toolbar-title">참여 이력</div>
                      <div className="company-detail__file-toolbar-subtitle">강사가 참여한 교육과정을 한 번에 확인할 수 있습니다.</div>
                    </div>
                  </div>
                  <div className="company-detail__file-table-shell">
                    <table className="company-detail__participation-table">
                      <thead>
                        <tr>
                          <th scope="col">교육과정명</th>
                          <th scope="col">강의 분야 및 대상</th>
                          <th scope="col">강의 지역</th>
                          <th scope="col">소속</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participationRows.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <div className="company-detail__participation-course-cell">
                                <div className="company-detail__participation-thumb" aria-hidden="true">
                                  <img src="/assets/edu.svg" alt="" className="company-detail__participation-thumb-icon" />
                                  <span>{String(row.id).split('-').pop()}</span>
                                </div>
                                <div className="company-detail__participation-course" title={row.course}>
                                  {row.course}
                                </div>
                              </div>
                            </td>
                            <td><div className="company-detail__participation-text">{row.lectureFields}</div></td>
                            <td><div className="company-detail__participation-text">{row.lectureRegions}</div></td>
                            <td><div className="company-detail__participation-text">{row.organization}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                <div className="company-detail__tab-placeholder">현재 참여 이력이 없습니다.</div>
              )
            ) : (
              <div className="company-detail__tab-placeholder">보낸 문자가 없습니다.</div>
            )}
          </div>
        </div>
      </section>

      <DetailMemoPanel
        ariaLabel="강사 메모"
        title="메모"
        note="강사 태그 메모를 여기에서 빠르게 확인할 수 있습니다."
        items={
          hasMemo
            ? [
                {
                  id: `${instructor.id}-memo`,
                  date: '최근 메모',
                  author: '강사 태그',
                  body: memoText,
                },
              ]
            : []
        }
        emptyMessage="등록된 메모가 없습니다."
        collapsed={isMemoPanelCollapsed}
        onToggleCollapsed={setIsMemoPanelCollapsed}
        composer={{
          mode: 'action',
          title: '메모 관리',
          submitLabel: hasMemo ? '메모 수정' : '메모 추가',
          onSubmit: onOpenMemo,
        }}
      />
    </div>
  );
}
