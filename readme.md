# RoyalFlush 🎰

RoyalFlush est une application web de casino en ligne développée dans le cadre du projet de **Développement Informatique III**.

L’application propose deux jeux principaux :

- 🃏 Blackjack
- 🎡 Roulette

Le projet met en œuvre une architecture full-stack complète avec :
- un backend Node.js / Express
- un frontend React
- une base de données Supabase (PostgreSQL)
- un déploiement sur VPS avec Docker et Nginx

---

# 🔗 Accès à l’application

- 🌐 URL : https://blog.l1-7.ephec-ti.be/
- 📦 Repository : (lien GitHub)

---

# 🎯 Objectif du projet

L’objectif est de concevoir une application web complète en appliquant les notions vues au cours :

- API REST structurée
- Base de données relationnelle avec ORM
- Authentification sécurisée (JWT)
- Tests automatisés (Jest)
- Déploiement complet (Docker + VPS)
- Intégration continue (GitHub Actions)

---

# ⚙️ Stack technique

## Backend
- Node.js
- Express
- Prisma (ORM)
- JWT (authentification)
- Jest (tests)

## Frontend
- React + Vite
- Axios

## Base de données
- Supabase (PostgreSQL)

## DevOps
- Docker
- Nginx
- GitHub Actions (CI/CD)

---

# 🧱 Architecture

L’application suit une architecture en couches :

## Description

### Frontend
- Interface utilisateur développée avec React
- Gestion des états et navigation
- Appels API via Axios

### Backend
- API REST structurée :
  - Routes
  - Controllers
  - Services
  - Middlewares
- Gestion centralisée des erreurs

### Base de données
- Supabase (PostgreSQL)
- Utilisation de Prisma pour :
  - requêtes
  - relations
  - migrations

### Authentification
- JWT (Access Token)
- Refresh Token (sécurisé)
- Mots de passe hashés (bcrypt)
- Routes protégées

### Déploiement
- Backend dockerisé
- Frontend servi par Nginx
- Reverse proxy vers API

### CI/CD
- Tests automatiques à chaque push
- Pipeline GitHub Actions

---

# 🔐 Sécurité

- Hash des mots de passe
- Validation des entrées
- Protection des routes
- Gestion des tokens

## OWASP couvert
- Injection SQL
- Mauvaise authentification
- Exposition de données sensibles

---

# 🎮 Fonctionnalités

## Authentification
- Inscription
- Connexion
- Gestion session

## Blackjack
- Hit / Stand / Split
- Logique du dealer
- Calcul du score
- Résultat automatique

## Roulette
- Mise (rouge/noir, nombre…)
- Tirage aléatoire
- Calcul des gains

## Utilisateur
- Solde virtuel
- Historique des parties
- Historique des transactions

---

# 🗄️ Base de données

## Tables principales

### users
- id
- username
- email
- password_hash
- balance

### blackjack_games
- id
- user_id
- bet_amount
- result

### roulette_games
- id
- user_id
- bet_amount
- result

### transactions
- id
- user_id
- amount
- type

---

# 🔄 Migrations

Gestion avec Prisma :

```bash
npx prisma migrate dev
