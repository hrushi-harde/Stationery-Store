import { data as productData, NewProductData } from "../Data/ProductData";
import Store from "../redux/Store";
import { logout, updateSession } from "../redux/Slices/AuthSlice";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_API_BASE_URL ||
  "";

const API_ORIGIN = (() => {
  if (!API_BASE) return "";
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
})();

const cache = new Map();
const CONTACT_STORAGE_KEY = "stationery-store-contact-requests";
let refreshInFlight = null;

const buildRequestError = (message, status) => {
  const error = new Error(message || "Request failed");
  error.status = status;
  return error;
};

const refreshAccessToken = async () => {
  if (!refreshInFlight) {
    refreshInFlight = refreshAuthToken()
      .then((session) => {
        Store.dispatch(updateSession(session));
        return session.accessToken;
      })
      .catch((error) => {
        Store.dispatch(logout());
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
};

const resolveProductImageUrl = (imageUrl) => {
  if (!imageUrl) return imageUrl;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  const normalizedPath = String(imageUrl).replace(/\\/g, "/");

  if (!API_ORIGIN) return normalizedPath;

  // Uploaded assets are served by backend static files.
  if (normalizedPath.startsWith("/uploads/")) {
    return `${API_ORIGIN}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("uploads/")) {
    return `${API_ORIGIN}/${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/api/v1/uploads/")) {
    return `${API_ORIGIN}${normalizedPath.replace("/api/v1", "")}`;
  }

  return normalizedPath;
};

const invalidateProductsCache = () => {
  for (const cacheKey of cache.keys()) {
    if (cacheKey.includes('"type":"products"')) {
      cache.delete(cacheKey);
    }
  }
};

const normalizeProduct = (item) => {
  const rawImage = item.image_url || item.image || item.pimage;

  return {
    id: item.id,
    name: item.name || item.pname || item.title,
    price: item.price,
    offerPrice: item.offerPrice ?? item.offer_price ?? item.price,
    category: item.category,
    description: item.description,
    isActive:
      item.isActive ?? (item.is_active === 1 || item.is_active === true),
    image: resolveProductImageUrl(rawImage),
    image_url: rawImage,
    popularity: item.popularity ?? item.id,
  };
};

const readLocalContactRequests = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CONTACT_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : [];
  } catch {
    return [];
  }
};

const writeLocalContactRequests = (requests) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(requests));
};

const normalizeContactRequest = (item) => ({
  id: item.id,
  name: item.name,
  email: item.email,
  subject: item.subject || "",
  message: item.message,
  status: item.status || "under_review",
  createdAt: item.created_at || item.createdAt || new Date().toISOString(),
});

const getAllMockProducts = () => {
  const base = productData.map(normalizeProduct);
  const newItems = NewProductData.map(normalizeProduct);
  return [...newItems, ...base];
};

const requestJson = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: options.credentials || "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = "Request failed";
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = await response.json();
      if (typeof payload?.detail === "string") {
        message = payload.detail;
      } else if (Array.isArray(payload?.detail) && payload.detail[0]?.msg) {
        message = payload.detail[0].msg;
      }
    } else {
      const text = await response.text();
      if (text) message = text;
    }

    throw buildRequestError(message, response.status);
  }

  return response.json();
};

const requestAuthedJson = async (
  endpoint,
  accessToken,
  options = {},
  retryOnAuthFailure = true
) => {
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    return await requestJson(endpoint, {
      ...options,
      headers,
    });
  } catch (error) {
    if (retryOnAuthFailure && error?.status === 401) {
      const nextAccessToken = await refreshAccessToken();
      return requestAuthedJson(endpoint, nextAccessToken, options, false);
    }
    throw error;
  }
};

const normalizeAuthSession = (payload) => ({
  user: payload.user,
  accessToken: payload.access_token,
  tokenType: payload.token_type || "bearer",
  expiresIn: payload.expires_in || 0,
  issuedAt: Date.now(),
});

const tryRequestJson = async (endpoint, options = {}) => {
  try {
    return await requestJson(endpoint, options);
  } catch (error) {
    return null;
  }
};

