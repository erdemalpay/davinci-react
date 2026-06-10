import { useMemo, useState } from "react";
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
import { ActionEnum, CountListPageTabEnum, DisabledConditionEnum } from "../types";
import {
  useAccountCountMutations,
  useGetActiveCount,
  useUpdateCountQuantityMutation,
} from "../utils/api/account/count";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetAccountStocks } from "../utils/api/account/stock";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { getItem } from "../utils/getItem";
import { isActionDisabled } from "../utils/permissions";
import { getCountStockBgColor } from "../utils/color";

const Count = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const products = useGetAccountProducts();
  const items = useGetMenuItems();
  const stocks = useGetAccountStocks();
  const { updateAccountCount, deleteAccountCount } = useAccountCountMutations();
  const updateCountQuantity = useUpdateCountQuantityMutation();
  const countLists = useGetAccountCountLists();
  const { updateAccountCountList } = useAccountCountListMutations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { resetGeneralContext, setCountListActiveTab } = useGeneralContext();
  const { location, countListId } = useParams();
  const [form, setForm] = useState<{ product: string[] | undefined }>({
    product: [],
  });

  const disabledConditions = useGetDisabledConditions();

  const countArchiveOpenCountDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.COUNTARCHIVE_COUNT, disabledConditions);
  }, [disabledConditions]);

  const numericLocation = useMemo(
    () => (location ? Number(location) : undefined),
    [location]
  );

  const currentCount = useGetActiveCount(numericLocation, countListId);

  const currentCountList = useMemo(
    () => countLists?.find((cl) => cl?._id === countListId),
    [countLists, countListId]
  );

  const countListProducts = currentCountList?.products;

  const pageNavigations = useMemo(
    () => [
      {
        name: t("Count Lists"),
        path: Routes.CountLists,
        canBeClicked: true,
        additionalSubmitFunction: () => {
          resetGeneralContext();
        },
      },
      { name: t("Count"), path: "", canBeClicked: false },
    ],
    [t, resetGeneralContext]
  );

  const addProductInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          .filter((item) => {
            const cl = countLists.find((c) => c._id === countListId);
            return !cl?.products?.some((pro: any) => pro.product === item._id);
          })
          .map((product) => ({ value: product._id, label: product.name })),
        isMultiple: true,
        placeholder: t("Product"),
        required: true,
      },
    ],
    [t, products, countLists, countListId]
  );

  const addProductFormKeys = useMemo(
    () => [{ key: "product", type: FormKeyTypeEnum.STRING }],
    []
  );

  const showStockAndColors = useMemo(
    () => !isActionDisabled(countArchiveOpenCountDisabledCondition, ActionEnum.ADVANCED_VIEW, user),
    [countArchiveOpenCountDisabledCondition, user]
  );

  const columns = useMemo(() => {
    const base = [
      { key: t("Product"), isSortable: true },
      { key: t("Shelf"), isSortable: true },
      ...(showStockAndColors
        ? [
            { key: t("Stock Quantity"), isSortable: true },
            { key: t("Difference"), isSortable: false },
          ]
        : []),
      { key: t("Quantity"), isSortable: true, className: "mx-auto" },
    ];
    if (isEnableEdit) base.push({ key: t("Actions"), isSortable: false });
    return base;
  }, [t, isEnableEdit, showStockAndColors]);

  const rows = useMemo(() => {
    const listProducts = currentCountList?.products ?? [];
    const mapped =
      listProducts
        ?.map((countListProduct: any) => {
          if (
            numericLocation !== undefined &&
            countListProduct.locations.includes(numericLocation)
          ) {
            const foundProduct = products?.find(
              (p) => p?._id === countListProduct.product
            );
            // Skip deleted products
            if (!foundProduct || foundProduct.deleted) {
              return { product: "", countQuantity: 0 };
            }
            const foundMenuItem = items?.find(
              (it) => it?.matchedProduct === countListProduct.product
            );
            return {
              products: currentCount?.products,
              productId: countListProduct.product,
              product: foundProduct?.name || "",
              countQuantity: currentCount?.products?.find(
                (cp: any) => cp.product === countListProduct.product
              )?.countQuantity ?? 0,
              productDeleteRequest: currentCount?.products?.find(
                (cp: any) => cp.product === countListProduct.product
              )?.productDeleteRequest,
              shelfInfo:
                foundProduct?.shelfInfo?.find(
                  (shelf: any) => shelf.location === numericLocation
                )?.shelf || "",
              sku: foundMenuItem?.sku || "",
              barcode: foundMenuItem?.barcode || "",
              stockQuantity:
                stocks?.find(
                  (s) =>
                    s?.product === countListProduct.product &&
                    s?.location === numericLocation
                )?.quantity || 0,
            };
          }
          return { product: "", countQuantity: 0 };
        })
        .filter((r: any) => r.product !== "") || [];
    return mapped;
  }, [
    currentCountList?.products,
    numericLocation,
    products,
    items,
    stocks,
    currentCount?.products,
    i18n.language,
  ]);

  const sortedRows = useMemo(() => {
    if (!showStockAndColors) {
      return [...rows].sort((a, b) => a.product.localeCompare(b.product));
    }
    const colorRank = (row: { stockQuantity?: number; countQuantity: number }) => {
      const s = Number(row.stockQuantity ?? 0);
      const c = Number(row.countQuantity);
      if (s > c) return 0; // red
      if (s < c) return 1; // green
      return 2;            // blue
    };
    return [...rows].sort((a, b) => {
      const rankDiff = colorRank(a) - colorRank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.product.localeCompare(b.product);
    });
  }, [rows, showStockAndColors]);

  const addButton = useMemo(
    () => ({
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
            const buildProducts = () => {
              const existing =
                countLists.find((it) => it._id === countListId)?.products || [];
              const newOnes =
                form.product?.map((pid) => ({
                  product: pid,
                  locations:
                    countLists.find((it) => it._id === countListId)
                      ?.locations ?? [],
                })) || [];
              return [...existing, ...newOnes];
            };
            updateAccountCountList({
              id: countListId,
              updates: {
                products: buildProducts(),
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
    }),
    [
      t,
      countListId,
      isAddModalOpen,
      addProductInputs,
      addProductFormKeys,
      updateAccountCountList,
      countLists,
      form.product,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Not Found"),
        icon: <IoIosCloseCircleOutline />,
        node: (row: any) => {
          return (
            <div
              className="text-red-500 cursor-pointer text-2xl"
              onClick={() => {
                const rowProduct = products.find(
                  (p) => p.name === row?.product
                );
                if (
                  !currentCount ||
                  !rowProduct ||
                  !user ||
                  numericLocation === undefined
                )
                  return;
                const productStock = stocks?.find(
                  (s) =>
                    s?.product === rowProduct?._id &&
                    s?.location === numericLocation
                );

                updateCountQuantity.mutate({
                  countId: currentCount._id,
                  productId: rowProduct._id,
                  countQuantity: Number(row?.countQuantity ?? 0) ?? 0,
                  stockQuantity: productStock?.quantity || 0,
                  productDeleteRequest: row?.productDeleteRequest
                    ? ""
                    : user._id,
                  currentProducts: currentCount.products || [],
                });
              }}
            >
              <ButtonTooltip content={t("Product should be removed.")}>
                <IoIosCloseCircleOutline />
              </ButtonTooltip>
            </div>
          );
        },
        className: "text-2xl mt-1 cursor-pointer",
        isModal: false,
        isPath: false,
      },
    ],
    [
      t,
      products,
      currentCount,
      user,
      stocks,
      numericLocation,
      updateCountQuantity,
    ]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "product",
        node: (row: any) => {
          return (
            <div
              className={
                row?.productDeleteRequest
                  ? "bg-red-200 w-fit px-2 py-1 rounded-md text-white"
                  : ""
              }
            >
              {row.product}
            </div>
          );
        },
      },
      { key: "shelfInfo" },
      ...(showStockAndColors
        ? [
            { key: "stockQuantity" },
            {
              key: "difference",
              node: (row: any) => {
                const diff = Number(row.countQuantity) - Number(row.stockQuantity);
                return <span>{diff > 0 ? `+${diff}` : diff}</span>;
              },
            },
          ]
        : []),
      {
        key: "countQuantity",
        node: (row: any) => {
          return (
            <div className={"flex text-center justify-center"}>
              <TextInput
                key={row.productId}
                type={"number"}
                value={Number(row.countQuantity ?? 0)}
                label={""}
                placeholder={""}
                inputWidth="w-32 md:w-40"
                onChange={(value) => {
                  if (value === "") return;
                  const rowProduct = products.find(
                    (p) => p.name === row?.product
                  );
                  if (
                    !currentCount ||
                    !rowProduct ||
                    numericLocation === undefined
                  )
                    return;
                  const productStock = stocks?.find(
                    (s) =>
                      s?.product === rowProduct?._id &&
                      s?.location === numericLocation
                  );

                  updateCountQuantity.mutate({
                    countId: currentCount._id,
                    productId: rowProduct._id,
                    countQuantity: Number(value),
                    stockQuantity: productStock?.quantity || 0,
                    currentProducts: currentCount.products || [],
                  });
                }}
                isDebounce={true}
                isOnClearActive={true}
                isNumberButtonsActive={true}
                isDateInitiallyOpen={false}
                isTopFlexRow={false}
                minNumber={0}
                isMinNumber={true}
                className="w-20 h-10 text-center bg-transparent"
              />
            </div>
          );
        },
      },
    ],
    [products, currentCount, stocks, numericLocation, updateCountQuantity, showStockAndColors]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Enable Edit"),
        isUpperSide: true,
        node: (
          <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />
        ),
      },
    ],
    [t, isEnableEdit]
  );

  const completeCount = () => {
    if (!currentCount && !countListProducts) return;
    if (
      currentCount?.products?.length !== countListProducts?.length &&
      currentCount?.products &&
      countListProducts
    ) {
      let newProducts = currentCount?.products;
      for (const currentProductItem of countListProducts) {
        if (
          !currentCount.products.find(
            (clp: any) => clp.product === currentProductItem.product
          )
        ) {
          const productStock = stocks?.find(
            (s) =>
              s?.product === currentProductItem.product &&
              s?.location === numericLocation
          );
          newProducts = [
            ...(newProducts?.filter(
              (p: any) => p.product !== currentProductItem.product
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
          products: currentCount.products,
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
    if (!currentCount && !countListProducts) return;
    if (currentCount) {
      deleteAccountCount(currentCount?._id);
      setCountListActiveTab(CountListPageTabEnum.COUNTARCHIVE);
      navigate(Routes.CountLists);
    }
  };
  return (
    <>
      <Header />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={sortedRows}
          title={t("Count")}
          searchRowKeys={[...rowKeys, { key: "sku" }, { key: "barcode" }]}
          isActionsActive={isEnableEdit}
          addButton={addButton}
          filters={filters}
          actions={isEnableEdit ? actions : []}
          rowClassNameFunction={showStockAndColors ? getCountStockBgColor : undefined}
        />
        <div className="flex justify-end flex-row gap-2 mt-4">
          <GenericButton variant="danger" size="sm" onClick={cancelCount}>
            <H5>{t("Cancel")}</H5>
          </GenericButton>
          <GenericButton
            variant="primary"
            size="sm"
            onClick={() => {
              setIsConfirmationDialogOpen(true);
            }}
          >
            <H5>{t("Complete")}</H5>
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
