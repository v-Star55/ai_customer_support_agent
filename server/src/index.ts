import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import route from "./routes/route.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// routes

app.use("/api", route)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});