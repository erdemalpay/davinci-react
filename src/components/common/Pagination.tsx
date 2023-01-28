import React from "react";

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
          <button
            className="block py-2 px-3 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            onClick={() => handleClick(page - 5)}
          >
            {"<<"}
          </button>
          <button
            className="py-2 px-3 text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800"
            onClick={() => handleClick(page - 1)}
          >
            {page <= 1 ? "-" : page - 1}
          </button>
          <button
            aria-current="page"
            className="z-10 py-2 px-3 text-blue-600 bg-blue-50 border border-blue-300 hover:bg-blue-100 hover:text-blue-700"
            onClick={() => handleClick(page)}
          >
            {page}
          </button>
          <button
            className="py-2 px-3 text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            onClick={() => handleClick(page + 1)}
          >
            {page === totalPages ? "-" : page + 1}
          </button>
          <button
            className="block py-2 px-3 text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
            onClick={() => handleClick(page + 5)}
          >
            {">>"}
          </button>
        </div>
      </span>
    </nav>
  );
}
