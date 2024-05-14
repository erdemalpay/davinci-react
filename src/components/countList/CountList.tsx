import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { AccountProduct } from "../../types";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../../utils/api/account/countList";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { H5 } from "../panelComponents/Typography";

type Props = {
  countListId: string;
};
const CountList = ({ countListId }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const { updateAccountCountList } = useAccountCountListMutations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountProduct>();
  const products = useGetAccountProducts();
  const [form, setForm] = useState({
    product: [],
  });
  const rows = () => {
    let productRows = [];
    const currentCountList = countLists.find(
      (item) => item._id === countListId
    );
    if (currentCountList && currentCountList.products) {
      for (let item of currentCountList.products) {
        const product = products.find(
          (product) => product._id === item.product
        );
        if (product) {
          productRows.push(product);
        }
      }
    }
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
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [{ key: "name" }];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [countLists, products, countListId]);

  const addButton = {
    name: t("Add Product"),
    icon: null,
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
            productRows = [...products, ...form.product];
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
    ) : null,
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
            if (countListId) {
              updateAccountCountList({
                id: countListId,
                updates: {
                  products: countLists
                    .find((item) => item._id === countListId)
                    ?.products?.filter(
                      (item) => item.product !== rowToAction._id
                    ),
                },
              });
            }

            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Count List Item")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      isUpperSide: false,
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
  ];
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
