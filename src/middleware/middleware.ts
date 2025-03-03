import jsonwebtoken from "jsonwebtoken";

export default function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            isSuccess: false,
            messages: ["Access denied. No token provided."],
            data: []
        });
    }

    try {
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET || "secret");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ // Changed to 403 Forbidden for invalid tokens
            isSuccess: false,
            messages: ["Invalid or expired token"],
            data: []
        });
    }
}