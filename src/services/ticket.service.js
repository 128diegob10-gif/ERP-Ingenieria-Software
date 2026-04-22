const db = require('../config/database');

const TICKET_STATES = ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
const TICKET_PRIORITIES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];

async function ensureTicketsTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS tickets_soporte (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cliente_id INT NULL,
            codigo_cliente VARCHAR(100) NOT NULL,
            titulo VARCHAR(255) NOT NULL,
            descripcion TEXT NULL,
            estado VARCHAR(40) NOT NULL DEFAULT 'ABIERTO',
            prioridad VARCHAR(40) NOT NULL DEFAULT 'MEDIA',
            fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_ticket_codigo_cliente (codigo_cliente),
            INDEX idx_ticket_estado (estado),
            INDEX idx_ticket_prioridad (prioridad),
            INDEX idx_ticket_fecha (fecha_creacion)
        )
    `;

    await db.execute(sql);
}

function normalizeState(value) {
    const state = String(value || '').trim().toUpperCase();
    if (!state) {
        return 'ABIERTO';
    }

    return TICKET_STATES.includes(state) ? state : 'ABIERTO';
}

function normalizePriority(value) {
    const priority = String(value || '').trim().toUpperCase();
    if (!priority) {
        return 'MEDIA';
    }

    return TICKET_PRIORITIES.includes(priority) ? priority : 'MEDIA';
}

exports.createTicket = async (data) => {
    await ensureTicketsTable();

    const codigoCliente = String(data.codigo_cliente || '').trim();
    const titulo = String(data.titulo || '').trim();
    const descripcion = String(data.descripcion || '').trim();
    const estado = normalizeState(data.estado);
    const prioridad = normalizePriority(data.prioridad);
    const clienteId = Number(data.cliente_id);

    if (!codigoCliente) {
        throw new Error('El código de cliente es obligatorio');
    }

    if (!titulo) {
        throw new Error('El título del ticket es obligatorio');
    }

    const sql = `
        INSERT INTO tickets_soporte (
            cliente_id,
            codigo_cliente,
            titulo,
            descripcion,
            estado,
            prioridad,
            fecha_creacion,
            fecha_actualizacion
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await db.execute(sql, [
        Number.isInteger(clienteId) && clienteId > 0 ? clienteId : null,
        codigoCliente,
        titulo,
        descripcion || null,
        estado,
        prioridad
    ]);

    return {
        message: 'Ticket creado correctamente',
        id: result.insertId
    };
};

exports.getTicketsByClient = async (codigoCliente) => {
    await ensureTicketsTable();

    const codigo = String(codigoCliente || '').trim();
    if (!codigo) {
        throw new Error('Debe indicar el código de cliente');
    }

    const [rows] = await db.execute(
        `
            SELECT
                id,
                codigo_cliente,
                titulo,
                estado,
                prioridad,
                fecha_creacion
            FROM tickets_soporte
            WHERE codigo_cliente = ?
            ORDER BY fecha_creacion DESC
            LIMIT 200
        `,
        [codigo]
    );

    return rows.map((row) => ({
        ...row,
        estado: normalizeState(row.estado),
        prioridad: normalizePriority(row.prioridad)
    }));
};

exports.getTicketDetail = async (ticketId) => {
    await ensureTicketsTable();

    const id = Number(ticketId);
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Id de ticket inválido');
    }

    const [rows] = await db.execute(
        `
            SELECT
                id,
                cliente_id,
                codigo_cliente,
                titulo,
                descripcion,
                estado,
                prioridad,
                fecha_creacion,
                fecha_actualizacion
            FROM tickets_soporte
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    );

    if (rows.length === 0) {
        throw new Error('Ticket no encontrado');
    }

    const ticket = rows[0];
    return {
        ...ticket,
        estado: normalizeState(ticket.estado),
        prioridad: normalizePriority(ticket.prioridad)
    };
};
