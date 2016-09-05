'use strict';

var UserLookup = function () {
};

//this function handles the "login" part where the user actually performs a login procedure, this function should tell if the info the user has provided is accurate
UserLookup.prototype.validate = function (req, callback) {

    // code to query user data should go there

    req.model.user.findOne({identifier: req.body.identifier}, function (err, user) {
        if (!err && user && user.samePassword(req.body.password)) {
            return callback(null, user);
        } else {
            var error = new Error('Identifiant ou mot de passe incorrect.');
            return callback(error);
        }
    });
};

//this function allows to format the user info to what the app needs and / or wants to send to the client
UserLookup.prototype.buildAndSendUserInfo = function (req, res, decryptedIdTokenObject) {
    //code needed to build the user information to send back when the userInfo endpoint is called
    req.model.user.findOne({id: decryptedIdTokenObject.sub}, function (err, user) {
        var pivotIdentityMembers = {
            'given_name': true,
            'family_name': true,
            'birthdate': true,
            'gender': true,
            'birthplace': true,
            'birthdepartment': true,
            'birthcountry': true,
            'preferred_username': true
        };
        if (req.check.scopes.indexOf('email') !== -1) {

            pivotIdentityMembers.email = true;
        }
        if (req.check.scopes.indexOf('address') !== -1) {
            pivotIdentityMembers.address = true;
        }
        if (req.check.scopes.indexOf('phone') !== -1) {
            pivotIdentityMembers.phone_number = true;
        }
        var pivotIdentity = {};
        pivotIdentity.sub = user.id;
        for (var member in pivotIdentityMembers) {
            if (pivotIdentityMembers.hasOwnProperty(member) && user.hasOwnProperty(member)) {
                pivotIdentity[member] = user[member];
            }
        }
        console.log(pivotIdentity);
        if (pivotIdentity.given_name) {
            res.json(pivotIdentity);
        } else {
            res.status(400).send();
        }
    });
};

module.exports = UserLookup;