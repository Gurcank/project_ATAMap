import styles from './Attribution.module.css';

// Licences and sources that ask for credit (SOURCES §3, §5, §2.6), plus the main official sources
// as a courtesy. Natural Earth is public domain and asks for nothing. CShapes (CC BY-NC-SA 4.0) draws
// the period borders and asks for credit, the licence link and the non-commercial terms
// (public/geo/borders/LICENSE.txt). Vikipedi (CC BY-SA 4.0) asks for credit and a licence link even
// though only facts are taken. MSB and Atatürk Araştırma Merkezi are official sources used for facts
// only (K5). Wikidata (CC0) asks for nothing; OpenStreetMap (ODbL) asks for credit. Public-domain
// books cited on single steps (Liman von Sanders, Britannica 1922, Milliyet) stay in those steps'
// citations only.
export function Attribution() {
  return (
    <p class={styles.attribution}>
      Altlık: Natural Earth. Sınırlar: CShapes 2.0, ETH Zürich (
      <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.tr" rel="license noopener">
        CC BY-NC-SA 4.0
      </a>
      ). Olaylar: T.C. Millî Savunma Bakanlığı Atatürk Sitesi, Atatürk Araştırma Merkezi; Vikipedi (
      <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.tr" rel="license noopener">
        CC BY-SA 4.0
      </a>
      ). Konumlar: Wikidata (CC0),{' '}
      <a href="https://www.openstreetmap.org/copyright" rel="license noopener">
        © OpenStreetMap katkıcıları
      </a>{' '}
      (ODbL). Metinler: T.B.M.M. Zabıt Cerideleri. Telgraf ve mektup künyeleri: Nutuk, 1929
      İngilizce baskı.
    </p>
  );
}
