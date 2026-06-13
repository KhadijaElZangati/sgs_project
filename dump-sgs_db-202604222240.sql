--
-- PostgreSQL database dump
--

-- Dumped from database version 13.21 (Ubuntu 13.21-1.pgdg24.04+1)
-- Dumped by pg_dump version 13.21 (Ubuntu 13.21-1.pgdg24.04+1)

-- Started on 2026-04-22 22:40:32 +01

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 209 (class 1259 OID 16885)
-- Name: certificats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificats (
    id integer NOT NULL,
    eleve_id integer,
    numero character varying(50) NOT NULL,
    date_emission date DEFAULT CURRENT_DATE,
    annee_scol character varying(20),
    statut character varying(20) DEFAULT 'emis'::character varying
);


ALTER TABLE public.certificats OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 16883)
-- Name: certificats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.certificats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.certificats_id_seq OWNER TO postgres;

--
-- TOC entry 3207 (class 0 OID 0)
-- Dependencies: 208
-- Name: certificats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.certificats_id_seq OWNED BY public.certificats.id;


--
-- TOC entry 205 (class 1259 OID 16836)
-- Name: demandes_rh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.demandes_rh (
    id integer NOT NULL,
    employe_id integer,
    type character varying(50),
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    date_creation date DEFAULT CURRENT_DATE,
    date_debut date,
    date_fin date,
    motif text,
    piece_jointe character varying(255),
    commentaire text
);


ALTER TABLE public.demandes_rh OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 16834)
-- Name: demandes_rh_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.demandes_rh_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.demandes_rh_id_seq OWNER TO postgres;

--
-- TOC entry 3210 (class 0 OID 0)
-- Dependencies: 204
-- Name: demandes_rh_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.demandes_rh_id_seq OWNED BY public.demandes_rh.id;


--
-- TOC entry 211 (class 1259 OID 16902)
-- Name: dossiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dossiers (
    id integer NOT NULL,
    type character varying(20),
    titre character varying(200) NOT NULL,
    eleve_id integer,
    classe character varying(50),
    date date DEFAULT CURRENT_DATE,
    statut character varying(20) DEFAULT 'ouvert'::character varying,
    transmis boolean DEFAULT false,
    destinataire character varying(50)
);


ALTER TABLE public.dossiers OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 16900)
-- Name: dossiers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dossiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dossiers_id_seq OWNER TO postgres;

--
-- TOC entry 3213 (class 0 OID 0)
-- Dependencies: 210
-- Name: dossiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dossiers_id_seq OWNED BY public.dossiers.id;


--
-- TOC entry 203 (class 1259 OID 16824)
-- Name: eleves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eleves (
    id integer NOT NULL,
    id_massar character varying(20),
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    classe character varying(50),
    niveau character varying(50),
    date_naissance date,
    absences integer DEFAULT 0,
    absences_justifiees integer DEFAULT 0
);


ALTER TABLE public.eleves OWNER TO postgres;

--
-- TOC entry 202 (class 1259 OID 16822)
-- Name: eleves_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eleves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.eleves_id_seq OWNER TO postgres;

--
-- TOC entry 3216 (class 0 OID 0)
-- Dependencies: 202
-- Name: eleves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eleves_id_seq OWNED BY public.eleves.id;


--
-- TOC entry 213 (class 1259 OID 16918)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    type character varying(20),
    message text NOT NULL,
    temps timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lu boolean DEFAULT false
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 16916)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 3219 (class 0 OID 0)
-- Dependencies: 212
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 207 (class 1259 OID 16854)
-- Name: operations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operations (
    id integer NOT NULL,
    type character varying(10),
    categorie character varying(50),
    description text,
    montant numeric(12,2) NOT NULL,
    date date DEFAULT CURRENT_DATE,
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    saisie_par integer
);


ALTER TABLE public.operations OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 16852)
-- Name: operations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.operations_id_seq OWNER TO postgres;

