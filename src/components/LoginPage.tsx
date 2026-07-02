import { useState, type FormEvent } from 'react';

type LoginPageProps = {
  onLogin: (payload: { email: string; password: string; rememberId: boolean }) => void | Promise<void>;
  onRequestPasswordReset: () => void;
  onRequestSignup: () => void;
  errorMessage?: string | null;
  isSubmitting?: boolean;
};

export function LoginPage({ onLogin, onRequestPasswordReset, onRequestSignup, errorMessage, isSubmitting = false }: LoginPageProps) {
  const savedEmail = typeof window !== 'undefined' ? window.localStorage.getItem('crm-login-email') ?? '' : '';
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberId, setRememberId] = useState(Boolean(savedEmail));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onLogin({ email, password, rememberId });
  };

  return (
    <main className="login-page" aria-label="로그인">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card__eyebrow">
          <span className="login-card__brand">CRM</span>
          <span className="login-card__brand-copy">통합관리솔루션</span>
        </div>

        <h1 id="login-title" className="login-card__title">
          로그인
        </h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-field__label">아이디(이메일)</span>
            <input
              className="login-field__control"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              disabled={isSubmitting}
            />
          </label>

          <label className="login-field">
            <span className="login-field__label">비밀번호</span>
            <div className="login-field__password-wrap">
              <input
                className="login-field__control"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="login-field__toggle"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
                disabled={isSubmitting}
              >
                <EyeIcon hidden={!showPassword} />
              </button>
            </div>
          </label>

          <button type="submit" className="login-form__submit">
            {isSubmitting ? '로그인 중' : '로그인'}
          </button>

          {errorMessage ? (
            <p className="login-form__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="login-form__footer">
            <label className="login-form__remember">
              <input
                type="checkbox"
                checked={rememberId}
                onChange={(event) => setRememberId(event.target.checked)}
                disabled={isSubmitting}
              />
              <span>아이디 저장</span>
            </label>

            <div className="login-form__links" aria-label="계정 도움말">
              <button type="button" className="login-form__link" onClick={onRequestPasswordReset} disabled={isSubmitting}>
                비밀번호 찾기
              </button>
              <span className="login-form__divider" aria-hidden="true">
                |
              </span>
              <button type="button" className="login-form__link" onClick={onRequestSignup} disabled={isSubmitting}>
                회원가입
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 11C3.8 6.5 7.2 4 11 4C14.8 4 18.2 6.5 20 11C18.2 15.5 14.8 18 11 18C7.2 18 3.8 15.5 2 11Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 11C8.5 9.61929 9.61929 8.5 11 8.5C12.3807 8.5 13.5 9.61929 13.5 11C13.5 12.3807 12.3807 13.5 11 13.5C9.61929 13.5 8.5 12.3807 8.5 11Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 18L18 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 11C3.8 6.5 7.2 4 11 4C14.8 4 18.2 6.5 20 11C18.2 15.5 14.8 18 11 18C7.2 18 3.8 15.5 2 11Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 8.5C12.3807 8.5 13.5 9.61929 13.5 11C13.5 12.3807 12.3807 13.5 11 13.5C9.61929 13.5 8.5 12.3807 8.5 11C8.5 9.61929 9.61929 8.5 11 8.5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
