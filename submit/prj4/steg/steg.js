'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const mustache = require('mustache');
const querystring = require('querystring');
const axios = require('axios');

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

function serve(port, base, model) {
  const app = express();
  app.locals.port = port;
  app.locals.base = base;
  app.locals.model = model;
  process.chdir(__dirname);
  app.use(base, express.static(STATIC_DIR));
  setupTemplates(app);
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}


module.exports = serve;

/******************************** Routes *******************************/

function setupRoutes(app) {
  const base = app.locals.base;
  app.get(`/index.html`,function (req, res) {
  res.sendFile(__dirname+'/index.html');
})
  app.get(`/Hide`, Hide(app));
  app.get(`/unHide`, unHide(app));
  app.post(`/HideSuccess`,bodyParser.urlencoded({extended: false}),HideSuccess(app));
  app.post(`/unHideSuccess`,bodyParser.urlencoded({extended: false}),unHideSuccess(app));
}



function Hide(app) {
  return async function(req, res) {
    const list = await axios.get('http:\/\/localhost:1234/api/images/inputs');
const view = {
  images: [
   
  ]
};
 list.data.forEach(( v, i ) => {
    var obj =  {
      id: v,
      URL: 'http:\/\/localhost:1234/api/images/inputs/'+v+'.png',
      hideURL: 'http:\/\/localhost:1234/api/images/inputs/'+v
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
const data = {outGroup : 'steg' , msg : msg};
image= image.replace("images", "steg");
const hide = await axios.post(image,data);
const imglocation = hide.headers.location.substr(hide.headers.location.lastIndexOf('/') + 1);
const view = {msg : msg , imglocation : imglocation , hide : hide.headers.location};
const html = mustache.render(app.templates['hidesuccess'], view);
res.send(html);
}
}




function unHide(app) {
  return async function(req, res) {
    const unhidelist = await axios.get(app.locals.model+'/api/images/steg');
const view = {
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
//console.log(unhidelist.data[0]);
//res.end();
  };
};



function unHideSuccess(app) {
return async function(req, res) {
var image = req.body.image;
console.log(image);
image= image.replace("images", "steg");
const unhidemsg = await axios.get(image);
console.log(unhidemsg.data.msg);
const view = {msg : unhidemsg.data.msg};
const html = mustache.render(app.templates['unhidesuccess'], view);
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


function doMustache(app, templateId, view) {
  const templates = { footer: app.templates.footer };
  return mustache.render(app.templates[templateId], view, templates);
}

