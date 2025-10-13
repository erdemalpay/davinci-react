import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { TbIndentIncrease } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { ExpirationListType, RoleEnum } from "../../types";
import {
  useExpirationCountMutations,
  useGetExpirationCounts,
} from "../../utils/api/expiration/expirationCount";
import {
  useExpirationListMutations,
  useGetExpirationLists,
} from "../../utils/api/expiration/expirationList";
import { useGetStockLocations } from "../../utils/api/location";
import { isDisabledConditionManagerOnly } from "../../utils/isDisabledConditions";
import { NameInput } from "../../utils/panelInputs";
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

const ExpirationLists = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const isDisabledCondition = isDisabledConditionManagerOnly(user);
  const navigate = useNavigate();
  const expirationLists = useGetExpirationLists();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetStockLocations();
  const [showInactiveExpirationLists, setShowInactiveExpirationLists] =
    useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [rowToAction, setRowToAction] = useState<ExpirationListType>();
  const { createExpirationCount } = useExpirationCountMutations();
  const expirationCounts = useGetExpirationCounts();
  const [isCountLocationModalOpen, setIsCountLocationModalOpen] =
    useState(false);
  const { resetGeneralContext } = useGeneralContext();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createExpirationList, deleteExpirationList, updateExpirationList } =
    useExpirationListMutations();

  function handleLocationUpdate(item: ExpirationListType, location: number) {
    const newLocations = item.locations || [];
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateExpirationList({
      id: item._id,
      updates: { locations: newLocations },
    });
    toast.success(`${t("Expiration List updated successfully")}`);
  }
  const [countLocationForm, setCountLocationForm] = useState({
    location: 0,
  });
  const countLocationInputs = [
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
  ];
  const countLocationFormKeys = [
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<ExpirationListType>[] = [
    {
      key: "name",
      node: (row: ExpirationListType) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            resetGeneralContext();
            navigate(`/expiration-list/${row._id}`);
          }}
        >
          {row.name}
        </p>
      ),
    },
  ];

  // Adding location columns and rowkeys
  for (const location of locations) {
    columns.push({ key: location?.name, isSortable: true });
    rowKeys.push({
      key: String(location._id),
      node: (row: ExpirationListType) =>
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
  columns.push({ key: t("Actions"), isSortable: false });
  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];

  const addButton = {
    name: t(`Add Expiration List`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => {
          setIsAddModalOpen(false);
        }}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createExpirationList as any}
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
          close={() => {
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          confirm={() => {
            deleteExpirationList(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Expiration List")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: isDisabledCondition,
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
          submitItem={updateExpirationList as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2  "
          submitFunction={() => {
            updateExpirationList({
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
            },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: isDisabledCondition,
    },
    {
      name: t("Toggle Active"),
      isDisabled:
        !showInactiveExpirationLists ||
        (user && ![RoleEnum.MANAGER].includes(user.role._id)),
      isModal: false,
      isPath: false,
      icon: null,

      node: (row: any) => (
        <div className="mt-2">
          <CheckSwitch
            checked={row?.active}
            onChange={() =>
              updateExpirationList({
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
              expirationCounts?.filter((item) => {
                return (
                  item.isCompleted === false &&
                  item.location === countLocationForm.location &&
                  item.user === user._id &&
                  item.expirationList === rowToAction._id
                );
              }).length > 0
            ) {
              resetGeneralContext();
              navigate(
                `/count/${countLocationForm.location}/${rowToAction._id}`
              );
            } else {
              createExpirationCount({
                location: countLocationForm.location,
                expirationList: rowToAction._id,
                isCompleted: false,
                createdAt: new Date(),
                user: user._id,
              });
              resetGeneralContext();
              navigate(
                `/expiration/${countLocationForm.location}/${rowToAction._id}`
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
    },
  ];
  const filters = [
    {
      label: t("Show Inactive ExpirationLists"),
      isDisabled: isDisabledCondition,
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showInactiveExpirationLists}
          onChange={setShowInactiveExpirationLists}
        />
      ),
    },
    {
      label: t("Location Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  useEffect(
    () => setTableKey((prev) => prev + 1),
    [
      expirationLists,
      locations,
      showInactiveExpirationLists,
      expirationLists,
      expirationCounts,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={
            user && [RoleEnum.MANAGER].includes(user.role._id) ? filters : []
          }
          rows={
            showInactiveExpirationLists
              ? expirationLists
              : expirationLists?.filter(
                  (expirationList) => expirationList.active
                )
          }
          title={t("Expiration Lists")}
          addButton={
            user && [RoleEnum.MANAGER].includes(user.role._id)
              ? addButton
              : undefined
          }
        />
      </div>
    </>
  );
};

export default ExpirationLists;
