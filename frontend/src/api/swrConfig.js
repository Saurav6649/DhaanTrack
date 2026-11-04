import { api } from './client.js';

export const swrFetcher = async (url) => {
  const res = await api.get(url);
  return res.data?.data || res.data;
};

export const swrConfig = {
  fetcher: swrFetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  dedupingInterval: 2000,
};
