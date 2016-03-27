var http = require('http');
var url = require('url');
var express = require('express');
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var Cookies = require( "cookies" )

mailalias=process.env.mailalias;
mailpassword=process.env.mailpassword;
mailhost=process.env.mailhost;
mailport=process.env.mailport;

if (process.env.VCAP_SERVICES)
{
var services = JSON.parse(process.env.VCAP_SERVICES);
var orchestrateConfig = services["orchestrate"];
if (orchestrateConfig) {
var node = orchestrateConfig[0];
orchestrate_api_key = node.credentials.ORCHESTRATE_API_KEY
orchestrate_api_endpoint = node.credentials.ORCHESTRATE_API_HOST
}};
var db = require("orchestrate")(orchestrate_api_key,orchestrate_api_endpoint);

function starter() {
      db.put('tusers', 'xyz', '{"username": "xyz", "hash": "123", "statusr": "inactive"}', true).then(console.log('up!'))
}
//start login functions
function loggIn(user,passw,cb){
     if (user==='' || user==undefined|| !user){user='dummy'};
     if (user != 'dummy') {
db.get('tusers', user)    
.then(function (result) {
     if (result.body.password == passw && result.body.statusr == 'active'){
     var hash2 = Math.random();var hasher = (hash2 * 100000000000000000);
db.newPatchBuilder('tusers', user)
  .replace('hash', hasher)
  .apply()
  .then(cb(hasher))
}
     if (result.body.password != passw){cb(1)}
     if (result.body.statusr != 'active'){cb(2)}
     if (result.body.username==undefined) {cb(3)}
     if (result==undefined) {cb(3)}
}).fail(function (err) {console.log(err);cb('none')})
}}

function checker(user,hash,cb){
     if (user==='' || user==undefined|| !user){user='dummy'};
     if (user != 'dummy') {
db.get('tusers', user)    
.then(function (result) {
     console.log(result.body.hash +' '+result.body.statusr)
     if (result.body.hash == hash && result.body.statusr == 'active'){console.log('true');cb("true")}
      else {console.log('false-'+result.body.hash+'|'+hash);cb('false')}
}
)} else {console.log('false-'+user+hash);cb('false')} }

function activateAct(user,hash) {
  db.get('tusers', user)
  .then(function (result) {
    if (result.body.hash == hash){
   db.newPatchBuilder('tusers', user)
  .replace('statusr', 'active')
  .apply()
}})
.fail(function (err) {console.log(err)})
};

function rpw1(user,cb){
 db.get('tusers', user )
.then(function (result) {
    if (result.body.username == user)
    {var hash1 = Math.random();var hasher = (hash1 * 100000000000000000);
 db.newPatchBuilder('tusers', user)
  .replace('hash', hasher)
  .apply()
  .then(function (result) {
    cb('Please check your email for a password reset link.')
    mailpw(user,hasher);
  })} 
  if (result==undefined||! result) {cb('Email not found.')}
     console.log(result.body.username)
}).fail(function (err) {console.log(err);cb("Email not found.")})
  }

function rpw2(user,hash,cb){
      db.get('tusers', user )
.then(function (result) { 
if (result.body.username==user&&result.body.hash==hash)
{cb('true')}
else
{cb('false')}
})}

function rpw3(user,hash,passw1,cb){
      db.get('tusers', user )
.then(function (result) { 
if (result.body.username==user&&result.body.hash==hash)
{db.newPatchBuilder('tusers', user)
  .replace('password', passw1)
  .apply()
  .then(function (result) {console.log('pwreset');cb('Password Reset!')})}
else
{cb('Bad Hash, Man.')}
})}


function newuser(user,passw,cb) {
     if (user == undefined || passw ==undefined) {cb('Please Choose a Username and a Password.')}
db.get('tusers', user )
.then(function(response){cb('Username Taken.')})
.fail(function (result) { 
var hash1 = Math.random();
var hash = (hash1 * 100000000000000000);
var jsonString = "{\"username\":\"" +user+ "\", \"password\":\""+passw+"\", \"statusr\":\""+"inactive"+"\", \"hash\":\""+hash+"\" }";
var jsonObj = JSON.parse(jsonString);
db.put('tusers', user, jsonObj, false)
.then(function (result) {
mailer(user,hash);
cb('You will receive an email to activate this account.');
})
})
}

function mailer(mail,hash){ 
var transporter = nodemailer.createTransport(smtpTransport({
    host: mailhost,
    port: mailport,
    auth: {
        user: mailalias,
        pass: mailpassword
    }}));
transporter.sendMail({
    from: 'ZZRJ1-relay@t3mx.com',
    to: mail,
    subject: 'Please confirm your PBandJ account',
    html: 'Please click the link to confirm your new PBandJ account<br><a href=http://pbandj.uswest.appfog.ctl.io/?o=act&user='+mail+'&hash='+hash+' >http://pbandj.uswest.appfog.ctl.io/?o=act&user='+mail+'&hash='+hash+'</a>'
});
console.log(mail);
}

function mailpw(mail,hash){ 
var transporter = nodemailer.createTransport(smtpTransport({
    host: mailhost,
    port: mailport,
    auth: {
        user: mailalias,
        pass: mailpassword
    }}));
transporter.sendMail({
    from: 'ZZRJ1-relay@t3mx.com',
    to: mail,
    subject: 'Please reset your Zeitung password',
    html: 'Please click the link to reset your PBandJ password<br><a href=http://pbandj.uswest.appfog.ctl.io/?o=resetpw2&user='+mail+'&hash='+hash+' >http://pbandj.uswest.appfog.ctl.io/?o=resetpw2&user='+mail+'&hash='+hash+'</a>'
});
console.log(mail);
}
//end login functions

