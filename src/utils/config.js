// Configuration management using Vite environment variables
const getEnv = (key) => {
    try {
        return import.meta.env[key];
    } catch (e) {
        return null;
    }
};

export const CONFIG = {
    GOOGLE_CLIENT_ID: getEnv('VITE_GOOGLE_CLIENT_ID') || "your-google-client-id-here.apps.googleusercontent.com"
};
