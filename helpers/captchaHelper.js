'use strict';
var https = require('https'),
    configManager = new (require('./configManager.js'))();

var CaptchaHelper = {};

CaptchaHelper.getCpatchaValidationResponse = function (req, callback) {
    var options = {
        hostname: 'www.google.com',
        path: '/recaptcha/api/siteverify?secret='+configManager.getRecaptchaSecret()+'&response=' + req.body['g-recaptcha-response'],
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    var captchaResponse = '';

    var captchaReq = https.request(options, function (res){
        res.on('data', function(data){
            captchaResponse += data;
        });
        res.on('end', function(){
            captchaResponse = JSON.parse(captchaResponse);
            callback(null, captchaResponse)
        })
    });
    captchaReq.on('error', function(e) {
        console.error(e);
        callback(e, null);
    });
    captchaReq.end();
};

module.exports = CaptchaHelper;
