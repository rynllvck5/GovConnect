--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-12-12 02:06:49

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- TOC entry 232 (class 1259 OID 33550)
-- Name: barangay_officials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barangay_officials (
    id integer NOT NULL,
    barangay_id integer NOT NULL,
    name text NOT NULL,
    "position" text NOT NULL,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.barangay_officials OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 33549)
-- Name: barangay_officials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.barangay_officials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.barangay_officials_id_seq OWNER TO postgres;

--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 231
-- Name: barangay_officials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.barangay_officials_id_seq OWNED BY public.barangay_officials.id;


--
-- TOC entry 222 (class 1259 OID 33451)
-- Name: barangays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barangays (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    image_url text
);


ALTER TABLE public.barangays OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 33450)
-- Name: barangays_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.barangays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.barangays_id_seq OWNER TO postgres;

--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 221
-- Name: barangays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.barangays_id_seq OWNED BY public.barangays.id;


--
-- TOC entry 230 (class 1259 OID 33524)
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    thread_key text NOT NULL,
    user_id integer NOT NULL,
    text text NOT NULL,
    parent_id integer,
    is_anonymous boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 33523)
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 229
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- TOC entry 244 (class 1259 OID 33666)
-- Name: downloadable_form_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.downloadable_form_files (
    id integer NOT NULL,
    form_id integer NOT NULL,
    file_url text NOT NULL,
    original_name text,
    mime_type text,
    size bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.downloadable_form_files OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 33665)
-- Name: downloadable_form_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.downloadable_form_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.downloadable_form_files_id_seq OWNER TO postgres;

--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 243
-- Name: downloadable_form_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.downloadable_form_files_id_seq OWNED BY public.downloadable_form_files.id;


--
-- TOC entry 242 (class 1259 OID 33649)
-- Name: downloadable_forms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.downloadable_forms (
    id integer NOT NULL,
    office_id integer NOT NULL,
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.downloadable_forms OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 33648)
-- Name: downloadable_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.downloadable_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.downloadable_forms_id_seq OWNER TO postgres;

--
-- TOC entry 5082 (class 0 OID 0)
-- Dependencies: 241
-- Name: downloadable_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.downloadable_forms_id_seq OWNED BY public.downloadable_forms.id;


--
-- TOC entry 228 (class 1259 OID 33507)
-- Name: forum_post_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_post_images (
    id integer NOT NULL,
    post_id integer NOT NULL,
    url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.forum_post_images OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 33506)
-- Name: forum_post_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forum_post_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forum_post_images_id_seq OWNER TO postgres;

--
-- TOC entry 5083 (class 0 OID 0)
-- Dependencies: 227
-- Name: forum_post_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forum_post_images_id_seq OWNED BY public.forum_post_images.id;


--
-- TOC entry 226 (class 1259 OID 33491)
-- Name: forum_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forum_posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    category text,
    location text,
    is_anonymous boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.forum_posts OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 33490)
-- Name: forum_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forum_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forum_posts_id_seq OWNER TO postgres;

--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 225
-- Name: forum_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forum_posts_id_seq OWNED BY public.forum_posts.id;


--
-- TOC entry 236 (class 1259 OID 33585)
-- Name: gov_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gov_categories (
    id integer NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    schema_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    layout_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gov_categories OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 33584)
-- Name: gov_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gov_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gov_categories_id_seq OWNER TO postgres;

--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 235
-- Name: gov_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gov_categories_id_seq OWNED BY public.gov_categories.id;


--
-- TOC entry 238 (class 1259 OID 33603)
-- Name: gov_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gov_entries (
    id integer NOT NULL,
    category_id integer NOT NULL,
    title text,
    content_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    published boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    manager_user_id integer
);


ALTER TABLE public.gov_entries OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 33602)
-- Name: gov_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gov_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gov_entries_id_seq OWNER TO postgres;

