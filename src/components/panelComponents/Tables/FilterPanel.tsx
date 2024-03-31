import { PanelFilterType } from "../shared/types";
import { H4 } from "../Typography";

type Props = { filters: PanelFilterType[] };

const FilterPanel = ({ filters }: Props) => {
  return (
    <div className="flex flex-col gap-3 __className_a182b8 min-w-[20rem] border border-gray-200 rounded-md py-2 px-3 focus:outline-none ">
      <H4 className="my-1">Filters</H4>
      {filters.map((filter, index) => (
        <div
          className="border border-gray-200 rounded-md py-2 px-3 focus:outline-none"
          key={"filterPanel" + index}
        >
          {filter.children}
        </div>
      ))}
    </div>
  );
};

export default FilterPanel;
