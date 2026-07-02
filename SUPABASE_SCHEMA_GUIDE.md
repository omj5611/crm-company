# Supabase Schema Guide

## Purpose

This document describes the Supabase database structure used in this project.

Codex must read this file before modifying Supabase-related code. Do not guess table names, column names, relationships, or role rules. Use this schema as the source of truth.

---

## Database Overview

The project uses Supabase with the `public` schema.

Main domains:

- `brands`: 브랜드 기준 데이터
- `programs`: 교육과정 / 프로그램
- `applications`: 개인 지원 내역
- `company_applications`: 기업 지원 내역
- `companies`: 기업 정보
- `users`: 사용자 정보
- `instructors`: 강사 정보
- `program_teams`: 프로그램 운영팀 / 담당자 연결
- `banners`: 배너 관리
- `banner_settings`: 배너 설정
- `articles`: 아티클
- `faqs`, `faq_categories`: FAQ 관리
- `notices`, `notice_categories`: 공지사항 관리
- `reviews`: 후기 관리
- `interviews`, `interview_settings`, `interview_schedules`, `interview_date`: 면접 관련 기능
- `evaluations`: 평가 데이터
- `trainees`: 교육생 데이터
- `form_configs`, `form_response_events`: 폼 설정 및 응답 이벤트
- `pre_open_notifications`: 사전 알림 신청
- `sms_logs`: 문자 발송 로그
- `excel_download_logs`: 엑셀 다운로드 로그

---

## Important Rules for Codex

Codex must follow these rules when working with Supabase:

- Must not create or use columns that are not listed in this schema.
- Must not rename existing columns unless explicitly requested.
- Must not assume foreign key relationships that are not listed here.
- Must use `id` as the primary key for most tables unless the Primary Keys section says otherwise.
- Must respect RLS policies when writing queries.
- Must handle nullable fields safely.
- Must not expose sensitive user data in frontend logs.
- Must avoid using `any` for Supabase response data when a table type can be defined.
- Should create reusable service functions for repeated Supabase queries.
- Should separate Supabase query logic from UI components.

---

## Primary Keys

| Table | Primary Key | Constraint |
|---|---|---|
| applications | id | applications_pkey |
| articles | id | articles_pkey |
| banner_settings | id | banner_settings_pkey |
| banners | id | banners_pkey |
| brands | id | brands_pkey |
| categories | id | categories_pkey |
| companies | id | companies_pkey |
| company_applications | id | company_applications_pkey |
| email_verifications | id | email_verifications_pkey |
| evaluations | id | evaluations_pkey |
| excel_download_logs | id | excel_download_logs_pkey |
| faq_categories | id | faq_categories_pkey |
| faqs | id | faqs_pkey |
| feedbacks | id | feedbacks_pkey |
| form_configs | id | form_configs_pkey |
| form_response_events | id | form_response_events_pkey |
| guide_content | id | guide_content_pkey |
| instructors | id | instructors_pkey |
| interview_ai_reports | id | interview_ai_reports_pkey |
| interview_date | id | interview_date_pkey |
| interview_schedules | id | interview_schedules_pkey |
| interview_settings | id | interview_settings_pkey |
| interviews | id | interviews_pkey |
| jobs | id | jobs_pkey |
| kakao_signup_states | token | kakao_signup_states_pkey |
| mail_builder_saves | id | mail_builder_saves_pkey |
| notice_categories | id | notice_categories_pkey |
| notices | id | notices_pkey |
| participation_histories | id | participation_histories_pkey |
| password_reset_tokens | id | password_reset_tokens_pkey |
| phone_verifications | phone | phone_verifications_pkey |
| pre_open_notifications | id | pre_open_notifications_pkey |
| program_teams | id | program_teams_pkey |
| programs | id | courses_pkey |
| recent_articles | id | recent_articles_pkey |
| reviews | id | reviews_pkey |
| saved_articles | id | saved_articles_pkey |
| sms_logs | id | sms_logs_pkey |
| trainees | id | trainees_pkey |
| users | id | users_pkey |

---

## Enums

### `category`

Allowed values:

- `KDT`
- `INTERN`
- `PROJECT`
- `SeSAC`
- `ETC`

### `role`

Allowed values:

