// Generated by CoffeeScript 1.9.3
var Application, CozyInstance, CozyUser, cozydb, logs;

cozydb = require('cozydb');

CozyInstance = require('../models/cozyinstance');

CozyUser = require('../models/user');

Application = require('../models/application');

logs = require('../lib/logs');

module.exports = {
  message: function(req, res, next) {
    return CozyUser.first(function(err, user) {
      return CozyInstance.first(function(err, instance) {
        var body, content, domain, email, infos, locale, public_name, selectedApp;
        selectedApp = req.body.app || 'home';
        locale = instance.locale, domain = instance.domain;
        email = user.email, public_name = user.public_name;
        body = req.body;
        infos = {
          locale: locale,
          domain: domain
        };
        selectedApp = 'calendar';
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
        return Application.all(function(err, apps) {
          var slugs;
          slugs = apps.map(function(app) {
            return app.slug;
          });
          return logs.getManyLogs(slugs, function(err, appLogs) {
            return logs.getLogs('data-system', function(err, dsLogs) {
              var attachments, data, logContent, slug;
              attachments = [];
              if (dsLogs != null) {
                attachments.push({
                  filename: "ds.log",
                  content: dsLogs,
                  contentType: "plain/text"
                });
              }
              for (slug in appLogs) {
                logContent = appLogs[slug];
                attachments.push({
                  filename: slug + ".log",
                  content: logContent,
                  contentType: "text/plain"
                });
              }
              data = {
                to: "frank@mycozycloud.com",
                subject: "Demande d'assistance depuis un Cozy",
                content: content,
                attachments: attachments
              };
              return cozydb.api.sendMailFromUser(data, (function(_this) {
                return function(err) {
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
      });
    });
  }
};
