import { forEach } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbHexagonPlus } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { AccountBrand, AccountUnit } from "../../types";
import {
  useAccountBrandMutations,
  useGetAccountBrands,
} from "../../utils/api/account/brand";
import {
  useAccountFixtureMutations,
  useGetAccountFixtures,
} from "../../utils/api/account/fixture";
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
  const navigate = useNavigate();
  const brands = useGetAccountBrands();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const { setCurrentPage, setRowsPerPage, setSearchQuery } =
    useGeneralContext();
  const [isAddFixureModalOpen, setIsAddFixtureModalOpen] = useState(false);
  const fixtures = useGetAccountFixtures();
  const { updateAccountProduct } = useAccountProductMutations();
  const { updateAccountFixture } = useAccountFixtureMutations();
  const [rowToAction, setRowToAction] = useState<AccountBrand>();
  const [productForm, setProductForm] = useState({
    product: [],
  });
  const [fixtureForm, setFixtureForm] = useState({
    fixture: [],
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
      fixtureCount:
        fixtures?.filter((item) => item?.brand?.includes(brand?._id))?.length ??
        0,
    };
  });
  const [rows, setRows] = useState(allRows);

  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Product Count"), isSortable: true },
    { key: t("Fixture Count"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
      node: (row: AccountBrand) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            setCurrentPage(1);
            // setRowsPerPage(RowPerPageEnum.FIRST);
            setSearchQuery("");
            navigate(`/brand/${row._id}`);
          }}
        >
          {row.name}
        </p>
      ),
    },
    { key: "productCount" },
    { key: "fixtureCount" },
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
  const addFixtureInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "fixture",
      label: t("Fixture"),
      options: fixtures
        .filter(
          (fixture) => !fixture.brand?.some((item) => item === rowToAction?._id)
        )
        .map((fixture) => {
          return {
            value: fixture._id,
            label: fixture.name,
          };
        }),
      isMultiple: true,
      placeholder: t("Fixture"),
      required: true,
    },
  ];
  const addFixtureFormKeys = [{ key: "fixture", type: FormKeyTypeEnum.STRING }];
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
      name: t("Add Into Fixture"),
      icon: <TbHexagonPlus />,
      className: "text-2xl mt-1 text-gray-600  cursor-pointer",
      isModal: true,
      setRow: setRowToAction,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddFixureModalOpen}
          close={() => setIsAddFixtureModalOpen(false)}
          inputs={addFixtureInputs}
          formKeys={addFixtureFormKeys}
          submitItem={updateAccountFixture as any}
          isEditMode={true}
          setForm={setFixtureForm}
          topClassName="flex flex-col gap-2  "
          handleUpdate={() => {
            if (rowToAction) {
              forEach(fixtureForm.fixture, (fixture) => {
                updateAccountFixture({
                  id: fixture,
                  updates: {
                    brand: [
                      ...(fixtures
                        ?.find((p) => p._id === fixture)
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
      isModalOpen: isAddFixureModalOpen,
      setIsModal: setIsAddFixtureModalOpen,
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
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [brands]);

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
        />
      </div>
    </>
  );
};

export default Brand;
