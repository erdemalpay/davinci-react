import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useUserContext } from "../context/User.context";
import { AccountCountList, AccountStockLocation, User } from "../types";
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
  const products = useGetAccountProducts();
  const packages = useGetAccountPackageTypes();
  const counts = useGetAccountCounts();
  const stocks = useGetAccountStocks();
  const [rowToAction, setRowToAction] = useState<any>();
  const [isAddCollapsibleOpen, setIsAddCollapsibleOpen] = useState(false);
  const { updateAccountCount } = useAccountCountMutations();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const { location, countListId } = useParams();
  const [collapsibleForm, setCollapsibleForm] = useState({
    packageType: "",
    quantity: 0,
  });
  const [rows, setRows] = useState(
    countLists
      .find((cl) => cl._id === countListId)
      ?.products?.map((item) => {
        const currentCount = counts?.find((item) => {
          return (
            item.isCompleted === false &&
            (item.location as AccountStockLocation)._id === location &&
            (item.user as User)._id === user?._id &&
            (item.countList as AccountCountList)._id === countListId
          );
        });
        if (location && item.locations.includes(location)) {
          return {
            product: products.find((p) => p._id === item.product)?.name || "",
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
                      packages.find((pck) => pck._id === p.packageType)?.name ||
                      "",
                    quantity: p.countQuantity,
                  };
                }),
              collapsibleRowKeys: [{ key: "packageType" }, { key: "quantity" }],
            },
          };
        }
        return { product: "" };
      })
      .filter((item) => item.product !== "") || []
  );
  useEffect(() => {
    setRows(
      countLists
        .find((cl) => cl._id === countListId)
        ?.products?.map((item) => {
          const currentCount = counts?.find((item) => {
            return (
              item.isCompleted === false &&
              (item.location as AccountStockLocation)._id === location &&
              (item.user as User)._id === user?._id &&
              (item.countList as AccountCountList)._id === countListId
            );
          });
          if (location && item.locations.includes(location)) {
            return {
              product: products.find((p) => p._id === item.product)?.name || "",
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
                        packages.find((pck) => pck._id === p.packageType)
                          ?.name || "",
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
          return { product: "" };
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
          const pck = packages?.find((p) => p._id === item.package);
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
  const addCollapsible = {
    name: "+",
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
              (item.location as AccountStockLocation)._id === location &&
              (item.user as User)._id === user?._id &&
              (item.countList as AccountCountList)._id === countListId
            );
          });
          if (!currentCount || !rowProduct) {
            return;
          }
          const productStock = stocks?.find(
            (s) =>
              s.product === rowProduct?._id &&
              s.packageType === collapsibleForm?.packageType
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
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  const columns = [{ key: t("Product"), isSortable: true }];
  const rowKeys = [{ key: "product" }];
  return (
    <>
      <Header />
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Count")}
          addCollapsible={addCollapsible}
          isCollapsible={products.length > 0}
        />
      </div>
    </>
  );
};

export default Count;
