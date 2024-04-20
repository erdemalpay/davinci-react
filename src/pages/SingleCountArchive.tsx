import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { Routes } from "../navigation/constants";
import {
  AccountCountList,
  AccountingPageTabEnum,
  AccountUnit,
  User,
} from "../types";
import {
  useAccountCountMutations,
  useGetAccountCounts,
} from "../utils/api/account/count";
import { useGetAccountProducts } from "../utils/api/account/product";
import { formatAsLocalDate } from "../utils/format";

const SingleCountArchive = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const [tableKey, setTableKey] = useState(0);
  const counts = useGetAccountCounts();
  const { updateAccountCount } = useAccountCountMutations();
  const products = useGetAccountProducts();
  const { setAccountingActiveTab } = useGeneralContext();
  const foundCount = counts?.find((count) => count._id === archiveId);
  const navigations = [
    {
      name: t("Count Archive"),
      path: Routes.Accounting,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setAccountingActiveTab(AccountingPageTabEnum.COUNTARCHIVE);
      },
    },
    {
      name:
        (foundCount?.countList as AccountCountList)?.name + " " + t("Countu"),
      path: `/archive/${archiveId}`,
      canBeClicked: false,
    },
  ];
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
      <PageNavigator navigations={navigations} />
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

export default SingleCountArchive;
