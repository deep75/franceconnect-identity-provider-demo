# Exemple de fournisseur d'identité compatible avec France Connect Particulier utilisant OpenID Connect et Node.js

![fc particulier](https://fcp.integ01.dev-franceconnect.fr/images/fc_logo_alt2_v2.png)

Documentation de FranceConnect Particulier : [FC Particulier](https://franceconnect.gouv.fr/)

Pour créer et lancer l'image Docker de ce fournisseur d'identité, il faut exécuter par exemple les commandes suivantes :

    user@machine $ : git clone https://github.com/deep75/franceconnect-identity-provider-demo
    user@machine $ : cd franceconnect-identity-provider-demo
    user@machine $ : docker build -t franceconnect-identity-provider-demo .
    user@machine $ : docker run -d -p 80:3042 franceconnect-identity-provider-demo

et ouvrir :

    http://localhost


ou bien par exemple avec un cluster Docker Swarm (à plusieurs noeuds) depuis la version 1.12 :

    user@master $ : docker swarm init
    user@noeuds $ : docker swarm join --token 'TOKEN' (IP de l'hôte Swarm Master):2377 => pour les noeuds se joignant au cluster
    user@master $ : docker network create -d overlay fi-net
    user@master $ : docker service create --name franceconnect-identity-provider --network fi-net --replicas 5 -p 80:3042/tcp mcas/franceconnect-identity-providers:latest
    user@master $ : docker service scale franceconnect-identity-provider=10

et ouvrir :

    http://(IP de l'hôte Swarm Master)
