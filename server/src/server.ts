import app from "./app.js";
import { connectDB } from "./configs/db.js";

const PORT = process.env.PORT

async function startServer() {
    try {
        connectDB()

        app.listen(PORT, () => {
            console.log("server is running on port:", PORT);
        })
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

startServer()