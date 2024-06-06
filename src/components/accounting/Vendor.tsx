import { forEach } from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbHexagonPlus } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { AccountUnit, AccountVendor, RoleEnum } from "../../types";
import {
  useAccountFixtureMutations,
  useGetAccountFixtures,
} from "../../utils/api/account/fixture";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetAccountServices } from "../../utils/api/account/service";
import {
  useAccountVendorMutations,
  useGetAccountVendors,
} from "../../utils/api/account/vendor";
import { NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
const Vendor = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const vendors = useGetAccountVendors();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddFixureModalOpen, setIsAddFixtureModalOpen] = useState(false);
  const fixtures = useGetAccountFixtures();
  const services = useGetAccountServices();
  const { updateAccountFixture } = useAccountFixtureMutations();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { updateAccountProduct } = useAccountProductMutations();
  const products = useGetAccountProducts();
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [rowToAction, setRowToAction] = useState<AccountVendor>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountVendor, deleteAccountVendor, updateAccountVendor } =
    useAccountVendorMutations();
  const [productForm, setProductForm] = useState({
    product: [],
  });
  const [fixtureForm, setFixtureForm] = useState({
    fixture: [],
  });
  const allRows = vendors?.map((vendor) => {
    return {
      ...vendor,
      productCount:
        products?.filter((item) => item?.vendor?.includes(vendor?._id))
          ?.length ?? 0,
      fixtureCount:
        fixtures?.filter((item) => item?.vendor?.includes(vendor?._id))
          ?.length ?? 0,
      serviceCount:
        services?.filter((item) => item?.vendor?.includes(vendor?._id))
          ?.length ?? 0,
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Product Count"), isSortable: true },
    { key: t("Fixture Count"), isSortable: true },
    { key: t("Service Count"), isSortable: true },
  ];
  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER, RoleEnum.GAMEMANAGER].includes(
      user?.role?._id
    )
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
      node: (row: AccountVendor) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            setCurrentPage(1);
            // setRowsPerPage(RowPerPageEnum.FIRST);
            setSearchQuery("");
            setSortConfigKey(null);
            navigate(`/vendor/${row._id}`);
          }}
        >
          {row.name}
        </p>
      ),
    },
    { key: "productCount" },
    { key: "fixtureCount" },
    { key: "serviceCount" },
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
          (product) =>
            !product.vendor?.some((item) => item === rowToAction?._id)
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
          (fixture) =>
            !fixture.vendor?.some((item) => item === rowToAction?._id)
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
    name: t(`Add Vendor`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createAccountVendor as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    isDisabled: user
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id)
      : true,
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
            deleteAccountVendor(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Vendor")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountVendor as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
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
                    vendor: [
                      ...(fixtures
                        ?.find((p) => p._id === fixture)
                        ?.vendor?.filter((item) => item !== "") || []),
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
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
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
                    vendor: [
                      ...(products
                        ?.find((p) => p._id === product)
                        ?.vendor?.filter((item) => item !== "") || []),
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
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [vendors, products, fixtures, services]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Vendors")}
          addButton={addButton}
          isActionsActive={
            user
              ? [
                  RoleEnum.MANAGER,
                  RoleEnum.CATERINGMANAGER,
                  RoleEnum.GAMEMANAGER,
                ].includes(user?.role?._id)
              : false
          }
        />
      </div>
    </>
  );
};

export default Vendor;
