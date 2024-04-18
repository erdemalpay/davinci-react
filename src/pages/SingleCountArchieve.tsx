import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { AccountUnit, User } from "../types";
import {
  useAccountCountMutations,
  useGetAccountCounts,
} from "../utils/api/account/count";
import { useGetAccountProducts } from "../utils/api/account/product";
import { formatAsLocalDate } from "../utils/format";

const SingleCountArchieve = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const [tableKey, setTableKey] = useState(0);
  const counts = useGetAccountCounts();
  const { updateAccountCount } = useAccountCountMutations();
  const products = useGetAccountProducts();
  const foundCount = counts?.find((count) => count._id === archiveId);
  const [rows, setRows] = useState(
    counts
      ?.find((count) => count._id === archiveId)
      ?.products?.map((option) => ({
        product: products?.find((item) => item._id === option.product)?.name,
        unit: (
          products?.find((item) => item._id === option.product)
            ?.unit as AccountUnit
        )?.name,
        stockQuantity: option.stockQuantity,
        countQuantity: option.countQuantity,
      })) || []
  );
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Stock Quantity"), isSortable: true },
    { key: t("Count Quantity"), isSortable: true },
  ];
  const rowKeys = [
    { key: "product" },
    { key: "unit" },
    { key: "stockQuantity" },
    { key: "countQuantity" },
  ];
  function getBgColor(row: {
    stockQuantity: number;
    countQuantity: number;
    product: string;
    unit: string;
  }) {
    if (Number(row.stockQuantity) === Number(row.countQuantity)) {
      return "bg-blue-100";
    } else if (Number(row.stockQuantity) > Number(row.countQuantity)) {
      return "bg-red-100";
    } else if (Number(row.stockQuantity) < Number(row.countQuantity)) {
      return "bg-green-100";
    }
    return "bg-green-500";
  }
  useEffect(() => {
    setRows(
      counts
        ?.find((count) => count._id === archiveId)
        ?.products?.map((option) => ({
          product: products?.find((item) => item._id === option.product)?.name,
          unit: (
            products?.find((item) => item._id === option.product)
              ?.unit as AccountUnit
          )?.name,
          stockQuantity: option.stockQuantity,
          countQuantity: option.countQuantity,
        })) || []
    );
    setTableKey((prev) => prev + 1);
  }, [counts, products, archiveId]);
  const filters = [
    {
      isUpperSide: false,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            if (archiveId) {
              updateAccountCount({
                id: archiveId,
                updates: {
                  status: true,
                },
              });
            }
          }}
        >
          <H5> {t("Complete")}</H5>
        </button>
      ),
    },
  ];
  return (
    <>
      <Header />
      <div className="w-[95%] mx-auto my-10 ">
        {foundCount && (
          <GenericTable
            key={tableKey}
            rowKeys={rowKeys}
            columns={columns}
            rows={rows}
            rowClassNameFunction={getBgColor}
            filters={foundCount && !foundCount.status ? filters : []}
            title={`${(foundCount?.user as User)?.name} ${formatAsLocalDate(
              foundCount?.date ?? ""
            )} ${t("Countu")}`}
          />
        )}
      </div>
    </>
  );
};

export default SingleCountArchieve;
