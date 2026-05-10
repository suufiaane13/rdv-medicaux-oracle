-- ##############################################################################
--  Privilèges schéma (grants) — à exécuter avant 02_database.sql
-- ##############################################################################
-- Connexion : SYSTEM ou SYS — PAS en tant que rdv_app
-- Même PDB que l’utilisateur schéma (ex. system@localhost:1521/XEPDB1)
--
-- Ordre recommandé avec 02_database.sql :
--   1) Exécuter CE fichier (01_grants.sql) en SYSTEM
--   2) Exécuter 02_database.sql en rdv_app (tables, inserts, fonctions/procédures, trigger)
-- ##############################################################################

-- Création utilisateur :
-- ALTER SESSION SET CONTAINER = XEPDB1;
-- CREATE USER rdv_app IDENTIFIED BY "votre_mot_de_passe";
-- GRANT CREATE SESSION TO rdv_app;

ALTER USER rdv_app QUOTA UNLIMITED ON USERS;

GRANT CONNECT TO rdv_app;
GRANT RESOURCE TO rdv_app;

GRANT CREATE TABLE TO rdv_app;
GRANT CREATE VIEW TO rdv_app;
GRANT CREATE SEQUENCE TO rdv_app;
GRANT CREATE PROCEDURE TO rdv_app;
GRANT CREATE TRIGGER TO rdv_app;
GRANT CREATE SYNONYM TO rdv_app;
GRANT CREATE MATERIALIZED VIEW TO rdv_app;

-- Optionnel dev :
-- GRANT UNLIMITED TABLESPACE TO rdv_app;
-- GRANT DBA TO rdv_app;
