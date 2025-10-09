import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { LuCircleEqual } from "react-icons/lu";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
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
import { GenericButton } from "../components/common/GenericButton";
import {
  useAccountCountMutations,
  useGetAccountCounts,
  useUpdateStockForStockCountBulkMutation,
  useUpdateStockForStockCountMutation,
} from "../utils/api/account/count";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../utils/api/account/countList";
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
  const { updateAccountCountList } = useAccountCountListMutations();
  const { updateAccountCount } = useAccountCountMutations();
  const products = useGetAllAccountProducts();
  const [rowToAction, setRowToAction] = useState<any>();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { resetGeneralContext } = useGeneralContext();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const foundCount = counts?.find((count) => count._id === archiveId);
  const pageNavigations = [
    {
      name: t("Count Archive"),
      path: Routes.CountLists,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        resetGeneralContext();
      },
    },
    {
      name:
        getItem(foundCount?.countList, countLists)?.name + " " + t("Countu"),
      path: `/archive/${archiveId}`,
      canBeClicked: false,
    },
  ];
  const currentCount = counts?.find((count) => count._id === archiveId);
  const currentCountList = countLists?.find(
    (countList) => countList._id === currentCount?.countList
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
            stockQuantity: option.stockQuantity,
            countQuantity: option.countQuantity,
            productDeleteRequest: option.productDeleteRequest
              ? getItem(option.productDeleteRequest, users)?.name
              : "",
            isStockEqualized: option.isStockEqualized ?? false,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .sort((a, b) => {
          const rank = (row: typeof a) =>
            row.stockQuantity > row.countQuantity
              ? 0
              : row.stockQuantity < row.countQuantity
              ? 1
              : 2;
          return rank(a) - rank(b);
        }) ?? []
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
        <GenericButton
          className="ml-auto"
          variant="primary"
          size="sm"
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
        </GenericButton>
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
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            if (currentCountList && rowToAction) {
              if (
                !currentCountList?.products?.some(
                  (item) => item.product === rowToAction.productId
                )
              ) {
                toast.error(t("Product already deleted from the list!"));
                return;
              }
              const newProducts = currentCountList?.products?.filter(
                (item) => item.product !== rowToAction.productId
              );
              updateAccountCountList({
                id: currentCountList?._id,
                updates: {
                  products: newProducts,
                },
              });
            }
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Count List Item")}
          text={`${rowToAction.product} ${t("GeneralDeleteMessage")}`}
        />
      ) : (
        ""
      ),
      className: "text-red-500 cursor-pointer text-2xl   ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Equalize"),
      icon: <LuCircleEqual />,
      node: (row: any) => (
        <ButtonTooltip content={t("Equalize")}>
          <GenericButton
            variant="icon"
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
          </GenericButton>
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
