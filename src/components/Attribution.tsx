import styles from './Attribution.module.css';

// Licences and sources that ask for credit (SOURCES §3, §5, §2.6). Natural Earth is public domain and
// asks for nothing, the line is courtesy. Vikipedi (CC BY-SA 4.0) asks for credit and a link to the
// licence even though only facts are taken (2026-11-14). CShapes (CC BY-NC-SA) joins when borders
// arrive.
export function Attribution() {
  return (
    <p class={styles.attribution}>
      Altlık: Natural Earth. Metinler: T.B.M.M. Zabıt Cerideleri. Olay kaynakları: Vikipedi (
      <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.tr" rel="license noopener">
        CC BY-SA 4.0
      </a>
      ).
    </p>
  );
}
