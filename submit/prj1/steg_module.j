#!/usr/bin/env nodejs

'use strict';

const Ppm = require('./ppm');

/** prefix which always precedes actual message when message is hidden
 *  in an image.
 */
const STEG_MAGIC = 'stg';

/** Constructor which takes some kind of ID and a Ppm image */
function StegModule(id, ppm) {
  this.id = id;
  this.ppm = ppm;
}

/** Hide message msg using PPM image contained in this StegModule object
 *  and return an object containing the new PPM image.
 *
 *  Specifically, this function will always return an object.  If an
 *  error occurs, then the "error" property of the return'd object
 *  will be set to a suitable error message.  If everything ok, then
 *  the "ppm" property of return'd object will be set to a Ppm image
 *  ppmOut which is derived from this.ppm with msg hidden.
 *
 *  The ppmOut image will be formed from the image contained in this
 *  StegModule object and msg as follows.
 *
 *    1.  The meta-info (header, comments, resolution, color-depth)
 *        for ppmOut is set to that of the PPM image contained in this
 *        StegModule object.
 *
 *    2.  A magicMsg is formed as the concatenation of STEG_MAGIC,
 *        msg and the NUL-character '\0'.
 *
 *    3.  The bits of the character codes of magicMsg including the
 *        terminating NUL-character are unpacked (MSB-first) into the
 *        LSB of successive pixel bytes of the ppmOut image.  Note
 *        that the pixel bytes of ppmOut should be identical to those
 *        of the image in this StegModule object except that the LSB of each
 *        pixel byte will contain the bits of magicMsg.
 *
 *  The function should detect the following errors:
 *
 *    STEG_TOO_BIG:   The provided pixelBytes array is not large enough 
 *                    to allow hiding magicMsg.
 *    STEG_MSG:       The image contained in this StegModule object may already
 *                    contain a hidden message; detected by seeing
 *                    this StegModule object's underlying image pixel bytes
 *                    starting with a hidden STEG_MAGIC string.
 *
 * Each error message must start with the above IDs (STEG_TOO_BIG, etc).
 */
StegModule.prototype.hide = function(msg) {
  //TODO: hide STEG_MAGIC + msg + '\0' into a copy of this.ppm
var hexapixelbinaryarray = [],hexamsgarray = [],
k = 0,msgarray = [],binaryarray = [],j = 0;
//console.log("lol..............");
var newimg = this.ppm.pixelBytes;

//msg = msg.replace(/'/g,'');

msg = "stg"+msg;
//console.log(this.ppm.pixelBytes);

//console.log(msg);

msgarray = msg.split('');
 msgarray.forEach(( v, i ) => {

  hexamsgarray.push (v.charCodeAt(j).toString(16));
 })
hexamsgarray.push('00');
//console.log(hexamsgarray);
hexamsgarray.forEach(( v,i) => {
binaryarray.push(parseInt(v, 16).toString(2));
})
//console.log(binaryarray);

 this.ppm.pixelBytes.forEach(( v, i ) => {
    hexapixelbinaryarray.push (parseInt(v & 1, 10).toString(16));
   })

//console.log(hexapixelbinaryarray);
//console.log(this.ppm.pixelBytes);
binaryarray.forEach(( v,i) => {
//if(v.length == 7){v = '0' + v;}
//if(v.length == 6){v = '0' + v;}

while(v.length != 8)
{
v = '0'+v;
}
//console.log(v);

let bitsarray = v.split('');

if(bitsarray.length == 1)
{
while(bitsarray.length != 8)
{
bitsarray.push('0');
}
}
//console.log(bitsarray);

bitsarray.forEach((v,i) => {
if(hexapixelbinaryarray[k] != v)
{
hexapixelbinaryarray[k] = v;
newimg[k] = newimg[k] + 1;
}
//console.log("new lsb bits :" +hexapixelbinaryarray[k]+"  msg binary bits  "+v);
//console.log(this.ppm.pixelBytes);

k++;

})

})

this.ppm.pixelBytes = newimg;
//console.log(hexapixelbinaryarray);
//this.ppm.push(hexamsgarray);
  //construct copy as shown below, then update pixelBytes in the copy.
  return { ppm: new Ppm(this.ppm)};
}

/** Return message hidden in this StegModule object.  Specifically, if
 *  an error occurs, then return an object with "error" property set
 *  to a string describing the error.  If everything is ok, then the
 *  return'd object should have a "msg" property set to the hidden
 *  message.  Note that the return'd message should not contain
 *  STEG_MAGIC or the terminating NUL '\0' character.
 *
 *  The function will detect the following errors:
 *
 *    STEG_NO_MSG:    The image contained in this Steg object does not
 *                    contain a hidden message; detected by not
 *                    seeing this Steg object's underlying image pixel
 *                    bytes starting with a hidden STEG_MAGIC
 *                    string.
 *    STEG_BAD_MSG:   A bad message was decoded (the NUL-terminator
 *                    was not found).
 *
 * Each error message must start with the above IDs (STEG_NO_MSG, etc).
 */
StegModule.prototype.unhide = function() {
  //TODO


var hexapixelarray = [],binaryarray = [],temparray = [],
msghexaarray =[],msgarray = [],count = 0,message = '';

//console.log(this.ppm.pixelBytes);
 this.ppm.pixelBytes.forEach(( v, i ) => {
    hexapixelarray.push (parseInt(v & 1, 10).toString(16));
   })
hexapixelarray.forEach(( v, i ) => {
    temparray.push(v);

if(count == 7)
{
binaryarray.push(temparray.join(''));
temparray = []; 
count = 0;
}
else
{
count++;
}
})

var string,i = 0;
while(binaryarray[i] != 0)
{
msghexaarray.push(parseInt(binaryarray[i],2).toString(16));
//console.log(binaryarray[i]);
i++;}
//console.log(binaryarray[i]);
msghexaarray.forEach(( v, i ) => {
msgarray.push (String.fromCharCode(parseInt(v, 16)));
})

//console.log("value of i"+i+"    binaryarraylength =  "+binaryarray.length);




string = msgarray.join('');
//console.log(string);

var stg = string.slice(0,2);
console.log(stg);
var stringmsg = string.slice(3);
if(i==binaryarray.length)
{
return {error: "STEG_BAD_MSG : "+this.id+" A bad message was decoded "};
}
else if(stg  != 'stg')
{
return {error:"STEG_NO_MSG : "+this.id+" image does not have a message"};
}
  return { msg: stringmsg  };
}



module.exports = StegModule;


