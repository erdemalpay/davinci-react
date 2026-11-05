const toFile = async (dataUrl: string, fileName: string) => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], fileName, { type: blob.type });
};

// Dosyayı doğrudan indirir
export const downloadImage = (dataUrl: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
};

// Tarayıcı resim dosyası paylaşmayı destekliyor mu (çoğunlukla telefon)
export const canShareImage = () =>
  typeof navigator.canShare === "function" &&
  navigator.canShare({
    files: [new File([], "a.jpg", { type: "image/jpeg" })],
  });

// Paylaş menüsünü açar
export const shareImage = async (dataUrl: string, fileName: string) => {
  const file = await toFile(dataUrl, fileName);
  await navigator.share({ files: [file] }).catch(() => undefined);
};

// Telefonda paylaş menüsü açılır ("Resmi Kaydet" ile galeriye gider); desteklemeyen
// tarayıcıda resim indirilir
export const saveImage = (dataUrl: string, fileName: string) =>
  canShareImage()
    ? shareImage(dataUrl, fileName)
    : downloadImage(dataUrl, fileName);
