const CLOUDINARY_UPLOAD = "/image/upload/";

// Yüklenen logonun kenar boşluğunu ve beyaz arka planını Cloudinary adresi üzerinden temizler
export const cleanLogoUrl = (url: string) =>
  url.includes(CLOUDINARY_UPLOAD)
    ? url
        .replace("http://", "https://")
        .replace(
          CLOUDINARY_UPLOAD,
          `${CLOUDINARY_UPLOAD}e_trim:10/e_make_transparent:10/f_png/`
        )
    : url;
