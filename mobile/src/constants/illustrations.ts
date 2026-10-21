import { ImageSourcePropType } from 'react-native';

// Uygulamadaki suluboya illüstrasyonlar. Hareketli olanlar animasyonlu WebP'dir;
// iOS ve Android'de oynaması için expo-image ile gösterilmelidir.
// `ratio` = genişlik / yükseklik; görselin kırpılmadan sığması için kullanılır.
export interface Illustration {
  source: ImageSourcePropType;
  ratio: number;
}

export const illustrations = {
  // Hareketli
  dostlar:      { source: require('../../assets/anim/pati-dostlar.webp'),  ratio: 640 / 480 },
  kediYuruyor:  { source: require('../../assets/anim/kedi-yuruyor.webp'),  ratio: 520 / 300 },
  kopekYuruyor: { source: require('../../assets/anim/kopek-yuruyor.webp'), ratio: 440 / 382 },
  kusUcuyor:    { source: require('../../assets/anim/kus-ucuyor.webp'),    ratio: 480 / 344 },
  // Sabit
  girisKedi:     { source: require('../../assets/illustrations/giris-kedi.jpg'),     ratio: 900 / 480 },
  kediYarabandi: { source: require('../../assets/illustrations/kedi-yarabandi.jpg'), ratio: 520 / 779 },
  kediOturan:    { source: require('../../assets/illustrations/kedi-oturan.jpg'),    ratio: 520 / 779 },
  kediYuruyen:   { source: require('../../assets/cat-walk.png'),                     ratio: 900 / 491 },
} satisfies Record<string, Illustration>;
