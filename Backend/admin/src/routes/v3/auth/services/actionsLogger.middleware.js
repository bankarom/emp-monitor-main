'use strict';

const actionsTracker = require('../../services/actionsTracker');

const logAuthenticatedActions = async (req, res, next) => {
    try {
        await actionsTracker(req, 'Authenticated request: ?.', [`${req.method} ${req.originalUrl || req.url}`]);
    } catch (err) {
        // Do not block request flow if logging fails
        console.error('actionsLogger middleware error:', err.message || err);
    }
    next();
};

module.exports = { logAuthenticatedActions };
