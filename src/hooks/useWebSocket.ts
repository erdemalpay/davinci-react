import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Order, RoleEnum } from "../types";
import { Paths } from "../utils/api/factory";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useLocationContext } from "./../context/Location.context";
import { useUserContext } from "./../context/User.context";
import { MenuItem, OrderStatus } from "./../types/index";
import { getItem } from "./../utils/getItem";
import { socketEventListeners } from "./socketConstant";

const SOCKET_URL = import.meta.env.VITE_API_URL;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const categories = useGetCategories();
  const items = useGetMenuItems();

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
        // order?.createdBy === user?._id ||
        [
          OrderStatus.WASTED,
          OrderStatus.CANCELLED,
          OrderStatus.RETURNED,
        ].includes(order?.status as OrderStatus)
      ) {
        return;
      }
      // Play order created sound
      const itemId =
        typeof order?.item === "number"
          ? order?.item
          : (order?.item as MenuItem)?._id;
      const item = getItem(itemId, items);
      const foundCategory = getItem(item?.category, categories);
      if (
        !foundCategory?.isAutoServed &&
        order?.status !== OrderStatus.CANCELLED &&
        ((![RoleEnum.KITCHEN, RoleEnum.KITCHEN2].includes(
          user?.role?._id as RoleEnum
        ) &&
          order?.kitchen &&
          !["flora", "farm"].includes(order?.kitchen) &&
          selectedLocationId &&
          order?.location === selectedLocationId) ||
          (user?.role?._id === RoleEnum.KITCHEN &&
            order?.kitchen === "flora") ||
          (user?.role?._id === RoleEnum.KITCHEN2 && order?.kitchen === "farm"))
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
  }, [queryClient, categories, user, selectedLocationId]);
}