--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 237
-- Name: gov_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gov_entries_id_seq OWNED BY public.gov_entries.id;


--
-- TOC entry 240 (class 1259 OID 33636)
-- Name: municipal_officials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.municipal_officials (
    id integer NOT NULL,
    name text NOT NULL,
    "position" text NOT NULL,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.municipal_officials OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 33635)
-- Name: municipal_officials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.municipal_officials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.municipal_officials_id_seq OWNER TO postgres;

--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 239
-- Name: municipal_officials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.municipal_officials_id_seq OWNED BY public.municipal_officials.id;


--
-- TOC entry 220 (class 1259 OID 33440)
-- Name: offices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offices (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    slug text,
    head text,
    location text,
    contact text,
    map_query text,
    image_url text,
    head_image_url text,
    lat double precision,
    lng double precision
);


ALTER TABLE public.offices OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 33439)
-- Name: offices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.offices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offices_id_seq OWNER TO postgres;

--
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 219
-- Name: offices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.offices_id_seq OWNED BY public.offices.id;


--
-- TOC entry 218 (class 1259 OID 33429)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 33428)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 234 (class 1259 OID 33566)
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    office_id integer NOT NULL,
    name text NOT NULL,
    description text,
    venue text,
    contact text,
    requirements jsonb DEFAULT '[]'::jsonb NOT NULL,
    steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    forms jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 33565)
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 233
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- TOC entry 224 (class 1259 OID 33462)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role_id integer NOT NULL,
    office_id integer,
    barangay_id integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    profile_image_url text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 33461)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 223
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4808 (class 2604 OID 33553)
-- Name: barangay_officials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangay_officials ALTER COLUMN id SET DEFAULT nextval('public.barangay_officials_id_seq'::regclass);


