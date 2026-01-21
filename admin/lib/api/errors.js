export const apiErrorMessage = (status) => {
  if (status === 401) return "401: нет авторизации";
  if (status === 403) return "403: недостаточно прав";
  if (status === 404) return "404: не найдено";
  if (status === 500) return "500: ошибка сервера";
  return "Неизвестная ошибка";
};
