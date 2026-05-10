# Scripts Oracle — ordre d’exécution

Répertoire : **`sql/01_installation/`**.

| Étape | Fichier | Connexion | Contenu |
|------|---------|-----------|---------|
| **①** | **`01_grants.sql`** | **SYSTEM** / **SYS** (PDB cible) | Quotas + **GRANT** sur `rdv_app`. |
| **②** | **`02_database.sql`** | **`rdv_app`** | Tables, données démo, vues, PL/SQL, trigger d’historique sur suppression RDV. |

*(Création de l’utilisateur `rdv_app` : commentaires en tête de `01_grants.sql`.)*