--
-- TOC entry 4795 (class 2604 OID 33454)
-- Name: barangays id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangays ALTER COLUMN id SET DEFAULT nextval('public.barangays_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 33527)
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- TOC entry 4836 (class 2604 OID 33669)
-- Name: downloadable_form_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloadable_form_files ALTER COLUMN id SET DEFAULT nextval('public.downloadable_form_files_id_seq'::regclass);


--
-- TOC entry 4833 (class 2604 OID 33652)
-- Name: downloadable_forms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloadable_forms ALTER COLUMN id SET DEFAULT nextval('public.downloadable_forms_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 33510)
-- Name: forum_post_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_images ALTER COLUMN id SET DEFAULT nextval('public.forum_post_images_id_seq'::regclass);


--
-- TOC entry 4800 (class 2604 OID 33494)
-- Name: forum_posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts ALTER COLUMN id SET DEFAULT nextval('public.forum_posts_id_seq'::regclass);


--
-- TOC entry 4816 (class 2604 OID 33588)
-- Name: gov_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_categories ALTER COLUMN id SET DEFAULT nextval('public.gov_categories_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 33606)
-- Name: gov_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_entries ALTER COLUMN id SET DEFAULT nextval('public.gov_entries_id_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 33639)
-- Name: municipal_officials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipal_officials ALTER COLUMN id SET DEFAULT nextval('public.municipal_officials_id_seq'::regclass);


--
-- TOC entry 4794 (class 2604 OID 33443)
-- Name: offices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offices ALTER COLUMN id SET DEFAULT nextval('public.offices_id_seq'::regclass);


--
-- TOC entry 4793 (class 2604 OID 33432)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 33569)
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- TOC entry 4796 (class 2604 OID 33465)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5060 (class 0 OID 33550)
-- Dependencies: 232
-- Data for Name: barangay_officials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barangay_officials (id, barangay_id, name, "position", image_url, sort_order) FROM stdin;
6	1	ren	kgwd	/uploads/barangays/brgy_official_1765307017692.jpg	0
7	1	Orlando	SK Chairman	/uploads/barangays/brgy_official_1765370976067.png	1
\.


--
-- TOC entry 5050 (class 0 OID 33451)
-- Dependencies: 222
-- Data for Name: barangays; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barangays (id, name, description, image_url) FROM stdin;
1	Barangay Malinao	Default barangay for testing	/uploads/barangays/brgy_1765307017680.jpg
\.


--
-- TOC entry 5058 (class 0 OID 33524)
-- Dependencies: 230
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, thread_key, user_id, text, parent_id, is_anonymous, created_at) FROM stdin;
\.


--
-- TOC entry 5072 (class 0 OID 33666)
-- Dependencies: 244
-- Data for Name: downloadable_form_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.downloadable_form_files (id, form_id, file_url, original_name, mime_type, size, created_at) FROM stdin;
1	1	/uploads/forms/form_1765472813394_fn70sxoa6sa.png	\N	\N	\N	2025-12-12 01:42:05.735238
2	1	/uploads/forms/form_1765474992748_yb62kyttyns.png	Screenshot 2025-12-12 003136.png	image/png	35533	2025-12-12 01:43:12.767792
3	1	/uploads/forms/form_1765475022829_aykfxvavqa4.docx	PDC-M1-L2-Exercise.docx	application/vnd.openxmlformats-officedocument.wordprocessingml.document	14006	2025-12-12 01:43:42.837643
\.


--
-- TOC entry 5070 (class 0 OID 33649)
-- Dependencies: 242
-- Data for Name: downloadable_forms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.downloadable_forms (id, office_id, title, description, file_url, created_at, updated_at) FROM stdin;
1	1	Civil Registry Formm	Form for Civil Registryy	/uploads/forms/form_1765472813394_fn70sxoa6sa.png	2025-12-12 01:06:23.183493	2025-12-12 01:43:42.839173
2	1	Business Permit	dadad	/uploads/forms/form_1765475576822_g9t38pgxnxe.docx	2025-12-12 01:52:56.843568	2025-12-12 01:52:56.843568
3	1	sads	sdas	/uploads/forms/form_1765475626111_01w5og0xbotr.docx	2025-12-12 01:53:46.119166	2025-12-12 01:53:46.119166
4	5	aaaa	aaaa	/uploads/forms/form_1765475664821_5x0nn82idsh.docx	2025-12-12 01:54:24.823937	2025-12-12 01:54:24.823937
\.


--
-- TOC entry 5056 (class 0 OID 33507)
-- Dependencies: 228
-- Data for Name: forum_post_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forum_post_images (id, post_id, url, sort_order) FROM stdin;
1	1	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABdwAAAcICAMAAAAR2/NGAAAAxlBMVEUAAAAAAAAAAAAAAAAGCgzn5+f8/f7///+3t7czMzPw8PAfHx/W1tZVVVVHRkbGxsYdFBGV2vMAoO1x0/fX6/NSyfUtu/Lo+f8OsfEAqu8Ar+8ApO236ft2r8UAt/0An9kAfKsAxv8ASGNkZGRzcnJ/f3+pqamTk5MAAAAAAAAAAAAAAAAAAAAAAAD////////////////////////////////////////////////////////////////9/f3///////+qqqpdql0QAAAAQnRSTlMAGPP////+////////////////////////////////////////////4kRskK/KY7hnbq9Cw786pFuVzk6BLfUc3gioZyuEAACr3klEQVR42uzaS27bMBQFUI+k3dTWl7JEkdT+N9XYSYEM2iY1ajixzoE+I84uHx4/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgutvWvtgPcLq9Xy3no++FTb9uMWfTgRuspvgmlrqo/P3UJ8c1pPcAn5SVeDOk1Rv/qMmYO8UWnxsMH1q4blziUuZSS6huk69Ahdi8Uen5nG7vu1JYyp/p/KS/6uHRdPgDvbFteYgihf98W3az69e9DCHHJmxnHxZbHGEJbPgzY7aFLfQjnKW9aeVin6cd5Tqm+m5TSMU6TPn7P1mmKQ0rXInxn1SVyJZwWiWOntnVsjsNc1fdXXT/z0MYxa6l2Jl8OSuf6AdI8tM1q2ciu5Cme5/oh5hCbRYXfhzzFNtWPVVrH/OxD7uKxPHzC9XFxi+2p5bFprzmr6sdLpY92aXhi2xhDn+qvorTR5YZntOXpfHyt61/KHJpRR8HTyctPdu5uOVUkCABwquBMi6jgv6NeJEXAu6jEiCB/vv9L7aC7HrLkJIdh0MHqbyYxmiqv2q6mezBcx0BAMtmoFUv4RxIdwuA8N5VT6m3xUDx6GFkhJfPnLSvh91jCN98pevMCaaPst3SN8YYeQLTxA5AdAYjd8P0JNdZpv/VSaA4Wb0dM8KixooOXxtAcqXfAnmgT7TduSuS9MvyTdPeGLUHUPMnRX0MDBe4GC6omOe39HTRX4L5hvKEG2R/cuHF11FW8C/EgfDNEGy9t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	0
2	2	data:image/png;base64,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	0
\.


--
-- TOC entry 5054 (class 0 OID 33491)
-- Dependencies: 226
-- Data for Name: forum_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forum_posts (id, user_id, title, message, category, location, is_anonymous, created_at) FROM stdin;
1	2	Admin Post	message	Concern	XYZ	t	2025-12-10 00:54:16.797338
2	2	Non Anon post	message	Inquiry	xyz	f	2025-12-10 00:54:47.34649
\.


--
-- TOC entry 5064 (class 0 OID 33585)
-- Dependencies: 236
-- Data for Name: gov_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gov_categories (id, slug, title, description, schema_json, layout_json, is_active, sort_order, created_at, updated_at) FROM stdin;
2	ordinances	Ordinances	These are the ordinances of the municipality of caba.	{"fields": [{"key": "ordinance_image", "type": "image", "label": "", "required": false}, {"key": "description", "type": "text", "label": "description", "required": true}]}	{"style": "list"}	t	0	2025-12-10 23:28:31.976054	2025-12-11 02:08:33.415533
3	resolutions	Resolutions	This section are for resolutions	{"fields": [{"key": "image", "type": "images", "label": "", "required": false}, {"key": "title", "type": "text", "label": "title", "required": true}, {"key": "document", "type": "files", "label": "document", "required": false}, {"key": "description", "type": "text", "label": "description", "required": false}]}	{"style": "list"}	t	0	2025-12-11 20:55:15.320133	2025-12-11 20:55:15.320133
\.


--
-- TOC entry 5066 (class 0 OID 33603)
-- Dependencies: 238
-- Data for Name: gov_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gov_entries (id, category_id, title, content_json, published, sort_order, created_at, updated_at, manager_user_id) FROM stdin;
3	2	ordiannce	{"name": "ordinacne 1", "description": "descrription", "ordinance image": "/uploads/gov/gov_1765384983879_lgf1x33d1r.jpg", "ordinance_image": "/uploads/gov/gov_1765390128781_wj70o616h4.png"}	t	0	2025-12-11 00:43:03.884863	2025-12-11 02:16:52.823548	3
5	3	Resolution no.1	{"image": ["/uploads/gov/gov_1765457791845_bp1be6ronj4.jpg"], "title": "reso 1", "document": ["/uploads/gov/gov_1765457791852_bpj9w5maos8.docx"], "description": "This document contains the description about reso 1"}	t	0	2025-12-11 20:56:31.883605	2025-12-11 20:56:31.883605	3
\.


--
-- TOC entry 5068 (class 0 OID 33636)
-- Dependencies: 240
-- Data for Name: municipal_officials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.municipal_officials (id, name, "position", image_url, sort_order, created_at, updated_at) FROM stdin;
2	ren f abuan	mayor	/uploads/gov/gov_1765470719294_wjj0he58q0q.png	0	2025-12-12 00:31:59.300037	2025-12-12 00:31:59.300037
\.


--
-- TOC entry 5048 (class 0 OID 33440)
-- Dependencies: 220
-- Data for Name: offices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offices (id, name, description, slug, head, location, contact, map_query, image_url, head_image_url, lat, lng) FROM stdin;
5	Office of the Mayor	Descripotion ng sample office	office-of-the-mayor	Renren abuan	Municipal Hall	(042)	\N	/uploads/offices/ofc_1765303946865.jpg	/uploads/offices/ofc_head_1765303946869.jpg	16.431050010993193	120.34354158696024
1	City Information Office	Handles public information and communications	city-information-office	CIO Head Sample Name	Municipal Hall	(042)	Municipal Hall, Town	/uploads/offices/ofc_1765304480103.png	/uploads/offices/ofc_head_1765304480103.png	16.50475232641059	120.32044367524354
\.


--
-- TOC entry 5046 (class 0 OID 33429)
-- Dependencies: 218
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name) FROM stdin;
1	superadmin
2	admin
3	officer
4	barangay_captain
5	constituent
\.


--
-- TOC entry 5062 (class 0 OID 33566)
-- Dependencies: 234
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, office_id, name, description, venue, contact, requirements, steps, forms, created_at, updated_at) FROM stdin;
3	5	try	try	asd	123	["1"]	["1"]	[{"url": "/uploads/services/svc_form_1765471263204_wrrs9a93ro.png", "label": "Screenshot 2025-12-12 003136.png"}]	2025-12-12 00:41:03.211076	2025-12-12 00:41:03.211076
1	1	Civil Registryy	Civil Registry Service Instructionss	Poblacion Nortee	(042)1	["Requirement 11", "Requirement 22", "Req 3"]	["Step 11", "Step 22", "Step 33", "Step 44"]	[{"url": "/uploads/services/svc_form_1765374410388_k39ivtekc9.png", "label": "M1 L2"}, {"url": "/uploads/services/svc_form_1765472908625_h8nxbzjrpyg.png", "label": "image"}]	2025-12-10 03:49:14.026093	2025-12-12 01:08:28.631172
\.


