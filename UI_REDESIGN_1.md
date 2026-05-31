# Pati — UI Redesign Guide (Figma → React Native)

> **Goal:** Restyle every screen in the existing React Native (Expo) app to match the finished Figma design.
> The Figma design is **web** (React + Tailwind). This app is **React Native**. You must **translate**, not copy — see the translation rules below.
> **Do NOT change any backend code, API calls, data fetching, navigation logic, or business logic.** Only touch presentation: styles, layout, JSX structure inside screens, and the shared UI components.
> All user-facing strings are **Turkish** and must stay exactly as written here.

---

## 1. Design Tokens (source of truth)

Update `mobile/src/constants/colors.ts` to export exactly these values:

```ts
export const colors = {
  background: '#FAF6F0',   // app background (warm cream)
  foreground: '#1C1A18',   // primary text (near-black)
  card: '#FFFFFF',         // card surface
  primary: '#C4622D',      // terracotta — buttons, active states, highlights
  primaryForeground: '#FFFFFF',
  secondary: '#7A9E7E',    // sage green — meds, success accents
  secondaryForeground: '#FFFFFF',
  muted: '#F0EAE1',        // muted fill (chips, inactive)
  mutedForeground: '#8C8078', // secondary text
  accent: '#D4A5A0',       // dusty rose — avatar bg, soft accents
  accentForeground: '#FFFFFF',
  destructive: '#D94F3D',  // overdue / danger
  destructiveForeground: '#FFFFFF',
  warning: '#E6891A',      // upcoming soon
  warningForeground: '#FFFFFF',
  success: '#3D9A5C',      // healthy / done
  successForeground: '#FFFFFF',
  border: 'rgba(28,26,24,0.08)', // hairline borders
  // tints used a lot (use rgba in styles):
  // primary 10%: rgba(196,98,45,0.10)
  // secondary 10%: rgba(122,158,126,0.10)
  // destructive 10%: rgba(217,79,61,0.10)
  // success 10%: rgba(61,154,92,0.10)
};
```

**Radius scale:** sm 4 · md 8 · lg 12 · xl/card 16 · 3xl 24 · pill 9999
**Spacing (px):** screens use 24 horizontal padding. Common gaps: 8, 12, 16, 20. Card padding: 16–20.
**Button:** height 52, radius 12, bold 17px text.
**Input:** height 52, radius 12, white bg, 1px border, 16px text, padding 16.

### Typography
- **Headings → Fraunces (serif), bold.** Body/labels → **DM Sans (sans).**
- Install fonts via Expo Google Fonts:
  ```bash
  npx expo install @expo-google-fonts/fraunces @expo-google-fonts/dm-sans expo-font
  ```
- Load them in the root layout with `useFonts`, show nothing until loaded. Update `mobile/src/constants/typography.ts` to expose font family names: `serif: 'Fraunces_700Bold'`, `sans: 'DMSans_400Regular'`, `sansMedium: 'DMSans_500Medium'`, `sansBold: 'DMSans_700Bold'`.
- Heading sizes seen in design: screen titles 22, big section headers 20–24, hero numbers 48 (weight), page H2 30.

---

## 2. Web → React Native Translation Rules (CRITICAL)

| Figma (web)                         | React Native                                              |
|-------------------------------------|-----------------------------------------------------------|
| `<div>`                             | `<View>`                                                  |
| raw text inside a div               | must be wrapped in `<Text>`                               |
| `<button>`                          | `<Pressable>` (or `TouchableOpacity`)                    |
| `<input>`                           | `<TextInput>`                                             |
| `<textarea>`                        | `<TextInput multiline numberOfLines={4}>`                |
| `<img src=...>`                     | `<Image source={require('...')} />` or expo-image        |
| `className="..."` (Tailwind)        | `StyleSheet.create({...})` objects                       |
| `overflow-y-auto` / scrolling area  | `<ScrollView>` (set `showsVerticalScrollIndicator={false}`) |
| horizontal scroll (`overflow-x-auto`)| `<ScrollView horizontal>`                                |
| `box-shadow`                        | iOS: `shadowColor/shadowOffset/shadowOpacity/shadowRadius`; Android: `elevation` |
| gradient (`bg-gradient-to-t`)       | `expo-linear-gradient` `<LinearGradient>`                |
| recharts `<AreaChart>`              | keep the app's existing chart component; just restyle colors to `#C4622D` |
| lucide-react icons                  | **lucide-react-native** (same names!) — `npx expo install lucide-react-native react-native-svg` |
| `rounded-full`                      | `borderRadius: 9999`                                     |
| fl‑row                              | `flexDirection: 'row'` (RN default is column)            |

