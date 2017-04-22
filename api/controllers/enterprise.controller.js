const mongoose = require('mongoose');
const logger = require('../../lib/logger');
const coordsUtil = require('../../lib/coords_util');
const conf = require('../../config/config.js');

const enterpriseInternationalPublicModel = mongoose.model('EnterpriseInternationalPublic');
const enterpriseInternationalPrivateFieldsModel = mongoose.model('EnterpriseInternationalPrivateFields');
const enterpriseLogoModel = mongoose.model('EnterpriseLogo');
const enterpriseAdapter = require('./enterprise.adapter');
const SUPPORTED_LANGUAGES = require('../helpers/language/constants').SUPPORTED_LANGUAGES;
const DEFAULT_LANGUAGE = require('../helpers/language/constants').DEFAULT_LANGUAGE;

const ENTERPRISE_CACHE_CONTROL = conf.get('enterpriseCacheControl');

function locationParamToPointObject(locationSearch) {
  let [longStr, latStr] = locationSearch.split(',');
  let long = parseFloat(longStr);
  let lat = parseFloat(latStr);
  if (!coordsUtil.isValidCoords(long, lat)) {
    return undefined;
  }
  let point = { type : 'Point', coordinates : [long,lat] };
  return point;
}

function processDirectoryResults(res, dbEnterprises, language) {
  if (!dbEnterprises) {
    res.status(200).json({});
    return;
  }

  let tranformedEnterprises = enterpriseAdapter.transformDbEnterprisesToApiFormatForLanguage(dbEnterprises, language);
  res.set('Cache-Control', 'max-age=' + ENTERPRISE_CACHE_CONTROL);
  res.status(200).json(tranformedEnterprises);
}

function performLocationSearch(res, locationSearch, limit, offset, language) {
  let point = locationParamToPointObject(locationSearch);
  if (!point) {
    res.status(400).json({'message': 'Invalid location parameter'});
    return;
  }

  enterpriseInternationalPublicModel.aggregate(
    [
      { '$geoNear': {
        'near': point,
        'spherical': true,
        'distanceField': 'dis'
      }},
      { '$skip': offset },
      { '$limit': limit }
    ])
  .then(dbEnterprises => {
    processDirectoryResults(res, dbEnterprises, language);
  })
  .catch(err => {
    logger.error('Error finding enterprises ' + err);
    res.status(500).json({'message': err});
  });
}


function performBrowseDirectory(res, limit, offset, language) {
  let sortValue = {};
  sortValue[language + '.lowercase_name'] = 1;
  enterpriseInternationalPublicModel
    .find()
    .sort(sortValue)
    .limit(limit)
    .skip(offset)
    .then(dbEnterprises => processDirectoryResults(res, dbEnterprises, language))
    .catch(err => {
      logger.error('Error browsing enterprises ' + err);
      res.status(500).json({'message': err});
    });
}

module.exports.getAllEnterprisesPublic = function(req, res) {
  let query;

  let search = req.swagger.params.q.value;
  let locationSearch = req.swagger.params.at.value;

  let limit = req.swagger.params.count.value || 500;
  let offset = req.swagger.params.offset.value || 0;

  let lang = getLanguage(req);

  if (locationSearch) {
    performLocationSearch(res, locationSearch, limit, offset, lang);
    return;
  }

  if (!search) {
    performBrowseDirectory(res, limit, offset, lang);
    return;
  }

  let keywords = search.replace(/\+/g, ' ');
  query = enterpriseInternationalPublicModel
    .find(
      { $text : { $search : keywords } },
      { score : { $meta: 'textScore' } })
    .sort({ score : { $meta : 'textScore' } });

  query
    .limit(limit)
    .skip(offset)
    .then(dbEnterprises => processDirectoryResults(res, dbEnterprises, lang))
    .catch(err => {
      logger.error('Error finding enterprises ' + err);
      res.status(500).json({'message': err});
    });
};

function getLanguage(req) {
  let lang = DEFAULT_LANGUAGE;
  if (req.swagger.params.lang &&
      req.swagger.params.lang.value &&
      SUPPORTED_LANGUAGES.indexOf(req.swagger.params.lang.value) > -1) {
    lang = req.swagger.params.lang.value;
  }
  return lang;
}

