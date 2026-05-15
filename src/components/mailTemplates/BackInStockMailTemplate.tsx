import { MailTemplateProps } from "./types";

export default function BackInStockMailTemplate({ values }: MailTemplateProps) {
  return (
    <div className="bg-[#f4f4f4] p-4 sm:p-10 font-sans">
      <div className="mx-auto max-w-[600px] overflow-hidden rounded-lg bg-white shadow">
        <div className="bg-gradient-to-br from-[#27ae60] to-[#2ecc71] px-8 py-10 text-center text-white">
          <div className="mb-5 text-5xl">✨</div>
          <h1 className="m-0 text-[28px] font-bold">Harika Haber!</h1>
          <p className="mt-2 text-base">Beklediğiniz ürün stoklara geldi</p>
        </div>
        <div className="p-8">
          <p className="mb-5 text-base leading-7 text-[#333333]">Merhaba,</p>
          <p className="mb-8 text-base leading-7 text-[#666666]">
            Stok bildirimi için kayıt olduğunuz ürün tekrar stoklarımızda! Hemen
            sipariş vererek ürünü kaçırmayın.
          </p>
          {values.productImage && (
            <div className="mb-8 text-center">
              <img
                src={values.productImage}
                alt={values.productName}
                className="mx-auto h-auto w-full max-w-[400px] rounded-lg border border-[#e9ecef]"
              />
            </div>
          )}
          <div className="mb-8 rounded-lg border-l-4 border-[#27ae60] bg-[#f8f9fa] p-6">
            <h2 className="mb-4 text-xl font-semibold text-[#2c3e50]">
              {values.productName || "Product name"}
            </h2>
            {values.price && (
              <p className="text-2xl font-bold text-[#27ae60]">
                {values.price}
              </p>
            )}
          </div>
          <div className="mb-8 rounded border-l-4 border-[#ffc107] bg-[#fff3cd] p-4 text-sm text-[#856404]">
            <strong>⚡ Hızlı Davranın!</strong> Ürün stokları sınırlıdır,
            tükenmeden sipariş verin.
          </div>
          <div className="my-8 text-center">
            <a
              href={values.productUrl || "#"}
              className="inline-block rounded-full bg-gradient-to-br from-[#27ae60] to-[#2ecc71] px-12 py-4 text-lg font-bold text-white no-underline shadow"
            >
              Şimdi Satın Al
            </a>
          </div>
        </div>
        <div className="border-t border-[#e9ecef] bg-[#f8f9fa] p-8 text-center text-sm text-[#888888]">
          Sorularınız için bizimle iletişime geçin:{" "}
          <a
            href={`mailto:${values.supportEmail}`}
            className="text-[#27ae60] no-underline"
          >
            {values.supportEmail || "support@example.com"}
          </a>
          <p className="mt-2 text-xs">© 2026 DaVinci. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}
