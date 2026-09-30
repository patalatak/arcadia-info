# ArcadiaInfo — préparation OVH

Cette branche contient les fichiers du nouvel aperçu Arcadia, adaptés à l'hébergement web OVH. Elle ne remplace pas encore le site public.

Le contenu de cette branche est destiné au dossier `/home/arcadiaip/www` de l'hébergement `arcadiainfo.com`. Les domaines `arcadiainfo.com` et `www.arcadiainfo.com` y sont déjà associés.

Le formulaire utilise PHP et Brevo. Sur OVH, le dossier privé `/home/arcadiaip/.arcadia-contact` contient `config.php` avec les deux valeurs `brevo_api_key` et `form_secret` (secret aléatoire de 32 octets minimum). Ce fichier ne doit jamais entrer dans GitHub ni dans `www`. Le serveur doit pouvoir écrire `state.json` et `state.lock` dans ce dossier.

Avant la mise en ligne : compléter les pages légales encore marquées « version de travail », sauvegarder le contenu actuel de `www`, vérifier PHP et cURL sur OVH, installer la configuration privée, puis tester un envoi réel du formulaire et la réception dans Brevo. Les certificats HTTPS des deux domaines sont actifs au 30 septembre 2026.

Cette branche sert à préparer la publication sur GitHub et OVH. La validation du rendu précède toute mise en ligne.
