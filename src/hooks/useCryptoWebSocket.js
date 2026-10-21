
import { useEffect, useState } from "react";

export default function useCryptoWebSocket() {
  const [livePrices, setLivePrices] = useState({});

  useEffect(() => {
    const url =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.DEV ? "ws://localhost:8080" : "");

    if (!url) return;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WebSocket connected!");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type === "price_update" &&
          ["bitcoin", "ethereum", "solana"].includes(data.coinId) &&
          typeof data.price === "number" &&
          Number.isFinite(data.price) &&
          data.price > 0
        ) {
          setLivePrices((previous) => ({
            ...previous,
            [data.coinId]: data.price,
          }));
        }
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    ws.onerror = () => {
      console.error("WebSocket error!");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected!");
    };

    return () => {
      ws.close();
    };
  }, []);

  return livePrices;
}