export const getProducts = async (params = {}) => {
  const cacheKey = JSON.stringify({ type: "products", params, API_BASE });
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  if (API_BASE) {
    const payload = await tryRequestJson("/products", {
      method: "POST",
      body: JSON.stringify(params),
    });
    if (payload) {
      const normalizedPayload = {
        ...payload,
        items: Array.isArray(payload.items)
          ? payload.items.map(normalizeProduct)
          : [],
      };
      cache.set(cacheKey, normalizedPayload);
      return normalizedPayload;
    }
  }

  const items = getAllMockProducts();
  const payload = { items, total: items.length };
  cache.set(cacheKey, payload);
  return payload;
};

export const getProductById = async (id) => {
  if (API_BASE) {
    const payload = await tryRequestJson(`/products/${id}`);
    if (payload) return normalizeProduct(payload);
  }

  const items = getAllMockProducts();
  return items.find((item) => item.id === Number(id));
};

export const getOwnerProducts = async (accessToken) => {
  if (API_BASE) {
    const payload = await requestAuthedJson("/products/admin", accessToken);
    return {
      ...payload,
      items: Array.isArray(payload.items)
        ? payload.items.map(normalizeProduct)
        : [],
    };
  }

  const items = getAllMockProducts();
  return { items, total: items.length };
};

export const searchProducts = async (query, options = {}) => {
  if (API_BASE) {
    const payload = await requestJson("/ai/search", {
      method: "POST",
      body: JSON.stringify({ query, ...options }),
    });

    return {
      ...payload,
      items: Array.isArray(payload.items)
        ? payload.items.map(normalizeProduct)
        : [],
    };
  }

  const term = query.trim().toLowerCase();
  if (!term) {
    const items = getAllMockProducts();
    return { items, total: items.length };
  }

  const items = getAllMockProducts().filter((item) =>
    [item.name, item.category, item.description]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );

  return { items, total: items.length };
};

export const getRecommendations = async (productId) => {
  if (API_BASE) {
    const payload = await requestJson("/ai/recommendations", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    });

    if (Array.isArray(payload?.items)) {
      return {
        ...payload,
        items: payload.items.map(normalizeProduct),
      };
    }

    if (Array.isArray(payload)) {
      return payload.map(normalizeProduct);
    }

    return { items: [] };
  }

  const items = getAllMockProducts();
  const current = items.find((item) => item.id === Number(productId));
  if (!current) return [];

  return items
    .filter((item) => item.category === current.category && item.id !== current.id)
    .slice(0, 4);
};

