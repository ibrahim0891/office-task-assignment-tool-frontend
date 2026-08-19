export const APP_CONFIG = {
    API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    MAX_TASK_TITLE_LENGTH: parseInt(process.env.NEXT_PUBLIC_MAX_TASK_TITLE_LENGTH || "300", 10),
};
