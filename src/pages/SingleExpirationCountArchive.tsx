import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useUserContext } from "../context/User.context";
import { RoleEnum } from "../types";
import { useGetAllAccountProducts } from "../utils/api/account/product";
import {
  useExpirationCountMutations,
  useGetExpirationCounts,
} from "../utils/api/expiration/expirationCount";
import { useGetExpirationLists } from "../utils/api/expiration/expirationList";
import { useGetUsers } from "../utils/api/user";
import { getItem } from "../utils/getItem";

const SingleExpirationCountArchive = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const expirationCounts = useGetExpirationCounts();
  const expirationLists = useGetExpirationLists();
  const users = useGetUsers();
  const { updateExpirationCount } = useExpirationCountMutations();
  const products = useGetAllAccountProducts();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const foundCount = expirationCounts?.find((count) => count._id === archiveId);
  const currentCount = expirationCounts?.find(
    (count) => count._id === archiveId
  );
  const allRows = () => {
    if (!currentCount) return [];

    const date = new Date(currentCount.createdAt);
    const formattedDate = `${pad(date.getDate())}-${pad(
      date.getMonth() + 1
    )}-${date.getFullYear()}`;

    return (
      currentCount.products
        ?.map((option) => {
          const foundProduct = getItem(option.product, products);
          if (!foundProduct || foundProduct.deleted) return null;

          return {
            currentCountId: currentCount._id,
            currentCountLocationId: currentCount.location,
            product: foundProduct.name,
            productId: option.product,
            date: formattedDate,
          };
        })
        .filter((row) => row !== null) ?? []
    );
  };

  const [rows, setRows] = useState(allRows());
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Product"), isSortable: true },
    { key: t("Stock Quantity"), isSortable: true },
    { key: t("Count Quantity"), isSortable: true },
    { key: t("Delete Request"), isSortable: true },
    { key: t("Stock Equalized"), isSortable: true },
    { key: t("Actions"), isSortable: true },
  ];
  const rowKeys = [
    { key: "date", className: "min-w-32" },
    { key: "product" },
    { key: "stockQuantity" },
    { key: "countQuantity" },
    { key: "productDeleteRequest" },
    {
      key: "isStockEqualized",
      node: (row: any) => {
        return row?.isStockEqualized ? (
          <IoCheckmark className={`text-blue-500 text-2xl `} />
        ) : (
          <IoCloseOutline className={`text-red-800 text-2xl `} />
        );
      },
    },
  ];
  function getBgColor(row: {
    stockQuantity: number;
    countQuantity: number;
    product: string;
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
    setRows(allRows());
    setTableKey((prev) => prev + 1);
  }, [expirationCounts, products, archiveId, expirationLists, users]);
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
            isActionsActive={false}
            rowClassNameFunction={
              user?.role?._id &&
              [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)
                ? getBgColor
                : undefined
            }
            filters={filters}
            title={`${getItem(foundCount?.user, users)?.name}  ${t("Countu")}`} //date will be added here
          />
        )}
      </div>
    </>
  );
};

export default SingleExpirationCountArchive;
