import { Directory, File, Paths } from 'expo-file-system';

// expo-image-picker seçilen fotoğrafı uygulamanın ÖNBELLEK klasörüne kopyalar.
// Önbelleği hem iOS hem Android yer açmak için kendiliğinden temizleyebilir, bu
// yüzden o URI'yi kalıcı saymak günlükteki anı fotoğraflarının bir süre sonra
// kaybolmasına yol açıyordu. Kalıcı olması gereken fotoğrafları belge klasörüne
// kopyalıyoruz.
const MEDIA_DIR = 'pati-media';

const mediaDirectory = (): Directory => {
  const dir = new Directory(Paths.document, MEDIA_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
};

/** Bu URI uygulamanın kalıcı medya klasöründe mi? */
export const isPersistedPhoto = (uri?: string): boolean =>
  !!uri && uri.includes(`/${MEDIA_DIR}/`);

/**
 * Seçilen fotoğrafı kalıcı klasöre kopyalar ve yeni URI'yi döndürür.
 * Herhangi bir aksilikte özgün URI döner — yani en kötü ihtimalle davranış
 * eskisiyle aynı olur, kaydetme akışı hata vermez.
 */
export const persistPickedPhoto = (uri: string): string => {
  try {
    if (isPersistedPhoto(uri)) return uri;

    const source = new File(uri);
    if (!source.exists) return uri;

    const extension = source.extension || '.jpg';
    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${extension}`;
    const target = new File(mediaDirectory(), name);
    source.copy(target);
    return target.uri;
  } catch {
    return uri;
  }
};

/** Artık kullanılmayan kalıcı fotoğrafı siler (en-iyi-çaba). */
export const deletePersistedPhoto = (uri?: string): void => {
  if (!isPersistedPhoto(uri)) return;
  try {
    const file = new File(uri!);
    if (file.exists) file.delete();
  } catch {
    // yoksayılır — dosya silinemese de akış devam eder
  }
};
