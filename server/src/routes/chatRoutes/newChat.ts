import { Router } from "express";
import { redis } from "../../lib/redis.js";


const router = Router()

router.post("/", async (req, res) => {
    const sessionId = req.body.sessionId || req.query.sessionId || req.cookies.chat_sessionId;
    console.log('session id ', sessionId);
    if (sessionId) {
        try {
            await redis.del(`session:${sessionId}`);
        } catch (redisError) {
            console.warn("Redis delete error in newChat:", redisError);
        }
    }

    res.clearCookie("chat_sessionId", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });

    return res.status(200).json({ success: true });
})


export default router;
