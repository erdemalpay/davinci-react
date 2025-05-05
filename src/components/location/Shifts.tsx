import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetStoreLocations,
  useLocationMutations,
} from "../../utils/api/location";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  locationId: number;
};
const Shifts = ({ locationId }: Props) => {
  const { t } = useTranslation();
  const locations = useGetStoreLocations();
  const [rowToAction, setRowToAction] = useState<any>();
  const { updateLocation } = useLocationMutations();
  const [tableKey, setTableKey] = useState(0);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const allRows = locations
    ?.find((l) => l._id === locationId)
    ?.shifts?.map((shift) => {
      return {
        shift: shift,
      };
    });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Shift"), isSortable: true, correspondingKey: "shift" },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [{ key: "shift" }];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [locations]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          isSearch={false}
          //   addButton={addButton}
          rows={rows ?? []}
          title={t("Shifts")}
          //   actions={actions}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default Shifts;