module.exports.getOneEnterprisePublic = function(req, res) {

  let id = req.swagger.params.id.value;
  let lang = getLanguage(req);

  enterpriseInternationalPublicModel
    .findById(id)
    .then(dbEnterprise => {
      if (!dbEnterprise) {
        logger.info('Enterprise not found for id ', id);
        res.status(404).json({'message': 'Enterprise not found for id ' + id});
        return Promise.resolve(null);
      }

      try {
        let tranformedEnterprise = enterpriseAdapter.transformDBIntlEnterpriseToApiFormatForLanguage(dbEnterprise, lang);
        res.set('Cache-Control', 'max-age=' + ENTERPRISE_CACHE_CONTROL);
        res.status(200).json(tranformedEnterprise);
      } catch (e) {
        return Promise.reject(e);
      }
    })
    .catch(err => {
      logger.error('Error finding enterprise', id, ':', err);
      res.status(500).json({'message': err});
    });
};

module.exports.getOneEnterpriseComplete = function(req, res) {
  let id = req.swagger.params.id.value;
  enterpriseInternationalPublicModel
    .findById(id)
    .then(dbEnterprise => {
      if (!dbEnterprise) {
        logger.info('Enterprise not found for id ', id);
        res.status(404).json({'message': 'Enterprise not found for id ' + id});
        return Promise.resolve(null);
      }

      try {
        let tranformedEnterprise = enterpriseAdapter.transformDbEnterprisesToApiFormat(dbEnterprise);
        res.set('Cache-Control', 'max-age=' + ENTERPRISE_CACHE_CONTROL);
        res.status(200).json(tranformedEnterprise);
      } catch (e) {
        return Promise.reject(e);
      }
    })
    .catch(err => {
      logger.error('Error finding enterprise', id, ':', err);
      res.status(500).json({'message': err});
    });
};

module.exports.createEnterprise = function(req, res) {
  if (conf.get('env') != 'test') {
    res.status(403).json({'message': 'Not supported yet'});
    return;
  }
  let enterprise = req.swagger.params.Enterprise.value;
  let publicEnterprise;
  let privateEnterprise;
  try {
    publicEnterprise = enterpriseAdapter.transformCompleteEnterpriseToInternationalPublicDBFormat(enterprise);
    privateEnterprise = enterpriseAdapter.transformCompleteEnterpriseToInternationalPrivateDBFormat(enterprise);
  } catch (e) {
    res.status(500).json({'message': e});
    return;
  }

  let dbPrivateEnterpriseInfo;
  enterpriseInternationalPrivateFieldsModel.create(privateEnterprise)
    // create public enterprise info
    .then(dbPrivateEnterprise => {
      dbPrivateEnterpriseInfo = dbPrivateEnterprise;
      publicEnterprise['private_info'] = dbPrivateEnterprise['_id'];
      return enterpriseInternationalPublicModel.create(publicEnterprise);
    })
    // create api response
    .then( dbPublicEnterprise => {
      let apiEnterprise = enterpriseAdapter.transformDbIntlEnterpriseToApiIntlFormat(dbPublicEnterprise);
      enterpriseAdapter.appendPrivateInfo(apiEnterprise, dbPrivateEnterpriseInfo);
      logger.info(`Enterprise created (name=${apiEnterprise[DEFAULT_LANGUAGE]['name']} id=${apiEnterprise['id']})`);
      res.status(201).json(apiEnterprise);
    })
    .catch(err => {
      logger.error('Error creating enterprise in db ', err, enterprise);
      res.status(400).json({'message': err});
    });
};

module.exports.getEnterpriseLogo = function(req, res) {
  let id = req.swagger.params.id.value;
  enterpriseLogoModel
    .findOne({enterpriseId : id})
    .then( dbLogo => {
      if (!dbLogo) {
        logger.info('Enterprise logo not found for id ', id);
        res.status(404).json({'message': 'Enterprise logo not found for id ' + id});
        return Promise.resolve(null);
      }

      res.set('Content-Type', dbLogo.contentType);
      res.set('Cache-Control', 'max-age=' + ENTERPRISE_CACHE_CONTROL);
      res.status(200).send(dbLogo.image);
    })
    .catch( err => {
      logger.error('Error finding enterprise logo', id, ':', err);
      res.status(500).json({'message': err});
    });
};
