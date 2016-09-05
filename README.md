# Utilisation de l'application "Fournisseur d'Identité" (FI)

L'application FI est une application servant d'Identity Provider, elle permet de renvoyer des informations à un client OpenID Connect en se basant sur les informations des comptes auxquels on lui donne accès

# Pré-requis
Cette appliquation requiert NodeJS et MongoDB pour fonctionner.

# Installation / démarrage
Pour l'installation, il faut clôner le dépot depuis github.

Une fois cela fait, se rendre dans le répertoire de l'application et installer les dépendances :

    user@machine $ : cd <endroit ou a été clôné le dépot>
    user@machine $ : npm install

si npm s'exécute sans erreurs, il est possible de lancer l'application :

    user@machine $ : npm start

Il est possible de préciser le port sur lequel on souhaite que l'application écoute, le plus simple est de le faire par la ligne de commande :

    user@machine $ : PORT=4243 npm start

# Comment utiliser cette application ?

Il est possible d'utiliser l'application telle quelle avec une base de données mongodb.
Il est aussi possible de se servir de l'application comme d'un proxy qui exploite un annuaire déjà existant. Dans ce cas, pour faire ses vérifications vis à vis de l'annuaire en place, il faut modifier le fichier _helpers/userValidator.js_

Si vous souhaitez modifier l'apparence de la mire d'authentification, il faut mettre en place la mire souhaitée en mettant à jour le template qui se trouve ici : _views/login.ejs_

# Comment ajouter des comptes utilisateurs ?

Les comptes utilisateurs sont stockés dans la collection "user", au format suivant (si vous utilisez MongoDB) et pour un compte utilisateur ayant pour mot de passe 123 :

{
    "_id" : ObjectId("545138e8328529097a52f717"),
    "given_name" : "Pierre",
    "family_name" : "Dupond",
    "email" : "demo@franceconnect.fr",
    "password" : "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    "gender" : "male",
    "birthdate" : "1976-02-24",
    "birthplace" : "272",
    "birthdepartment" : "91",
    "birthcountry" : "33",
    "createdAt" : ISODate("2014-10-29T18:58:48.638Z"),
    "updatedAt" : ISODate("2014-10-29T18:58:48.638Z"),
    "identifier" : "<identifiant technique utilisé pour se connecter. NIR, numéro fiscal ...>",
    "email" : "test@test.com",
    "address" : "26 rue Desaix, 75015 Paris",
    "phone" : "0123456789",
    "preferred_username" : "Dupont"
}

# Comment ajouter des clients (au sens OpenIDConnect, les clients sont les applications qui vont utiliser le fournisseur d'identité) ?

Les clients sont stockés dans la collection "client", au format suivant (si vous utilisez MongoDB) :

{
    "_id" : ObjectId("5447d707552b015a637b5789"),
    "name" : "fcp-dev",
    "redirect_uris" : [
        "http://fcp.dev.dev-franceconnect.fr/oidc_callback",
        "http://fcp.demo.dev-franceconnect.fr/oidc_callback",
        "http://fcp.integ01.dev-franceconnect.fr/oidc_callback"
    ],
    "key" : "your_key",
    "secret" : "your_secret",
    "user" : ObjectId("5447cb24cbb10652254e1734"),
    "credentialsFlow" : false,
    "createdAt" : ISODate("2014-10-22T15:27:55.503Z"),
    "updatedAt" : ISODate("2014-10-22T15:27:55.503Z")
}

# Licences
Cette application s'appuie sur le composant [openid-connect-provider](https://www.npmjs.org/package/openid-connect) (License MIT) ainsi que les modules NodeJS [Express](https://www.npmjs.org/package/express), [Lodash](https://www.npmjs.org/package/lodash), [Q](https://www.npmjs.org/package/q), [Sails](https://www.npmjs.org/package/sails) et [Sails-mongo](https://www.npmjs.org/package/sails-mongo).
# Exemple de fournisseur d'identité compatible avec France Connect Particulier
