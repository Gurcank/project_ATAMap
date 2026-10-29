import styles from './Attribution.module.css';

// Licences and sources that ask for credit (SOURCES §3, §5). Natural Earth is public domain and
// asks for nothing, the line is courtesy; CShapes (CC BY-NC-SA) joins here when borders arrive.
export function Attribution() {
  return (
    <p class={styles.attribution}>Altlık: Natural Earth. Metinler: T.B.M.M. Zabıt Cerideleri.</p>
  );
}
