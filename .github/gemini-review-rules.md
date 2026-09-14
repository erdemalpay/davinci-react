Bu proje React 18 + TypeScript + Vite ile yazılmış bir restoran/kafe yönetim paneli. Veri çekme React Query, stil Tailwind CSS, çeviri i18next ile yapılıyor.

- **Çeviri (i18n):** Kullanıcıya görünen her metin `t("key")` ile çevrilmeli. Yeni key hem `src/locales/tr/translation.json` hem `src/locales/en/translation.json` içine eklenmeli; birinde olup diğerinde olmayan key'i belirt. Kod içinde sabit Türkçe/İngilizce arayüz metni varsa belirt.
- **API katmanı (`src/utils/api/`):** Yeni endpoint'ler `factory.ts` içindeki `Paths` sabitine eklenmeli. Veri çekme `useGet` / `useGetList`, yazma işlemleri `useMutationApi` (`createItem`, `updateItem`, `deleteItem`) ile yapılmalı. Doğrudan axios çağrısı veya elle yazılmış `useQuery`/`useMutation` varsa belirt.
- **Sayfalar (`src/pages/`):** Tablo ve formlar `src/components/panelComponents/` altındaki `GenericTable`, `GenericAddEditPanel` gibi ortak bileşenlerle kurulmalı; sayfaya özel sıfırdan tablo/form yazılıyorsa belirt.
- **Ortak bileşenler (`src/components/panelComponents/`):** Tüm sayfalarda kullanılıyor. Mevcut prop'ların davranışını veya varsayılan değerlerini değiştiren, geriye dönük uyumsuz değişiklikleri yüksek önemle işaretle.
- **State:** Sayfa değişiminde korunması gereken UI state'i (aktif sekme, açık modal, form taslağı) `GeneralContext`'te tutuluyor; bunun yerine local state kullanılıp state kayboluyorsa belirt.
- **Hook'lar:** `useEffect` / `useMemo` / `useCallback` bağımlılık dizilerindeki eksik veya gereksiz bağımlılıkları (react-hooks/exhaustive-deps) ve her render'da yeniden oluşan referansların sonsuz döngü riskini kontrol et.
- **Real-time (`src/hooks/socketConstant.ts`):** Socket event handler'larında doğru React Query cache'lerinin invalidate edildiğini kontrol et.
- **Yetki:** Yeni sayfa/route eklendiyse `src/navigation/constants.ts` ve yetki kontrolü (`src/utils/permissions.ts`) ile uyumunu kontrol et.
- **Stil:** Tailwind utility class kullanılmalı; inline `style` ekleniyorsa belirt.
- **Formatlama gürültüsü:** Projedeki birçok dosya hiç Prettier'dan geçmemiş. Diff'te işle ilgisi olmayan satırlarda sadece formatlama değişikliği (tırnak, virgül, satır kırma) varsa, bunun review'u zorlaştırdığını ve ayrı bir commit'e alınması gerektiğini özette belirt. Bu satırlara tek tek yorum yazma.
