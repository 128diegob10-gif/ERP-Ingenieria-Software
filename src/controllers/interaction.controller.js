const service = require('../services/interaction.service');

exports.createInteraction = async (req, res) => {
    try {
        const result = await service.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getByClient = async (req, res) => {
    const data = await service.getByClient(req.params.codigoCliente);
    res.json(data);
};

exports.getAll = async (req, res) => {
    const data = await service.getAll();
    res.json(data);
};