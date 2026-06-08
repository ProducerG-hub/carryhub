module.exports.getHome = (req, res) => {
    res.render('pages/home', { user: req.session.user });
}
