import { readFileSync, writeFileSync } from 'node:fs';
let s = readFileSync('SOURCES.md', 'utf8');
const rep = (from, to) => { if (!s.includes(from)) throw new Error('yok: ' + from.slice(0, 40)); s = s.replace(from, to); };

rep(/Harf Kanunu 1 Kasım 1928'de kabul edildi ve Latin harflerinin zorunlu kullanımı 1 Ocak 1929'da başladığı için \(tarihler SOURCES dışı genel bilgi, iki kaynakla teyit edilmedi\) tutanağın aslı Arap harfli sayıldı\. PDF'nin kendisi diğer 1920-1927 PDF'leri gibi sonradan dizilmiş Latin harfli baskı \(2026-10-28, sayfa başlığı "İ:1 1\.11\.1928 C:1"\)\. Künye kartı olarak kaldı; bu varsayım açıktır\./.source ? '' : '', '');