--
-- TOC entry 3222 (class 0 OID 0)
-- Dependencies: 206
-- Name: operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operations_id_seq OWNED BY public.operations.id;


--
-- TOC entry 215 (class 1259 OID 16957)
-- Name: resultats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultats (
    id integer NOT NULL,
    massar_id character varying(50),
    eleve_name character varying(255),
    niveau character varying(10),
    trimestre integer,
    maths numeric(4,2),
    physique numeric(4,2),
    svt numeric(4,2),
    francais numeric(4,2),
    arabe numeric(4,2),
    anglais numeric(4,2),
    histoire_geo numeric(4,2),
    education_islamique numeric(4,2),
    informatique numeric(4,2),
    eps numeric(4,2),
    musique numeric(4,2),
    art numeric(4,2),
    moyenne_generale numeric(4,2),
    date_import timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.resultats OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 16955)
-- Name: resultats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resultats_id_seq OWNER TO postgres;

--
-- TOC entry 3225 (class 0 OID 0)
-- Dependencies: 214
-- Name: resultats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultats_id_seq OWNED BY public.resultats.id;


--
-- TOC entry 201 (class 1259 OID 16809)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100),
    role character varying(20),
    email character varying(150) NOT NULL,
    actif boolean DEFAULT true,
    initiales character varying(5),
    poste character varying(100),
    matricule character varying(50),
    solde_conge integer DEFAULT 12,
    password character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 200 (class 1259 OID 16807)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3228 (class 0 OID 0)
-- Dependencies: 200
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3015 (class 2604 OID 16888)
-- Name: certificats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificats ALTER COLUMN id SET DEFAULT nextval('public.certificats_id_seq'::regclass);


--
-- TOC entry 3009 (class 2604 OID 16839)
-- Name: demandes_rh id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demandes_rh ALTER COLUMN id SET DEFAULT nextval('public.demandes_rh_id_seq'::regclass);


--
-- TOC entry 3018 (class 2604 OID 16905)
-- Name: dossiers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers ALTER COLUMN id SET DEFAULT nextval('public.dossiers_id_seq'::regclass);


--
-- TOC entry 3006 (class 2604 OID 16827)
-- Name: eleves id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eleves ALTER COLUMN id SET DEFAULT nextval('public.eleves_id_seq'::regclass);


--
-- TOC entry 3022 (class 2604 OID 16921)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3012 (class 2604 OID 16857)
-- Name: operations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations ALTER COLUMN id SET DEFAULT nextval('public.operations_id_seq'::regclass);


--
-- TOC entry 3025 (class 2604 OID 16960)
-- Name: resultats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats ALTER COLUMN id SET DEFAULT nextval('public.resultats_id_seq'::regclass);


--
-- TOC entry 3003 (class 2604 OID 16812)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3193 (class 0 OID 16885)
-- Dependencies: 209
-- Data for Name: certificats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certificats (id, eleve_id, numero, date_emission, annee_scol, statut) FROM stdin;
\.


--
-- TOC entry 3189 (class 0 OID 16836)
-- Dependencies: 205
-- Data for Name: demandes_rh; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.demandes_rh (id, employe_id, type, statut, date_creation, date_debut, date_fin, motif, piece_jointe, commentaire) FROM stdin;
3	4	conge_exceptionnel	en_attente	2026-03-09	2026-03-14	2026-03-15	Mariage d'un proche.	\N	\N
4	2	attestation	approuve	2026-02-02	\N	\N	Attestation pour demande de crédit bancaire.	\N	\N
5	3	conge_annuel	approuve	2025-12-12	2025-12-22	2025-12-26	Vacances de fin d'année.	\N	\N
6	4	conge_maladie	refuse	2025-11-05	2025-11-06	2025-11-08	Grippe saisonnière. Justificatif manquant.	\N	\N
1	2	conge_maladie	approuve	2026-03-11	2026-03-16	2026-03-20	Hospitalisation pour intervention chirurgicale planifiée.	\N	Traité via Dashboard
2	3	attestation	approuve	2026-03-10	\N	\N	Besoin d'une attestation pour visa.	\N	Traité via Dashboard
7	6	conge_maladie	approuvé	2026-04-22	2026-10-23	2026-11-03	not feeling well	\N	\N
8	6	attestation_travail	rejeté	2026-04-22	2001-01-01	2001-02-05	testing... 	\N	\N
\.


