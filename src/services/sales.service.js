const db = require('../config/database');

async function hasTable(tableName) {
    const sql = `
        SELECT 1
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        LIMIT 1
    `;

    const [rows] = await db.execute(sql, [tableName]);
    return rows.length > 0;
}

async function getTableColumns(tableName) {
    const sql = `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
    `;

    const [rows] = await db.execute(sql, [tableName]);
    return rows.map((row) => row.COLUMN_NAME);
}

async function hasColumn(tableName, columnName) {
    const sql = `
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
    `;

    const [rows] = await db.execute(sql, [tableName, columnName]);
    return rows.length > 0;
}

exports.getClients = async () => {
    const hasClientesTable = await hasTable('clientes');

    if (hasClientesTable) {
        const columns = await getTableColumns('clientes');

        const idColumn = columns.find((column) => ['cliente_id', 'id_cliente', 'id'].includes(column));
        const codigoColumn = columns.find((column) => ['codigo_cliente', 'codigo', 'cod_cliente'].includes(column));

        if (codigoColumn) {
            const sql = `
                SELECT
                    *,
                    \`${codigoColumn}\` AS codigo_cliente
                FROM clientes
                WHERE \`${codigoColumn}\` IS NOT NULL
                  AND \`${codigoColumn}\` <> ''
                ORDER BY \`${codigoColumn}\` ASC
            `;

            const [rowsFromClientes] = await db.execute(sql);
            if (rowsFromClientes.length > 0) {
                return rowsFromClientes;
            }
        }

        if (idColumn) {
            const sql = `
                SELECT
                    *,
                    CAST(\`${idColumn}\` AS CHAR) AS codigo_cliente,
                    \`${idColumn}\` AS cliente_id
                FROM clientes
                WHERE \`${idColumn}\` IS NOT NULL
                ORDER BY \`${idColumn}\` ASC
            `;

            const [rowsFromClientes] = await db.execute(sql);
            if (rowsFromClientes.length > 0) {
                return rowsFromClientes;
            }
        }
    }

    const hasCodigoCliente = await hasColumn('ventas', 'codigo_cliente');
    const hasClienteId = await hasColumn('ventas', 'cliente_id');

    const sql = hasCodigoCliente
        ? `
            SELECT DISTINCT
                codigo_cliente
            FROM ventas
            WHERE codigo_cliente IS NOT NULL
              AND codigo_cliente <> ''
            ORDER BY codigo_cliente ASC
        `
        : hasClienteId
            ? `
                SELECT DISTINCT
                    CAST(cliente_id AS CHAR) AS codigo_cliente,
                    cliente_id
                FROM ventas
                WHERE cliente_id IS NOT NULL
                ORDER BY cliente_id ASC
            `
            : `SELECT '' AS codigo_cliente WHERE 1 = 0`;

    const [rows] = await db.execute(sql);
    return rows;
};

function findColumn(columns, candidates) {
    return columns.find((column) => candidates.includes(column));
}

function buildClientCodeCandidate() {
    const timestampPart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.floor(Math.random() * 1679616)
        .toString(36)
        .toUpperCase()
        .padStart(4, '0');

    return `CLI-${timestampPart}-${randomPart}`;
}

async function generateUniqueClientCode(codeColumn, maxAttempts = 12) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const candidate = buildClientCodeCandidate();
        const sql = `
            SELECT 1
            FROM clientes
            WHERE \`${codeColumn}\` = ?
            LIMIT 1
        `;

        const [rows] = await db.execute(sql, [candidate]);
        if (rows.length === 0) {
            return candidate;
        }
    }

    throw new Error('No se pudo generar un código de cliente único');
}

function buildClientReferenceFilter(ref, idColumn, codeColumn) {
    if (!idColumn && !codeColumn) {
        throw new Error('No se encontró columna de identificación en clientes');
    }

    let whereSql = '';
    const whereParams = [];

    if (idColumn && /^\d+$/.test(ref)) {
        whereSql += `\`${idColumn}\` = ?`;
        whereParams.push(Number(ref));

        if (codeColumn) {
            whereSql += ` OR \`${codeColumn}\` = ?`;
            whereParams.push(ref);
        }
    } else if (codeColumn) {
        whereSql += `\`${codeColumn}\` = ?`;
        whereParams.push(ref);
    } else {
        throw new Error('Referencia inválida para identificar cliente');
    }

    return { whereSql, whereParams };
}

