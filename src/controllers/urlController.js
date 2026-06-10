module.exports.getHome = (req, res) => {
    res.render('pages/home', { user: req.session.user });
}

module.exports.getLogin = (req, res) => {
    res.render('pages/login', {
        user: req.session.user,
        authMode: 'login'
    });
}

module.exports.getRegister = (req, res) => {
    res.render('pages/register', {
        user: req.session.user,
        authMode: 'register'
    });
}

module.exports.getProfile = (req, res) => {
    res.render('pages/profile', {
        user: req.session.user
    });
}