--
-- TOC entry 3195 (class 0 OID 16902)
-- Dependencies: 211
-- Data for Name: dossiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dossiers (id, type, titre, eleve_id, classe, date, statut, transmis, destinataire) FROM stdin;
1	individuel	Dossier disciplinaire — Y. Amrani	1	\N	2026-03-08	ouvert	t	direction
2	collectif	Liste absences Semaine 9 — 2ème A	\N	\N	2026-03-07	transmis	t	admin
\.


--
-- TOC entry 3187 (class 0 OID 16824)
-- Dependencies: 203
-- Data for Name: eleves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eleves (id, id_massar, nom, prenom, classe, niveau, date_naissance, absences, absences_justifiees) FROM stdin;
1	M20089042	Amrani	Youssef	2ème A	2AC	2012-04-12	18	6
2	M20089103	Benhaddou	Sara	2ème B	2AC	2012-09-03	4	4
3	M20089478	Berrada	Nadia	2ème B	2AC	2012-01-15	12	8
4	M20089701	Tahiri	Omar	2ème A	2AC	2012-03-05	16	4
\.


--
-- TOC entry 3197 (class 0 OID 16918)
-- Dependencies: 213
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, message, temps, lu) FROM stdin;
1	5	absence	Alerte : Youssef Amrani a dépassé 15h d'absences	2026-04-20 19:40:24.339185	f
2	1	rh	Nouvelle demande de congé de H. Benali en attente	2026-04-20 19:40:24.339185	f
3	6	Mise à jour RH	Votre demande de conge maladie a été approuvé.	2026-04-22 20:44:23.925816	f
4	6	Mise à jour RH	Votre demande de attestation travail a été rejeté.	2026-04-22 20:44:25.572955	f
\.


--
-- TOC entry 3191 (class 0 OID 16854)
-- Dependencies: 207
-- Data for Name: operations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operations (id, type, categorie, description, montant, date, statut, saisie_par) FROM stdin;
1	revenu	Inscription	Inscriptions scolaires S2 — 142 élèves	71000.00	2026-03-10	valide	3
2	depense	Maintenance	Réparation chauffage bâtiment B	8400.00	2026-03-08	valide	3
3	depense	Matériel	Fournitures scolaires — papeterie	12500.00	2026-03-03	en_attente	3
\.


