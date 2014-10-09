// Generated by CoffeeScript 1.8.0
var AlarmManager, CozyAdapter, RRule, oneDay, tDate, time,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

time = require('time');

tDate = time.Date;

CozyAdapter = require('jugglingdb-cozy-adapter');

RRule = require('rrule').RRule;

oneDay = 24 * 60 * 60 * 1000;

module.exports = AlarmManager = (function() {
  AlarmManager.prototype.dailytimer = null;

  AlarmManager.prototype.timeouts = {};

  function AlarmManager(timezone, Alarm, notificationhelper) {
    this.timezone = timezone;
    this.Alarm = Alarm;
    this.notificationhelper = notificationhelper;
    this.handleNotification = __bind(this.handleNotification, this);
    this.handleAlarm = __bind(this.handleAlarm, this);
    this.fetchAlarms = __bind(this.fetchAlarms, this);
    this.fetchAlarms();
  }

  AlarmManager.prototype.fetchAlarms = function() {
    this.dailytimer = setTimeout(this.fetchAlarms, oneDay);
    return this.Alarm.all((function(_this) {
      return function(err, alarms) {
        var alarm, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = alarms.length; _i < _len; _i++) {
          alarm = alarms[_i];
          _results.push(_this.addAlarmCounters(alarm));
        }
        return _results;
      };
    })(this));
  };

  AlarmManager.prototype.clearTimeouts = function(id) {
    var timeout, _i, _len, _ref;
    if (this.timeouts[id] != null) {
      _ref = this.timeouts[id];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        timeout = _ref[_i];
        clearTimeout(timeout);
      }
      return delete this.timeouts[id];
    }
  };

  AlarmManager.prototype.handleAlarm = function(event, msg) {
    switch (event) {
      case "alarm.create":
        return this.Alarm.find(msg, (function(_this) {
          return function(err, alarm) {
            if (alarm) {
              return _this.addAlarmCounters(alarm);
            }
          };
        })(this));
      case "alarm.update":
        return this.Alarm.find(msg, (function(_this) {
          return function(err, alarm) {
            if (alarm) {
              return _this.addAlarmCounters(alarm);
            }
          };
        })(this));
      case "alarm.delete":
        return this.clearTimeouts(msg);
    }
  };

  AlarmManager.prototype.addAlarmCounters = function(alarm) {
    var in24h, now, occurence, occurences, rrule, trigg, triggCopied, _i, _len, _ref, _results;
    this.clearTimeouts(alarm._id);
    now = new tDate();
    now.setTimezone(this.timezone);
    in24h = new tDate(now.getTime() + oneDay);
    in24h.setTimezone(this.timezone);
    trigg = new tDate(alarm.trigg);
    trigg.setTimezone('UTC');
    if (alarm.rrule) {
      rrule = RRule.parseString(alarm.rrule);
      triggCopied = new tDate(alarm.trigg);
      triggCopied.setTimezone(time.currentTimezone);
      rrule.dtstart = triggCopied;
      occurences = new RRule(rrule).between(now, in24h);
      occurences = occurences.map((function(_this) {
        return function(string) {
          var occurence;
          occurence = new tDate(string);
          occurence.setTimezone(_this.timezone);
          return occurence;
        };
      })(this));
    } else if ((now.getTime() <= (_ref = trigg.getTime()) && _ref < in24h.getTime())) {
      occurences = [trigg];
    } else {
      occurences = [];
    }
    _results = [];
    for (_i = 0, _len = occurences.length; _i < _len; _i++) {
      occurence = occurences[_i];
      _results.push(this.addAlarmCounter(alarm, occurence));
    }
    return _results;
  };

  AlarmManager.prototype.addAlarmCounter = function(alarm, triggerDate) {
    var delta, now, _base, _name;
    now = new tDate();
    now.setTimezone(this.timezone);
    triggerDate.setTimezone(this.timezone);
    delta = triggerDate.getTime() - now.getTime();
    if (delta > 0) {
      console.info("Notification in " + (delta / 1000) + " seconds.");
      if ((_base = this.timeouts)[_name = alarm._id] == null) {
        _base[_name] = [];
      }
      return this.timeouts[alarm._id].push(setTimeout(((function(_this) {
        return function() {
          return _this.handleNotification(alarm);
        };
      })(this)), delta));
    }
  };

  AlarmManager.prototype.handleNotification = function(alarm) {
    var data, resource, _ref, _ref1, _ref2;
    if ((_ref = alarm.action) === 'DISPLAY' || _ref === 'BOTH') {
      resource = alarm.related != null ? alarm.related : {
        app: 'calendar',
        url: "/#list"
      };
      this.notificationhelper.createTemporary({
        text: "Reminder: " + alarm.description,
        resource: resource
      });
    }
    if ((_ref1 = alarm.action) === 'EMAIL' || _ref1 === 'BOTH') {
      data = {
        from: "Cozy Agenda <no-reply@cozycloud.cc>",
        subject: "[Cozy-Agenda] Reminder",
        content: "Reminder: " + alarm.description
      };
      CozyAdapter.sendMailToUser(data, function(error, response) {
        if (error != null) {
          return console.info("Error while sending email -- " + error);
        }
      });
    }
    if ((_ref2 = alarm.action) !== 'EMAIL' && _ref2 !== 'DISPLAY' && _ref2 !== 'BOTH') {
      return console.log("UNKNOWN ACTION TYPE");
    }
  };

  return AlarmManager;

})();
