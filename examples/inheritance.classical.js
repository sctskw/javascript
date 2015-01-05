#!/usr/bin/env node
/*jshint unused: false */
var util = require('util');
var _ = require('lodash');

////Classical
function Car(make, model, color) {
  this.make = make;
  this.model = model;
  this.color = color;
}

Car.prototype.toString = function() {
  return util.format('%s - %s (%s)', this.make, this.model, this.color);
};

Car.prototype.constructor = Car;

var carA = new Car('Honda', 'Civic', 'red');
console.log(carA.toString());


//constructor hijacking
function Honda(model, color) {
  Car.call(this, 'Honda', model, color); //construct
}
Honda.prototype = new Car(); //hijack proto

//
var carB = new Honda('Civic', 'blue');
console.log(carB.toString());

//extender!
function extend(subClass, superClass) {
  var Constructor = function(){}; //constructor fn
  Constructor.prototype = superClass.prototype; //hijack prototype
  subClass.prototype = new Constructor(); //construct prototype
  subClass.prototype.constructor = subClass; //cache constructor
  subClass.superclass = superClass.prototype; //cache super prototype

  if(superClass.prototype.constructor === Object.prototype.constructor) {
    superClass.prototype.constructor = superClass;
  }

}

//construct new subclass declaratively
function Toyota(model, color) {
  Car.call(this, 'Toyota', model, color); //this still works
}

//construct new subclass anonymously
function Subaru(model, color) {
  Subaru.superclass.constructor.call(this, 'Subaru', model, color); //more generic
}

extend(Toyota, Car); //extend!
extend(Subaru, Car); //extend!

var carC = new Toyota('Tacoma', 'black');
var carD = new Subaru('Forrester', 'green');

console.log(carC.toString());
console.log(carD.toString());
