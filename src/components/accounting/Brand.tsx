import { forEach } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { AccountBrand, AccountUnit } from "../../types";
import {
  useAccountBrandMutations,
  useGetAccountBrands,
} from "../../utils/api/account/brand";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Brand = () => {
  const { t } = useTranslation();
  const brands = useGetAccountBrands();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const { updateAccountProduct } = useAccountProductMutations();
  const [rowToAction, setRowToAction] = useState<AccountBrand>();
  const [form, setForm] = useState({
    product: [],
  });
  const products = useGetAccountProducts();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountBrand, deleteAccountBrand, updateAccountBrand } =
    useAccountBrandMutations();
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
  ];
  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const addProductInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products
        .filter(
          (product) => !product.brand?.some((item) => item === rowToAction?._id)
        )
        .map((product) => {
          return {
            value: product._id,
            label: product.name + `(${(product.unit as AccountUnit).name})`,
          };
        }),
      isMultiple: true,
      placeholder: t("Product"),
      required: true,
    },
  ];
  const addProductFormKeys = [{ key: "product", type: FormKeyTypeEnum.STRING }];
  const addButton = {
    name: t(`Add Brand`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountBrand as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
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
            deleteAccountBrand(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Brand")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountBrand as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
    {
      name: t("Add Into Product"),
      icon: <CiCirclePlus />,
      className: "text-2xl mt-1  mr-auto cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddProductModalOpen}
          close={() => setIsAddProductModalOpen(false)}
          inputs={addProductInputs}
          formKeys={addProductFormKeys}
          submitItem={updateAccountProduct as any}
          isEditMode={true}
          setForm={setForm}
          topClassName="flex flex-col gap-2  "
          handleUpdate={() => {
            if (rowToAction) {
              forEach(form.product, (product) => {
                updateAccountProduct({
                  id: product,
                  updates: {
                    brand: [
                      ...(products
                        ?.find((p) => p._id === product)
                        ?.brand?.filter((item) => item !== "") || []),
                      rowToAction._id,
                    ],
                  },
                });
              });
            }
          }}
        />
      ),
      isModalOpen: isAddProductModalOpen,
      setIsModal: setIsAddProductModalOpen,
      isPath: false,
    },
  ];
  useEffect(() => setTableKey((prev) => prev + 1), [brands]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={brands}
          title={t("Brands")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Brand;
