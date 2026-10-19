import { ImageSourcePropType } from 'react-native';

// Mama Desteği ekranında gösterilen, bakılan sokak kedileri.
// Fotoğrafları `assets/support-cats/` klasörüne koyup buraya ekleyin. Liste boşsa
// galeri bölümü hiç gösterilmez. Örnek:
//   { name: 'Tarçın', note: '3 yaşında, mahallenin şefi', photo: require('../../assets/support-cats/tarcin.jpg') },
export interface SupportCat {
  name: string;
  note?: string;
  photo: ImageSourcePropType;
}

export const SUPPORT_CATS: SupportCat[] = [];