//start page functions
function putter(keyer,cid,csz,cpr,cty,cb) {
var jsonString = "{\"circuitid\":\"" +cid+ "\", \"circuitsize\":\""+csz+"\", \"circuitprovider\":\""+cpr+"\", \"circuittype\":\""+cty+"\"}";
var jsonObj = JSON.parse(jsonString);
db.put('circuits', keyer, jsonObj, false);
 cb("success :!");
};

function getter(cb) {
db.list('circuits')
.then(function (result) {
  var items = result.body.results;
  cb(JSON.stringify(items, ['path', 'key', 'value', 'circuitid', 'circuitsize', 'circuitprovider', 'circuittype']));
})};

function remover(keyer, cb) {
db.remove('circuits', keyer, true);
 cb("successfully removed :!");
};

//end page functions

function send404(response) {
response.writeHead(404, {"Content-type" : "text/plain"});
response.write("Error 404: resource not found");
response.end();
}
function sendPage(response, filePath, fileContents) {
response.writeHead(200, {"Content-type" : mime.lookup(path.basename(filePath))});
response.end(fileContents);
}
function serverWorking(response, absPath) {
fs.exists(absPath, function(exists) {
if (exists) {
fs.readFile(absPath, function(err, data) {
if (err) {
send404(response)
} else {
sendPage(response, absPath, data);
}
});
} else {
send404(response);
}
});
}
//start server!
starter();
var server = http.createServer(function(request, response) {
var queryData = url.parse(request.url, true).query;


//this creates a new user
if (queryData.o == "nu") {
response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
newuser(queryData.user, queryData.passw, function(resp)
{response.write(resp);response.end();
}); }
//this is the first resetpw
if (queryData.o == "resetpw1") {
   rpw1(queryData.user,  function(resp) {
   // response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
    response.write(resp);response.end();
   } 
)}
//this is the second resetpw
if (queryData.o == "resetpw2") {
     rpw2(queryData.user, queryData.hash, function(resp) {
     if (resp == 'true'){ 
       var cookies = new Cookies( request, response )
       cookies.set( "email", queryData.user, { httpOnly: false } );
       cookies.set( "hash", queryData.hash, { httpOnly: false } );
      serverWorking(response, './public/resetpw2.html')
     }
  else {serverWorking(response, './public/resetpw1.html')}     
})}
//this is the third resetpw
if (queryData.o == "resetpw3") {
   rpw3(queryData.user,queryData.hash,queryData.passw1,  function(resp) {
    response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
    response.write(resp);response.end();
   } 
)}
//this logs in a user
if (queryData.o == "logg") {
loggIn(queryData.user, queryData.passw, function(resp)
{console.log(queryData.user+'|'+ queryData.passw)
if (resp != "" && resp !=1 && resp !=2 && resp !=3 && resp!="none"){
var cookies = new Cookies( request, response )
      cookies.set( "email", queryData.user, { httpOnly: false } );
      cookies.set( "hash", resp, { httpOnly: false  } );
  response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
  response.write("go"+"|"+queryData.user+"|"+resp)
  response.end();
}
  if (resp==1) {response.write("Password Doesn't Match.")
        response.end();
  }
  if (resp==2) {response.write("Login Not Active.")
        response.end();
  }
  if (resp==3) {response.write("Login Not Found")
        response.end();
  }
if (resp == "none") {response.write('Login or Password not found.')
response.end();
}
      
}); }

//this logs out a user
if (queryData.o == "loggout") {

var cookies = new Cookies( request, response )
      cookies.set( "email", "", { httpOnly: false  } );
      cookies.set( "hash", "", { httpOnly: false  } );
  response.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
  response.write("loggedout")
  response.end();
}

//this activates an account
if (queryData.o == "act" ) {
hash1=queryData.hash
user1=queryData.user
activateAct(user1,hash1);
filePath = "public/login.html";
var absPath = filePath;
serverWorking(response, absPath); 
}

//this one sends the page!
if (queryData.o == "" || ! queryData.o ) {
filePath = "";
if (request.url == "/index.html"||request.url == "index.html"||request.url=="/"||request.url==""||request.url=="public/index.html"||!request.url||request.url==undefined) {
          var cookies = new Cookies( request, response )
          var em1='dummy'
          var ha1='123'
          em1=cookies.get("email")
         if (em1 != undefined){
          em1=em1.replace('%40', '@')
          ha1=cookies.get("hash")
          console.log(em1+ha1);
               checker(em1, ha1, function(resp) {
               if (resp == "true"){filePath = "public/index.html";absPath = "./" + filePath;serverWorking(response, absPath)}
               else {filePath = "public/login.html";absPath = "./" + filePath;serverWorking(response, absPath)}
               })
               
         }
          else {filePath = "public/login.html";absPath = "./" + filePath;serverWorking(response, absPath)}
         
               }
else {filePath = "public" + request.url;
absPath = "./" + filePath;
console.log(absPath)
serverWorking(response, absPath)
} }
//end server!
}).listen(process.env.VCAP_APP_PORT);

