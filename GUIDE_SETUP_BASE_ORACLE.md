# Guide complet — Configurer la base Oracle pour le projet « gestion RDV médical »

Ce guide suppose qu’**Oracle Database est déjà installé** sur votre machine (par exemple **Oracle XE** ou une édition complète). Les scripts principaux sont **`sql/01_installation/01_grants.sql`** puis **`sql/01_installation/02_database.sql`** (voir **`sql/README.md`**).

---

## 1. Vérifier qu’Oracle tourne (Windows)

1. Appuyez sur **Win + R**, tapez `services.msc`, Entrée.
2. Cherchez un service du type :
   - **OracleServiceXE** (Oracle Express Edition), ou  
   - **OracleService** + nom de SID (ex. **OracleServiceXE** pour Oracle XE).
3. Le statut doit être **En cours d’exécution**. Sinon : clic droit → **Démarrer**.

Sans service démarré, SQL Developer affichera souvent **ORA-12541** (listener / instance inaccessible).

---

## 2. Retrouver les paramètres de connexion

Vous avez besoin de :

| Paramètre | Description |
|-----------|-------------|
| **Hôte** | Souvent `localhost` ou `127.0.0.1` si la base est sur le même PC. |
| **Port** | Très souvent **1521** (port par défaut du listener). |
| **Service name** ou **SID** | Nom du service Oracle auquel se connecter (voir ci‑dessous). |

### Oracle XE (21c, 18c, etc.)

- Le **Pluggable Database** (PDB) par défaut s’appelle souvent **`XEPDB1`**.
- Chaîne **Easy Connect** typique :  
  `localhost:1521/XEPDB1`  
  (c’est le format attendu par **`ORACLE_CONNECT_STRING`** dans le fichier `.env` du projet.)

### Autre installation (Enterprise, etc.)

Dans **SQL Developer**, ouvrez une connexion qui fonctionne déjà et notez :

- **Nom d’hôte**, **port**, **SID** ou **nom de service** (onglet *Avancé* / propriétés de la connexion).

Vous pouvez aussi lister les services avec une requête **connecté en SYS ou en admin PDB** :

```sql
SELECT name, open_mode FROM v$pdbs;
```

Connectez l’application au **même service** que celui que vous utilisez pour créer les tables (souvent un **PDB**, pas le `CDB$ROOT` seul).

---

## 3. Choisir un utilisateur schéma pour l’application

Deux approches possibles.

### Option A — Utiliser un utilisateur existant

Si vous avez déjà un compte (mot de passe connu) avec droits de création d’objets, vous pouvez l’utiliser directement pour **`sql/01_installation/02_database.sql`** (après **`sql/01_installation/01_grants.sql`** si besoin de droits).  
Notez **nom d’utilisateur** et **mot de passe** : ils iront dans **`ORACLE_USER`** et **`ORACLE_PASSWORD`** dans `.env`.

### Option B — Créer un utilisateur dédié (recommandé pour une démo pro)

1. Connectez-vous dans SQL Developer avec un compte **administrateur** du PDB cible, par exemple :
   - **SYSTEM**, ou  
   - **SYS** en mode **SYSDBA** (connexion au bon **service**, ex. `XEPDB1`).

2. Exécutez (adaptez le nom et le mot de passe) :

```sql
ALTER SESSION SET CONTAINER = XEPDB1;

CREATE USER rdv_app IDENTIFIED BY rdv123;

GRANT CREATE SESSION TO rdv_app;
GRANT CREATE TABLE TO rdv_app;
GRANT CREATE SEQUENCE TO rdv_app;
GRANT CREATE VIEW TO rdv_app;
GRANT UNLIMITED TABLESPACE TO rdv_app;
```

3. Créez une **nouvelle connexion** dans SQL Developer :
   - Utilisateur : **`rdv_app`**
   - Mot de passe : celui défini ci‑dessus
   - **Même hôte / port / service** que pour SYSTEM (ex. `localhost`, `1521`, service **`XEPDB1`**).

4. Testez : **Connexion** doit réussir.

---

## 4. Créer les tables et les données (script du projet)

1. Dans SQL Developer, **connectez-vous avec l’utilisateur schéma** choisi (Option A ou **`rdv_app`**).
2. Menu **Fichier** → **Ouvrir** → **`sql/01_installation/01_grants.sql`** (SYSTEM), puis **`sql/01_installation/02_database.sql`** (`rdv_app`) — voir **`sql/README.md`**.
3. Exécutez **tout le script** :
   - Raccourci souvent **F5** (*Run Script*), ou bouton « feuille avec petites lignes » (*Run Script*), **pas** seulement une ligne isolée.

