import { useGeneralContext } from "./../context/General.context";

export const resetGeneralContext = () => {
  const { setCurrentPage, setRowsPerPage, setSearchQuery } =
    useGeneralContext();
  setCurrentPage(1);
  // setRowsPerPage(RowPerPageEnum.FIRST);
  setSearchQuery("");
};