--
-- TOC entry 3199 (class 0 OID 16957)
-- Dependencies: 215
-- Data for Name: resultats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultats (id, massar_id, eleve_name, niveau, trimestre, maths, physique, svt, francais, arabe, anglais, histoire_geo, education_islamique, informatique, eps, musique, art, moyenne_generale, date_import) FROM stdin;
1	1	Youssef El Amrani	1AC	1	18.80	14.40	8.60	15.50	8.40	14.80	9.20	12.80	8.10	10.90	0.00	0.00	12.15	2026-04-22 22:20:55.244632
2	2	Sara Bennani	1AC	1	14.70	18.70	9.30	16.20	14.10	9.00	10.20	17.30	18.60	19.40	0.00	0.00	14.75	2026-04-22 22:20:55.253391
3	3	Amine Alaoui	1AC	1	9.20	16.90	15.60	16.20	15.70	15.40	11.30	11.50	14.00	8.30	0.00	0.00	13.41	2026-04-22 22:20:55.260722
4	4	Khadija Idrissi	1AC	1	10.10	19.20	9.80	10.60	9.30	9.20	17.60	15.10	14.60	10.80	0.00	0.00	12.63	2026-04-22 22:20:55.26433
5	5	Omar Fassi	1AC	1	12.40	9.70	8.30	11.80	12.60	16.60	17.40	9.00	12.20	11.20	0.00	0.00	12.12	2026-04-22 22:20:55.268455
6	6	Salma Tazi	1AC	1	17.90	13.90	15.00	16.90	13.70	16.50	12.80	9.50	14.50	14.20	0.00	0.00	14.49	2026-04-22 22:20:55.273203
7	7	Rachid Chakiri	1AC	1	16.90	8.40	11.90	9.30	12.10	9.30	8.90	17.70	17.00	14.90	0.00	0.00	12.64	2026-04-22 22:20:55.281802
8	8	Imane Berrada	1AC	1	10.00	10.60	16.70	9.10	9.80	17.90	13.80	14.40	16.40	12.90	0.00	0.00	13.16	2026-04-22 22:20:55.284701
9	9	Ayoub Naciri	1AC	1	16.20	12.20	14.80	18.40	10.50	19.80	18.00	18.20	19.80	13.80	0.00	0.00	16.17	2026-04-22 22:20:55.287829
10	10	Nora Zouhair	1AC	1	10.20	10.70	14.80	16.80	13.20	16.20	12.30	8.80	10.00	11.10	0.00	0.00	12.41	2026-04-22 22:20:55.290889
11	11	Hassan Lahlou	1AC	1	13.80	9.40	16.80	19.90	18.80	15.90	9.10	15.30	17.80	11.90	0.00	0.00	14.87	2026-04-22 22:20:55.293977
12	12	Lina Benjelloun	1AC	1	15.90	17.00	18.10	13.40	9.10	19.90	9.90	8.40	8.40	15.10	0.00	0.00	13.52	2026-04-22 22:20:55.302843
13	13	Mehdi Ouazzani	1AC	1	11.30	19.90	15.10	10.80	18.00	9.20	18.70	14.00	13.80	12.70	0.00	0.00	14.35	2026-04-22 22:20:55.305723
14	14	Zineb Skalli	1AC	1	13.00	13.10	13.80	9.30	17.20	13.80	12.00	9.60	17.80	18.50	0.00	0.00	13.81	2026-04-22 22:20:55.313883
15	15	Hamza Mansouri	1AC	1	12.00	12.90	17.70	11.90	14.80	9.50	8.40	16.60	19.20	13.90	0.00	0.00	13.69	2026-04-22 22:20:55.322795
16	16	Aya Kadiri	1AC	1	19.00	8.60	15.10	11.50	13.80	13.60	18.00	11.00	15.80	11.20	0.00	0.00	13.76	2026-04-22 22:20:55.325896
17	17	Karim Tahiri	1AC	1	19.10	13.50	18.10	9.50	17.20	14.70	12.10	18.10	14.80	19.80	0.00	0.00	15.69	2026-04-22 22:20:55.331574
18	18	Sofia Raji	1AC	1	15.90	11.70	8.90	10.30	15.50	11.60	10.30	10.10	16.30	19.10	0.00	0.00	12.97	2026-04-22 22:20:55.338968
19	19	Bilal Zerouali	1AC	1	8.40	8.80	10.90	17.10	12.40	14.30	8.80	10.80	18.20	13.20	0.00	0.00	12.29	2026-04-22 22:20:55.348252
20	20	Meryem El Fassi	1AC	1	13.10	14.80	13.10	19.20	11.70	18.70	15.80	18.60	12.40	19.90	0.00	0.00	15.73	2026-04-22 22:20:55.352548
21	1	Youssef El Amrani	1AC	1	18.80	14.40	8.60	15.50	8.40	14.80	9.20	12.80	8.10	10.90	0.00	0.00	12.15	2026-04-22 22:21:24.055629
22	2	Sara Bennani	1AC	1	14.70	18.70	9.30	16.20	14.10	9.00	10.20	17.30	18.60	19.40	0.00	0.00	14.75	2026-04-22 22:21:24.065075
23	3	Amine Alaoui	1AC	1	9.20	16.90	15.60	16.20	15.70	15.40	11.30	11.50	14.00	8.30	0.00	0.00	13.41	2026-04-22 22:21:24.068771
24	4	Khadija Idrissi	1AC	1	10.10	19.20	9.80	10.60	9.30	9.20	17.60	15.10	14.60	10.80	0.00	0.00	12.63	2026-04-22 22:21:24.071675
25	5	Omar Fassi	1AC	1	12.40	9.70	8.30	11.80	12.60	16.60	17.40	9.00	12.20	11.20	0.00	0.00	12.12	2026-04-22 22:21:24.081279
26	6	Salma Tazi	1AC	1	17.90	13.90	15.00	16.90	13.70	16.50	12.80	9.50	14.50	14.20	0.00	0.00	14.49	2026-04-22 22:21:24.084515
27	7	Rachid Chakiri	1AC	1	16.90	8.40	11.90	9.30	12.10	9.30	8.90	17.70	17.00	14.90	0.00	0.00	12.64	2026-04-22 22:21:24.091639
28	8	Imane Berrada	1AC	1	10.00	10.60	16.70	9.10	9.80	17.90	13.80	14.40	16.40	12.90	0.00	0.00	13.16	2026-04-22 22:21:24.094733
29	9	Ayoub Naciri	1AC	1	16.20	12.20	14.80	18.40	10.50	19.80	18.00	18.20	19.80	13.80	0.00	0.00	16.17	2026-04-22 22:21:24.098787
30	10	Nora Zouhair	1AC	1	10.20	10.70	14.80	16.80	13.20	16.20	12.30	8.80	10.00	11.10	0.00	0.00	12.41	2026-04-22 22:21:24.102146
31	11	Hassan Lahlou	1AC	1	13.80	9.40	16.80	19.90	18.80	15.90	9.10	15.30	17.80	11.90	0.00	0.00	14.87	2026-04-22 22:21:24.105728
32	12	Lina Benjelloun	1AC	1	15.90	17.00	18.10	13.40	9.10	19.90	9.90	8.40	8.40	15.10	0.00	0.00	13.52	2026-04-22 22:21:24.108682
33	13	Mehdi Ouazzani	1AC	1	11.30	19.90	15.10	10.80	18.00	9.20	18.70	14.00	13.80	12.70	0.00	0.00	14.35	2026-04-22 22:21:24.112034
34	14	Zineb Skalli	1AC	1	13.00	13.10	13.80	9.30	17.20	13.80	12.00	9.60	17.80	18.50	0.00	0.00	13.81	2026-04-22 22:21:24.115362
35	15	Hamza Mansouri	1AC	1	12.00	12.90	17.70	11.90	14.80	9.50	8.40	16.60	19.20	13.90	0.00	0.00	13.69	2026-04-22 22:21:24.1185
36	16	Aya Kadiri	1AC	1	19.00	8.60	15.10	11.50	13.80	13.60	18.00	11.00	15.80	11.20	0.00	0.00	13.76	2026-04-22 22:21:24.120813
37	17	Karim Tahiri	1AC	1	19.10	13.50	18.10	9.50	17.20	14.70	12.10	18.10	14.80	19.80	0.00	0.00	15.69	2026-04-22 22:21:24.123129
38	18	Sofia Raji	1AC	1	15.90	11.70	8.90	10.30	15.50	11.60	10.30	10.10	16.30	19.10	0.00	0.00	12.97	2026-04-22 22:21:24.12557
39	19	Bilal Zerouali	1AC	1	8.40	8.80	10.90	17.10	12.40	14.30	8.80	10.80	18.20	13.20	0.00	0.00	12.29	2026-04-22 22:21:24.128415
40	20	Meryem El Fassi	1AC	1	13.10	14.80	13.10	19.20	11.70	18.70	15.80	18.60	12.40	19.90	0.00	0.00	15.73	2026-04-22 22:21:24.131701
41	1	Youssef El Amrani	2AC	1	18.80	14.40	8.60	15.50	8.40	14.80	9.20	12.80	8.10	10.90	0.00	0.00	12.15	2026-04-22 22:30:15.545703
42	2	Sara Bennani	2AC	1	14.70	18.70	9.30	16.20	14.10	9.00	10.20	17.30	18.60	19.40	0.00	0.00	14.75	2026-04-22 22:30:15.553345
43	3	Amine Alaoui	2AC	1	9.20	16.90	15.60	16.20	15.70	15.40	11.30	11.50	14.00	8.30	0.00	0.00	13.41	2026-04-22 22:30:15.562729
44	4	Khadija Idrissi	2AC	1	10.10	19.20	9.80	10.60	9.30	9.20	17.60	15.10	14.60	10.80	0.00	0.00	12.63	2026-04-22 22:30:15.56646
45	5	Omar Fassi	2AC	1	12.40	9.70	8.30	11.80	12.60	16.60	17.40	9.00	12.20	11.20	0.00	0.00	12.12	2026-04-22 22:30:15.572192
46	6	Salma Tazi	2AC	1	17.90	13.90	15.00	16.90	13.70	16.50	12.80	9.50	14.50	14.20	0.00	0.00	14.49	2026-04-22 22:30:15.575388
47	7	Rachid Chakiri	2AC	1	16.90	8.40	11.90	9.30	12.10	9.30	8.90	17.70	17.00	14.90	0.00	0.00	12.64	2026-04-22 22:30:15.58089
48	8	Imane Berrada	2AC	1	10.00	10.60	16.70	9.10	9.80	17.90	13.80	14.40	16.40	12.90	0.00	0.00	13.16	2026-04-22 22:30:15.584374
49	9	Ayoub Naciri	2AC	1	16.20	12.20	14.80	18.40	10.50	19.80	18.00	18.20	19.80	13.80	0.00	0.00	16.17	2026-04-22 22:30:15.587375
50	10	Nora Zouhair	2AC	1	10.20	10.70	14.80	16.80	13.20	16.20	12.30	8.80	10.00	11.10	0.00	0.00	12.41	2026-04-22 22:30:15.596163
51	11	Hassan Lahlou	2AC	1	13.80	9.40	16.80	19.90	18.80	15.90	9.10	15.30	17.80	11.90	0.00	0.00	14.87	2026-04-22 22:30:15.598997
52	12	Lina Benjelloun	2AC	1	15.90	17.00	18.10	13.40	9.10	19.90	9.90	8.40	8.40	15.10	0.00	0.00	13.52	2026-04-22 22:30:15.602001
53	13	Mehdi Ouazzani	2AC	1	11.30	19.90	15.10	10.80	18.00	9.20	18.70	14.00	13.80	12.70	0.00	0.00	14.35	2026-04-22 22:30:15.611758
54	14	Zineb Skalli	2AC	1	13.00	13.10	13.80	9.30	17.20	13.80	12.00	9.60	17.80	18.50	0.00	0.00	13.81	2026-04-22 22:30:15.615569
55	15	Hamza Mansouri	2AC	1	12.00	12.90	17.70	11.90	14.80	9.50	8.40	16.60	19.20	13.90	0.00	0.00	13.69	2026-04-22 22:30:15.618872
56	16	Aya Kadiri	2AC	1	19.00	8.60	15.10	11.50	13.80	13.60	18.00	11.00	15.80	11.20	0.00	0.00	13.76	2026-04-22 22:30:15.623167
57	17	Karim Tahiri	2AC	1	19.10	13.50	18.10	9.50	17.20	14.70	12.10	18.10	14.80	19.80	0.00	0.00	15.69	2026-04-22 22:30:15.627278
58	18	Sofia Raji	2AC	1	15.90	11.70	8.90	10.30	15.50	11.60	10.30	10.10	16.30	19.10	0.00	0.00	12.97	2026-04-22 22:30:15.631431
59	19	Bilal Zerouali	2AC	1	8.40	8.80	10.90	17.10	12.40	14.30	8.80	10.80	18.20	13.20	0.00	0.00	12.29	2026-04-22 22:30:15.634945
60	20	Meryem El Fassi	2AC	1	13.10	14.80	13.10	19.20	11.70	18.70	15.80	18.60	12.40	19.90	0.00	0.00	15.73	2026-04-22 22:30:15.63791
\.


