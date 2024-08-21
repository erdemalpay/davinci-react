import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Kitchen, Location, MenuItem, Order, RoleEnum } from "../types";
import { Paths } from "../utils/api/factory";
import { useGetCategories } from "../utils/api/menu/category";
import { useLocationContext } from "./../context/Location.context";
import { useUserContext } from "./../context/User.context";

const SOCKET_URL = import.meta.env.VITE_API_URL;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const categories = useGetCategories();

  useEffect(() => {
    // Load the audio files
    const orderCreatedSound = new Audio("/sounds/mixitSoftware.wav");
    const orderUpdatedSound = new Audio("/sounds/mixitPositive.wav");

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
      queryClient.invalidateQueries([`${Paths.Order}`]);
      queryClient.invalidateQueries([`${Paths.Tables}`]);
      queryClient.invalidateQueries([`${Paths.Order}/collection/date`]);
      // Play order created sound
      const foundCategory = categories?.find(
        (c) => c._id === (order.item as MenuItem).category
      );
      console.log("foundCategory", foundCategory);
      console.log((foundCategory?.kitchen as Kitchen)?._id);
      console.log(user?.role._id);
      if (
        !foundCategory?.isAutoServed &&
        ((user?.role._id !== RoleEnum.KITCHEN &&
          selectedLocationId &&
          (order.location as Location)._id === selectedLocationId) ||
          (user?.role._id === RoleEnum.KITCHEN &&
            (foundCategory?.kitchen as Kitchen)?._id === "flora"))
      ) {
        orderCreatedSound
          .play()
          .catch((error) => console.error("Error playing sound:", error));
      }
    });
    socket.on("orderUpdated", (order: Order) => {
      queryClient.invalidateQueries([`${Paths.Order}/today`]);
      queryClient.invalidateQueries([`${Paths.Order}`]);
      queryClient.invalidateQueries([`${Paths.Tables}`]);
      queryClient.invalidateQueries([`${Paths.Order}/collection/date`]);

      // // Play order updated sound
      // orderUpdatedSound
      //   .play()
      //   .catch((error) => console.error("Error playing sound:", error));
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, categories, user, selectedLocationId]);
}
