'use strict';

const Ppm = require('./ppm');

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const MongoClient = require('mongodb').MongoClient;
const {promisify} = require('util'); //destructuring
 //TODO: add require()'s as necessary
const exec = promisify(require('child_process').exec);
const osTmpdir = require('os-tmpdir');
var im = require('imagemagick');


/** This module provides an interface for storing, retrieving and
 *  querying images from a database. An image is uniquely identified
 *  by two non-empty strings:
 *
 *    Group: a string which does not contain any NUL ('\0') 
 *           characters.
 *    Name:  a string which does not contain any '/' or NUL
 *           characters.
 *
 *  Note that the image identification does not include the type of
 *  image.  So two images with different types are regarded as
 *  identical iff they have the same group and name.
 *  
 *  Error Handling: If a function detects an error with a defined
 *  error code, then it must return a rejected promise rejected with
 *  an object containing the following two properties:
 *
 *    errorCode: the error code
 *    message:   an error message which gives details about the error.
 *
 *  If a function detects an error without a defined error code, then
 *  it may reject with an object as above (using a distinct error
 *  code), or it may reject with a JavaScript Error object as
 *  appropriate.
 */

function ImgStore(client, db)
{
this.client = client;
  this.db = db;
}

ImgStore.prototype.close = close;
ImgStore.prototype.get = get;
ImgStore.prototype.list = list;
ImgStore.prototype.meta = meta;
ImgStore.prototype.put = put;

/** Factory function for creating a new img-store.
 */
async function newImgStore() {
const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);
  return new ImgStore(client, db);
}
module.exports = newImgStore;

/** URL for database images on mongodb server running on default port
 *  on localhost
 */
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'image';
const IMAGES_TABLE = 'imagestable';
//List of permitted image types.
const IMG_TYPES = [
  'ppm',
  'png'
];


/** Release all resources held by this image store.  Specifically,
 *  close any database connections.
 */
async function close() {
 this.client.close();
}

/** Retrieve image specified by group and name.  Specifically, return
 *  a promise which resolves to a Uint8Array containing the bytes of
 *  the image formatted for image format type.
 *
 *  Defined Error Codes:
 *
 *    BAD_GROUP:   group is invalid (contains a NUL-character).
 *    BAD_NAME:    name is invalid (contains a '/' or NUL-character).
 *    BAD_TYPE:    type is not one of the supported image types.
 *    NOT_FOUND:   there is no stored image for name under group.
 */
async function get(group, name, type) {


  const errormsggrp = isBadGroup(group);
  if (errormsggrp)
    throw new ImgError(errormsggrp.errorCode ,errormsggrp.message);





const errormsgname = isBadName(name);
  if (errormsgname)
    throw  new ImgError(errormsgname.errorCode,errormsgname.message);






const errormsgtype = isBadType(type);
  if (errormsgtype)
    throw  new ImgError(errormsgtype.errorCode,errormsgtype.message);







  const imgId = toImgId(group, name, type);
  const dbTable = this.db.collection(IMAGES_TABLE);
const existingimg = await dbTable.findOne({ '_id' : imgId });

if (existingimg == undefined) {
    throw new ImgError("NOT_FOUND","file stored under " + group + " not found");
  }

else
{
  var arr = Object.values(existingimg.bytes);

return arr;

}

}
 /*
 *  The implementation of this function must not read the actual image
 *  bytes from the database.
 *
 *  Defined Errors Codes:
 *
 *    BAD_GROUP:   group is invalid (contains a NUL-character).
 */
async function list(group) {

  // isBadGroup(group);
    const dbTable = this.db.collection(IMAGES_TABLE);
    const result = [];
const cursor = dbTable.find({groupname : group});
  // Use `next()` and `await` to exhaust the cursor
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    result.push(doc.imgname);
  }
//console.log(result[0]+"lele");

if(result[1] == undefined)
{
throw  new ImgError("NOT_FOUND"," file stored under " + group + " not found");
}
else
{
return result;
}

}



/*
 *   a number giving the width of the image in pixels.
 *    height:        a number giving the height of the image in pixels.
 *    maxNColors:    a number giving the max # of colors per pixel.
 *    nHeaderBytes:  a number giving the number of bytes in the 
 *                   image header.
 *    creationTime:  the time the image was stored.  This must be
 *                   a number giving the number of milliseconds which 
 *                   have expired since 1970-01-01T00:00:00Z.
 *
 *  The implementation of this function must not read the actual image
 *  bytes from the database.
 *
 *  Defined Errors Codes:
 *
 *    BAD_GROUP:   group is invalid (contains a NUL-character).
 *    BAD_NAME:    name is invalid (contains a '/' or NUL-character).
 *    NOT_FOUND:   there is no stored image for name under group.
 */
async function meta(group, name) {
  //TODO: replace dummy return value

const errormsggrp = isBadGroup(group);

  if (errormsggrp)
  throw  new ImgError(errormsggrp.errorCode,errormsggrp.message);
 

 // return console.log(errormsggrp.errorCode + " : " + errormsggrp.message);

 const errormsgname = isBadName(name);
  if (errormsgname)
  throw  new ImgError(errormsgname.errorCode,errormsgname.message);


//    return console.log(errormsgname.errorCode + " : " + errormsgname.message);


const dbTable = this.db.collection(IMAGES_TABLE);



const existingimg = await dbTable.findOne({ groupname: group, imgname: name });


 if (existingimg != undefined) {
    var arr = Object.values(existingimg);
var i = 3;

  const info = { creationTime: Date.now() };
  return ['width', 'height', 'maxNColors', 'nHeaderBytes']
    .reduce((acc, e) => { acc[e] = arr[i];i++; return acc; }, info);
}
else
{
    throw  new ImgError("NOT_FOUND","file stored under " + group + " not found");

}

}

