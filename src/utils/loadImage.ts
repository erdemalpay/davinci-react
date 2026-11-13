// Resmi yükler; adres boşsa ya da yüklenemezse null döner (çağıran resimsiz çizer).
// Başka alan adından gelen resim canvas'ı kirletmesin diye isCrossOrigin açılır
export const loadImage = (src: string, isCrossOrigin = false) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    if (!src) return resolve(null);
    const image = new Image();
    if (isCrossOrigin) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
