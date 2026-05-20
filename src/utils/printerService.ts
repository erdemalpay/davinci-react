const STORAGE_KEY = "davinci_printer_device";

type Listener = () => void;

class PrinterService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private printer: any = null;
  private _isConnected = false;
  private _opening = false;
  private _reconnectAttempted = false;
  private connectedListeners = new Set<Listener>();
  private disconnectedListeners = new Set<Listener>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getPrinter(): Promise<any> {
    if (this.printer) return this.printer;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mod = await import("@point-of-sale/webserial-receipt-printer");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WebSerialReceiptPrinter = (mod as any).default ?? mod;

    this.printer = new WebSerialReceiptPrinter({ baudRate: 9600 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.printer.addEventListener("connected", (device: any) => {
      this._isConnected = true;
      this._opening = false;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          vendorId: device.vendorId,
          productId: device.productId,
        })
      );
      this.connectedListeners.forEach((l) => l());
    });

    this.printer.addEventListener("disconnected", () => {
      this._isConnected = false;
      this.disconnectedListeners.forEach((l) => l());
    });

    return this.printer;
  }

  get isConnected() {
    return this._isConnected;
  }

  async connect() {
    if (this._isConnected || this._opening) return;
    this._opening = true;
    try {
      const printer = await this.getPrinter();
      return printer.connect();
    } catch {
      this._opening = false;
    }
  }

  async reconnect() {
    if (this._isConnected || this._opening || this._reconnectAttempted) return;
    this._reconnectAttempted = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      this._opening = true;
      const printer = await this.getPrinter();
      printer.reconnect(JSON.parse(stored));
    } catch {
      this._opening = false;
    }
  }

  async print(data: Uint8Array) {
    const printer = await this.getPrinter();
    printer.print(data);
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
