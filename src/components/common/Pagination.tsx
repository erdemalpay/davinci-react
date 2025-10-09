import React from "react";
import { GenericButton } from "./GenericButton";

export function Pagination({
  page,
  limitPerPage,
  itemsCount,
  totalPages,
  handleClick,
  handleLimitSelection,
}: {
  page: number;
  limitPerPage: number;
  itemsCount: number;
  totalPages: number;
  handleClick: (num: number) => void;
  handleLimitSelection: (num: number) => void;
}) {
  return (
    <nav className="flex flex-col lg:flex-row justify-between items-center p-4 gap-4">
      <div className="text-sm font-normal text-gray-500">
        Showing{" "}
        <span className="font-semibold text-gray-900">
          {`${(page - 1) * limitPerPage + 1} - ${Math.min(
            page * limitPerPage,
            itemsCount
          )}`}
        </span>{" "}
        of <span className="font-semibold text-gray-900">{itemsCount}</span>
      </div>
      <span className="flex items-center justify-end gap-x-4">
        {"Items:"}
        <select
          onChange={(value) =>
            handleLimitSelection(value.target.value as unknown as number)
          }
          className="py-2 border-b-[1px] border-b-grey-300 focus:outline-none text-sm"
          value={limitPerPage}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>

        <div className="inline-flex items-center -space-x-px text-sm leading-tight">
          <GenericButton
            className="rounded-l-lg rounded-r-none border border-gray-300"
            variant="ghost"
            size="sm"
            onClick={() => handleClick(page - 5)}
          >
            {"<<"}
          </GenericButton>
          <GenericButton
            className="rounded-none border-l-0 border border-gray-300"
            variant="ghost"
            size="sm"
            onClick={() => handleClick(page - 1)}
          >
            {page <= 1 ? "-" : page - 1}
          </GenericButton>
          <GenericButton
            aria-current="page"
            className="z-10 rounded-none border-l-0 border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
            variant="ghost"
            size="sm"
            onClick={() => handleClick(page)}
          >
            {page}
          </GenericButton>
          <GenericButton
            className="rounded-none border-l-0 border border-gray-300"
            variant="ghost"
            size="sm"
            onClick={() => handleClick(page + 1)}
          >
            {page === totalPages ? "-" : page + 1}
          </GenericButton>
          <GenericButton
            className="rounded-r-lg rounded-l-none border-l-0 border border-gray-300"
            variant="ghost"
            size="sm"
            onClick={() => handleClick(page + 5)}
          >
            {">>"}
          </GenericButton>
        </div>
      </span>
    </nav>
  );
}