4. Vérifiez qu’il n’y a **pas d’erreur** dans le panneau *Script Output*.

Le script crée les tables **`medecins`**, **`patients`**, **`rendez_vous`**, **`app_users`**, **`rdv_suppressions_historique`**, des index, et insère des lignes de démo puis fait **`COMMIT`**.

### Si vous devez tout recommencer

Dans **`sql/01_installation/02_database.sql`**, les blocs **`DROP TABLE ...`** en tête permettent de repartir de zéro si vous réexécutez le script.

---

## 5. Contrôler que les données sont là

Toujours connecté au **même utilisateur** que l’application utilisera, exécutez :

```sql
SELECT COUNT(*) FROM medecins;
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM rendez_vous;
```

Vous devriez voir au minimum **2** médecins, **2** patients, **2** rendez-vous.

Pour un aperçu détaillé :

```sql
SELECT r.id, r.date_heure, r.motif, r.statut,
       p.nom AS patient_nom, m.nom AS medecin_nom
FROM rendez_vous r
JOIN patients p ON p.id = r.patient_id
JOIN medecins m ON m.id = r.medecin_id;
```

---

## 6. Lier l’application Python (fichier `.env`)

1. Copiez **`.env.example`** vers **`.env`** à la racine du projet (à côté de **`app.py`**).
2. Renseignez :

```env
ORACLE_USER=rdv_app
ORACLE_PASSWORD=VotreMotDePasseSecurise
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
```

- **`ORACLE_USER`** / **`ORACLE_PASSWORD`** : **exactement** les mêmes que la connexion SQL Developer qui voit les tables.
- **`ORACLE_CONNECT_STRING`** : format **`hôte:port/nom_service`** (Easy Connect).  
  Exemples : `localhost:1521/XEPDB1`, ou `192.168.1.10:1521/ORCLPDB1` selon votre environnement.

3. Lancez l’app (après `pip install -r requirements.txt`) :

```powershell
python app.py
```

4. Testez l’API : **`GET http://127.0.0.1:5000/api/health`**. Lancez le frontend (`cd frontend` puis **`npm run dev`**) et ouvrez **`http://localhost:5173`**.

---

## 7. Dépannage courant

| Message / symptôme | Piste |
|--------------------|--------|
| **ORA-12541** TNS:no listener | Service Oracle arrêté, mauvais port, ou mauvaise machine. Vérifiez les services Windows et le port (souvent 1521). |
| **ORA-12514** TNS:listener does not currently know of service | Le **nom de service** dans la chaîne (`.../XEPDB1`) ne correspond pas à votre instance. Vérifiez dans SQL Developer le service utilisé pour une connexion qui marche. |
| **ORA-01017** invalid username/password | Utilisateur ou mot de passe faux, ou connexion au mauvais PDB (ex. utilisateur créé dans `XEPDB1` mais chaîne pointant vers un autre service). |
| **ORA-01950** no privileges on tablespace | Accordez par exemple **`GRANT UNLIMITED TABLESPACE TO ...`** (utilisateur dédié) ou un quota sur le tablespace par défaut. |
| **ORA-00955** name is already used | Tables déjà créées. Utilisez les **`DROP TABLE`** en tête de **`sql/01_installation/02_database.sql`** (puis réexécutez), ou connectez-vous à un autre schéma. |
| Page web : erreur Python / connexion | Vérifiez **`.env`**, que **`python-dotenv`** charge bien le fichier, et que vous êtes dans le bon dossier au lancement de **`app.py`**. |

---

## 8. Récapitulatif « checklist »

- [ ] Service Oracle **démarré** sous Windows.  
- [ ] Connexion SQL Developer **OK** vers le bon **service** (ex. `XEPDB1`).  
- [ ] Utilisateur schéma avec droits **CREATE TABLE** (et session).  
- [ ] **`sql/01_installation/01_grants.sql`** exécuté en SYSTEM si nécessaire, puis **`sql/01_installation/02_database.sql`** en **rdv_app** sans erreur.  
- [ ] **`SELECT COUNT(*)`** sur les trois tables renvoie des lignes.  
- [ ] **`.env`** aligné sur la même identité + **`ORACLE_CONNECT_STRING`**.  
- [ ] **`python app.py`** puis **`GET /api/health`** OK ; interface **`npm run dev`** dans `frontend/` sur le port 5173.

Une fois cette checklist validée, votre base est correctement configurée pour la démo « liaison DB + petite app » du projet de gestion des RDV médicaux.
