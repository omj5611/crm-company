export function BlankPage({
  title = '페이지 준비 중',
  description = '이 메뉴는 아직 독립 페이지로 분리되지 않았습니다.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="blank-page" aria-label={title}>
      <div className="blank-page__card">
        <div className="blank-page__eyebrow">페이지</div>
        <h1 className="blank-page__title">{title}</h1>
        <p className="blank-page__description">{description}</p>
      </div>
    </section>
  );
}
