import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { GiSevenPointedStar } from "react-icons/gi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { Point, RoleEnum } from "../../types";
import { UpdatePayload } from "../../utils/api";
import { useGetPoints, usePointMutations } from "../../utils/api/point";
import { useGetUsersMinimal } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

export interface PointRow extends Point {
  userName: string;
}

const UsersPointComponent = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const points = useGetPoints();
  const users = useGetUsersMinimal();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<PointRow>();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const { createPoint, deletePoint, updatePoint } = usePointMutations();

  const allRows = useMemo(() => {
    return points
      .filter((point) => !!point?.user)
      .map((point: Point) => {
        const foundUser = getItem(point.user, users);
        return {
          ...point,
          userName: foundUser?.name || String(point.user),
        };
      });
  }, [points, users]);

  const columns = useMemo(
    () => [
      { key: t("User"), isSortable: true },
      { key: t("Amount"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(() => [{ key: "userName" }, { key: "amount" }], []);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "user",
        label: t("User"),
        options: users?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("User"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "amount",
        label: t("Amount"),
        placeholder: t("Amount"),
        required: true,
      },
    ],
    [t, users]
  );

  const formKeys = useMemo(
    () => [
      { key: "user", type: FormKeyTypeEnum.STRING },
      { key: "amount", type: FormKeyTypeEnum.NUMBER },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Point"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={
            createPoint as unknown as (
              item: Partial<Point> | UpdatePayload<Partial<Point>>
            ) => void
          }
          topClassName="flex flex-col gap-2"
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      icon: <GiSevenPointedStar className="text-xl" />,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [t, isAddModalOpen, inputs, formKeys, createPoint, user]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isDeleteConfirmationOpen}
            close={() => setIsDeleteConfirmationOpen(false)}
            confirm={() => {
              deletePoint(rowToAction._id);
              setIsDeleteConfirmationOpen(false);
            }}
            title={t("Delete Action")}
            text={t("All points will be removed")}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isDeleteConfirmationOpen,
        setIsModal: setIsDeleteConfirmationOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
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
            submitItem={
              updatePoint as unknown as (
                item: PointRow | UpdatePayload<PointRow>
              ) => void
            }
            isEditMode={true}
            topClassName="flex flex-col gap-2"
            itemToEdit={{
              id: rowToAction._id,
              updates: rowToAction,
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      },
    ],
    [
      t,
      rowToAction,
      isDeleteConfirmationOpen,
      deletePoint,
      isEditModalOpen,
      inputs,
      formKeys,
      updatePoint,
      user,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={allRows}
        title={t("Users Points")}
        addButton={addButton}
        isActionsActive={true}
      />
    </div>
  );
};

export default UsersPointComponent;
