import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import {
  Gameplay,
  MenuItem,
  Notification,
  Order,
  OrderCollection,
  TableTypes,
  User,
} from "../types";
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

    socket.on("orderCreated", ({ order }: { order: Order }) => {
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/today`, selectedDate],
        (oldData) => {
          if (!oldData) return oldData;

          const normalizedOrder = order;
          // If table is just an ID, fetch the full table object from tables cache
          if (typeof order.table === "number") {
            const tablesData = queryClient.getQueryData<TablesByLocation>([
              Paths.Tables,
              selectedDate,
            ]);

            if (tablesData) {
              let foundTable = null;
              for (const locationTables of Object.values(tablesData)) {
                foundTable = locationTables.find((t) => t?._id === order.table);
                if (foundTable) break;
              }

              if (foundTable) {
                normalizedOrder.table = foundTable;
              }
            }
          }

          return [...oldData, normalizedOrder];
        }
      );

      if (
        order.createdBy === user?._id ||
        [
          OrderStatus.WASTED,
          OrderStatus.CANCELLED,
          OrderStatus.RETURNED,
        ].includes(order.status as OrderStatus) ||
        order.location !== selectedLocationId
      ) {
        return;
      }

      const foundCategory = getItem(
        (order.item as unknown as MenuItem)?.category,
        categories
      );
      if (
        !foundCategory?.isAutoServed &&
        order.status !== OrderStatus.CANCELLED &&
        (order.kitchen as any)?.soundRoles?.includes(user?.role?._id)
      ) {
        if (
          (order.kitchen as any)?.selectedRoles?.length > 0 &&
          !(order.kitchen as any)?.selectedRoles?.includes(user?.role?._id)
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

    socket.on("orderUpdated", ({ orders }: { orders: Order[] }) => {
      const tableId =
        typeof orders[0]?.table === "number"
          ? orders[0]?.table
          : orders[0]?.table?._id;
      queryClient.invalidateQueries({ queryKey: [`${Paths.Order}/table`, tableId] });
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/today`, selectedDate],
        (oldData) => {
          if (!oldData) {
            queryClient.invalidateQueries({ queryKey: [`${Paths.Order}/today`] });
            return oldData;
          }
          for (const order of orders) {
            const normalizedOrder = order;
            if (typeof order.table === "number") {
              const tablesData = queryClient.getQueryData<TablesByLocation>([
                Paths.Tables,
                selectedDate,
              ]);

              if (tablesData) {
                let foundTable = null;
                for (const locationTables of Object.values(tablesData)) {
                  foundTable = locationTables.find(
                    (t) => t?._id === order.table
                  );
                  if (foundTable) break;
                }

                if (foundTable) {
                  normalizedOrder.table = foundTable;
                } else {
                  queryClient.invalidateQueries({ queryKey: [`${Paths.Order}/today`] });
                  continue;
                }
              } else {
                queryClient.invalidateQueries({ queryKey: [`${Paths.Order}/today`] });
                continue;
              }
            }
            oldData = oldData.map((order) =>
              order._id === normalizedOrder._id ? normalizedOrder : order
            );
          }
          return oldData;
        }
      );
    });

    socket.on("orderDeleted", ({ order }: { order: Order }) => {
      const tableId =
        typeof order.table === "number" ? order.table : order.table?._id;

      // Remove order from table orders cache
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/table`, tableId],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter((order) => order._id !== order._id);
        }
      );

      // Remove order from today orders cache
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/today`, selectedDate],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter((order) => order._id !== order._id);
        }
      );

      // Remove order from tables data orders array
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, selectedDate],
        (old) => {
          if (!old) return old;

          const updatedTables: TablesByLocation = {};
          for (const [locationId, tables] of Object.entries(old)) {
            updatedTables[locationId] = tables.map((table) => {
              if (table?._id === tableId) {
                return {
                  ...table,
                  orders:
                    table.orders?.filter((orderId) => orderId !== order._id) ||
                    [],
                };
              }
              return table;
            });
          }
          return updatedTables;
        }
      );
    });

    socket.on(
      "collectionChanged",
      ({ collection }: { collection: OrderCollection }) => {
        queryClient.invalidateQueries({
          queryKey: [
            `${Paths.Order}/collection/table`,
            collection.table,
          ],
        });

        // Update today collections cache with populated table data
        queryClient.setQueryData<any[]>(
          [`${Paths.Order}/collection/today`, selectedDate],
          (oldData) => {
            if (!oldData) return oldData;

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
                  queryClient.invalidateQueries({
                    queryKey: [
                      `${Paths.Order}/collection/today`,
                    ],
                  });
                  return oldData;
                }
              } else {
                // If no tables data, invalidate and return
                queryClient.invalidateQueries({
                  queryKey: [
                    `${Paths.Order}/collection/today`,
                  ],
                });
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
      }
    );

    socket.on(
      "notificationChanged",
      ({ notifications }: { notifications: Notification[] }) => {
        if (!user) return;
        if (
          notifications.some(
            (notification) =>
              notification.selectedUsers?.includes(user._id) ||
              (notification.selectedRoles?.includes(user.role?._id) &&
                !notification.seenBy?.includes(user._id))
          )
        ) {
          queryClient.invalidateQueries({ queryKey: [`${Paths.Notification}/new`] });
          queryClient.invalidateQueries({ queryKey: [`${Paths.Notification}/all`] });
          queryClient.invalidateQueries({ queryKey: [`${Paths.Notification}/event`] });
        }
      }
    );

    socket.on("singleTableChanged", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];
          const updatedTables = prevForLocation.map((prevTable) => {
            if (prevTable?._id === table._id) {
              return { ...prevTable, ...table };
            }
            return prevTable;
          });
          return {
            ...prev,
            [locationId]: updatedTables,
          };
        }
      );
    });

    socket.on("stockChanged", () => {
      queryClient.invalidateQueries({ queryKey: [`${Paths.Accounting}/stocks`] });
      queryClient.invalidateQueries({ queryKey: [`${Paths.Accounting}/stocks/query`] });
    });

    socket.on("tableCreated", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];
          return {
            ...prev,
            [locationId]: [...prevForLocation, table],
          };
        }
      );
    });

    socket.on("tableDeleted", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];
          const updatedTables = prevForLocation.filter(
            (table) => table?._id !== table?._id
          );
          return {
            ...prev,
            [locationId]: updatedTables,
          };
        }
      );
    });

    socket.on("tableClosed", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
      queryClient.setQueryData<TablesByLocation>(
        [Paths.Tables, date],
        (old) => {
          const prev = old ?? {};
          const prevForLocation = prev[locationId] ?? [];
          const updatedTables = prevForLocation.map((table) => {
            if (table?._id === table?._id) {
              return {
                ...table,
                finishHour: table.finishHour,
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

    socket.on(
      "gameplayCreated",
      ({
        gameplay,
        user: creatingUser,
        table,
      }: {
        gameplay: Gameplay;
        user: User;
        table: Table;
      }) => {
        // Only update cache for other users' actions
        if (creatingUser._id === user?._id) return;

        const locationId = gameplay.location;
        const date = gameplay.date;
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
      }
    );

    socket.on(
      "gameplayDeleted",
      ({
        gameplay,
        user: deletingUser,
        tableId,
      }: {
        gameplay: Gameplay;
        user: User;
        tableId: number;
      }) => {
        // Only update cache for other users' actions
        if (deletingUser._id === user?._id) return;

        const gameplayId = gameplay?._id;
        const locationId = gameplay.location;
        const date = gameplay.date;
        if (!gameplayId || !locationId || !date) return;

        queryClient.setQueryData<TablesByLocation>(
          [Paths.Tables, date],
          (old) => {
            const prev = old ?? {};
            const prevForLocation = prev[locationId] ?? [];

            const updatedTables = prevForLocation.map((t) => {
              if (t?._id === tableId) {
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
      }
    );

    socket.on(
      "gameplayUpdated",
      ({
        gameplay,
        user: updatingUser,
        table,
      }: {
        gameplay: Gameplay;
        user: User;
        table: Table;
      }) => {
        // Only update cache for other users' actions
        if (updatingUser._id === user?._id) return;

        const locationId = gameplay.location;
        const date = gameplay.date;
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
      }
    );

    socket.on("tableChanged", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
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

    socket.on(
      "createMultipleOrder",
      ({
        table,
        user: creatingUser,
        soundRoles,
        selectedUsers,
        locationId,
      }: {
        table: Table;
        user: User;
        soundRoles: number[];
        selectedUsers: string[];
        locationId: number;
      }) => {
        queryClient.invalidateQueries({ queryKey: [`${Paths.Order}/today`] });

        if (!user) {
          console.log("User not found in createMultipleOrder");
          return;
        }

        if (
          table?.type === TableTypes.TAKEOUT &&
          creatingUser._id === user?._id
        ) {
          setIsTakeAwayPaymentModalOpen(true);
          setTakeawayTableId(table?._id);
          setOrderCreateBulk([]);
          setSelectedNewOrders([]);
        }

        if (creatingUser._id === user._id) return;

        if (
          soundRoles?.includes(user.role?._id) &&
          locationId === selectedLocationId
        ) {
          if (selectedUsers?.length > 0 && !selectedUsers?.includes(user._id)) {
            return;
          }
          if (audioReadyRef && audioRef.current) {
            audioRef.current
              .play()
              .catch((error) => console.error("Error playing sound:", error));
          }
        }
      }
    );

    socketEventListeners.forEach((eventConfig) => {
      socket.on(eventConfig.event, () => {
        eventConfig.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
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
