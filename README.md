# Gestion de rendez-vous médicaux — comment lancer le site

Petit guide pour **démarrer en local** : une API **Flask** + Python parle à **Oracle**, et une interface **React** (Vite) tourne dans le navigateur.

### TL;DR — les 4 étapes

1. **Oracle** : créer l’utilisateur **`rdv_app`**, puis exécuter **`01_grants.sql`** en SYSTEM, puis **`02_database.sql`** en `rdv_app` (détails ci‑dessous).
2. **`.env`** : `copy .env.example .env` à la racine, remplir Oracle + `SECRET_KEY` + `CORS_ORIGINS`.
3. **API** : `pip install -r requirements.txt` puis **`python app.py`** (garde ce terminal ouvert).
4. **Site** : dans un 2ᵉ terminal, `cd frontend` → **`npm install`** → **`npm run dev`** → navigateur sur **[http://localhost:5173](http://localhost:5173)** — compte **`demo` / `demo`**.

La partie la plus longue pour un débutant est souvent **Oracle** (installation + premier utilisateur) ; le reste suit vite une fois la base OK.

---

## Ce qu’il te faut sur ta machine

| Outil | Pour quoi faire |
|--------|------------------|
| **Oracle Database** | Base de données (ex. Oracle XE avec PDB `XEPDB1`). |
| **Python 3.10+** | Lancer l’API (`app.py`). |
| **Node.js 18+** | `npm` pour le frontend. |

---

## Avant la première fois : utilisateur Oracle puis scripts SQL

Il te faut un **utilisateur schéma** nommé **`rdv_app`** (c’est lui qui possède les tables et c’est le login dans ton fichier **`.env`**).

1. **Créer `rdv_app`** (une seule fois), connecté en **SYSTEM** sur la bonne PDB — exemple dans les commentaires en tête de **`sql/01_installation/01_grants.sql`** (`CREATE USER rdv_app IDENTIFIED BY …` puis privilèges de base). Si l’utilisateur existe déjà avec un mot de passe que tu connais, passe à l’étape suivante.

2. Toujours en **SYSTEM**, exécute **`sql/01_installation/01_grants.sql`** (quotas + droits pour créer tables, vues, procédures, etc.).

3. Connecte-toi en **`rdv_app`**, exécute **`sql/01_installation/02_database.sql`** (tables, données de démo, vues).

### Connexion via CMD (Windows)

Pour ouvrir SQL*Plus depuis l’invite de commandes Windows :

- En SYSTEM (remplace `motdepasse_system` par ton mot de passe SYSTEM) :
  ```bat
  sqlplus SYSTEM/motdepasse_system@localhost:1521/XEPDB1
  ```
- En tant qu'utilisateur `rdv_app` :
  ```bat
  sqlplus rdv_app/ton_mot_de_passe@localhost:1521/XEPDB1
  ```
Ensuite, dans SQL\*Plus, exécute le script voulu :
  ```sql
  @sql/01_installation/01_grants.sql
  ```
ou
  ```sql
  @sql/01_installation/02_database.sql
  ```

Détails et captures : **`sql/README.md`** et, si besoin, **`GUIDE_SETUP_BASE_ORACLE.md`**.

---

## Configuration du projet

À la **racine** du dossier (là où se trouve `app.py`) :

1. Copie le fichier d’exemple :  
   `copy .env.example .env`  
   (sur macOS/Linux : `cp .env.example .env`)
2. Ouvre **`.env`** et renseigne au minimum :

| Variable | Exemple | Rôle |
|----------|---------|------|
| `ORACLE_USER` | `rdv_app` | Utilisateur Oracle du schéma |
| `ORACLE_PASSWORD` | *(ton mot de passe)* | Mot de passe |
| `ORACLE_CONNECT_STRING` | `localhost:1521/XEPDB1` | Connexion « Easy Connect » |
| `SECRET_KEY` | *(une longue chaîne au hasard)* | Sessions Flask |
| `CORS_ORIGINS` | `http://127.0.0.1:5173,http://localhost:5173` | Autorise le frontend en dev |

Tu peux laisser **`VITE_API_URL`** vide dans le frontend : en développement, Vite envoie les appels `/api` vers le backend tout seul.

---

## Lancer le site (2 terminaux)

### Terminal 1 — API Flask

```bat
cd "chemin\vers\Oracle DB"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

*(Linux/macOS : `source .venv/bin/activate`)*

L’API écoute sur **`http://127.0.0.1:5000`**.  
Test rapide sans connexion : ouvre **`http://127.0.0.1:5000/api/health`** dans le navigateur — si Oracle répond, c’est bon.

Option plus « calme » sous Windows (moins de messages dans la console) :

```bat
python app.py --waitress
```

### Terminal 2 — interface web (React)

```bat
cd "chemin\vers\Oracle DB\frontend"
npm install
npm run dev
```

Ouvre **`http://localhost:5173`** dans le navigateur.

---

## Te connecter

Après les scripts SQL par défaut :

| Champ | Valeur |
|--------|--------|
| Identifiant | **`demo`** |
| Mot de passe | **`demo`** |

---

## Résumé des URLs en développement

| Service | URL |
|---------|-----|
| Site (React) | **http://localhost:5173** |
| API | **http://127.0.0.1:5000** |
| Test Oracle | **http://127.0.0.1:5000/api/health** |

---

## Si quelque chose bloque

| Problème | Piste |
|----------|--------|
| Erreur Oracle au démarrage | Oracle démarré ? Chaîne `ORACLE_CONNECT_STRING` correcte ? Utilisateur `rdv_app` créé ? |
| **ORA-01031** en lançant le script schéma | Exécuter **`01_grants.sql`** en SYSTEM **avant** **`02_database.sql`** en `rdv_app`. |
| Page blanche ou erreurs réseau | Le terminal avec **`python app.py`** doit rester ouvert ; le front doit utiliser le port **5173** avec le proxy Vite. |
| Aide Oracle détaillée | **`GUIDE_SETUP_BASE_ORACLE.md`** |

---

## Arborescence utile

```
.
├── app.py              ← lance l’API
├── .env                ← ta config (à créer depuis .env.example)
├── backend/            ← code Flask (routes, Oracle)
├── frontend/           ← React + Vite (npm run dev)
│   └── public/         ← copies statiques : `mld.html`, `diagram_sequence.html` (à resynchroniser depuis la racine si tu les modifies)
├── sql/01_installation/
│   ├── 01_grants.sql   ← en SYSTEM en premier
│   └── 02_database.sql ← puis en rdv_app
├── diagram_sequence.html  ← diagramme de séquences UML (même style que le MLD)
└── mld.html               ← source du MLD ; à recopier dans `frontend/public/` si tu modifies ce fichier
```

Bon développement.
