--
-- PostgreSQL database dump
--

\restrict fefdCqOdMMkZtd2wZuC5j0qXmJ4mYgKpojKJrzOe4qAgfOqezEl24gGuntFw3iM

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: affiliate_commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_commissions (
    id integer NOT NULL,
    affiliate_id character varying NOT NULL,
    user_id character varying NOT NULL,
    bet_id integer NOT NULL,
    bet_amount numeric(20,0) NOT NULL,
    commission_amount numeric(20,0) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    settled_at timestamp without time zone
);


ALTER TABLE public.affiliate_commissions OWNER TO postgres;

--
-- Name: affiliate_commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.affiliate_commissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_commissions_id_seq OWNER TO postgres;

--
-- Name: affiliate_commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.affiliate_commissions_id_seq OWNED BY public.affiliate_commissions.id;


--
-- Name: affiliate_settlements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliate_settlements (
    id integer NOT NULL,
    affiliate_id character varying NOT NULL,
    amount numeric(20,0) NOT NULL,
    memo text,
    settled_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.affiliate_settlements OWNER TO postgres;

--
-- Name: affiliate_settlements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.affiliate_settlements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.affiliate_settlements_id_seq OWNER TO postgres;

--
-- Name: affiliate_settlements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.affiliate_settlements_id_seq OWNED BY public.affiliate_settlements.id;


--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affiliates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    display_name text NOT NULL,
    phone text,
    referral_code text NOT NULL,
    commission_rate numeric(5,2) DEFAULT 5.00 NOT NULL,
    total_commission numeric(20,0) DEFAULT '0'::numeric NOT NULL,
    pending_commission numeric(20,0) DEFAULT '0'::numeric NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.affiliates OWNER TO postgres;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    display_date timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: bets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bets (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    symbol text NOT NULL,
    direction text NOT NULL,
    amount numeric(20,8) NOT NULL,
    duration integer NOT NULL,
    round_number integer DEFAULT 1 NOT NULL,
    strike_price numeric(20,8) NOT NULL,
    close_price numeric(20,8),
    payout numeric(20,8),
    multiplier numeric(5,2) DEFAULT 2.00 NOT NULL,
    outcome text DEFAULT 'pending'::text NOT NULL,
    forced_outcome text,
    max_execution_applied boolean DEFAULT false NOT NULL,
    original_amount numeric(20,8),
    balance_before numeric(20,8),
    balance_after numeric(20,8),
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    settled_at timestamp without time zone
);


ALTER TABLE public.bets OWNER TO postgres;

--
-- Name: bets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bets_id_seq OWNER TO postgres;

--
-- Name: bets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bets_id_seq OWNED BY public.bets.id;


--
-- Name: blocked_ips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_ips (
    id integer NOT NULL,
    ip_address text NOT NULL,
    reason text,
    blocked_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blocked_ips OWNER TO postgres;

--
-- Name: blocked_ips_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blocked_ips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocked_ips_id_seq OWNER TO postgres;

--
-- Name: blocked_ips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blocked_ips_id_seq OWNED BY public.blocked_ips.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_id_seq OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: forex_candles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forex_candles (
    id integer NOT NULL,
    symbol text NOT NULL,
    duration integer NOT NULL,
    "time" integer NOT NULL,
    open numeric(15,6) NOT NULL,
    high numeric(15,6) NOT NULL,
    low numeric(15,6) NOT NULL,
    close numeric(15,6) NOT NULL
);


ALTER TABLE public.forex_candles OWNER TO postgres;

--
-- Name: forex_candles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forex_candles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forex_candles_id_seq OWNER TO postgres;

--
-- Name: forex_candles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forex_candles_id_seq OWNED BY public.forex_candles.id;


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inquiries (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    reply text,
    status text DEFAULT 'pending'::text NOT NULL,
    replied_by character varying,
    replied_at timestamp without time zone,
    is_reply_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inquiries OWNER TO postgres;

--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiries_id_seq OWNER TO postgres;

--
-- Name: inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inquiries_id_seq OWNED BY public.inquiries.id;


--
-- Name: inquiry_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inquiry_templates (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inquiry_templates OWNER TO postgres;

--
-- Name: inquiry_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inquiry_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiry_templates_id_seq OWNER TO postgres;

--
-- Name: inquiry_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inquiry_templates_id_seq OWNED BY public.inquiry_templates.id;


--
-- Name: login_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_history (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    username text NOT NULL,
    ip text NOT NULL,
    user_agent text,
    login_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.login_history OWNER TO postgres;

--
-- Name: login_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.login_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_history_id_seq OWNER TO postgres;

--
-- Name: login_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.login_history_id_seq OWNED BY public.login_history.id;


--
-- Name: maintenance_symbols; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_symbols (
    id integer NOT NULL,
    symbol text NOT NULL,
    reason text,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying NOT NULL
);


ALTER TABLE public.maintenance_symbols OWNER TO postgres;

--
-- Name: maintenance_symbols_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maintenance_symbols_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_symbols_id_seq OWNER TO postgres;

--
-- Name: maintenance_symbols_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.maintenance_symbols_id_seq OWNED BY public.maintenance_symbols.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    sender_id character varying NOT NULL,
    receiver_id character varying NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    deleted_for_user boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: round_forced_directions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.round_forced_directions (
    id integer NOT NULL,
    symbol text NOT NULL,
    duration integer NOT NULL,
    round_number integer NOT NULL,
    forced_direction text NOT NULL,
    date_key text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.round_forced_directions OWNER TO postgres;

--
-- Name: round_forced_directions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.round_forced_directions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.round_forced_directions_id_seq OWNER TO postgres;

--
-- Name: round_forced_directions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.round_forced_directions_id_seq OWNED BY public.round_forced_directions.id;


--
-- Name: round_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.round_results (
    id integer NOT NULL,
    symbol text NOT NULL,
    duration integer NOT NULL,
    round_number integer NOT NULL,
    round_date text NOT NULL,
    open_price numeric(20,8) NOT NULL,
    close_price numeric(20,8) NOT NULL,
    high_price numeric(20,8) NOT NULL,
    low_price numeric(20,8) NOT NULL,
    direction text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.round_results OWNER TO postgres;

--
-- Name: round_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.round_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.round_results_id_seq OWNER TO postgres;

--
-- Name: round_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.round_results_id_seq OWNED BY public.round_results.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: transaction_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_requests (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    type text NOT NULL,
    amount numeric(20,0) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    bank_name text,
    account_holder text,
    account_number text,
    sender_name text,
    admin_note text,
    processed_by character varying,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.transaction_requests OWNER TO postgres;

--
-- Name: transaction_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transaction_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaction_requests_id_seq OWNER TO postgres;

--
-- Name: transaction_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_requests_id_seq OWNED BY public.transaction_requests.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text,
    phone text,
    birth_date text,
    resident_number text,
    region text,
    bank_name text,
    account_holder text,
    account_number text,
    balance numeric(20,0) DEFAULT '0'::numeric NOT NULL,
    total_deposit numeric(20,0) DEFAULT '0'::numeric NOT NULL,
    total_withdrawal numeric(20,0) DEFAULT '0'::numeric NOT NULL,
    total_bet numeric(20,0) DEFAULT '0'::numeric NOT NULL,
    total_win numeric(20,0) DEFAULT '0'::numeric NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    branch_code text,
    affiliate_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    approval_status text DEFAULT 'pending'::text NOT NULL,
    last_login_at timestamp without time zone,
    last_login_ip text,
    auto_bet_enabled boolean DEFAULT false NOT NULL,
    auto_bet_multiplier real DEFAULT 10 NOT NULL,
    is_betting_blocked boolean DEFAULT false NOT NULL,
    forced_bet_direction text,
    max_execution_enabled boolean DEFAULT true NOT NULL,
    pending_balance_adjustment numeric(20,0) DEFAULT '0'::numeric NOT NULL,
    grade text DEFAULT '브론즈'::text NOT NULL,
    always_pending_enabled boolean DEFAULT false NOT NULL,
    telegram_notify_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    withdrawal_password text,
    is_withdrawal_locked boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: affiliate_commissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_commissions ALTER COLUMN id SET DEFAULT nextval('public.affiliate_commissions_id_seq'::regclass);


--
-- Name: affiliate_settlements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_settlements ALTER COLUMN id SET DEFAULT nextval('public.affiliate_settlements_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: bets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bets ALTER COLUMN id SET DEFAULT nextval('public.bets_id_seq'::regclass);


--
-- Name: blocked_ips id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips ALTER COLUMN id SET DEFAULT nextval('public.blocked_ips_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: forex_candles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forex_candles ALTER COLUMN id SET DEFAULT nextval('public.forex_candles_id_seq'::regclass);


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


--
-- Name: inquiry_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiry_templates ALTER COLUMN id SET DEFAULT nextval('public.inquiry_templates_id_seq'::regclass);


--
-- Name: login_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history ALTER COLUMN id SET DEFAULT nextval('public.login_history_id_seq'::regclass);


--
-- Name: maintenance_symbols id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_symbols ALTER COLUMN id SET DEFAULT nextval('public.maintenance_symbols_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: round_forced_directions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.round_forced_directions ALTER COLUMN id SET DEFAULT nextval('public.round_forced_directions_id_seq'::regclass);


--
-- Name: round_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.round_results ALTER COLUMN id SET DEFAULT nextval('public.round_results_id_seq'::regclass);


--
-- Name: transaction_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_requests ALTER COLUMN id SET DEFAULT nextval('public.transaction_requests_id_seq'::regclass);


--
-- Data for Name: affiliate_commissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_commissions (id, affiliate_id, user_id, bet_id, bet_amount, commission_amount, status, created_at, settled_at) FROM stdin;
\.


--
-- Data for Name: affiliate_settlements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliate_settlements (id, affiliate_id, amount, memo, settled_by, created_at) FROM stdin;
\.


--
-- Data for Name: affiliates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.affiliates (id, username, password, display_name, phone, referral_code, commission_rate, total_commission, pending_commission, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, is_active, is_pinned, display_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bets (id, user_id, symbol, direction, amount, duration, round_number, strike_price, close_price, payout, multiplier, outcome, forced_outcome, max_execution_applied, original_amount, balance_before, balance_after, expires_at, created_at, settled_at) FROM stdin;
\.


--
-- Data for Name: blocked_ips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocked_ips (id, ip_address, reason, blocked_by, created_at) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, code, name, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: forex_candles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forex_candles (id, symbol, duration, "time", open, high, low, close) FROM stdin;
1	SP500	300	1780904100	7383.740000	7383.913595	7383.740000	7383.913595
2	DOW	300	1780904100	50866.780000	50866.981527	50866.780000	50866.981527
3	DXY	300	1780904100	100.053000	100.053000	100.050671	100.050671
2143	SP500	300	1780908000	7384.207962	7384.830619	7382.297849	7382.842317
2144	DOW	300	1780908000	50864.158144	50874.695527	50857.948046	50857.948046
2145	DXY	300	1780908000	100.091945	100.118140	100.072149	100.118140
3986	BTC	300	1780911900	63467.990000	63472.000000	63464.000000	63464.010000
3987	ETH	300	1780911900	1666.820000	1667.510000	1666.820000	1667.210000
3985	GOLD	300	1780911900	4317.500000	4318.019324	4317.500000	4317.899056
3301	SP500	300	1780911000	7383.601579	7384.647433	7382.299062	7384.104122
3302	DOW	300	1780911000	50866.931958	50877.541926	50856.050243	50865.400078
3303	DXY	300	1780911000	100.156704	100.183023	100.153000	100.171316
1621	SP500	300	1780907100	7383.740000	7385.431479	7382.798594	7383.329854
1622	DOW	300	1780907100	50866.780000	50878.109171	50856.048393	50861.377852
1623	DXY	300	1780907100	100.099000	100.127591	100.092231	100.116680
3121	SP500	300	1780910700	7383.720952	7385.215444	7382.267969	7383.389049
3122	DOW	300	1780910700	50868.759359	50874.819512	50856.934347	50868.913253
2875	SP500	300	1780909200	7384.023802	7385.368556	7382.732497	7383.985455
2876	DOW	300	1780909200	50868.388680	50874.046763	50859.161733	50860.212846
2877	DXY	300	1780909200	100.142023	100.148562	100.122503	100.138770
4	SP500	300	1780904400	7383.766033	7385.020379	7382.472846	7383.887253
5	DOW	300	1780904400	50865.575255	50878.577205	50856.610168	50865.412436
6	DXY	300	1780904400	100.049785	100.066196	100.032489	100.041763
364	SP500	300	1780905000	7383.992568	7384.874475	7382.476248	7383.499514
365	DOW	300	1780905000	50868.609765	50878.664267	50858.687947	50869.167544
366	DXY	300	1780905000	100.083057	100.083057	100.050424	100.059068
898	SP500	300	1780905900	7383.976523	7385.038351	7382.539856	7382.539856
899	DOW	300	1780905900	50872.501867	50878.900778	50854.536751	50869.028649
900	DXY	300	1780905900	100.082575	100.119823	100.052513	100.119659
1078	SP500	300	1780906200	7382.644547	7384.803432	7382.644547	7383.703519
1079	DOW	300	1780906200	50870.054563	50875.137013	50859.228976	50862.502428
1080	DXY	300	1780906200	100.119326	100.132012	100.095000	100.107312
721	SP500	300	1780905600	7383.537246	7385.136634	7382.275608	7383.969723
722	DOW	300	1780905600	50869.019139	50879.102711	50858.443557	50870.708234
723	DXY	300	1780905600	100.050562	100.091757	100.040235	100.081786
2692	SP500	300	1780908900	7383.088394	7385.388408	7382.521647	7383.799873
2693	DOW	300	1780908900	50861.908980	50878.690618	50858.822110	50867.361801
2694	DXY	300	1780908900	100.125377	100.152584	100.105083	100.143622
1261	SP500	300	1780906500	7383.868642	7384.501402	7381.892261	7384.126357
1262	DOW	300	1780906500	50864.280557	50872.349959	50857.384836	50866.953478
1263	DXY	300	1780906500	100.106968	100.120933	100.068890	100.071092
187	SP500	300	1780904700	7384.146332	7384.518588	7382.507049	7384.007566
188	DOW	300	1780904700	50865.926416	50874.481633	50858.775180	50870.028603
189	DXY	300	1780904700	100.043685	100.097626	100.036630	100.084904
3123	DXY	300	1780910700	100.160898	100.169598	100.142561	100.158413
1969	SP500	300	1780907700	7384.019011	7384.644195	7381.909481	7384.201376
1970	DOW	300	1780907700	50867.643761	50876.150320	50854.120443	50865.409004
1971	DXY	300	1780907700	100.121620	100.128194	100.083316	100.090834
541	SP500	300	1780905300	7383.738563	7384.930210	7382.305407	7383.492709
542	DOW	300	1780905300	50870.827410	50874.563556	50855.932468	50867.056111
543	DXY	300	1780905300	100.058359	100.075904	100.045318	100.052919
2326	SP500	300	1780908300	7383.090241	7384.950924	7382.533394	7383.540616
2327	DOW	300	1780908300	50856.291971	50874.236416	50853.626342	50872.844758
1795	SP500	300	1780907400	7383.048315	7384.865528	7382.692049	7383.931663
1796	DOW	300	1780907400	50861.869861	50873.559707	50858.406060	50868.379914
1441	SP500	300	1780906800	7384.342037	7385.144407	7382.131384	7384.114863
1442	DOW	300	1780906800	50867.148775	50879.303974	50857.330111	50865.262212
1443	DXY	300	1780906800	100.069853	100.111881	100.060380	100.098710
1797	DXY	300	1780907400	100.117843	100.138772	100.109890	100.119795
2328	DXY	300	1780908300	100.117680	100.127235	100.091932	100.121396
3826	SP500	300	1780911900	7383.646718	7384.854699	7382.276082	7383.507422
2983	SP500	300	1780910400	7383.740000	7384.770409	7382.496598	7383.690621
2509	SP500	300	1780908600	7383.280002	7384.621775	7382.509916	7383.289815
2510	DOW	300	1780908600	50872.829595	50876.188232	50856.574494	50863.797750
2511	DXY	300	1780908600	100.122698	100.155785	100.116936	100.126589
2984	DOW	300	1780910400	50866.780000	50873.796032	50860.323510	50868.141095
2985	DXY	300	1780910400	100.161000	100.175359	100.151176	100.163031
3827	DOW	300	1780911900	50870.829836	50875.457409	50859.907322	50867.029246
3478	SP500	300	1780911300	7384.069955	7385.049370	7382.432632	7383.819900
3479	DOW	300	1780911300	50866.125212	50873.954284	50859.508917	50866.762910
3480	DXY	300	1780911300	100.170801	100.200748	100.157885	100.190002
3828	DXY	300	1780911900	100.211072	100.218243	100.137456	100.146662
4003	GOLD	300	1780912200	4317.794465	4320.751368	4314.300000	4319.556176
3649	SP500	300	1780911600	7383.737048	7385.065993	7382.087212	7383.888944
3650	DOW	300	1780911600	50865.351163	50875.088092	50860.033205	50871.390624
3651	DXY	300	1780911600	100.187593	100.216011	100.186864	100.208708
4001	BTC	300	1780912200	63464.010000	63473.760000	63418.000000	63426.010000
4341	ETH	300	1780912800	1671.100000	1672.690000	1667.660000	1669.590000
4002	ETH	300	1780912200	1667.210000	1669.190000	1666.270000	1668.530000
4342	GOLD	300	1780912800	4325.914305	4326.753301	4316.454957	4317.775418
4169	BTC	300	1780912500	63429.990000	63504.770000	63420.290000	63502.000000
4171	GOLD	300	1780912500	4319.466250	4326.440817	4317.756964	4325.997194
4170	ETH	300	1780912500	1668.640000	1671.490000	1667.650000	1671.100000
4691	ETH	300	1780913400	1669.640000	1671.470000	1669.040000	1669.790000
4340	BTC	300	1780912800	63502.000000	63560.610000	63405.860000	63431.990000
4519	GOLD	300	1780913100	4317.858279	4319.800000	4315.412708	4318.959044
4517	BTC	300	1780913100	63450.540000	63489.430000	63405.010000	63406.490000
4518	ETH	300	1780913100	1670.240000	1671.620000	1669.020000	1669.630000
4690	BTC	300	1780913400	63407.780000	63430.410000	63372.240000	63387.990000
4692	GOLD	300	1780913400	4318.974984	4319.257641	4313.376701	4314.445120
8822	GOLD	300	1780920300	4350.721682	4356.956691	4350.599039	4356.450594
8273	GOLD	300	1780919400	4350.065661	4352.104227	4347.316854	4347.594337
8271	BTC	300	1780919400	63499.710000	63572.910000	63450.000000	63482.960000
8272	ETH	300	1780919400	1682.740000	1685.460000	1682.600000	1683.470000
5932	GOLD	300	1780915500	4328.172116	4329.814050	4323.931772	4323.983493
4866	GOLD	300	1780913700	4314.397677	4321.776892	4313.743092	4319.974200
4864	BTC	300	1780913700	63387.990000	63387.990000	63250.000000	63250.000000
4865	ETH	300	1780913700	1669.790000	1670.440000	1666.020000	1666.080000
5930	BTC	300	1780915500	63218.010000	63234.000000	63096.880000	63146.010000
5931	ETH	300	1780915500	1671.640000	1672.940000	1669.350000	1671.470000
9001	BTC	300	1780920600	63027.990000	63079.330000	62734.970000	62734.970000
7178	GOLD	300	1780917600	4328.893660	4338.272428	4328.782798	4338.009412
7176	BTC	300	1780917600	63557.990000	63666.010000	63490.000000	63574.690000
7177	ETH	300	1780917600	1688.800000	1694.650000	1684.800000	1690.990000
9003	ETH	300	1780920600	1674.490000	1676.670000	1669.780000	1669.780000
5572	GOLD	300	1780914900	4315.691070	4319.261045	4314.783126	4319.261045
5570	BTC	300	1780914900	63316.320000	63326.320000	63220.000000	63242.660000
5571	ETH	300	1780914900	1672.900000	1673.620000	1669.170000	1670.650000
8456	GOLD	300	1780919700	4347.655860	4350.759253	4346.471163	4347.440849
8454	BTC	300	1780919700	63482.890000	63517.990000	63421.040000	63471.680000
8455	ETH	300	1780919700	1683.400000	1685.000000	1681.900000	1683.710000
7358	GOLD	300	1780917900	4337.936521	4347.582179	4337.500000	4347.524009
7356	BTC	300	1780917900	63572.570000	63646.430000	63566.920000	63616.360000
7357	ETH	300	1780917900	1690.860000	1692.930000	1687.380000	1688.770000
6459	GOLD	300	1780916400	4324.569893	4326.128067	4322.690161	4322.876143
6457	BTC	300	1780916400	63172.300000	63172.300000	63058.000000	63095.710000
6458	ETH	300	1780916400	1672.360000	1672.360000	1667.870000	1667.950000
6995	GOLD	300	1780917300	4324.635143	4329.100000	4324.541812	4329.000416
6993	BTC	300	1780917300	63445.990000	63558.410000	63373.600000	63557.990000
6994	ETH	300	1780917300	1681.440000	1689.080000	1680.710000	1688.810000
6276	GOLD	300	1780916100	4328.806969	4329.243839	4323.563925	4324.650195
5043	GOLD	300	1780914000	4319.895537	4322.819581	4317.946619	4319.266049
5041	BTC	300	1780914000	63250.000000	63292.220000	63164.210000	63197.570000
5042	ETH	300	1780914000	1666.080000	1667.920000	1665.890000	1667.220000
6274	BTC	300	1780916100	63161.120000	63168.640000	63110.170000	63164.440000
6275	ETH	300	1780916100	1672.700000	1672.710000	1670.470000	1672.200000
6633	GOLD	300	1780916700	4322.778770	4327.321402	4321.464687	4326.347454
6631	BTC	300	1780916700	63095.700000	63255.990000	63088.010000	63254.000000
6102	GOLD	300	1780915800	4323.936653	4329.100000	4323.936653	4328.851954
6100	BTC	300	1780915800	63146.000000	63174.000000	63108.000000	63161.110000
5755	GOLD	300	1780915200	4319.209828	4328.148259	4317.082642	4328.148259
5753	BTC	300	1780915200	63242.660000	63268.000000	63186.000000	63218.010000
5754	ETH	300	1780915200	1670.650000	1672.840000	1669.280000	1671.650000
5223	GOLD	300	1780914300	4319.208567	4319.930235	4314.939730	4315.036146
5224	BTC	300	1780914300	63197.560000	63201.600000	63109.340000	63152.000000
5225	ETH	300	1780914300	1667.220000	1667.390000	1663.940000	1665.530000
6101	ETH	300	1780915800	1671.480000	1672.970000	1670.020000	1672.700000
6632	ETH	300	1780916700	1667.930000	1673.220000	1667.880000	1673.070000
8090	GOLD	300	1780919100	4355.214493	4355.459752	4349.248902	4350.089484
8088	BTC	300	1780919100	63632.900000	63663.990000	63477.320000	63499.700000
8089	ETH	300	1780919100	1688.800000	1689.470000	1682.150000	1682.740000
5399	GOLD	300	1780914600	4314.967941	4317.189001	4314.373925	4315.700104
5397	BTC	300	1780914600	63152.000000	63414.850000	63138.000000	63316.310000
5398	ETH	300	1780914600	1665.530000	1676.720000	1663.670000	1672.880000
7724	GOLD	300	1780918500	4350.399556	4354.602341	4347.204391	4350.240923
7722	BTC	300	1780918500	63596.730000	63871.590000	63590.000000	63754.600000
7723	ETH	300	1780918500	1686.310000	1696.760000	1685.880000	1694.120000
7541	GOLD	300	1780918200	4347.491016	4355.174601	4347.491016	4350.438877
6813	GOLD	300	1780917000	4326.268679	4326.612140	4321.847041	4324.528165
7539	BTC	300	1780918200	63616.370000	63665.990000	63541.940000	63596.730000
7540	ETH	300	1780918200	1688.770000	1690.370000	1685.000000	1686.300000
6811	BTC	300	1780917000	63253.990000	63453.320000	63236.010000	63424.000000
6812	ETH	300	1780917000	1673.080000	1681.590000	1672.290000	1680.690000
9002	GOLD	300	1780920600	4356.342915	4359.357028	4352.302495	4354.292987
7907	GOLD	300	1780918800	4350.165559	4357.059607	4350.165559	4355.195970
7905	BTC	300	1780918800	63754.600000	63770.000000	63629.710000	63632.900000
7906	ETH	300	1780918800	1694.070000	1694.070000	1688.600000	1688.810000
8639	GOLD	300	1780920000	4347.395502	4353.024661	4347.315129	4350.685468
8637	BTC	300	1780920000	63479.610000	63655.990000	62880.000000	62880.000000
8638	ETH	300	1780920000	1683.760000	1689.230000	1671.820000	1671.820000
9363	BTC	300	1780921200	62892.380000	62995.990000	62843.580000	62985.680000
9364	ETH	300	1780921200	1671.840000	1676.070000	1670.780000	1675.290000
9365	GOLD	300	1780921200	4356.576864	4356.576864	4347.062925	4347.187111
9545	ETH	300	1780921500	1675.200000	1679.530000	1675.080000	1679.400000
9546	GOLD	300	1780921500	4347.156313	4351.031022	4345.300000	4349.062759
9182	BTC	300	1780920900	62720.810000	63005.070000	62720.810000	62869.990000
8820	BTC	300	1780920300	62869.690000	63096.240000	62795.600000	63028.000000
8821	ETH	300	1780920300	1671.070000	1675.900000	1668.210000	1674.490000
10088	GOLD	300	1780922400	4354.814198	4359.372141	4354.027840	4354.320009
9907	ETH	300	1780922100	1680.530000	1687.050000	1679.800000	1686.250000
9183	ETH	300	1780920900	1668.370000	1676.290000	1668.370000	1671.730000
9184	GOLD	300	1780920900	4354.253337	4358.853583	4353.232354	4356.473038
9727	GOLD	300	1780921800	4349.028550	4354.452777	4348.400000	4351.819373
9544	BTC	300	1780921500	62985.680000	63104.000000	62977.130000	63104.000000
9725	BTC	300	1780921800	63103.990000	63280.550000	63103.990000	63216.000000
9726	ETH	300	1780921800	1679.410000	1683.220000	1678.140000	1680.530000
9905	BTC	300	1780922100	63216.010000	63494.860000	63209.670000	63472.350000
9906	GOLD	300	1780922100	4351.891813	4355.593994	4351.820973	4354.794307
10087	ETH	300	1780922400	1684.390000	1695.760000	1683.620000	1692.500000
10268	BTC	300	1780922700	63638.730000	63653.990000	63534.140000	63575.990000
10086	BTC	300	1780922400	63420.000000	63666.000000	63384.580000	63638.730000
10451	ETH	300	1780923000	1690.860000	1691.570000	1687.770000	1689.620000
10269	ETH	300	1780922700	1692.600000	1693.390000	1689.220000	1690.850000
10270	GOLD	300	1780922700	4354.230267	4358.814508	4352.274067	4358.814508
10450	BTC	300	1780923000	63575.990000	63635.990000	63526.010000	63557.390000
14279	GOLD	300	1780929300	4342.525427	4347.509065	4341.451258	4345.662802
13009	BTC	300	1780927200	63758.000000	63863.530000	63566.330000	63638.340000
13010	ETH	300	1780927200	1681.590000	1686.190000	1676.660000	1679.080000
11732	GOLD	300	1780925100	4348.407816	4350.029042	4346.675379	4349.255975
11730	BTC	300	1780925100	63720.330000	63741.710000	63576.010000	63593.020000
11731	ETH	300	1780925100	1690.990000	1691.560000	1687.080000	1688.930000
11000	GOLD	300	1780923900	4356.034824	4359.104970	4353.927500	4358.362731
10998	BTC	300	1780923900	63731.980000	63912.160000	63722.500000	63860.010000
10999	ETH	300	1780923900	1691.250000	1695.820000	1690.830000	1693.670000
13011	GOLD	300	1780927200	4358.883886	4363.878208	4353.267965	4357.166019
12464	GOLD	300	1780926300	4360.159355	4370.545753	4356.916551	4365.795439
12462	BTC	300	1780926300	63486.000000	63685.160000	63420.280000	63570.820000
12463	ETH	300	1780926300	1682.950000	1687.330000	1678.440000	1682.920000
14277	BTC	300	1780929300	63910.010000	63910.010000	63786.000000	63823.760000
14278	ETH	300	1780929300	1688.770000	1689.390000	1683.520000	1685.580000
12829	BTC	300	1780926900	63704.010000	63812.000000	63682.010000	63758.000000
12830	ETH	300	1780926900	1684.350000	1685.330000	1680.700000	1681.580000
12828	GOLD	300	1780926900	4360.447773	4362.700000	4358.132380	4358.947839
11549	GOLD	300	1780924800	4351.389253	4351.389253	4348.416559	4348.507265
11547	BTC	300	1780924800	63749.990000	63920.000000	63720.340000	63720.340000
11548	ETH	300	1780924800	1691.390000	1696.820000	1690.980000	1690.980000
11183	GOLD	300	1780924200	4358.404996	4359.299894	4350.995139	4353.417969
11181	BTC	300	1780924200	63854.010000	63943.560000	63774.460000	63782.350000
11182	ETH	300	1780924200	1693.280000	1696.290000	1690.590000	1691.980000
15008	GOLD	300	1780930500	4347.791378	4352.742598	4344.250641	4344.386090
13190	BTC	300	1780927500	63638.340000	63847.440000	63580.010000	63824.000000
13191	ETH	300	1780927500	1679.070000	1687.250000	1677.840000	1686.850000
13192	GOLD	300	1780927500	4357.220980	4361.673087	4350.900000	4351.546503
14825	GOLD	300	1780930200	4342.000921	4347.836802	4340.801272	4347.810882
14823	BTC	300	1780930200	63854.290000	63937.720000	63828.010000	63865.990000
14824	ETH	300	1780930200	1685.380000	1689.790000	1683.600000	1687.370000
10452	GOLD	300	1780923000	4358.733579	4364.058268	4353.369373	4360.680622
12647	GOLD	300	1780926600	4365.689781	4368.711910	4360.238533	4360.535768
10634	GOLD	300	1780923300	4360.624650	4362.442882	4357.153609	4357.153609
10632	BTC	300	1780923300	63566.000000	63927.080000	63566.000000	63816.810000
10633	ETH	300	1780923300	1689.890000	1698.210000	1689.610000	1694.170000
12645	BTC	300	1780926600	63570.820000	63869.230000	63534.250000	63710.010000
12646	ETH	300	1780926600	1682.930000	1689.660000	1681.730000	1684.480000
14097	GOLD	300	1780929000	4345.309422	4349.644598	4341.883025	4342.565545
14095	BTC	300	1780929000	63756.370000	63937.220000	63756.370000	63913.990000
10815	GOLD	300	1780923600	4357.081496	4358.791477	4351.787423	4355.957793
10816	BTC	300	1780923600	63872.000000	63880.550000	63719.620000	63731.990000
10817	ETH	300	1780923600	1695.600000	1695.890000	1690.750000	1691.260000
14096	ETH	300	1780929000	1684.750000	1689.850000	1684.680000	1688.860000
13552	BTC	300	1780928100	63874.000000	63874.010000	63612.370000	63793.990000
11366	GOLD	300	1780924500	4353.522429	4354.505274	4348.608276	4351.358455
11364	BTC	300	1780924500	63780.650000	63826.000000	63668.780000	63745.990000
11365	ETH	300	1780924500	1691.990000	1693.140000	1688.580000	1691.390000
12098	GOLD	300	1780925700	4355.067444	4357.400000	4353.953862	4355.943629
12096	BTC	300	1780925700	63475.720000	63759.310000	63456.360000	63460.000000
12097	ETH	300	1780925700	1684.450000	1692.550000	1682.030000	1682.030000
11915	GOLD	300	1780925400	4349.208156	4358.876726	4349.015448	4355.074975
11913	BTC	300	1780925400	63593.010000	63658.000000	63362.100000	63475.420000
11914	ETH	300	1780925400	1688.890000	1690.470000	1681.470000	1684.560000
13553	ETH	300	1780928100	1687.310000	1687.570000	1680.730000	1684.420000
13554	GOLD	300	1780928100	4347.682596	4352.140136	4343.966818	4345.984844
12281	GOLD	300	1780926000	4355.978051	4364.296043	4355.978051	4360.259309
12279	BTC	300	1780926000	63460.000000	63607.990000	63448.870000	63485.990000
12280	ETH	300	1780926000	1682.000000	1686.250000	1681.330000	1682.770000
13371	BTC	300	1780927800	63822.010000	63910.030000	63728.820000	63874.000000
13372	ETH	300	1780927800	1686.800000	1689.160000	1683.540000	1687.310000
13373	GOLD	300	1780927800	4351.596377	4354.771449	4346.506993	4347.585172
15006	BTC	300	1780930500	63872.370000	64077.560000	63868.000000	63960.830000
15007	ETH	300	1780930500	1687.620000	1694.460000	1686.880000	1691.210000
14643	GOLD	300	1780929900	4346.829106	4347.654277	4341.068192	4341.970893
14461	GOLD	300	1780929600	4345.620660	4348.646730	4344.000000	4346.816122
13915	GOLD	300	1780928700	4344.175022	4345.800000	4341.386386	4345.417534
13913	BTC	300	1780928700	63776.540000	63869.960000	63691.020000	63756.360000
13914	ETH	300	1780928700	1685.010000	1687.350000	1682.790000	1684.750000
14459	BTC	300	1780929600	63823.750000	63920.310000	63792.000000	63912.000000
13735	GOLD	300	1780928400	4346.076961	4346.076961	4341.400000	4344.085175
13733	BTC	300	1780928400	63793.990000	63887.450000	63728.000000	63776.540000
13734	ETH	300	1780928400	1684.530000	1687.840000	1682.530000	1685.020000
14460	ETH	300	1780929600	1685.590000	1687.480000	1682.540000	1686.810000
14641	BTC	300	1780929900	63905.730000	63948.000000	63862.070000	63862.070000
14642	ETH	300	1780929900	1686.730000	1689.130000	1685.580000	1685.580000
15371	ETH	300	1780969200	1670.740000	1671.580000	1667.770000	1669.630000
15191	GOLD	300	1780930800	4344.423112	4351.804046	4341.860607	4349.516543
15513	BTC	300	1780969500	62710.000000	62854.570000	62710.000000	62762.000000
15693	BTC	300	1780969800	62762.010000	62798.000000	62708.000000	62789.990000
15369	GOLD	300	1780969200	4358.300000	4362.615314	4357.639885	4361.700000
15189	BTC	300	1780930800	63964.080000	64093.990000	63940.010000	63983.560000
15190	ETH	300	1780930800	1691.250000	1699.530000	1690.820000	1694.400000
15370	BTC	300	1780969200	62772.160000	62798.000000	62670.210000	62710.000000
15695	GOLD	300	1780969800	4360.311688	4362.353926	4357.144242	4358.895091
15515	ETH	300	1780969500	1669.630000	1672.470000	1668.270000	1668.280000
15514	GOLD	300	1780969500	4361.612307	4363.006103	4358.800000	4360.282484
15694	ETH	300	1780969800	1668.270000	1669.570000	1666.520000	1668.800000
15870	BTC	300	1780970100	62790.000000	62804.000000	62758.010000	62764.010000
15872	GOLD	300	1780970100	4358.840091	4362.768461	4358.262070	4358.831525
15871	ETH	300	1780970100	1668.720000	1669.930000	1668.000000	1668.960000
16054	ETH	300	1780970400	1669.020000	1672.180000	1668.880000	1670.550000
16055	GOLD	300	1780970400	4358.767142	4361.524007	4358.480548	4361.373498
16053	BTC	300	1780970400	62764.010000	62870.070000	62764.000000	62822.810000
16234	BTC	300	1780970700	62819.670000	62830.010000	62737.210000	62818.120000
20943	ETH	300	1780978500	1669.870000	1669.870000	1668.120000	1668.120000
20034	GOLD	300	1780977000	4359.546947	4362.811000	4358.978717	4361.827789
19127	BTC	300	1780975500	62793.990000	62844.000000	62778.000000	62808.010000
17856	GOLD	300	1780973400	4358.799051	4362.088473	4357.640923	4361.955916
16959	GOLD	300	1780971900	4357.716727	4358.897098	4354.481924	4357.024391
16957	BTC	300	1780971900	62708.000000	62776.000000	62644.450000	62776.000000
16958	ETH	300	1780971900	1664.290000	1665.370000	1662.170000	1665.370000
17854	BTC	300	1780973400	62728.010000	62797.320000	62656.000000	62797.320000
17855	ETH	300	1780973400	1663.810000	1665.590000	1659.790000	1665.590000
19128	ETH	300	1780975500	1667.660000	1670.000000	1667.410000	1668.640000
19129	GOLD	300	1780975500	4362.649416	4365.977612	4362.474516	4364.835334
17685	GOLD	300	1780973100	4361.497560	4361.617356	4355.826682	4358.709929
17683	BTC	300	1780973100	62654.380000	62770.000000	62654.380000	62734.010000
17684	ETH	300	1780973100	1661.740000	1665.430000	1661.740000	1663.890000
16235	ETH	300	1780970700	1670.200000	1671.270000	1667.850000	1670.600000
16236	GOLD	300	1780970700	4361.330732	4362.364998	4357.501694	4360.892005
20032	BTC	300	1780977000	62845.280000	62845.280000	62756.000000	62756.010000
16413	GOLD	300	1780971000	4360.860304	4360.920892	4356.697570	4357.095334
16411	BTC	300	1780971000	62822.150000	62836.000000	62744.620000	62744.630000
16412	ETH	300	1780971000	1670.850000	1671.390000	1667.430000	1667.440000
18034	GOLD	300	1780973700	4361.951403	4365.075999	4361.805105	4362.528323
18035	BTC	300	1780973700	62797.320000	62874.000000	62793.460000	62867.990000
18036	ETH	300	1780973700	1665.520000	1668.550000	1665.330000	1667.890000
20033	ETH	300	1780977000	1668.530000	1668.540000	1665.190000	1666.060000
17142	GOLD	300	1780972200	4356.996735	4359.542793	4356.209939	4359.285252
17140	BTC	300	1780972200	62775.990000	62830.000000	62748.000000	62750.000000
16596	GOLD	300	1780971300	4357.034475	4357.404907	4352.956300	4355.038263
16594	BTC	300	1780971300	62744.630000	62744.630000	62589.650000	62596.480000
16595	ETH	300	1780971300	1667.440000	1667.520000	1661.550000	1661.890000
17141	ETH	300	1780972200	1665.370000	1666.840000	1662.840000	1662.840000
19489	BTC	300	1780976100	62706.010000	62772.000000	62702.000000	62740.010000
19490	ETH	300	1780976100	1664.360000	1666.460000	1664.130000	1665.070000
19491	GOLD	300	1780976100	4358.795096	4361.300000	4358.433251	4360.480819
20944	GOLD	300	1780978500	4359.905818	4361.884900	4359.024164	4361.884900
17502	GOLD	300	1780972800	4360.045183	4364.247491	4357.966160	4361.497157
17500	BTC	300	1780972800	62608.000000	62676.340000	62608.000000	62654.380000
17501	ETH	300	1780972800	1657.060000	1661.750000	1657.060000	1661.740000
18217	BTC	300	1780974000	62868.000000	62933.890000	62814.010000	62880.000000
16776	GOLD	300	1780971600	4355.125272	4358.055515	4353.735554	4357.698048
16774	BTC	300	1780971600	62596.480000	62743.990000	62580.000000	62708.000000
16775	ETH	300	1780971600	1661.880000	1666.360000	1660.890000	1664.300000
18219	GOLD	300	1780974000	4362.566835	4364.532962	4359.316409	4363.180703
18218	ETH	300	1780974000	1667.890000	1669.500000	1665.710000	1666.810000
18765	BTC	300	1780974900	62914.010000	62979.940000	62886.000000	62886.980000
18766	ETH	300	1780974900	1668.900000	1671.680000	1668.900000	1669.650000
18767	GOLD	300	1780974900	4357.092010	4364.906525	4355.980043	4362.211832
18584	GOLD	300	1780974600	4359.944324	4361.487804	4356.827905	4357.087198
18582	BTC	300	1780974600	62837.990000	62922.000000	62818.150000	62914.010000
18583	ETH	300	1780974600	1666.170000	1669.290000	1665.340000	1668.900000
17321	BTC	300	1780972500	62746.010000	62746.010000	62544.110000	62602.000000
17322	ETH	300	1780972500	1662.840000	1662.840000	1655.060000	1657.050000
17320	GOLD	300	1780972500	4359.198400	4360.302350	4356.346316	4360.074635
21305	GOLD	300	1780979100	4356.857332	4357.020015	4354.247830	4354.382659
21306	ETH	300	1780979100	1667.800000	1668.440000	1666.040000	1666.170000
18948	BTC	300	1780975200	62892.000000	62918.000000	62784.000000	62794.000000
18946	ETH	300	1780975200	1669.640000	1670.710000	1667.020000	1667.660000
18947	GOLD	300	1780975200	4362.186850	4364.081832	4361.580034	4362.546844
18400	GOLD	300	1780974300	4363.208022	4363.746708	4358.999643	4359.888560
18401	BTC	300	1780974300	62873.370000	62898.000000	62830.000000	62837.990000
18399	ETH	300	1780974300	1666.800000	1668.430000	1665.180000	1666.170000
21667	ETH	300	1780979700	1679.960000	1688.300000	1679.880000	1685.910000
19852	GOLD	300	1780976700	4358.187861	4360.911088	4357.448344	4359.441420
19850	BTC	300	1780976700	62825.060000	62845.290000	62772.000000	62845.290000
19851	ETH	300	1780976700	1668.490000	1668.870000	1666.040000	1668.540000
21304	BTC	300	1780979100	62846.590000	62865.570000	62790.500000	62793.650000
20579	GOLD	300	1780977900	4364.306603	4364.640361	4358.649695	4360.482790
20216	GOLD	300	1780977300	4361.884368	4366.092767	4361.884368	4363.541686
20214	BTC	300	1780977300	62756.000000	62890.000000	62750.000000	62875.170000
20215	ETH	300	1780977300	1666.050000	1670.030000	1665.270000	1669.430000
19308	BTC	300	1780975800	62808.000000	62856.000000	62702.010000	62706.010000
19309	ETH	300	1780975800	1668.650000	1670.100000	1663.840000	1664.540000
19310	GOLD	300	1780975800	4364.916156	4364.987081	4357.700000	4358.768978
20397	GOLD	300	1780977600	4363.531973	4364.964751	4361.552261	4364.273774
20395	BTC	300	1780977600	62875.170000	62876.860000	62771.100000	62771.100000
20396	ETH	300	1780977600	1669.440000	1669.680000	1665.710000	1665.710000
19671	GOLD	300	1780976400	4360.470505	4361.900000	4357.896718	4358.190434
19670	BTC	300	1780976400	62740.000000	62832.000000	62734.000000	62828.010000
19672	ETH	300	1780976400	1665.070000	1668.920000	1664.920000	1668.490000
20577	BTC	300	1780977900	62770.000000	62915.000000	62748.000000	62912.490000
20578	ETH	300	1780977900	1665.510000	1670.800000	1665.010000	1670.260000
20761	GOLD	300	1780978200	4360.383011	4360.481552	4357.870019	4359.913921
20759	BTC	300	1780978200	62915.000000	62974.710000	62900.000000	62900.000000
20760	ETH	300	1780978200	1670.520000	1672.470000	1669.950000	1669.960000
20942	BTC	300	1780978500	62899.930000	62905.990000	62860.940000	62860.950000
21123	BTC	300	1780978800	62860.950000	62911.260000	62841.260000	62846.590000
21125	ETH	300	1780978800	1667.980000	1670.370000	1667.670000	1667.790000
21124	GOLD	300	1780978800	4361.940177	4363.716913	4356.811559	4356.811559
21486	GOLD	300	1780979400	4354.311981	4356.069900	4352.956017	4355.838865
21485	ETH	300	1780979400	1666.180000	1679.930000	1664.340000	1679.730000
21484	BTC	300	1780979400	62793.650000	63183.990000	62763.120000	63182.150000
21666	BTC	300	1780979700	63189.990000	63386.000000	63178.220000	63327.320000
21850	GOLD	300	1780980000	4354.950737	4355.360325	4348.584126	4349.536774
21668	GOLD	300	1780979700	4355.806918	4356.328168	4354.169549	4354.908591
21848	BTC	300	1780980000	63327.320000	63386.000000	63204.000000	63244.010000
21849	ETH	300	1780980000	1685.910000	1690.660000	1684.360000	1685.790000
22030	BTC	300	1780980300	63244.010000	63420.000000	63220.850000	63420.000000
23311	GOLD	300	1780982400	4357.164260	4358.803922	4355.498194	4355.503150
23309	BTC	300	1780982400	63324.650000	63343.560000	63300.000000	63335.990000
23310	ETH	300	1780982400	1689.700000	1690.080000	1687.930000	1688.870000
25595	ETH	300	1780987200	1687.990000	1688.880000	1687.910000	1688.660000
24940	GOLD	300	1780985100	4370.154439	4370.154439	4365.985572	4367.432402
24939	BTC	300	1780985100	63354.780000	63418.000000	63332.010000	63334.490000
24941	ETH	300	1780985100	1688.460000	1691.000000	1688.090000	1688.680000
24043	GOLD	300	1780983600	4356.900250	4367.634798	4356.694615	4367.634798
24041	BTC	300	1780983600	63435.890000	63450.170000	63362.590000	63367.600000
24042	ETH	300	1780983600	1692.720000	1693.000000	1690.520000	1690.650000
22762	GOLD	300	1780981500	4351.949372	4357.043942	4350.829007	4356.499601
22760	BTC	300	1780981500	63282.010000	63294.030000	63120.250000	63132.960000
22761	ETH	300	1780981500	1687.600000	1688.330000	1681.630000	1682.000000
22032	GOLD	300	1780980300	4349.503970	4355.103538	4349.503970	4354.378641
22031	ETH	300	1780980300	1685.790000	1693.750000	1683.410000	1693.610000
23126	BTC	300	1780982100	63252.020000	63360.000000	63252.020000	63324.650000
23128	GOLD	300	1780982100	4360.030974	4361.233935	4357.100000	4357.196578
23127	ETH	300	1780982100	1687.470000	1691.620000	1687.470000	1689.700000
22214	GOLD	300	1780980600	4354.408006	4354.629885	4351.550008	4352.513520
22212	BTC	300	1780980600	63419.990000	63423.990000	63252.790000	63298.800000
22213	ETH	300	1780980600	1693.620000	1696.240000	1688.750000	1689.110000
24577	BTC	300	1780984500	63353.990000	63355.990000	63302.310000	63338.690000
24578	ETH	300	1780984500	1689.540000	1689.540000	1687.440000	1688.250000
24396	BTC	300	1780984200	63419.460000	63453.720000	63350.010000	63357.100000
24397	ETH	300	1780984200	1691.830000	1692.360000	1689.180000	1689.540000
24398	GOLD	300	1780984200	4366.372419	4375.204397	4366.250206	4371.874347
24579	GOLD	300	1780984500	4371.979653	4373.204703	4367.562551	4371.369871
25121	GOLD	300	1780985400	4367.441036	4373.454005	4367.138336	4368.998438
22396	GOLD	300	1780980900	4352.576970	4353.761766	4351.387448	4353.635488
22394	BTC	300	1780980900	63298.800000	63334.000000	63242.350000	63242.350000
22395	ETH	300	1780980900	1689.110000	1690.380000	1686.470000	1686.470000
25119	BTC	300	1780985400	63334.500000	63411.990000	63314.730000	63368.990000
25120	ETH	300	1780985400	1688.680000	1690.640000	1687.610000	1689.250000
24221	BTC	300	1780983900	63367.590000	63441.520000	63362.510000	63419.460000
24222	ETH	300	1780983900	1690.650000	1692.540000	1690.300000	1691.830000
24223	GOLD	300	1780983900	4367.619248	4367.619248	4364.429752	4366.471723
22945	GOLD	300	1780981800	4356.462588	4360.794881	4356.462588	4360.137569
22943	BTC	300	1780981800	63132.960000	63270.000000	63120.240000	63252.020000
22944	ETH	300	1780981800	1682.000000	1688.160000	1681.540000	1687.470000
26563	GOLD	300	1780989000	4354.958808	4358.161472	4353.623846	4356.276546
26200	GOLD	300	1780988400	4363.912889	4363.976242	4358.987918	4358.992412
23677	GOLD	300	1780983000	4358.377365	4359.312011	4355.417619	4357.580056
22579	GOLD	300	1780981200	4353.714708	4355.303066	4351.919318	4351.919318
22577	BTC	300	1780981200	63242.360000	63309.990000	63194.000000	63282.010000
22578	ETH	300	1780981200	1686.350000	1688.880000	1684.510000	1687.680000
23675	BTC	300	1780983000	63315.840000	63525.520000	63308.000000	63516.010000
23676	ETH	300	1780983000	1687.960000	1694.630000	1686.890000	1694.250000
23494	GOLD	300	1780982700	4355.397393	4358.692650	4355.248447	4358.400709
23492	BTC	300	1780982700	63336.000000	63352.000000	63304.010000	63315.840000
23493	ETH	300	1780982700	1688.870000	1689.400000	1687.170000	1687.900000
26198	BTC	300	1780988400	63300.000000	63406.000000	63300.000000	63369.610000
24758	BTC	300	1780984800	63338.680000	63378.620000	63276.000000	63354.780000
24759	ETH	300	1780984800	1688.250000	1689.210000	1685.750000	1688.460000
24760	GOLD	300	1780984800	4371.298754	4371.400000	4367.607777	4370.142825
23860	GOLD	300	1780983300	4357.570460	4358.065039	4356.224664	4356.921922
23858	BTC	300	1780983300	63514.000000	63520.510000	63408.000000	63429.660000
23859	ETH	300	1780983300	1694.040000	1695.230000	1691.000000	1692.580000
26020	GOLD	300	1780988100	4359.934468	4364.000000	4359.735140	4363.904748
26019	ETH	300	1780988100	1684.840000	1686.430000	1684.840000	1685.990000
26018	BTC	300	1780988100	63260.000000	63307.990000	63259.990000	63299.990000
26199	ETH	300	1780988400	1685.980000	1691.330000	1685.980000	1689.900000
25485	GOLD	300	1780986000	4368.239972	4369.142528	4366.434072	4366.994371
25483	BTC	300	1780986000	63420.820000	63454.000000	63420.120000	63450.000000
25303	GOLD	300	1780985700	4369.011773	4371.549093	4367.890846	4368.302237
25301	BTC	300	1780985700	63368.980000	63429.430000	63340.390000	63420.820000
25302	ETH	300	1780985700	1689.260000	1692.830000	1687.800000	1692.100000
25484	ETH	300	1780986000	1692.100000	1693.480000	1691.140000	1693.470000
25837	BTC	300	1780987800	63318.640000	63318.650000	63230.000000	63260.000000
25838	ETH	300	1780987800	1686.430000	1686.510000	1684.060000	1684.830000
25656	GOLD	300	1780987500	4356.478926	4363.100000	4356.478926	4361.847965
25654	BTC	300	1780987500	63355.580000	63410.000000	63318.640000	63318.640000
25655	ETH	300	1780987500	1688.660000	1690.490000	1686.440000	1686.440000
25596	GOLD	300	1780987200	4357.800000	4359.018123	4356.221344	4356.469257
25594	BTC	300	1780987200	63331.400000	63355.600000	63326.320000	63355.580000
25839	GOLD	300	1780987800	4361.922953	4362.600000	4358.234809	4360.038712
26381	BTC	300	1780988700	63369.610000	63443.600000	63325.000000	63438.270000
26382	ETH	300	1780988700	1689.890000	1691.590000	1688.580000	1690.870000
26383	GOLD	300	1780988700	4358.961041	4360.114887	4354.151154	4355.030540
26744	ETH	300	1780989300	1686.430000	1689.020000	1685.460000	1688.260000
26562	BTC	300	1780989000	63438.280000	63439.850000	63298.420000	63298.430000
26564	ETH	300	1780989000	1691.010000	1691.300000	1686.420000	1686.430000
26745	GOLD	300	1780989300	4356.283172	4357.676980	4353.934832	4356.707080
26925	BTC	300	1780989600	63345.150000	63346.000000	63300.000000	63300.010000
26926	ETH	300	1780989600	1688.260000	1689.940000	1687.140000	1687.290000
26743	BTC	300	1780989300	63298.430000	63362.720000	63265.940000	63345.150000
26924	GOLD	300	1780989600	4356.635328	4356.754499	4351.338592	4351.343241
27107	GOLD	300	1780989900	4351.377154	4353.697341	4346.778196	4352.485711
27105	BTC	300	1780989900	63300.010000	63303.060000	63015.160000	63030.820000
27287	ETH	300	1780990200	1675.890000	1681.370000	1675.890000	1680.210000
27106	ETH	300	1780989900	1687.290000	1687.680000	1675.810000	1675.830000
27288	GOLD	300	1780990200	4352.381389	4353.836491	4349.682567	4352.876723
27468	ETH	300	1780990500	1680.210000	1681.470000	1677.500000	1680.870000
27286	BTC	300	1780990200	63030.820000	63178.690000	63030.820000	63156.650000
27467	BTC	300	1780990500	63156.650000	63178.680000	63090.000000	63172.230000
27469	GOLD	300	1780990500	4352.882617	4355.316658	4352.862039	4354.669990
27649	GOLD	300	1780990800	4354.564257	4355.000000	4349.379036	4350.206029
27647	BTC	300	1780990800	63172.230000	63207.120000	63172.230000	63191.020000
27648	ETH	300	1780990800	1680.870000	1681.660000	1680.420000	1681.090000
30371	ETH	300	1780995300	1677.410000	1677.410000	1674.420000	1675.280000
30372	GOLD	300	1780995300	4358.586077	4358.963225	4351.001223	4351.984395
28734	BTC	300	1780992600	62881.040000	62950.490000	62772.170000	62923.480000
28735	ETH	300	1780992600	1673.200000	1676.080000	1669.560000	1675.420000
28736	GOLD	300	1780992600	4350.685646	4350.715602	4346.691780	4347.395691
27829	BTC	300	1780991100	63191.030000	63216.000000	63171.060000	63180.610000
27830	ETH	300	1780991100	1681.230000	1681.900000	1679.010000	1679.290000
27831	GOLD	300	1780991100	4350.313831	4350.368345	4345.824127	4348.951915
31279	GOLD	300	1780996800	4354.260658	4354.444603	4351.358827	4351.802416
31278	ETH	300	1780996800	1679.490000	1680.150000	1677.600000	1677.790000
29642	GOLD	300	1780994100	4355.675730	4359.027030	4354.896326	4358.444169
29640	BTC	300	1780994100	62919.460000	62978.000000	62888.650000	62966.870000
29641	ETH	300	1780994100	1675.950000	1679.030000	1675.410000	1678.670000
28010	BTC	300	1780991400	63180.600000	63204.000000	63123.740000	63195.440000
28011	ETH	300	1780991400	1679.290000	1681.000000	1677.670000	1680.200000
28012	GOLD	300	1780991400	4348.922685	4351.776926	4348.506635	4350.826705
31459	GOLD	300	1780997100	4351.753960	4354.060698	4351.686659	4353.657664
31457	BTC	300	1780997100	62853.740000	62872.890000	62822.000000	62826.050000
31458	ETH	300	1780997100	1677.790000	1678.110000	1675.000000	1675.000000
32184	ETH	300	1780998300	1669.210000	1670.710000	1669.110000	1670.110000
28553	BTC	300	1780992300	63076.400000	63076.400000	62810.850000	62881.040000
28554	ETH	300	1780992300	1677.200000	1677.200000	1668.800000	1673.190000
28555	GOLD	300	1780992300	4351.521989	4352.500000	4349.802759	4350.606416
32365	BTC	300	1780998600	62675.960000	62698.000000	62662.000000	62672.840000
30915	GOLD	300	1780996200	4350.279192	4352.763789	4348.561997	4352.417015
30913	BTC	300	1780996200	62763.460000	62861.900000	62748.000000	62853.940000
28191	BTC	300	1780991700	63195.440000	63202.580000	63182.950000	63198.450000
28192	ETH	300	1780991700	1680.210000	1680.340000	1679.100000	1679.860000
28193	GOLD	300	1780991700	4350.818420	4353.606913	4349.518117	4349.783837
30914	ETH	300	1780996200	1674.350000	1677.230000	1674.170000	1677.080000
30006	GOLD	300	1780994700	4355.117277	4357.939343	4354.093181	4357.368343
30004	BTC	300	1780994700	62984.880000	63003.430000	62864.000000	62888.010000
30005	ETH	300	1780994700	1677.870000	1678.960000	1674.520000	1674.770000
29278	GOLD	300	1780993500	4354.765638	4358.300000	4354.612886	4355.873521
29276	BTC	300	1780993500	62930.000000	62978.000000	62869.600000	62869.600000
29277	ETH	300	1780993500	1674.920000	1677.290000	1674.920000	1675.280000
29098	GOLD	300	1780993200	4349.909342	4358.921494	4349.906372	4354.788367
29096	BTC	300	1780993200	62915.990000	62960.960000	62888.000000	62932.420000
29097	ETH	300	1780993200	1673.820000	1675.760000	1673.080000	1674.960000
28915	BTC	300	1780992900	62923.490000	62966.530000	62885.400000	62915.990000
28916	ETH	300	1780992900	1675.430000	1675.470000	1671.540000	1673.820000
28917	GOLD	300	1780992900	4347.372629	4350.025593	4344.893872	4349.908548
28372	BTC	300	1780992000	63198.440000	63208.860000	63076.400000	63076.410000
28373	ETH	300	1780992000	1679.860000	1680.640000	1676.940000	1677.200000
28374	GOLD	300	1780992000	4349.704802	4352.563445	4349.173681	4351.461646
30188	ETH	300	1780995000	1674.760000	1679.240000	1674.580000	1677.410000
29824	GOLD	300	1780994400	4358.495742	4360.035989	4355.055617	4355.087843
29822	BTC	300	1780994400	62966.880000	63012.000000	62930.000000	62984.880000
29460	GOLD	300	1780993800	4355.905915	4358.231901	4355.600000	4355.668333
29458	BTC	300	1780993800	62869.160000	62939.990000	62806.870000	62919.450000
29459	ETH	300	1780993800	1674.980000	1677.640000	1673.780000	1675.950000
29823	ETH	300	1780994400	1678.530000	1679.510000	1676.760000	1677.880000
30189	GOLD	300	1780995000	4357.335513	4360.954991	4356.702344	4358.578223
30187	BTC	300	1780995000	62887.290000	62976.000000	62872.000000	62942.000000
32367	ETH	300	1780998600	1670.490000	1671.300000	1670.050000	1670.110000
30553	GOLD	300	1780995600	4352.033344	4353.695953	4349.794314	4353.494751
30551	BTC	300	1780995600	62849.750000	62892.930000	62825.250000	62825.250000
30552	ETH	300	1780995600	1675.280000	1676.290000	1674.690000	1675.240000
32003	GOLD	300	1780998000	4349.608373	4352.865943	4349.608373	4350.213455
31639	GOLD	300	1780997400	4353.677990	4359.176711	4353.133175	4357.112389
31637	BTC	300	1780997400	62819.760000	62819.760000	62624.000000	62656.250000
31638	ETH	300	1780997400	1675.000000	1675.120000	1666.890000	1668.230000
30370	BTC	300	1780995300	62941.990000	62941.990000	62834.000000	62849.750000
30733	GOLD	300	1780995900	4353.588783	4354.400169	4350.021871	4350.200282
30731	BTC	300	1780995900	62825.240000	62852.000000	62714.140000	62763.460000
31277	BTC	300	1780996800	62944.420000	62944.430000	62853.730000	62853.730000
31096	BTC	300	1780996500	62853.940000	62944.430000	62853.940000	62944.420000
31097	ETH	300	1780996500	1677.090000	1679.850000	1677.080000	1679.480000
30732	ETH	300	1780995900	1675.240000	1676.790000	1672.990000	1674.350000
31098	GOLD	300	1780996500	4352.426440	4354.193184	4350.707269	4354.189942
32001	BTC	300	1780998000	62616.160000	62678.000000	62612.000000	62673.220000
32002	ETH	300	1780998000	1667.040000	1669.680000	1667.040000	1669.220000
31821	GOLD	300	1780997700	4357.156541	4357.985209	4349.566717	4349.688637
31819	BTC	300	1780997700	62656.250000	62735.070000	62590.010000	62616.160000
32549	ETH	300	1780998900	1670.110000	1671.300000	1670.060000	1670.610000
31820	ETH	300	1780997700	1668.240000	1670.670000	1665.460000	1667.040000
32185	GOLD	300	1780998300	4350.257747	4355.069863	4350.240541	4352.262135
32183	BTC	300	1780998300	62673.230000	62695.430000	62648.000000	62675.950000
32550	GOLD	300	1780998900	4350.870990	4354.090762	4350.727969	4354.019969
32366	GOLD	300	1780998600	4352.275196	4353.758676	4349.053865	4350.965357
32730	BTC	300	1780999200	62715.370000	62780.400000	62704.000000	62768.010000
32731	ETH	300	1780999200	1670.610000	1673.100000	1670.390000	1672.930000
32548	BTC	300	1780998900	62672.840000	62725.280000	62664.200000	62715.360000
32732	GOLD	300	1780999200	4353.984648	4356.700000	4353.572040	4356.614318
32911	BTC	300	1780999500	62768.000000	62797.360000	62605.990000	62678.010000
32912	GOLD	300	1780999500	4356.704521	4357.304883	4354.774758	4355.211501
32913	ETH	300	1780999500	1672.930000	1673.420000	1667.420000	1670.080000
33039	BTC	300	1781008200	62650.550000	62650.550000	62561.420000	62582.450000
33040	ETH	300	1781008200	1678.100000	1678.100000	1675.800000	1676.320000
33041	GOLD	300	1781008200	4362.800000	4363.822323	4361.555771	4363.238870
33130	GOLD	300	1781008500	4363.198675	4364.458198	4359.526449	4359.526449
33129	BTC	300	1781008500	62582.440000	62657.990000	62542.010000	62598.710000
35652	BTC	300	1781055300	61882.010000	61890.000000	61644.000000	61748.010000
35653	ETH	300	1781055300	1643.170000	1643.630000	1635.420000	1639.400000
35654	GOLD	300	1781055300	4223.813401	4226.618073	4221.500000	4224.839718
34412	GOLD	300	1781010600	4365.865851	4369.256636	4362.622467	4363.430824
34410	BTC	300	1781010600	62678.570000	62680.580000	62545.210000	62556.620000
33680	GOLD	300	1781009400	4364.684525	4366.209820	4363.640102	4365.000000
33678	BTC	300	1781009400	62570.710000	62615.540000	62552.380000	62587.580000
33679	ETH	300	1781009400	1675.360000	1676.340000	1673.200000	1674.550000
34411	ETH	300	1781010600	1678.950000	1678.950000	1675.470000	1675.880000
36553	BTC	300	1781056800	61714.000000	61837.670000	61706.000000	61706.010000
36554	ETH	300	1781056800	1638.980000	1642.500000	1638.830000	1638.930000
35835	GOLD	300	1781055600	4224.876456	4226.834752	4220.385524	4224.616484
35833	BTC	300	1781055600	61748.010000	61758.000000	61590.000000	61638.890000
35834	ETH	300	1781055600	1639.410000	1639.930000	1633.650000	1635.180000
35472	BTC	300	1781055000	61826.000000	61896.000000	61750.000000	61882.010000
35473	ETH	300	1781055000	1642.270000	1643.580000	1639.740000	1643.180000
35474	GOLD	300	1781055000	4236.742561	4236.913177	4223.797432	4223.854495
34962	BTC	300	1781054100	61852.010000	61891.100000	61810.000000	61891.100000
34963	ETH	300	1781054100	1643.970000	1645.570000	1642.660000	1645.570000
34964	GOLD	300	1781054100	4215.700000	4222.498431	4211.560947	4218.319877
34229	GOLD	300	1781010300	4361.528692	4365.912889	4360.751397	4365.912889
34227	BTC	300	1781010300	62589.180000	62699.340000	62589.180000	62671.700000
34228	ETH	300	1781010300	1676.710000	1680.410000	1676.710000	1678.830000
33863	GOLD	300	1781009700	4364.921895	4368.530799	4364.237212	4366.000000
33861	BTC	300	1781009700	62587.570000	62659.640000	62554.010000	62648.870000
33862	ETH	300	1781009700	1674.550000	1677.680000	1673.600000	1676.940000
36190	GOLD	300	1781056200	4225.967040	4226.035544	4208.397395	4210.748115
36188	BTC	300	1781056200	61820.230000	61846.000000	61724.010000	61781.990000
36189	ETH	300	1781056200	1640.820000	1642.230000	1638.090000	1640.100000
35120	GOLD	300	1781054400	4218.354540	4229.900000	4218.164858	4227.556861
35118	BTC	300	1781054400	61891.100000	61892.000000	61744.060000	61757.980000
33131	ETH	300	1781008500	1676.460000	1679.080000	1674.540000	1676.680000
33314	GOLD	300	1781008800	4359.597004	4364.313830	4359.386563	4360.932984
33312	BTC	300	1781008800	62598.710000	62611.760000	62517.290000	62520.830000
33313	ETH	300	1781008800	1676.680000	1677.240000	1673.980000	1674.040000
35119	ETH	300	1781054400	1645.570000	1645.780000	1640.680000	1640.920000
36014	GOLD	300	1781055900	4224.593635	4229.000000	4221.977208	4226.049662
34778	GOLD	300	1781011200	4365.627326	4366.917345	4364.700000	4364.876929
34776	BTC	300	1781011200	62376.950000	62432.000000	62284.100000	62324.240000
34777	ETH	300	1781011200	1669.750000	1671.910000	1667.980000	1668.970000
33497	GOLD	300	1781009100	4360.911490	4365.776142	4360.796321	4364.693768
33496	ETH	300	1781009100	1674.040000	1675.370000	1671.580000	1675.360000
33495	BTC	300	1781009100	62520.830000	62587.640000	62439.580000	62570.710000
36013	BTC	300	1781055900	61638.890000	61820.240000	61620.000000	61820.230000
36016	ETH	300	1781055900	1635.190000	1641.130000	1634.410000	1640.830000
34046	GOLD	300	1781010000	4366.002968	4368.154014	4361.438190	4361.592215
34044	BTC	300	1781010000	62645.150000	62738.000000	62589.180000	62589.190000
34045	ETH	300	1781010000	1676.900000	1679.600000	1674.930000	1676.710000
38199	BTC	300	1781059500	61373.990000	61384.000000	61252.000000	61334.920000
38200	ETH	300	1781059500	1625.580000	1626.150000	1621.900000	1624.990000
34595	GOLD	300	1781010900	4363.336718	4368.736507	4362.937326	4365.600000
34593	BTC	300	1781010900	62556.610000	62568.000000	62317.040000	62376.960000
34594	ETH	300	1781010900	1675.880000	1676.860000	1668.330000	1669.750000
35302	GOLD	300	1781054700	4227.594543	4239.423906	4224.201474	4236.797456
35301	BTC	300	1781054700	61757.980000	61870.310000	61754.640000	61826.000000
35303	ETH	300	1781054700	1640.980000	1643.900000	1640.560000	1642.270000
38384	GOLD	300	1781059800	4208.236504	4213.723655	4204.652744	4207.754843
38383	ETH	300	1781059800	1624.990000	1625.350000	1621.770000	1622.100000
36372	GOLD	300	1781056500	4210.656269	4216.072416	4208.119761	4215.603182
36370	BTC	300	1781056500	61782.000000	61793.990000	61690.000000	61714.000000
36371	ETH	300	1781056500	1639.970000	1641.000000	1638.180000	1638.990000
38201	GOLD	300	1781059500	4203.474934	4213.065249	4203.279434	4208.200855
38018	GOLD	300	1781059200	4212.321708	4215.710565	4199.718237	4203.538210
38016	BTC	300	1781059200	61335.070000	61396.000000	61310.000000	61367.990000
38017	ETH	300	1781059200	1624.170000	1625.980000	1622.520000	1625.310000
37103	GOLD	300	1781057700	4210.739162	4210.942893	4203.076185	4205.462851
36737	GOLD	300	1781057100	4215.142085	4215.608373	4211.392118	4212.103277
36735	BTC	300	1781057100	61706.000000	61719.670000	61609.780000	61641.990000
36736	ETH	300	1781057100	1638.930000	1639.960000	1636.220000	1637.130000
37101	BTC	300	1781057700	61559.360000	61573.990000	61350.000000	61431.990000
37102	ETH	300	1781057700	1634.020000	1634.540000	1628.220000	1629.880000
37286	GOLD	300	1781058000	4205.492598	4209.362786	4203.617639	4206.597519
37284	BTC	300	1781058000	61431.990000	61522.000000	61428.000000	61428.010000
37285	ETH	300	1781058000	1629.880000	1632.920000	1628.160000	1628.270000
36920	GOLD	300	1781057400	4212.009695	4214.500000	4208.600000	4210.801862
36918	BTC	300	1781057400	61641.990000	61654.000000	61550.000000	61559.370000
36919	ETH	300	1781057400	1637.130000	1637.340000	1633.920000	1633.930000
36552	GOLD	300	1781056800	4215.593864	4218.000000	4208.471736	4215.139535
37469	GOLD	300	1781058300	4206.644016	4210.034767	4204.108415	4205.021012
37467	BTC	300	1781058300	61428.010000	61492.000000	61360.810000	61492.000000
37468	ETH	300	1781058300	1628.280000	1631.320000	1625.850000	1631.320000
37650	GOLD	300	1781058600	4205.079765	4210.979705	4204.373239	4207.529283
37651	BTC	300	1781058600	61491.990000	61546.010000	61303.380000	61346.000000
37652	ETH	300	1781058600	1631.330000	1632.590000	1624.020000	1625.050000
37834	GOLD	300	1781058900	4207.440826	4212.510901	4202.456655	4212.389781
37833	BTC	300	1781058900	61346.010000	61430.860000	61300.000000	61335.070000
37835	ETH	300	1781058900	1624.980000	1626.390000	1623.220000	1623.920000
38382	BTC	300	1781059800	61326.010000	61338.000000	61235.290000	61238.710000
38750	ETH	300	1781060400	1623.890000	1627.050000	1623.520000	1627.010000
38567	GOLD	300	1781060100	4207.736042	4214.410524	4207.329210	4211.731046
38565	BTC	300	1781060100	61244.630000	61343.830000	61244.630000	61302.360000
38566	ETH	300	1781060100	1622.090000	1625.950000	1622.090000	1624.220000
38929	ETH	300	1781060700	1627.010000	1630.000000	1627.010000	1629.610000
38748	GOLD	300	1781060400	4211.701968	4212.745264	4197.992535	4198.086098
38749	BTC	300	1781060400	61302.360000	61392.000000	61286.000000	61392.000000
41464	BTC	300	1781064900	61509.990000	61534.000000	61498.000000	61507.160000
41465	ETH	300	1781064900	1630.250000	1632.240000	1630.250000	1631.220000
41283	GOLD	300	1781064600	4208.147445	4210.497841	4205.925377	4210.240732
41281	BTC	300	1781064600	61553.990000	61560.000000	61446.000000	61509.980000
40010	GOLD	300	1781062500	4198.107309	4202.246475	4198.100000	4201.085608
40011	BTC	300	1781062500	61457.600000	61550.470000	61448.210000	61522.000000
39650	ETH	300	1781061900	1628.690000	1636.530000	1628.520000	1636.310000
39649	BTC	300	1781061900	61401.230000	61594.000000	61396.420000	61576.480000
39651	GOLD	300	1781061900	4201.950192	4204.200000	4199.400000	4199.413246
40012	ETH	300	1781062500	1630.840000	1633.110000	1630.000000	1631.890000
41282	ETH	300	1781064600	1630.120000	1630.740000	1627.690000	1630.500000
43113	ETH	300	1781067600	1626.290000	1627.090000	1623.000000	1626.380000
43112	GOLD	300	1781067600	4197.496003	4198.813376	4196.225117	4198.239299
43473	BTC	300	1781068200	61185.860000	61193.010000	61124.690000	61175.400000
38930	GOLD	300	1781060700	4198.800000	4200.576328	4196.833850	4197.868302
38928	BTC	300	1781060700	61391.990000	61478.000000	61391.990000	61474.550000
43475	ETH	300	1781068200	1623.840000	1624.190000	1621.770000	1622.470000
43474	GOLD	300	1781068200	4198.823747	4200.127785	4196.567015	4197.667676
41098	GOLD	300	1781064300	4208.439506	4208.624586	4205.930711	4208.092239
41099	BTC	300	1781064300	61492.000000	61553.900000	61483.690000	61550.020000
39113	GOLD	300	1781061000	4197.959168	4200.500000	4196.794613	4200.415846
39111	BTC	300	1781061000	61467.190000	61473.480000	61414.000000	61433.350000
39112	ETH	300	1781061000	1629.420000	1629.650000	1627.660000	1628.220000
41100	ETH	300	1781064300	1628.800000	1630.460000	1628.040000	1630.120000
42747	GOLD	300	1781067000	4198.256731	4198.475705	4195.992972	4196.290880
42745	BTC	300	1781067000	61340.010000	61340.010000	61284.010000	61284.010000
41648	GOLD	300	1781065200	4208.774540	4209.016781	4204.300000	4204.682312
39291	BTC	300	1781061300	61433.350000	61483.990000	61341.570000	61368.270000
39292	ETH	300	1781061300	1628.220000	1631.000000	1626.270000	1627.430000
41647	BTC	300	1781065200	61507.160000	61546.310000	61464.000000	61497.370000
39293	GOLD	300	1781061300	4200.375933	4205.090353	4197.742278	4200.219633
41649	ETH	300	1781065200	1631.360000	1632.530000	1629.090000	1631.500000
39832	GOLD	300	1781062200	4199.429598	4200.000000	4197.608831	4198.190473
39830	BTC	300	1781062200	61576.480000	61576.480000	61435.810000	61457.600000
39831	ETH	300	1781062200	1636.320000	1636.320000	1630.360000	1630.840000
40556	GOLD	300	1781063400	4204.053836	4205.745133	4201.946270	4203.330033
40554	BTC	300	1781063400	61559.990000	61562.350000	61488.280000	61546.000000
40555	ETH	300	1781063400	1630.990000	1631.000000	1629.090000	1630.820000
40374	GOLD	300	1781063100	4204.011498	4206.683270	4201.051798	4203.949781
40372	BTC	300	1781063100	61527.470000	61583.480000	61527.470000	61555.000000
40373	ETH	300	1781063100	1631.090000	1632.990000	1630.610000	1630.930000
39468	BTC	300	1781061600	61368.260000	61415.100000	61341.570000	61401.230000
39469	ETH	300	1781061600	1627.420000	1629.510000	1626.110000	1628.690000
39470	GOLD	300	1781061600	4200.229732	4202.022889	4197.896049	4201.868774
42746	ETH	300	1781067000	1627.240000	1627.330000	1625.020000	1625.820000
40738	GOLD	300	1781063700	4203.319126	4210.109519	4203.089024	4208.839601
40736	BTC	300	1781063700	61545.990000	61549.650000	61510.000000	61549.640000
40192	GOLD	300	1781062800	4201.039109	4204.105534	4200.829461	4204.105534
40190	BTC	300	1781062800	61520.000000	61532.000000	61466.240000	61527.470000
40191	ETH	300	1781062800	1631.840000	1631.840000	1629.160000	1631.080000
40737	ETH	300	1781063700	1630.610000	1630.820000	1629.030000	1630.820000
42197	ETH	300	1781066100	1626.980000	1627.540000	1622.450000	1625.480000
42198	GOLD	300	1781066100	4201.554688	4204.112402	4197.275869	4197.797720
42196	BTC	300	1781066100	61339.130000	61356.010000	61189.690000	61265.990000
42564	GOLD	300	1781066700	4198.474755	4199.018344	4196.448497	4198.319351
42562	BTC	300	1781066700	61228.580000	61370.000000	61196.520000	61340.010000
42381	GOLD	300	1781066400	4197.818116	4198.542163	4196.504826	4198.388619
42379	BTC	300	1781066400	61263.990000	61304.000000	61213.380000	61228.580000
42380	ETH	300	1781066400	1625.340000	1626.790000	1623.150000	1624.300000
40918	GOLD	300	1781064000	4208.853801	4209.701139	4206.063683	4208.496761
40919	BTC	300	1781064000	61549.640000	61560.000000	61464.000000	61492.000000
40917	ETH	300	1781064000	1630.820000	1631.590000	1626.890000	1628.800000
42563	ETH	300	1781066700	1624.310000	1627.950000	1623.080000	1627.240000
42930	GOLD	300	1781067300	4196.296776	4197.876630	4195.500000	4197.567998
42015	GOLD	300	1781065800	4205.039164	4205.381799	4200.095758	4201.581944
41832	GOLD	300	1781065500	4204.603326	4205.644611	4201.881531	4205.066570
41830	BTC	300	1781065500	61497.370000	61525.840000	61455.370000	61471.990000
41466	GOLD	300	1781064900	4210.179839	4210.404099	4205.459651	4208.759975
41831	ETH	300	1781065500	1631.510000	1632.920000	1630.010000	1630.460000
42013	BTC	300	1781065800	61471.990000	61471.990000	61320.000000	61347.990000
42014	ETH	300	1781065800	1630.460000	1630.470000	1626.120000	1627.370000
42928	BTC	300	1781067300	61284.010000	61296.000000	61242.000000	61296.000000
42929	ETH	300	1781067300	1625.830000	1626.330000	1624.960000	1625.980000
43654	BTC	300	1781068500	61175.390000	61175.390000	61080.000000	61107.730000
43655	ETH	300	1781068500	1622.480000	1622.480000	1616.330000	1617.990000
43656	GOLD	300	1781068500	4197.641223	4201.601329	4196.195789	4200.177955
43292	BTC	300	1781067900	61280.820000	61316.000000	61151.990000	61185.860000
43293	ETH	300	1781067900	1626.380000	1627.950000	1622.360000	1623.690000
43111	BTC	300	1781067600	61295.990000	61324.000000	61204.000000	61280.810000
43294	GOLD	300	1781067900	4198.300443	4198.882427	4196.900000	4198.882427
43835	BTC	300	1781068800	61107.730000	61178.000000	61104.000000	61161.130000
44017	GOLD	300	1781069100	4202.477347	4203.037455	4198.698971	4199.459327
44015	BTC	300	1781069100	61161.120000	61263.990000	61161.120000	61263.990000
43837	GOLD	300	1781068800	4200.218481	4203.370342	4198.630670	4202.582141
43836	ETH	300	1781068800	1617.990000	1622.000000	1617.990000	1620.520000
44016	ETH	300	1781069100	1620.510000	1625.990000	1620.400000	1625.990000
44197	BTC	300	1781069400	61263.990000	61328.950000	61202.010000	61278.010000
44198	ETH	300	1781069400	1625.990000	1627.130000	1623.700000	1625.860000
44199	GOLD	300	1781069400	4199.494581	4206.281830	4198.844366	4203.436293
44382	GOLD	300	1781069700	4203.383989	4210.532055	4203.283794	4210.508360
44380	BTC	300	1781069700	61272.010000	61278.000000	61190.000000	61240.000000
44381	ETH	300	1781069700	1625.620000	1625.620000	1622.010000	1624.010000
44565	GOLD	300	1781070000	4210.465122	4216.484014	4205.810574	4214.327986
44563	BTC	300	1781070000	61240.000000	61286.000000	61239.310000	61280.590000
44564	ETH	300	1781070000	1624.010000	1626.060000	1624.000000	1625.280000
48201	BTC	300	1781077200	61719.730000	61756.000000	61716.210000	61756.000000
44747	GOLD	300	1781070300	4214.369253	4217.786593	4212.100000	4216.989231
44746	BTC	300	1781070300	61280.590000	61297.070000	61216.010000	61227.000000
44748	ETH	300	1781070300	1625.280000	1625.810000	1622.230000	1623.250000
48202	ETH	300	1781077200	1640.780000	1641.850000	1640.300000	1641.080000
45844	ETH	300	1781072100	1628.710000	1631.820000	1628.390000	1631.820000
45845	GOLD	300	1781072100	4234.622341	4244.471902	4233.742200	4237.513978
45843	BTC	300	1781072100	61393.440000	61486.000000	61385.240000	61480.350000
44931	GOLD	300	1781070600	4216.903663	4221.964997	4216.400000	4221.382120
44929	BTC	300	1781070600	61227.000000	61380.000000	61227.000000	61372.960000
44930	ETH	300	1781070600	1623.240000	1630.000000	1623.240000	1629.270000
47851	GOLD	300	1781075400	4227.121871	4228.739051	4225.113454	4227.584687
47849	BTC	300	1781075400	61565.590000	61593.990000	61528.000000	61577.680000
47850	ETH	300	1781075400	1634.320000	1635.230000	1632.700000	1633.820000
47485	GOLD	300	1781074800	4226.411833	4229.781235	4225.222245	4225.837995
46757	GOLD	300	1781073600	4235.457530	4236.606073	4231.346839	4233.914807
46755	BTC	300	1781073600	61432.710000	61456.000000	61389.710000	61433.570000
46756	ETH	300	1781073600	1632.250000	1632.530000	1629.720000	1631.490000
47483	BTC	300	1781074800	61472.890000	61572.000000	61440.000000	61541.540000
47484	ETH	300	1781074800	1632.080000	1634.610000	1630.730000	1633.010000
45114	GOLD	300	1781070900	4221.466670	4227.637549	4220.829338	4225.994831
45112	BTC	300	1781070900	61372.960000	61400.010000	61344.000000	61361.180000
45113	ETH	300	1781070900	1629.260000	1629.580000	1627.630000	1627.990000
49657	BTC	300	1781079600	61612.410000	61664.000000	61520.000000	61520.010000
45663	GOLD	300	1781071800	4228.688685	4235.613171	4228.532405	4234.522795
45661	BTC	300	1781071800	61378.140000	61393.530000	61350.000000	61393.440000
45662	ETH	300	1781071800	1628.270000	1628.970000	1627.290000	1628.710000
49477	BTC	300	1781079300	61620.770000	61736.000000	61608.000000	61612.410000
49295	GOLD	300	1781079000	4210.665622	4210.665622	4185.546485	4187.014411
49478	ETH	300	1781079300	1636.550000	1639.760000	1635.920000	1636.720000
48563	GOLD	300	1781077800	4213.753941	4216.600000	4211.762378	4212.757398
48561	BTC	300	1781077800	61719.720000	61772.490000	61676.350000	61736.510000
48562	ETH	300	1781077800	1640.090000	1642.630000	1638.630000	1640.780000
45296	GOLD	300	1781071200	4225.968745	4229.043063	4224.000000	4226.853367
45295	BTC	300	1781071200	61361.170000	61399.990000	61296.020000	61399.990000
45297	ETH	300	1781071200	1628.280000	1629.520000	1625.970000	1629.480000
49476	GOLD	300	1781079300	4187.071750	4194.302699	4186.181316	4189.665444
47119	GOLD	300	1781074200	4232.109252	4232.177447	4228.714257	4231.277008
47117	BTC	300	1781074200	61478.640000	61509.970000	61427.980000	61509.970000
47118	ETH	300	1781074200	1631.090000	1633.130000	1630.000000	1633.130000
46391	ETH	300	1781073000	1628.840000	1629.010000	1623.610000	1623.760000
46392	GOLD	300	1781073000	4237.079946	4240.142634	4231.914126	4231.914126
46209	GOLD	300	1781072700	4235.671105	4238.809552	4235.107280	4237.098637
46207	BTC	300	1781072700	61363.770000	61408.000000	61326.000000	61351.990000
46208	ETH	300	1781072700	1629.150000	1630.710000	1627.450000	1628.830000
46390	BTC	300	1781073000	61351.990000	61362.010000	61168.990000	61178.010000
46025	BTC	300	1781072400	61480.350000	61482.060000	61332.020000	61352.950000
46026	GOLD	300	1781072400	4237.526179	4238.043624	4232.301154	4235.615257
46027	ETH	300	1781072400	1631.990000	1632.000000	1628.390000	1628.950000
45480	GOLD	300	1781071500	4226.876580	4232.054523	4226.876580	4228.629607
45478	BTC	300	1781071500	61399.990000	61427.500000	61338.000000	61378.150000
45479	ETH	300	1781071500	1629.440000	1630.750000	1627.720000	1628.310000
48929	GOLD	300	1781078400	4213.971466	4214.278644	4205.095680	4205.713879
46937	GOLD	300	1781073900	4234.004024	4235.261422	4231.198025	4232.118917
46935	BTC	300	1781073900	61433.570000	61520.910000	61433.570000	61478.640000
46936	ETH	300	1781073900	1631.490000	1634.180000	1631.090000	1631.090000
46574	GOLD	300	1781073300	4231.979733	4237.661429	4231.979733	4235.410818
46572	BTC	300	1781073300	61178.010000	61447.990000	61145.510000	61432.710000
46573	ETH	300	1781073300	1623.620000	1633.000000	1622.770000	1632.250000
48034	GOLD	300	1781075700	4227.592177	4227.686127	4226.254267	4227.115551
48032	BTC	300	1781075700	61577.680000	61582.000000	61560.300000	61581.500000
47302	GOLD	300	1781074500	4231.340672	4232.318131	4226.481893	4226.481893
47300	BTC	300	1781074500	61509.970000	61520.950000	61460.640000	61472.880000
47301	ETH	300	1781074500	1633.130000	1633.900000	1631.770000	1632.080000
48033	ETH	300	1781075700	1633.820000	1634.410000	1633.200000	1633.980000
48927	BTC	300	1781078400	61687.560000	61695.990000	61598.340000	61644.000000
48746	GOLD	300	1781078100	4212.807507	4216.340577	4212.493663	4213.962530
48381	GOLD	300	1781077500	4218.521432	4219.046844	4213.615921	4213.845462
48382	BTC	300	1781077500	61756.000000	61756.000000	61672.000000	61719.720000
47668	GOLD	300	1781075100	4225.942249	4229.023560	4225.613200	4227.092128
47666	BTC	300	1781075100	61541.540000	61573.540000	61499.370000	61571.090000
47667	ETH	300	1781075100	1633.010000	1634.380000	1632.160000	1634.380000
48056	BTC	300	1781076900	61728.010000	61782.000000	61694.060000	61719.740000
48057	ETH	300	1781076900	1641.230000	1643.050000	1640.010000	1640.780000
48058	GOLD	300	1781076900	4219.100000	4219.251564	4216.316906	4218.088742
48383	ETH	300	1781077500	1641.080000	1641.190000	1637.940000	1640.090000
48203	GOLD	300	1781077200	4218.024512	4220.558055	4215.623300	4218.508436
48744	BTC	300	1781078100	61736.510000	61742.470000	61661.490000	61687.560000
48745	ETH	300	1781078100	1640.770000	1641.100000	1639.400000	1640.090000
48928	ETH	300	1781078400	1640.090000	1640.890000	1635.500000	1637.340000
49112	GOLD	300	1781078700	4205.768804	4211.286584	4205.200000	4210.755018
49293	BTC	300	1781079000	61577.990000	61720.940000	61577.990000	61620.780000
49294	ETH	300	1781079000	1636.770000	1639.910000	1636.460000	1636.550000
49110	BTC	300	1781078700	61644.000000	61673.300000	61545.710000	61574.000000
49111	ETH	300	1781078700	1637.340000	1638.330000	1635.320000	1636.630000
49659	GOLD	300	1781079600	4189.598718	4195.390756	4184.842631	4189.999629
49658	ETH	300	1781079600	1636.840000	1637.880000	1633.340000	1633.400000
49839	ETH	300	1781079900	1633.400000	1634.760000	1632.420000	1633.860000
50021	GOLD	300	1781080200	4196.816872	4196.816872	4192.105208	4194.204876
49838	BTC	300	1781079900	61520.000000	61562.350000	61500.000000	61536.050000
49840	GOLD	300	1781079900	4190.073135	4201.005005	4190.073135	4196.921777
50020	ETH	300	1781080200	1633.860000	1635.690000	1629.580000	1629.590000
50019	BTC	300	1781080200	61537.990000	61607.560000	61416.000000	61416.000000
50201	ETH	300	1781080500	1629.590000	1629.730000	1624.760000	1625.420000
50200	BTC	300	1781080500	61416.000000	61456.000000	61328.180000	61334.000000
54455	ETH	300	1781091300	1618.260000	1620.210000	1618.010000	1618.940000
54272	BTC	300	1781091000	60966.060000	61016.010000	60922.770000	60997.860000
54273	ETH	300	1781091000	1616.880000	1618.630000	1615.410000	1618.280000
53950	GOLD	300	1781089200	4199.370015	4200.533277	4199.304792	4200.533277
50743	BTC	300	1781081400	61228.340000	61322.760000	61199.890000	61278.010000
50744	ETH	300	1781081400	1620.790000	1623.390000	1619.090000	1621.720000
50745	GOLD	300	1781081400	4195.437741	4201.433973	4192.745675	4192.839125
52375	GOLD	300	1781084100	4191.356992	4194.354253	4188.193754	4188.294880
52373	BTC	300	1781084100	61295.110000	61421.460000	61268.000000	61381.030000
52374	ETH	300	1781084100	1620.560000	1623.740000	1620.100000	1622.130000
53304	GOLD	300	1781086800	4182.157905	4185.157148	4179.069934	4184.037770
53305	BTC	300	1781086800	61197.990000	61282.440000	61164.220000	61271.410000
53306	ETH	300	1781086800	1619.160000	1623.140000	1618.530000	1622.340000
53487	BTC	300	1781087100	61271.410000	61271.410000	61271.410000	61271.410000
53488	ETH	300	1781087100	1622.340000	1622.340000	1622.340000	1622.340000
53489	GOLD	300	1781087100	4184.042843	4184.042843	4183.944770	4183.944770
51286	BTC	300	1781082300	61206.010000	61256.250000	61162.010000	61171.990000
51287	ETH	300	1781082300	1619.780000	1621.200000	1617.690000	1618.680000
51288	GOLD	300	1781082300	4195.037358	4195.386783	4190.122336	4191.480263
50924	BTC	300	1781081700	61278.020000	61298.000000	61246.000000	61261.550000
50925	ETH	300	1781081700	1621.720000	1622.250000	1620.620000	1621.340000
50926	GOLD	300	1781081700	4192.770814	4197.546694	4189.849680	4196.470664
53951	BTC	300	1781089200	61393.240000	61393.240000	61386.000000	61386.000000
53949	ETH	300	1781089200	1628.230000	1628.610000	1628.020000	1628.080000
53491	GOLD	300	1781088300	4191.600000	4191.749299	4188.783333	4189.160263
53490	BTC	300	1781088300	61348.000000	61351.570000	61294.000000	61338.550000
53492	ETH	300	1781088300	1626.670000	1626.870000	1625.000000	1626.870000
51831	GOLD	300	1781083200	4193.494658	4195.154875	4187.964976	4187.964976
51829	BTC	300	1781083200	61036.000000	61040.000000	60787.890000	60970.000000
51830	ETH	300	1781083200	1614.770000	1614.910000	1606.640000	1612.680000
52011	GOLD	300	1781083500	4187.919116	4197.376448	4187.852061	4193.870336
52009	BTC	300	1781083500	60979.260000	61244.000000	60955.530000	61210.450000
52010	ETH	300	1781083500	1612.850000	1620.090000	1612.390000	1618.950000
50202	GOLD	300	1781080500	4194.232653	4196.398004	4192.500000	4194.610169
51648	BTC	300	1781082900	61064.300000	61138.000000	61018.270000	61036.000000
51649	ETH	300	1781082900	1613.750000	1618.430000	1613.560000	1614.770000
50382	ETH	300	1781080800	1625.740000	1625.740000	1621.920000	1622.200000
50383	GOLD	300	1781080800	4194.581112	4194.779844	4189.291262	4190.639181
50381	BTC	300	1781080800	61334.000000	61341.050000	61242.920000	61243.000000
51650	GOLD	300	1781082900	4189.793629	4193.632227	4189.271946	4193.402712
51105	BTC	300	1781082000	61261.550000	61321.990000	61202.000000	61206.000000
51106	ETH	300	1781082000	1621.340000	1623.540000	1619.360000	1619.790000
51107	GOLD	300	1781082000	4196.471669	4199.005392	4194.012118	4195.104828
50562	GOLD	300	1781081100	4190.610105	4198.446700	4190.493702	4195.452948
50560	BTC	300	1781081100	61243.000000	61262.870000	61168.010000	61228.340000
50561	ETH	300	1781081100	1622.200000	1622.200000	1618.180000	1620.720000
54091	BTC	300	1781090700	61074.000000	61084.550000	60895.090000	60966.050000
54092	ETH	300	1781090700	1618.920000	1619.600000	1613.160000	1616.880000
52738	GOLD	300	1781084700	4199.400283	4201.500000	4194.577382	4194.667488
52736	BTC	300	1781084700	61268.010000	61276.070000	61160.000000	61180.000000
52737	ETH	300	1781084700	1621.040000	1621.360000	1616.570000	1617.990000
54093	GOLD	300	1781090700	4190.448787	4193.811522	4187.848378	4187.848378
52193	GOLD	300	1781083800	4193.956088	4193.956088	4188.954216	4191.390038
51467	BTC	300	1781082600	61168.540000	61251.400000	61064.290000	61064.290000
51468	ETH	300	1781082600	1618.600000	1620.920000	1613.560000	1613.700000
51469	GOLD	300	1781082600	4191.449845	4191.853322	4188.857444	4189.885253
52191	BTC	300	1781083800	61210.460000	61300.000000	61192.010000	61295.120000
52192	ETH	300	1781083800	1618.950000	1621.610000	1618.040000	1620.360000
52556	GOLD	300	1781084400	4188.196996	4199.940468	4187.898415	4199.387250
52555	BTC	300	1781084400	61381.030000	61381.030000	61268.000000	61268.010000
52558	ETH	300	1781084400	1622.020000	1622.240000	1620.520000	1621.040000
52920	GOLD	300	1781085000	4194.762060	4194.776943	4190.655479	4190.658077
52918	BTC	300	1781085000	61180.000000	61324.000000	61177.530000	61285.010000
52919	ETH	300	1781085000	1618.040000	1621.800000	1617.770000	1620.270000
53584	GOLD	300	1781088600	4189.207176	4193.771818	4187.048723	4192.918047
53583	BTC	300	1781088600	61338.550000	61381.400000	61286.270000	61302.010000
53123	GOLD	300	1781086500	4192.503728	4192.765659	4178.718017	4182.223112
53121	BTC	300	1781086500	61241.750000	61275.990000	61151.410000	61197.990000
53122	ETH	300	1781086500	1620.720000	1621.470000	1618.100000	1619.350000
53028	GOLD	300	1781086200	4193.500000	4193.856993	4190.658391	4192.436101
53029	BTC	300	1781086200	61216.000000	61296.000000	61214.010000	61241.750000
53030	ETH	300	1781086200	1620.580000	1622.260000	1620.420000	1620.860000
53585	ETH	300	1781088600	1627.000000	1628.230000	1626.960000	1627.510000
54274	GOLD	300	1781091000	4187.878985	4193.033339	4187.600000	4189.754876
53767	GOLD	300	1781088900	4192.859321	4199.543080	4192.577740	4199.463598
53766	BTC	300	1781088900	61302.000000	61410.000000	61290.000000	61386.090000
53985	BTC	300	1781090400	61192.000000	61259.990000	61074.000000	61074.000000
53768	ETH	300	1781088900	1627.510000	1629.990000	1627.080000	1628.230000
53987	ETH	300	1781090400	1621.550000	1624.660000	1618.670000	1618.670000
53986	GOLD	300	1781090400	4188.200000	4190.603043	4186.300000	4190.505255
54634	ETH	300	1781091600	1618.810000	1621.690000	1618.610000	1620.210000
55365	BTC	300	1781092800	61034.040000	61082.000000	60960.010000	61081.990000
54453	GOLD	300	1781091300	4189.663331	4189.740224	4180.060773	4188.444535
54454	BTC	300	1781091300	60997.860000	61041.990000	60958.000000	60982.000000
54635	GOLD	300	1781091600	4188.418006	4190.611128	4184.160473	4186.372917
54633	BTC	300	1781091600	60981.010000	61058.000000	60958.920000	61022.010000
54818	GOLD	300	1781091900	4186.349118	4187.900000	4179.121882	4179.876608
54816	BTC	300	1781091900	61022.010000	61107.990000	60976.000000	61013.060000
54817	ETH	300	1781091900	1620.210000	1623.690000	1619.000000	1621.080000
54999	BTC	300	1781092200	61013.070000	61109.990000	61013.070000	61042.010000
55000	ETH	300	1781092200	1621.080000	1623.520000	1620.510000	1620.510000
55001	GOLD	300	1781092200	4179.824501	4182.300731	4178.779590	4179.323853
55184	GOLD	300	1781092500	4179.315294	4179.315294	4174.750015	4176.649720
55182	BTC	300	1781092500	61042.010000	61082.000000	61013.690000	61034.030000
55183	ETH	300	1781092500	1620.600000	1621.520000	1619.340000	1620.050000
55366	ETH	300	1781092800	1620.050000	1621.990000	1615.910000	1621.920000
59655	BTC	300	1781492700	65556.000000	65583.990000	65540.230000	65575.690000
60018	BTC	300	1781493300	65727.990000	65732.000000	65684.730000	65705.990000
59835	GOLD	300	1781493000	4351.161291	4352.250753	4346.598800	4346.670203
57394	BTC	300	1781097600	61478.940000	61575.580000	61456.150000	61534.000000
57395	ETH	300	1781097600	1635.090000	1637.740000	1634.420000	1637.480000
57396	GOLD	300	1781097600	4174.832664	4179.877803	4172.520440	4174.535558
55908	BTC	300	1781093700	61189.990000	61238.010000	61070.800000	61083.990000
55909	ETH	300	1781093700	1623.760000	1625.150000	1620.580000	1621.420000
55910	GOLD	300	1781093700	4170.000383	4173.394341	4168.153244	4169.252496
59836	BTC	300	1781493000	65575.680000	65719.830000	65575.680000	65700.010000
59211	GOLD	300	1781100600	4201.004123	4201.385824	4193.484043	4195.114775
59209	BTC	300	1781100600	62218.000000	62236.000000	62002.550000	62004.490000
59210	ETH	300	1781100600	1653.880000	1654.440000	1646.640000	1647.050000
59393	GOLD	300	1781100900	4195.014418	4199.699419	4193.372549	4197.450221
58847	GOLD	300	1781100000	4205.058540	4208.870771	4200.800000	4204.440387
58301	GOLD	300	1781099100	4166.883233	4190.698974	4165.550173	4188.898756
58299	BTC	300	1781099100	62380.320000	62445.950000	62227.610000	62443.260000
56724	GOLD	300	1781095200	4164.341397	4196.414426	4164.341397	4188.044215
56722	BTC	300	1781095200	61706.000000	61749.990000	61635.220000	61683.990000
56723	ETH	300	1781095200	1640.390000	1640.560000	1637.130000	1639.410000
58119	GOLD	300	1781098800	4173.010499	4176.029926	4166.282718	4166.833852
57047	BTC	300	1781097000	61557.990000	61573.860000	61500.000000	61528.810000
56089	BTC	300	1781094000	61083.990000	61148.000000	61047.030000	61059.650000
56090	ETH	300	1781094000	1621.420000	1624.070000	1620.990000	1622.050000
56091	GOLD	300	1781094000	4169.229746	4169.229746	4156.910907	4158.605832
57048	ETH	300	1781097000	1635.260000	1635.600000	1633.630000	1634.230000
57049	GOLD	300	1781097000	4171.000000	4179.145023	4170.914688	4175.947565
58117	BTC	300	1781098800	62170.880000	62376.880000	62066.000000	62376.880000
58118	ETH	300	1781098800	1660.360000	1667.210000	1656.480000	1666.450000
56590	GOLD	300	1781094900	4161.600000	4164.589698	4156.907537	4164.314056
56591	BTC	300	1781094900	61655.980000	61766.780000	61655.980000	61706.000000
56592	ETH	300	1781094900	1638.160000	1641.760000	1637.870000	1640.390000
56452	GOLD	300	1781094600	4159.360723	4159.558563	4156.800000	4158.190952
55367	GOLD	300	1781092800	4176.708017	4185.342565	4176.693745	4177.044549
56450	BTC	300	1781094600	61167.990000	61929.140000	61167.990000	61809.990000
56451	ETH	300	1781094600	1625.440000	1644.810000	1625.440000	1641.860000
55546	BTC	300	1781093100	61081.990000	61158.000000	61048.010000	61110.020000
55547	ETH	300	1781093100	1621.920000	1624.570000	1620.070000	1622.030000
55548	GOLD	300	1781093100	4177.067230	4178.227938	4168.511851	4169.320957
58300	ETH	300	1781099100	1666.610000	1667.300000	1661.130000	1665.960000
56906	GOLD	300	1781095500	4188.062053	4194.859633	4181.000000	4188.662480
56904	BTC	300	1781095500	61685.990000	61802.350000	61660.000000	61789.200000
56905	ETH	300	1781095500	1639.420000	1641.650000	1638.070000	1641.290000
56272	GOLD	300	1781094300	4158.545343	4165.202244	4158.545343	4159.312182
55729	BTC	300	1781093400	61110.010000	61221.990000	61110.010000	61189.990000
55727	ETH	300	1781093400	1622.020000	1625.030000	1621.870000	1623.760000
55728	GOLD	300	1781093400	4169.368410	4174.327056	4168.338837	4170.075953
56270	BTC	300	1781094300	61059.650000	61175.650000	61059.650000	61167.990000
56271	ETH	300	1781094300	1622.040000	1625.540000	1622.040000	1625.430000
58845	BTC	300	1781100000	62146.420000	62218.000000	62020.010000	62210.770000
58846	ETH	300	1781100000	1651.810000	1655.060000	1648.400000	1655.060000
57755	GOLD	300	1781098200	4159.127362	4167.895509	4155.650233	4167.832203
57213	BTC	300	1781097300	61528.810000	61531.680000	61464.690000	61478.940000
57214	ETH	300	1781097300	1634.160000	1635.090000	1632.570000	1635.090000
57215	GOLD	300	1781097300	4175.893783	4180.220692	4171.492331	4174.851582
57756	BTC	300	1781098200	61553.790000	61812.000000	61530.510000	61777.020000
57757	ETH	300	1781098200	1637.140000	1647.500000	1636.480000	1646.760000
57576	GOLD	300	1781097900	4174.620480	4174.731532	4157.487609	4159.170784
57577	BTC	300	1781097900	61496.440000	61586.000000	61444.870000	61553.800000
57575	ETH	300	1781097900	1637.480000	1638.660000	1634.430000	1637.170000
59391	BTC	300	1781100900	62004.490000	62067.990000	61868.000000	61929.850000
59392	ETH	300	1781100900	1647.040000	1649.830000	1643.670000	1645.870000
57937	GOLD	300	1781098500	4167.853261	4173.080899	4167.335390	4173.052982
57935	BTC	300	1781098500	61777.020000	62167.990000	61748.600000	62163.990000
57936	ETH	300	1781098500	1646.740000	1660.860000	1646.020000	1660.360000
59837	ETH	300	1781493000	1719.060000	1723.380000	1719.060000	1722.560000
58665	GOLD	300	1781099700	4198.392321	4206.188637	4198.238879	4204.997074
58483	GOLD	300	1781099400	4188.969649	4200.453293	4186.371888	4198.493620
58481	BTC	300	1781099400	62441.030000	62441.030000	62184.000000	62214.010000
58482	ETH	300	1781099400	1666.000000	1666.090000	1651.820000	1654.700000
59029	GOLD	300	1781100300	4204.379337	4206.000000	4199.656568	4200.989635
59027	BTC	300	1781100300	62210.770000	62258.000000	62158.000000	62218.010000
58663	BTC	300	1781099700	62214.010000	62248.000000	62075.290000	62144.000000
58664	ETH	300	1781099700	1654.730000	1655.470000	1650.950000	1652.070000
59028	ETH	300	1781100300	1655.050000	1655.640000	1652.280000	1653.840000
59576	GOLD	300	1781101200	4197.388438	4199.466985	4193.749253	4198.971677
59574	BTC	300	1781101200	61920.000000	61968.000000	61862.010000	61914.010000
59657	GOLD	300	1781492700	4351.400000	4351.900000	4348.992627	4351.111216
59656	ETH	300	1781492700	1718.100000	1719.550000	1717.690000	1718.950000
59575	ETH	300	1781101200	1645.520000	1646.750000	1642.230000	1643.750000
60019	ETH	300	1781493300	1722.990000	1723.260000	1721.220000	1721.500000
60149	BTC	300	1781493600	65706.000000	65731.330000	65673.760000	65700.020000
60491	BTC	300	1781494200	65737.695671	65787.514437	65680.257694	65723.691564
60020	GOLD	300	1781493300	4346.582963	4349.018998	4343.800000	4344.773851
60151	GOLD	300	1781493600	4344.749446	4346.978694	4343.833973	4346.313724
60334	GOLD	300	1781493900	4346.246532	4349.940828	4345.575022	4348.561367
60150	ETH	300	1781493600	1721.490000	1721.700000	1719.880000	1720.580000
60332	BTC	300	1781493900	65700.020000	65731.320000	65692.200000	65729.990000
60333	ETH	300	1781493900	1720.570000	1721.400000	1720.480000	1721.380000
60483	GOLD	300	1781494200	4348.615317	4348.692750	4345.092979	4346.483873
60492	ETH	300	1781494200	1721.378916	1722.562362	1719.864173	1721.953522
60654	GOLD	300	1781494500	4346.538994	4346.733346	4342.800000	4346.425161
60652	BTC	300	1781494500	65719.283537	65789.619137	65683.287989	65734.156037
60653	ETH	300	1781494500	1721.719335	1722.807532	1719.559075	1721.282556
62078	ETH	300	1782093600	1743.820000	1745.270000	1740.130000	1741.390000
62623	BTC	300	1782094500	64552.000000	64641.260000	64512.000000	64622.010000
62624	ETH	300	1782094500	1740.730000	1745.000000	1739.320000	1743.520000
64975	GOLD	300	1782105900	4203.016798	4204.452682	4202.300000	4202.558421
62625	GOLD	300	1782094500	4208.770995	4212.427241	4206.665432	4208.787883
64973	BTC	300	1782105900	64254.000000	64254.000000	64206.370000	64226.000000
64974	ETH	300	1782105900	1738.190000	1739.830000	1737.670000	1738.730000
60837	GOLD	300	1781494800	4346.429940	4348.262847	4346.002474	4346.706210
60835	BTC	300	1781494800	65739.846461	65775.119801	65690.952859	65731.446107
60836	ETH	300	1781494800	1721.309146	1722.568409	1719.849381	1720.985589
61941	GOLD	300	1782093300	4216.300000	4216.582362	4211.559529	4212.551426
61939	BTC	300	1782093300	64686.000000	64696.000000	64560.500000	64606.370000
61940	ETH	300	1782093300	1745.620000	1745.770000	1743.400000	1743.820000
61753	BTC	300	1781496300	65729.043133	65797.367151	65696.256455	65717.686086
61754	ETH	300	1781496300	1721.280815	1722.599020	1720.412624	1721.880505
61755	GOLD	300	1781496300	4347.017676	4347.194070	4344.407650	4345.949614
61387	BTC	300	1781495700	65721.645509	65792.825960	65684.145118	65712.283541
61388	ETH	300	1781495700	1720.490093	1722.644928	1720.106610	1721.095566
61389	GOLD	300	1781495700	4344.983597	4348.200000	4344.694230	4347.526927
65110	GOLD	300	1782107400	4214.592404	4216.369590	4209.776084	4210.696697
65108	BTC	300	1782107400	64254.790000	64254.790000	64190.000000	64209.990000
63877	GOLD	300	1782104100	4193.371672	4197.109087	4172.825209	4195.373251
63512	GOLD	300	1782103500	4193.656611	4195.900000	4193.196516	4195.298425
61018	BTC	300	1781495100	65733.291090	65943.980000	65667.162688	65769.845132
61019	ETH	300	1781495100	1721.297077	1723.110000	1719.153165	1721.422752
61020	GOLD	300	1781495100	4346.722406	4348.513650	4345.333549	4346.851025
63510	BTC	300	1782103500	63958.540000	64070.000000	63958.540000	64063.490000
63511	ETH	300	1782103500	1731.950000	1735.280000	1731.940000	1734.860000
63331	GOLD	300	1782103200	4194.365825	4195.056796	4193.439253	4193.620139
63329	BTC	300	1782103200	64010.010000	64018.690000	63958.540000	63958.540000
63330	ETH	300	1782103200	1732.160000	1733.560000	1731.120000	1731.950000
63878	BTC	300	1782104100	64088.640000	64116.440000	64076.000000	64100.020000
62803	BTC	300	1782094800	64604.750000	64604.750000	64518.670000	64538.770000
62804	ETH	300	1782094800	1743.530000	1743.700000	1739.600000	1741.080000
62805	GOLD	300	1782094800	4208.821699	4209.067478	4202.941967	4203.696099
63876	ETH	300	1782104100	1735.950000	1735.950000	1734.510000	1735.300000
62985	GOLD	300	1782095100	4203.627918	4203.627918	4201.353673	4201.353673
62984	BTC	300	1782095100	64538.770000	64557.990000	64538.770000	64557.990000
62986	ETH	300	1782095100	1741.110000	1742.430000	1741.110000	1742.430000
61204	BTC	300	1781495400	65776.848413	65792.365668	65678.254899	65707.679361
61205	ETH	300	1781495400	1721.243032	1722.885218	1719.937702	1720.675730
61206	GOLD	300	1781495400	4346.914096	4346.981947	4342.567437	4345.030794
64242	GOLD	300	1782104700	4196.483323	4199.890939	4194.924829	4199.787523
64241	BTC	300	1782104700	64093.990000	64246.000000	64093.990000	64224.000000
63695	GOLD	300	1782103800	4195.275312	4195.672037	4192.864711	4193.470824
63693	BTC	300	1782103800	64063.480000	64088.640000	64040.000000	64088.640000
63694	ETH	300	1782103800	1734.860000	1735.960000	1733.710000	1735.950000
61570	BTC	300	1781496000	65711.752791	65787.522866	65668.988596	65721.781104
61571	ETH	300	1781496000	1721.071330	1723.022298	1720.708652	1721.625882
61572	GOLD	300	1781496000	4347.616785	4347.959602	4345.836342	4346.966943
62261	GOLD	300	1782093900	4211.662551	4212.855963	4207.045016	4209.566959
62259	BTC	300	1782093900	64574.300000	64596.000000	64522.000000	64530.010000
62260	ETH	300	1782093900	1741.390000	1741.900000	1739.370000	1740.010000
62443	GOLD	300	1782094200	4209.594327	4209.612835	4172.618129	4208.832489
62441	BTC	300	1782094200	64528.880000	64584.000000	64510.000000	64556.010000
62079	GOLD	300	1782093600	4212.575473	4216.052821	4210.412360	4211.670943
62077	BTC	300	1782093600	64606.000000	64663.990000	64500.300000	64574.300000
62442	ETH	300	1782094200	1739.850000	1742.000000	1738.670000	1740.870000
64243	ETH	300	1782104700	1734.720000	1737.990000	1734.210000	1736.890000
63154	GOLD	300	1782102900	4194.294829	4195.429965	4191.551923	4194.326484
63152	BTC	300	1782102900	64012.000000	64058.000000	64004.200000	64010.010000
63153	ETH	300	1782102900	1732.870000	1734.220000	1732.000000	1732.170000
65109	ETH	300	1782107400	1737.990000	1737.990000	1735.720000	1736.040000
65039	GOLD	300	1782107100	4214.200000	4215.204662	4213.513958	4214.663120
62993	GOLD	300	1782102600	4195.200000	4196.374310	4172.899387	4194.297092
62994	BTC	300	1782102600	63984.010000	64025.510000	63984.000000	64012.000000
62995	ETH	300	1782102600	1734.680000	1735.550000	1732.510000	1732.870000
65040	BTC	300	1782107100	64227.860000	64260.150000	64224.000000	64254.780000
65041	ETH	300	1782107100	1737.290000	1738.070000	1737.220000	1737.970000
65471	BTC	300	1782108000	64247.740000	64269.240000	64172.670000	64179.990000
64609	GOLD	300	1782105300	4198.296298	4202.112163	4172.900000	4201.918449
64607	BTC	300	1782105300	64288.010000	64298.010000	64232.560000	64298.010000
64058	GOLD	300	1782104400	4195.427802	4197.650402	4195.427802	4196.418112
64059	BTC	300	1782104400	64100.020000	64124.000000	64089.690000	64093.990000
64060	ETH	300	1782104400	1735.310000	1735.670000	1734.200000	1734.590000
64426	GOLD	300	1782105000	4199.740465	4199.842579	4197.718558	4198.309738
64424	BTC	300	1782105000	64224.010000	64298.000000	64220.000000	64288.010000
64425	ETH	300	1782105000	1736.880000	1738.080000	1736.440000	1737.020000
65652	ETH	300	1782108300	1734.910000	1740.000000	1733.990000	1739.880000
65470	GOLD	300	1782108000	4210.900000	4214.831122	4210.123468	4214.078983
64792	GOLD	300	1782105600	4201.951964	4204.113521	4172.881312	4203.077689
64608	ETH	300	1782105300	1737.020000	1737.900000	1735.890000	1737.900000
64790	BTC	300	1782105600	64298.000000	64298.010000	64236.220000	64250.000000
64791	ETH	300	1782105600	1737.900000	1738.170000	1736.700000	1738.170000
65290	GOLD	300	1782107700	4210.500000	4211.579274	4208.800000	4210.546864
65288	BTC	300	1782107700	64206.450000	64247.750000	64204.270000	64247.750000
65289	ETH	300	1782107700	1735.930000	1736.850000	1735.920000	1736.850000
65472	ETH	300	1782108000	1736.850000	1737.210000	1734.910000	1734.910000
65833	ETH	300	1782108600	1739.870000	1740.210000	1737.910000	1738.030000
65651	BTC	300	1782108300	64180.000000	64326.000000	64150.000000	64318.760000
65653	GOLD	300	1782108300	4214.115291	4214.712929	4211.300000	4212.194652
65834	GOLD	300	1782108600	4211.300000	4214.000301	4209.621398	4209.854869
65832	BTC	300	1782108600	64318.760000	64318.760000	64224.530000	64224.830000
66009	GOLD	300	1782108900	4209.950781	4214.544340	4209.379688	4214.468952
69793	BTC	300	1782115200	64211.190000	64230.000000	64132.190000	64132.200000
69794	ETH	300	1782115200	1746.340000	1747.370000	1744.220000	1744.230000
69068	GOLD	300	1782114000	4215.699768	4217.648843	4211.833899	4217.233615
68885	GOLD	300	1782113700	4215.284251	4216.772339	4214.808507	4215.756537
68883	BTC	300	1782113700	64301.990000	64357.450000	64294.000000	64312.010000
68884	ETH	300	1782113700	1748.450000	1751.580000	1748.450000	1749.780000
69066	BTC	300	1782114000	64312.010000	64330.580000	64255.810000	64255.810000
68521	GOLD	300	1782113100	4217.747875	4219.679389	4216.683475	4218.588034
68522	BTC	300	1782113100	64240.000000	64293.990000	64240.000000	64262.560000
67631	GOLD	300	1782111600	4220.550856	4225.126537	4220.444746	4222.500000
67629	BTC	300	1782111600	63989.950000	64129.440000	63968.230000	64129.440000
67630	ETH	300	1782111600	1735.060000	1741.750000	1734.760000	1741.740000
67448	ETH	300	1782111300	1734.760000	1735.730000	1734.130000	1735.060000
67449	GOLD	300	1782111300	4220.561147	4222.669301	4219.321491	4220.600000
67447	BTC	300	1782111300	64002.000000	64033.100000	63980.020000	63989.950000
66911	BTC	300	1782110400	64063.530000	64076.340000	64010.290000	64010.290000
66011	BTC	300	1782108900	64224.830000	64233.790000	64124.010000	64155.990000
66010	ETH	300	1782108900	1738.030000	1739.970000	1737.690000	1737.990000
66192	BTC	300	1782109200	64156.000000	64164.000000	64091.930000	64144.720000
66194	ETH	300	1782109200	1737.990000	1738.910000	1735.690000	1738.020000
66193	GOLD	300	1782109200	4214.495483	4216.191921	4211.200000	4211.246051
66912	ETH	300	1782110400	1735.710000	1736.610000	1734.780000	1734.780000
66913	GOLD	300	1782110400	4215.307313	4216.326685	4213.289478	4215.686310
68523	ETH	300	1782113100	1745.400000	1749.030000	1745.110000	1748.110000
69067	ETH	300	1782114000	1749.760000	1751.300000	1747.810000	1747.810000
66373	BTC	300	1782109500	64144.720000	64150.590000	64094.000000	64124.000000
66374	ETH	300	1782109500	1737.910000	1738.690000	1736.200000	1736.520000
66375	GOLD	300	1782109500	4211.350499	4217.300000	4211.350499	4215.232419
67813	ETH	300	1782111900	1741.590000	1741.780000	1739.180000	1741.300000
67814	GOLD	300	1782111900	4222.552389	4223.727354	4214.848949	4215.400000
67812	BTC	300	1782111900	64129.440000	64138.050000	64058.400000	64106.000000
67272	GOLD	300	1782111000	4217.167025	4220.586423	4215.121652	4220.586423
67270	BTC	300	1782111000	63991.140000	64007.520000	63946.000000	64002.010000
67271	ETH	300	1782111000	1734.060000	1735.040000	1733.210000	1734.760000
68347	ETH	300	1782112800	1745.390000	1746.590000	1745.070000	1745.400000
66555	GOLD	300	1782109800	4215.308081	4218.550650	4213.315244	4218.463559
66554	BTC	300	1782109800	64124.000000	64155.990000	64072.000000	64072.000000
66556	ETH	300	1782109800	1736.140000	1736.290000	1734.010000	1735.040000
68345	GOLD	300	1782112800	4218.508503	4219.141038	4172.867446	4217.809747
67995	GOLD	300	1782112200	4215.404109	4219.304586	4215.326014	4216.062192
67994	BTC	300	1782112200	64105.990000	64250.000000	64102.000000	64212.010000
67996	ETH	300	1782112200	1741.300000	1746.450000	1741.300000	1744.390000
68346	BTC	300	1782112800	64228.110000	64300.000000	64228.110000	64240.010000
69976	ETH	300	1782115500	1744.230000	1748.990000	1743.570000	1748.180000
69975	BTC	300	1782115500	64132.200000	64295.990000	64106.700000	64276.000000
69615	GOLD	300	1782114900	4212.378312	4212.378312	4210.091622	4212.004378
69613	BTC	300	1782114900	64205.980000	64215.940000	64198.000000	64211.190000
69614	ETH	300	1782114900	1746.350000	1746.990000	1745.880000	1746.340000
67089	BTC	300	1782110700	64007.990000	64048.000000	64002.360000	64003.950000
67090	ETH	300	1782110700	1734.530000	1735.860000	1734.340000	1734.370000
67091	GOLD	300	1782110700	4215.627661	4218.429860	4215.433687	4217.260932
66735	GOLD	300	1782110100	4218.481582	4218.571896	4214.294636	4215.334202
66734	BTC	300	1782110100	64070.010000	64078.210000	64000.920000	64063.530000
66737	ETH	300	1782110100	1734.720000	1735.860000	1733.240000	1735.700000
68703	GOLD	300	1782113400	4218.484199	4218.967206	4214.963094	4215.216085
68701	BTC	300	1782113400	64262.560000	64385.360000	64246.130000	64299.620000
68702	ETH	300	1782113400	1748.120000	1751.000000	1747.350000	1748.450000
68170	GOLD	300	1782112500	4215.987243	4219.810324	4215.731058	4218.450709
68168	BTC	300	1782112500	64212.010000	64258.660000	64202.500000	64228.110000
68169	ETH	300	1782112500	1744.390000	1746.910000	1744.080000	1745.400000
70526	GOLD	300	1782116400	4210.214602	4210.546759	4207.061304	4207.999873
69432	BTC	300	1782114600	64267.990000	64270.000000	64167.780000	64203.980000
69251	GOLD	300	1782114300	4217.155408	4217.242531	4213.724546	4213.724546
69249	BTC	300	1782114300	64255.810000	64272.000000	64250.000000	64268.000000
69250	ETH	300	1782114300	1747.820000	1748.790000	1747.460000	1748.690000
69433	ETH	300	1782114600	1748.700000	1749.440000	1745.160000	1746.310000
69434	GOLD	300	1782114600	4213.764145	4214.024739	4210.091716	4212.427682
70524	BTC	300	1782116400	64267.430000	64350.570000	64262.010000	64276.000000
70525	ETH	300	1782116400	1748.310000	1750.730000	1747.170000	1748.310000
70891	GOLD	300	1782117000	4209.361969	4212.953668	4208.515933	4210.232281
70343	GOLD	300	1782116100	4209.741167	4212.652842	4208.832423	4210.111516
70341	BTC	300	1782116100	64313.600000	64314.000000	64254.000000	64267.420000
70160	GOLD	300	1782115800	4208.434827	4210.168083	4206.846166	4209.671644
70158	BTC	300	1782115800	64274.800000	64313.600000	64226.540000	64313.600000
70159	ETH	300	1782115800	1748.170000	1751.990000	1746.410000	1751.910000
69977	GOLD	300	1782115500	4209.586598	4210.347468	4206.782236	4208.436855
69795	GOLD	300	1782115200	4212.082798	4214.370250	4208.400000	4209.592086
70342	ETH	300	1782116100	1751.830000	1752.110000	1747.700000	1748.310000
70889	BTC	300	1782117000	64188.270000	64242.000000	64168.000000	64179.810000
71072	BTC	300	1782117300	64179.810000	64186.000000	64044.000000	64098.010000
70709	GOLD	300	1782116700	4208.020225	4209.871725	4207.096237	4209.284332
70707	BTC	300	1782116700	64276.000000	64276.010000	64188.260000	64188.260000
70708	ETH	300	1782116700	1748.310000	1748.330000	1746.210000	1746.390000
70890	ETH	300	1782117000	1746.390000	1747.990000	1745.730000	1746.680000
71074	GOLD	300	1782117300	4210.311003	4211.110008	4207.763069	4210.247683
71435	GOLD	300	1782117900	4208.905747	4211.781943	4208.691024	4210.237009
71073	ETH	300	1782117300	1746.820000	1747.450000	1743.930000	1745.440000
71253	ETH	300	1782117600	1745.430000	1749.480000	1745.430000	1749.480000
71252	BTC	300	1782117600	64098.010000	64266.000000	64090.000000	64262.010000
71254	GOLD	300	1782117600	4210.287175	4210.433001	4206.771733	4209.001310
71437	ETH	300	1782117900	1749.480000	1750.800000	1746.100000	1748.510000
71617	GOLD	300	1782118200	4210.150705	4211.586890	4208.598089	4210.700324
71434	BTC	300	1782117900	64262.010000	64290.000000	64106.000000	64172.010000
71615	BTC	300	1782118200	64172.000000	64181.230000	64130.000000	64130.000000
71616	ETH	300	1782118200	1748.500000	1748.990000	1747.430000	1747.430000
71797	BTC	300	1782118500	64130.000000	64166.000000	64130.000000	64165.990000
75335	BTC	300	1782369600	61732.010000	61764.590000	61680.000000	61764.590000
75336	ETH	300	1782369600	1650.920000	1655.230000	1649.750000	1654.510000
75337	GOLD	300	1782369600	3999.572535	3999.800000	3994.098701	3995.777186
73151	BTC	300	1782363600	61357.630000	61597.990000	61280.010000	61516.010000
72891	BTC	300	1782120300	64136.000000	64141.070000	64094.000000	64116.820000
73152	ETH	300	1782363600	1635.030000	1643.690000	1633.590000	1640.960000
72893	GOLD	300	1782120300	4223.145123	4225.227162	4172.667741	4224.538855
72527	GOLD	300	1782119700	4220.738687	4227.935082	4220.197076	4226.947550
72525	BTC	300	1782119700	64184.010000	64200.000000	64144.010000	64149.430000
72526	ETH	300	1782119700	1748.720000	1749.760000	1747.220000	1747.530000
72892	ETH	300	1782120300	1746.780000	1747.210000	1745.460000	1746.210000
73153	GOLD	300	1782363600	4008.044173	4012.607314	4007.884212	4011.216569
73330	GOLD	300	1782363900	4011.214492	4012.180289	4010.188529	4011.309346
73329	BTC	300	1782363900	61516.020000	61738.150000	61500.000000	61694.000000
73331	ETH	300	1782363900	1641.020000	1649.990000	1641.020000	1646.570000
73120	GOLD	300	1782363300	4008.100000	4008.328440	4006.987109	4008.031838
71799	GOLD	300	1782118500	4210.691224	4212.300000	4210.531360	4212.032050
71798	ETH	300	1782118500	1747.430000	1748.000000	1746.930000	1747.790000
73118	BTC	300	1782363300	61366.000000	61366.000000	61355.190000	61357.920000
73119	ETH	300	1782363300	1634.420000	1635.350000	1633.740000	1635.030000
71980	GOLD	300	1782118800	4212.069211	4215.300000	4210.008333	4213.721588
71979	BTC	300	1782118800	64165.990000	64248.570000	64148.150000	64248.560000
71982	ETH	300	1782118800	1747.810000	1749.830000	1747.140000	1749.830000
75154	GOLD	300	1782369300	3993.842660	4001.135969	3993.712341	3999.609593
75152	BTC	300	1782369300	61721.990000	61732.010000	61660.120000	61732.000000
75153	ETH	300	1782369300	1650.360000	1650.930000	1648.220000	1650.920000
74437	GOLD	300	1782368100	4001.854620	4003.214907	3999.113995	4001.138252
74435	BTC	300	1782368100	61715.820000	61800.320000	61688.640000	61731.520000
74436	ETH	300	1782368100	1647.390000	1650.670000	1647.220000	1648.660000
72162	GOLD	300	1782119100	4213.777469	4216.199382	4213.027469	4216.199382
72160	BTC	300	1782119100	64248.560000	64256.200000	64148.000000	64167.890000
72161	ETH	300	1782119100	1749.820000	1750.380000	1747.120000	1748.380000
74374	GOLD	300	1782367800	3999.000000	4001.922063	3998.743185	4001.771435
72709	GOLD	300	1782120000	4226.888460	4227.180627	4220.998396	4223.178836
72708	ETH	300	1782120000	1747.380000	1748.100000	1746.460000	1746.790000
72710	BTC	300	1782120000	64149.430000	64159.990000	64132.000000	64136.000000
74372	BTC	300	1782367800	61738.950000	61764.000000	61725.990000	61725.990000
74373	ETH	300	1782367800	1648.790000	1649.330000	1647.390000	1647.390000
73508	GOLD	300	1782364200	4011.275751	4014.227982	4009.629437	4013.302110
73506	BTC	300	1782364200	61693.990000	61707.360000	61520.480000	61647.600000
73507	ETH	300	1782364200	1646.570000	1648.180000	1642.440000	1645.320000
72342	GOLD	300	1782119400	4216.099576	4220.754873	4214.075968	4220.754873
72343	BTC	300	1782119400	64167.880000	64214.000000	64167.880000	64184.010000
72344	ETH	300	1782119400	1748.370000	1750.160000	1748.370000	1748.730000
73074	GOLD	300	1782120600	4224.508643	4226.033903	4224.459132	4225.353732
73073	BTC	300	1782120600	64116.820000	64118.340000	64094.000000	64116.390000
73075	ETH	300	1782120600	1746.210000	1746.510000	1745.620000	1746.180000
75781	BTC	300	1783311000	63294.000000	63345.830000	63293.990000	63345.010000
75782	ETH	300	1783311000	1779.500000	1781.340000	1779.500000	1781.000000
74972	GOLD	300	1782369000	3990.853336	3996.676368	3990.027646	3993.853493
74053	GOLD	300	1782365100	4013.173739	4013.947428	4004.728613	4008.264468
73871	GOLD	300	1782364800	4012.257911	4015.246331	4011.876626	4013.196452
73869	BTC	300	1782364800	61610.840000	61807.030000	61485.800000	61684.510000
73870	ETH	300	1782364800	1645.000000	1651.250000	1641.920000	1647.360000
74051	BTC	300	1782365100	61684.510000	61685.990000	61590.000000	61614.000000
74052	ETH	300	1782365100	1647.300000	1648.380000	1645.000000	1647.830000
74970	BTC	300	1782369000	61676.300000	61734.570000	61660.570000	61722.000000
74971	ETH	300	1782369000	1648.540000	1650.380000	1647.450000	1650.260000
73689	GOLD	300	1782364500	4013.387217	4013.387217	4007.900000	4012.252920
73690	BTC	300	1782364500	61647.600000	61715.300000	61566.970000	61610.840000
73688	ETH	300	1782364500	1645.380000	1648.390000	1641.740000	1645.030000
74611	GOLD	300	1782368400	4001.083540	4001.941437	3995.900000	3995.980086
74609	BTC	300	1782368400	61731.510000	61731.520000	61646.000000	61668.110000
74610	ETH	300	1782368400	1648.670000	1648.670000	1646.180000	1647.920000
74236	GOLD	300	1782365400	4008.252414	4009.655231	4006.449185	4006.482413
74234	BTC	300	1782365400	61614.000000	61658.980000	61573.400000	61644.130000
74235	ETH	300	1782365400	1647.820000	1651.820000	1646.730000	1651.210000
74790	GOLD	300	1782368700	3996.008218	3996.146910	3990.919841	3990.919841
74788	BTC	300	1782368700	61668.100000	61696.000000	61647.620000	61678.180000
74789	ETH	300	1782368700	1647.930000	1648.770000	1646.640000	1648.530000
75699	GOLD	300	1782370200	3995.938116	3997.600000	3993.025334	3997.534562
75697	BTC	300	1782370200	61770.000000	61795.680000	61768.000000	61780.000000
75698	ETH	300	1782370200	1653.020000	1654.070000	1652.960000	1653.010000
75516	BTC	300	1782369900	61764.590000	61785.280000	61738.000000	61770.010000
75517	ETH	300	1782369900	1654.510000	1655.490000	1652.750000	1652.970000
75518	GOLD	300	1782369900	3995.721260	3996.194980	3991.984544	3995.842449
76087	ETH	300	1783311600	1781.410000	1782.430000	1779.320000	1779.320000
76265	GOLD	300	1783311900	4175.587107	4187.555265	4174.487408	4175.735494
76088	GOLD	300	1783311600	4172.567791	4175.657107	4172.567791	4175.489433
75911	BTC	300	1783311300	63325.990000	63340.000000	63314.000000	63336.000000
76086	BTC	300	1783311600	63335.990000	63361.130000	63278.000000	63278.000000
75910	GOLD	300	1783311300	4174.800000	4175.251840	4172.515461	4172.515461
75783	GOLD	300	1783311000	4177.300000	4178.400000	4173.747002	4175.216301
75912	ETH	300	1783311300	1780.840000	1781.710000	1779.930000	1781.410000
76263	BTC	300	1783311900	63276.000000	63276.000000	63187.980000	63236.000000
76447	GOLD	300	1783312200	4175.705883	4175.705883	4172.080581	4173.192734
76446	ETH	300	1783312200	1778.160000	1779.990000	1776.340000	1778.460000
76264	ETH	300	1783311900	1779.320000	1779.320000	1776.470000	1778.160000
76445	BTC	300	1783312200	63235.990000	63305.570000	63199.300000	63265.430000
76806	GOLD	300	1783312800	4173.323906	4173.669334	4169.600000	4170.377548
76629	GOLD	300	1783312500	4174.100000	4175.256313	4172.612526	4173.348054
76627	BTC	300	1783312500	63262.010000	63342.010000	63254.000000	63342.000000
76628	ETH	300	1783312500	1778.250000	1781.680000	1777.970000	1781.480000
76805	ETH	300	1783312800	1781.480000	1784.660000	1781.200000	1782.540000
76804	BTC	300	1783312800	63342.010000	63392.000000	63314.000000	63314.000000
77608	BTC	300	1783402200	62939.470000	63139.660000	62939.470000	63125.030000
77609	ETH	300	1783402200	1761.410000	1768.070000	1761.410000	1767.990000
78153	ETH	300	1783403100	1769.010000	1770.340000	1768.570000	1769.690000
81189	BTC	300	1784516400	64827.200000	64881.290000	64822.240000	64874.000000
80829	GOLD	300	1784515800	4017.656542	4021.190163	4014.492109	4019.580602
78516	GOLD	300	1783403700	4133.441473	4135.215403	4131.426645	4132.400000
77248	GOLD	300	1783401600	4136.996299	4138.358280	4133.200000	4133.200000
77246	BTC	300	1783401600	62884.010000	63000.000000	62879.660000	62986.000000
77247	ETH	300	1783401600	1759.280000	1763.710000	1759.230000	1762.830000
78519	BTC	300	1783403700	63257.990000	63265.540000	63124.200000	63128.000000
78517	ETH	300	1783403700	1772.610000	1773.620000	1770.200000	1770.580000
77974	GOLD	300	1783402800	4139.772451	4139.778023	4131.616541	4133.737722
77972	BTC	300	1783402800	63167.990000	63175.990000	63146.830000	63168.030000
77973	ETH	300	1783402800	1769.990000	1770.000000	1768.510000	1769.000000
79192	ETH	300	1784081700	1871.190000	1871.280000	1867.700000	1868.180000
79191	GOLD	300	1784081700	4044.849211	4048.060881	4044.782626	4047.011752
79190	BTC	300	1784081700	64710.000000	64710.000000	64598.000000	64603.740000
80287	GOLD	300	1784514900	4012.150403	4013.430662	4010.682343	4012.275858
80285	BTC	300	1784514900	64780.000000	64820.000000	64728.000000	64750.000000
79735	GOLD	300	1784082600	4036.461569	4038.609364	4035.482399	4037.999829
79733	BTC	300	1784082600	64517.580000	64542.000000	64488.000000	64497.990000
79734	ETH	300	1784082600	1864.840000	1866.700000	1864.840000	1865.620000
77430	GOLD	300	1783401900	4133.177569	4136.564351	4132.208938	4133.140565
77428	BTC	300	1783401900	62985.990000	62985.990000	62879.700000	62939.470000
77429	ETH	300	1783401900	1762.910000	1762.910000	1759.280000	1761.410000
80286	ETH	300	1784514900	1875.430000	1876.840000	1872.990000	1874.510000
78699	GOLD	300	1783404000	4132.346050	4137.000000	4131.934283	4137.000000
78698	BTC	300	1783404000	63128.010000	63230.000000	63100.000000	63120.000000
77791	BTC	300	1783402500	63125.020000	63195.990000	63106.000000	63168.000000
77793	ETH	300	1783402500	1768.000000	1769.980000	1767.000000	1769.830000
77792	GOLD	300	1783402500	4137.349902	4139.774822	4136.260831	4139.679885
78700	ETH	300	1783404000	1770.580000	1774.050000	1770.440000	1771.620000
80099	GOLD	300	1784083200	4039.209555	4042.332465	4039.207407	4041.267456
80097	BTC	300	1784083200	64536.940000	64556.000000	64536.940000	64546.250000
77167	GOLD	300	1783313400	4170.886443	4172.703654	4170.656127	4171.984397
77165	BTC	300	1783313400	63328.010000	63343.230000	63312.000000	63336.000000
77166	ETH	300	1783313400	1781.690000	1782.540000	1780.880000	1781.950000
79917	GOLD	300	1784082900	4037.902973	4039.458587	4036.823363	4039.248531
79915	BTC	300	1784082900	64497.990000	64562.480000	64497.990000	64535.990000
79916	ETH	300	1784082900	1865.630000	1867.590000	1865.620000	1866.340000
77239	GOLD	300	1783401300	4136.200000	4137.000000	4136.119496	4137.000000
77237	BTC	300	1783401300	62896.010000	62896.010000	62884.000000	62884.010000
77238	ETH	300	1783401300	1760.050000	1760.050000	1759.050000	1759.290000
80098	ETH	300	1784083200	1866.340000	1866.750000	1865.330000	1865.370000
76985	GOLD	300	1783313100	4170.392094	4172.546457	4169.929444	4170.930991
76984	BTC	300	1783313100	63314.000000	63353.700000	63298.000000	63334.000000
76987	ETH	300	1783313100	1782.540000	1782.950000	1781.410000	1781.970000
79374	GOLD	300	1784082000	4046.922522	4048.599406	4041.837754	4043.175545
79372	BTC	300	1784082000	64600.180000	64613.290000	64566.940000	64570.830000
79373	ETH	300	1784082000	1868.170000	1869.120000	1867.000000	1867.380000
79553	GOLD	300	1784082300	4043.197930	4043.647067	4035.943142	4036.545285
79552	BTC	300	1784082300	64570.830000	64570.840000	64517.560000	64517.570000
79009	GOLD	300	1784081400	4042.909200	4046.248689	4039.900000	4044.834430
77610	GOLD	300	1783402200	4133.162098	4138.022926	4131.819046	4137.264223
78883	GOLD	300	1783404300	4137.072222	4137.963252	4136.687858	4137.660089
78881	BTC	300	1783404300	63120.000000	63120.000000	63067.320000	63091.060000
78882	ETH	300	1783404300	1771.610000	1771.620000	1770.210000	1770.310000
78336	GOLD	300	1783403400	4130.964734	4133.500000	4128.600000	4133.500000
78334	BTC	300	1783403400	63162.000000	63257.990000	63162.000000	63257.980000
78335	ETH	300	1783403400	1769.680000	1772.750000	1769.680000	1772.610000
78154	GOLD	300	1783403100	4133.720863	4138.150450	4130.600000	4130.973405
78152	BTC	300	1783403100	63168.030000	63193.780000	63145.990000	63162.000000
78908	BTC	300	1784081100	64654.000000	64710.000000	64654.000000	64708.660000
78909	ETH	300	1784081100	1868.180000	1870.520000	1868.170000	1870.430000
78910	GOLD	300	1784081100	4043.800000	4043.857592	4041.027005	4042.964768
79007	BTC	300	1784081400	64708.670000	64755.990000	64702.560000	64709.990000
79008	ETH	300	1784081400	1870.430000	1872.890000	1870.420000	1871.190000
79555	ETH	300	1784082300	1867.380000	1867.530000	1864.830000	1864.830000
80828	ETH	300	1784515800	1881.850000	1882.520000	1879.110000	1880.420000
81011	GOLD	300	1784516100	4019.544313	4030.700000	4019.260295	4029.320953
81009	BTC	300	1784516100	64871.990000	64890.000000	64827.190000	64827.200000
80230	GOLD	300	1784514600	4012.200000	4012.624297	4011.666943	4012.098823
80228	BTC	300	1784514600	64844.140000	64844.140000	64758.000000	64780.010000
80229	ETH	300	1784514600	1877.530000	1877.530000	1874.630000	1875.470000
81010	ETH	300	1784516100	1880.420000	1881.470000	1878.660000	1879.060000
80646	GOLD	300	1784515500	4015.707717	4018.761143	4014.763755	4017.623186
80644	BTC	300	1784515500	64836.000000	64963.320000	64836.000000	64912.010000
80463	GOLD	300	1784515200	4012.358612	4018.117995	4010.653965	4015.792791
80461	BTC	300	1784515200	64750.000000	64886.000000	64732.010000	64836.010000
80462	ETH	300	1784515200	1874.510000	1880.620000	1873.880000	1877.450000
80645	ETH	300	1784515500	1877.450000	1883.250000	1877.330000	1881.850000
81190	ETH	300	1784516400	1879.060000	1881.350000	1878.820000	1880.460000
80827	BTC	300	1784515800	64912.000000	64928.000000	64840.000000	64872.000000
81374	GOLD	300	1784516700	4027.630178	4029.043326	4025.869617	4027.333504
81372	BTC	300	1784516700	64874.000000	64875.220000	64796.000000	64814.000000
81191	GOLD	300	1784516400	4029.299814	4031.700000	4025.841052	4027.683398
81373	ETH	300	1784516700	1880.460000	1880.590000	1876.800000	1878.930000
81557	GOLD	300	1784517000	4027.399487	4027.399993	4025.208748	4025.682185
81555	BTC	300	1784517000	64814.010000	64850.240000	64776.000000	64843.960000
81556	ETH	300	1784517000	1878.930000	1880.830000	1877.420000	1880.150000
81737	GOLD	300	1784517300	4025.775022	4026.805203	4023.391609	4025.106057
81736	BTC	300	1784517300	64843.960000	64887.980000	64790.000000	64794.010000
81738	ETH	300	1784517300	1880.020000	1882.240000	1877.930000	1878.120000
81919	GOLD	300	1784517600	4025.021292	4028.794550	4024.891644	4028.569817
81917	BTC	300	1784517600	64792.000000	64792.000000	64670.000000	64728.010000
81918	ETH	300	1784517600	1877.910000	1877.910000	1872.060000	1874.100000
82100	GOLD	300	1784517900	4028.608470	4030.902179	4028.459129	4029.963588
85541	BTC	300	1784523600	64540.010000	64562.000000	64450.000000	64476.000000
85542	ETH	300	1784523600	1868.940000	1869.940000	1865.190000	1867.700000
82279	BTC	300	1784518200	64688.010000	64764.000000	64666.000000	64736.010000
82280	ETH	300	1784518200	1872.990000	1876.480000	1871.970000	1874.010000
82281	GOLD	300	1784518200	4030.022319	4031.832563	4029.418448	4030.100737
84817	GOLD	300	1784522400	4029.428878	4029.823839	4026.884359	4027.695874
84274	BTC	300	1784521500	64718.000000	64778.000000	64716.780000	64759.400000
84275	ETH	300	1784521500	1871.650000	1874.730000	1871.640000	1873.980000
84276	GOLD	300	1784521500	4026.315339	4028.304509	4026.226555	4027.942772
84815	BTC	300	1784522400	64768.200000	64768.200000	64704.010000	64733.980000
84816	ETH	300	1784522400	1876.600000	1877.100000	1874.210000	1875.890000
82462	GOLD	300	1784518500	4030.050924	4030.841315	4026.751994	4027.543031
82460	BTC	300	1784518500	64736.000000	64840.040000	64710.000000	64814.000000
82461	ETH	300	1784518500	1874.010000	1877.440000	1872.920000	1876.230000
83007	GOLD	300	1784519400	4030.367002	4032.409630	4029.047552	4031.558828
83005	BTC	300	1784519400	64880.000000	64901.280000	64853.400000	64853.410000
83006	ETH	300	1784519400	1879.080000	1880.630000	1878.210000	1878.220000
83731	BTC	300	1784520600	64740.000000	64792.000000	64698.260000	64705.370000
83732	ETH	300	1784520600	1874.500000	1875.940000	1872.000000	1872.440000
83733	GOLD	300	1784520600	4027.981715	4031.418724	4027.801256	4030.288223
83550	BTC	300	1784520300	64805.990000	64806.000000	64736.000000	64740.000000
83551	ETH	300	1784520300	1877.880000	1877.890000	1874.030000	1874.490000
83552	GOLD	300	1784520300	4029.576629	4029.692210	4027.554261	4027.917695
82642	GOLD	300	1784518800	4027.502631	4029.500000	4024.156068	4025.277214
82640	BTC	300	1784518800	64814.000000	64896.000000	64795.990000	64895.990000
82641	ETH	300	1784518800	1876.230000	1880.000000	1875.920000	1879.990000
85915	BTC	300	1786178700	65015.540000	65015.540000	64991.680000	64991.680000
85916	ETH	300	1786178700	1917.730000	1917.730000	1916.900000	1917.470000
83912	BTC	300	1784520900	64705.370000	64709.170000	64640.000000	64681.990000
83913	ETH	300	1784520900	1872.510000	1872.720000	1868.470000	1870.870000
83369	ETH	300	1784520000	1879.940000	1879.990000	1877.060000	1877.890000
83370	GOLD	300	1784520000	4031.395214	4032.419626	4029.288479	4029.641369
83368	BTC	300	1784520000	64869.800000	64869.990000	64802.000000	64805.990000
83914	GOLD	300	1784520900	4030.287082	4031.463603	4028.628906	4028.860901
85360	BTC	300	1784523300	64540.010000	64585.000000	64540.000000	64540.010000
85361	ETH	300	1784523300	1869.900000	1871.120000	1868.560000	1868.770000
85362	GOLD	300	1784523300	4028.010026	4028.075742	4023.627534	4023.989916
82825	ETH	300	1784519100	1880.100000	1880.770000	1877.640000	1879.090000
82823	GOLD	300	1784519100	4025.364648	4030.429900	4023.584933	4030.340991
82824	BTC	300	1784519100	64902.630000	64914.930000	64836.000000	64880.010000
86098	BTC	300	1786179000	64991.680000	64992.540000	64991.680000	64992.530000
86100	ETH	300	1786179000	1917.510000	1917.640000	1917.380000	1917.380000
82098	BTC	300	1784517900	64728.010000	64728.010000	64644.010000	64688.010000
82099	ETH	300	1784517900	1874.100000	1874.240000	1870.910000	1873.010000
83187	GOLD	300	1784519700	4031.570121	4032.352764	4031.072973	4031.418380
83185	BTC	300	1784519700	64853.400000	64869.800000	64785.100000	64869.790000
83186	ETH	300	1784519700	1878.220000	1879.740000	1876.500000	1879.740000
86099	GOLD	300	1786179000	4399.706092	4400.230913	4399.196980	4399.356880
84093	BTC	300	1784521200	64682.000000	64718.000000	64667.030000	64717.990000
84094	ETH	300	1784521200	1870.770000	1871.940000	1869.760000	1871.640000
84095	GOLD	300	1784521200	4028.770327	4029.505243	4026.160389	4026.298485
84635	GOLD	300	1784522100	4025.952164	4029.905901	4025.753963	4029.400271
84636	BTC	300	1784522100	64746.000000	64814.000000	64744.000000	64770.010000
84637	ETH	300	1784522100	1875.350000	1878.850000	1875.350000	1876.990000
84457	GOLD	300	1784521800	4027.897856	4029.353634	4026.044696	4026.044696
84455	BTC	300	1784521800	64759.410000	64787.990000	64721.200000	64746.000000
84456	ETH	300	1784521800	1873.980000	1877.300000	1872.450000	1875.360000
85735	GOLD	300	1786178400	4399.675312	4400.157951	4399.180910	4399.809379
85733	BTC	300	1786178400	65003.810000	65015.540000	65003.800000	65015.540000
84998	GOLD	300	1784522700	4027.701991	4028.939545	4026.666306	4028.629051
84997	BTC	300	1784522700	64733.980000	64733.980000	64636.590000	64650.030000
85000	ETH	300	1784522700	1875.890000	1877.300000	1873.650000	1873.650000
85734	ETH	300	1786178400	1917.290000	1917.730000	1917.050000	1917.720000
85180	GOLD	300	1784523000	4028.609248	4028.762492	4027.004855	4028.059419
85178	BTC	300	1784523000	64650.020000	64650.020000	64540.000000	64540.000000
85179	ETH	300	1784523000	1873.650000	1873.840000	1869.690000	1869.750000
85684	GOLD	300	1786178100	4399.700000	4400.208415	4399.343284	4399.706176
85682	BTC	300	1786178100	65003.800000	65003.810000	65003.800000	65003.810000
85683	ETH	300	1786178100	1916.980000	1917.300000	1916.970000	1917.300000
85543	GOLD	300	1784523600	4023.958635	4026.206263	4023.731788	4025.386767
86280	GOLD	300	1786179300	4399.419185	4400.330950	4399.022356	4399.661459
85917	GOLD	300	1786178700	4399.811020	4400.075673	4399.055669	4399.625084
86279	BTC	300	1786179300	64992.530000	64992.740000	64992.530000	64992.730000
86281	ETH	300	1786179300	1917.380000	1917.380000	1916.810000	1916.840000
\.


--
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inquiries (id, user_id, title, content, reply, status, replied_by, replied_at, is_reply_read, created_at) FROM stdin;
\.


--
-- Data for Name: inquiry_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inquiry_templates (id, title, content, created_at) FROM stdin;
\.


--
-- Data for Name: login_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_history (id, user_id, username, ip, user_agent, login_at) FROM stdin;
\.


--
-- Data for Name: maintenance_symbols; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_symbols (id, symbol, reason, started_at, created_by) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, receiver_id, title, content, is_read, deleted_for_user, created_at) FROM stdin;
\.


--
-- Data for Name: round_forced_directions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.round_forced_directions (id, symbol, duration, round_number, forced_direction, date_key, created_at) FROM stdin;
\.


--
-- Data for Name: round_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.round_results (id, symbol, duration, round_number, round_date, open_price, close_price, high_price, low_price, direction, created_at) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (key, value, updated_at) FROM stdin;
\.


--
-- Data for Name: transaction_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_requests (id, user_id, type, amount, status, bank_name, account_holder, account_number, sender_name, admin_note, processed_by, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (sid, sess, expire) FROM stdin;
e7YV4hodrOzyMgbzu-euYOO7L1Oe3o8M	{"cookie":{"originalMaxAge":604800000,"expires":"2026-07-13T04:22:42.742Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":"add61ae8-7f79-4adc-9b03-4a5547386a6d"}	2026-07-13 04:23:04
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, name, phone, birth_date, resident_number, region, bank_name, account_holder, account_number, balance, total_deposit, total_withdrawal, total_bet, total_win, role, branch_code, affiliate_id, is_active, approval_status, last_login_at, last_login_ip, auto_bet_enabled, auto_bet_multiplier, is_betting_blocked, forced_bet_direction, max_execution_enabled, pending_balance_adjustment, grade, always_pending_enabled, telegram_notify_enabled, created_at, withdrawal_password, is_withdrawal_locked) FROM stdin;
a6ad16b1-105c-46ca-b2d5-cd10c2dd489c	gemi488	488153	관리자	\N	\N	\N	\N	\N	\N	\N	100000000	0	0	0	0	admin	\N	\N	t	approved	\N	\N	f	10	f	\N	t	0	브론즈	f	f	2026-06-08 07:39:58.284759	\N	f
\.


--
-- Name: affiliate_commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.affiliate_commissions_id_seq', 1, false);


--
-- Name: affiliate_settlements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.affiliate_settlements_id_seq', 1, false);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- Name: bets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bets_id_seq', 1, false);


--
-- Name: blocked_ips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blocked_ips_id_seq', 1, false);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_id_seq', 1, false);


--
-- Name: forex_candles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.forex_candles_id_seq', 86446, true);


--
-- Name: inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inquiries_id_seq', 1, false);


--
-- Name: inquiry_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inquiry_templates_id_seq', 1, false);


--
-- Name: login_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.login_history_id_seq', 1, true);


--
-- Name: maintenance_symbols_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.maintenance_symbols_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: round_forced_directions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.round_forced_directions_id_seq', 1, false);


--
-- Name: round_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.round_results_id_seq', 1, false);


--
-- Name: transaction_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaction_requests_id_seq', 2, true);


--
-- Name: affiliate_commissions affiliate_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_pkey PRIMARY KEY (id);


--
-- Name: affiliate_settlements affiliate_settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliate_settlements
    ADD CONSTRAINT affiliate_settlements_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_pkey PRIMARY KEY (id);


--
-- Name: affiliates affiliates_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_referral_code_key UNIQUE (referral_code);


--
-- Name: affiliates affiliates_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affiliates
    ADD CONSTRAINT affiliates_username_key UNIQUE (username);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: bets bets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_pkey PRIMARY KEY (id);


--
-- Name: blocked_ips blocked_ips_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_ip_address_key UNIQUE (ip_address);


--
-- Name: blocked_ips blocked_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_pkey PRIMARY KEY (id);


--
-- Name: branches branches_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_code_key UNIQUE (code);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: forex_candles forex_candles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forex_candles
    ADD CONSTRAINT forex_candles_pkey PRIMARY KEY (id);


--
-- Name: forex_candles forex_candles_symbol_duration_time_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forex_candles
    ADD CONSTRAINT forex_candles_symbol_duration_time_key UNIQUE (symbol, duration, "time");


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: inquiry_templates inquiry_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiry_templates
    ADD CONSTRAINT inquiry_templates_pkey PRIMARY KEY (id);


--
-- Name: login_history login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);


--
-- Name: maintenance_symbols maintenance_symbols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_symbols
    ADD CONSTRAINT maintenance_symbols_pkey PRIMARY KEY (id);


--
-- Name: maintenance_symbols maintenance_symbols_symbol_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_symbols
    ADD CONSTRAINT maintenance_symbols_symbol_key UNIQUE (symbol);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: round_forced_directions round_forced_directions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.round_forced_directions
    ADD CONSTRAINT round_forced_directions_pkey PRIMARY KEY (id);


--
-- Name: round_results round_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.round_results
    ADD CONSTRAINT round_results_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: transaction_requests transaction_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_requests
    ADD CONSTRAINT transaction_requests_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: IDX_user_sessions_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_user_sessions_expire" ON public.user_sessions USING btree (expire);


--
-- Name: bets bets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: inquiries inquiries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: login_history login_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: transaction_requests transaction_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_requests
    ADD CONSTRAINT transaction_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict fefdCqOdMMkZtd2wZuC5j0qXmJ4mYgKpojKJrzOe4qAgfOqezEl24gGuntFw3iM