exports.searchClients = async (rawQuery, limit = 20) => {
    const query = String(rawQuery || '').trim();
    if (!query) {
        return [];
    }

    const maxLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 50) : 20;
    const columns = await getTableColumns('clientes');

    const idColumn = findColumn(columns, ['id', 'cliente_id', 'id_cliente']);
    const codeColumn = findColumn(columns, ['codigo_cliente', 'codigo', 'cod_cliente']);
    const nameColumn = findColumn(columns, ['nombre', 'nombres', 'nombre_cliente', 'razon_social']);
    const emailColumn = findColumn(columns, ['correo', 'email', 'mail', 'correo_electronico']);
    const phoneColumn = findColumn(columns, ['numero', 'telefono', 'celular', 'telefono_movil', 'telefono1']);
    const addressColumn = findColumn(columns, ['direccion', 'domicilio', 'direccion_fiscal']);
    const nitColumn = findColumn(columns, ['nit', 'nit_cliente', 'ruc', 'tax_id']);

    const whereClauses = [];
    const params = [];

    if (nameColumn) {
        whereClauses.push(`\`${nameColumn}\` LIKE ?`);
        params.push(`%${query}%`);
    }

    if (emailColumn) {
        whereClauses.push(`\`${emailColumn}\` LIKE ?`);
        params.push(`%${query}%`);
    }

    if (phoneColumn) {
        whereClauses.push(`CAST(\`${phoneColumn}\` AS CHAR) LIKE ?`);
        params.push(`%${query}%`);
    }

    if (nitColumn) {
        whereClauses.push(`CAST(\`${nitColumn}\` AS CHAR) LIKE ?`);
        params.push(`%${query}%`);
    }

    if (whereClauses.length === 0) {
        return [];
    }

    const selectColumns = [];
    if (idColumn) selectColumns.push(`\`${idColumn}\` AS cliente_id`);
    if (codeColumn) selectColumns.push(`\`${codeColumn}\` AS codigo_cliente`);
    if (nameColumn) selectColumns.push(`\`${nameColumn}\` AS nombre`);
    if (emailColumn) selectColumns.push(`\`${emailColumn}\` AS correo`);
    if (phoneColumn) selectColumns.push(`\`${phoneColumn}\` AS numero`);
    if (addressColumn) selectColumns.push(`\`${addressColumn}\` AS direccion`);
    if (nitColumn) selectColumns.push(`\`${nitColumn}\` AS nit`);

    if (selectColumns.length === 0) {
        return [];
    }

    let orderBy = '1 ASC';
    if (nameColumn) {
        orderBy = 'nombre ASC';
    } else if (codeColumn) {
        orderBy = 'codigo_cliente ASC';
    }

    const sql = `
        SELECT
            ${selectColumns.join(',\n            ')}
        FROM clientes
        WHERE ${whereClauses.join(' OR ')}
        ORDER BY ${orderBy}
        LIMIT ${maxLimit}
    `;

    const [rows] = await db.query(sql, params);
    return rows;
};

exports.getClientDetail = async (clientRef) => {
    const ref = String(clientRef || '').trim();
    if (!ref) {
        throw new Error('Debe enviar una referencia de cliente');
    }

    const columns = await getTableColumns('clientes');
    const idColumn = findColumn(columns, ['id', 'cliente_id', 'id_cliente']);
    const codeColumn = findColumn(columns, ['codigo_cliente', 'codigo', 'cod_cliente']);

    const filter = buildClientReferenceFilter(ref, idColumn, codeColumn);
    const sql = `SELECT * FROM clientes WHERE ${filter.whereSql} LIMIT 1`;

    const [rows] = await db.execute(sql, filter.whereParams);
    if (rows.length === 0) {
        throw new Error('Cliente no encontrado');
    }

    return rows[0];
};

