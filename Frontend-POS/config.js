export const CONFIG = {
  API_BASE_URL: "https://pos-os-system-1.onrender.com/api",

  REQUEST_TIMEOUT: 10000,
  AUTO_REFRESH_INTERVAL: 10000,
  SERVER_STATUS_CHECK_INTERVAL: 5000,
  MAX_RECENT_ORDERS: 10,
  NOTIFICATION_DURATION: 3000,

  STAFF_ID_FORMAT: {
    minLength: 3,
    maxLength: 10,
    pattern: /^[A-Z0-9]+$/,
  },

  ORDER_STATUSES: {
    PENDING: "pending",
    PREPARING: "preparing",
    READY: "ready",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  },

  PAYMENT_METHODS: {
    CASH: "cash",
    GCASH: "gcash",
  },

  PAYMENT_STATUS: {
    PENDING: "pending",
    PAID: "paid",
    REFUNDED: "refunded",
  },

  ENDPOINTS: {
    GET_ORDERS: "/getorder",
    GET_ORDER_BY_ID: "/search/:code",
    UPDATE_ORDER: "/:id",
    CREATE_ORDER: "/order",
    DELETE_ORDER: "/:id",

    SEARCH_BY_CODE: "/order/search/:code",

    // ✅ matches your backend
    STAFF_LOGIN: "/auth/login",

    PING: "/ping",
  },
};

export function getApiUrl(endpoint, params = {}) {
  let url = CONFIG.API_BASE_URL + endpoint;

  Object.keys(params).forEach((key) => {
    url = url.replace(`:${key}`, encodeURIComponent(params[key]));
  });

  return url;
}

function getToken() {
  return localStorage.getItem("pos_token");
}

// optional timeout support
function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = CONFIG.REQUEST_TIMEOUT,
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

export async function apiCall(endpoint, options = {}) {
  const url = getApiUrl(endpoint, options.params);

  const token = getToken();

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  // merge headers correctly
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetchWithTimeout(url, finalOptions);

    if (!response.ok) {
      // try to read backend message
      let msg = `HTTP Error: ${response.status}`;
      try {
        const errData = await response.json();
        msg = errData.message || msg;
      } catch {}
      throw new Error(msg);
    }

    return await response.json();
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
}
