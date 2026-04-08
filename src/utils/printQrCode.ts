import QRCode from "qrcode";

type PrintQrCodeParams = {
  url: string;
  eventName: string;
  rewardLabel?: string;
};

export const printQrCode = async ({
  url,
  eventName,
}: PrintQrCodeParams) => {
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const printFrame = document.createElement("iframe");
  printFrame.style.visibility = "hidden";
  printFrame.style.position = "absolute";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  document.body.appendChild(printFrame);

  const htmlContent = `
    <html>
      <head>
        <title>QR Kod — ${eventName}</title>
        <style>
          * { box-sizing: border-box; }
          @page { margin: 8mm; }
          body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 8px; background: #fff; color: #000; }
          .card { width: 320px; margin: 0 auto; text-align: center; }
          .logo { width: 48px; height: 48px; object-fit: contain; margin-bottom: 4px; }
          .title { font-size: 13px; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 8px; margin-bottom: 10px; }
          .qr { display: block; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="card">
          <img class="logo" src="/logo.svg" alt="Davinci" />
          <div class="title">DA VINCI BOARD GAME CAFE</div>
          <img class="qr" src="${qrDataUrl}" width="280" height="280" alt="QR Kod" />
        </div>
      </body>
    </html>
  `;

  printFrame.srcdoc = htmlContent;

  printFrame.onload = () => {
    printFrame.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 100);
  };
};
