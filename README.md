# Exemple de fournisseur d'identité compatible avec France Connect Particulier utilisant OpenID Connect et Node.js
Pour créer et lancer l'image Docker de ce fournisseur d'identité, il faut exécuter par exemple les commandes suivantes :

    user@machine $ : git clone https://github.com/deep75/franceconnect-identity-provider-demo
    user@machine $ : cd franceconnect-identity-provider-demo
    user@machine $ : docker build -t franceconnect-identity-provider-demo .
    user@machine $ : docker run -d -p 80:3042 franceconnect-identity-provider-demo

et ouvrir http://localhost

ou bien avec Docker Swarm avec plusieurs noeuds depuis la version 1.12 :

    user@machine $ : docker swarm init
    user@machine $ : docker network create -d overlay fi-net
    user@machine $ : docker service create --name franceconnect-identity-provider --network fi-net --replicas 5 -p 80:3042/tcp mcas/franceconnect-identity-providers:latest
    user@machine $ : docker service scale franceconnect-identity-provider=10

et ouvrir http://<IP de l'hôte Docker Swarm Master>