--
-- TOC entry 3185 (class 0 OID 16809)
-- Dependencies: 201
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, nom, prenom, role, email, actif, initiales, poste, matricule, solde_conge, password) FROM stdin;
1	Al-Fassi	Mohammed	direction	direction@college.ma	t	MA	Directeur	DIR-001	12	password123
2	Benali	Hassan	employe	h.benali@college.ma	t	HB	Secrétaire	EMP-001	15	password123
3	Ouahbi	Karima	employe	k.ouahbi@college.ma	t	KO	Comptable	EMP-002	18	password123
4	Benkirane	Younes	surveillant	surveillant@college.ma	t	YB	Surveillant Général	SUR-001	10	password123
5	Zangati	Enseignant	admin	admin@college.ma	t	ZA	Professeur d'Informatique	PROF-2026	20	password123
6	El zangati	khadija 	employe	khadijaelzangati@gmail.com	t	KE	\N	\N	12	87654321
7	El zangati	Ezzahra	service_financier	ezzahraelzangati@gmail.com	t	EE	\N	\N	12	987654321
\.


--
-- TOC entry 3230 (class 0 OID 0)
-- Dependencies: 208
-- Name: certificats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.certificats_id_seq', 1, false);


--
-- TOC entry 3231 (class 0 OID 0)
-- Dependencies: 204
-- Name: demandes_rh_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.demandes_rh_id_seq', 8, true);


