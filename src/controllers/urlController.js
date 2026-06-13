module.exports.getHome = (req, res) => {
    res.render('pages/home', { user: req.session.user });
}

module.exports.getLogin = (req, res) => {
    res.render('pages/login', {
        user: req.session.user,
        authMode: 'login',
        next: req.query.next || ''
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

module.exports.getCart = (req, res) => {
    res.render('pages/cart', {
        user: req.session.user,
        items: [],
        cartSubtotal: 0,
        cartItemCount: 0
    });
}

module.exports.getCheckout = (req, res) => {
    res.render('pages/checkout', {
        user: req.session.user,
        items: [],
        cartSubtotal: 0,
        cartItemCount: 0
    });
}

module.exports.orderSuccess = (
    req,
    res
) => {

    res.render(
        'pages/order-success',
        {
            user: req.session.user,
            orderId:
                req.params.orderId
        }
    );

};