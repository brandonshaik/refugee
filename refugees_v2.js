"use strict";

var seekColor = '#ff6d1a';
var escapeColor = '#14babd';

var seekData;
var escapeData;
var countries;
var currentYear = '2006';

var bounds = { };


var combined;
var count;

var mousedIndex = -1;


function SoftFloat(value){
  this.value = value || 0;
  this.attraction = .2;
  this.damping = .5;
  this.epsilon = .001;
  
  this.velocity = 0;
  this.acceleration = 0;
  
  this.atTarget = true;
  this.callback = false;
  this.target = this.value;
  
}

SoftFloat.prototype.update = function(){
  if(!this.atTarget){
  this.acceleration += this.attraction * (this.target - this.value);
    this.velocity = (this.velocity + this.acceleration) * this.damping;
    this.value += this.velocity;
    this.acceleration = 0;
    if (abs(this.velocity) > this.epsilon && abs(this.value - this.target) > this.epsilon) {
      // we are still updating
      return true;
    }
    this.value = this.target;
    this.atTarget = true;
    if (this.callback){
      this.callback();
    }
  }
  return false;
}

SoftFloat.prototype.setTarget = function(t) {
  this.atTarget = false;
  this.target = t;
}
  
  
function CountryData(code, name, seek, escape){
  this.code = code;
  this.name = name;
  this.seekData = seek;
  this.escapeData = escape;
  if( "Afghanistan" == name) {
    print(seek, escape);
  }
}  
  
CountryData.prototype.setPosition = function(x,y){
  this.x = new SoftFloat(x);
  this.y = new SoftFloat(y);
  this.my = new SoftFloat(y);
  this.fy = new SoftFloat(y);
}

CountryData.prototype.moveTo = function(x) {
  this.x.setTarget(x);
}

CountryData.prototype.setYear = function(yr){
  this.seek = this.seekData[yr];
  this.escape = this.escapeData[yr];
  
  var fy = map(this.seek, 0,1044462, bounds.bottom, bounds.top);
  var my = map(this.escape, 0, 5524333, bounds.bottom, bounds.top);
  
  this.fy.setTarget(fy);
  this.my.setTarget(my);
  this.gap = this.seek - this.escape;
}

CountryData.prototype.update = function(){
  this.x.update();
  this.fy.update();
  this.my.update();

}
 
 
CountryData.prototype.draw = function(yr) {
  var x = this.x.value;
  var fy = this.fy.value;
  var my = this.my.value;
  line(x, fy, x, my);
  noStroke();
  fill(seekColor);
  ellipse(x,fy,2,2);
  fill(escapeColor);
  ellipse(x,my,2,2);
}

function preload() {
  countries = loadJSON('data/countries.json');
  seekData = loadJSON('data/seek.json');
  escapeData = loadJSON('data/escape.json');
}


function setup() {
  createCanvas(960, 540);
  ellipseMode(RADIUS);
  
  bounds.left = 50;
  bounds.right = width - bounds.left;
  bounds.top = 75;
  bounds.bottom = height - 75;
  
  removeIncompleteCountries(seekData);
  removeIncompleteCountries(escapeData);
  
  var fd;
  var md;
  var code;
  
  combined = [];
  
  for (code in countries) {
    fd = seekData[code];
    md = escapeData[code];
    if (fd && md) {
      combined.push(new CountryData(code, countries[code], fd, md));
    }
  } 
  
  count = combined.length;
  
  combined.sort(byGap);
  
  var buttonSeek = createDiv("sort by people seeking refuge in the country");
  buttonSeek.mouseClicked(function() {
    combined.sort(bySeek);
    moveToSortPosition()
    loop();
  });
  
  var buttonEscape = createDiv("sort by people escaping the country");
  buttonEscape.mouseClicked(function() {
    combined.sort(byEscape);
    moveToSortPosition()
    loop();
  }); 
  
  var buttonGap = createDiv("sort by gap");
  buttonGap.mouseClicked(function() {
    combined.sort(byGap);
    moveToSortPosition()
    loop();
  });  
  
   buttonSeek.addClass('button');
   buttonEscape.addClass('button');
   buttonGap.addClass('button');
  
  var i;
  var country;
  var midY = bounds.top + (bounds.bottom - bounds.top) /2;
  for (i = 0; i < count; i++) {
    country = combined[i];
    var x = map(i, 0, count-1, bounds.left, bounds.right);
    country.setPosition(x, midY);
    country.setYear(currentYear);
  }

  }

function moveToSortPosition(){
  var i;
  for (i = 0; i < count; i++) {
    combined[i].moveTo(map(i,0, count-1, bounds.left, bounds.right));
  }
}



// remove countries that have missing data
function removeIncompleteCountries(sourceData) {
  for (var countryCode in countries) { 
    if (missingData(sourceData, countryCode)) {
      print('Removing ' + countries[countryCode] + ' due to missing data');
      delete countries[countryCode];
    }
  }
}

function missingData(sourceData, countryCode) {
  // is there any data at all for this country?
  if (!(countryCode in sourceData)) {
    return true;
  }
  
  var countryData = sourceData[countryCode];
  // now check whether each year is available for this country
  for (var yr = 2006; yr <= 2016; yr++) {
    if (!(yr in countryData)) {
      return true;
    }
  }
  // no missing data
  return false;
}


function byName(a, b) {
  return a.name.localeCompare(b.name);
}

function byGap(a, b) {
  var result = a.gap - b.gap;
  if (0 == result) {
    result = a.seek - b.seek;
  }
  return result;
}

function bySeek(a, b) {
  var result = a.seek - b.seek;
  if (0 == result) {
    result = a.gap - b.gap;
  }
  return result;
}


function byEscape(a, b) {
  var result = a.escape - b.escape;
  if (0 == result) {
    result = a.gap - b.gap;
  }
  return result;
}
  
  



function draw() {
  background('#2e5f7f');
  
  strokeWeight(1);
  stroke(255, 128);
  var country;
  for (var i = 0; i < count; i++) {
    country = combined[i];
    country.update();
    if (i == mousedIndex) {
      fill(255);
      text(country.name, country.x.value, bounds.bottom - 25);
      stroke(255);
      country.draw(); 
      
    } else {
      stroke(255, 128);
      country.draw();
    }
    
  }
  //noLoop();
}

function mouseMoved(){
  var index = -1;
  if (mouseX < bounds.left) {
    if (mouseX >= bounds.left - 25) {
      index = 0;
    }
  } else if (mouseX < bounds.left) {
    if (mouseX <= bounds.right + 25) {
      index = count-1;
    }
  } else {
    index = round(map(mouseX,bounds.left, bounds.right,0, count-1));
  }
  if (index != mousedIndex) {
    mousedIndex = index;
    loop();
  }
}