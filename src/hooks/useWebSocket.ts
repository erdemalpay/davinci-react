import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
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
const GESTURE_EVENTS = [
  "click",
  "pointerdown",
  "touchstart",
  "keydown",
] as const;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const {
    setIsTakeAwayPaymentModalOpen,
    setOrderCreateBulk,
    setTakeawayTableId,
    setIsNewOrderDiscountScreenOpen,
    setSelectedNewOrders,
  } = useOrderContext();
  const categories = useGetCategories();

  // a ref to track if we've unlocked audio
  const audioReadyRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>();
  const audioContextRef = useRef<AudioContext>();
  const gainNodeRef = useRef<GainNode>();

  useEffect(() => {
    // 1) AUDIO INITIALIZATION (once)
    audioRef.current = new Audio("/sounds/orderCreateSound.mp3");
    audioRef.current.volume = 1;

    audioContextRef.current = new AudioContext();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.gain.value = 2;

    const source = audioContextRef.current.createMediaElementSource(
      audioRef.current
    );
    source.connect(gainNodeRef.current);
    gainNodeRef.current.connect(audioContextRef.current.destination);

    // 2) RESUME AUDIO on first user gesture
    const handleFirstGesture = async () => {
      try {
        if (audioContextRef.current?.state === "suspended") {
          await audioContextRef.current.resume();
        }
        audioReadyRef.current = true;
        console.log("🎵 Audio unlocked!");
      } catch (err) {
        console.warn("Could not resume AudioContext:", err);
      }
    };
    GESTURE_EVENTS.forEach((evt) =>
      document.addEventListener(evt, handleFirstGesture, {
        once: true,
        passive: true,
      })
    );

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
        ].includes(order?.status as OrderStatus) ||
        order?.location !== selectedLocationId
      ) {
        return;
      }

      const foundCategory = getItem((order?.item as any)?.category, categories);
      if (
        !foundCategory?.isAutoServed &&
        order?.status !== OrderStatus.CANCELLED &&
        (order?.kitchen as any)?.soundRoles?.includes(user?.role?._id)
      ) {
        if (audioReadyRef && audioRef.current) {
          audioRef.current
            .play()
            .catch((error) => console.error("Error playing sound:", error));
        }
      }
    });

    socket.on("orderUpdated", (data) => {
      const tableId =
        typeof data?.order?.table === "number"
          ? data?.order?.table
          : data?.order?.table._id;
      queryClient.invalidateQueries([`${Paths.Order}/table`, tableId]);
      queryClient.invalidateQueries([`${Paths.Order}/today`]);
    });

    socket.on("collectionChanged", (data) => {
      queryClient.invalidateQueries([
        `${Paths.Order}/collection/table`,
        data.collection.table,
      ]);
    });

    socket.on("notificationChanged", (data) => {
      if (
        data?.selectedUsers?.includes(user?._id) ||
        (data?.selectedRoles?.includes(user?.role?._id) &&
          !data?.notification?.seenUsers?.includes(user?._id))
      ) {
        queryClient.invalidateQueries([`${Paths.Notification}/new`]);
        queryClient.invalidateQueries([`${Paths.Notification}/all`]);
        queryClient.invalidateQueries([`${Paths.Notification}/event`]);
      }
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
        setIsNewOrderDiscountScreenOpen(false);
        setSelectedNewOrders([]);
      }

      if (data.socketUser._id === user?._id) return;

      if (
        data?.soundRoles?.includes(user?.role?._id) &&
        data.location === selectedLocationId
      ) {
        if (audioReadyRef && audioRef.current) {
          audioRef.current
            .play()
            .catch((error) => console.error("Error playing sound:", error));
        }
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
