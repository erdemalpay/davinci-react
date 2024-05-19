import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { StockLocationEnum } from "../../types";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../../utils/api/account/countList";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { H5 } from "../panelComponents/Typography";

type Props = {
  countListId: string;
};
type CountListRowType = {
  product: string;
  bahceli: boolean;
  neorama: boolean;
  amazon: boolean;
};
const CountList = ({ countListId }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const { updateAccountCountList } = useAccountCountListMutations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<CountListRowType>();
  const products = useGetAccountProducts();
  const [form, setForm] = useState({
    product: [],
  });

  function handleLocationUpdate(item: any, changedLocation: string) {
    const currentCountList = countLists.find(
      (item) => item._id === countListId
    );
    if (!currentCountList) return;
    const newProducts = [
      ...(currentCountList.products?.filter(
        (p) =>
          p.product !==
          (products.find((it) => it.name === item.product)?._id ?? "")
      ) || []),

      {
        product: products.find((it) => it.name === item.product)?._id ?? "",
        locations: [
          changedLocation === StockLocationEnum.BAHCELI
            ? !item.bahceli
              ? (StockLocationEnum.BAHCELI as string)
              : ""
            : item.bahceli
            ? (StockLocationEnum.BAHCELI as string)
            : "",
          changedLocation === StockLocationEnum.NEORAMA
            ? !item.neorama
              ? (StockLocationEnum.NEORAMA as string)
              : ""
            : item.neorama
            ? (StockLocationEnum.NEORAMA as string)
            : "",
          changedLocation === StockLocationEnum.AMAZON
            ? !item.amazon
              ? (StockLocationEnum.AMAZON as string)
              : ""
            : item.amazon
            ? (StockLocationEnum.AMAZON as string)
            : "",
        ].filter((location) => location !== ""),
      },
    ];
    updateAccountCountList({
      id: currentCountList._id,
      updates: { products: newProducts },
    });
    toast.success(`${t("Count List updated successfully")}`);
  }
  const rows = () => {
    let productRows = [];
    const currentCountList = countLists.find(
      (item) => item._id === countListId
    );
    if (currentCountList && currentCountList.products) {
      for (let item of currentCountList.products) {
        const product = products.find((it) => it._id === item.product);
        if (product) {
          productRows.push({
            product: product.name,
            bahceli: item.locations?.includes(StockLocationEnum.BAHCELI),
            neorama: item.locations?.includes(StockLocationEnum.NEORAMA),
            amazon: item.locations?.includes(StockLocationEnum.AMAZON),
          });
        }
      }
    }
    productRows = productRows.sort((a, b) => {
      if (a.product < b.product) {
        return -1;
      }
      if (a.product > b.product) {
        return 1;
      }
      return 0;
    });
    return productRows;
  };
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
    { key: t("Name"), isSortable: true },
    { key: "Bahçeli", isSortable: false },
    { key: "Neorama", isSortable: false },
    { key: "Amazon", isSortable: false },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "product" },
    {
      key: "bahceli",
      node: (row: CountListRowType) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.bahceli}
            onChange={() =>
              handleLocationUpdate(row, StockLocationEnum.BAHCELI)
            }
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.bahceli ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {row.bahceli ? t("Yes") : t("No")}
          </p>
        ),
    },
    {
      key: "neorama",
      node: (row: CountListRowType) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.neorama}
            onChange={() =>
              handleLocationUpdate(row, StockLocationEnum.NEORAMA)
            }
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.neorama ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {row.neorama ? t("Yes") : t("No")}
          </p>
        ),
    },
    {
      key: "amazon",
      node: (row: CountListRowType) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.amazon}
            onChange={() => handleLocationUpdate(row, StockLocationEnum.AMAZON)}
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.amazon ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {row.amazon ? t("Yes") : t("No")}
          </p>
        ),
    },
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
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            if (countListId && rowToAction) {
              const currentCountList = countLists.find(
                (item) => item._id === countListId
              );
              const newProducts = currentCountList?.products?.filter(
                (item) =>
                  item.product !==
                  products?.find((p) => p.name === rowToAction.product)?._id
              );
              updateAccountCountList({
                id: countListId,
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
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      isUpperSide: true,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            navigate(`/count/${countListId}`);
          }}
        >
          <H5> {t("Count")}</H5>
        </button>
      ),
    },
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: (
        <Switch
          checked={isEnableEdit}
          onChange={() => setIsEnableEdit((value) => !value)}
          className={`${isEnableEdit ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${isEnableEdit ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];

  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [countLists, products, countListId]);
  const locationsConfig = [
    {
      enum: StockLocationEnum.BAHCELI,
      columnKey: "Bahçeli",
      rowKey: "bahceli",
    },
    {
      enum: StockLocationEnum.NEORAMA,
      columnKey: "Neorama",
      rowKey: "neorama",
    },
    { enum: StockLocationEnum.AMAZON, columnKey: "Amazon", rowKey: "amazon" },
  ];

  locationsConfig.forEach(({ enum: locationEnum, columnKey, rowKey }) => {
    if (
      !countLists
        .find((item) => item._id === countListId)
        ?.locations.includes(locationEnum)
    ) {
      const columnIndex = columns.findIndex(
        (column) => column.key === columnKey
      );
      if (columnIndex !== -1) {
        columns.splice(columnIndex, 1);
      }
      const rowKeyIndex = rowKeys.findIndex((rKey) => rKey.key === rowKey);
      if (rowKeyIndex !== -1) {
        rowKeys.splice(rowKeyIndex, 1);
      }
    }
  });

  return (
    <>
      <div className="w-[95%] my-5 mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows()}
          actions={actions}
          addButton={addButton}
          filters={filters}
          title={countLists.find((row) => row._id === countListId)?.name}
        />
      </div>
    </>
  );
};

export default CountList;
