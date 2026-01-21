export const apiErrorMessage = (status) => {
  if (status === 401) return "errors.api401";
  if (status === 403) return "errors.api403";
  if (status === 404) return "errors.api404";
  if (status === 500) return "errors.api500";
  return "errors.apiUnknown";
};
