// Mama desteği için mağaza ürünleri (tüketilebilir / consumable).
//
// Bu ID'ler App Store Connect ve Google Play Console'da birebir aynı
// tanımlanmalı. `fallbackPrice` yalnızca mağazaya bağlanılamadığında gösterilir;
// gerçek fiyat her zaman mağazadan gelir.
export interface SupportProduct {
  sku: string;
  emoji: string;
  title: string;
  description: string;
  fallbackPrice: string;
}

export const SUPPORT_PRODUCTS: SupportProduct[] = [
  {
    sku: 'pati.support.food_small',
    emoji: '🥣',
    title: 'Bir kap mama',
    description: 'Bir kedinin bir öğünü',
    fallbackPrice: '249 ₺',
  },
  {
    sku: 'pati.support.food_medium',
    emoji: '🐟',
    title: 'Bir haftalık mama',
    description: 'Bir kedinin bir haftası',
    fallbackPrice: '999 ₺',
  },
  {
    sku: 'pati.support.food_large',
    emoji: '🛍️',
    title: 'Bir torba mama',
    description: '15 kg kuru mama',
    fallbackPrice: '2.000 ₺',
  },
];

export const SUPPORT_SKUS = SUPPORT_PRODUCTS.map((p) => p.sku);
