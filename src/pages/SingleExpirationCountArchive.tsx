import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGetAllAccountProducts } from "../utils/api/account/product";
import {
  useExpirationCountMutations,
  useGetExpirationCounts,
} from "../utils/api/expiration/expirationCount";
import { useGetExpirationLists } from "../utils/api/expiration/expirationList";
import { useGetUsers } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

const SingleExpirationCountArchive = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const [tableKey, setTableKey] = useState(0);
  const expirationCounts = useGetExpirationCounts();
  const expirationLists = useGetExpirationLists();
  const users = useGetUsers();
  const { updateExpirationCount } = useExpirationCountMutations();
  const products = useGetAllAccountProducts();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const currentExpirationCount = expirationCounts?.find(
    (count) => count._id === archiveId
  );
  const allRows = (
    currentExpirationCount?.products?.map((item) => {
      const foundProduct = getItem(item.product, products);
      if (!foundProduct) return null;
      const date = new Date(currentExpirationCount.createdAt);
      const formattedDate = `${pad(date.getDate())}-${pad(
        date.getMonth() + 1
      )}-${date.getFullYear()}`;
      return {
        formattedDate,
        productName: foundProduct.name,
        productId: foundProduct._id,
        collapsible: {
          collapsibleColumns: [
            { key: t("Expiration Date"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
          ],
          collapsibleRowKeys: [
            {
              key: "expirationDate",
              node: (row: any) => {
                return <p>{formatAsLocalDate(row.expirationDate)}</p>;
              },
            },
            { key: "quantity" },
          ],
          collapsibleRows:
            currentExpirationCount?.products?.find(
              (expirationCountProduct) =>
                expirationCountProduct?.product === item.product
            )?.dateQuantities ?? [],
        },
      };
    }) ?? []
  )?.filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Product"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "formattedDate", className: "min-w-32" },
    {
      key: "productName",
      node: (row: any) => {
        return (
          <div
            className={`${
              row?.productDeleteRequest
                ? "bg-red-200 w-fit px-2 py-1 rounded-md text-white"
                : ""
            }`}
          >
            {row.productName}
          </div>
        );
      },
    },
  ];

  const filters = [
    {
      isUpperSide: false,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            if (archiveId) {
              updateExpirationCount({
                id: archiveId,
                updates: {
                  isCompleted: true,
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

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [expirationCounts, products, archiveId, expirationLists, users]);
  return (
    <>
      <Header />
      <div className="w-[95%] mx-auto my-10 ">
        {currentExpirationCount && (
          <GenericTable
            key={tableKey}
            rowKeys={rowKeys}
            columns={columns}
            rows={rows}
            isActionsActive={false}
            filters={filters}
            isCollapsible={true}
            title={`${getItem(currentExpirationCount?.user, users)?.name}  ${t(
              "Countu"
            )}`} //date will be added here
          />
        )}
      </div>
    </>
  );
};

export default SingleExpirationCountArchive;