--
-- TOC entry 5052 (class 0 OID 33462)
-- Dependencies: 224
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, password_hash, role_id, office_id, barangay_id, is_active, created_at, updated_at, profile_image_url) FROM stdin;
1	Super Admin	superadmin@govconnect.local	$2a$10$LoKc1EvCxLnIK6BbFfjV8.rHWZbxjuzS4eZYMjMuX6JvYKM8zmMqG	1	\N	\N	t	2025-12-09 23:37:06.808542	2025-12-12 01:42:05.837254	\N
2	Admin User	admin@govconnect.local	$2a$10$5CF1Qi4k.fp1U3U/0UrhoO3DAjtGM3QGCD299cvcHn.UpjBUjGz/2	2	\N	\N	t	2025-12-09 23:37:06.8918	2025-12-12 01:42:05.922038	\N
3	Office Officer	officer@govconnect.local	$2a$10$DmgVFgF6ppnQBdbKpOTUJuWjf9b.F/pltwv6qY4payNQInQtqJibq	3	1	\N	t	2025-12-09 23:37:06.975021	2025-12-12 01:42:06.003446	\N
4	Barangay Captain	captain@govconnect.local	$2a$10$eEUqYMVvhZk6VgLF.C3UDO51i7nN3cvCbMxe/NMkd07Ed.sQDfKJi	4	\N	1	t	2025-12-09 23:37:07.058872	2025-12-12 01:42:06.08413	\N
5	Juan Dela Cruz	constituent@govconnect.local	$2a$10$Q0YT.zMWSMJSNTzR6kA7NeF/ZCRAhwyKOies9BpHsNYGwTzDvQ1pi	5	\N	1	t	2025-12-09 23:37:07.142969	2025-12-12 01:42:06.166342	\N
\.


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 231
-- Name: barangay_officials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.barangay_officials_id_seq', 8, true);