exports.createClient = async (data) => {
    const columns = await getTableColumns('clientes');

    const codeColumn = findColumn(columns, ['codigo_cliente', 'codigo', 'cod_cliente']);
    const nameColumn = findColumn(columns, ['nombre', 'nombres', 'nombre_cliente', 'razon_social']);
    const emailColumn = findColumn(columns, ['correo', 'email', 'mail', 'correo_electronico']);
    const phoneColumn = findColumn(columns, ['numero', 'telefono', 'celular', 'telefono_movil', 'telefono1']);
    const addressColumn = findColumn(columns, ['direccion', 'domicilio', 'direccion_fiscal']);
    const nitColumn = findColumn(columns, ['nit', 'nit_cliente', 'ruc', 'tax_id']);

    if (!nameColumn && !emailColumn && !phoneColumn && !addressColumn && !nitColumn && !codeColumn) {
        throw new Error('La tabla clientes no tiene columnas compatibles para registro');
    }

    const nombre = String(data.nombre || '').trim();
    const correo = String(data.correo || '').trim();
    const numero = String(data.numero || '').trim();
    const direccion = String(data.direccion || '').trim();
    const nit = String(data.nit || '').trim();

    if (!nombre && !correo && !numero && !direccion && !nit) {
        throw new Error('Debe ingresar al menos nombre, correo, número, dirección o NIT');
    }

    const insertColumns = [];
    const values = [];
    const baseParams = [];

    if (nameColumn && nombre) {
        insertColumns.push(`\`${nameColumn}\``);
        values.push('?');
        baseParams.push(nombre);
    }

    if (emailColumn && correo) {
        insertColumns.push(`\`${emailColumn}\``);
        values.push('?');
        baseParams.push(correo);
    }

    if (phoneColumn && numero) {
        insertColumns.push(`\`${phoneColumn}\``);
        values.push('?');
        baseParams.push(numero);
    }

    if (addressColumn && direccion) {
        insertColumns.push(`\`${addressColumn}\``);
        values.push('?');
        baseParams.push(direccion);
    }

    if (nitColumn && nit) {
        insertColumns.push(`\`${nitColumn}\``);
        values.push('?');
        baseParams.push(nit);
    }

    if (codeColumn) {
        insertColumns.push(`\`${codeColumn}\``);
        values.push('?');
    }

    if (insertColumns.length === 0) {
        throw new Error('No se pudo construir el registro del cliente');
    }

    const sql = `
        INSERT INTO clientes (${insertColumns.join(', ')})
        VALUES (${values.join(', ')})
    `;

    const maxInsertAttempts = codeColumn ? 3 : 1;

    for (let attempt = 0; attempt < maxInsertAttempts; attempt += 1) {
        const params = [...baseParams];
        let generatedCode = null;

        if (codeColumn) {
            generatedCode = await generateUniqueClientCode(codeColumn);
            params.push(generatedCode);
        }

        try {
            const [result] = await db.execute(sql, params);
            return {
                message: 'Cliente registrado correctamente',
                id: result.insertId,
                codigo_cliente: generatedCode
            };
        } catch (error) {
            // Si hay indice unico en codigo_cliente, reintentamos ante colision de concurrencia.
            if (codeColumn && error && error.code === 'ER_DUP_ENTRY' && attempt < maxInsertAttempts - 1) {
                continue;
            }
            throw error;
        }
    }

    throw new Error('No se pudo registrar el cliente. Intenta nuevamente.');
};

