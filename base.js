/*
 * @Class BaseModel
 *
 * This is an abstraction layer to easily create encapsulated objects
 * that manage data and event handling. These models will typically
 * mimic a database layer in terms of it's properties, but is agnostic
 * to which database engine you might use.
 *
 * supplies basic CRUD functions:
 *
 * save()
 * create()
 * update()
 * delete()/destroy()
 *
 * supplies basic event emissions:
 *
 * @event save - when data is saved somewhere
 * @event create - when model is created (will call save())
 * @event update - when model is updated (will call save())
 * @event delete/destroy - when a model is destroyed (WIP)
 *
 * ... more
 *
 * - uses inheritance
 * - allows dynamic field mappings
 *
 * future:
 * - field validations
 * - field declarations
 * - allow function overrides instead of inheriting
 *
 */

var util = require('util');
var events = require('events');
var _ = require('lodash');
var logging = require('./logging');

//setup logging
var log = logging('lib.models.base');

//create class constructor
module.exports = (function() {

  //creates an immutable property on an object
  function createProperty(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,

      //@TODO: eventually, we may need to change these
      //for now, let's create immutable objects
      enumerable: true,
      writable: false,
      configurable: false
    });

    //create data collection for easier access
    if(!obj.data){
      obj.data = {};
    }

    //copy to data collection
    obj.data[key] = obj[key];

  }
  //copy passed properties and attach then to 'this'
  function initProps(props) {
    var self = this; //keep reference for loop

    //loop through provided config, and save the properties
    _.forEach(props, function(key, val) {
      if(props.hasOwnProperty(key)){
        createProperty(self, key, val);

      }
    });
  }

  //construct
  var _BaseModel = function BaseModel(props) {

    initProps.call(this, props);
    events.EventEmitter.call(this);
  };

  //must inherit before building any prototypes
  util.inherits(_BaseModel, events.EventEmitter);

  //fire event before saving
  _BaseModel.prototype.beforeSave = function beforeSave() {
    log.debug('do something before base saving');
    this.emit('beforesave');
    return true;
  };

  //fire event after saving is successful
  _BaseModel.prototype.afterSave = function afterSave() {
    log.debug('do something after base saving');
    this.emit('aftersave');
    return true;
  };

  //save the model to something
  _BaseModel.prototype.save = function save() {
    if(this.beforeSave()){
      log.debug('do some base saving');
      this.emit('save');
      this.afterSave();
    }
  };

  //create a new model
  //note: this will still call save()
  _BaseModel.prototype.create = function create() {
    this.emit('create');
  };

  //update an existing model
  //note: this will still call save()
  _BaseModel.prototype.update = function update() {
    this.emit('update');
  };

  _BaseModel.prototype.destroy = function destroy() {
    this.emit('delete');
    this.emit('destroy');
  };

  //allow delete() as well for gracefulness
  _BaseModel.prototype.delete = _BaseModel.prototype.destroy;


  //update the objects unique identifier
  _BaseModel.prototype.setId = function(newId) {
    createProperty(this, 'id', newId);
  };

  _BaseModel.prototype.getId = function() {
    return this.id || this.data.id;
  };

  _BaseModel.prototype.exists = function() {
    return !_.isUndefined(this.getId()) && !_.isNull(this.getId());
  };

  //create ability to extend the Base
  _BaseModel.extend = function extendBaseModel(protos) {
    var self = this;

    //define new constructor
    function Model() {
      _BaseModel.apply(this, arguments);
    }

    //inherit from Model
    util.inherits(Model, _BaseModel);


    //apply updated prototype properties with inherited functions
    _.forEach(protos, function(prop, key) {
      if(_.isFunction(prop)) {
        if(_BaseModel.prototype.hasOwnProperty(key)) {
          var inheritedFunc = _BaseModel.prototype[key],
              newFunc = prop;

          //update prototype wrap super and instance functions together
          Model.prototype[key] = function extendedFunc() {
              //we call the base function first, then the inherited func
              inheritedFunc.apply(this, arguments);
              return newFunc.apply(this, arguments);
          };

        } else {
          //install new functions that don't have to be inherited
          Model.prototype[key] = prop;
        }
      }
    });

    //ensure constructor is the one we want
    Model.prototype.constructor = Model;

    //assign extend func to new constructor using callee
    Model.extend = arguments.callee; //allow multiple inheritance

    return Model;
  };


  return _BaseModel;
})();