- `MASTER`
- `USER`
- `ADMIN`
- `COMPANY`

---

## Key Relationships

### Brand-based tables

The following tables are connected to `brands.id`:

- `applications.brand → brands.id`
- `articles.brand → brands.id`
- `banner_settings.brand → brands.id`
- `banners.brand → brands.id`
- `categories.brand → brands.id`
- `companies.brand → brands.id`
- `faq_categories.brand → brands.id`
- `faqs.brand → brands.id`
- `form_configs.brand → brands.id`
- `interview_schedules.brand → brands.id`
- `interview_settings.brand → brands.id`
- `notice_categories.brand → brands.id`
- `notices.brand → brands.id`
- `pre_open_notifications.brand → brands.id`
- `programs.brand → brands.id`
- `recent_articles.brand → brands.id`
- `reviews.brand → brands.id`
- `saved_articles.brand → brands.id`
- `users.brand → brands.id`

### Program-related tables

The following tables are connected to `programs.id`:

- `applications.program_id → programs.id`
- `banners.linked_program_id → programs.id`
- `company_applications.program_id → programs.id`
- `interview_ai_reports.program_id → programs.id`
- `interview_date.program_id → programs.id`
- `interview_schedules.program_id → programs.id`
- `interview_settings.program_id → programs.id`
- `interviews.program_id → programs.id`
- `participation_histories.program_id → programs.id`
- `program_teams.program_id → programs.id`
- `sms_logs.program_id → programs.id`
- `trainees.program_id → programs.id`

### Application-related tables

The following tables are connected to `applications.id`:

- `evaluations.application_id → applications.id`
- `interview_ai_reports.application_id → applications.id`
- `interview_schedules.application_id → applications.id`
- `trainees.application_id → applications.id`

### User-related tables

The following tables are connected to `users.id`:

- `applications.user_id → users.id`
- `excel_download_logs.downloaded_by → users.id`
- `programs.created_by → users.id`
- `program_teams.user_id → users.id`
- `pre_open_notifications.user_id → users.id`
- `recent_articles.user_id → users.id`
- `reviews.created_by → users.id`
- `saved_articles.user_id → users.id`
- `trainees.user_id → users.id`

### Company-related tables

The following tables are connected to `companies.id`:

- `participation_histories.company_id → companies.id`
- `users.company_id → companies.id`

### Category-related tables

The following relationships exist:

- `categories.parent_id → categories.id`
- `programs.category → categories.id`
- `notices.category_id → notice_categories.id`
- `faq_categories.faq_id → faqs.id`

---

## Known Relationship Warnings

The foreign key result includes some unusual relationships that must be handled carefully:

- `programs.brand → faqs.id`
- `programs.brand → faqs.brand`
- `programs.faq_id → faqs.brand`
- `programs.faq_id → faqs.id`
- `saved_articles.article_id → users.id`
- `saved_articles.id → users.id`

These relationships look potentially incorrect or overloaded.

Codex must not rely on these relationships unless the current code already depends on them. If a feature requires these relationships, Codex should inspect the current implementation first and propose a safe fix before modifying the database or query logic.

---

## Important Tables

### `applications`

Purpose: Stores individual application data.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| created_at | timestamptz | NO | now() |
| program_id | uuid | YES | null |
| name | text | YES | null |
| phone | text | YES | null |
| email | text | YES | null |
| description | text | YES | null |
| referral_source | text | YES | null |
| privacy_consent | boolean | YES | null |
| brand | text | YES | null |
| user_id | uuid | YES | null |
| application_type | text | NO | 'pre' |
| stage | text | NO | '대기' |
| evaluations | jsonb | YES | [] |
| form_data | jsonb | YES | {} |
| form_id | uuid | YES | null |
| program_teams | uuid | YES | null |

Relationships:

- `program_id → programs.id`
- `brand → brands.id`
- `user_id → users.id`
- `form_id → form_configs.id`
- `program_teams → program_teams.id`

Notes:

- `application_type` defaults to `pre`.
- `stage` defaults to `대기`.
- `evaluations` is stored as a JSONB array.
- `form_data` is stored as a JSONB object.

### `articles`

