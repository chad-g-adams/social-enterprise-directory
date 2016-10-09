var should = require('should');
var testEnterprise1 = require('../../helpers/data/enterprise/testEnterprise1_complete');
var testEnterprise2 = require('../../helpers/data/enterprise/testEnterprise2_complete');
var testEnterprise3 = require('../../helpers/data/enterprise/testEnterprise3_complete');
var requestUtil = require('../../helpers/request_util');
var enterpriseVerifier = require('../../helpers/enterprise/enterprise_verifier');

var url = '/enterprise';

var postIds = {};

module.exports.clean = function() {
  postIds = {};
};

module.exports.postTestEnterprise1 = function(done) {
  postEnterprise(done, testEnterprise1, enterpriseVerifier.verifyEnterprise1);
};
module.exports.postTestEnterprise2 = function(done) {
  postEnterprise(done, testEnterprise2, enterpriseVerifier.verifyEnterprise2);
};
module.exports.postTestEnterprise3 = function(done) {
  postEnterprise(done, testEnterprise3, enterpriseVerifier.verifyEnterprise3);
};

module.exports.postAllEnterprises = function(done) {
  module.exports.postTestEnterprise1( function() {
    module.exports.postTestEnterprise2( function() {
      module.exports.postTestEnterprise3(done);
    });
  });
};

module.exports.getTestEnterprise1Id = function() {
  return postIds[testEnterprise1['name']];
};
module.exports.getTestEnterprise2Id = function() {
  return postIds[testEnterprise2['name']];
};
module.exports.getTestEnterprise3Id = function() {
  return postIds[testEnterprise3['name']];
};

function postEnterprise(done, enterprise, verifyMethod) {
  requestUtil.buildPostRequest(url)
    .send(enterprise)
    .end(function(err, res) {
      should.not.exist(err);
      verifyMethod(res.body);
      postIds[enterprise['name']] = res.body['id'];
      if (done) {
        done();
      }
    });
}