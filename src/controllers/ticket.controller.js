const service = require('../services/ticket.service');

exports.createTicket = async (req, res) => {
    try {
        const result = await service.createTicket(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTicketsByClient = async (req, res) => {
    try {
        const data = await service.getTicketsByClient(req.query.codigo_cliente);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTicketDetail = async (req, res) => {
    try {
        const data = await service.getTicketDetail(req.params.id);
        res.json(data);
    } catch (error) {
        const status = error.message === 'Ticket no encontrado' ? 404 : 400;
        res.status(status).json({ error: error.message });
    }
};
