var winston = require('winston');

//setup the winston logger
//@TODO: move filenames etc.. to config file
function createWinstonLogger(namespace) {
  //initiate the logger
  return new (winston.Logger)({
    transports: [
      //STDOUT
      new (winston.transports.Console)({
        name: 'default',
        colorize: true,
        level: 'debug',
        timestamp: true,
        label: namespace
      }),

      //FileHandler: @TODO: move to config
      new (winston.transports.File)({
        name: 'default_error_log',
        filename: '/var/log/app/error.log',
        level: 'error',
        timestamp: true,
        label: namespace
      }),

      //json representation of standard application logs
      new (winston.transports.File)({
        name: 'json_app_log',
        filename: '/var/log/app/main.json.log',
        level: 'debug',
        timestamp: true,
        logstash: true,
        json: true,
        label: namespace
      }),

      //json represenation of application errors
      new (winston.transports.File)({
        name: 'json_error_log',
        filename: '/var/log/app/error.json.log',
        level: 'error',
        timestamp: true,
        logstash: true,
        json: true,
        label: namespace
      }),
    ]
  });
}

/**
 * Custom Logger to handle multiple log sources in one place
 *
 */
var Logger = function Logger(ns) {

  //create the loggers namespace to be displayed in logs
  var namespace = ns || 'app';

  //debugging tool.
  //https://github.com/visionmedia/debug
  var debug = require('debug')(namespace);

  var winston_logs = createWinstonLogger(namespace);

  //create class for prototyping
  var _Logger = function _Logger() {};


  //standard log output
  //@param level - [debug, info, error]
  //
  //NOTE: If we want to add a new logger, this is were we put it
  //because all subsequent logging functions call this one
  _Logger.prototype.log = function(level, msg, extras) {
    debug(msg);
    winston_logs.log(level, msg, extras || {});
  };

  //debug level logging
  _Logger.prototype.debug = function(msg, extras) {
    this.log('debug', msg, extras);
  };

  //info level logging
  _Logger.prototype.info = function(msg, extras) {
    this.log('info', msg, extras);
  };

  //error level logging
  _Logger.prototype.error = function(msg, extras) {
    this.log('error', msg, extras);
  };

  return new _Logger();
};

module.exports = Logger;
