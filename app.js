'use strict';

var crypto = require('crypto'),
    express = require('express'),
    session = require('express-session'),
    http = require('http'),
    path = require('path'),
    rs = require('connect-mongo')(session),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    errorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    configManager = new (require('./helpers/configManager.js'))(),
    userLookup = new (require('./helpers/userLookup.js'))(),
    captchaHelper = require('./helpers/captchaHelper.js');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

var mongoose = require('mongoose');
mongoose.connect(configManager.getReplicationHosts(), configManager.getOptions());
app.use(session({
    cookie: {path: '/', httpOnly: true, secure: false, maxAge: 5000},
    store: new rs({mongoose_connection: mongoose.connection}),
    secret: 'Some Secret!!!'
}));

var options = {
    login_url: '/my/login',
    consent_url: '/user/consent',
    scopes: {
        foo: 'Access to foo special resource',
        bar: 'Access to bar special resource'
    },
//when this line is enabled, user email appears in tokens sub field. By default, id is used as sub.
    models: {
        user: {
            attributes: {
                sub: function () {
                    return this.id;
                }
            }
        }
    },
    app: app
};
var oidc = require('./openid-connect-provider.js').oidc(options);

var DGFIP_FIELDS = ['dgfip_rfr', 'dgfip_nbpac', 'dgfip_sitfam', 'dgfip_nbpart', 'dgfip_aft'];

