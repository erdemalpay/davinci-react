import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { AccountProduct } from "../types";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetAccountStocks } from "../utils/api/account/stock";
import {
  useExpirationCountMutations,
  useGetExpirationCounts,
} from "../utils/api/expiration/expirationCount";
import {
  useExpirationListMutations,
  useGetExpirationLists,
} from "../utils/api/expiration/expirationList";

const ExpirationCount = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const products = useGetAccountProducts();
  const expirationCounts = useGetExpirationCounts();
  const stocks = useGetAccountStocks();
  const { updateExpirationCount, deleteExpirationCount } =
    useExpirationCountMutations();
  const expirationLists = useGetExpirationLists();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const { updateExpirationList } = useExpirationListMutations();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { resetGeneralContext, setExpirationActiveTab } = useGeneralContext();
  const { location, expirationListId } = useParams();
  const [form, setForm] = useState({
    product: [],
  });
  const currentExpirationCount = expirationCounts?.find((item) => {
    return (
      item.isCompleted === false &&
      item.location === Number(location) &&
      item.user === user?._id &&
      item.expirationList === expirationListId
    );
  });
  const countListProducts = expirationLists?.find(
    (cl) => cl?._id === expirationListId
  )?.products;
  const [rows, setRows] = useState(
    expirationLists
      ?.find((cl) => cl?._id === expirationListId)
      ?.products?.map((countListProduct) => {
        if (location && countListProduct.locations.includes(Number(location))) {
          return {
            products: currentExpirationCount?.products,
            productId: countListProduct.product,
            product:
              products?.find(
                (p: AccountProduct) => p?._id === countListProduct.product
              )?.name || "",
          };
        }
        return { product: "", countQuantity: 0 };
      })
      .filter((item) => item.product !== "") || []
  );
  //   const pageNavigations = [
  //     {
  //       name: t("ExpirationCount Lists"),
  //       path: Routes.ExpirationLists,
  //       canBeClicked: true,
  //       additionalSubmitFunction: () => {
  //         resetGeneralContext();
  //       },
  //     },
  //     {
  //       name: t("ExpirationCount"),
  //       path: "",
  //       canBeClicked: false,
  //     },
  //   ];
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

  const columns = [{ key: t("Product"), isSortable: true }];
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
  ];
  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];

  useEffect(() => {
    setRows(
      expirationLists
        .find((cl) => cl._id === expirationListId)
        ?.products?.map((countListProduct) => {
          if (
            location &&
            countListProduct.locations.includes(Number(location))
          ) {
            return {
              products: currentExpirationCount?.products,
              productId: countListProduct.product,
              product:
                products?.find(
                  (p: AccountProduct) => p?._id === countListProduct.product
                )?.name || "",
            };
          }
          return { product: "", countQuantity: 0 };
        })
        .filter((item) => item.product !== "") || []
    );
    setTableKey((prev) => prev + 1);
  }, [
    expirationListId,
    expirationLists,
    location,
    products,
    stocks,
    expirationCounts,
    i18n.language,
  ]);
  return (
    <>
      <Header />
      {/* <PageNavigator navigations={pageNavigations} /> */}
      <div className="w-[95%] my-10 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Expiration Count")}
          isActionsActive={false}
          addButton={addButton}
          filters={filters}
          //   actions={isEnableEdit ? actions : []}
        />
      </div>
    </>
  );
};

export default ExpirationCount;
