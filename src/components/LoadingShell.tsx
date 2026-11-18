// Must stay identical to the static markup in index.html so the swap is invisible (no layout shift).
export function LoadingShell() {
  return (
    <>
      <div class="corner">
        <div class="status-skeleton cartouche" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div class="loading" role="status">
        <div>
          <p class="loading__title">Harita hazırlanıyor</p>
          <span class="loading__rule" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}
