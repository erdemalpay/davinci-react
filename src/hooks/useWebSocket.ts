import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { useDataContext } from "../context/Data.context";
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

export function useWebSocket() {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const { kitchens } = useDataContext();
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

  // Store socket in ref - only create/destroy on mount/unmount
  const socketRef = useRef<Socket | null>(null);
  // Track disconnection time
  const disconnectTimeRef = useRef<number | null>(null);

  // Store current values in refs (to solve closure issues)
  const latestValuesRef = useRef({
    queryClient,
    user,
    selectedLocationId,
    selectedDate,
    kitchens,
    categories,
    setIsTakeAwayPaymentModalOpen,
    setOrderCreateBulk,
    setTakeawayTableId,
    setSelectedNewOrders,
    audioReadyRef,
    audioRef,
  });

  // Update refs
  useEffect(() => {
    latestValuesRef.current = {
      queryClient,
      user,
      selectedLocationId,
      selectedDate,
      kitchens,
      categories,
      setIsTakeAwayPaymentModalOpen,
      setOrderCreateBulk,
      setTakeawayTableId,
      setSelectedNewOrders,
      audioReadyRef,
      audioRef,
    };
  }, [
    queryClient,
    user,
    selectedLocationId,
    selectedDate,
    kitchens,
    categories,
    setIsTakeAwayPaymentModalOpen,
    setOrderCreateBulk,
    setTakeawayTableId,
    setSelectedNewOrders,
  ]);

  // Create socket connection only once
  useEffect(() => {
    // 1) AUDIO INITIALIZATION (once)
    audioRef.current = new Audio("/sounds/orderCreateSound.mp3");
    audioRef.current.volume = 1;

    audioContextRef.current = new AudioContext();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.gain.value = 12;

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

    // If socket already exists, don't recreate it
    if (socketRef.current) {
      return;
    }

    // Create socket instance - automatically connects on creation
    // Reconnection is enabled by default with infinite attempts
    const socket: Socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ WebSocket connection established.");
      disconnectTimeRef.current = null;
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket connection lost:", reason);
      disconnectTimeRef.current = Date.now();

      if (reason === "io server disconnect") {
        // Disconnected by server, manually reconnect
        socket.connect();
      }
      // In other cases, Socket.IO will automatically reconnect
    });

    socket.on("reconnect", (attemptNumber) => {
      const { queryClient, selectedDate } = latestValuesRef.current;
      const disconnectDuration = disconnectTimeRef.current
        ? Date.now() - disconnectTimeRef.current
        : 0;

      console.log(
        `🔄 WebSocket reconnected (attempt: ${attemptNumber}, disconnect duration: ${Math.round(
          disconnectDuration / 1000
        )}s)`
      );

      // Re-fetch data that was missed during disconnection
      if (disconnectDuration > 30000) {
        // If connection was lost for more than 30 seconds, invalidate all queries
        console.log(
          "⚠️ Connection was lost for a long time, refetching all active queries..."
        );
        queryClient.invalidateQueries();
      } else {
        // Otherwise, only invalidate critical queries
        const criticalQueries = [
          [`${Paths.Order}/today`, selectedDate],
          [Paths.Tables, selectedDate],
          [`${Paths.Order}/collection/today`, selectedDate],
          [`${Paths.Notification}/new`],
          [`${Paths.Notification}/all`],
          [`${Paths.Accounting}/stocks`],
          [`${Paths.Accounting}/stocks/query`],
        ];

        criticalQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 WebSocket reconnection attempt: ${attemptNumber}`);
    });

    socket.on("reconnect_error", (error: Error) => {
      console.warn("⚠️ WebSocket reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error(
        "❌ WebSocket reconnection failed. Please try reconnecting manually."
      );
    });

    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error.message);
    });

    socket.on("orderCreated", ({ order }: { order: Order }) => {
      const {
        queryClient,
        selectedDate,
        user,
        selectedLocationId,
        categories,
        kitchens,
        audioReadyRef,
        audioRef,
      } = latestValuesRef.current;

      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/today`, selectedDate],
        (oldData) => {
          if (!oldData) return oldData;

          const normalizedOrder = order;
          // If table is just an ID, fetch the full table object from tables cache using order's location
          if (typeof order.table === "number" && order.location) {
            const tablesForLocation = queryClient.getQueryData<Table[]>(
              [Paths.Tables, order.location, selectedDate]
            );

            if (tablesForLocation) {
              const foundTable = tablesForLocation.find(
                (t) => t?._id === order.table
              );

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
      const foundKitchen = getItem(order.kitchen as string, kitchens ?? []);
      if (
        user?.role &&
        !foundCategory?.isAutoServed &&
        order.status !== OrderStatus.CANCELLED &&
        foundKitchen?.soundRoles?.includes(user.role._id)
      ) {
        if (
          (order.kitchen as any)?.selectedRoles?.length > 0 &&
          !(order.kitchen as any)?.selectedRoles?.includes(user?.role?._id)
        ) {
          return;
        }
        if (audioReadyRef.current && audioRef.current) {
          audioRef.current
            .play()
            .catch((error) => console.error("Error playing sound:", error));
        }
      }
    });

    socket.on("orderUpdated", ({ orders }: { orders: Order[] }) => {
      const { queryClient, selectedDate } = latestValuesRef.current;

      const tableId =
        typeof orders[0]?.table === "number"
          ? orders[0]?.table
          : orders[0]?.table?._id;
      queryClient.invalidateQueries({
        queryKey: [`${Paths.Order}/table`, tableId],
      });
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/today`, selectedDate],
        (oldData) => {
          if (!oldData) {
            queryClient.invalidateQueries({
              queryKey: [`${Paths.Order}/today`],
            });
            return oldData;
          }
          for (const order of orders) {
            const normalizedOrder = order;
            if (typeof order.table === "number" && order.location) {
              const tablesForLocation = queryClient.getQueryData<Table[]>(
                [Paths.Tables, order.location, selectedDate]
              );

              if (tablesForLocation) {
                const foundTable = tablesForLocation.find(
                  (t) => t?._id === order.table
                );

                if (foundTable) {
                  normalizedOrder.table = foundTable;
                } else {
                  queryClient.invalidateQueries({
                    queryKey: [`${Paths.Order}/today`],
                  });
                  continue;
                }
              } else {
                queryClient.invalidateQueries({
                  queryKey: [`${Paths.Order}/today`],
                });
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
      const { queryClient, selectedDate } = latestValuesRef.current;

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
      // First, find the table's location by checking all locations (since we only have tableId)
      const orderLocation = order.location;
      if (orderLocation) {
        queryClient.setQueryData<Table[]>(
          [Paths.Tables, orderLocation, selectedDate],
          (old) => {
            if (!old) return old;
            return old.map((table) => {
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
        );
      } else {
        console.warn("Order doesn't have location. Order: ", order);
      }
    });

    socket.on(
      "collectionChanged",
      ({ collection }: { collection: OrderCollection }) => {
        const { queryClient, selectedDate } = latestValuesRef.current;

        queryClient.invalidateQueries({
          queryKey: [`${Paths.Order}/collection/table`, collection.table],
        });

        // Update today collections cache with populated table data
        queryClient.setQueryData<any[]>(
          [`${Paths.Order}/collection/today`, selectedDate],
          (oldData) => {
            if (!oldData) return oldData;

            // If table is just an ID, fetch the full table object from tables cache using collection's location
            if (typeof collection.table === "number" && collection.location) {
              const tablesForLocation = queryClient.getQueryData<Table[]>(
                [Paths.Tables, collection.location, selectedDate]
              );
              if (tablesForLocation) {
                const foundTable = tablesForLocation.find(
                  (t) => t?._id === collection.table
                );
                if (foundTable) {
                  collection.table = foundTable;
                } else {
                  // If table not found, invalidate and return
                  queryClient.invalidateQueries({
                    queryKey: [`${Paths.Order}/collection/today`],
                  });
                  return oldData;
                }
              } else {
                // If no tables data for this location, invalidate and return
                queryClient.invalidateQueries({
                  queryKey: [`${Paths.Order}/collection/today`],
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
        const { queryClient, user } = latestValuesRef.current;

        if (!user) return;
        if (
          notifications.some(
            (notification) =>
              notification.selectedUsers?.includes(user._id) ||
              (notification.selectedRoles?.includes(user.role?._id) &&
                !notification.seenBy?.includes(user._id))
          )
        ) {
          queryClient.invalidateQueries({
            queryKey: [`${Paths.Notification}/new`],
          });
          queryClient.invalidateQueries({
            queryKey: [`${Paths.Notification}/all`],
          });
          queryClient.invalidateQueries({
            queryKey: [`${Paths.Notification}/event`],
          });
        }
      }
    );

    socket.on("singleTableChanged", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
      queryClient.setQueryData<Table[]>(
        [Paths.Tables, locationId, date],
        (old) => {
          if (!old) return [table];
          return old.map((prevTable) => {
            if (prevTable?._id === table._id) {
              return { ...prevTable, ...table };
            }
            return prevTable;
          });
        }
      );
    });

    socket.on("stockChanged", () => {
      queryClient.invalidateQueries({
        queryKey: [`${Paths.Accounting}/stocks`],
      });
      queryClient.invalidateQueries({
        queryKey: [`${Paths.Accounting}/stocks/query`],
      });
    });

    socket.on("tableCreated", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
      queryClient.setQueryData<Table[]>(
        [Paths.Tables, locationId, date],
        (old) => {
          if (!old) return [table];
          // Check if table already exists to avoid duplicates
          if (old.some((t) => t._id === table._id)) {
            return old;
          }
          return [...old, table];
        }
      );
    });

    socket.on("tableDeleted", ({ table: deletedTable }: { table: Table }) => {
      console.log("tableDeleted", deletedTable);
      const locationId = deletedTable.location;
      const date = deletedTable.date;
      queryClient.setQueryData<Table[]>(
        [Paths.Tables, locationId, date],
        (old) => {
          if (!old) return [];
          return old.filter((table) => table?._id !== deletedTable?._id);
        }
      );
    });

    socket.on("tableClosed", ({ table: closedTable }: { table: Table }) => {
      const locationId = closedTable.location;
      const date = closedTable.date;
      queryClient.setQueryData<Table[]>(
        [Paths.Tables, locationId, date],
        (old) => {
          if (!old) return [];
          return old.map((table) => {
            if (table?._id === closedTable?._id) {
              return {
                ...table,
                finishHour: closedTable.finishHour,
              };
            }
            return table;
          });
        }
      );
    });

    socket.on(
      "gameplayCreated",
      ({
        gameplay,
        user: creatingUser,
        tableId,
      }: {
        gameplay: Gameplay;
        user: User;
        tableId: number;
      }) => {
        const { queryClient, user } = latestValuesRef.current;

        // Only update cache for other users' actions
        if (creatingUser._id === user?._id) return;

        const locationId = gameplay.location;
        const date = gameplay.date;
        if (!gameplay || !locationId || !date) return;

        queryClient.setQueryData<Table[]>(
          [Paths.Tables, locationId, date],
          (old) => {
            if (!old) return [];
            return old.map((t) => {
              if (t?._id === Number(tableId)) {
                return {
                  ...t,
                  gameplays: [...t.gameplays, gameplay],
                };
              }
              return t;
            });
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
        const { queryClient, user } = latestValuesRef.current;

        // Only update cache for other users' actions
        if (deletingUser._id === user?._id) return;

        const gameplayId = gameplay?._id;
        const locationId = gameplay.location;
        const date = gameplay.date;
        if (!gameplayId || !locationId || !date) return;

        queryClient.setQueryData<Table[]>(
          [Paths.Tables, locationId, date],
          (old) => {
            if (!old) return [];
            return old.map((t) => {
              if (t?._id === Number(tableId)) {
                return {
                  ...t,
                  gameplays: t.gameplays.filter((g) => g?._id !== gameplayId),
                };
              }
              return t;
            });
          }
        );
      }
    );

    socket.on(
      "gameplayUpdated",
      ({
        gameplay,
        user: updatingUser,
      }: {
        gameplay: Gameplay;
        user: User;
      }) => {
        const { queryClient, user } = latestValuesRef.current;

        // Only update cache for other users' actions
        if (updatingUser._id === user?._id) return;

        const locationId = gameplay.location;
        const date = gameplay.date;
        if (!gameplay || !locationId || !date) return;

        queryClient.setQueryData<Table[]>(
          [Paths.Tables, locationId, date],
          (old) => {
            if (!old) return [];
            return old.map((t) => {
              if (t?.gameplays.some((g) => g._id === gameplay._id)) {
                return {
                  ...t,
                  gameplays: t.gameplays.map((g) =>
                    g?._id === gameplay?._id ? gameplay : g
                  ),
                };
              }
              return t;
            });
          }
        );
      }
    );

    socket.on("tableChanged", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
      queryClient.invalidateQueries({ queryKey: [Paths.Tables, locationId, date] });
    });

    socket.on(
      "createMultipleOrder",
      ({
        table,
        user: creatingUser,
        locationId,
        kitchenIds,
      }: {
        table: Table;
        user: User;
        locationId: number;
        kitchenIds: string[];
      }) => {
        const {
          queryClient,
          user,
          selectedLocationId,
          kitchens,
          setIsTakeAwayPaymentModalOpen,
          setTakeawayTableId,
          setOrderCreateBulk,
          setSelectedNewOrders,
        } = latestValuesRef.current;

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
        const foundKitchens = kitchenIds.map((kitchenId) =>
          getItem(kitchenId, kitchens ?? [])
        );
        foundKitchens.forEach((foundKitchen) => {
          const { soundRoles, selectedUsers } = foundKitchen ?? {};
          if (
            soundRoles?.includes(user.role?._id) &&
            locationId === selectedLocationId
          ) {
            if (
              selectedUsers &&
              selectedUsers.length > 0 &&
              !selectedUsers?.includes(user._id)
            ) {
              return;
            }
            if (audioReadyRef.current && audioRef.current) {
              audioRef.current
                .play()
                .catch((error) => console.error("Error playing sound:", error));
              return;
            }
          }
        });
      }
    );

    socketEventListeners.forEach((eventConfig) => {
      socket.on(eventConfig.event, () => {
        const { queryClient } = latestValuesRef.current;
        eventConfig.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      });
    });

    // Cleanup: only close socket when component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - only runs on mount/unmount
}
