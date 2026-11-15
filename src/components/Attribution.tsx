import styles from './Attribution.module.css';

// Licences and sources that ask for credit (SOURCES §3, §5, §2.6). Natural Earth is public domain and
// asks for nothing, the line is courtesy. Vikipedi (CC BY-SA 4.0) asks for credit and a link to the
// licence even though only facts are taken (2026-11-14). OpenStreetMap (ODbL) confirms some
// coordinates and asks for credit. CShapes (CC BY-NC-SA 4.0) draws the period borders and asks for
// credit, the licence link and the non-commercial terms (public/geo/borders/LICENSE.txt).
export function Attribution() {
  return (
    <p class={styles.attribution}>
      Altlık: Natural Earth. Metinler: T.B.M.M. Zabıt Cerideleri. Olay kaynakları: Vikipedi (
      <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.tr" rel="license noopener">
        CC BY-SA 4.0
      </a>
      ). Konumlar:{' '}
      <a href="https://www.openstreetmap.org/copyright" rel="license noopener">
        © OpenStreetMap katkıcıları
      </a>{' '}
      (ODbL). Sınırlar: CShapes 2.0, ETH Zürich (
      <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.tr" rel="license noopener">
        CC BY-NC-SA 4.0
      </a>
      ).
    </p>
  );
}
