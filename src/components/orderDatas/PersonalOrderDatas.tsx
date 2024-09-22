import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetUsers } from "../../utils/api/user";
import GenericTable from "../panelComponents/Tables/GenericTable";

interface PersonalOrderData {
  user: string;
  createdByCount: number;
  preparedByCount: number;
  cancelledByCount: number;
  deliveredByCount: number;
}
const PersonalOrderDatas = () => {
  const { t } = useTranslation();
  const orders = useGetOrders();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);

  if (!orders || !users) {
    return null;
  }
  const statusOptions = [
    { value: "pending", label: t("Pending") },
    { value: "ready_to_server", label: t("Ready to Serve") },
    { value: "served", label: t("Served") },
    { value: "cancelled", label: t("Cancelled") },
    { value: "autoserved", label: t("Auto served") },
  ];
  const allRows: PersonalOrderData[] = orders.reduce<PersonalOrderData[]>(
    (acc, order) => {
      if (!order || !order.createdAt) {
        return acc;
      }

      // Define roles to be processed
      const roles = [
        { key: "createdBy", prop: "createdByCount" },
        { key: "preparedBy", prop: "preparedByCount" },
        { key: "cancelledBy", prop: "cancelledByCount" },
        { key: "deliveredBy", prop: "deliveredByCount" },
      ];

      // Function to update or initialize user records
      roles.forEach(({ key, prop }) => {
        const userId = order[key];
        if (userId) {
          let userRecord = acc.find(
            (item: PersonalOrderData) => item.user === userId
          );
          if (!userRecord) {
            userRecord = {
              user: userId,
              createdByCount: 0,
              preparedByCount: 0,
              cancelledByCount: 0,
              deliveredByCount: 0,
            };
            acc.push(userRecord);
          }
          userRecord[prop as keyof PersonalOrderData]++;
        }
      });

      return acc;
    },
    []
  );

  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("User"), isSortable: true },
    { key: t("Created By Count"), isSortable: true },
    { key: t("Prepared By Count"), isSortable: true },
    { key: t("Delivered By Count"), isSortable: true },
    { key: t("Cancelled By Count"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "user",
      node: (row: PersonalOrderData) => {
        const user = users.find((user) => user._id === row.user);
        return user?.name;
      },
    },
    { key: "createdByCount" },
    { key: "preparedByCount" },
    { key: "deliveredByCount" },
    { key: "cancelledByCount" },
  ];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [orders, users]);
  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          key={tableKey}
          title={t("Personal Order Datas")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default PersonalOrderDatas;
