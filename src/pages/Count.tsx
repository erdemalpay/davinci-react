import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { GenericButton } from "../components/common/GenericButton";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import { CountListPageTabEnum } from "../types";
import {
  useAccountCountMutations,
  useGetAccountCounts,
} from "../utils/api/account/count";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetAccountStocks } from "../utils/api/account/stock";
import { useGetMenuItems } from "../utils/api/menu/menu-item";

const Count = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const products = useGetAccountProducts();
  const items = useGetMenuItems();
  const counts = useGetAccountCounts();
  const stocks = useGetAccountStocks();
  const { updateAccountCount, deleteAccountCount } = useAccountCountMutations();
  const countLists = useGetAccountCountLists();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const { updateAccountCountList } = useAccountCountListMutations();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { resetGeneralContext, setCountListActiveTab } = useGeneralContext();
  const { location, countListId } = useParams();
  const [form, setForm] = useState({
    product: [],
  });
  const currentCount = counts?.find((item) => {
    return (
      item.isCompleted === false &&
      item.location === Number(location) &&
      item.user === user?._id &&
      item.countList === countListId
    );
  });
  const countListProducts = countLists?.find(
    (cl) => cl?._id === countListId
  )?.products;
  const [rows, setRows] = useState(
    countLists
      ?.find((cl) => cl?._id === countListId)
      ?.products?.map((countListProduct) => {
        if (location && countListProduct.locations.includes(Number(location))) {
          const foundProduct = products?.find(
            (p) => p?._id === countListProduct.product
          );
          const foundMenuItem = items?.find(
            (item) => item?.matchedProduct === countListProduct.product
          );
          return {
            products: currentCount?.products,
            productId: countListProduct.product,
            product: foundProduct?.name || "",
            countQuantity: currentCount?.products?.find(
              (countProduct) =>
                countProduct.product === countListProduct.product
            )?.countQuantity,
            productDeleteRequest: currentCount?.products?.find(
              (countProduct) =>
                countProduct.product === countListProduct.product
            )?.productDeleteRequest,
            shelfInfo:
              foundProduct?.shelfInfo?.find(
                (shelf) => shelf.location === Number(location)
              )?.shelf || "",
            sku: foundMenuItem?.sku || "",
            barcode: foundMenuItem?.barcode || "",
          };
        }
        return { product: "", countQuantity: 0 };
      })
      .filter((item) => item.product !== "") || []
  );
  const pageNavigations = [
    {
      name: t("Count Lists"),
      path: Routes.CountLists,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        resetGeneralContext();
      },
    },
    {
      name: t("Count"),
      path: "",
      canBeClicked: false,
    },
  ];
  const addProductInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products
        .filter((item) => {
          const countList = countLists.find((item) => item._id === countListId);
          return !countList?.products?.some((pro) => pro.product === item._id);
        })
        .map((product) => {
          return {
            value: product._id,
            label: product.name,
          };
        }),
      isMultiple: true,
      placeholder: t("Product"),
      required: true,
    },
  ];
  const addProductFormKeys = [{ key: "product", type: FormKeyTypeEnum.STRING }];

  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Shelf"), isSortable: true },
    { key: t("Quantity"), isSortable: true, className: "mx-auto" },
  ];
  if (isEnableEdit) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const addButton = {
    name: t("Add Product"),
    icon: "",
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isModal: true,
    modal: countListId ? (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={addProductInputs}
        formKeys={addProductFormKeys}
        submitItem={updateAccountCountList as any}
        isEditMode={true}
        setForm={setForm}
        topClassName="flex flex-col gap-2 "
        handleUpdate={() => {
          const countListProducts = () => {
            let productRows = [];
            const products =
              countLists.find((item) => item._id === countListId)?.products ||
              [];
            const newProducts = form.product?.map((item) => ({
              product: item,
              locations:
                countLists.find((item) => item._id === countListId)
                  ?.locations ?? [],
            }));
            productRows = [...products, ...newProducts];
            return productRows;
          };
          updateAccountCountList({
            id: countListId,
            updates: {
              products: countListProducts(),
            },
          });
        }}
      />
    ) : (
      ""
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
  };
  const actions = [
    {
      name: t("Not Found"),
      icon: <IoIosCloseCircleOutline />,
      node: (row: any) => {
        return (
          <div
            className="text-red-500 cursor-pointer text-2xl"
            onClick={() => {
              const rowProduct = products.find((p) => p.name === row?.product);
              if (!currentCount || !rowProduct || !user) {
                return;
              }
              const productStock = stocks?.find(
                (s) =>
                  s?.product === rowProduct?._id &&
                  s?.location === Number(location)
              );
              const newProducts = [
                ...(currentCount?.products?.filter(
                  (p) => p.product !== rowProduct?._id
                ) || []),
                {
                  product: rowProduct?._id,
                  countQuantity: row?.countQuantity ?? 0,
                  stockQuantity: productStock?.quantity || 0,
                  productDeleteRequest: row?.productDeleteRequest
                    ? ""
                    : user._id,
                },
              ];
              updateAccountCount({
                id: currentCount?._id,
                updates: {
                  products: newProducts,
                },
              });
            }}
          >
            <ButtonTooltip content={t("Product should be removed.")}>
              <IoIosCloseCircleOutline />
            </ButtonTooltip>
          </div>
        );
      },
      className: "text-2xl mt-1  cursor-pointer",
      isModal: false,
      isPath: false,
    },
  ];
  const rowKeys = [
    {
      key: "product",
      node: (row: any) => {
        return (
          <div
            className={`${
              row?.productDeleteRequest
                ? "bg-red-200 w-fit px-2 py-1 rounded-md text-white"
                : ""
            }`}
          >
            {row.product}
          </div>
        );
      },
    },
    { key: "shelfInfo" },
    {
      key: "countQuantity",
      node: (row: any) => {
        return (
          <div className={`flex text-center justify-center `}>
            <TextInput
              key={row.productId}
              type={"number"}
              value={row.countQuantity ?? 0}
              label={""}
              placeholder={""}
              inputWidth="w-32 md:w-40"
              onChange={(value) => {
                if (value === "") {
                  return;
                }
                const rowProduct = products.find(
                  (p) => p.name === row?.product
                );

                if (!currentCount || !rowProduct) {
                  return;
                }
                const productStock = stocks?.find(
                  (s) =>
                    s?.product === rowProduct?._id &&
                    s?.location === Number(location)
                );
                const newProducts = [
                  ...(currentCount?.products?.filter(
                    (p) => p.product !== rowProduct?._id
                  ) || []),
                  {
                    product: rowProduct?._id,
                    countQuantity: value,
                    stockQuantity: productStock?.quantity || 0,
                  },
                ];
                updateAccountCount({
                  id: currentCount?._id,
                  updates: {
                    products: newProducts,
                  },
                });
              }}
              isDebounce={true}
              isOnClearActive={true}
              isNumberButtonsActive={true}
              isDateInitiallyOpen={false}
              isTopFlexRow={false}
              minNumber={0}
              isMinNumber={true}
              className="w-20 h-10 text-center"
            />
          </div>
        );
      },
    },
  ];
  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  const completeCount = () => {
    if (!currentCount && !countListProducts) {
      return;
    }
    if (
      currentCount?.products?.length !== countListProducts?.length &&
      currentCount?.products &&
      countListProducts
    ) {
      let newProducts = currentCount?.products;
      for (const currentProductItem of countListProducts) {
        if (
          !currentCount.products.find(
            (clp) => clp.product === currentProductItem.product
          )
        ) {
          const productStock = stocks?.find(
            (s) =>
              s?.product === currentProductItem.product &&
              s?.location === Number(location)
          );
          newProducts = [
            ...(newProducts?.filter(
              (p) => p.product !== currentProductItem.product
            ) || []),
            {
              product: currentProductItem.product,
              countQuantity: 0,
              stockQuantity: productStock?.quantity || 0,
            },
          ];
        }
      }

      updateAccountCount({
        id: currentCount?._id,
        updates: {
          products: newProducts,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    } else if (currentCount) {
      updateAccountCount({
        id: currentCount?._id,
        updates: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    setCountListActiveTab(CountListPageTabEnum.COUNTARCHIVE);
    resetGeneralContext();
    navigate(Routes.CountLists);
  };
  const cancelCount = () => {
    if (!currentCount && !countListProducts) {
      return;
    }
    if (currentCount) {
      deleteAccountCount(currentCount?._id);
      setCountListActiveTab(CountListPageTabEnum.COUNTARCHIVE);
      navigate(Routes.CountLists);
    }
  };
  useEffect(() => {
    setRows(
      countLists
        .find((cl) => cl._id === countListId)
        ?.products?.map((countListProduct) => {
          if (
            location &&
            countListProduct.locations.includes(Number(location))
          ) {
            const foundProduct = products?.find(
              (p) => p?._id === countListProduct.product
            );
            const foundMenuItem = items?.find(
              (item) => item?.matchedProduct === countListProduct.product
            );

            return {
              products: currentCount?.products,
              productId: countListProduct.product,
              product: foundProduct?.name || "",
              countQuantity: currentCount?.products?.find(
                (countProduct) =>
                  countProduct.product === countListProduct.product
              )?.countQuantity,
              productDeleteRequest: currentCount?.products?.find(
                (countProduct) =>
                  countProduct.product === countListProduct.product
              )?.productDeleteRequest,
              shelfInfo:
                foundProduct?.shelfInfo?.find(
                  (shelf) => shelf.location === Number(location)
                )?.shelf || "",
              sku: foundMenuItem?.sku || "",
              barcode: foundMenuItem?.barcode || "",
            };
          }
          return { product: "", countQuantity: 0 };
        })
        .filter((item) => item.product !== "") || []
    );
    setTableKey((prev) => prev + 1);
  }, [
    countListId,
    countLists,
    location,
    products,
    stocks,
    counts,
    items,
    i18n.language,
  ]);
  return (
    <>
      <Header />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Count")}
          searchRowKeys={[...rowKeys, { key: "sku" }, { key: "barcode" }]}
          isActionsActive={isEnableEdit}
          addButton={addButton}
          filters={filters}
          actions={isEnableEdit ? actions : []}
        />
        <div className="flex justify-end flex-row gap-2 mt-4">
          <GenericButton
            variant="danger"
            size="sm"
            onClick={cancelCount}
          >
            <H5> {t("Cancel")}</H5>
          </GenericButton>
          <GenericButton
            variant="primary"
            size="sm"
            onClick={() => {
              setIsConfirmationDialogOpen(true);
            }}
          >
            <H5> {t("Complete")}</H5>
          </GenericButton>
        </div>
        {isConfirmationDialogOpen && (
          <ConfirmationDialog
            isOpen={isConfirmationDialogOpen}
            close={() => setIsConfirmationDialogOpen(false)}
            confirm={() => {
              completeCount();
              setIsConfirmationDialogOpen(false);
            }}
            title={t("Complete Count")}
            text={`${t("Are you sure you want to complete the count?")}`}
          />
        )}
      </div>
    </>
  );
};

export default Count;
