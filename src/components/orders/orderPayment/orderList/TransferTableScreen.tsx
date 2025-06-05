import { useTranslation } from "react-i18next";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { useOrderContext } from "../../../../context/Order.context";
import { OptionType, Table } from "../../../../types";
import SelectInput from "../../../panelComponents/FormElements/SelectInput";
import OrderScreenHeader from "./OrderScreenHeader";

type Props = {
  tables: Table[];
  table: Table;
};

const TransferTableScreen = ({ tables, table }: Props) => {
  const { selectedTableTransfer, setSelectedTableTransfer } = useOrderContext();
  const { t } = useTranslation();
  const tableOptions = tables
    ?.filter(
      (filteredTable) =>
        filteredTable._id !== table?._id && !filteredTable?.finishHour
    )
    ?.map((tableMap) => {
      return {
        value: tableMap?._id,
        label: tableMap?.name,
      };
    });
  const handleChangeForSelect =
    () =>
    (
      selectedValue: SingleValue<OptionType> | MultiValue<OptionType>,
      actionMeta: ActionMeta<OptionType>
    ) => {
      if (
        actionMeta.action === "select-option" ||
        actionMeta.action === "remove-value" ||
        actionMeta.action === "clear"
      ) {
        if (selectedValue) {
          setSelectedTableTransfer((selectedValue as OptionType)?.value);
        } else {
          setSelectedTableTransfer(0);
        }
      }
    };

  return (
    <div className="flex flex-col h-[60%] min-h-64 overflow-scroll no-scrollbar  ">
      <div className="px-2 ">
        <OrderScreenHeader header="Table Select" />
        {/* selection */}
        <SelectInput
          value={
            tableOptions?.find(
              (option) => option.value === selectedTableTransfer
            ) ?? {
              value: 0,
              label: t("Select Table"),
            }
          }
          placeholder={t("Select Table")}
          label={t("Select Table")}
          options={tableOptions}
          isMultiple={false}
          onChange={handleChangeForSelect()}
        />
      </div>
    </div>
  );
};

export default TransferTableScreen;
