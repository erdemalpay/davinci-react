# davinci-react

Da Vinci kutu oyunu kafesi için Vite + React 18 + TypeScript yönetim paneli (siparişler/masalar, menü, stok ve muhasebe, vardiyalar, online satış). `../davinci-api` reposundaki NestJS API ile konuşur; özelliklerin çoğu iki repoya da dokunur.

## Komutlar

```bash
yarn start            # vite dev sunucusu (port 3001)
yarn build            # tsc && vite build; asıl tip kontrolü buradaki tsc
yarn test             # vitest run (src/**/*.test.ts[x])
npx vitest run src/components/orders/orderPayment/orderList/customDiscount.test.ts
yarn lint             # eslint
```

- API adresi `.env` içindeki `VITE_API_URL`'den gelir.
- Vercel'de yayınlanıyor (SPA yönlendirmesi `vercel.json`'da).
- CI sadece AI review çalıştırır; push etmeden önce `yarn build` ve `yarn test` çalıştır.

## Mimari ve kurallar

- **API katmanı:** `src/utils/api/`. Endpoint ana path'leri `src/utils/api/factory.ts` içindeki `Paths` objesinde.
  - Her domain için bir dosya (ör. `utils/api/break.ts`) factory üzerine kurulu hook'lar export eder: sorgular için `useGet` / `useGetList`; oluşturma/güncelleme/silme için optimistic update, toast ve invalidation içeren `useMutationApi({ baseQuery })`.
  - Factory hook'u işini görüyorsa bileşenlerde doğrudan `axiosClient` veya `useQuery` kullanma.
  - Query key'ler istek path'leriyle aynıdır; websocket invalidation buna dayanır.
- **Gerçek zamanlı:** API `orderChanged` gibi socket event'leri yayınlar. `src/hooks/socketConstant.ts` her event'i invalidate edilecek query key'lerine eşler, `src/hooks/useWebSocket.ts` bunları bağlar. Backend'e eklenen her yeni `emitXChanged()` için buraya da bir kayıt gerekir.
- **Tipler:** `src/types/index.ts` backend schema/DTO'larının elle tutulan bir kopyasıdır. API'de bir alan değişirse burayı da güncelle. ID'ler sayıdır (backend auto-increment `_id` kullanıyor).
- **Routing:**
  - Route path'leri `src/navigation/constants.ts` içindeki `Routes` enum'unda, sayfa/route tanımlarıyla birlikte.
  - `src/navigation/routes.tsx` bunları render eder.
  - Menü/sayfa görünürlüğü backend'deki panel-control sayfalarından gelir (`permissionRoles`, bkz. `src/hooks/useFilteredRoutes.ts`).
- **State:** sunucu verisi React Query'de durur. `src/context/` içindeki context'ler arayüz ve oturum state'ini tutar:
  - `Location`, `User`, `Date`, `Order`, `General`, `Filter`. `Filter.context.tsx` sayfa bazlı filtre panellerini tutar.
  - `Data.context.tsx` sık kullanılan listeleri önceden yükler.
  - Sayfaya özel yeni filtreler için `Filter.context`'i büyütmek yerine local state veya URL parametreleri kullan.
- **Arayüz:** Tailwind. Tablo ve formlar için yenisini yazmak yerine `src/components/panelComponents/` içindekileri (`GenericTable`, `GenericAddEditPanel`, form elemanları) kullan.
- **i18n:** react-i18next, `useTranslation()` ile. Anahtarlar İngilizce metinlerin kendisidir. Her yeni anahtarı hem `src/locales/en/translation.json` hem `src/locales/tr/translation.json` dosyasına ekle.
- Bazı bileşenler çok büyük (`pages/Tables.tsx`, `components/tables/TableCard.tsx`, `GenericTable.tsx`). İlgili bölümü oku; yeni parçaları ayrı bileşenlere çıkar.

## Testler

Vitest + Testing Library (`src/test/setup.ts`); testler kodun yanında `*.test.ts(x)` olarak durur. Kapsam küçük ve sipariş ödeme/indirim mantığında yoğunlaşıyor.