/** Store the image specified by imgPath in the database under the
 *  specified group with name specified by the base-name of imgPath
 *  (without the extension).  The resolution of the return'd promise
 *  is undefined.
 *
 *  Defined Error Codes:
 *
 *    BAD_GROUP:   group is invalid (contains a NUL-character).
 *    BAD_FORMAT:  the contents of the file specified by imgPath does 
 *                 not satisfy the image format implied by its extension. 
 *    BAD_TYPE:    the extension for imgPath is not a supported type
 *    EXISTS:      the database already contains an image under group
 *                 with name specified by the base-name of imgPath
 *                 (without the extension). 
 *    NOT_FOUND:   the path imgPath does not exist.
 * 
 */
async function put(group, imgPath) {

  const imgInfo = pathToNameExt(imgPath);

//console.log(os.tmpdir());


const errormsggrp = isBadGroup(group);
  if (errormsggrp)
   throw  new ImgError(errormsggrp.errorCode,errormsggrp.message); 
 // return console.log(errormsggrp.errorCode + " : " + errormsggrp.message);
const type= imgInfo[1];

const errormsgext = isBadExt(imgPath);
  if (errormsgext)
  throw  new ImgError(errormsgext.errorCode,errormsgext.message);

  const errormsgname = isBadName(imgInfo[0]);
  if (errormsgname)
  throw  new ImgError(errormsgname.errorCode,errormsgname.message);
 // return console.log(errormsgname.errorCode + " : " + errormsgname.message);



  const errormsgtype = isBadType(imgInfo[1]);
  if (errormsgtype)
  throw  new ImgError(errormsgtype.errorCode,errormsgtype.message);


  //  return console.log(errormsgtype.errorCode + " : " + errormsgtype.message);


  const errormsgpath = isBadPath(imgPath);
  if (errormsgpath)
  throw  new ImgError(errormsgpath.errorCode,errormsgpath.message);

   // return console.log(errormsgpath.errorCode + " : " + errormsgpath.message);

  const imgId = toImgId(group, imgInfo[0],imgInfo[1]);
  const imgname = imgInfo[0];
  const readFile = util.promisify(fs.readFile);
const dbTable = this.db.collection(IMAGES_TABLE);
//console.convert(imgPath,imgname+".ppm");
const destimgpath = imgname+".ppm";
im.convert([imgPath,destimgpath],
function(err, stdout){
  if (err) throw err;
  //console.log("ppm img created");
});

  const data = await readFile(destimgpath);

  const  ppm = new Ppm(imgId,new Uint8Array(data));
if(ppm.errorCode == 'BAD_FORMAT')
{
    return  console.log("BAD_FORMAT : bad image format");


}

var json = {
    '_id': imgId,
    'groupname':group,
    'imgname':imgname,
    'width': ppm.width,
      'height': ppm.height,
      'maxNColors': ppm.maxNColors,
      'nHeaderBytes': ppm.nHeaderBytes,
      'bytes':ppm.bytes,
}



const dups = [];
 try {
  const ret = await dbTable.insertOne(json);
}

catch (err) {
    if (isDuplicateError(err))
 {
 dups.push(imgId); 
   }
   else { throw err;
    }
}
if (dups.length > 0) {
    throw new ImgError('EXISTS', `Image ${dups} already exist`);
  }

return;

}


//Error utility functions



function isBadGroup(group) {
  return (group.trim().length === 0 || group.indexOf('\0') >= 0) &&
    new ImgError('BAD_GROUP', `bad image group ${group}`);
}
function isBadName(name) {
  return (name.trim().length === 0 ||
	  name.indexOf('\0') >= 0 || name.indexOf('/') >= 0) &&
    new ImgError('BAD_NAME', `bad image name '${name}'`);
}
function isBadExt(imgPath) {
  const lastDotIndex = imgPath.lastIndexOf('.');
  const type = (lastDotIndex < 0) ? '' : imgPath.substr(lastDotIndex + 
1);
  return IMG_TYPES.indexOf(type) < 0 &&
    new ImgError('BAD_TYPE', `bad image type '${type}' in path ${imgPath}`);
}
function isBadPath(path) {
  return !fs.existsSync(path) &&
    new ImgError('NOT_FOUND', `file ${path} not found`);
}
function isBadType(type) {
  return IMG_TYPES.indexOf(type) < 0 &&
    new ImgError('BAD_TYPE', `bad image type '${type}'`);
}
/** Build an image error object using errorCode code and error
 * message msg.
 */ 
function ImgError(code, msg) {
  this.errorCode = code;
  this.message = msg;
}
function isDuplicateError(err) {
  return (err.code === 11000);
}





//Utility functions
 const NAME_DELIM = '/', TYPE_DELIM = '.';
 /** Form id for image from group, name and optional type. */ 
function toImgId(group, name, type) {
  let v = `${group}${NAME_DELIM}${name}`;
  if (type) v += `${TYPE_DELIM}${type}`
  return v;
}
/** Given imgId of the form group/name return [group, name]. */
function fromImgId(imgId) {
  const nameIndex = imgId.lastIndexOf(NAME_DELIM);
  assert(nameIndex > 0);
  return [imgId.substr(0, nameIndex), imgId.substr(nameIndex + 1)];
}
/** Given a image path imgPath, return [ name, ext ]. */
 function pathToNameExt(imgPath) {
  const typeDelimIndex = imgPath.lastIndexOf(TYPE_DELIM);
  const ext = imgPath.substr(typeDelimIndex + 1);
  const name = path.basename(imgPath.substr(0, typeDelimIndex));
  return [name, ext];
}
