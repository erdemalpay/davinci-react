const STORAGE_KEY = "davinci_printer_device";
const BAUD_RATE = 9600;

type Listener = () => void;

class PrinterService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private port: any = null;
  private _isConnected = false;
  private _opening = false;
  private connectedListeners = new Set<Listener>();
  private disconnectedListeners = new Set<Listener>();

  get isConnected() {
    return this._isConnected;
  }

  async connect() {
    if (this._isConnected || this._opening) return;
    this._opening = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const port = await (navigator as any).serial.requestPort();
      await this._open(port);
    } catch {
      this._opening = false;
    }
  }

  async reconnect() {
    if (this._isConnected || this._opening) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ports: any[] = await (navigator as any).serial.getPorts();
      if (ports.length === 0) return;

      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let port: any = null;

      if (stored) {
        const { vendorId, productId } = JSON.parse(stored);
        if (vendorId && productId) {
          port =
            ports.find((p) => {
              const info = p.getInfo();
              return (
                info.usbVendorId === vendorId && info.usbProductId === productId
              );
            }) ?? null;
        }
      }

      // vendorId/productId null ise (Windows sanal COM port) tek yetkili portu kullan
      if (!port && ports.length === 1) {
        port = ports[0];
      }

      if (!port) return;

      this._opening = true;
      await this._open(port);
    } catch {
      this._opening = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _open(port: any) {
    this.port = port;
    await port.open({ baudRate: BAUD_RATE });

    this._isConnected = true;
    this._opening = false;

    const info = port.getInfo();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        vendorId: info.usbVendorId ?? null,
        productId: info.usbProductId ?? null,
      })
    );

    this.connectedListeners.forEach((l) => l());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).serial.addEventListener(
      "disconnect",
      (event: Event) => {
        if (event.target === this.port) {
          this._isConnected = false;
          this.port = null;
          this.disconnectedListeners.forEach((l) => l());
        }
      },
      { once: true }
    );
  }

  async print(data: Uint8Array) {
    if (!this.port || !this._isConnected) return;
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  onConnected(listener: Listener) {
    this.connectedListeners.add(listener);
    return () => this.connectedListeners.delete(listener);
  }

  onDisconnected(listener: Listener) {
    this.disconnectedListeners.add(listener);
    return () => this.disconnectedListeners.delete(listener);
  }
}

export const printerService = new PrinterService();
