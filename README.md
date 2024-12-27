# MyManager - Application de Gestion et E-commerce

Une application web complète comprenant un back-office pour la gestion et une interface e-commerce pour les clients.

## Fonctionnalités

### Back-office
- Opérations CRUD pour plusieurs entités :
  - Utilisateurs
  - Produits
  - Commandes
  - Clients
  - Factures
- Tableau de bord avec graphiques en temps réel
- Support multilingue (Anglais, Français, Arabe)
- Système d'authentification
- Exportation de données
- Design responsive

### E-commerce
- Catalogue de produits avec filtres
- Système de catégories
- Panier d'achat
- Commande en tant qu'invité
- Interface responsive
- Recherche de produits
- Tri des produits

## Structure du Projet 

```
MyManager/
├── assets/
│ ├── css/
│ │ └── styles.css
│ ├── js/
│ │ ├── main.js
│ │ ├── dashboard.js
│ │ ├── store.js
│ │ ├── orders.js
│ │ ├── products.js
│ │ ├── clients.js
│ │ ├── invoices.js
│ │ └── api.js
│ ├── img/
│ │ └── logo.png
├── data/
│ └── mock-data.json
├── pages/
│ ├── login.html
│ ├── dashboard.html
│ ├── home.html
│ ├── users.html
│ ├── products.html
│ ├── orders.html
│ ├── clients.html
│ └── invoices.html
├── index.html
└── README.md
```

## Installation

1. Cloner le dépôt
2. Configurer le point d'accès API dans `assets/js/api.js`
3. Ouvrir `index.html` dans un navigateur web

## Utilisation

### Back-office
1. Se connecter avec les identifiants :
   - Nom d'utilisateur : admin
   - Mot de passe : admin
2. Naviguer dans les différentes sections via la barre latérale
3. Effectuer des opérations CRUD sur les entités
4. Consulter les statistiques du tableau de bord
5. Exporter les données au format CSV

### E-commerce
1. Accéder à la boutique via `home.html`
2. Parcourir les produits par catégorie
3. Utiliser les filtres et la recherche
4. Ajouter des produits au panier
5. Passer une commande (en tant qu'invité)

## Développement

- Construit avec JavaScript vanilla
- Utilise Chart.js pour la visualisation des données
- Bootstrap pour le design responsive
- API simulée avec données JSON
- LocalStorage pour la persistance des données

## Contribution

1. Forker le dépôt
2. Créer une branche pour la fonctionnalité
3. Commiter les changements
4. Pousser vers la branche
5. Créer une Pull Request

## Licence

[Licence MIT](LICENSE)
