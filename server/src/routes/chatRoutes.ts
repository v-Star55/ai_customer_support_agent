import { Router } from "express";
import chatHistory from "./chatRoutes/chatHistory.js";
import chatStream from "./chatRoutes/chatStream.js";
import newChat from "./chatRoutes/newChat.js";

const router = Router();

router.use("/history", chatHistory);
router.use("/stream", chatStream);
router.use("/new", newChat);



export default router;