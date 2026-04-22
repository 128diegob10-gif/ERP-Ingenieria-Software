const service = require('../services/users.service');

exports.getUsers = async (req, res) => {
    try {
        const data = await service.getUsers();
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const result = await service.createUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const result = await service.updateUser(req.params.id, req.body, req.user?.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const result = await service.deleteUser(req.params.id, req.user?.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