--
-- TOC entry 3232 (class 0 OID 0)
-- Dependencies: 210
-- Name: dossiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dossiers_id_seq', 2, true);


--
-- TOC entry 3233 (class 0 OID 0)
-- Dependencies: 202
-- Name: eleves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eleves_id_seq', 4, true);


--
-- TOC entry 3234 (class 0 OID 0)
-- Dependencies: 212
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 4, true);


--
-- TOC entry 3235 (class 0 OID 0)
-- Dependencies: 206
-- Name: operations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operations_id_seq', 3, true);


--
-- TOC entry 3236 (class 0 OID 0)
-- Dependencies: 214
-- Name: resultats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultats_id_seq', 60, true);


--
-- TOC entry 3237 (class 0 OID 0)
-- Dependencies: 200
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- TOC entry 3040 (class 2606 OID 16894)
-- Name: certificats certificats_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificats
    ADD CONSTRAINT certificats_numero_key UNIQUE (numero);


--
-- TOC entry 3042 (class 2606 OID 16892)
-- Name: certificats certificats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificats
    ADD CONSTRAINT certificats_pkey PRIMARY KEY (id);


--
-- TOC entry 3036 (class 2606 OID 16846)
-- Name: demandes_rh demandes_rh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demandes_rh
    ADD CONSTRAINT demandes_rh_pkey PRIMARY KEY (id);


