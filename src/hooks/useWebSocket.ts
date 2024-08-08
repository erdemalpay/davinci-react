import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { Order } from "../types";
import { Paths } from "../utils/api/factory";

const SOCKET_URL = import.meta.env.VITE_API_URL;

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.on("orderCreated", (order: Order) => {
      queryClient.invalidateQueries([`${Paths.Order}/today`]);
      queryClient.invalidateQueries([`${Paths.Tables}`]);
      queryClient.invalidateQueries([`${Paths.Order}/collection/date`]);
      toast.success("New order created");
    });

    socket.on("orderUpdated", (order: Order) => {
      queryClient.invalidateQueries([`${Paths.Order}/today`]);
      queryClient.invalidateQueries([`${Paths.Tables}`]);
      queryClient.invalidateQueries([`${Paths.Order}/collection/date`]);
      toast.info("Order updated");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
