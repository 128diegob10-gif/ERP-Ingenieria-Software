const jwt = require('jsonwebtoken');

function getJwtSecret() {
    return process.env.JWT_SECRET || 'jwt_secret_key-erp-ventas';
}

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const payload = jwt.verify(token, getJwtSecret());
        req.user = {
            id: payload.sub,
            correo: payload.correo,
            nombre: payload.nombre,
            rol: payload.rol
        };
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }
}

function authorizeRoles(...roles) {
    const normalizedRoles = roles.map((role) => String(role || '').toLowerCase());

    return (req, res, next) => {
        const userRole = String(req.user?.rol || '').toLowerCase();

        if (!userRole) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        if (normalizedRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({ error: 'No tiene permisos para esta operación' });
    };
}

module.exports = {
    authenticate,
    authorizeRoles,
    getJwtSecret
};
