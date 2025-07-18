// socket.js
import { io } from "socket.io-client";

const socket = io("https://d6elp5bdgrgthejqpor3ihwnsu.srv.us", {
  autoConnect: false, // 👈 prevents auto connection
});

export default socket;
