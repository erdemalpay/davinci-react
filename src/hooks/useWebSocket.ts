import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Order, TableTypes } from "../types";
import { Paths } from "../utils/api/factory";
import { useGetCategories } from "../utils/api/menu/category";
import { useLocationContext } from "./../context/Location.context";
import { useOrderContext } from "./../context/Order.context";
import { useUserContext } from "./../context/User.context";
import { OrderStatus } from "./../types/index";
import { getItem } from "./../utils/getItem";
import { socketEventListeners } from "./socketConstant";

const SOCKET_URL = import.meta.env.VITE_API_URL;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const {
    setIsTakeAwayPaymentModalOpen,
    setOrderCreateBulk,
    setTakeawayTableId,
  } = useOrderContext();
  const categories = useGetCategories();
  useEffect(() => {
    // Load the audio files
    const orderCreatedSound = new Audio("/sounds/orderCreateSound.mp3");
    // const orderUpdatedSound = new Audio("/sounds/mixitPositive.wav");
    orderCreatedSound.volume = 1;
    const audioContext = new window.AudioContext();
    const gainNode = audioContext.createGain();

    // Set the gain to 2 (double the volume)
    gainNode.gain.value = 2;
    const source = audioContext.createMediaElementSource(orderCreatedSound);

    // Connect the source to the gain node, and the gain node to the destination
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const socket: Socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket.");
    });

    socket.on("orderCreated", (order: Order) => {
      const tableId =
        typeof order?.table === "number" ? order?.table : order?.table?._id;
      queryClient.invalidateQueries([`${Paths.Order}/table`, tableId]);
      queryClient.invalidateQueries([`${Paths.Order}/today`]);
      if (
        order?.createdBy === user?._id ||
        [
          OrderStatus.WASTED,
          OrderStatus.CANCELLED,
          OrderStatus.RETURNED,
        ].includes(order?.status as OrderStatus)
      ) {
        return;
      }
      // Play order created sound

      const foundCategory = getItem((order?.item as any)?.category, categories);
      if (
        !foundCategory?.isAutoServed &&
        order?.status !== OrderStatus.CANCELLED &&
        (order?.kitchen as any)?.soundRoles?.includes(user?.role?._id)
      ) {
        orderCreatedSound
          .play()
          .catch((error) => console.error("Error playing sound:", error));
      }
    });
    socket.on("orderUpdated", (data) => {
      const tableId =
        typeof data?.order?.table === "number"
          ? data?.order?.table
          : data?.order?.table._id;
      queryClient.invalidateQueries([`${Paths.Order}/table`, tableId]);
      queryClient.invalidateQueries([`${Paths.Order}/today`]); //TODO:here this today data in orders page is taken twice so we need to check it
    });
    socket.on("collectionChanged", (data) => {
      queryClient.invalidateQueries([
        `${Paths.Order}/collection/table`,
        data.collection.table,
      ]);
    });
    socket.on("singleTableChanged", (data) => {
      queryClient.invalidateQueries([`${Paths.Order}/table`, data.table._id]);
    });
    socket.on("stockChanged", (data) => {
      queryClient.invalidateQueries([`${Paths.Accounting}/stocks`]);
      queryClient.invalidateQueries([`${Paths.Accounting}/stocks/query`]);
    });
    socket.on("createMultipleOrder", (data) => {
      queryClient.invalidateQueries([`${Paths.Order}/table`, data.table._id]);
      queryClient.invalidateQueries([`${Paths.Order}/today`]);
      if (
        data?.table?.type === TableTypes.TAKEOUT &&
        data?.socketUser._id === user?._id
      ) {
        setIsTakeAwayPaymentModalOpen(true);
        setTakeawayTableId(data.table._id);
        setOrderCreateBulk([]);
      }
      if (data.socketUser._id === user?._id) {
        return;
      }

      if (data?.soundRoles?.includes(user?.role?._id)) {
        orderCreatedSound
          .play()
          .catch((error) => console.error("Error playing sound:", error));
      }
    });

    socketEventListeners.forEach((eventConfig) => {
      socket.on(eventConfig.event, (socketUser?: any, payload?: any) => {
        eventConfig.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries([key]);
        });
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, user, selectedLocationId]);
}