Purpose: Stores article content.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| title | text | YES | null |
| slug | text | YES | null |
| thumbnail_url | text | YES | null |
| content_html | text | YES | null |
| editor | text | YES | null |
| brand | text | NO | null |
| category | text | YES | null |

Relationships:

- `brand → brands.id`

### `banner_settings`

Purpose: Stores banner size settings by brand and banner type.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| brand | text | NO | null |
| type | text | NO | null |
| pc_width | integer | YES | null |
| pc_height | integer | YES | null |
| mo_width | integer | YES | null |
| mo_height | integer | YES | null |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| pc_max_width | integer | YES | null |
| mo_max_width | integer | YES | null |

Relationships:

- `brand → brands.id`

### `banners`

Purpose: Stores banner content and display settings.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| created_at | timestamptz | YES | now() |
| title | text | YES | null |
| subtitle | text | YES | null |
| image_url | text | YES | null |
| mobile_image_url | text | YES | null |
| link | text | YES | null |
| brand | text | NO | null |
| title_mobile | text | YES | null |
| is_draft | boolean | NO | false |
| is_hidden | boolean | NO | false |
| type | text | NO | 'main_top' |
| display_start_at | text | YES | null |
| display_end_at | text | YES | null |
| view_count | integer | NO | 0 |
| updated_at | timestamptz | YES | null |
| author_name | text | YES | null |
| author_team | text | YES | null |
| bottom_text | text | YES | null |
| image_only | boolean | NO | false |
| is_always_visible | boolean | NO | false |
| content | jsonb | YES | null |
| is_archived | boolean | NO | false |
| linked_program_id | uuid | YES | null |

Relationships:

- `brand → brands.id`
- `linked_program_id → programs.id`

Notes:

- `is_draft`, `is_hidden`, and `is_archived` must be considered when displaying banners.
- `content` is JSONB and should be parsed safely.
- `display_start_at` and `display_end_at` are text, not timestamp columns.

### `brands`

Purpose: Stores brand data.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | text | NO | null |
| name | text | NO | null |
| domain | text | NO | 'company.com' |
| logo | text | YES | null |

Notes:

- `id` is text, not uuid.
- Many tables reference `brands.id` through their `brand` column.

### `categories`

Purpose: Stores category hierarchy.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| brand | text | NO | '' |
| name | text | NO | null |
| slug | text | YES | null |
| parent_id | uuid | YES | null |
| level | bigint | YES | null |
| sort_order | bigint | YES | null |
| is_active | boolean | YES | null |

Relationships:

- `brand → brands.id`
- `parent_id → categories.id`

### `companies`

Purpose: Stores company profile and company manager information.

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| business_no | text | NO | null |
| user_id | uuid | YES | null |
| name | text | YES | null |
| status | text | NO | 'pending' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| address | text | YES | null |
| insured_count | text | YES | null |
| description | text | YES | null |
| revenue | text | YES | null |
| industry | text[] | YES | null |
| homepage | text | YES | null |
| manager_name | text | YES | null |
| manager_phone | text | YES | null |
| manager_email | text | YES | null |
| marketing_agreed | boolean | NO | false |
| intern_metadata | jsonb | NO | [] |
| documents | jsonb | NO | {} |
| brand | text | YES | null |
| industry_main | text | YES | null |
| industry_sub | text[] | YES | null |

Relationships:

- `brand → brands.id`

Notes:

- `business_no` is required.
- `status` defaults to `pending`.
- `industry` and `industry_sub` are text arrays.
- `intern_metadata` is a JSONB array.
- `documents` is a JSONB object.

### `company_applications`

Purpose: Stores company-side application data.

Known columns from the current schema extract:

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| created_at | timestamptz | NO | now() |
| program_id | uuid | YES | null |
| name | text | YES | null |

Relationships:

- `program_id → programs.id`
- `form_id → form_configs.id`

Warning:

The current column extract appears incomplete. Codex must not assume the rest of the columns in `company_applications`. Run the full column extraction query again if this table is needed.

---

## Full Foreign Key List

