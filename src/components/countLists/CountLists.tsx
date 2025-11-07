import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { TbIndentIncrease } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  AccountCountList,
  ActionEnum,
  DisabledConditionEnum,
} from "../../types";
import {
  useAccountCountMutations,
  useGetAccountCounts,
} from "../../utils/api/account/count";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../../utils/api/account/countList";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
  RowKeyType,
} from "../panelComponents/shared/types";

const CountLists = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const countLists = useGetAccountCountLists();
  const locations = useGetStockLocations();
  const counts = useGetAccountCounts();
  const [showInactiveCountLists, setShowInactiveCountLists] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const expenseTypes = useGetAccountExpenseTypes();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountCountList>();
  const { createAccountCount } = useAccountCountMutations();
  const { resetGeneralContext } = useGeneralContext();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createAccountCountList,
    deleteAccountCountList,
    updateAccountCountList,
  } = useAccountCountListMutations();
  const [countLocationForm, setCountLocationForm] = useState({
    location: 0,
  });
  const [isCountLocationModalOpen, setIsCountLocationModalOpen] =
    useState(false);

  const disabledConditions = useGetDisabledConditions();

  const countListsDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.COUNTLISTS, disabledConditions);
  }, [disabledConditions]);

  function handleLocationUpdate(item: AccountCountList, location: number) {
    const newLocations = item.locations || [];
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateAccountCountList({
      id: item._id,
      updates: { locations: newLocations },
    });
    toast.success(`${t("Count List updated successfully")}`);
  }

  const { columns, rowKeys } = useMemo(() => {
    const cols = [
      { key: t("Name"), isSortable: true },
      { key: t("Expense Type"), isSortable: true },
    ];
    const keys: RowKeyType<AccountCountList>[] = [
      {
        key: "name",
        node: (row: AccountCountList) => (
          <p
            className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              resetGeneralContext();
              navigate(`/count-list/${row._id}`);
            }}
          >
            {row.name}
          </p>
        ),
      },
      {
        key: "expenseTypes",
        className: "min-w-32",
        node: (row: AccountCountList) =>
          row?.expenseTypes?.map((expType: string, index) => {
            const foundExpenseType = expenseTypes.find(
              (e) => e._id === expType
            );
            return (
              <span
                key={foundExpenseType?.name ?? index + row._id + "expenseType"}
                className="text-sm px-2 py-1 mr-1 rounded-md w-fit text-white font-semibold"
                style={{ backgroundColor: foundExpenseType?.backgroundColor }}
              >
                {foundExpenseType?.name}
              </span>
            );
          }),
      },
    ];

    // Adding location columns and rowkeys
    for (const location of locations) {
      cols.push({ key: location?.name, isSortable: true });
      keys.push({
        key: String(location._id),
        node: (row: AccountCountList) =>
          isEnableEdit ? (
            <CheckSwitch
              checked={row?.locations?.includes(location._id)}
              onChange={() => handleLocationUpdate(row, location?._id)}
            />
          ) : row?.locations?.includes(location?._id) ? (
            <IoCheckmark className="text-blue-500 text-2xl " />
          ) : (
            <IoCloseOutline className="text-red-800 text-2xl" />
          ),
      });
    }
    cols.push({ key: t("Actions"), isSortable: false });

    return { columns: cols, rowKeys: keys };
  }, [
    t,
    locations,
    isEnableEdit,
    resetGeneralContext,
    navigate,
    updateAccountCountList,
  ]);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseTypes",
        label: t("Expense Type"),
        options: expenseTypes.map((expenseType) => {
          return {
            value: expenseType._id,
            label: expenseType.name,
          };
        }),
        placeholder: t("Expense Type"),
        isMultiple: true,
        required: false,
      },
    ],
    [t, expenseTypes]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "expenseTypes", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const countLocationFormKeys = useMemo(
    () => [{ key: "location", type: FormKeyTypeEnum.STRING }],
    []
  );

  const countLocationInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: (rowToAction
          ? locations.filter((lctn) => {
              return rowToAction?.locations?.includes(lctn._id);
            })
          : locations
        )?.map((input) => {
          return {
            value: input._id,
            label: input.name,
          };
        }),
        placeholder: t("Location"),
        required: true,
      },
    ],
    [t, rowToAction, locations]
  );

  const addButton = useMemo(
    () => ({
      name: t(`Add Count List`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => {
            setIsAddModalOpen(false);
          }}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createAccountCountList as any}
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
      isDisabled: countListsDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createAccountCountList,
      countListsDisabledCondition,
      user,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isCloseAllConfirmationDialogOpen}
            close={() => {
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            confirm={() => {
              deleteAccountCountList(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Count List")}
            text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl  ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: countListsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl  ",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => {
              setIsEditModalOpen(false);
            }}
            inputs={inputs}
            formKeys={formKeys}
            submitItem={updateAccountCountList as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2  "
            submitFunction={() => {
              updateAccountCountList({
                id: rowToAction._id,
                updates: {
                  name: rowToAction.name,
                },
              });
            }}
            itemToEdit={{
              id: rowToAction._id,
              updates: {
                name: rowToAction.name,
                expenseTypes: rowToAction.expenseTypes,
              },
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: countListsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Toggle Active"),
        isDisabled:
          !showInactiveCountLists ||
          countListsDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.SHOW_INACTIVE_ELEMENTS &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ),
        isModal: false,
        isPath: false,
        icon: null,

        node: (row: any) => (
          <div className="mt-2">
            <CheckSwitch
              checked={row?.active}
              onChange={() =>
                updateAccountCountList({
                  id: row._id,
                  updates: {
                    active: !(row?.active ? row.active : false),
                  },
                })
              }
            ></CheckSwitch>
          </div>
        ),
      },
      {
        name: t("Count"),
        icon: <TbIndentIncrease />,
        className: "cursor-pointer text-xl  ",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isCountLocationModalOpen}
            close={() => setIsCountLocationModalOpen(false)}
            inputs={countLocationInputs}
            formKeys={countLocationFormKeys}
            //  eslint-disable-next-line
            submitItem={() => {}}
            submitFunction={async () => {
              if (countLocationForm.location === 0 || !user) return;
              if (
                counts?.filter((item) => {
                  return (
                    item.isCompleted === false &&
                    item.location === countLocationForm.location &&
                    item.user === user._id &&
                    item.countList === rowToAction._id
                  );
                }).length > 0
              ) {
                resetGeneralContext();
                navigate(
                  `/count/${countLocationForm.location}/${rowToAction._id}`
                );
              } else {
                createAccountCount({
                  location: countLocationForm.location,
                  countList: rowToAction._id,
                  isCompleted: false,
                  createdAt: new Date(),
                  user: user._id,
                });
                resetGeneralContext();
                navigate(
                  `/count/${countLocationForm.location}/${rowToAction._id}`
                );
              }
            }}
            setForm={setCountLocationForm}
            isEditMode={false}
            topClassName="flex flex-col gap-2 "
            buttonName={t("Submit")}
          />
        ) : null,
        isModalOpen: isCountLocationModalOpen,
        setIsModal: setIsCountLocationModalOpen,
        isPath: false,
        isDisabled: countListsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.CREATE_COUNT &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteAccountCountList,
      isEditModalOpen,
      inputs,
      formKeys,
      updateAccountCountList,
      showInactiveCountLists,
      isCountLocationModalOpen,
      countLocationInputs,
      countLocationFormKeys,
      counts,
      resetGeneralContext,
      navigate,
      createAccountCount,
      countLocationForm,
      countListsDisabledCondition,
      user,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Inactive CountLists"),
        isDisabled: countListsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOW_INACTIVE_ELEMENTS &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showInactiveCountLists}
            onChange={setShowInactiveCountLists}
          />
        ),
      },
      {
        label: t("Location Edit"),
        isDisabled: countListsDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE_LOCATION &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        isUpperSide: true,
        node: (
          <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />
        ),
      },
    ],
    [
      t,
      showInactiveCountLists,
      isEnableEdit,
      countListsDisabledCondition,
      user,
    ]
  );

  const filteredRows = useMemo(() => {
    return showInactiveCountLists
      ? countLists
      : countLists?.filter((countList) => countList.active);
  }, [showInactiveCountLists, countLists]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={filters}
          rows={filteredRows}
          title={t("Count Lists")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default CountLists;