app.set('port', process.env.PORT || 3042);
app.use(logger('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser('Some Secret!!!'));

app.get('/', function (req, res) {
    res.redirect('/my/login');
});

app.get('/my/login', function (req, res) {
    if (configManager.getIdentityProvider() === 'ameli') {
        res.render('ameli/login', {error: req.session.error});
    } else {
        res.render('impots/login', {error: req.session.error});
    }
});

var validateUser = function (req, callback) {
    delete req.session.error;
    userLookup.validate(req, callback);
};

var afterLogin = function (req, res) {
    res.redirect(req.param('return_url') || '/user');
};

app.post('/my/login', oidc.login(validateUser), afterLogin);


app.all('/logout', oidc.removetokens(), function (req, res) {
    req.session.destroy();
    res.redirect('/my/login');
});

app.get('/user/authorize', oidc.auth());

app.post('/user/token', oidc.token());

app.get('/user/consent', function (req, res) {
    var head = '<head><title>Consent</title></head>';
    var lis = [];
    for (var i in req.session.scopes) {
        lis.push('<li><b>' + i + '</b>: ' + req.session.scopes[i].explain + '</li>');
    }
    var ul = '<ul>' + lis.join('') + '</ul>';
    var error = req.session.error ? '<div>' + req.session.error + '</div>' : '';
    var body = '<body><h1>Consent</h1><form method="POST">' + ul + '<input type="submit" name="accept" value="Accept"/><input type="submit" name="cancel" value="Cancel"/></form>' + error;
    res.send('<html>' + head + body + '</html>');
});

app.post('/user/consent', oidc.consent());

app.get('/user/create', function (req, res) {
    var head = '<head><script type="text/javascript" src="/js/jquery.min.js"></script><script type="text/javascript" src="/js/garlic.min.js"></script><link href="/stylesheets/bootstrap.min.css" rel="stylesheet" type="text/css"><link href="/stylesheets/style.css" rel="stylesheet" type="text/css"><title>Création de jeu de données utilisateur en environnement d\'intégration</title><script src="https://www.google.com/recaptcha/api.js"></script></head>';
    var inputs = '';
    var inputs_dgfip = '';
    var fields = {
        identifier: {
            label: 'Identifiant qui sera utilisé pour l\'authentification :',
            type: 'text',
            placeholder: 'exemple : 46413193479'
        },
        given_name: {
            label: 'Prénoms :',
            type: 'text',
            placeholder: 'exemple : Jean-Pierre Eric'
        },
        family_name: {
            label: 'Nom de famille :',
            type: 'text',
            placeholder: 'exemple : De Larue'
        },
        birthdate: {
            label: 'Date de naissance YYYY-MM-DD :',
            type: 'text',
            placeholder: 'exemple : 1976-01-22'
        },
        gender: {
            label: 'Sexe : ',
            type: 'text',
            placeholder: 'male ou female'
        },
        email: {
            label: 'Adresse électronique :',
            type: 'email',
            placeholder: ''
        },
        birthcountry: {
            label: 'Code COG du pays de naissance :',
            type: 'text',
            placeholder: 'exemple : 99100 pour la France'
        },
        birthplace: {
            label: 'Code COG du lieu de naissance - à renseigner si le COG pays est la France (99100)',
            type: 'text',
            placeholder: 'exemple : 31555 pour Toulouse'
        },
        password: {
            label: 'Mot de passe :',
            type: 'password',
            placeholder: ''
        },
        dgfip_rfr: {
            label: 'Revenu fiscal de référence',
            type: 'number',
            placeholder: ''
        },
        dgfip_nbpac: {
            label: 'Nombre de personnes à charge',
            type: 'number',
            placeholder: ''
        },
        dgfip_sitfam: {
            label: 'Situation familiale',
            type: 'text',
            placeholder: 'valeurs possibles : M, C, D, O, V'
        },
        dgfip_nbpart: {
            label: 'Nombre de parts',
            type: 'number',
            placeholder: ''
        },
        dgfip_aft: {
            label: 'Adresse fiscale de taxation',
            type: 'text',
            placeholder: 'n° de voie + libellé de la voie + complément d\'adresse + libellé de la commune + code postal + nom de la localité de destination'
}
    };
    for (var i in fields) {
        if(i.indexOf('dgfip')===-1){
            inputs += '<div class="form-group"><label for="' + i + '">' + fields[i].label + '</label><input class="form-control" type="' + fields[i].type + ' "placeholder="' + fields[i].placeholder + '" id="' + i + '"  name="' + i + '"';
            inputs += (i!== 'birthplace')? 'required="true"/></div>' : '/></div>';
        } else {
            inputs_dgfip += '<div class="form-group"><label for="' + i + '">' + fields[i].label + '</label><input class="form-control" type="' + fields[i].type + '"placeholder="' + fields[i].placeholder + '" id="' + i + '"  name="' + i + '"/></div>';
        }
    }
    var error = req.session.error ? '<div class="alert alert-warning">' + req.session.error + '</div>' : '';
    var body = '<body><div class="row"><div class="col-md-6 col-md-offset-3"><div class="panel panel-default"><div class="panel-heading" style="padding-top: 15px; padding-bottom: 15px;"><h1 class="panel-title text-center" style="line-height: 1.5;">Création de jeu de données utilisateur <br/>en environnement d\'intégration</h1></div><div class="panel-body" style="padding: 25px;">' + error + '<div class="alert alert-warning text-center" style="margin-bottom: 25px;"><strong>Tous les champs sont obligatoires (sauf précisé).</strong> Les comptes seront disponibles dans les 2 bouchons de fournisseurs d\'identités Impots.gouv et Ameli.</div><form data-persist="garlic" data-destroy="false" method="POST">' + inputs + '<hr/> <p>Si vous souhaitez appeler le FD bouchon DGFIP, vous pouvez aussi remplir les informations suivantes :</p>' + inputs_dgfip + '<div class="g-recaptcha" data-sitekey="6LfxVxwTAAAAAJ0F1mUqmpMMsB6N1nlR41OCIJ-C"></div><input class="btn btn-primary btn-lg btn-block" style="margin-top: 20px;" type="submit"/></form>' + error + '</div></div></div></div></body>';
    res.send('<html>' + head + body + '</html>');
});

app.post('/user/create', oidc.use({policies: {loggedIn: false}, models: 'user'}), function (req, res) {
    delete req.session.error;

    captchaHelper.getCpatchaValidationResponse(req, function(err, result){
        if(err || !result.success){
            req.session.error = 'Erreur lors de la validation du captcha.';
            res.redirect(req.path);
        }
        else {
            if(req.body.birthcountry==='99100' && !req.body.birthplace){
                req.session.error = 'Le lieu de naissance est obligatoire si le pays de naissance est la France (99100)';
                return res.redirect(req.path);
            }
            DGFIP_FIELDS.forEach(function(dgfip_field){
                if (req.body[dgfip_field]===''){
                    delete req.body[dgfip_field];
                }
            });
            req.model.user.findOne({identifier: req.body.identifier}, function (err, user) {
                if (err) {
                    req.session.error = err;
                } else if (user) {
                    req.session.error = 'Le compte existe déjà.';
                }
                if (req.session.error) {
                    res.redirect(req.path);
                } else {
                    req.body.name = req.body.given_name + ' ' + req.body.family_name;
                    req.model.user.create(req.body, function (err, user) {
                        if (err || !user) {
                            console.error(err);
                            req.session.error = 'Erreur lors de la création du compte.';
                            res.redirect(req.path);
                        } else {
                            req.session.user = user.id;
                            req.session.error = 'Compte créé avec succès.';
                            res.redirect('/user/create');
                        }
                    });
                }
            });
        }

    });
});

app.get('/user', oidc.check(), function (req, res) {
    res.send('<h1>User Page</h1><div><a href="/client">See registered clients of user</a></div>');
});

app.get('/api/user', oidc.userInfo());

app.get('/client/register', oidc.use('client'), function (req, res, next) {

    var mkId = function () {
        var key = crypto.createHash('md5').update(req.session.user + '-' + Math.random()).digest('hex');
        req.model.client.findOne({key: key}, function (err, client) {
            if (!err && !client) {
                var secret = crypto.createHash('md5').update(key + req.session.user + Math.random()).digest('hex');
                req.session.register_client = {};
                req.session.register_client.key = key;
                req.session.register_client.secret = secret;
                var head = '<head><title>Register Client</title></head>';
                var inputs = '';
                var fields = {
                    name: {
                        label: 'Client Name',
                        html: '<input type="text" id="name" name="name" placeholder="Client Name"/>'
                    },
                    redirect_uris: {
                        label: 'Redirect Uri',
                        html: '<input type="text" id="redirect_uris" name="redirect_uris" placeholder="Redirect Uri"/>'
                    },
                    key: {
                        label: 'Client Key',
                        html: '<span>' + key + '</span>'
                    },
                    secret: {
                        label: 'Client Secret',
                        html: '<span>' + secret + '</span>'
                    }
                };
                for (var i in fields) {
                    inputs += '<div><label for="' + i + '">' + fields[i].label + '</label> ' + fields[i].html + '</div>';
                }
                var error = req.session.error ? '<div>' + req.session.error + '</div>' : '';
                var body = '<body><h1>Register Client</h1><form method="POST">' + inputs + '<input type="submit"/></form>' + error;
                res.send('<html>' + head + body + '</html>');
            } else if (!err) {
                mkId();
            } else {
                next(err);
            }
        });
    };
    mkId();
});

app.post('/client/register', oidc.use('client'), function (req, res, next) {
    delete req.session.error;
    req.body.key = req.session.register_client.key;
    req.body.secret = req.session.register_client.secret;
    req.body.user = req.session.user;
    req.body.redirect_uris = req.body.redirect_uris.split(/[, ]+/);
    req.model.client.create(req.body, function (err, client) {
        if (!err && client) {
            res.redirect('/client/' + client.id);
        } else {
            next(err);
        }
    });
});

app.get('/client', oidc.use('client'), function (req, res) {
    var head = '<h1>Clients Page</h1><div><a href="/client/register"/>Register new client</a></div>';
    req.model.client.find({}, function (err, clients) {
        var body = ['<ul>'];
        clients.forEach(function (client) {
            body.push('<li><a href="/client/' + client.id + '">' + client.name + '</li>');
        });
        body.push('</ul>');
        res.send(head + body.join(''));
    });
});

app.get('/client/:id', oidc.use('client'), function (req, res, next) {
    req.model.client.findOne({user: req.session.user, id: req.params.id}, function (err, client) {
        if (err) {
            next(err);
        } else if (client) {
            var html = '<h1>Client ' + client.name + ' Page</h1><div><a href="/client">Go back</a></div><ul><li>Key: ' + client.key + '</li><li>Secret: ' + client.secret + '</li><li>Redirect Uris: <ul>';
            client.redirect_uris.forEach(function (uri) {
                html += '<li>' + uri + '</li>';
            });
            html += '</ul></li></ul>';
            res.send(html);
        } else {
            res.send('<h1>No Client Found!</h1><div><a href="/client">Go back</a></div>');
        }
    });
});

if ('development' === app.get('env')) {
    app.use(errorHandler());
}

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;