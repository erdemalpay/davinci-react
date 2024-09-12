export const getItem = <T extends { _id: any }>(
  _id: any,
  items: T[]
): T | undefined => {
  return items?.find((item: T) => item?._id === _id);
};
