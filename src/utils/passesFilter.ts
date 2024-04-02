export const passesFilter = (filterValue: any, itemValue: any) => {
  return filterValue === "" || itemValue === filterValue;
};
