import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGeneralContext } from "../context/General.context";
import { Routes } from "../navigation/constants";
import { useGetAllAccountProducts } from "../utils/api/account/product";
import { useGetExpirationCounts } from "../utils/api/expiration/expirationCount";
import { useGetExpirationLists } from "../utils/api/expiration/expirationList";
import { useGetUsersMinimal } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

const SingleExpirationCountArchive = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const expirationCounts = useGetExpirationCounts();
  const expirationLists = useGetExpirationLists();
  const users = useGetUsersMinimal();
  const { resetGeneralContext } = useGeneralContext();
  const products = useGetAllAccountProducts();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);

  const currentExpirationCount = useMemo(() => {
    return expirationCounts?.find((count) => count._id === archiveId);
  }, [expirationCounts, archiveId]);

  const rows = useMemo(() => {
    const allRows = (
      currentExpirationCount?.products?.map((item) => {
        const foundProduct = getItem(item.product, products);
        if (!foundProduct) return null;
        const date = new Date(currentExpirationCount.createdAt);
        const formattedDate = `${pad(date.getDate())}-${pad(
          date.getMonth() + 1
        )}-${date.getFullYear()}`;
        function getBgColor(expirationDate: string): string {
          const expDate = new Date(expirationDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expDate.setHours(0, 0, 0, 0);
          const diffTime = expDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            return "bg-red-200";
          } else if (diffDays <= 20) {
            return "bg-blue-200";
          }
          return "";
        }
        return {
          formattedDate,
          productName: foundProduct.name,
          productId: foundProduct._id,
          collapsible: {
            collapsibleColumns: [
              { key: t("Expiration Date"), isSortable: true },
              { key: t("Quantity"), isSortable: true },
            ],
            className: (row: any) => {
              return getBgColor(row.expirationDate);
            },
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
              currentExpirationCount?.products
                ?.find(
                  (expirationCountProduct) =>
                    expirationCountProduct?.product === item?.product
                )
                ?.dateQuantities?.sort((a, b) => {
                  const timeA = new Date(a.expirationDate).getTime();
                  const timeB = new Date(b.expirationDate).getTime();
                  return timeA - timeB;
                }) ?? [],
          },
        };
      }) ?? []
    )?.filter((item) => item !== null);
    return allRows;
  }, [currentExpirationCount, products, t, pad]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Product"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
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
    ],
    []
  );

  const pageNavigations = useMemo(
    () => [
      {
        name: t("Expirations"),
        path: Routes.Expirations,
        canBeClicked: true,
        additionalSubmitFunction: () => {
          resetGeneralContext();
        },
      },
      {
        name:
          getItem(currentExpirationCount?.expirationList, expirationLists)
            ?.name +
          " " +
          t("Countu"),
        path: `/expiration-archive/${archiveId}`,
        canBeClicked: false,
      },
    ],
    [t, currentExpirationCount, expirationLists, archiveId, resetGeneralContext]
  );

  return (
    <>
      <Header />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto my-10 ">
        {currentExpirationCount && (
          <GenericTable
            rowKeys={rowKeys}
            columns={columns}
            rows={rows}
            isActionsActive={false}
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
