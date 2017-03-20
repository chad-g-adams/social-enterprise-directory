const passport = require('../helpers/auth/passport_factory');
const adminChecker = require('../helpers/auth/request_admin_checker');

module.exports.logout = function(req, res) {
  req.logout();
  res.status(200).json({});
};

module.exports.loginTwitter = function(req, res, next) {
  passport.authenticate('twitter')(req, res, next);
};

module.exports.loginInstagram = function(req, res, next) {
  passport.authenticate('instagram', {scope: 'basic', failWithError: true})(req, res, next);
};

module.exports.loginFacebook = function(req, res, next) {
  passport.authenticate('facebook', {scope: 'email', session:false})(req, res, next);
};

module.exports.getAccountPermissions = function(req, res) {
  if (!req.isAuthenticated()) {
    res.status(403).json({'message': 'Not logged in'});
    return;
  }

  if (adminChecker.isRequestDirectoryAdmin(req)) {
    res.status(200).json({'directoryAdmin': true});
    return;
  }

  let enterprisePermissions = adminChecker.getAuthenticatedEnterprisesByRequest(req);
  //TODO: add enterprise names from DB
  res.status(200).json({'authenticatedEnterprises': enterprisePermissions});
};
