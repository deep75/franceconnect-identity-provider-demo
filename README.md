# Exemple de fournisseur d'identité compatible avec France Connect Particulier utilisant OpenID Connect et Node.js
Pour créer et lancer l'image Docker de ce fournisseur d'identité, il faut exécuter par exemple les commandes suivantes :

    user@machine $ : git clone https://github.com/deep75/franceconnect-identity-provider-demo
    user@machine $ : cd franceconnect-identity-provider-demo
    user@machine $ : docker build -t franceconnect-identity-provider-demo .
    user@machine $ : docker run -d -p 80:3042 franceconnect-identity-provider-demo

et ouvrir http://localhost
