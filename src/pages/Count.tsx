import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../components/panelComponents/FormElements/TextInput";
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
  useAccountCountMutations,
  useGetAccountCounts,
} from "../utils/api/account/count";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../utils/api/account/countList";
import { useGetAccountProducts } from "../utils/api/account/product";
import { useGetAccountStocks } from "../utils/api/account/stock";

const Count = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const products = useGetAccountProducts();
  const counts = useGetAccountCounts();
  const stocks = useGetAccountStocks();
  const { updateAccountCount } = useAccountCountMutations();
  const countLists = useGetAccountCountLists();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { updateAccountCountList } = useAccountCountListMutations();
  const [tableKey, setTableKey] = useState(0);

  const {
    setCurrentPage,
    setSearchQuery,
    setCountListActiveTab,
    setSortConfigKey,
  } = useGeneralContext();
  const { location, countListId } = useParams();
  const [form, setForm] = useState({
    product: [],
  });
  const currentCount = counts?.find((item) => {
    return (
      item.isCompleted === false &&
      item.location === location &&
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
        if (location && countListProduct.locations.includes(location)) {
          return {
            products: currentCount?.products,
            productId: countListProduct.product,
            product:
              products?.find((p) => p?._id === countListProduct.product)
                ?.name || "",
            countQuantity: currentCount?.products?.find(
              (countProduct) =>
                countProduct.product === countListProduct.product
            )?.countQuantity,
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
        setCurrentPage(1);
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
    { key: t("Quantity"), isSortable: true, className: "mx-auto" },
    { key: t("Actions"), isSortable: false },
  ];
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
              if (!currentCount || !rowProduct) {
                return;
              }
              const productStock = stocks?.find(
                (s) =>
                  s?.product === rowProduct?._id && s?.location === location
              );
              const newProducts = [
                ...(currentCount?.products?.filter(
                  (p) => p.product !== rowProduct?._id
                ) || []),
                {
                  product: rowProduct?._id,
                  countQuantity: 0,
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
          >
            <ButtonTooltip content={t("Product count: 0")}>
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
              currentCount?.products?.some(
                (curentCountProduct) =>
                  curentCountProduct.product === row.productId &&
                  curentCountProduct.countQuantity === 0
              )
                ? "bg-red-200 w-fit px-2 py-1 rounded-md text-white"
                : ""
            }`}
          >
            {row.product}
          </div>
        );
      },
    },
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
                    s?.product === rowProduct?._id && s?.location === location
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
  useEffect(() => {
    setRows(
      countLists
        .find((cl) => cl._id === countListId)
        ?.products?.map((countListProduct) => {
          if (location && countListProduct.locations.includes(location)) {
            return {
              products: currentCount?.products,
              productId: countListProduct.product,
              product:
                products?.find((p) => p?._id === countListProduct.product)
                  ?.name || "",
              countQuantity: currentCount?.products?.find(
                (countProduct) =>
                  countProduct.product === countListProduct.product
              )?.countQuantity,
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
          isActionsActive={true}
          addButton={addButton}
          actions={actions}
        />
        <div className="flex justify-end mt-4">
          <button
            className="px-2  bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
            onClick={() => {
              if (!currentCount) {
                return;
              }
              if (
                currentCount?.products?.length !== countListProducts?.length
              ) {
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
