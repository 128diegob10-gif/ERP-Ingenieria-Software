const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { ensureUsersTable, USER_ROLES } = require('./auth.service');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeRole(value) {
    return String(value || '').trim().toLowerCase();
}

function validateRole(role) {
    const normalized = normalizeRole(role);
    if (!USER_ROLES.includes(normalized)) {
        throw new Error(`Rol inválido. Roles permitidos: ${USER_ROLES.join(', ')}`);
    }

    return normalized;
}

exports.getUsers = async () => {
    await ensureUsersTable();

    const [rows] = await db.execute(`
        SELECT id, nombre, correo, rol, activo, created_at, updated_at
        FROM usuarios
        ORDER BY created_at DESC
    `);

    return rows;
};

exports.createUser = async (data) => {
    await ensureUsersTable();

    const nombre = String(data.nombre || '').trim();
    const correo = normalizeEmail(data.correo);
    const password = String(data.password || '');
    const rol = validateRole(data.rol);
    const activo = Number(data.activo) === 0 ? 0 : 1;

    if (!nombre) {
        throw new Error('El nombre es obligatorio');
    }

    if (!correo) {
        throw new Error('El correo es obligatorio');
    }

    if (!password || password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    const [existing] = await db.execute(
        'SELECT id FROM usuarios WHERE correo = ? LIMIT 1',
        [correo]
    );

    if (existing.length > 0) {
        throw new Error('Ya existe un usuario con ese correo');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
        `
            INSERT INTO usuarios (nombre, correo, password_hash, rol, activo)
            VALUES (?, ?, ?, ?, ?)
        `,
        [nombre, correo, passwordHash, rol, activo]
    );

    return {
        message: 'Usuario creado correctamente',
        id: result.insertId
    };
};

exports.updateUser = async (id, data, currentUserId) => {
    await ensureUsersTable();

    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error('Id de usuario inválido');
    }

    const updates = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(data, 'nombre')) {
        const nombre = String(data.nombre || '').trim();
        if (!nombre) {
            throw new Error('El nombre no puede estar vacío');
        }
        updates.push('nombre = ?');
        params.push(nombre);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'correo')) {
        const correo = normalizeEmail(data.correo);
        if (!correo) {
            throw new Error('El correo no puede estar vacío');
        }

        const [existing] = await db.execute(
            'SELECT id FROM usuarios WHERE correo = ? AND id <> ? LIMIT 1',
            [correo, userId]
        );

        if (existing.length > 0) {
            throw new Error('Ya existe otro usuario con ese correo');
        }

        updates.push('correo = ?');
        params.push(correo);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'rol')) {
        const rol = validateRole(data.rol);
        updates.push('rol = ?');
        params.push(rol);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'activo')) {
        const activo = Number(data.activo) === 0 ? 0 : 1;
        updates.push('activo = ?');
        params.push(activo);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'password')) {
        const password = String(data.password || '');
        if (password && password.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }

        if (password) {
            const passwordHash = await bcrypt.hash(password, 12);
            updates.push('password_hash = ?');
            params.push(passwordHash);
        }
    }

    if (updates.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
    }

    if (Number(currentUserId) === userId) {
        const roleUpdateIndex = updates.findIndex((field) => field === 'rol = ?');
        if (roleUpdateIndex >= 0) {
            throw new Error('No puedes cambiar tu propio rol');
        }
    }

    const [result] = await db.execute(
        `
            UPDATE usuarios
            SET ${updates.join(', ')}
            WHERE id = ?
            LIMIT 1
        `,
        [...params, userId]
    );

    if (result.affectedRows === 0) {
        throw new Error('Usuario no encontrado');
    }

    return { message: 'Usuario actualizado correctamente' };
};

exports.deleteUser = async (id, currentUserId) => {
    await ensureUsersTable();

    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error('Id de usuario inválido');
    }

    if (Number(currentUserId) === userId) {
        throw new Error('No puedes eliminar tu propio usuario');
    }

    const [result] = await db.execute(
        'DELETE FROM usuarios WHERE id = ? LIMIT 1',
        [userId]
    );

    if (result.affectedRows === 0) {
        throw new Error('Usuario no encontrado');
    }

    return { message: 'Usuario eliminado correctamente' };
};
