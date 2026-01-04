// Configuration management using Vite environment variables
const getEnv = (key) => {
    try {
        return import.meta.env[key];
    } catch (e) {
        return null;
    }
};

export const CONFIG = {
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
};
