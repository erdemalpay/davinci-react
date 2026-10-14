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
import { toast } from "react-toastify";
import { Paths } from "../utils/api/factory";
import i18n from "../utils/i18n";
import { useGetCategories } from "../utils/api/menu/category";
import { useDateContext } from "./../context/Date.context";
import { useLocationContext } from "./../context/Location.context";
import { useOrderContext } from "./../context/Order.context";
import { useUserContext } from "./../context/User.context";
import { Table } from "./../types";
import { OrderStatus } from "./../types/index";
import { getItem } from "./../utils/getItem";
import { buildReceiptData } from "./../utils/printReceiptESCPOS";
import { printerService } from "./../utils/printerService";
import {
  FORCE_RECONNECT_AFTER_HIDDEN_MS,
  mergeCreatedOrders,
  resyncAfterMissedEvents,
  upsertCollection,
} from "../utils/socketSync";
import { socketEventListeners } from "./socketConstant";

const SOCKET_URL = import.meta.env.VITE_API_URL;
const GESTURE_EVENTS = [
  "click",
  "pointerdown",
  "touchstart",
  "keydown",
] as const;

export function useWebSocket(shouldConnect = false) {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const { selectedLocationId } = useLocationContext();
  const { selectedDate } = useDateContext();
  const { kitchens, menuItems = [], visits } = useDataContext();
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
    menuItems,
    categories,
    visits,
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
      menuItems,
      categories,
      visits,
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
    menuItems,
    categories,
    visits,
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

    // Don't connect if user is not authenticated
    if (!shouldConnect) {
      return;
    }

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

    // Reconnecting is socket.io's job. The server replays the events missed
    // while away for up to two minutes (socket.recovered); after a longer
    // absence the data on screen is reloaded.
    let hasConnected = false;
    socket.on("connect", () => {
      console.log(
        "✅ WebSocket connection established.",
        socket.recovered ? "(missed events replayed)" : ""
      );
      if (hasConnected && !socket.recovered) {
        const { queryClient } = latestValuesRef.current;
        resyncAfterMissedEvents(queryClient);
      }
      hasConnected = true;
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

    // Reconnection events come from the manager (socket.io), not the socket.
    socket.io.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 WebSocket reconnection attempt: ${attemptNumber}`);
    });
    socket.io.on("reconnect_error", (error: Error) => {
      console.warn("⚠️ WebSocket reconnection error:", error);
    });

    // Back from the lock screen or another app, or back online: the socket
    // may have died silently meanwhile. Reconnect now; the server replays
    // what was missed.
    let hiddenAt: number | null = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const hiddenFor = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = null;
      if (!socket.connected) {
        socket.connect();
      } else if (hiddenFor >= FORCE_RECONNECT_AFTER_HIDDEN_MS) {
        socket.io.engine?.close();
      }
    };
    const handleOnline = () => {
      if (!socket.connected) socket.connect();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error.message);
    });

    socket.on(
      "buttonCallChanged",
      ({
        action,
        assignedTo,
        tableName,
        type,
      }: {
        action?: string;
        assignedTo?: string;
        tableName?: string;
        type?: string;
      }) => {
        const { user, audioReadyRef, audioRef } = latestValuesRef.current;
        if (action !== "assign" || !user || assignedTo !== user._id) return;
        toast.info(
          i18n.t(
            type === "ORDERCALL"
              ? "ServiceCallAssignedToYou"
              : "GameMasterCallAssignedToYou",
            { tableName }
          )
        );
        if (audioReadyRef.current && audioRef.current) {
          audioRef.current
            .play()
            .catch((error) => console.error("Error playing sound:", error));
        }
      }
    );

    socket.on("orderCreated", ({ order }: { order: Order }) => {
      const {
        queryClient,
        selectedDate,
        user,
        selectedLocationId,
        categories,
        kitchens,
        visits,
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
            const tablesForLocation = queryClient.getQueryData<Table[]>([
              Paths.Tables,
              order.location,
              selectedDate,
            ]);

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

      const isValidOrder = ![
        OrderStatus.WASTED,
        OrderStatus.CANCELLED,
        OrderStatus.RETURNED,
      ].includes(order.status as OrderStatus);

      const foundKitchenForPrint = getItem(
        order.kitchen as string,
        kitchens ?? []
      );
      const { menuItems } = latestValuesRef.current;
      console.log("🖨️ [createOrder] fiş bilgileri:", {
        tableName: (order.table as Table)?.name,
        orders: [
          {
            urun: (order.item as unknown as MenuItem)?.name ?? order.item,
            adet: order.quantity,
            ...(order.activityTableName
              ? { activityMasa: order.activityTableName }
              : {}),
            ...(order.activityPlayer
              ? { activityOyuncu: order.activityPlayer }
              : {}),
            not: order.note || "-",
          },
        ],
        printerConnected: printerService.isConnected,
        isPrintEnabled: foundKitchenForPrint?.isPrintEnabled ?? false,
      });
      if (
        isValidOrder &&
        printerService.isConnected &&
        foundKitchenForPrint?.isPrintEnabled
      ) {
        buildReceiptData({
          orders: [order],
          items: menuItems,
          tableName: (order.table as Table)?.name,
        }).then((data) => {
          if (data) printerService.print(data);
        });
      }

      if (
        order.createdBy === user?._id ||
        !isValidOrder ||
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
        ![OrderStatus.SERVED, OrderStatus.AUTOSERVED].includes(
          order.status as OrderStatus
        ) &&
        foundKitchen?.soundRoles?.includes(user.role._id) &&
        (visits ?? []).some(
          (visit) => visit.user === user._id && !visit.finishHour
        )
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
              const tablesForLocation = queryClient.getQueryData<Table[]>([
                Paths.Tables,
                order.location,
                selectedDate,
              ]);

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
            let found = false;
            const updatedData: any[] = (oldData as any[]).map((order) => {
              if (order._id === normalizedOrder._id) {
                found = true;
                return normalizedOrder;
              }
              return order;
            });
            oldData = found
              ? updatedData
              : [...(oldData as any[]), normalizedOrder];
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
          return oldData.filter((o) => o._id !== order._id);
        }
      );

      // Remove order from today orders cache
      queryClient.setQueryData<any[]>(
        [`${Paths.Order}/today`, selectedDate],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.filter((o) => o._id !== order._id);
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
              const tablesForLocation = queryClient.getQueryData<Table[]>([
                Paths.Tables,
                collection.location,
                selectedDate,
              ]);
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

            return upsertCollection(oldData, collection);
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
      const { queryClient } = latestValuesRef.current;
      const locationId = table.location;
      const date = table.date;
      queryClient.invalidateQueries({
        queryKey: [Paths.Tables, locationId, date],
      });
    });

    socket.on("tableCreated", ({ table }: { table: Table }) => {
      const { queryClient } = latestValuesRef.current;
      const locationId = table.location;
      const date = table.date;
      queryClient.invalidateQueries({
        queryKey: [Paths.Tables, locationId, date],
      });
    });
    socket.on("tableDeleted", ({ table: deletedTable }: { table: Table }) => {
      const { queryClient } = latestValuesRef.current;
      const locationId = deletedTable.location;
      const date = deletedTable.date;
      queryClient.invalidateQueries({
        queryKey: [Paths.Tables, locationId, date],
      });
    });

    socket.on("tableClosed", ({ table: closedTable }: { table: Table }) => {
      const { queryClient } = latestValuesRef.current;
      const locationId = closedTable.location;
      const date = closedTable.date;
      queryClient.invalidateQueries({
        queryKey: [Paths.Tables, locationId, date],
      });
    });

    socket.on("tableChanged", ({ table }: { table: Table }) => {
      const locationId = table.location;
      const date = table.date;
      queryClient.invalidateQueries({
        queryKey: [Paths.Tables, locationId, date],
      });
    });

    socket.on(
      "gameplayCreated",
      ({ gameplay }: { gameplay: Gameplay; tableId: number }) => {
        const { queryClient } = latestValuesRef.current;
        const locationId = gameplay.location;
        const date = gameplay.date;
        if (!gameplay || !locationId || !date) return;

        queryClient.invalidateQueries({
          queryKey: [Paths.Tables, locationId, date],
        });
      }
    );

    socket.on(
      "gameplayDeleted",
      ({ gameplay }: { gameplay: Gameplay; tableId: number }) => {
        const { queryClient } = latestValuesRef.current;

        const locationId = gameplay.location;
        const date = gameplay.date;
        if (!gameplay || !locationId || !date) return;

        queryClient.invalidateQueries({
          queryKey: [Paths.Tables, locationId, date],
        });
      }
    );

    socket.on("gameplayUpdated", ({ gameplay }: { gameplay: Gameplay }) => {
      const { queryClient } = latestValuesRef.current;
      const locationId = gameplay.location;
      const date = gameplay.date;
      if (!gameplay || !locationId || !date) return;

      queryClient.invalidateQueries({
        queryKey: [Paths.Tables, locationId, date],
      });
    });

    socket.on(
      "createMultipleOrder",
      ({
        table,
        user: creatingUser,
        locationId,
        kitchenIds,
        orders: createdOrders,
      }: {
        table: Table;
        user: User;
        locationId: number;
        kitchenIds: string[];
        // The created orders (older APIs don't send them).
        orders?: Order[];
      }) => {
        const {
          queryClient,
          user,
          selectedLocationId,
          kitchens,
          visits,
          setIsTakeAwayPaymentModalOpen,
          setTakeawayTableId,
          setOrderCreateBulk,
          setSelectedNewOrders,
        } = latestValuesRef.current;

        const {
          selectedDate,
          menuItems,
          kitchens: currentKitchens,
        } = latestValuesRef.current;

        const shouldPrint =
          printerService.isConnected &&
          kitchenIds.some(
            (id) => getItem(id, currentKitchens ?? [])?.isPrintEnabled
          );

        const todayKey = [`${Paths.Order}/today`, selectedDate];
        const printNewOrders = (newOrders: Order[] | undefined) => {
          console.log("🖨️ [createMultipleOrder] fiş bilgileri:", {
            tableName: table.name,
            orderCount: newOrders?.length ?? 0,
            orders: newOrders?.map((o) => ({
              urun: (o.item as unknown as MenuItem)?.name ?? o.item,
              adet: o.quantity,
              ...(o.activityTableName
                ? { activityMasa: o.activityTableName }
                : {}),
              ...(o.activityPlayer ? { activityOyuncu: o.activityPlayer } : {}),
              not: o.note || "-",
            })),
            printerConnected: printerService.isConnected,
          });
          if (newOrders?.length && shouldPrint) {
            buildReceiptData({
              orders: newOrders,
              items: menuItems,
              tableName: table.name,
            }).then((data) => {
              if (data) printerService.print(data);
            });
          }
          return newOrders;
        };

        let newOrdersPromise: Promise<Order[] | undefined>;
        if (createdOrders) {
          // The orders came with the event: add them, no reload. Only the
          // ones this panel didn't have yet are printed, as before.
          const hadOrders = !!queryClient.getQueryData<Order[]>(todayKey);
          let added: Order[] = [];
          queryClient.setQueryData<Order[]>(todayKey, (oldData) => {
            const merged = mergeCreatedOrders(oldData, createdOrders);
            added = merged.added;
            return merged.orders;
          });
          if (!hadOrders) {
            queryClient.invalidateQueries({ queryKey: todayKey });
          }
          newOrdersPromise = Promise.resolve(
            printNewOrders(
              (hadOrders ? added : createdOrders).filter(
                (o) => o.status !== OrderStatus.CANCELLED
              )
            )
          );
        } else {
          const existingOrders = queryClient.getQueryData<Order[]>(todayKey);
          const existingOrderIds = new Set(
            existingOrders
              ?.filter(
                (o) =>
                  (typeof o.table === "number" ? o.table : o.table?._id) ===
                  table._id
              )
              .map((o) => o._id)
          );
          newOrdersPromise = queryClient
            .refetchQueries({ queryKey: todayKey })
            .then(() => {
              const todayOrders = queryClient.getQueryData<Order[]>(todayKey);
              return printNewOrders(
                todayOrders?.filter(
                  (o) =>
                    (typeof o.table === "number" ? o.table : o.table?._id) ===
                      table._id &&
                    o.status !== OrderStatus.CANCELLED &&
                    !existingOrderIds.has(o._id)
                )
              );
            });
        }

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
        if (locationId !== selectedLocationId) return;
        const hasActiveVisit = (visits ?? []).some(
          (visit) => visit.user === user._id && !visit.finishHour
        );
        if (!hasActiveVisit) return;
        const foundKitchens = kitchenIds.map((kitchenId) =>
          getItem(kitchenId, kitchens ?? [])
        );
        newOrdersPromise.then((newOrders) => {
          // servis edildi olarak oluşturulan siparişler için ses çalınmaz
          if (
            !newOrders?.some(
              (order) =>
                ![OrderStatus.SERVED, OrderStatus.AUTOSERVED].includes(
                  order.status as OrderStatus
                )
            )
          ) {
            return;
          }
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
                  .catch((error) =>
                    console.error("Error playing sound:", error)
                  );
                return;
              }
            }
          });
        });
      }
    );

    socketEventListeners.forEach((eventConfig) => {
      socket.on(eventConfig.event, () => {
        const { queryClient } = latestValuesRef.current;
        eventConfig.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], exact: false });
        });
      });
    });

    // Cleanup: only close socket when component unmounts
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [shouldConnect]); // Connect when user is authenticated
}