| Table | Column | References | Constraint |
|---|---|---|---|
| applications | brand | brands.id | applications_brand_fkey |
| applications | form_id | form_configs.id | applications_form_id_fkey |
| applications | program_id | programs.id | applications_program_id_fkey |
| applications | program_teams | program_teams.id | applications_program_teams_fkey |
| applications | user_id | users.id | applications_user_id_fkey |
| articles | brand | brands.id | articles_brand_fkey |
| banner_settings | brand | brands.id | banner_settings_brand_fkey |
| banners | brand | brands.id | banners_brand_fkey |
| banners | linked_program_id | programs.id | banners_linked_program_id_fkey |
| categories | brand | brands.id | categories_brand_fkey |
| categories | parent_id | categories.id | categories_parent_id_fkey |
| companies | brand | brands.id | companies_brand_fkey |
| company_applications | form_id | form_configs.id | company_applications_form_id_fkey |
| company_applications | program_id | programs.id | company_applications_program_id_fkey |
| evaluations | application_id | applications.id | evaluations_application_id_fkey |
| excel_download_logs | downloaded_by | users.id | excel_download_logs_downloaded_by_fkey |
| faq_categories | brand | brands.id | faq_categories_brand_fkey |
| faq_categories | faq_id | faqs.id | faq_categories_faq_id_fkey |
| faqs | brand | brands.id | faqs_brand_fkey |
| form_configs | brand | brands.id | form_configs_brand_fkey |
| form_response_events | form_id | form_configs.id | form_response_events_form_id_fkey |
| interview_ai_reports | application_id | applications.id | interview_ai_reports_application_id_fkey |
| interview_ai_reports | program_id | programs.id | interview_ai_reports_program_id_fkey |
| interview_date | program_id | programs.id | interview_date_program_id_fkey |
| interview_schedules | application_id | applications.id | interview_schedules_application_id_fkey |
| interview_schedules | brand | brands.id | interview_schedules_brand_fkey |
| interview_schedules | interview_setting_id | interview_settings.id | interview_schedules_interview_setting_id_fkey |
| interview_schedules | program_id | programs.id | interview_schedules_program_id_fkey |
| interview_settings | brand | brands.id | interview_settings_brand_fkey |
| interview_settings | program_id | programs.id | interview_settings_program_id_fkey |
| interview_settings | program_teams_id | program_teams.id | interview_settings_program_teams_id_fkey |
| interviews | program_id | programs.id | interviews_program_id_fkey |
| notice_categories | brand | brands.id | notice_categories_brand_fkey |
| notices | brand | brands.id | notices_brand_fkey |
| notices | category_id | notice_categories.id | notices_category_id_fkey |
| participation_histories | company_id | companies.id | participation_histories_company_id_fkey |
| participation_histories | program_id | programs.id | participation_histories_program_id_fkey |
| pre_open_notifications | brand | brands.id | pre_open_notifications_brand_fkey |
| pre_open_notifications | user_id | users.id | pre_open_notifications_user_id_fkey |
| program_teams | program_id | programs.id | program_teams_program_id_fkey |
| program_teams | user_id | users.id | program_teams_user_id_fkey |
| programs | brand | brands.id | programs_brand_fkey |
| programs | brand | faqs.id | fk_programs_faq_brand |
| programs | brand | faqs.brand | fk_programs_faq_brand |
| programs | category | categories.id | programs_category_fkey |
| programs | created_by | users.id | programs_created_by_fkey |
| programs | faq_id | faqs.brand | fk_programs_faq_brand |
| programs | faq_id | faqs.id | fk_programs_faq_brand |
| recent_articles | article_id | articles.id | recent_articles_article_id_fkey |
| recent_articles | brand | brands.id | recent_articles_brand_fkey |
| recent_articles | user_id | users.id | recent_articles_user_id_fkey |
| reviews | brand | brands.id | reviews_brand_fkey |
| reviews | created_by | users.id | reviews_created_by_fkey |
| saved_articles | article_id | users.id | saved_articles_article_id_fkey |
| saved_articles | brand | brands.id | saved_articles_brand_fkey |
| saved_articles | id | users.id | saved_articles_id_fkey |
| saved_articles | user_id | users.id | saved_articles_user_id_fkey |
| sms_logs | program_id | programs.id | sms_logs_program_id_fkey |
| trainees | application_id | applications.id | trainees_application_id_fkey |
| trainees | program_id | programs.id | trainees_program_id_fkey |
| trainees | user_id | users.id | trainees_user_id_fkey |
