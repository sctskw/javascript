#!/usr/bin/env node
/* jshint unused:false */
var util = require('util');
var _ = require('lodash');


////Prototypal

var Car = {

  //explicitness
  make: undefined,
  model: undefined,
  color: undefined,

  //create a "new" Car.
  //properties will be inherited up the prototype chain
  //eg. prototype cloning
  create: function(cfg) {
    var self = Object.create(this);
    self.config(cfg); //init configs
    return self;
  },

  //update properties on this object
  config: function(cfg) {
    var self = this;
    _.forEach(cfg, function(value, key) {
      //use defineProperty for more fine-grained property settings
      Object.defineProperty(self, key, {
        value: value
      });
    });

    return self;
  },

  toArray: function() {
    return [this.make, this.model, this.color];
  },

  toString: function() {
    return util.format.apply('%s - %s (%s)', this.toArray());
  }
};


//cloning
var Honda = Car.create({
  "make": "Honda",
  "model": "Civic",
  "color": "silver"
});

var Toyota = Car.create({
  "make": "Toyota",
  "model": "Tacoma",
  "color": "blue"
});

console.log(Honda.toString());
console.log(Toyota.toString());

//creating
var Subaru = Object.create(Car);
Subaru.config({
  "make": "Subaru",
  "model": "Outback",
  "color": "red"
});

console.log(Subaru.toString());

var Kia = Car.create({
    "make": "Kia"
});

console.log(Kia.toString()); //fails

//create new Kia's
var Sonata = Kia.create({
  "model": "Sonata",
  "color": "white"
});

console.log(Sonata.toString());

////Extending
//attaching to Object to make available
Object.prototype.extend = function() {
  var hasProp = Object.hasOwnProperty; //cache hasOwnProperty
  var self = Object.create(this); //create new prototype fn
  self.$parent = this;


  //loop through all arguments for multiple inheritance
  //loop through new extended props and add them.
  //call hasProp to determine if it's on the prototype
  //or if the prop doesn't exist on the new prototype
  //add it

  _.each(arguments, function(obj) {
    _.forEach(obj, function(value, prop) {
      if(hasProp.call(obj, prop) ||
          typeof self[prop] === "undefined") {
        self[prop] = obj[prop]; //copy value
      }
    });
  });

 return self;
};


//Jeep factory
var Jeep = Car.extend({
  create: function() {
    return this.extend.apply(this, arguments);
  },
  toString: function() {
    var msg = this.$parent.$parent.toString.call(this);
    return util.format('[%s] %s',this.drive, msg);
  },
  make: "Jeep",
  drive: "4wd"
});

var Cherokee = Jeep.create({
  "model": "Cherokee",
  "color": "beige"
});

console.log(Cherokee.toString());

//some cars are faster than others
var FastCarMixin = {
  speed: "Fast",
  toString: function() {
    var msg = Car.toString.call(this);
    return util.format('[%s] %s', this.speed, msg);
  }
};

//Porsche Factory -- they are fast
var Porsche = Car.extend(FastCarMixin, {
  "make": "Porsche"
});

var Carrera = Porsche.extend({
  "model": "Carrera",
  "color": "yellow"
});

var Boxster = Porsche.extend({
  "model": "Boxster",
  "color": "babyblue"
});

console.log(Carrera.toString());
console.log(Boxster.toString());
