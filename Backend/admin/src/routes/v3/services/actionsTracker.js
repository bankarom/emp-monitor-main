const { UserActionsLogModel } = require('../logs/UserActionsLogModel');

const parseMessage = (message, params) => {
    const vars = Array.isArray(params) ? [...params] : [params];
    return message.replace(/(\?|\%i|\!)/g, (matched) => {
        switch (matched) {
            case '?': return JSON.stringify(vars.shift());
            case '!': return vars.shift();
            case '%i': return parseInt(vars.shift());
            default: return '';
        }
    });
};

const getRequestPath = (req) => {
    if (!req) return null;
    if (req.originalUrl) return req.originalUrl;
    if (req.baseUrl && req.path) return `${req.baseUrl}${req.path}`;
    return req.baseUrl || req.path || req.url || null;
};

const getRequestIp = (req) => {
    if (!req) return null;
    const forwarded = req.headers && req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.ip || req.connection && req.connection.remoteAddress || req.socket && req.socket.remoteAddress || null;
};

const extractUserId = (req) => {
    if (!req) return null;
    return req.decoded?.user_id || req.user_id || req.employee_id || req.id || null;
};

const actionsTracker = async (req, action, actionParams = [], userIdOverride = null) => {
    try {
        const userId = userIdOverride || extractUserId(req);
        return await UserActionsLogModel.insert({
            user_id: userId,
            action: parseMessage(action, actionParams),
            method: req?.method || 'N/A',
            path: getRequestPath(req),
            ip: getRequestIp(req),
        });
    } catch (error) {
        console.error('actionsTracker error:', error.message || error);
        return null;
    }
};

module.exports = actionsTracker;
