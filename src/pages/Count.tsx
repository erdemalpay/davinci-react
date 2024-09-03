import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoPlusCircle } from "react-icons/go";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import PageNavigator from "../components/panelComponents/PageNavigator/PageNavigator";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { H5 } from "../components/panelComponents/Typography";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { Routes } from "../navigation/constants";
import {
  AccountCountList,
  AccountPackageType,
  AccountProduct,
  AccountStockLocation,
  User,
} from "../types";
import {
  useAccountCountMutations,
  useGetAccountCounts,
} from "../utils/api/account/count";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAccountPackageTypes } from "../utils/api/account/packageType";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetAccountStocks } from "../utils/api/account/stock";

const Count = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const products = useGetAccountProducts();
  const packages = useGetAccountPackageTypes();
  const counts = useGetAccountCounts();
  const stocks = useGetAccountStocks();
  const [rowToAction, setRowToAction] = useState<any>();
  const [isAddCollapsibleOpen, setIsAddCollapsibleOpen] = useState(false);
  const { updateAccountCount } = useAccountCountMutations();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const {
    setCurrentPage,
    setSearchQuery,
    setCountListActiveTab,
    setSortConfigKey,
  } = useGeneralContext();
  const { location, countListId } = useParams();
  const [collapsibleForm, setCollapsibleForm] = useState({
    packageType: "",
    quantity: 0,
  });
  const [rows, setRows] = useState(
    countLists
      ?.find((cl) => cl?._id === countListId)
      ?.products?.map((item) => {
        const currentCount = counts?.find((item) => {
          return (
            item.isCompleted === false &&
            (item.location as AccountStockLocation)?._id === location &&
            (item.user as User)._id === user?._id &&
            (item.countList as AccountCountList)?._id === countListId
          );
        });
        if (location && item.locations.includes(location)) {
          return {
            products: currentCount?.products,
            productId: item.product,
            product: products?.find((p) => p?._id === item.product)?.name || "",
            packageDetails: currentCount?.products
              ?.filter((p) => p.product === item.product)
              ?.map((p) => {
                return {
                  packageType:
                    packages?.find((pck) => pck?._id === p.packageType)?.name ||
                    "",
                  quantity: p.countQuantity,
                };
              }),
            collapsible: {
              collapsibleHeader: t("Package Details"),
              collapsibleColumns: [
                { key: t("Package Type"), isSortable: true },
                { key: t("Quantity"), isSortable: true },
                {
                  key: t("Action"),
                  isSortable: false,
                  className: "text-center",
                },
              ],
              collapsibleRows: currentCount?.products
                ?.filter((p) => p.product === item.product)
                ?.map((p) => {
                  return {
                    packageType:
                      packages?.find((pck) => pck?._id === p.packageType)
                        ?.name || "",
                    packageTypeId:
                      packages?.find((pck) => pck?._id === p.packageType)
                        ?._id || "",
                    quantity: p.countQuantity,
                  };
                }),
              collapsibleRowKeys: [{ key: "packageType" }, { key: "quantity" }],
            },
          };
        }
        return { product: "", packageDetails: [] };
      })
      .filter((item) => item.product !== "") || []
  );
  const pageNavigations = [
    {
      name: t("Count Lists"),
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
      name: t("Count"),
      path: "",
      canBeClicked: false,
    },
  ];
  useEffect(() => {
    setRows(
      countLists
        .find((cl) => cl._id === countListId)
        ?.products?.map((item) => {
          const currentCount = counts?.find((item) => {
            return (
              item.isCompleted === false &&
              (item.location as AccountStockLocation)?._id === location &&
              (item.user as User)._id === user?._id &&
              (item.countList as AccountCountList)?._id === countListId
            );
          });
          if (location && item.locations.includes(location)) {
            return {
              products: currentCount?.products,
              productId: item.product,
              product:
                products?.find((p) => p?._id === item.product)?.name || "",
              packageDetails: currentCount?.products
                ?.filter((p) => p.product === item.product)
                ?.map((p) => {
                  return {
                    packageType:
                      packages.find((pck) => pck?._id === p.packageType)
                        ?.name || "",
                    quantity: p.countQuantity,
                  };
                }),
              collapsible: {
                collapsibleHeader: t("Package Details"),
                collapsibleColumns: [
                  { key: t("Package Type"), isSortable: true },
                  { key: t("Quantity"), isSortable: true },
                  {
                    key: t("Action"),
                    isSortable: false,
                    className: "text-center",
                  },
                ],
                collapsibleRows: currentCount?.products
                  ?.filter((p) => p.product === item.product)
                  ?.map((p) => {
                    return {
                      packageType:
                        packages?.find((pck) => pck?._id === p.packageType)
                          ?.name || "",
                      packageTypeId:
                        packages?.find((pck) => pck?._id === p.packageType)
                          ?._id || "",
                      quantity: p.countQuantity,
                    };
                  }),
                collapsibleRowKeys: [
                  { key: "packageType" },
                  { key: "quantity" },
                ],
              },
            };
          }
          return { product: "", packageDetails: [] };
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
    i18n.language,
  ]);
  const collapsibleInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "packageType",
      label: t("Package Type"),
      options: products
        ?.find((p) => p.name === rowToAction?.product)
        ?.packages?.map((item) => {
          const pck = packages?.find((p) => p?._id === item.package);
          return {
            value: pck?._id,
            label: pck?.name,
          };
        }),
      placeholder: t("Package Type"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      required: true,
    },
  ];
  const collapsibleFormKeys = [
    { key: "packageType", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const actions = [
    {
      name: "Add",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          topClassName="flex flex-col gap-2 "
          buttonName={t("Add")}
          isOpen={isAddCollapsibleOpen}
          close={() => setIsAddCollapsibleOpen(false)}
          inputs={collapsibleInputs}
          formKeys={collapsibleFormKeys}
          submitItem={updateAccountCount as any}
          isEditMode={true}
          setForm={setCollapsibleForm}
          handleUpdate={() => {
            const rowProduct = products.find(
              (p) => p.name === rowToAction?.product
            );
            const currentCount = counts?.find((item) => {
              return (
                item.isCompleted === false &&
                (item.location as AccountStockLocation)?._id === location &&
                (item.user as User)._id === user?._id &&
                (item.countList as AccountCountList)?._id === countListId
              );
            });
            if (!currentCount || !rowProduct) {
              return;
            }
            const productStock = stocks?.find(
              (s) =>
                (s?.product as AccountProduct)?._id === rowProduct?._id &&
                (s?.packageType as AccountPackageType)?._id ===
                  collapsibleForm?.packageType
            );
            const newProducts = [
              ...(currentCount?.products?.filter(
                (p) =>
                  p.product !== rowProduct?._id ||
                  p.packageType !== collapsibleForm?.packageType
              ) || []),
              {
                packageType: collapsibleForm?.packageType,
                product: rowProduct?._id,
                countQuantity: collapsibleForm?.quantity,
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
        />
      ) : null,
      isModalOpen: isAddCollapsibleOpen,
      setIsModal: setIsAddCollapsibleOpen,
      isPath: false,
      icon: <GoPlusCircle className="w-5 h-5" />,
      className: " hover:text-blue-500 hover:border-blue-500 cursor-pointer",
    },
  ];
  const columns = [
    { key: t("Product"), isSortable: true },
    { key: t("Entered Package Types"), isSortable: false },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "product" },
    {
      key: "packageDetails",
      node: (row: any) => {
        return row?.packageDetails?.map((item: any, index: number) => {
          return (
            <p
              key={row.product + item.packageType}
              className={`text-sm   w-fit`}
            >
              {item?.quantity + "x" + item.packageType}
              {(row?.packageDetails?.length ?? 0) - 1 !== index && ","}
            </p>
          );
        });
      },
    },
  ];
  const collapsibleActions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      node: (row: any) => {
        const currentCount = counts?.find((item) => {
          return (
            item.isCompleted === false &&
            (item.location as AccountStockLocation)?._id === location &&
            (item.user as User)?._id === user?._id &&
            (item.countList as AccountCountList)?._id === countListId
          );
        });
        if (!currentCount) return;
        const newProducts = row?.products?.filter(
          (p: any) =>
            !(
              p.product === row.productId && p.packageType === row.packageTypeId
            )
        );

        return (
          <div
            className="text-red-500 cursor-pointer text-xl"
            onClick={() => {
              updateAccountCount({
                id: currentCount?._id,
                updates: {
                  products: newProducts,
                },
              });
            }}
          >
            <ButtonTooltip content={t("Delete")}>
              <HiOutlineTrash />
            </ButtonTooltip>
          </div>
        );
      },
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: false,
      isPath: false,
    },
  ];
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
          actions={actions}
          collapsibleActions={collapsibleActions}
          isCollapsible={products.length > 0}
          isActionsActive={true}
        />
        <div className="flex justify-end mt-4">
          <button
            className="px-2  bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
            onClick={() => {
              const currentCount = counts?.find((item) => {
                return (
                  item.isCompleted === false &&
                  (item.location as AccountStockLocation)?._id === location &&
                  (item.user as User)._id === user?._id &&
                  (item.countList as AccountCountList)?._id === countListId
                );
              });
              if (!currentCount) {
                return;
              }
              if (rows?.some((row) => row.packageDetails?.length === 0)) {
                toast.error(t("Please complete all product counts."));
                return;
              }
              updateAccountCount({
                id: currentCount?._id,
                updates: {
                  isCompleted: true,
                  completedAt: new Date(),
                },
              });
              setCountListActiveTab(countLists.length);
              setCurrentPage(1);
              // setRowsPerPage(RowPerPageEnum.FIRST);
              setSearchQuery("");
              setSortConfigKey(null);
              navigate(Routes.CountLists);
            }}
          >
            <H5> {t("Complete")}</H5>
          </button>
        </div>
      </div>
    </>
  );
};

export default Count;
