import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
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
import { AccountProduct, ExpirationPageTabEnum } from "../types";
import { useGetAccountProducts } from "../utils/api/account/product";
import {
  useExpirationCountMutations,
  useGetExpirationCounts,
} from "../utils/api/expiration/expirationCount";
import {
  useExpirationListMutations,
  useGetExpirationLists,
} from "../utils/api/expiration/expirationList";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

const ExpirationCount = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const products = useGetAccountProducts();
  const expirationCounts = useGetExpirationCounts();
  const { updateExpirationCount, deleteExpirationCount } =
    useExpirationCountMutations();
  const expirationLists = useGetExpirationLists();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const { updateExpirationList } = useExpirationListMutations();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isAddExpirationModalOpen, setIsAddExpirationModalOpen] =
    useState(false);
  const { resetGeneralContext, setExpirationActiveTab } = useGeneralContext();
  const [rowToAction, setRowToAction] = useState<any>();
  const { location, expirationListId } = useParams();
  const [form, setForm] = useState({
    product: [],
  });
  const [expirationDateForm, setExpirationDateForm] = useState({
    expirationDate: "",
    quantity: 0,
  });
  const currentExpirationCount = expirationCounts?.find((item) => {
    return (
      item.isCompleted === false &&
      item.location === Number(location) &&
      item.user === user?._id &&
      item.expirationList === expirationListId
    );
  });
  const currentExpirationList = getItem(expirationListId, expirationLists);
  const allRows = (
    currentExpirationList?.products
      ?.filter((listProduct) =>
        listProduct?.locations?.includes(Number(location))
      )
      ?.map((item) => {
        const foundProduct = getItem(item?.product, products);
        if (!foundProduct) return null;
        return {
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
              {
                key: "quantity",
                node: (row: any) => {
                  return (
                    <div>
                      <TextInput
                        key={row.productId}
                        type={"number"}
                        value={row.quantity ?? 0}
                        label={""}
                        placeholder={""}
                        inputWidth="w-32 md:w-40 "
                        onChange={(value) => {
                          if (value === "" || !currentExpirationCount) {
                            return;
                          }
                          const newProducts = currentExpirationCount?.products
                            ?.map((expirationCountItem) => {
                              if (
                                expirationCountItem?.product !==
                                foundProduct._id
                              ) {
                                return expirationCountItem;
                              } else {
                                const newDateQuantities =
                                  expirationCountItem?.dateQuantities?.map(
                                    (dateQuantity) => {
                                      if (
                                        dateQuantity.expirationDate !==
                                        row.expirationDate
                                      ) {
                                        return dateQuantity;
                                      } else {
                                        return {
                                          ...dateQuantity,
                                          quantity: Number(value),
                                        };
                                      }
                                    }
                                  );
                                return {
                                  ...expirationCountItem,
                                  dateQuantities: newDateQuantities,
                                };
                              }
                            })
                            .filter((row) => row !== null && row !== undefined);
                          updateExpirationCount({
                            id: currentExpirationCount?._id,
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
  const [rows, setRows] = useState(allRows);
  const completeCount = () => {
    if (!currentExpirationCount) {
      return;
    }
    updateExpirationCount({
      id: currentExpirationCount?._id,
      updates: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    //   setExpirationActiveTab(ExpirationPageTabEnum.);
    resetGeneralContext();
    navigate(Routes.Expirations);
  };
  const cancelCount = () => {
    if (!currentExpirationCount) {
      return;
    }
    if (currentExpirationCount) {
      deleteExpirationCount(currentExpirationCount?._id);
      // setCountListActiveTab(CountListPageTabEnum.COUNTARCHIVE);
      navigate(Routes.Expirations);
    }
  };
  const addProductInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products
        .filter((item: AccountProduct) => {
          const countList = expirationLists.find(
            (item) => item._id === expirationListId
          );
          return !countList?.products?.some((pro) => pro.product === item._id);
        })
        .map((product: AccountProduct) => {
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
  const expirationDateInputs = [
    {
      type: InputTypes.DATE,
      formKey: "expirationDate",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      minNumber: 0,
      required: true,
      isNumberButtonsActive: true,
    },
  ];
  const expirationDateFormKeys = [
    { key: "expirationDate", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
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
  if (isEnableEdit) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const addButton = {
    name: t("Add Product"),
    icon: "",
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isModal: true,
    modal: expirationListId ? (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={addProductInputs}
        formKeys={addProductFormKeys}
        submitItem={updateExpirationList as any}
        isEditMode={true}
        setForm={setForm}
        topClassName="flex flex-col gap-2 "
        handleUpdate={() => {
          const countListProducts = () => {
            let productRows = [];
            const products =
              expirationLists.find((item) => item._id === expirationListId)
                ?.products || [];
            const newProducts = form.product?.map((item) => ({
              product: item,
              locations:
                expirationLists.find((item) => item._id === expirationListId)
                  ?.locations ?? [],
            }));
            productRows = [...products, ...newProducts];
            return productRows;
          };
          updateExpirationList({
            id: expirationListId,
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
  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  const actions = [
    {
      name: t("Add Count"),
      icon: <CiCirclePlus />,
      className: "text-2xl mt-1 cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddExpirationModalOpen}
          close={() => setIsAddExpirationModalOpen(false)}
          inputs={expirationDateInputs}
          formKeys={expirationDateFormKeys}
          submitItem={updateExpirationCount as any}
          isEditMode={false}
          setForm={setExpirationDateForm}
          topClassName="flex flex-col gap-2  "
          submitFunction={() => {
            if (!currentExpirationCount || !rowToAction) return;
            let newProducts = [];
            const isProductExist = currentExpirationCount?.products?.find(
              (item) => item?.product === rowToAction.productId
            );
            if (isProductExist) {
              newProducts = currentExpirationCount?.products?.map(
                (expirationCountProductItem) => {
                  if (
                    expirationCountProductItem?.product !==
                    rowToAction.productId
                  ) {
                    return expirationCountProductItem;
                  } else {
                    const isDateExists =
                      expirationCountProductItem?.dateQuantities?.some(
                        (dateQuantityItem) =>
                          dateQuantityItem.expirationDate ===
                          expirationDateForm.expirationDate
                      );
                    let newDateQuantities = [];
                    if (isDateExists) {
                      newDateQuantities =
                        expirationCountProductItem?.dateQuantities.map(
                          (dateQuantityItem) => {
                            if (
                              dateQuantityItem.expirationDate !==
                              expirationDateForm.expirationDate
                            ) {
                              return dateQuantityItem;
                            } else {
                              return {
                                ...dateQuantityItem,
                                quantity:
                                  Number(dateQuantityItem.quantity) +
                                  Number(expirationDateForm.quantity),
                              };
                            }
                          }
                        );
                    } else {
                      newDateQuantities = [
                        ...(expirationCountProductItem?.dateQuantities ?? []),
                        {
                          expirationDate: expirationDateForm.expirationDate,
                          quantity: expirationDateForm.quantity,
                        },
                      ];
                    }
                    return {
                      ...expirationCountProductItem,
                      dateQuantities: newDateQuantities,
                    };
                  }
                }
              );
            } else {
              newProducts = [
                ...(currentExpirationCount?.products ?? []),
                {
                  product: rowToAction.productId,
                  dateQuantities: [expirationDateForm],
                },
              ];
            }
            newProducts = newProducts?.filter(
              (row) => row !== null && row !== undefined
            );
            updateExpirationCount({
              id: currentExpirationCount?._id,
              updates: { products: newProducts as any },
            });
          }}
        />
      ),
      isModalOpen: isAddExpirationModalOpen,
      setIsModal: setIsAddExpirationModalOpen,
      isPath: false,
    },
  ];
  const pageNavigations = [
    {
      name: t("Expiration Lists"),
      path: Routes.Expirations,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setExpirationActiveTab(ExpirationPageTabEnum.EXPIRATIONLISTS);
        resetGeneralContext();
      },
    },
    {
      name: t("Count"),
      path: "",
      canBeClicked: false,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    expirationListId,
    expirationLists,
    location,
    products,
    expirationCounts,
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
          actions={actions}
          rows={rows}
          title={t("Expiration Count")}
          isActionsActive={true}
          isCollapsible={true}
          addButton={addButton}
          filters={filters}
        />
        <div className="flex justify-end flex-row gap-2 mt-4">
          <button
            className="px-2  bg-red-500 hover:text-red-500 hover:border-red-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
            onClick={cancelCount}
          >
            <H5> {t("Cancel")}</H5>
          </button>
          <button
            className="px-2  bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
            onClick={() => {
              setIsConfirmationDialogOpen(true);
            }}
          >
            <H5> {t("Complete")}</H5>
          </button>
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

export default ExpirationCount;
