const service = require('../services/auth.service');

exports.login = async (req, res) => {
    try {
        const correo = String(req.body?.correo || '').trim();
        const password = String(req.body?.password || '');

        if (!correo || !password) {
            return res.status(400).json({
                error: 'Correo y contraseña son obligatorios'
            });
        }

        const result = await service.validateCredentials(correo, password);

        if (!result.ok) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        return res.json({
            token: result.token,
            user: result.user,
            elapsed_ms: result.elapsed_ms
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

exports.me = (req, res) => {
    return res.json({ user: req.user });
};
