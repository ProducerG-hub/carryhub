module.exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

module.exports.requireLoginRedirect = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }

    const nextTarget = req.body?.next || req.query?.next || req.originalUrl;
    return res.redirect(`/login?next=${encodeURIComponent(nextTarget)}`);
};

module.exports.isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
};