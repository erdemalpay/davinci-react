import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Order, RoleEnum, User } from "../types";
import { Paths } from "../utils/api/factory";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useLocationContext } from "./../context/Location.context";
import { useUserContext } from "./../context/User.context";
import { OrderStatus } from "./../types/index";
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
    const socket: Socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.on("orderCreated", (order: Order) => {
      if ((order?.createdBy as any)?._id === user?._id) {
        return;
      }
      queryClient.invalidateQueries([`${Paths.Order}/today`]);
      queryClient.invalidateQueries([`${Paths.Tables}`]);

      // Play order created sound
      const foundCategory = categories?.find(
        (c) => c._id === getItem(order?.item, items)?.category
      );
      if (
        !foundCategory?.isAutoServed &&
        order?.status !== OrderStatus.CANCELLED &&
        ((![RoleEnum.KITCHEN, RoleEnum.KITCHEN2].includes(
          user?.role?._id as RoleEnum
        ) &&
          !["flora", "farm"].includes(foundCategory?.kitchen as string) &&
          selectedLocationId &&
          order?.location === selectedLocationId) ||
          (user?.role?._id === RoleEnum.KITCHEN &&
            foundCategory?.kitchen === "flora") ||
          (user?.role?._id === RoleEnum.KITCHEN2 &&
            foundCategory?.kitchen === "farm"))
      ) {
        orderCreatedSound
          .play()
          .catch((error) => console.error("Error playing sound:", error));
      }
    });
    socket.on("orderUpdated", (socketUser: User, order: Order) => {
      if (socketUser?._id === user?._id) {
        return;
      }
      queryClient.invalidateQueries([`${Paths.Order}/today`]); //TODO:here this today data in orders page is taken twice so we need to check it
      queryClient.invalidateQueries([`${Paths.Tables}`]);
    });
    socket.on("collectionChanged", (data) => {
      queryClient.invalidateQueries([`${Paths.Order}/collection`]);
      queryClient.invalidateQueries([
        `${Paths.Order}/collection/table/${data.collection.table}`,
      ]);
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
  }, [queryClient, categories, user, selectedLocationId, items]);
}