--
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 221
-- Name: barangays_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.barangays_id_seq', 16, true);


--
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 229
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- TOC entry 5095 (class 0 OID 0)
-- Dependencies: 243
-- Name: downloadable_form_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.downloadable_form_files_id_seq', 3, true);


--
-- TOC entry 5096 (class 0 OID 0)
-- Dependencies: 241
-- Name: downloadable_forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.downloadable_forms_id_seq', 4, true);


--
-- TOC entry 5097 (class 0 OID 0)
-- Dependencies: 227
-- Name: forum_post_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.forum_post_images_id_seq', 2, true);


--
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 225
-- Name: forum_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.forum_posts_id_seq', 2, true);


--
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 235
-- Name: gov_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gov_categories_id_seq', 3, true);


--
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 237
-- Name: gov_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gov_entries_id_seq', 5, true);


--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 239
-- Name: municipal_officials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.municipal_officials_id_seq', 2, true);


--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 219
-- Name: offices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.offices_id_seq', 18, true);


--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 60, true);


--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 233
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 3, true);


--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 223
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- TOC entry 4866 (class 2606 OID 33558)
-- Name: barangay_officials barangay_officials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangay_officials
    ADD CONSTRAINT barangay_officials_pkey PRIMARY KEY (id);


--
-- TOC entry 4848 (class 2606 OID 33460)
-- Name: barangays barangays_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangays
    ADD CONSTRAINT barangays_name_key UNIQUE (name);


