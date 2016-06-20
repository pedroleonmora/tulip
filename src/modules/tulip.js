/*
  Creates a tulip canvas object from either UI interaction or the loading of a saved file
*/

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Tulip = Class({

  create: function(el, angle, json){
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;

    this.tracks = [];
    this.glyphs = [];
    this.activeEditors = [];

    this.initTulip(angle,json);
  },

  clear: function(){
    this.canvas.clear();
    this.entryTrack = null;
    this.entryTrackOrigin = null;
    this.exitTrack = null;
    this.exitTrackEnd = null;
  },

  /*
    Creates a tulip either from passed in json from a file load or from a angle provided by UI wpt creation
    TODO test this doesn't break under UI wpt creation
  */
  initTulip: function(angle,json){
    if(json !== undefined && angle == 0){ //the map point has been created from serialized json
      this.buildFromJson(json);
    } else if(angle !== undefined){
      this.buildEntry();
      this.buildExit(angle);
    }
  },

  initEntry: function(point, path){
    this.entryTrackOrigin = point;
    this.entryTrack = path;
    this.entryTrack.hasBorders = false;
    this.entryTrack.hasControls = false;
    this.entryTrackOrigin.track = this.entryTrack;
    this.entryTrack.origin = this.entryTrackOrigin;
  },

  initExit: function(point, path){
    this.exitTrack = path;
    this.exitTrack.hasBorders = false;
    this.exitTrack.hasControls = false;
    this.exitTrackEnd = point;
    this.exitTrackEnd.track = this.exitTrack
    this.exitTrack.end = this.exitTrackEnd;
  },

  initTracks: function(trackArray){
    this.tracks = trackArray;
    for(i=0;i<this.tracks.length;i++){
      this.tracks[i].hasControls = false;
      this.tracks[i].lockMovementX = true;
      this.tracks[i].lockMovementY = true;
      this.tracks[i].hasBorders = false;
      this.tracks[i].selectable = false;
    }
  },

  /*
    Adds a track to tulip from UI interaction
  */
  addTrack: function(angle) {

    var track = new fabric.Path(this.buildTrackPathString(angle),
                                              { fill: '',
                                              stroke: '#000',
                                              strokeWidth: 5,
                                              hasControls: false,
                                              lockMovementX: true,
                                              lockMovementY: true,
                                              hasBorders: false,
                                              selectable:false,
                                            });
    this.tracks.push(track);
    this.canvas.add(track);
    this.activeEditors.push(new TulipEditor(this.canvas, track, true, true, false));
    //NOTE this solves the problem of having overlapping handles if a control is clicked twice or things get too close to one another.
    //     an alternate solution that may solve any performance issues this might cause is to loop through the active editors and bring all the
    //     hangles to the front.
    this.finishEdit();
    this.beginEdit();
  },

  addGlyph: function(position,uri){
    var _this = this;
    var position = position;

    var imgObj = new Image();
    imgObj.src = uri;
    imgObj.onload = function () {
      var image = new fabric.Image(imgObj);
      image.top = position.top;
      image.left = position.left;
      image.scaleToWidth(75);
      _this.canvas.add(image);
      _this.glyphs.push(image);
    }
  },
  /*
    Builds the tulip from passed in JSON
  */
  buildFromJson: function(json){

    var _this = this;
    var numTracks = json.tracks.length;
    // build a propperly formatted json string to import
    var json = {
      "objects": [json.entry.point, json.entry.path, json.exit.path, json.exit.point].concat(json.tracks).concat(json.glyphs),
    };
    var obs = [];

    this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas), function(o, object) {
      obs.push(object);
      if(object.type == "image"){
          //if the object is an image add it to the glyphs array
          _this.glyphs.push(object);
      }
    });

    // TODO because the below are each requiring their own comment section means they could refactor into their own functions
    /*
      Default Tracks
    */
    this.initEntry(obs[0], obs[1]);
    this.initExit(obs[3], obs[2]);

    this.exitTrack.hasControls = this.entryTrack.hasControls = this.entryTrackOrigin.hasControls = this.exitTrackEnd.hasControls = false;
    this.exitTrack.lockMovementX = this.entryTrack.lockMovementX = this.entryTrackOrigin.lockMovementX = this.exitTrackEnd.lockMovementX = true;
    this.exitTrack.lockMovementY = this.entryTrack.lockMovementY = this.entryTrackOrigin.lockMovementY = this.exitTrackEnd.lockMovementY = true;
    /*
      Aux tracks
    */
    // slice and dice obs
    if(numTracks > 0){
      var tracks = obs.slice(4, 4 + numTracks);
      this.initTracks(tracks);
    }
  },

  buildEntry: function() {

    var entry = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90',
                                              { fill: '',
                                                stroke: '#000',
                                                strokeWidth: 5,
                                                hasControls: false,
                                                lockMovementX: true,
                                                lockMovementY: true,
                                                hasBorders: false
                                              });
    var point = new fabric.Circle({
      left: entry.path[0][1],
      top: entry.path[0][2],
      strokeWidth: 1,
      radius: 5,
      fill: '#000',
      stroke: '#666',
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });

    this.initEntry(point, entry);
    this.canvas.add(this.entryTrack);
    this.canvas.add(this.entryTrackOrigin)
  },

  buildExit: function(angle){
    var exit = new fabric.Path(this.buildTrackPathString(angle),
                                              { fill: '',
                                              stroke: '#000',
                                              strokeWidth: 5,
                                              hasControls: false,
                                              lockMovementX: true,
                                              lockMovementY: true,
                                              hasBorders: false
                                            });
    var point = new fabric.Triangle({
      left: exit.path[3][5],
      top: exit.path[3][6],
      strokeWidth: 1,
      height: 12,
      width: 12,
      fill: '#000',
      stroke: '#666',
      angle: angle,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });

    this.initExit(point, exit);
    this.canvas.add(this.exitTrack);
    this.canvas.add(this.exitTrackEnd);
  },


  /*
    TODO have different handlers for default paths (entry and exit) and ad hoc created objects and glyphs
  */
  beginEdit: function(event) {
    this.activeEditors.push(new TulipEditor(this.canvas, this.entryTrack,true, false, true));
    this.activeEditors.push(new TulipEditor(this.canvas, this.exitTrack,false, true, true));
    for(i=0;i<this.tracks.length;i++){
      this.activeEditors.push(new TulipEditor(this.canvas, this.tracks[i],true, true, false));
    }
  },

  /*
    Creates an SVG string form the assumption that we are originating at the point (90,90) and vectoring out from there at a given angle
    the angles is provided from the mapping module.
  */
  buildTrackPathString: function(angle) {

    var xy1 =  this.rotatePoint(9,angle);
    var xy2 =  this.rotatePoint(18,angle);
    var xy3 =  this.rotatePoint(27,angle);
    var set1 = [[xy1[0], xy1[1]],[xy2[0], xy2[1]],[xy3[0], xy3[1]]];

    xy1 =  this.rotatePoint(36,angle);
    xy2 =  this.rotatePoint(45,angle);
    xy3 =  this.rotatePoint(54,angle);
    var set2 = [[xy1[0], xy1[1]],[xy2[0], xy2[1]],[xy3[0], xy3[1]]];

    xy1 =  this.rotatePoint(63,angle);
    xy2 =  this.rotatePoint(72,angle);
    xy3 =  this.rotatePoint(81,angle);
    var set3 = [[xy1[0], xy1[1]],[xy2[0], xy2[1]],[xy3[0], xy3[1]]];

    var trackString = 'M 90 90 C '+ set1[0][0] +', '+ set1[0][1] +', '+ set1[1][0] +', '+ set1[1][1] +', '+ set1[2][0] +', '+ set1[2][1]
                        + ' C '+ set2[0][0] +', '+ set2[0][1] +', '+ set2[1][0] +', '+ set2[1][1] +', '+ set2[2][0] +', '+ set2[2][1]
                        + ' C '+ set3[0][0] +', '+ set3[0][1] +', '+ set3[1][0] +', '+ set3[1][1] +', '+ set3[2][0] +', '+ set3[2][1]

    return trackString;
  },

  finishEdit: function() {
    for(i = 0; i < this.activeEditors.length; i++) {
      this.activeEditors[i].destroy();
    }
    this.activeEditors = [];
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.deactivateAll().renderAll();
  },

  removeLastGlyph: function(){
    var glyph = this.glyphs.pop()
    this.canvas.remove(glyph);
  },

  removeLastTrack: function(){
    var track = this.tracks.pop()
    this.canvas.remove(track);
    for(i = 0; i < this.activeEditors.length; i++) {
      if(this.activeEditors[i].track == track){
        this.activeEditors[i].destroy();
      }
    }
  },

  /*
    The canvas is a 180px by 180px box with (0,0) being the top left corner. The origin of the exit track is at the point (90,90)

    The mapping module returns the angle of the turn with a positive value if it's a right turn and a negative value if it's a left turn

    This function takes a magnitude of a vector from a typical cartesian system with an origin of (0,0) and rotates that by the specified angle.
    (In other words, the y component of a vector which originates at the origin and parallels the y axis.)
    It then transforms the (x,y) components of the vector back to the weird (90,90) origin system and returns them as an array.
  */
  rotatePoint: function(magnitude,angle){

    var a = angle;
    angle = angle * (Math.PI / 180); //convert to radians
    //q1
    if(0 > a && a >= -90){
      var x = Math.round(magnitude * (Math.sin(angle)));
      var y = -Math.round(magnitude * (Math.cos(angle)));
    }
    //q2
    if(-90 > a && a >= -180){
      var x = Math.round(magnitude * (Math.sin(angle)));
      var y = -Math.round(magnitude * (Math.cos(angle)));
    }
    //q3
    if(90 < a && a <= 180){
      var x = Math.round(magnitude * (Math.sin(angle)));
      var y = -Math.round(magnitude * (Math.cos(angle)));
    }
    //q4
    if(0 <= a && a <= 90) {
      var x = Math.round(magnitude * (Math.sin(angle)));
      var y = -Math.round(magnitude * (Math.cos(angle)));
    }

    return [x + 90, y + 90]
  },

  /*
    return the canvas object as JSON so it can be persisted
  */
  serialize: function(){
    var json = {
      entry: {
        point: this.entryTrackOrigin,
        path: this.entryTrack
      },
      exit: {
        point: this.exitTrackEnd,
        path: this.exitTrack
      },
      tracks: this.tracks,
      glyphs: this.serializeGlyphs(),
    };
    return json;
  },

  serializeGlyphs: function(){
    var glyphsJson = [];
    // NOTE not sure, but again here the for loop doesn't error out like the for each
    // for(i=0;i<this.glyphs.length;i++){
    for(glyph of this.glyphs) {
      // glyphsJson.push(this.glyphs[i].toJSON());
      glyphsJson.push(glyph.toJSON());
    }
    return glyphsJson;
  },

  toPNG: function(){
    return this.canvas.toDataURL();
  },

});
