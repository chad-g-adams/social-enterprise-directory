
const request = require('supertest');
const App = require('../../app_starter').App;

const URL_PREFIX = '/api/v1';

function buildGetRequest(url, statusCode) {
  statusCode = statusCode || 200;
  return request(App)
      .get(URL_PREFIX + url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(statusCode);
}

function buildGetRequestForContentType(url, contentType, statusCode) {
  statusCode = statusCode || 200;
  return request(App)
      .get(URL_PREFIX + url)
      .set('Accept', 'application/json')
      .expect('Content-Type', contentType)
      .expect(statusCode);
}

module.exports.buildPostRequest = function(url, statusCode) {
  statusCode = statusCode || 201;
  return request(App)
      .post(URL_PREFIX + url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(statusCode);
};

module.exports.buildPatchRequest = function(url, statusCode) {
  statusCode = statusCode || 200;
  return request(App)
      .patch(URL_PREFIX + url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(statusCode);
};

module.exports.buildPutRequest = function(url, statusCode) {
  statusCode = statusCode || 200;
  return request(App)
      .put(URL_PREFIX + url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(statusCode);
};

module.exports.buildDeleteRequest = function(url, statusCode) {
  statusCode = statusCode || 200;
  return request(App)
      .delete(URL_PREFIX + url)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(statusCode);
};

module.exports.performGetRequest = function(url, statusCode) {
  return function() {
    return new Promise((resolve, reject) => {
      buildGetRequest(url, statusCode)
      .end( (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  };
};

module.exports.performGetRequestWithContentType = function(url, contentType, statusCode) {
  return function() {
    return new Promise((resolve, reject) => {
      buildGetRequestForContentType(url, contentType, statusCode)
      .end( (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
  };
};