--
-- TOC entry 4850 (class 2606 OID 33458)
-- Name: barangays barangays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangays
    ADD CONSTRAINT barangays_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 33533)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 33674)
-- Name: downloadable_form_files downloadable_form_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloadable_form_files
    ADD CONSTRAINT downloadable_form_files_pkey PRIMARY KEY (id);


--
-- TOC entry 4882 (class 2606 OID 33658)
-- Name: downloadable_forms downloadable_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloadable_forms
    ADD CONSTRAINT downloadable_forms_pkey PRIMARY KEY (id);


--
-- TOC entry 4859 (class 2606 OID 33515)
-- Name: forum_post_images forum_post_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_images
    ADD CONSTRAINT forum_post_images_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 33500)
-- Name: forum_posts forum_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_pkey PRIMARY KEY (id);


--
-- TOC entry 4871 (class 2606 OID 33598)
-- Name: gov_categories gov_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_categories
    ADD CONSTRAINT gov_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 33600)
-- Name: gov_categories gov_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_categories
    ADD CONSTRAINT gov_categories_slug_key UNIQUE (slug);


--
-- TOC entry 4876 (class 2606 OID 33615)
-- Name: gov_entries gov_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_entries
    ADD CONSTRAINT gov_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4880 (class 2606 OID 33646)
-- Name: municipal_officials municipal_officials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipal_officials
    ADD CONSTRAINT municipal_officials_pkey PRIMARY KEY (id);


--
-- TOC entry 4844 (class 2606 OID 33449)
-- Name: offices offices_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offices
    ADD CONSTRAINT offices_name_key UNIQUE (name);


--
-- TOC entry 4846 (class 2606 OID 33447)
-- Name: offices offices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offices
    ADD CONSTRAINT offices_pkey PRIMARY KEY (id);


--
-- TOC entry 4839 (class 2606 OID 33438)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 4841 (class 2606 OID 33436)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4869 (class 2606 OID 33578)
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 33474)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4854 (class 2606 OID 33472)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4867 (class 1259 OID 33564)
-- Name: idx_barangay_officials_barangay_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_barangay_officials_barangay_id ON public.barangay_officials USING btree (barangay_id);