--
-- TOC entry 3044 (class 2606 OID 16910)
-- Name: dossiers dossiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers
    ADD CONSTRAINT dossiers_pkey PRIMARY KEY (id);


--
-- TOC entry 3032 (class 2606 OID 16833)
-- Name: eleves eleves_id_massar_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT eleves_id_massar_key UNIQUE (id_massar);


--
-- TOC entry 3034 (class 2606 OID 16831)
-- Name: eleves eleves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT eleves_pkey PRIMARY KEY (id);


--
-- TOC entry 3046 (class 2606 OID 16928)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3038 (class 2606 OID 16864)
-- Name: operations operations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_pkey PRIMARY KEY (id);


--
-- TOC entry 3048 (class 2606 OID 16963)
-- Name: resultats resultats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultats
    ADD CONSTRAINT resultats_pkey PRIMARY KEY (id);


--
-- TOC entry 3028 (class 2606 OID 16821)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3030 (class 2606 OID 16819)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3051 (class 2606 OID 16895)
-- Name: certificats certificats_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificats
    ADD CONSTRAINT certificats_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- TOC entry 3049 (class 2606 OID 16847)
-- Name: demandes_rh demandes_rh_employe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.demandes_rh
    ADD CONSTRAINT demandes_rh_employe_id_fkey FOREIGN KEY (employe_id) REFERENCES public.users(id);


