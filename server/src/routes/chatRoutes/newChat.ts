import { Router } from "express";
import { redis } from "../../lib/redis.js";
import { prisma } from "../../lib/prisma.js";
import { nanoid } from "nanoid";

const router = Router()

router.post("/", async (req, res) => {
    const sessionId = req.cookies.chat_sessionId;
    console.log('session id ', sessionId);
    if(sessionId){
        await redis.del(`session:${sessionId}`);
    }
    
    res.clearCookie("chat_sessionId");
    
    return res.status(200).json({ success: true });
})  


export default router;
