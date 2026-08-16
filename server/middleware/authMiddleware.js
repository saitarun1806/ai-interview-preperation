import { auth } from "../config/firebaseAdmin.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided."
            });
        }

        const idToken = authHeader.split(" ")[1];

        const decodedToken = await auth.verifyIdToken(idToken);

        req.user = decodedToken;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

export default authMiddleware;