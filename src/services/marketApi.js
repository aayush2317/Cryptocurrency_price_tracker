const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getCoins(signal) {
  if (!BASE_URL) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(
    `${BASE_URL}/api/coins`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch coins: ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.coins)) {
    throw new Error("Invalid API response");
  }

  return data.coins;
}