
const { WebSocketServer, WebSocket } = require("ws");

const wss = new WebSocketServer({ port: 8080 });

const initialPrices = {
  bitcoin: 67432.80,
  ethereum: 3521.64,
  solana: 172.86,
};

wss.on("connection", (ws) => {
  console.log("Client connected!");

  const prices = { ...initialPrices };

  const interval = setInterval(() => {
    for (const coinId of Object.keys(prices)) {
      const change = (Math.random() - 0.5) * 0.002;

      prices[coinId] = Number(
        (prices[coinId] * (1 + change)).toFixed(2)
      );

      const message = {
        type: "price_update",
        coinId: coinId,
        price: prices[coinId],
        timestamp: Date.now(),
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }, 2000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected!");
  });
});

console.log("Mock WebSocket running at ws://localhost:8080");
