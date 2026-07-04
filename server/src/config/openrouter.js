import axios from "axios";

const openRouter = axios.create({
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
        "Content-Type": "application/json"
    }
});

// Use an interceptor to ensure process.env is read at request time,
// which prevents issues if this module is imported before dotenv.config() runs.
openRouter.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY}`;
    return config;
});

export default openRouter;