export const submitContactRequest = async (payload) => {
  if (API_BASE) {
    const response = await requestJson("/contact-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeContactRequest(response);
  }

  const localRequest = {
    id: `local_${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
  };
  const nextRequests = [localRequest, ...readLocalContactRequests()];
  writeLocalContactRequests(nextRequests);
  return normalizeContactRequest(localRequest);
};

export const getContactRequests = async (accessToken, page = 1, limit = 5) => {
  if (API_BASE) {
    const payload = await requestAuthedJson(
      `/contact-requests/admin?page=${page}&limit=${limit}`,
      accessToken
    );
    return {
      ...payload,
      items: Array.isArray(payload.items)
        ? payload.items.map(normalizeContactRequest)
        : [],
      status_counts: payload.status_counts || {},
      page: payload.page || 1,
      limit: payload.limit || 5,
      total_pages: payload.total_pages || 1,
    };
  }

  const items = readLocalContactRequests().map(normalizeContactRequest);
  return { 
    items, 
    total: items.length,
    status_counts: {
      under_review: 0,
      received: 0,
      ignored: 0,
    },
    page: 1,
    limit: 5,
    total_pages: 1
  };
};

export const updateContactStatus = async (messageId, status, accessToken) => {
  if (API_BASE) {
    return requestAuthedJson(
      `/contact-requests/${messageId}/status`,
      accessToken,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }
    );
  }
  return null;
};

export const deleteContactRequest = async (messageId, accessToken) => {
  if (API_BASE) {
    return requestAuthedJson(
      `/contact-requests/${messageId}`,
      accessToken,
      {
        method: "DELETE",
      }
    );
  }
  return null;
};

export const createOrder = async (payload) => {
  if (API_BASE) {
    const response = await tryRequestJson("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (response) return response;
  }

  return {
    id: `order_${Date.now()}`,
    status: "created",
    ...payload,
  };
};

export const chatWithAi = async (message, context = {}) => {
  if (API_BASE) {
    return requestJson("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, ...context }),
    });
  }

  return {
    reply:
      "Thanks for reaching out! Our AI assistant will respond with tailored stationery picks once the backend is connected.",
  };
};

export const registerUser = async (payload) => {
  if (API_BASE) {
    const response = await requestJson("/auth/register", {
      method: "POST",
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return normalizeAuthSession(response);
  }

  return {
    user: {
      id: `local_${Date.now()}`,
      name: payload.name,
      email: payload.email,
    },
    accessToken: "local-access-token",
    tokenType: "bearer",
    expiresIn: 900,
    issuedAt: Date.now(),
  };
};

export const loginUser = async (payload) => {
  if (API_BASE) {
    const response = await requestJson("/auth/login", {
      method: "POST",
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return normalizeAuthSession(response);
  }

  const name = payload.email.split("@")[0];
  return {
    user: {
      id: `local_${Date.now()}`,
      name,
      email: payload.email,
    },
    accessToken: "local-access-token",
    tokenType: "bearer",
    expiresIn: 900,
    issuedAt: Date.now(),
  };
};

export const refreshAuthToken = async () => {
  if (!API_BASE) {
    return {
      accessToken: "local-access-token",
      tokenType: "bearer",
      expiresIn: 900,
      issuedAt: Date.now(),
      user: null,
    };
  }

  const response = await requestJson("/auth/refresh", {
    method: "POST",
  });

  return normalizeAuthSession(response);
};

export const getCurrentUser = async (accessToken) => {
  if (!API_BASE) return null;

  return requestJson("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const logoutUser = async () => {
  if (!API_BASE) return { status: "ok" };

  // Logout reads/clears cookie server-side; request includes credentials by default
  return requestJson("/auth/logout", {
    method: "POST",
  });
};

export const createProduct = async (payload, accessToken) => {
  if (!API_BASE) {
    invalidateProductsCache();
    return {
      id: `local_${Date.now()}`,
      ...payload,
      isActive: payload.is_active ?? true,
    };
  }

  const created = await requestAuthedJson("/products/admin", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateProductsCache();
  return created;
};

export const updateProduct = async (productId, payload, accessToken) => {
  if (!API_BASE) {
    invalidateProductsCache();
    return {
      id: productId,
      ...payload,
      isActive: payload.is_active ?? true,
    };
  }

  const updated = await requestAuthedJson(`/products/admin/${productId}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  invalidateProductsCache();
  return updated;
};

export const uploadProductImage = async (file, accessToken, options = {}) => {
  if (!file) {
    throw new Error("Please select an image file.");
  }

  if (!API_BASE) {
    return {
      image_url: URL.createObjectURL(file),
    };
  }

  const uploadWithToken = (token) => {
    const formData = new FormData();
    formData.append("file", file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/products/admin/upload-image`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (typeof options.onProgress === "function" && event.lengthComputable) {
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        const contentType = xhr.getResponseHeader("content-type") || "";
        const isJson = contentType.includes("application/json");
        let responsePayload = null;

        if (isJson) {
          try {
            responsePayload = JSON.parse(xhr.responseText || "{}");
          } catch {
            responsePayload = null;
          }
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responsePayload);
          return;
        }

        const message =
          responsePayload?.detail ||
          responsePayload?.message ||
          "Image upload failed";
        reject(buildRequestError(message, xhr.status));
      };

      xhr.onerror = () => reject(buildRequestError("Image upload failed", 0));
      xhr.send(formData);
    });
  };

  try {
    return await uploadWithToken(accessToken);
  } catch (error) {
    if (error?.status === 401) {
      const nextAccessToken = await refreshAccessToken();
      return uploadWithToken(nextAccessToken);
    }
    throw error;
  }
};
