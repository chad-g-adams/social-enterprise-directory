var enterpriseData = require('./test_data.json');

module.exports.getAllEnterprisesPublic = function(req, res) {
  res.status(200)
    .json(enterpriseData['enterprises']);
};

module.exports.getOneEnterprisePublic = function(req, res) {
  var id = req.swagger.params.id.value;
  var enterprise = enterpriseData['enterprises'].filter(function(enterprise) {
    return enterprise.id == id;
  })[0];

  res.status(200)
    .json(enterprise);
};

module.exports.getOneEnterpriseComplete = function(req, res) {
  var id = req.swagger.params.id.value;
  var enterprise = enterpriseData['enterprises'].filter(function(enterprise) {
    return enterprise.id == id;
  })[0];

  res.status(200)
    .json(enterprise);
};