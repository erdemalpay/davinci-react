import { forEach } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FaFileUpload } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountBrand, RoleEnum } from "../../types";
import {
  useAccountBrandMutations,
  useCreateMultipleBrandMutation,
  useGetAccountBrands,
} from "../../utils/api/account/brand";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
const Brand = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const pages = useGetPanelControlPages();
  const navigate = useNavigate();
  const { mutate: createMultipleBrand } = useCreateMultipleBrandMutation();
  const brands = useGetAccountBrands();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const { setCurrentPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const { updateAccountProduct } = useAccountProductMutations();
  const [rowToAction, setRowToAction] = useState<AccountBrand>();
  const [productForm, setProductForm] = useState({
    product: [],
  });
  const products = useGetAccountProducts();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountBrand, deleteAccountBrand, updateAccountBrand } =
    useAccountBrandMutations();
  const allRows = brands?.map((brand) => {
    return {
      ...brand,
      productCount:
        products?.filter((item) => item?.brand?.includes(brand?._id))?.length ??
        0,
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true, correspondingKey: "name" },
    { key: t("Product Count"), isSortable: true },
  ];
  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
      node: (row: AccountBrand) =>
        user &&
        pages &&
        pages
          ?.find((page) => page._id === "brand")
          ?.permissionRoles?.includes(user.role._id) ? (
          <p
            className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              setCurrentPage(1);
              // setRowsPerPage(RowPerPageEnum.FIRST);
              setSearchQuery("");
              setSortConfigKey(null);
              navigate(`/brand/${row._id}`);
            }}
          >
            {row.name}
          </p>
        ) : (
          <p>{row.name}</p>
        ),
    },
    { key: "productCount" },
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
            label: product.name,
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
    isDisabled: user
      ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
      : true,
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
      className: "text-red-500 cursor-pointer text-2xl ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
        : true,
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
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
        : true,
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
          setForm={setProductForm}
          topClassName="flex flex-col gap-2  "
          handleUpdate={() => {
            if (rowToAction) {
              forEach(productForm.product, (product) => {
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
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
        : true,
    },
  ];
  const processExcelData = (data: any[]) => {
    const headers = data[0];
    const columnKeys = columns.map((column) => column.key);
    const keys = rowKeys.map((rowKey) => rowKey.key);
    const items = data.slice(1).reduce((accum: any[], row) => {
      const item: any = {};
      row.forEach((cell: any, index: number) => {
        const translatedIndex = columnKeys.indexOf(headers[index]);
        if (translatedIndex !== -1) {
          const key = keys[translatedIndex];
          item[key] = cell;
        }
      });
      if (Object.keys(item).length > 0) {
        accum.push(item);
      }
      return accum;
    }, []);
    createMultipleBrand(items);
  };
  const uploadExcelFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const buffer = e.target?.result;
      if (buffer) {
        const wb = XLSX.read(buffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        processExcelData(data);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  const handleFileButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  const filters = [
    {
      isUpperSide: false,
      node: (
        <div
          className="my-auto  items-center text-xl cursor-pointer border px-2 py-1 rounded-md hover:bg-blue-50  bg-opacity-50 hover:scale-105"
          onClick={handleFileButtonClick}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={uploadExcelFile}
            style={{ display: "none" }}
            ref={inputRef}
          />
          <ButtonTooltip content={t("Create Multiple")}>
            <FaFileUpload />
          </ButtonTooltip>
        </div>
      ),
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [brands, products]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Brands")}
          addButton={addButton}
          filters={filters}
          isExcel={true}
          isEmtpyExcel={true}
          excelFileName={"Brand.xlsx"}
          isActionsActive={
            user
              ? [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.OPERATIONSASISTANT].includes(
                  user?.role?._id
                )
              : false
          }
        />
      </div>
    </>
  );
};

export default Brand;