exports.create = async (data) => {
    if (!data.vendedor || !data.vendedor.trim()) {
        throw new Error('El vendedor es obligatorio');
    }

    const total = Number(data.total);
    if (!Number.isFinite(total) || total <= 0) {
        throw new Error('El total debe ser mayor que 0');
    }

    const estado = data.estado && data.estado.trim() ? data.estado.trim() : 'CONFIRMADA';
    const hasCodigoCliente = await hasColumn('ventas', 'codigo_cliente');
    const hasClienteId = await hasColumn('ventas', 'cliente_id');

    if (hasCodigoCliente && (!data.codigo_cliente || !String(data.codigo_cliente).trim())) {
        throw new Error('El codigo_cliente es obligatorio');
    }

    const codigoCliente = data.codigo_cliente ? String(data.codigo_cliente).trim() : '';

    const insertColumns = [];
    const insertValues = [];
    const params = [];

    if (hasClienteId) {
        const clienteId = Number(data.cliente_id);
        if (!Number.isInteger(clienteId) || clienteId <= 0) {
            throw new Error('El cliente_id es obligatorio y debe ser válido');
        }
        insertColumns.push('cliente_id');
        insertValues.push('?');
        params.push(clienteId);
    }

    if (hasCodigoCliente) {
        insertColumns.push('codigo_cliente');
        insertValues.push('?');
        params.push(codigoCliente);
    }

    insertColumns.push('fecha', 'total', 'estado', 'vendedor');
    insertValues.push('NOW()', '?', '?', '?');
    params.push(total, estado, data.vendedor.trim());

    const sql = `
        INSERT INTO ventas (${insertColumns.join(', ')})
        VALUES (${insertValues.join(', ')})
    `;

    const [result] = await db.execute(sql, params);

    return { message: 'Venta creada correctamente', id: result.insertId };
};

exports.getVendedores = async () => {
    const hasVendedor = await hasColumn('ventas', 'vendedor');
    
    if (!hasVendedor) {
        return [];
    }

    const sql = `
        SELECT DISTINCT vendedor
        FROM ventas
        WHERE vendedor IS NOT NULL
          AND vendedor <> ''
        ORDER BY vendedor ASC
    `;

    const [rows] = await db.execute(sql);
    return rows;
};

exports.getReport = async (period, codigoCliente, vendedor) => {

    let groupBy;

    switch (period) {
        case 'day':
            groupBy = "DATE(fecha)";
            break;
        case 'week':
            groupBy = "YEARWEEK(fecha, 1)";
            break;
        case 'month':
            groupBy = "DATE_FORMAT(fecha, '%Y-%m')";
            break;
        default:
            throw new Error("Periodo inválido. Use day, week o month");
    }

    let sql = `
        SELECT ${groupBy} as periodo,
               SUM(total) as total_ventas,
               COUNT(*) as cantidad_ventas
        FROM ventas
        WHERE estado = 'CONFIRMADA'
    `;

    const params = [];

    if (codigoCliente) {
        const hasCodigoCliente = await hasColumn('ventas', 'codigo_cliente');
        const hasClienteId = await hasColumn('ventas', 'cliente_id');

        if (hasCodigoCliente) {
            sql += " AND codigo_cliente = ?";
            params.push(codigoCliente);
        } else if (hasClienteId) {
            sql += " AND CAST(cliente_id AS CHAR) = ?";
            params.push(codigoCliente);
        } else {
            throw new Error('No existe columna para filtrar cliente en tabla ventas');
        }
    }

    if (vendedor) {
        sql += " AND vendedor = ?";
        params.push(vendedor);
    }

    sql += `
        GROUP BY periodo
        ORDER BY periodo ASC
    `;

    const [rows] = await db.execute(sql, params);
    return rows;
};

exports.getVendedoresRendimiento = async (period) => {
    let groupBy;
    let dateFilter = '';

    switch (period) {
        case 'day':
            dateFilter = "AND DATE(fecha) = CURDATE()";
            groupBy = "DATE(fecha)";
            break;
        case 'week':
            dateFilter = "AND YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)";
            groupBy = "YEARWEEK(fecha, 1)";
            break;
        case 'month':
            dateFilter = "AND DATE_FORMAT(fecha, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
            groupBy = "DATE_FORMAT(fecha, '%Y-%m')";
            break;
        default:
            groupBy = "DATE_FORMAT(fecha, '%Y-%m')";
            dateFilter = "AND DATE_FORMAT(fecha, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
    }

    const sql = `
        SELECT 
            vendedor,
            SUM(total) as total_ventas,
            COUNT(*) as cantidad_ventas,
            AVG(total) as promedio_venta
        FROM ventas
        WHERE estado = 'CONFIRMADA'
          AND vendedor IS NOT NULL
          AND vendedor <> ''
          ${dateFilter}
        GROUP BY vendedor
        ORDER BY total_ventas DESC
    `;

    const [rows] = await db.execute(sql);
    return rows;
};

