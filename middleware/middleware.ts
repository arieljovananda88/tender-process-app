const jwt = require('jsonwebtoken');

export default function authenticateToken(req, res, next) {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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