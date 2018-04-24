'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const mustache = require('mustache');
const querystring = require('querystring');
const axios = require('axios');
const multer = require('multer');
const upload = multer();
const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

function serve(port, base, model) {
  const app = express();
  app.locals.port = port;
  app.locals.base = base;
  app.locals.model = model;
  process.chdir(__dirname);
  app.use(base, express.static(STATIC_DIR));
  bodyParser.urlencoded({extended: false});
  setupTemplates(app);
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}


module.exports = serve;
const IMG_MSG = 'msg';
/******************************** Routes *******************************/

function setupRoutes(app) {
  const base = app.locals.base;
  app.get(`/index.html`,function (req, res) {
  res.sendFile(__dirname+'/index.html');
})
  app.get(`/Hide`, Hide(app));
  app.get(`/unHide`, unHide(app));
  app.post(`/HideSuccess`,upload.single(IMG_MSG),HideSuccess(app));
  app.post(`/unHideSuccess`,bodyParser.urlencoded({extended: false}),unHideSuccess(app));
}



function Hide(app) {
  return async function(req, res) {
    const list = await axios.get(app.locals.model+'/api/images/inputs');
const view = {
  images: [
   
  ]
};
 list.data.forEach(( v, i ) => {
    var obj =  {
      id: v,
      URL: app.locals.model+'/api/images/inputs/'+v+'.png',
      hideURL: app.locals.model+'/api/images/inputs/'+v
    }
view.images.push(obj);
   })  

     const html = mustache.render(app.templates['List'], view);
    res.send(html);;
  };
};




function HideSuccess(app) {
return async function(req, res) {
var {image , msg} = req.body;
var errmsg;
if(isBlank(image))
{
errmsg = "Please select radio buton";
}
if(isBlank(msg))
{
var Filemsg;
if(!isBlank(req.file))
{
 Filemsg= req.file.buffer.toString();
}
if(isBlank(Filemsg))
{
errmsg = "Please enter message in message box or upload file";
}
else
{
msg = Filemsg;
}
}
var data = {outGroup : 'steg' , msg : msg};
if(!isBlank(image)){
image= image.replace("images", "steg");

var hide = await axios.post(image,data);
var imglocation = hide.headers.location.substr(hide.headers.location.lastIndexOf('/') + 1);
}
else
{
errmsg = "Please select radio buton";
}
var html;
if(isBlank(errmsg))
{
const view = {msg : msg , imglocation : imglocation , hide : hide.headers.location};
 html = mustache.render(app.templates['hidesuccess'], view);
}
else
{

 var list = await axios.get(app.locals.model+'/api/images/inputs');
var view = {
  images: [
   
  ],
errmsg : errmsg
};
 list.data.forEach(( v, i ) => {
    var obj =  {
      id: v,
      URL: app.locals.model+'/api/images/inputs/'+v+'.png',
      hideURL: app.locals.model+'/api/images/inputs/'+v
    }
view.images.push(obj);
   })  

html = mustache.render(app.templates['List'], view);
}

res.send(html);
}
}




function unHide(app) {
  return async function(req, res) {
    var unhidelist = await axios.get(app.locals.model+'/api/images/steg');
var view = {
  images: [
   
  ]
};
 unhidelist.data.forEach(( v, i ) => {
    var obj =  {
      id: v,
      URL: app.locals.model+'/api/images/steg/'+v+'.png',
      unhideURL: app.locals.model+'/api/images/steg/'+v
    }
view.images.push(obj);
   })  
     const html = mustache.render(app.templates['unHideList'], view);
    res.send(html);
  };
};



function unHideSuccess(app) {
return async function(req, res) {
var errmsg;
if(!isBlank(req.body.image)){
var image = req.body.image;
image= image.replace("images", "steg");
var unhidemsg = await axios.get(image);

}
else
{
errmsg = "Please select radio buton";
}
var html;
if(isBlank(errmsg))
{

var view = {msg : unhidemsg.data.msg};
 html = mustache.render(app.templates['unhidesuccess'], view);
}
else
{
 var unhidelist = await axios.get(app.locals.model+'/api/images/steg');
var view = {
  images: [
   
  ],
errmsg : errmsg
};
 unhidelist.data.forEach(( v, i ) => {
    var obj =  {
      id: v,
      URL: app.locals.model+'/api/images/steg/'+v+'.png',
      unhideURL: app.locals.model+'/api/images/steg/'+v
    }
view.images.push(obj);
   })

 html = mustache.render(app.templates['unHideList'], view);
}
res.send(html);
}
}

function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}


function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