exports.updateClient = async (clientRef, data) => {
    const ref = String(clientRef || '').trim();
    if (!ref) {
        throw new Error('Debe enviar una referencia de cliente');
    }

    const columns = await getTableColumns('clientes');

    const idColumn = findColumn(columns, ['id', 'cliente_id', 'id_cliente']);
    const codeColumn = findColumn(columns, ['codigo_cliente', 'codigo', 'cod_cliente']);
    const nameColumn = findColumn(columns, ['nombre', 'nombres', 'nombre_cliente', 'razon_social']);
    const emailColumn = findColumn(columns, ['correo', 'email', 'mail', 'correo_electronico']);
    const phoneColumn = findColumn(columns, ['numero', 'telefono', 'celular', 'telefono_movil', 'telefono1']);
    const addressColumn = findColumn(columns, ['direccion', 'domicilio', 'direccion_fiscal']);
    const nitColumn = findColumn(columns, ['nit', 'nit_cliente', 'ruc', 'tax_id']);

    const updates = [];
    const params = [];

    if (nameColumn && Object.prototype.hasOwnProperty.call(data, 'nombre')) {
        updates.push(`\`${nameColumn}\` = ?`);
        params.push(String(data.nombre || '').trim());
    }

    if (emailColumn && Object.prototype.hasOwnProperty.call(data, 'correo')) {
        updates.push(`\`${emailColumn}\` = ?`);
        params.push(String(data.correo || '').trim());
    }

    if (phoneColumn && Object.prototype.hasOwnProperty.call(data, 'numero')) {
        updates.push(`\`${phoneColumn}\` = ?`);
        params.push(String(data.numero || '').trim());
    }

    if (addressColumn && Object.prototype.hasOwnProperty.call(data, 'direccion')) {
        updates.push(`\`${addressColumn}\` = ?`);
        params.push(String(data.direccion || '').trim());
    }

    if (nitColumn && Object.prototype.hasOwnProperty.call(data, 'nit')) {
        updates.push(`\`${nitColumn}\` = ?`);
        params.push(String(data.nit || '').trim());
    }

    if (updates.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
    }

    const filter = buildClientReferenceFilter(ref, idColumn, codeColumn);
    const sql = `
        UPDATE clientes
        SET ${updates.join(', ')}
        WHERE ${filter.whereSql}
        LIMIT 1
    `;

    const [result] = await db.execute(sql, [...params, ...filter.whereParams]);
    if (result.affectedRows === 0) {
        throw new Error('Cliente no encontrado');
    }

    return { message: 'Cliente actualizado correctamente' };
};

exports.deleteClient = async (clientRef) => {
    const ref = String(clientRef || '').trim();
    if (!ref) {
        throw new Error('Debe enviar una referencia de cliente');
    }

    const columns = await getTableColumns('clientes');
    const idColumn = findColumn(columns, ['id', 'cliente_id', 'id_cliente']);
    const codeColumn = findColumn(columns, ['codigo_cliente', 'codigo', 'cod_cliente']);

    const filter = buildClientReferenceFilter(ref, idColumn, codeColumn);
    const sql = `
        DELETE FROM clientes
        WHERE ${filter.whereSql}
        LIMIT 1
    `;

    try {
        const [result] = await db.execute(sql, filter.whereParams);
        if (result.affectedRows === 0) {
            throw new Error('Cliente no encontrado');
        }

        return { message: 'Cliente eliminado correctamente' };
    } catch (error) {
        if (error && (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED')) {
            throw new Error('No se puede eliminar el cliente porque tiene registros relacionados');
        }
        throw error;
    }
};