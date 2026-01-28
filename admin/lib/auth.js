let accessToken = null;
let authUser = null;
let refreshHandler = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const setAuthUser = (user) => {
  authUser = user;
};

export const getAuthUser = () => authUser;

export const setRefreshHandler = (handler) => {
  refreshHandler = handler;
};

export const getRefreshHandler = () => refreshHandler;
