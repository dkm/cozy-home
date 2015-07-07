// Generated by CoffeeScript 1.9.3
var Application, CozyInstance, CozyUser, cozydb, fs, logs;

cozydb = require('cozydb');

fs = require('fs');

CozyInstance = require('../models/cozyinstance');

CozyUser = require('../models/user');

Application = require('../models/application');

logs = require('../lib/logs');

module.exports = {
  message: function(req, res, next) {
    return CozyUser.first(function(err, user) {
      return CozyInstance.first(function(err, instance) {
        var body, content, domain, email, infos, locale, public_name;
        locale = instance.locale, domain = instance.domain;
        email = user.email, public_name = user.public_name;
        body = req.body;
        infos = {
          locale: locale,
          domain: domain
        };
        content = '\n\n---- User config\n\n';
        content += JSON.stringify({
          locale: locale,
          domain: domain
        }) + '\n';
        content += JSON.stringify({
          email: email,
          public_name: public_name
        }) + '\n';
        content += '\n\n---- User message\n\n';
        content += req.body.messageText;
        return logs.getCompressLogs(function(path) {
          var attachments, data;
          attachments = [
            {
              path: path,
              contentType: "application/x-compressed-tar"
            }
          ];
          data = {
            to: "support@cozycloud.cc",
            subject: "Demande d'assistance depuis un Cozy",
            content: content,
            attachments: attachments
          };
          return cozydb.api.sendMailFromUser(data, (function(_this) {
            return function(err) {
              fs.unlink(path);
              if (err) {
                return next(err);
              }
              return res.send({
                success: 'Mail successully sent to support.'
              });
            };
          })(this));
        });
      });
    });
  }
};
