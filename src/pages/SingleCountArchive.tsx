import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { LuCircleEqual } from "react-icons/lu";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Header } from "../components/header/Header";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import ButtonFilter from "../components/panelComponents/common/ButtonFilter";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { RoleEnum } from "../types";
import {
  useAccountCountMutations,
  useGetAccountCounts,
  useUpdateStockForStockCountBulkMutation,
  useUpdateStockForStockCountMutation,
} from "../utils/api/account/count";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAllAccountProducts } from "../utils/api/account/product";
import { useGetUsers } from "../utils/api/user";
import { getItem } from "../utils/getItem";

const SingleCountArchive = () => {
  const { t } = useTranslation();
  const { archiveId } = useParams();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const counts = useGetAccountCounts();
  const countLists = useGetAccountCountLists();
  const users = useGetUsers();
  const { mutate: updateStockForStockCount } =
    useUpdateStockForStockCountMutation();
  const { mutate: updateStockForStockCountBulk } =
    useUpdateStockForStockCountBulkMutation();
  const { updateAccountCount } = useAccountCountMutations();
  const products = useGetAllAccountProducts();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const foundCount = counts?.find((count) => count._id === archiveId);
  const pageNavigations = [
    {
      name: t("Count Archive"),
      path: Routes.CountLists,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setCurrentPage(1);
        // setRowsPerPage(RowPerPageEnum.FIRST);
        setSortConfigKey(null);
        setSearchQuery("");
      },
    },
    {
      name:
        getItem(foundCount?.countList, countLists)?.name + " " + t("Countu"),
      path: `/archive/${archiveId}`,
      canBeClicked: false,
    },
  ];
  const allRows = () => {
    const currentCount = counts?.find((count) => count._id === archiveId);
    if (!currentCount) return [];
    const date = new Date(currentCount.createdAt);
    return (
      currentCount?.products?.map((option) => ({
        currentCountId: currentCount._id,
        currentCountLocationId: currentCount?.location,
        product: products?.find((item) => item._id === option.product)?.name,
        productId: option.product,
        date: `${pad(date.getDate())}-${pad(
          date.getMonth() + 1
        )}-${date.getFullYear()}`,

        stockQuantity: option.stockQuantity,
        countQuantity: option.countQuantity,
        isStockEqualized: option?.isStockEqualized ?? false,
      })) || []
    );
  };
  const [rows, setRows] = useState(allRows());
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Product"), isSortable: true },
    { key: t("Stock Quantity"), isSortable: true },
    { key: t("Count Quantity"), isSortable: true },
    { key: t("Stock Equalized"), isSortable: true },
    { key: t("Actions"), isSortable: true },
  ];
  const rowKeys = [
    { key: "date", className: "min-w-32" },
    { key: "product" },
    { key: "stockQuantity" },
    { key: "countQuantity" },
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
              updateAccountCount({
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
  if (user?.role?._id !== RoleEnum.MANAGER) {
    const splicedColumns = ["Stock Equalized", "Actions"];
    const splicedRowKeys = ["isStockEqualized"];
    splicedColumns.forEach((item) => {
      columns.splice(
        columns.findIndex((column) => column.key === item),
        1
      );
    });
    splicedRowKeys.forEach((item) => {
      rowKeys.splice(
        rowKeys.findIndex((rowKey) => rowKey.key === item),
        1
      );
    });
  }
  const actions = [
    {
      name: t("Equalize"),
      icon: <LuCircleEqual />,
      node: (row: any) => (
        <ButtonTooltip content={t("Equalize")}>
          <button
            onClick={() => {
              if (row?.isStockEqualized) {
                toast.error(t("Stock is already equalized"));
                return;
              }
              updateStockForStockCount({
                product: row.productId,
                location: row.currentCountLocationId,
                quantity: row.countQuantity,
                currentCountId: row.currentCountId,
              });
            }}
          >
            <LuCircleEqual className=" w-6 h-6 mt-2" />
          </button>
        </ButtonTooltip>
      ),
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: false,
      isPath: false,
    },
  ];
  const archieveFilters = [
    {
      isUpperSide: false,
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      node: (
        <ButtonFilter
          buttonName={t("Stock Equalize")}
          onclick={() => {
            const currentCount = counts?.find(
              (count) => count._id === archiveId
            );
            if (
              !currentCount ||
              currentCount?.products?.filter(
                (product) => !product?.isStockEqualized
              )?.length === 0
            ) {
              toast.error(t("Stock is already equalized"));
              return;
            }

            updateStockForStockCountBulk({
              currentCountId: currentCount?._id,
            });
          }}
        />
      ),
    },
  ];
  useEffect(() => {
    setRows(allRows());
    setTableKey((prev) => prev + 1);
  }, [counts, products, archiveId, countLists, users]);
  return (
    <>
      <Header />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto my-10 ">
        {foundCount && (
          <GenericTable
            key={tableKey}
            rowKeys={rowKeys}
            columns={columns}
            rows={rows}
            actions={
              user && user?.role?._id === RoleEnum.MANAGER ? actions : []
            }
            isActionsActive={
              user && user?.role?._id === RoleEnum.MANAGER ? true : false
            }
            rowClassNameFunction={
              user?.role?._id &&
              [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)
                ? getBgColor
                : undefined
            }
            filters={
              foundCount && !foundCount.isCompleted ? filters : archieveFilters
            }
            title={`${getItem(foundCount?.user, users)?.name}  ${t("Countu")}`} //date will be added here
          />
        )}
      </div>
    </>
  );
};

export default SingleCountArchive;
