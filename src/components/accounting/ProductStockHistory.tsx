import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAccountProductStockHistorys } from "../../utils/api/account/productStockHistory";
import GenericTable from "../panelComponents/Tables/GenericTable";

const ProductStockHistory = () => {
  const { t } = useTranslation();
  const stockHistories = useGetAccountProductStockHistorys();
  const [tableKey, setTableKey] = useState(0);
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const [rows, setRows] = useState(() => {
    return stockHistories.map((stockHistory) => {
      const date = new Date(stockHistory.createdAt);
      return {
        ...stockHistory,
        prdct: stockHistory.product?.name,
        pckgTyp: stockHistory?.packageType?.name,
        lctn: stockHistory?.location?.name,
        usr: stockHistory?.user?.name,
        date: `${pad(date.getDate())}-${pad(
          date.getMonth() + 1
        )}-${date.getFullYear()}`,
        hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
      };
    });
  });
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Hour"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Product"), isSortable: true },
    { key: t("Package Type"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Old Quantity"), isSortable: true },
    { key: t("Changed"), isSortable: true },
    { key: t("Status"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-1",
    },
    {
      key: "hour",
      className: "min-w-32 pr-1",
    },
    {
      key: "usr",
      className: "min-w-32 pr-1",
    },
    {
      key: "prdct",
      className: "min-w-32 pr-1",
    },
    {
      key: "pckgTyp",
      className: "min-w-32 pr-1",
    },
    {
      key: "lctn",
      className: "min-w-32 pr-1",
    },
    {
      key: "currentAmount",
      className: "min-w-32 pr-1",
    },
    {
      key: "change",
      className: "min-w-32 pr-1",
    },
    {
      key: "status",
      className: "min-w-32 pr-1",
    },
  ];

  useEffect(() => {
    setRows(
      stockHistories.map((stockHistory) => {
        const date = new Date(stockHistory.createdAt);
        return {
          ...stockHistory,
          prdct: stockHistory.product?.name,
          pckgTyp: stockHistory?.packageType?.name,
          lctn: stockHistory?.location?.name,
          usr: stockHistory?.user?.name,
          date: `${pad(date.getDate())}-${pad(
            date.getMonth() + 1
          )}-${date.getFullYear()}`,
          hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
        };
      })
    );
    setTableKey((prev) => prev + 1);
  }, [stockHistories]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Product Stock History")}
        />
      </div>
    </>
  );
};

export default ProductStockHistory;
