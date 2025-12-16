import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { TableTypes } from "../types";
import { Paths } from "../utils/api/factory";
import { useGetCategories } from "../utils/api/menu/category";
import { useDateContext } from "./../context/Date.context";
import { useLocationContext } from "./../context/Location.context";
import { useOrderContext } from "./../context/Order.context";
import { useUserContext } from "./../context/User.context";
import { Table } from "./../types";
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
type TablesByLocation = Record<string, Table[]>;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const {
    setIsTakeAwayPaymentModalOpen,
    setOrderCreateBulk,
    setTakeawayTableId,
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

    socket.on("orderCreated", (data) => {
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/today`, selectedDate],
        (oldData) => {
          if (!oldData) return oldData;

          const normalizedOrder = {
            ...data?.order,
            item:
              typeof data?.order?.item === "object"
                ? data?.order?.item?._id
                : data?.order?.item,
            kitchen:
              typeof data?.order?.kitchen === "object"
                ? data?.order?.kitchen?._id
                : data?.order?.kitchen,
          };
          return [...oldData, normalizedOrder];
        }
      );

      if (
        data?.order?.createdBy === user?._id ||
        [
          OrderStatus.WASTED,
          OrderStatus.CANCELLED,
          OrderStatus.RETURNED,
        ].includes(data?.order?.status as OrderStatus) ||
        data?.order?.location !== selectedLocationId
      ) {
        return;
      }

      const foundCategory = getItem(
        (data?.order?.item as any)?.category,
        categories
      );
      if (
        !foundCategory?.isAutoServed &&
        data?.order?.status !== OrderStatus.CANCELLED &&
        (data?.order?.kitchen as any)?.soundRoles?.includes(user?.role?._id)
      ) {
        if (
          (data?.order?.kitchen as any)?.selectedRoles?.length > 0 &&
          !(data?.order?.kitchen as any)?.selectedRoles?.includes(
            user?.role?._id
          )
        ) {
          return;
        }
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
          : data?.order?.table?._id;
      queryClient.invalidateQueries([`${Paths.Order}/table`, tableId]);
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/today`, selectedDate],
        (oldData) => {
          if (!oldData) {
            queryClient.invalidateQueries([`${Paths.Order}/today`]);
            return oldData;
          }
          const normalizedOrder = { ...data?.order };
          if (typeof data?.order?.table === "number") {
            const tablesData = queryClient.getQueryData<TablesByLocation>([
              Paths.Tables,
              selectedDate,
            ]);

            if (tablesData) {
              let foundTable = null;
              for (const locationTables of Object.values(tablesData)) {
                foundTable = locationTables.find(
                  (t) => t?._id === data?.order?.table
                );
                if (foundTable) break;
              }

              if (foundTable) {
                normalizedOrder.table = foundTable;
              } else {
                queryClient.invalidateQueries([`${Paths.Order}/today`]);
                return oldData;
              }
            } else {
              queryClient.invalidateQueries([`${Paths.Order}/today`]);
              return oldData;
            }
          }
          if (typeof data?.order?.item === "object" && data?.order?.item?._id) {
            normalizedOrder.item = data?.order?.item._id;
          }
          if (
            typeof data?.order?.kitchen === "object" &&
            data?.order?.kitchen?._id
          ) {
            normalizedOrder.kitchen = data?.order?.kitchen._id;
          }
          return oldData.map((order) =>
            order._id === normalizedOrder._id ? normalizedOrder : order
          );
        }
      );
    });

    socket.on("collectionChanged", (data) => {
      queryClient.invalidateQueries([
        `${Paths.Order}/collection/table`,
        data.collection.table,
      ]);

      // Update today collections cache with populated table data
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/collection/today`, selectedDate],
        (oldData) => {
          if (!oldData) return oldData;

          const collection = data.collection;

          // If table is just an ID, fetch the full table object from tables cache
          if (typeof collection.table === "number") {
            const tablesData = queryClient.getQueryData<TablesByLocation>([
              Paths.Tables,
              selectedDate,
            ]);

            if (tablesData) {
              let foundTable = null;
              for (const locationTables of Object.values(tablesData)) {
                foundTable = locationTables.find(
                  (t) => t?._id === collection.table
                );
                if (foundTable) break;
              }

              if (foundTable) {
                collection.table = foundTable;
              } else {
                // If table not found, invalidate and return
                queryClient.invalidateQueries([
                  `${Paths.Order}/collection/today`,
                ]);
                return oldData;
              }
            } else {
              // If no tables data, invalidate and return
              queryClient.invalidateQueries([
                `${Paths.Order}/collection/today`,
              ]);
              return oldData;
            }
          }

          // Update or add the collection in the cache
          const existingIndex = oldData.findIndex(
            (c) => c._id === collection._id
          );

          if (existingIndex !== -1) {
            // Update existing collection
            return oldData.map((c) =>
              c._id === collection._id ? collection : c
            );
          } else {
            // Add new collection
            return [...oldData, collection];
          }
        }
      );
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
      const locationId = data.table.location;
      const date = data.table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];
          const updatedTables = prevForLocation.map((table) => {
            if (table?._id === data.table?._id) {
              return data.table;
            }
            return table;
          });
          return {
            ...prev,
            [locationId]: updatedTables,
          };
        }
      );
    });

    socket.on("stockChanged", (data) => {
      queryClient.invalidateQueries([`${Paths.Accounting}/stocks`]);
      queryClient.invalidateQueries([`${Paths.Accounting}/stocks/query`]);
    });

    socket.on("tableCreated", (data) => {
      const locationId = data.table.location;
      const date = data.table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];
          const newTable = data.table;
          return {
            ...prev,
            [locationId]: [...prevForLocation, newTable],
          };
        }
      );
    });

    socket.on("tableDeleted", (data) => {
      const locationId = data.table.location;
      const date = data.table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];
          const updatedTables = prevForLocation.filter(
            (table) => table?._id !== data.table?._id
          );
          return {
            ...prev,
            [locationId]: updatedTables,
          };
        }
      );
    });

    socket.on("tableClosed", (data) => {
      const locationId = data.table.location;
      const date = data.table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];
          const updatedTables = prevForLocation.map((table) => {
            if (table?._id === data.table?._id) {
              return {
                ...table,
                finishHour: data.table.finishHour,
              };
            }
            return table;
          });

          return {
            ...prev,
            [locationId]: updatedTables,
          };
        }
      );
    });

    socket.on("gameplayCreated", (data) => {
      // Only update cache for other users' actions
      if (data?.user?._id === user?._id) return;

      const gameplay = data.gameplay;
      const locationId = gameplay.location;
      const date = gameplay.date;
      const table = data.table;
      if (!gameplay || !locationId || !date) return;

      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];

          const updatedTables = prevForLocation.map((t) => {
            if (t?._id === table?._id) {
              return {
                ...t,
                gameplays: [...t.gameplays, gameplay],
              };
            }
            return t;
          });

          return {
            ...prev,
            [locationId]: updatedTables,
          };
        }
      );
    });

    socket.on("gameplayDeleted", (data) => {
      // Only update cache for other users' actions
      if (data?.user?._id === user?._id) return;

      const gameplayId = data.gameplay?._id;
      const locationId = data.gameplay.location;
      const date = data.gameplay.date;
      const table = data.table;
      if (!gameplayId || !locationId || !date) return;

      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];

          const updatedTables = prevForLocation.map((t) => {
            if (t?._id === table?._id) {
              return {
                ...t,
                gameplays: t.gameplays.filter((g) => g?._id !== gameplayId),
              };
            }
            return t;
          });

          return {
            ...prev,
            [locationId]: updatedTables,
          };
        }
      );
    });

    socket.on("gameplayUpdated", (data) => {
      // Only update cache for other users' actions
      if (data?.user?._id === user?._id) return;

      const gameplay = data.gameplay;
      const locationId = gameplay.location;
      const date = gameplay.date;
      const table = data.table;
      if (!gameplay || !locationId || !date) return;

      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];

          const updatedTables = prevForLocation.map((t) => {
            if (t?._id === table?._id) {
              return {
                ...t,
                gameplays: t.gameplays.map((g) =>
                  g?._id === gameplay?._id ? gameplay : g
                ),
              };
            }
            return t;
          });

          return {
            ...prev,
            [locationId]: updatedTables,
          };
        }
      );
    });

    socket.on("tableChanged", (data) => {
      const locationId = data.table.location;
      const date = data.table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          if (!old) return old;
          const { [locationId]: _, ...rest } = old;
          return rest;
        }
      );
      queryClient.invalidateQueries({ queryKey: [Paths.Tables, date] });
    });

    socket.on("createMultipleOrder", (data) => {
      queryClient.invalidateQueries([`${Paths.Order}/today`]);

      if (
        data?.table?.type === TableTypes.TAKEOUT &&
        data?.user?._id === user?._id
      ) {
        setIsTakeAwayPaymentModalOpen(true);
        setTakeawayTableId(data.table?._id);
        setOrderCreateBulk([]);
        setSelectedNewOrders([]);
      }

      if (data.user?._id === user?._id) return;

      if (
        data?.soundRoles?.includes(user?.role?._id) &&
        data.location === selectedLocationId
      ) {
        if (
          data?.selectedRoles?.length > 0 &&
          !data?.selectedRoles?.includes(user?.role?._id)
        ) {
          return;
        }
        if (audioReadyRef && audioRef.current) {
          audioRef.current
            .play()
            .catch((error) => console.error("Error playing sound:", error));
        }
      }
    });

    socketEventListeners.forEach((eventConfig) => {
      socket.on(eventConfig.event, (user?: any, payload?: any) => {
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