**Shadow preset** (use for all cards — soft, like the design's `shadow-[0_4px_20px_rgba(28,26,24,0.03)]`):
```ts
shadowColor: '#1C1A18',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.04,
shadowRadius: 12,
elevation: 2,
```

**Icon mapping (lucide-react-native names used by the design):**
PawPrint, User, Home, Activity, Plus, ChevronLeft, ChevronRight, Settings, LogOut, Check, HeartPulse, Pill, Calendar, Syringe, Scale, CheckCircle2, Circle, AlertCircle, X, Clock, Info.

---

## 3. Shared UI Components (build/restyle these FIRST)

These live in `mobile/src/components/ui/`. Restyle them to match; every screen reuses them.

### Button (`Button.tsx`)
- Height 52, radius 12, centered, bold 17.
- Variants:
  - `primary`: bg `primary`, white text, soft primary shadow.
  - `secondary`: bg `secondary`, white text.
  - `outline`: transparent bg, 2px `border`, `foreground` text.
  - `danger`: bg `rgba(217,79,61,0.08)`, text `destructive`, 2px border `rgba(217,79,61,0.15)`.
- Full width by default.

### Card (`Card.tsx`)
- bg `card` (white), radius 16, 1px `border`, the soft shadow preset, padding 20 (allow a `noPadding` prop for list cards).

### Input (`Input.tsx`)
- Column: optional `label` (15px medium, `foreground`, marginLeft 4, marginBottom 8) + field.
- Field: height 52, white bg, 1px `border`, radius 12, padding horizontal 16, 16px text, placeholder `mutedForeground`.
- Optional trailing icon (absolute right 16, vertically centered, `mutedForeground`).
- On focus: border `primary` (use state).

### Header (new shared component `Header.tsx`)
- Row, paddingHorizontal 24, paddingVertical 16, bg `background`.
- Left slot (width 40): if `back`, a circular back button with `ChevronLeft` (28).
- Center: title, **Fraunces bold 22**, centered, flex 1.
- Right slot (width 40): optional icon (e.g. `Plus`).

### BottomNav (tab bar — style the existing tab navigator)
- Height ~88 (incl. safe area), white bg, top 1px `border`, 4 items evenly spaced.
- Items: `{ Home: 'Ana Sayfa', PawPrint: 'Kediler', HeartPulse: 'Sağlık', User: 'Profil' }`.
- Active: icon + label `primary`, icon strokeWidth 2.5, slight fill tint `rgba(196,98,45,0.2)`. Inactive: `mutedForeground`, strokeWidth 2.
- Label 10px medium.
- This maps to existing tabs: `index`→Ana Sayfa, `cats`→Kediler, `health`→Sağlık, `profile`→Profil.

> The web mockups wrap each screen in a phone-frame `ScreenFrame` (notch, rounded border). **Ignore that** — it's only for the Figma gallery. In RN the device is the frame. Use `SafeAreaView` + `ScrollView` instead.

---

## 4. Screen-by-Screen Spec

Existing file paths are noted. Keep all data/hooks/props; only restyle JSX. Use the watercolor assets (see §5) for illustrations and empty states. Where the mockup shows demo data ("Tarçın", "4.25 kg"), bind to the real data already in each screen.

### 4.1 Splash — `mobile/assets`/splash config + any splash screen component
Centered: white rounded-square tile (96×96, radius 24, slight rotate) holding a filled `PawPrint` (48, primary). Below: **"Pati"** Fraunces bold 48 primary, tagline **"Kedinizin sağlığı, elinizde."** 18 `mutedForeground`. Below that a 256-circle watercolor cat image with white border. Soft accent gradient fading up from bottom.

### 4.2 Login — `mobile/src/app/auth/login.tsx`
Top: small `PawPrint` (28) + "Pati" Fraunces bold 24 primary, in a row. A 192-tall rounded watercolor banner image. H2 **"Giriş Yap"** (Fraunces 30). Subtext **"Tekrar hoş geldin! Devam etmek için giriş yap."** Inputs: **"E-posta Adresi"** (placeholder `ornek@email.com`), **"Şifre"** (password). Right-aligned link **"Şifremi Unuttum"**. Primary button **"Giriş Yap"**. Footer centered: **"Hesabın yok mu? "** + bold primary **"Kayıt Ol"**.

### 4.3 Register — `mobile/src/app/auth/register.tsx`
Header with back only. H2 **"Kayıt Ol"**, subtext **"Pati ailesine katılmak için bilgilerini gir."**. Inputs: **"Ad Soyad"** (Duru Sue), **"E-posta Adresi"**, **"Şifre"**, **"Şifre Tekrarı"**. Spacer pushes button down. Primary button **"Kayıt Ol"**. Footer: **"Zaten hesabın var mı? "** + **"Giriş Yap"**.

### 4.4 Home Dashboard — `mobile/src/app/tabs/index.tsx`
- Top row: left column greeting **"Merhaba, {ad} 🌿"** (Fraunces bold 24) + date line (e.g. **"Salı, 10 Mart"**, `mutedForeground` 15). Right: 48 circular avatar with initials (white bg, 2px primary-tint border).
- **Horizontal pet carousel** (ScrollView horizontal): each pet a 140-wide rounded-24 card. First/active card primary bg with white text; others white bg. Inside: 68 circular pet photo, name (bold 17), weight (12). Last item: dashed "Ekle" card with `Plus`.
- **Alert card**: Card with left 4px border `destructive`. Round 40 icon tile `Syringe` on `destructive` 10% tint. Title **"Karma Aşı - {pet}"**, pill badge `destructive` bg white text **"1 gün gecikti"**, sub **"Vet. Kliniği Randevusu"**. (Color the border/badge by urgency: overdue→destructive, soon→warning.)
- **"Bugünkü İlaçlar"** section: header row with title (Fraunces 20) + **"Tümünü Gör"** link (primary). Card (noPadding) listing today's meds: each row has a rounded-12 `Pill` icon tile (done→secondary tint, pending→muted), name (bold 16) + **"{pet} • Sabah 09:00"**. Trailing: done = filled `secondary` circle with white `Check`; pending = hollow 2px circle.
- Bottom tab bar active = Ana Sayfa.

### 4.5 Cats List — `mobile/src/app/tabs/cats.tsx`
Header title **"Kedilerim 🐱"**. List of pet cards (Card, row): 72 circular photo, name (bold 18), small colored status dot (success), breed+age line **"Tekir • 1 Yaş 2 Ay"** (`mutedForeground` 14), then two pill chips: weight chip (`muted` bg, `Scale` primary icon, "4.25 kg") and status chip (healthy→success tint "Sağlıklı" with `CheckCircle2`; missing vaccine→destructive tint "Aşı eksik" with `Syringe`). Trailing `ChevronRight` muted. Last: dashed "Yeni Kedi Ekle" button (88 tall, primary dashed border, primary-5% bg, `Plus` + label). Tab active = Kediler.

### 4.6 Cat Detail — `mobile/src/screens/cats/CatDetailScreen.tsx`
- Hero: full-width 280-tall pet photo at top, with a gradient overlay fading from `background` (bottom) to transparent/dark (top) via `expo-linear-gradient`.
- Floating top row over the image: translucent dark circular back button (`ChevronLeft`) and settings button (`Settings`). Use `position:absolute`.
- Below hero: name (Fraunces bold 36), breed (18 `mutedForeground`). Optional gender badge tile (rounded, light blue).
- **Stat row**: 3 equal white bordered tiles: **"Yaş" / "1 Yıl 2 Ay"**, **"Kilo" / "4.25 kg"** (value primary), **"Kısır" / "Evet"** (value success).
- **Inner tabs** (not real navigation — local state): **Özet · Aşılar · Kilo · İlaçlar**. Active tab: 2px bottom border primary, primary text; others muted.
- Özet content: **"Yaklaşan Aşılar"** card (left border by urgency, `Syringe` icon, type + status text like **"Dün yapılmalıydı"**), and a **"Kilo Gelişimi"** mini bar/area preview card with **"+0.1 kg"** success label.
- Floating bottom-right FAB: 56 circle primary with white `Plus`.

### 4.7 Add Cat — `mobile/src/screens/cats/AddCatScreen.tsx` (and mirror styling in `EditCatScreen.tsx`)
Header **"Kedi Ekle"** + back. Centered 96 circular photo-picker (dashed border, `Plus` + **"Fotoğraf"**). Input **"Kedinin Adı"** (Örn. Tarçın). **"Irk"** label + wrap of chips: `Tekir, Van Kedisi, Ankara Kedisi, British Shorthair, Diğer` (selected = primary bg white text; others white bordered). **"Cinsiyet"**: two pills **♂ Erkek / ♀ Dişi** (selected styled, here Erkek = light-blue active). Toggle row in a bordered tile: **"Kısırlaştırılmış"** + sub **"Kediniz kısırlaştırıldı mı?"** with a switch (on = primary track). **"Doğum Tarihi"** field with `Calendar` icon (use the date-picker the app already has; if none, a `TextInput` placeholder `GG.AA.YYYY`). Primary button **"Kedi Ekle"** (Edit screen: **"Kaydet"**).

### 4.8 Vaccine List — `mobile/src/screens/vaccines/VaccineListScreen.tsx`
Header **"Aşılar"** + back + right `Plus`. Section **"Yaklaşan Aşılar"** (Fraunces 20): upcoming card with left border `warning`, round `Syringe` warning-tint tile, type **"Kuduz Aşısı"**, pet name, and a clock row **"3 gün kaldı (15 Mart)"** in warning color. Section **"Geçmiş Aşılar"**: list of cards, each `CheckCircle2` secondary-tint tile, type + **"12 Oca 2025 • Pati Vet"** sub. (Use `UpcomingVaccineCard.tsx` and `VaccineItem.tsx`, restyled.)

### 4.9 Add Vaccine — `mobile/src/screens/vaccines/AddVaccineScreen.tsx`
Header **"Aşı Ekle"** + back. **"Aşı Tipi"** label + 2-col grid of chips: `Karma 3'lü, Karma 4'lü, Kuduz, FeLV, FIV, Diğer` (selected primary). **"Aşı Tarihi"** field (Calendar). **"Sonraki Aşı Tarihi (Opsiyonel)"** field. Input **"Veteriner / Klinik"** (Örn. Pati Veteriner Kliniği). **"Notlar"** textarea (placeholder **"Aşı hakkında notlar..."**). Primary button **"Aşıyı Kaydet"**.

### 4.10 Weight Chart — `mobile/src/screens/weight/WeightChartScreen.tsx`
Header **"Kilo Takibi"** + back + right `Plus`. Centered hero: label **"Mevcut Kilo"**, big number Fraunces bold 48 primary + "kg", then a success-tint pill **"İdeal kiloda"** with `Activity`. Below: the area/line chart (reuse `WeightChart.tsx`; stroke `#C4622D`, soft gradient fill, axis text `#8C8078`, dashed horizontal grid). **"Geçmiş Kayıtlar"** (Fraunces 20): white card list, each row a `Scale` muted tile + weight (bold 16) + date (13 muted) + green diff (e.g. **"+0.10 kg"**).

### 4.11 Add Weight — `mobile/src/screens/weight/AddWeightScreen.tsx`
Header **"Kilo Ekle"** + back. Big centered numeric `TextInput` (Fraunces 48) with underline border primary + "kg" suffix. **"Tarih"** field (default **"Bugün"**, Calendar primary icon). **"Notlar (Opsiyonel)"** textarea (placeholder **"Beslenme değişikliği vb..."**). Spacer, then primary button **"Kaydet"**.

### 4.12 Medication List — `mobile/src/screens/medications/MedicationListScreen.tsx`
Header **"İlaçlar"** + back + right `Plus`. Segmented toggle (`muted` bg, white active pill): **Aktif / Geçmiş**. List of med cards (noPadding):
- Header strip (primary-5% bg for active): rounded-12 `Pill` tile, name (bold 18), schedule sub **"Günde 1 kez • Her gün"**, and an on/off switch (on = primary).
- Body (white): time rows with `Clock` + time; a given dose shows **"Verildi"** success chip with `Check`; a pending dose shows a hollow circle button to mark done.
- If empty, show the EmptyState with a watercolor illustration + **"Henüz ilaç kaydı yok"**.
(Reuse `MedicationItem.tsx`, restyled.)

### 4.13 Add Medication — `mobile/src/screens/medications/AddMedicationScreen.tsx`
Header **"İlaç Ekle"** + back. Inputs **"İlaç Adı"** (Örn. Antibiyotik), **"Dozaj"** (Örn. 1 Tablet veya 2 Damla). **"Sıklık"** segmented: **Günlük / Haftalık / Özel**. Stepper tile **"Günde kaç kez?"** with − / value / + (+ button primary-tint). **"Hatırlatıcı Saati"** time field (bold). Primary button **"İlacı Kaydet"**.

### 4.14 Profile — `mobile/src/app/tabs/profile.tsx`
Header **"Profil"**. Centered: 96 circular avatar with initials on `accent` bg, white border; name (Fraunces bold 24); email (muted). List of bordered row buttons with leading primary icon + label + trailing `ChevronRight`: **"Hesap Bilgileri"** (User), **"Uygulama Ayarları"** (Settings), **"Yardım ve Destek"** (Info). Info Card: rows **"Versiyon" 1.0.0**, **"Dil" Türkçe**. Full-width danger button **"Çıkış Yap"** with `LogOut` (destructive-tint bg, destructive text). Tab active = Profil.

---

## 5. Assets

Current asset filenames have spaces / non-ASCII chars, which break `require()`. **First, rename** the illustration assets to clean names, then reference them. Suggested:

```bash
cd mobile/assets
mv "Firefly_GeminiFlash_Cute orange tabby cat walking sideways, full body view, _watercolor illustration, ani 716699.png" cat-walk.png
mv "Firefly_Gemini Flash_Cute small dog walking sideways, full body view, _watercolor illustration, anime styl 127362.png" dog-walk.png
mv "Firefly_Gemini Flash_Cute small bird flying sideways, wings spread, _watercolor illustration, anime style, 127362.png" bird-fly.png
# pick the best portrait cat illustration for splash/login banner:
# (inspect the kling_*.png files and rename the chosen one)
# mv "kling_....png" watercolor-cat.png
```

- Splash/Login banner + Splash circle: use `watercolor-cat.png` (a soft portrait cat). 
- Empty states (e.g. no meds, no cats): reuse a watercolor illustration.
- `pati_splash.gif` already exists for the animated splash if you want motion.
- For pet photos in cards/detail when the user hasn't added one, fall back to initials or a default illustration — don't hardcode the Unsplash URLs from the mockup.

---

## 6. Execution Order (do in this order, commit after each group)

1. Install fonts + icons + linear-gradient (`expo-linear-gradient`), set up `useFonts` in root layout.
2. Update `constants/colors.ts` and `constants/typography.ts` with the tokens above.
3. Rebuild shared UI: `Button`, `Card`, `Input`, new `Header`, and the bottom tab bar styling.
4. Restyle screens in this order: Login → Register → Home → Cats List → Cat Detail → Add Cat → Vaccine List → Add Vaccine → Weight Chart → Add Weight → Medication List → Add Medication → Profile → Splash.
5. Rename assets (§5) and wire illustrations into Splash/Login/empty states.
6. Run `npx tsc --noEmit` to confirm no type errors. Do not run the simulator.

## 7. Hard Rules
- Turkish strings stay verbatim.
- Don't touch API/services/hooks/stores or navigation routing — presentation only.
- Every `<Text>` must have an explicit color + font family (no relying on web inheritance).
- Use the shadow preset for cards; avoid harsh/dark shadows.
- Reuse existing components; don't create parallel duplicates.
- Keep edits surgical and per-file; after each screen, make sure it still compiles.
