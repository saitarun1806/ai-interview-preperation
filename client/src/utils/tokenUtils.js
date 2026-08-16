export const isTokenValid = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return false;
    }

    try {
        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        if (!payload.exp) {
            return false;
        }

        const currentTime = Math.floor(
            Date.now() / 1000
        );

        return payload.exp > currentTime;

    } catch {
        return false;
    }
};