import { useEffect, useState } from "react";
import { printerService } from "../utils/printerService";

export const usePrinter = () => {
  const [isConnected, setIsConnected] = useState(printerService.isConnected);

  useEffect(() => {
    const unsubConnected = printerService.onConnected(() =>
      setIsConnected(true)
    );
    const unsubDisconnected = printerService.onDisconnected(() =>
      setIsConnected(false)
    );
    printerService.reconnect();
    return () => {
      unsubConnected();
      unsubDisconnected();
    };
  }, []);

  return {
    isConnected,
    connect: () => printerService.connect(),
    print: (data: Uint8Array) => printerService.print(data),
  };
};