--
-- TOC entry 4863 (class 1259 OID 33545)
-- Name: idx_comments_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);


--
-- TOC entry 4864 (class 1259 OID 33544)
-- Name: idx_comments_thread_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_thread_key ON public.comments USING btree (thread_key);


--
-- TOC entry 4886 (class 1259 OID 33680)
-- Name: idx_downloadable_form_files_form_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_downloadable_form_files_form_id ON public.downloadable_form_files USING btree (form_id);


--
-- TOC entry 4883 (class 1259 OID 33664)
-- Name: idx_downloadable_forms_office_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_downloadable_forms_office_id ON public.downloadable_forms USING btree (office_id);


--
-- TOC entry 4860 (class 1259 OID 33522)
-- Name: idx_forum_post_images_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_post_images_post_id ON public.forum_post_images USING btree (post_id);


--
-- TOC entry 4857 (class 1259 OID 33521)
-- Name: idx_forum_posts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forum_posts_created_at ON public.forum_posts USING btree (created_at);


--
-- TOC entry 4874 (class 1259 OID 33601)
-- Name: idx_gov_categories_slug_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_gov_categories_slug_unique ON public.gov_categories USING btree (slug);


--
-- TOC entry 4877 (class 1259 OID 33621)
-- Name: idx_gov_entries_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gov_entries_category_id ON public.gov_entries USING btree (category_id);


--
-- TOC entry 4878 (class 1259 OID 33647)
-- Name: idx_municipal_officials_sort; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_municipal_officials_sort ON public.municipal_officials USING btree (sort_order);


--
-- TOC entry 4842 (class 1259 OID 33548)
-- Name: idx_offices_slug_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_offices_slug_unique ON public.offices USING btree (slug);


--
-- TOC entry 4894 (class 2606 OID 33559)
-- Name: barangay_officials barangay_officials_barangay_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barangay_officials
    ADD CONSTRAINT barangay_officials_barangay_id_fkey FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON DELETE CASCADE;


--
-- TOC entry 4892 (class 2606 OID 33539)
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE SET NULL;


--
-- TOC entry 4893 (class 2606 OID 33534)
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4899 (class 2606 OID 33675)
-- Name: downloadable_form_files downloadable_form_files_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloadable_form_files
    ADD CONSTRAINT downloadable_form_files_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.downloadable_forms(id) ON DELETE CASCADE;


--
-- TOC entry 4898 (class 2606 OID 33659)
-- Name: downloadable_forms downloadable_forms_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.downloadable_forms
    ADD CONSTRAINT downloadable_forms_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- TOC entry 4891 (class 2606 OID 33516)
-- Name: forum_post_images forum_post_images_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_post_images
    ADD CONSTRAINT forum_post_images_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;


--
-- TOC entry 4890 (class 2606 OID 33501)
-- Name: forum_posts forum_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forum_posts
    ADD CONSTRAINT forum_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4896 (class 2606 OID 33616)
-- Name: gov_entries gov_entries_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_entries
    ADD CONSTRAINT gov_entries_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.gov_categories(id) ON DELETE CASCADE;


--
-- TOC entry 4897 (class 2606 OID 33628)
-- Name: gov_entries gov_entries_manager_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_entries
    ADD CONSTRAINT gov_entries_manager_user_id_fkey FOREIGN KEY (manager_user_id) REFERENCES public.users(id);


--
-- TOC entry 4895 (class 2606 OID 33579)
-- Name: services services_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- TOC entry 4887 (class 2606 OID 33485)
-- Name: users users_barangay_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_barangay_id_fkey FOREIGN KEY (barangay_id) REFERENCES public.barangays(id);


--
-- TOC entry 4888 (class 2606 OID 33480)
-- Name: users users_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id);


--
-- TOC entry 4889 (class 2606 OID 33475)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


-- Completed on 2025-12-12 02:06:49

--
-- PostgreSQL database dump complete
--

