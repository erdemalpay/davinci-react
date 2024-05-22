import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { AccountCountList, AccountStockLocation, User } from "../types";
import {
  useAccountCountMutations,
  useGetAccountCounts,
} from "../utils/api/account/count";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";
const Count = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const products = useGetAccountProducts();
  const counts = useGetAccountCounts();
  const { setAccountingActiveTab } = useGeneralContext();
  const { createAccountCount } = useAccountCountMutations();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const { location, countListId } = useParams();

  const [rows, setRows] = useState(
    countLists
      .find((cl) => cl._id === countListId)
      ?.products?.map((item) => {
        const currentCount = counts?.find((item) => {
          return (
            item.isCompleted === false &&
            (item.location as AccountStockLocation)._id === location &&
            (item.user as User)._id === user?._id &&
            (item.countList as AccountCountList)._id === countListId
          );
        });
        if (location && item.locations.includes(location)) {
          return {
            product: products.find((p) => p._id === item.product)?.name || "",
            collapsible: {
              collapsibleHeader: t("Package Details"),
              collapsibleColumns: [
                { key: t("Package Type"), isSortable: true },
                { key: t("Quantity"), isSortable: true },
                {
                  key: t("Action"),
                  isSortable: false,
                  className: "text-center",
                },
              ],
              collapsibleRows: currentCount?.products
                ?.filter((p) => p.product === item.product)
                ?.map((p) => {
                  return {
                    packageType: p.packageType,
                    quantity: p.countQuantity,
                  };
                }),
              collapsibleRowKeys: [{ key: "packageType" }, { key: "quantity" }],
            },
          };
        }
        return { product: "" };
      })
      .filter((item) => item.product !== "") || []
  );
  useEffect(() => {
    setRows(
      countLists
        .find((cl) => cl._id === countListId)
        ?.products?.map((item) => {
          const currentCount = counts?.find((item) => {
            return (
              item.isCompleted === false &&
              (item.location as AccountStockLocation)._id === location &&
              (item.user as User)._id === user?._id &&
              (item.countList as AccountCountList)._id === countListId
            );
          });
          if (location && item.locations.includes(location)) {
            return {
              product: products.find((p) => p._id === item.product)?.name || "",
              collapsible: {
                collapsibleHeader: t("Package Details"),
                collapsibleColumns: [
                  { key: t("Package Type"), isSortable: true },
                  { key: t("Quantity"), isSortable: true },
                  {
                    key: t("Action"),
                    isSortable: false,
                    className: "text-center",
                  },
                ],
                collapsibleRows: currentCount?.products
                  ?.filter((p) => p.product === item.product)
                  ?.map((p) => {
                    return {
                      packageType: p.packageType,
                      quantity: p.countQuantity,
                    };
                  }),
                collapsibleRowKeys: [
                  { key: "packageType" },
                  { key: "quantity" },
                ],
              },
            };
          }
          return { product: "" };
        })
        .filter((item) => item.product !== "") || []
    );
    setTableKey((prev) => prev + 1);
  }, [countListId, countLists, location, products, counts]);

  const columns = [{ key: t("Product"), isSortable: true }];
  const rowKeys = [{ key: "product" }];
  return (
    <>
      <Header />
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Count")}
          isCollapsible={products.length > 0}
        />
      </div>
    </>
  );
};

export default Count;
