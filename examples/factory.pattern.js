
//Marker Model
var Marker = (function() {

  return {

    //initialize a marker
    init: function(config) {

      var instance = Object.create(this);
      var cfg = config || {};

      instance.type = cfg.type || 'default';
      instance.image = cfg.image;
      instance.lat = cfg.lat || cfg.latitude || 0;
      instance.lng = cfg.lng || cfg.longitude || 0;

      return instance;
    },

    //return the image used in the map
    getImage: function() {
      var path = '/path/to/image/';
      var image = this.image || 'map-marker.png';

      return path + image;
    },

    //get the type
    getType: function() {
      return this.type.toUpperCase();
    },

    //easy printout
    toString: function() {
      return this.getType() + '(' + this.lat + ', ' + this.lng + ')';
    }
  }

})();

//the default
var DefaultMarker = function(params) {
  return Marker.init(params);
};

//indicates a house on a map
var HouseMarker = function(params) {

  params.type = 'house';
  params.image = 'green-house.png';

  return Marker.init(params);
};

//indicates a landmark on a map using a flag
var FlagMarker = function(params) {

  params.type = 'flag';
  params.image = 'green-flag.png';

  return Marker.init(params);
};


//create markers by the dozens
var MarkerFactory = (function() {

  //handy map of all the various marker types
  //NOTE: this is cleaner than if/elseif/else
  var markers = {
    house: HouseMarker,
    flag: FlagMarker,
    default: DefaultMarker
  };

  return {
    create: function(type, params) {
      var marker = markers[type]; //stash the marker

      //if we have a valid type, use it, otherwise default
      return marker ? marker(params) : markers['default'].call(null, params);
    }
  };

})();



var house1 = MarkerFactory.create('house', {lat: -31, lng: 102});
var house2 = MarkerFactory.create('house', {lat: -10, lng: 20});
var flag1 = MarkerFactory.create('flag', {lat: -32, lng: 104});
var default1 = MarkerFactory.create();

console.log(house1.toString());
console.log(house2.toString());
console.log(flag1.toString());
console.log(default1.toString());