--
-- TOC entry 3052 (class 2606 OID 16911)
-- Name: dossiers dossiers_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers
    ADD CONSTRAINT dossiers_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- TOC entry 3053 (class 2606 OID 16929)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3050 (class 2606 OID 16865)
-- Name: operations operations_saisie_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_saisie_par_fkey FOREIGN KEY (saisie_par) REFERENCES public.users(id);


--
-- TOC entry 3205 (class 0 OID 0)
-- Dependencies: 3
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO sgs_admin;


--
-- TOC entry 3206 (class 0 OID 0)
-- Dependencies: 209
-- Name: TABLE certificats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.certificats TO sgs_admin;


--
-- TOC entry 3208 (class 0 OID 0)
-- Dependencies: 208
-- Name: SEQUENCE certificats_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.certificats_id_seq TO sgs_admin;


--
-- TOC entry 3209 (class 0 OID 0)
-- Dependencies: 205
-- Name: TABLE demandes_rh; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.demandes_rh TO sgs_admin;


--
-- TOC entry 3211 (class 0 OID 0)
-- Dependencies: 204
-- Name: SEQUENCE demandes_rh_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.demandes_rh_id_seq TO sgs_admin;


--
-- TOC entry 3212 (class 0 OID 0)
-- Dependencies: 211
-- Name: TABLE dossiers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.dossiers TO sgs_admin;


--
-- TOC entry 3214 (class 0 OID 0)
-- Dependencies: 210
-- Name: SEQUENCE dossiers_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.dossiers_id_seq TO sgs_admin;


--
-- TOC entry 3215 (class 0 OID 0)
-- Dependencies: 203
-- Name: TABLE eleves; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.eleves TO sgs_admin;


--
-- TOC entry 3217 (class 0 OID 0)
-- Dependencies: 202
-- Name: SEQUENCE eleves_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.eleves_id_seq TO sgs_admin;


--
-- TOC entry 3218 (class 0 OID 0)
-- Dependencies: 213
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO sgs_admin;


--
-- TOC entry 3220 (class 0 OID 0)
-- Dependencies: 212
-- Name: SEQUENCE notifications_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.notifications_id_seq TO sgs_admin;


--
-- TOC entry 3221 (class 0 OID 0)
-- Dependencies: 207
-- Name: TABLE operations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.operations TO sgs_admin;


--
-- TOC entry 3223 (class 0 OID 0)
-- Dependencies: 206
-- Name: SEQUENCE operations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.operations_id_seq TO sgs_admin;


--
-- TOC entry 3224 (class 0 OID 0)
-- Dependencies: 215
-- Name: TABLE resultats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.resultats TO PUBLIC;


--
-- TOC entry 3226 (class 0 OID 0)
-- Dependencies: 214
-- Name: SEQUENCE resultats_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.resultats_id_seq TO PUBLIC;


--
-- TOC entry 3227 (class 0 OID 0)
-- Dependencies: 201
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO sgs_admin;


--
-- TOC entry 3229 (class 0 OID 0)
-- Dependencies: 200
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO sgs_admin;


--
-- TOC entry 1757 (class 826 OID 16953)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO PUBLIC;


-- Completed on 2026-04-22 22:40:32 +01

--
-- PostgreSQL database dump complete
--

