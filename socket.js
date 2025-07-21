// socket.js
import { io } from "socket.io-client";

const socket = io("https://d6elp5bdgrgthejqpor3ihwnsu.srv.us", {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export default socket;
