# ArcadiaInfo — hébergement OVH

Ce dépôt contient les fichiers du site ArcadiaInfo destinés à l'hébergement web OVH.

Le contenu de cette branche est destiné au dossier `/home/arcadiaip/www` de l'hébergement `arcadiainfo.com`. Les domaines `arcadiainfo.com` et `www.arcadiainfo.com` y sont déjà associés.

Le formulaire utilise PHP et Brevo. Sur OVH, le dossier privé `/home/arcadiaip/.arcadia-contact` contient `config.php` avec les deux valeurs `brevo_api_key` et `form_secret` (secret aléatoire de 32 octets minimum). Ce fichier ne doit jamais entrer dans GitHub ni dans `www`. Le serveur doit pouvoir écrire `state.json` et `state.lock` dans ce dossier.

La configuration privée doit rester hors du dépôt et hors de `www`. Après chaque mise à jour, vérifier les pages publiques, PHP et cURL sur OVH, puis tester le formulaire et sa réception dans Brevo. Les certificats HTTPS des deux domaines étaient actifs au 30 septembre 2026.

La publication sur OVH suit la validation du rendu et des tests du paquet web.
