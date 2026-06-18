import { Router } from "express";
import chatRoute from "./chatRoutes.js";
const router = Router();

router.get("/", (req,res) => {
    res.send("Hello World!");
})

router.use("/chat", chatRoute);

export default router;

