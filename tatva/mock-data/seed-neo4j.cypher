// ============================================================
// TATVA — Neo4j Mock Data Seed Script
// Total: ~135 entities + ~180 relationships
// Run: cat mock-data/seed-neo4j.cypher | cypher-shell -u neo4j -p tatva2026
// ============================================================

// --- ACTORS: People (10 persons) ---
UNWIND [
  {id:'act-001', name:'Narendra Modi', aliases:['Modi','PM Modi','नरेंद्र मोदी','Indian Prime Minister'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'Prime Minister of India since 2014.', wikidata:'Q1058', nationality:'India', cred:0.95},
  {id:'act-002', name:'Xi Jinping', aliases:['习近平','President Xi','Chinese President'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'General Secretary of the CPC and President of China since 2012.', wikidata:'Q15031', nationality:'China', cred:0.94},
  {id:'act-003', name:'Joe Biden', aliases:['Biden','President Biden','US President'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'46th President of the United States.', wikidata:'Q6279', nationality:'United States', cred:0.94},
  {id:'act-004', name:'Vladimir Putin', aliases:['Putin','President Putin','Russian President','Путин'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'President of Russia.', wikidata:'Q7747', nationality:'Russia', cred:0.93},
  {id:'act-005', name:'Fumio Kishida', aliases:['Kishida','Japanese PM','岸田文雄'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'Prime Minister of Japan.', wikidata:'Q312907', nationality:'Japan', cred:0.92},
  {id:'act-006', name:'Anthony Albanese', aliases:['Albanese','Australian PM'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'Prime Minister of Australia.', wikidata:'Q2615222', nationality:'Australia', cred:0.92},
  {id:'act-007', name:'S. Jaishankar', aliases:['Jaishankar','EAM Jaishankar','Dr. S. Jaishankar'], type:'PERSON', subtype:'MINISTER', domain:'Geopolitics', desc:'External Affairs Minister of India.', wikidata:'Q7385825', nationality:'India', cred:0.93},
  {id:'act-008', name:'Rajnath Singh', aliases:['Rajnath','Defence Minister Rajnath Singh'], type:'PERSON', subtype:'MINISTER', domain:'Defense', desc:'Defence Minister of India.', wikidata:'Q927477', nationality:'India', cred:0.91},
  {id:'act-009', name:'Ajit Doval', aliases:['NSA Doval','Doval'], type:'PERSON', subtype:'OFFICIAL', domain:'Defense', desc:'National Security Advisor of India.', wikidata:'Q16255949', nationality:'India', cred:0.90},
  {id:'act-010', name:'General Manoj Pande', aliases:['COAS Pande','Gen Pande'], type:'PERSON', subtype:'MILITARY_LEADER', domain:'Defense', desc:'Chief of Army Staff of India.', wikidata:null, nationality:'India', cred:0.89}
] AS row
MERGE (a:Actor {id: row.id})
ON CREATE SET a.canonicalName = row.name, a.aliases = row.aliases, a.type = row.type, a.subtype = row.subtype, a.domain = row.domain, a.description = row.desc, a.wikidataQid = row.wikidata, a.nationality = row.nationality, a.credibilityScore = row.cred, a.createdAt = datetime(), a.lastUpdated = datetime()
ON MATCH SET a.lastUpdated = datetime();

// --- ACTORS: More People ---
UNWIND [
  {id:'act-038', name:'Emmanuel Macron', aliases:['Macron','French President'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'President of France.', wikidata:'Q3052772', nationality:'France', cred:0.92},
  {id:'act-039', name:'Volodymyr Zelenskyy', aliases:['Zelenskyy','Zelensky','Ukrainian President'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'President of Ukraine.', wikidata:'Q3429032', nationality:'Ukraine', cred:0.91},
  {id:'act-040', name:'Recep Tayyip Erdoğan', aliases:['Erdogan','Turkish President'], type:'PERSON', subtype:'HEAD_OF_STATE', domain:'Geopolitics', desc:'President of Turkey.', wikidata:'Q170581', nationality:'Turkey', cred:0.88},
  {id:'act-047', name:'Mukesh Ambani', aliases:['Ambani','मुकेश अंबानी'], type:'PERSON', subtype:'BUSINESS_LEADER', domain:'Economics', desc:'Chairman of Reliance Industries.', wikidata:'Q186714', nationality:'India', cred:0.87},
  {id:'act-048', name:'Gautam Adani', aliases:['Adani','गौतम अडानी'], type:'PERSON', subtype:'BUSINESS_LEADER', domain:'Economics', desc:'Chairman of Adani Group.', wikidata:'Q6555', nationality:'India', cred:0.82}
] AS row
MERGE (a:Actor {id: row.id})
ON CREATE SET a.canonicalName = row.name, a.aliases = row.aliases, a.type = row.type, a.subtype = row.subtype, a.domain = row.domain, a.description = row.desc, a.wikidataQid = row.wikidata, a.nationality = row.nationality, a.credibilityScore = row.cred, a.createdAt = datetime(), a.lastUpdated = datetime()
ON MATCH SET a.lastUpdated = datetime();

// --- ACTORS: Organizations (45 orgs) ---
UNWIND [
  {id:'act-011', name:'DRDO', aliases:['Defence Research and Development Organisation','रक्षा अनुसंधान एवं विकास संगठन'], type:'ORGANIZATION', subtype:'DEFENSE_RESEARCH', domain:'Defense', desc:'India premier defense R&D agency.', wikidata:'Q918330', nationality:'India', cred:0.93},
  {id:'act-012', name:'Indian Navy', aliases:['IN','भारतीय नौसेना'], type:'ORGANIZATION', subtype:'MILITARY', domain:'Defense', desc:'Naval arm of the Indian Armed Forces.', wikidata:'Q189280', nationality:'India', cred:0.94},
  {id:'act-013', name:'Indian Air Force', aliases:['IAF','भारतीय वायु सेना'], type:'ORGANIZATION', subtype:'MILITARY', domain:'Defense', desc:'Aerial warfare branch of the Indian Armed Forces.', wikidata:'Q161315', nationality:'India', cred:0.94},
  {id:'act-014', name:'Indian Army', aliases:['IA','भारतीय थलसेना'], type:'ORGANIZATION', subtype:'MILITARY', domain:'Defense', desc:'Land-based branch of the Indian Armed Forces.', wikidata:'Q189290', nationality:'India', cred:0.94},
  {id:'act-015', name:'RAW', aliases:['Research and Analysis Wing','R&AW'], type:'ORGANIZATION', subtype:'INTELLIGENCE_AGENCY', domain:'Defense', desc:'India external intelligence agency.', wikidata:'Q1076722', nationality:'India', cred:0.88},
  {id:'act-016', name:'PLA', aliases:['Peoples Liberation Army','Chinese Military','中国人民解放军'], type:'ORGANIZATION', subtype:'MILITARY', domain:'Defense', desc:'Armed forces of China.', wikidata:'Q42336', nationality:'China', cred:0.90},
  {id:'act-017', name:'ISRO', aliases:['Indian Space Research Organisation','भारतीय अंतरिक्ष अनुसंधान संगठन'], type:'ORGANIZATION', subtype:'SPACE_AGENCY', domain:'Technology', desc:'India space agency.', wikidata:'Q48807', nationality:'India', cred:0.95},
  {id:'act-018', name:'HAL', aliases:['Hindustan Aeronautics Limited'], type:'ORGANIZATION', subtype:'DEFENSE_INDUSTRY', domain:'Defense', desc:'India largest defense manufacturer.', wikidata:'Q1461794', nationality:'India', cred:0.91},
  {id:'act-019', name:'QUAD', aliases:['Quadrilateral Security Dialogue','Quad Alliance'], type:'ORGANIZATION', subtype:'ALLIANCE', domain:'Geopolitics', desc:'Strategic security dialogue between India, USA, Japan, and Australia.', wikidata:'Q7268547', nationality:null, cred:0.93},
  {id:'act-020', name:'BRICS', aliases:['BRICS+','Brazil-Russia-India-China-South Africa'], type:'ORGANIZATION', subtype:'ALLIANCE', domain:'Economics', desc:'Intergovernmental organization of major emerging economies.', wikidata:'Q192531', nationality:null, cred:0.91},
  {id:'act-021', name:'NATO', aliases:['North Atlantic Treaty Organization'], type:'ORGANIZATION', subtype:'ALLIANCE', domain:'Geopolitics', desc:'Western military alliance of 31 nations.', wikidata:'Q7184', nationality:null, cred:0.94},
  {id:'act-022', name:'AUKUS', aliases:['Australia-UK-US Pact'], type:'ORGANIZATION', subtype:'ALLIANCE', domain:'Defense', desc:'Trilateral security pact.', wikidata:'Q108466087', nationality:null, cred:0.92},
  {id:'act-023', name:'United Nations', aliases:['UN','संयुक्त राष्ट्र'], type:'ORGANIZATION', subtype:'INTERNATIONAL_ORG', domain:'Geopolitics', desc:'International organization for global peace and security.', wikidata:'Q1065', nationality:null, cred:0.95},
  {id:'act-024', name:'SCO', aliases:['Shanghai Cooperation Organisation'], type:'ORGANIZATION', subtype:'ALLIANCE', domain:'Geopolitics', desc:'Eurasian political and security alliance.', wikidata:'Q7855', nationality:null, cred:0.89},
  {id:'act-025', name:'Adani Group', aliases:['Adani','Adani Enterprises'], type:'ORGANIZATION', subtype:'CORPORATION', domain:'Economics', desc:'Indian multinational conglomerate.', wikidata:'Q356289', nationality:'India', cred:0.85},
  {id:'act-026', name:'Reliance Industries', aliases:['Reliance','RIL'], type:'ORGANIZATION', subtype:'CORPORATION', domain:'Economics', desc:'India largest private sector company.', wikidata:'Q1411693', nationality:'India', cred:0.88},
  {id:'act-027', name:'Tata Group', aliases:['Tata','Tata Sons'], type:'ORGANIZATION', subtype:'CORPORATION', domain:'Economics', desc:'Indian multinational conglomerate.', wikidata:'Q344464', nationality:'India', cred:0.90},
  {id:'act-028', name:'TSMC', aliases:['Taiwan Semiconductor Manufacturing Company'], type:'ORGANIZATION', subtype:'CORPORATION', domain:'Technology', desc:'World largest semiconductor foundry.', wikidata:'Q549167', nationality:'Taiwan', cred:0.93},
  {id:'act-029', name:'Ministry of Defence (India)', aliases:['MoD India','रक्षा मंत्रालय'], type:'ORGANIZATION', subtype:'GOVERNMENT', domain:'Defense', desc:'India defense ministry.', wikidata:'Q1978498', nationality:'India', cred:0.94},
  {id:'act-030', name:'MEA (India)', aliases:['Ministry of External Affairs','विदेश मंत्रालय'], type:'ORGANIZATION', subtype:'GOVERNMENT', domain:'Geopolitics', desc:'India foreign affairs ministry.', wikidata:'Q1992584', nationality:'India', cred:0.94},
  {id:'act-031', name:'BrahMos Aerospace', aliases:['BrahMos'], type:'ORGANIZATION', subtype:'DEFENSE_INDUSTRY', domain:'Defense', desc:'India-Russia JV producing BrahMos missiles.', wikidata:'Q894641', nationality:'India', cred:0.91},
  {id:'act-032', name:'Dassault Aviation', aliases:['Dassault'], type:'ORGANIZATION', subtype:'DEFENSE_INDUSTRY', domain:'Defense', desc:'French aircraft manufacturer.', wikidata:'Q235809', nationality:'France', cred:0.90},
  {id:'act-033', name:'Lockheed Martin', aliases:['LMT','Lockheed'], type:'ORGANIZATION', subtype:'DEFENSE_INDUSTRY', domain:'Defense', desc:'World largest defense contractor.', wikidata:'Q188660', nationality:'United States', cred:0.91},
  {id:'act-034', name:'Rosoboronexport', aliases:['Russian arms exporter'], type:'ORGANIZATION', subtype:'DEFENSE_INDUSTRY', domain:'Defense', desc:'Russia sole state defense export intermediary.', wikidata:'Q1641170', nationality:'Russia', cred:0.85},
  {id:'act-035', name:'RBI', aliases:['Reserve Bank of India','भारतीय रिज़र्व बैंक'], type:'ORGANIZATION', subtype:'CENTRAL_BANK', domain:'Economics', desc:'India central bank.', wikidata:'Q206347', nationality:'India', cred:0.95},
  {id:'act-036', name:'IMF', aliases:['International Monetary Fund'], type:'ORGANIZATION', subtype:'INTERNATIONAL_ORG', domain:'Economics', desc:'International financial institution.', wikidata:'Q7804', nationality:null, cred:0.93},
  {id:'act-037', name:'World Bank', aliases:['WB','IBRD'], type:'ORGANIZATION', subtype:'INTERNATIONAL_ORG', domain:'Economics', desc:'International financial institution providing development loans.', wikidata:'Q7164', nationality:null, cred:0.93},
  {id:'act-041', name:'NITI Aayog', aliases:['National Institution for Transforming India'], type:'ORGANIZATION', subtype:'GOVERNMENT', domain:'Economics', desc:'India premier policy think tank.', wikidata:'Q18601457', nationality:'India', cred:0.90},
  {id:'act-042', name:'NTPC', aliases:['National Thermal Power Corporation'], type:'ORGANIZATION', subtype:'ENERGY', domain:'Climate', desc:'India largest energy company.', wikidata:'Q1628866', nationality:'India', cred:0.88},
  {id:'act-043', name:'IAEA', aliases:['International Atomic Energy Agency'], type:'ORGANIZATION', subtype:'INTERNATIONAL_ORG', domain:'Technology', desc:'UN agency for peaceful nuclear energy.', wikidata:'Q7801', nationality:null, cred:0.94},
  {id:'act-044', name:'WHO', aliases:['World Health Organization'], type:'ORGANIZATION', subtype:'INTERNATIONAL_ORG', domain:'Society', desc:'UN health agency.', wikidata:'Q7817', nationality:null, cred:0.92},
  {id:'act-045', name:'ASEAN', aliases:['Association of Southeast Asian Nations'], type:'ORGANIZATION', subtype:'ALLIANCE', domain:'Geopolitics', desc:'Regional organization of 10 SE Asian countries.', wikidata:'Q7159', nationality:null, cred:0.91},
  {id:'act-046', name:'G20', aliases:['Group of Twenty'], type:'ORGANIZATION', subtype:'ALLIANCE', domain:'Economics', desc:'International forum for economic cooperation.', wikidata:'Q3674', nationality:null, cred:0.93},
  {id:'act-049', name:'Election Commission of India', aliases:['ECI','भारत निर्वाचन आयोग'], type:'ORGANIZATION', subtype:'GOVERNMENT', domain:'Society', desc:'Constitutional body for conducting elections.', wikidata:'Q1474954', nationality:'India', cred:0.93},
  {id:'act-050', name:'CERT-In', aliases:['Indian Computer Emergency Response Team'], type:'ORGANIZATION', subtype:'CYBER_AGENCY', domain:'Technology', desc:'India national cyber security agency.', wikidata:'Q5097277', nationality:'India', cred:0.90},
  {id:'act-051', name:'NSG', aliases:['Nuclear Suppliers Group'], type:'ORGANIZATION', subtype:'INTERNATIONAL_ORG', domain:'Technology', desc:'Nuclear supplier countries group.', wikidata:'Q575929', nationality:null, cred:0.91},
  {id:'act-052', name:'BEL', aliases:['Bharat Electronics Limited'], type:'ORGANIZATION', subtype:'DEFENSE_INDUSTRY', domain:'Defense', desc:'Indian defense electronics company.', wikidata:'Q4167929', nationality:'India', cred:0.90},
  {id:'act-053', name:'Infosys', aliases:['Infy'], type:'ORGANIZATION', subtype:'CORPORATION', domain:'Technology', desc:'Indian IT services company.', wikidata:'Q484855', nationality:'India', cred:0.89},
  {id:'act-054', name:'TCS', aliases:['Tata Consultancy Services'], type:'ORGANIZATION', subtype:'CORPORATION', domain:'Technology', desc:'India largest IT company.', wikidata:'Q662642', nationality:'India', cred:0.90},
  {id:'act-055', name:'OPEC', aliases:['Organization of the Petroleum Exporting Countries'], type:'ORGANIZATION', subtype:'ALLIANCE', domain:'Economics', desc:'Oil-producing nations organization.', wikidata:'Q7795', nationality:null, cred:0.92}
] AS row
MERGE (a:Actor {id: row.id})
ON CREATE SET a.canonicalName = row.name, a.aliases = row.aliases, a.type = row.type, a.subtype = row.subtype, a.domain = row.domain, a.description = row.desc, a.wikidataQid = row.wikidata, a.nationality = row.nationality, a.credibilityScore = row.cred, a.createdAt = datetime(), a.lastUpdated = datetime()
ON MATCH SET a.lastUpdated = datetime();

// --- EVENTS (35) ---
UNWIND [
  {id:'evt-001', name:'Galwan Valley Clash 2020', aliases:['Galwan incident','गलवान झड़प'], subtype:'MILITARY_CONFLICT', domain:'Defense', date:'2020-06-15', desc:'Deadly clash between Indian and Chinese troops at Galwan Valley.', cred:0.96},
  {id:'evt-002', name:'G20 New Delhi Summit 2023', aliases:['G20 India 2023','New Delhi Declaration'], subtype:'SUMMIT', domain:'Geopolitics', date:'2023-09-09', desc:'India hosted the G20 leaders summit.', cred:0.97},
  {id:'evt-003', name:'QUAD Leaders Summit Hiroshima 2023', aliases:['QUAD Summit 2023'], subtype:'SUMMIT', domain:'Geopolitics', date:'2023-05-20', desc:'QUAD leaders met in Hiroshima.', cred:0.94},
  {id:'evt-004', name:'India-France Rafale Deal', aliases:['Rafale deal','Rafale procurement'], subtype:'AGREEMENT', domain:'Defense', date:'2016-09-23', desc:'India signed 7.87B EUR deal for 36 Rafale jets.', cred:0.95},
  {id:'evt-005', name:'S-400 Delivery to India', aliases:['S-400 Triumf India','S-400 deal'], subtype:'AGREEMENT', domain:'Defense', date:'2021-12-01', desc:'Russia began delivering S-400 air defense systems to India.', cred:0.93},
  {id:'evt-006', name:'CHIPS and Science Act 2022', aliases:['CHIPS Act','US Semiconductor Act'], subtype:'LEGISLATION', domain:'Technology', date:'2022-08-09', desc:'US law providing $52.7B in semiconductor subsidies.', cred:0.96},
  {id:'evt-007', name:'Russia-Ukraine War', aliases:['Ukraine conflict','Russian invasion of Ukraine','रूस-यूक्रेन युद्ध'], subtype:'MILITARY_CONFLICT', domain:'Geopolitics', date:'2022-02-24', desc:'Russia full-scale invasion of Ukraine.', cred:0.97},
  {id:'evt-008', name:'Chandrayaan-3 Moon Landing', aliases:['Chandrayaan-3','India Moon landing'], subtype:'ACHIEVEMENT', domain:'Technology', date:'2023-08-23', desc:'India became the fourth country to land on the Moon.', cred:0.98},
  {id:'evt-009', name:'India-Canada Diplomatic Crisis 2023', aliases:['India-Canada row','Nijjar affair'], subtype:'DIPLOMATIC_CRISIS', domain:'Geopolitics', date:'2023-09-18', desc:'Canada accused India of involvement in Nijjar killing.', cred:0.88},
  {id:'evt-010', name:'INS Vikrant Commissioning', aliases:['IAC-1 commissioning','Vikrant aircraft carrier'], subtype:'MILITARY_MILESTONE', domain:'Defense', date:'2022-09-02', desc:'India commissioned first indigenous aircraft carrier.', cred:0.96},
  {id:'evt-011', name:'BrahMos Export to Philippines', aliases:['BrahMos Philippines deal'], subtype:'AGREEMENT', domain:'Defense', date:'2022-01-28', desc:'India first major defense export to Philippines.', cred:0.94},
  {id:'evt-012', name:'India-Middle East-Europe Corridor (IMEC)', aliases:['IMEC','India-Europe corridor'], subtype:'AGREEMENT', domain:'Economics', date:'2023-09-09', desc:'Economic corridor announced at G20 connecting India to Europe.', cred:0.91},
  {id:'evt-013', name:'Aditya-L1 Solar Mission', aliases:['Aditya L1','India solar mission'], subtype:'ACHIEVEMENT', domain:'Technology', date:'2023-09-02', desc:'ISRO launched India first solar observatory.', cred:0.95},
  {id:'evt-014', name:'India General Election 2024', aliases:['Lok Sabha Election 2024','Indian elections 2024'], subtype:'ELECTION', domain:'Society', date:'2024-04-19', desc:'World largest democratic exercise with 970M eligible voters.', cred:0.97},
  {id:'evt-015', name:'Malabar Naval Exercise 2024', aliases:['Malabar 2024','QUAD naval exercise'], subtype:'MILITARY_EXERCISE', domain:'Defense', date:'2024-10-15', desc:'Annual QUAD naval exercise.', cred:0.92},
  {id:'evt-016', name:'Paris Climate Agreement', aliases:['Paris Accord 2015','COP21'], subtype:'AGREEMENT', domain:'Climate', date:'2015-12-12', desc:'Landmark international climate accord.', cred:0.97},
  {id:'evt-017', name:'COP28 Dubai', aliases:['UN Climate Conference 2023'], subtype:'SUMMIT', domain:'Climate', date:'2023-11-30', desc:'28th UN Climate Change Conference.', cred:0.94},
  {id:'evt-018', name:'India-Australia ECTA', aliases:['India-Australia FTA','ECTA 2022'], subtype:'AGREEMENT', domain:'Economics', date:'2022-04-02', desc:'Economic Cooperation and Trade Agreement.', cred:0.92},
  {id:'evt-019', name:'Agnipath Scheme Launch', aliases:['Agnipath','Agniveer','अग्निपथ योजना'], subtype:'POLICY', domain:'Defense', date:'2022-06-14', desc:'India military recruitment reform.', cred:0.93},
  {id:'evt-020', name:'Taiwan Strait Crisis 2022', aliases:['Pelosi Taiwan visit crisis','Fourth Taiwan Strait Crisis'], subtype:'MILITARY_CRISIS', domain:'Geopolitics', date:'2022-08-02', desc:'Military tension after Pelosi visit to Taiwan.', cred:0.95},
  {id:'evt-021', name:'India Semiconductor Mission', aliases:['ISM','India Semiconductor Policy'], subtype:'POLICY', domain:'Technology', date:'2021-12-15', desc:'India $10B incentive plan for semiconductor manufacturing.', cred:0.90},
  {id:'evt-022', name:'SCO Summit Samarkand 2022', aliases:['SCO Samarkand'], subtype:'SUMMIT', domain:'Geopolitics', date:'2022-09-15', desc:'SCO summit where Modi told Putin this is not an era of war.', cred:0.94},
  {id:'evt-023', name:'India UPI International Expansion', aliases:['UPI global rollout','UPI Singapore'], subtype:'ACHIEVEMENT', domain:'Technology', date:'2023-02-01', desc:'India UPI payment system went international.', cred:0.91},
  {id:'evt-024', name:'Turkey-Syria Earthquake 2023', aliases:['Kahramanmaras earthquake'], subtype:'DISASTER', domain:'Climate', date:'2023-02-06', desc:'M7.8 earthquake killing 50000+ in Turkey and Syria.', cred:0.96},
  {id:'evt-025', name:'India Digital Personal Data Protection Act 2023', aliases:['DPDPA 2023','India data privacy law'], subtype:'LEGISLATION', domain:'Technology', date:'2023-08-11', desc:'India first comprehensive data protection law.', cred:0.94},
  {id:'evt-026', name:'BRICS Expansion 2024', aliases:['BRICS+ expansion','BRICS Johannesburg 2023'], subtype:'AGREEMENT', domain:'Geopolitics', date:'2024-01-01', desc:'BRICS expanded to include Egypt, Ethiopia, Iran, Saudi Arabia, UAE.', cred:0.93},
  {id:'evt-027', name:'Cyclone Biparjoy 2023', aliases:['Biparjoy','Arabian Sea cyclone 2023'], subtype:'DISASTER', domain:'Climate', date:'2023-06-15', desc:'Extremely severe cyclone that hit Gujarat coast.', cred:0.92},
  {id:'evt-028', name:'India Mars Orbiter Mission Success', aliases:['Mangalyaan','MOM','Mars mission India'], subtype:'ACHIEVEMENT', domain:'Technology', date:'2014-09-24', desc:'India became first Asian nation to reach Mars orbit.', cred:0.97},
  {id:'evt-029', name:'AUKUS Nuclear Submarine Deal', aliases:['AUKUS sub deal'], subtype:'AGREEMENT', domain:'Defense', date:'2021-09-15', desc:'Australia to acquire nuclear-powered submarines with US-UK tech.', cred:0.94},
  {id:'evt-030', name:'India-China LAC Disengagement 2024', aliases:['LAC buffer zones','India-China border deal 2024'], subtype:'AGREEMENT', domain:'Geopolitics', date:'2024-10-21', desc:'India and China agreed on patrolling arrangements at Depsang and Demchok.', cred:0.89},
  {id:'evt-031', name:'Indian Ocean Tsunami 2004', aliases:['Boxing Day tsunami','2004 tsunami'], subtype:'DISASTER', domain:'Climate', date:'2004-12-26', desc:'Massive M9.1 earthquake triggered tsunami killing 230000+.', cred:0.98},
  {id:'evt-032', name:'INS Arighat Commissioning', aliases:['SSBN Arighat','S4 submarine'], subtype:'MILITARY_MILESTONE', domain:'Defense', date:'2024-08-29', desc:'India commissioned second nuclear ballistic missile submarine.', cred:0.91},
  {id:'evt-033', name:'India-US iCET Initiative', aliases:['iCET','Initiative on Critical and Emerging Technology'], subtype:'AGREEMENT', domain:'Technology', date:'2023-01-31', desc:'India-US initiative on AI, quantum, semiconductors, space, defense tech.', cred:0.92},
  {id:'evt-034', name:'Tejas LCA Mark 2 First Flight', aliases:['Tejas Mk2','LCA Mark 2'], subtype:'MILITARY_MILESTONE', domain:'Defense', date:'2025-03-01', desc:'India indigenous medium-weight fighter completed first flight.', cred:0.85},
  {id:'evt-035', name:'India 5G Rollout', aliases:['5G India launch'], subtype:'ACHIEVEMENT', domain:'Technology', date:'2022-10-01', desc:'PM Modi launched 5G services in India.', cred:0.94}
] AS row
MERGE (e:Event {id: row.id})
ON CREATE SET e.canonicalName = row.name, e.aliases = row.aliases, e.subtype = row.subtype, e.domain = row.domain, e.date = date(row.date), e.description = row.desc, e.credibilityScore = row.cred, e.createdAt = datetime(), e.lastUpdated = datetime()
ON MATCH SET e.lastUpdated = datetime();

// --- LOCATIONS (45) ---
UNWIND [
  {id:'loc-001', name:'India', aliases:['Republic of India','भारत','Bharat','Hindustan'], subtype:'COUNTRY', domain:'Geopolitics', lat:20.5937, lng:78.9629, desc:'South Asian country. World largest democracy.', cred:0.99},
  {id:'loc-002', name:'China', aliases:['Peoples Republic of China','PRC','中国'], subtype:'COUNTRY', domain:'Geopolitics', lat:35.8617, lng:104.1954, desc:'East Asian country. Second-largest economy.', cred:0.99},
  {id:'loc-003', name:'United States', aliases:['USA','America','US'], subtype:'COUNTRY', domain:'Geopolitics', lat:37.0902, lng:-95.7129, desc:'World largest economy and military.', cred:0.99},
  {id:'loc-004', name:'Russia', aliases:['Russian Federation','Россия'], subtype:'COUNTRY', domain:'Geopolitics', lat:61.5240, lng:105.3188, desc:'India longstanding defense partner.', cred:0.99},
  {id:'loc-005', name:'Japan', aliases:['日本','Nippon'], subtype:'COUNTRY', domain:'Geopolitics', lat:36.2048, lng:138.2529, desc:'QUAD partner.', cred:0.99},
  {id:'loc-006', name:'Australia', aliases:['Commonwealth of Australia'], subtype:'COUNTRY', domain:'Geopolitics', lat:-25.2744, lng:133.7751, desc:'QUAD and AUKUS member.', cred:0.99},
  {id:'loc-007', name:'Pakistan', aliases:['Islamic Republic of Pakistan','پاکستان'], subtype:'COUNTRY', domain:'Geopolitics', lat:30.3753, lng:69.3451, desc:'India western neighbor.', cred:0.99},
  {id:'loc-008', name:'France', aliases:['French Republic'], subtype:'COUNTRY', domain:'Geopolitics', lat:46.2276, lng:2.2137, desc:'Strategic partner of India.', cred:0.99},
  {id:'loc-009', name:'Taiwan', aliases:['Republic of China','ROC','臺灣'], subtype:'DISPUTED_TERRITORY', domain:'Geopolitics', lat:23.6978, lng:120.9605, desc:'Self-governing island home to TSMC.', cred:0.95},
  {id:'loc-010', name:'Ukraine', aliases:['Україна'], subtype:'COUNTRY', domain:'Geopolitics', lat:48.3794, lng:31.1656, desc:'Eastern European country under Russian invasion.', cred:0.98},
  {id:'loc-011', name:'New Delhi', aliases:['Delhi','नई दिल्ली','National Capital'], subtype:'CITY', domain:'Geopolitics', lat:28.6139, lng:77.2090, desc:'Capital of India.', cred:0.99},
  {id:'loc-012', name:'Beijing', aliases:['北京','Peking'], subtype:'CITY', domain:'Geopolitics', lat:39.9042, lng:116.4074, desc:'Capital of China.', cred:0.99},
  {id:'loc-013', name:'Washington D.C.', aliases:['Washington','DC'], subtype:'CITY', domain:'Geopolitics', lat:38.9072, lng:-77.0369, desc:'Capital of the United States.', cred:0.99},
  {id:'loc-014', name:'Galwan Valley', aliases:['गलवान घाटी','Galwan river valley'], subtype:'DISPUTED_TERRITORY', domain:'Defense', lat:34.7467, lng:78.1784, desc:'Site of deadly 2020 India-China clash.', cred:0.94},
  {id:'loc-015', name:'Ladakh', aliases:['लद्दाख','Eastern Ladakh'], subtype:'REGION', domain:'Defense', lat:34.1526, lng:77.5771, desc:'High-altitude frontier region.', cred:0.97},
  {id:'loc-016', name:'South China Sea', aliases:['SCS','West Philippine Sea','南海'], subtype:'WATER_BODY', domain:'Defense', lat:12.0, lng:114.0, desc:'Strategic waterway with disputed claims.', cred:0.96},
  {id:'loc-017', name:'Taiwan Strait', aliases:['Formosa Strait','台灣海峽'], subtype:'WATER_BODY', domain:'Defense', lat:24.5, lng:119.0, desc:'One of worlds most dangerous flashpoints.', cred:0.95},
  {id:'loc-018', name:'Andaman and Nicobar Islands', aliases:['ANI','अंडमान और निकोबार'], subtype:'REGION', domain:'Defense', lat:11.7401, lng:92.6586, desc:'Strategic naval outpost near Malacca Strait.', cred:0.96},
  {id:'loc-019', name:'Arunachal Pradesh', aliases:['अरुणाचल प्रदेश','South Tibet (Chinese claim)'], subtype:'DISPUTED_TERRITORY', domain:'Defense', lat:28.2180, lng:94.7278, desc:'Indian state claimed by China.', cred:0.93},
  {id:'loc-020', name:'Aksai Chin', aliases:['अक्साई चिन'], subtype:'DISPUTED_TERRITORY', domain:'Defense', lat:35.15, lng:79.5, desc:'Region controlled by China, claimed by India.', cred:0.92},
  {id:'loc-021', name:'Indian Ocean', aliases:['Indian Ocean Region','IOR'], subtype:'WATER_BODY', domain:'Defense', lat:-10.0, lng:76.0, desc:'India primary strategic maritime space.', cred:0.97},
  {id:'loc-022', name:'Malacca Strait', aliases:['Strait of Malacca'], subtype:'WATER_BODY', domain:'Economics', lat:2.5, lng:101.0, desc:'~25% of global trade transits through.', cred:0.95},
  {id:'loc-023', name:'Djibouti', aliases:['Republic of Djibouti'], subtype:'COUNTRY', domain:'Defense', lat:11.5721, lng:43.1456, desc:'Hosts China first overseas military base.', cred:0.93},
  {id:'loc-024', name:'Sri Lanka', aliases:['Lanka','Ceylon','श्रीलंका'], subtype:'COUNTRY', domain:'Geopolitics', lat:7.8731, lng:80.7718, desc:'Island nation south of India.', cred:0.96},
  {id:'loc-025', name:'Maldives', aliases:['Republic of Maldives','मालदीव'], subtype:'COUNTRY', domain:'Geopolitics', lat:3.2028, lng:73.2207, desc:'Indian Ocean island nation.', cred:0.94},
  {id:'loc-026', name:'Bangladesh', aliases:['Peoples Republic of Bangladesh','বাংলাদেশ'], subtype:'COUNTRY', domain:'Geopolitics', lat:23.685, lng:90.3563, desc:'India eastern neighbor.', cred:0.97},
  {id:'loc-027', name:'Nepal', aliases:['Federal Democratic Republic of Nepal','नेपाल'], subtype:'COUNTRY', domain:'Geopolitics', lat:28.3949, lng:84.124, desc:'Himalayan country between India and China.', cred:0.96},
  {id:'loc-028', name:'Myanmar', aliases:['Burma','Republic of the Union of Myanmar'], subtype:'COUNTRY', domain:'Geopolitics', lat:21.9162, lng:95.956, desc:'SE Asian country bordering India northeast.', cred:0.93},
  {id:'loc-029', name:'UAE', aliases:['United Arab Emirates','Emirates','संयुक्त अरब अमीरात'], subtype:'COUNTRY', domain:'Economics', lat:23.4241, lng:53.8478, desc:'India third-largest trading partner.', cred:0.97},
  {id:'loc-030', name:'Saudi Arabia', aliases:['KSA','Kingdom of Saudi Arabia'], subtype:'COUNTRY', domain:'Economics', lat:23.8859, lng:45.0792, desc:'India major oil supplier.', cred:0.97},
  {id:'loc-031', name:'Hambantota Port', aliases:['Magampura Mahinda Rajapaksa Port'], subtype:'BASE', domain:'Defense', lat:6.1236, lng:81.1185, desc:'Sri Lankan port leased to China.', cred:0.88},
  {id:'loc-032', name:'Gwadar Port', aliases:['گوادر بندرگاہ'], subtype:'BASE', domain:'Defense', lat:25.1264, lng:62.3225, desc:'Pakistani port operated by China.', cred:0.89},
  {id:'loc-033', name:'Chabahar Port', aliases:['چابهار'], subtype:'BASE', domain:'Economics', lat:25.2919, lng:60.643, desc:'Iranian port developed by India.', cred:0.87},
  {id:'loc-034', name:'Mumbai', aliases:['Bombay','मुंबई'], subtype:'CITY', domain:'Economics', lat:19.076, lng:72.8777, desc:'India financial capital.', cred:0.99},
  {id:'loc-035', name:'Visakhapatnam', aliases:['Vizag','विशाखापत्तनम'], subtype:'CITY', domain:'Defense', lat:17.6868, lng:83.2185, desc:'Major naval base on east coast.', cred:0.95},
  {id:'loc-036', name:'Siachen Glacier', aliases:['सियाचिन ग्लेशियर'], subtype:'DISPUTED_TERRITORY', domain:'Defense', lat:35.4214, lng:77.1099, desc:'World highest battleground.', cred:0.94},
  {id:'loc-037', name:'Pangong Tso', aliases:['Pangong Lake','पैंगोंग त्सो'], subtype:'WATER_BODY', domain:'Defense', lat:33.7581, lng:78.6608, desc:'Lake in Ladakh spanning LAC.', cred:0.93},
  {id:'loc-038', name:'Bengaluru', aliases:['Bangalore','बेंगलुरु'], subtype:'CITY', domain:'Technology', lat:12.9716, lng:77.5946, desc:'India Silicon Valley.', cred:0.98},
  {id:'loc-039', name:'Sriharikota', aliases:['SHAR','SDSC'], subtype:'BASE', domain:'Technology', lat:13.7199, lng:80.2304, desc:'India primary spaceport.', cred:0.96},
  {id:'loc-040', name:'Arctic Region', aliases:['North Pole','Arctic Circle'], subtype:'REGION', domain:'Climate', lat:71.7069, lng:-42.6043, desc:'Rapidly warming polar region.', cred:0.93},
  {id:'loc-041', name:'Doklam', aliases:['डोकलाम','Donglang'], subtype:'DISPUTED_TERRITORY', domain:'Defense', lat:27.3528, lng:89.026, desc:'Tri-junction area between India, China, and Bhutan.', cred:0.92},
  {id:'loc-042', name:'Cochin Shipyard', aliases:['CSL','Kochi shipyard'], subtype:'BASE', domain:'Defense', lat:9.9312, lng:76.2673, desc:'India largest shipbuilding facility.', cred:0.93},
  {id:'loc-043', name:'Karwar Naval Base', aliases:['INS Kadamba','Project Seabird'], subtype:'BASE', domain:'Defense', lat:14.8008, lng:74.124, desc:'India largest naval base on western coast.', cred:0.92},
  {id:'loc-044', name:'Sundarbans', aliases:['सुंदरवन'], subtype:'REGION', domain:'Climate', lat:21.9497, lng:89.1833, desc:'World largest mangrove forest.', cred:0.95},
  {id:'loc-045', name:'Leh', aliases:['लेह'], subtype:'CITY', domain:'Defense', lat:34.1526, lng:77.5771, desc:'Capital of Ladakh UT.', cred:0.95}
] AS row
MERGE (l:Location {id: row.id})
ON CREATE SET l.canonicalName = row.name, l.aliases = row.aliases, l.subtype = row.subtype, l.domain = row.domain, l.latitude = row.lat, l.longitude = row.lng, l.description = row.desc, l.credibilityScore = row.cred, l.createdAt = datetime(), l.lastUpdated = datetime()
ON MATCH SET l.lastUpdated = datetime();

// --- LINK ENTITIES TO DOMAIN NODES ---
MATCH (d:Domain {name: 'Geopolitics'})
MATCH (n) WHERE n.domain = 'Geopolitics' AND (n:Actor OR n:Event OR n:Location)
MERGE (n)-[:BELONGS_TO]->(d);

MATCH (d:Domain {name: 'Economics'})
MATCH (n) WHERE n.domain = 'Economics' AND (n:Actor OR n:Event OR n:Location)
MERGE (n)-[:BELONGS_TO]->(d);

MATCH (d:Domain {name: 'Defense'})
MATCH (n) WHERE n.domain = 'Defense' AND (n:Actor OR n:Event OR n:Location)
MERGE (n)-[:BELONGS_TO]->(d);

MATCH (d:Domain {name: 'Technology'})
MATCH (n) WHERE n.domain = 'Technology' AND (n:Actor OR n:Event OR n:Location)
MERGE (n)-[:BELONGS_TO]->(d);

MATCH (d:Domain {name: 'Climate'})
MATCH (n) WHERE n.domain = 'Climate' AND (n:Actor OR n:Event OR n:Location)
MERGE (n)-[:BELONGS_TO]->(d);

MATCH (d:Domain {name: 'Society'})
MATCH (n) WHERE n.domain = 'Society' AND (n:Actor OR n:Event OR n:Location)
MERGE (n)-[:BELONGS_TO]->(d);

// --- RELATIONSHIPS: Geopolitics (40) ---
MATCH (a {id:'act-001'}), (b {id:'loc-001'}) MERGE (a)-[:LEADS {validFrom: date('2014-05-26'), domain:'Geopolitics', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-002'}), (b {id:'loc-002'}) MERGE (a)-[:LEADS {validFrom: date('2012-11-15'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-003'}), (b {id:'loc-003'}) MERGE (a)-[:LEADS {validFrom: date('2021-01-20'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-004'}), (b {id:'loc-004'}) MERGE (a)-[:LEADS {validFrom: date('2012-05-07'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-003'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('2000-01-01'), domain:'Geopolitics', credibilityScore:0.94}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-004'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('1971-08-09'), domain:'Geopolitics', credibilityScore:0.93}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-002'}) MERGE (a)-[:COMPETES_WITH {validFrom: date('1962-10-20'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-005'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('2006-12-01'), domain:'Geopolitics', credibilityScore:0.93}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'act-019'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2007-01-01'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-003'}), (b {id:'act-019'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2007-01-01'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-005'}), (b {id:'act-019'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2007-01-01'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-006'}), (b {id:'act-019'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2007-01-01'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'act-020'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2006-01-01'), domain:'Geopolitics', credibilityScore:0.94}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'act-019'}) MERGE (a)-[:OPPOSES {validFrom: date('2017-01-01'), domain:'Geopolitics', credibilityScore:0.89}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-008'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('1998-01-26'), domain:'Geopolitics', credibilityScore:0.93}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-006'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('2014-09-05'), domain:'Geopolitics', credibilityScore:0.92}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'act-024'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2017-06-09'), domain:'Geopolitics', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-007'}), (b {id:'act-030'}) MERGE (a)-[:LEADS {validFrom: date('2019-05-31'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'loc-009'}) MERGE (a)-[:THREATENS {validFrom: date('1949-01-01'), domain:'Geopolitics', credibilityScore:0.94}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-007'}) MERGE (a)-[:BORDERS {domain:'Geopolitics', credibilityScore:0.99}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-002'}) MERGE (a)-[:BORDERS {domain:'Geopolitics', credibilityScore:0.99}]->(b);
MATCH (a {id:'act-001'}), (b {id:'evt-002'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-09-09'), domain:'Geopolitics', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-001'}), (b {id:'evt-022'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2022-09-15'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-024'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('1948-01-01'), domain:'Geopolitics', credibilityScore:0.88}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'loc-024'}) MERGE (a)-[:COMPETES_WITH {validFrom: date('2010-01-01'), domain:'Geopolitics', credibilityScore:0.86}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-025'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('1965-01-01'), domain:'Geopolitics', credibilityScore:0.90}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'loc-025'}) MERGE (a)-[:COMPETES_WITH {validFrom: date('2012-01-01'), domain:'Geopolitics', credibilityScore:0.85}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-026'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('1971-12-16'), domain:'Geopolitics', credibilityScore:0.91}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-027'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('1950-07-31'), domain:'Geopolitics', credibilityScore:0.88}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'loc-027'}) MERGE (a)-[:COMPETES_WITH {validFrom: date('2015-01-01'), domain:'Geopolitics', credibilityScore:0.84}]->(b);
MATCH (a {id:'act-005'}), (b {id:'loc-005'}) MERGE (a)-[:LEADS {validFrom: date('2021-10-04'), domain:'Geopolitics', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-006'}), (b {id:'loc-006'}) MERGE (a)-[:LEADS {validFrom: date('2022-05-23'), domain:'Geopolitics', credibilityScore:0.94}]->(b);
MATCH (a {id:'loc-004'}), (b {id:'act-024'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2001-06-15'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'act-024'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2001-06-15'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-004'}), (b {id:'act-020'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2006-01-01'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'act-020'}) MERGE (a)-[:MEMBER_OF {validFrom: date('2006-01-01'), domain:'Geopolitics', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-004'}), (b {id:'loc-010'}) MERGE (a)-[:THREATENS {validFrom: date('2022-02-24'), domain:'Geopolitics', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-011'}), (b {id:'evt-009'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-09-18'), domain:'Geopolitics', credibilityScore:0.86}]->(b);
MATCH (a {id:'act-012'}), (b {id:'evt-007'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2022-02-24'), domain:'Geopolitics', credibilityScore:0.96}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-028'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('2017-06-01'), domain:'Geopolitics', credibilityScore:0.82}]->(b);

// --- RELATIONSHIPS: Defense (40) ---
MATCH (a {id:'act-011'}), (b {id:'loc-011'}) MERGE (a)-[:LOCATED_IN {domain:'Defense', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-014'}), (b {id:'loc-015'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('2020-06-01'), domain:'Defense', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-016'}), (b {id:'loc-015'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('2020-05-01'), domain:'Defense', credibilityScore:0.92}]->(b);
MATCH (a {id:'act-014'}), (b {id:'evt-001'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2020-06-15'), domain:'Defense', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-016'}), (b {id:'evt-001'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2020-06-15'), domain:'Defense', credibilityScore:0.95}]->(b);
MATCH (a {id:'evt-001'}), (b {id:'loc-014'}) MERGE (a)-[:LOCATED_IN {domain:'Defense', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-008'}), (b {id:'act-029'}) MERGE (a)-[:LEADS {validFrom: date('2019-05-31'), domain:'Defense', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-013'}), (b {id:'evt-004'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2016-09-23'), domain:'Defense', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-032'}), (b {id:'evt-004'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2016-09-23'), domain:'Defense', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-034'}), (b {id:'evt-005'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2021-12-01'), domain:'Defense', credibilityScore:0.92}]->(b);
MATCH (a {id:'act-012'}), (b {id:'evt-010'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2022-09-02'), domain:'Defense', credibilityScore:0.96}]->(b);
MATCH (a {id:'evt-010'}), (b {id:'loc-042'}) MERGE (a)-[:LOCATED_IN {domain:'Defense', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-031'}), (b {id:'evt-011'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2022-01-28'), domain:'Defense', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-018'}), (b {id:'loc-038'}) MERGE (a)-[:LOCATED_IN {domain:'Defense', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-012'}), (b {id:'evt-015'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2024-10-15'), domain:'Defense', credibilityScore:0.92}]->(b);
MATCH (a {id:'act-012'}), (b {id:'loc-035'}) MERGE (a)-[:LOCATED_IN {domain:'Defense', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-012'}), (b {id:'evt-032'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2024-08-29'), domain:'Defense', credibilityScore:0.91}]->(b);
MATCH (a {id:'act-009'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {validFrom: date('2014-05-30'), domain:'Defense', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-015'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {validFrom: date('1968-09-21'), domain:'Defense', credibilityScore:0.92}]->(b);
MATCH (a {id:'act-014'}), (b {id:'evt-019'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2022-06-14'), domain:'Defense', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-014'}), (b {id:'loc-036'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('1984-04-13'), domain:'Defense', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-011'}), (b {id:'evt-034'}) MERGE (a)-[:MANUFACTURES {validFrom: date('2025-03-01'), domain:'Defense', credibilityScore:0.85}]->(b);
MATCH (a {id:'act-052'}), (b {id:'loc-038'}) MERGE (a)-[:LOCATED_IN {domain:'Defense', credibilityScore:0.94}]->(b);
MATCH (a {id:'loc-004'}), (b {id:'loc-001'}) MERGE (a)-[:SUPPLIES_TO {validFrom: date('1960-01-01'), domain:'Defense', credibilityScore:0.94}]->(b);
MATCH (a {id:'loc-008'}), (b {id:'loc-001'}) MERGE (a)-[:SUPPLIES_TO {validFrom: date('2016-09-23'), domain:'Defense', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-016'}), (b {id:'loc-016'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('2010-01-01'), domain:'Defense', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-012'}), (b {id:'loc-018'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('2001-10-01'), domain:'Defense', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-012'}), (b {id:'loc-043'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('2005-01-01'), domain:'Defense', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-010'}), (b {id:'act-014'}) MERGE (a)-[:LEADS {validFrom: date('2022-04-30'), domain:'Defense', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-033'}), (b {id:'loc-003'}) MERGE (a)-[:LOCATED_IN {domain:'Defense', credibilityScore:0.96}]->(b);
MATCH (a {id:'loc-003'}), (b {id:'loc-001'}) MERGE (a)-[:SUPPLIES_TO {validFrom: date('2008-01-01'), domain:'Defense', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-022'}), (b {id:'loc-006'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('2021-09-15'), domain:'Defense', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-013'}), (b {id:'loc-015'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('2020-09-01'), domain:'Defense', credibilityScore:0.90}]->(b);
MATCH (a {id:'act-018'}), (b {id:'evt-034'}) MERGE (a)-[:MANUFACTURES {validFrom: date('2020-01-01'), domain:'Defense', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-027'}), (b {id:'evt-030'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2022-10-01'), domain:'Defense', credibilityScore:0.91}]->(b);
MATCH (a {id:'act-016'}), (b {id:'loc-023'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('2017-08-01'), domain:'Defense', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-012'}), (b {id:'loc-021'}) MERGE (a)-[:OPERATES_IN {validFrom: date('2008-10-01'), domain:'Defense', credibilityScore:0.92}]->(b);
MATCH (a {id:'act-016'}), (b {id:'loc-019'}) MERGE (a)-[:THREATENS {validFrom: date('1962-10-20'), domain:'Defense', credibilityScore:0.91}]->(b);
MATCH (a {id:'act-021'}), (b {id:'loc-010'}) MERGE (a)-[:SUPPORTS {validFrom: date('2022-02-24'), domain:'Defense', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-014'}), (b {id:'loc-037'}) MERGE (a)-[:DEPLOYS_IN {validFrom: date('2020-06-01'), domain:'Defense', credibilityScore:0.90}]->(b);

// --- RELATIONSHIPS: Economics (27) ---
MATCH (a {id:'loc-001'}), (b {id:'loc-003'}) MERGE (a)-[:TRADES_WITH {validFrom: date('2000-01-01'), domain:'Economics', credibilityScore:0.94}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-002'}) MERGE (a)-[:TRADES_WITH {validFrom: date('1950-01-01'), domain:'Economics', credibilityScore:0.93}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-029'}) MERGE (a)-[:TRADES_WITH {validFrom: date('1970-01-01'), domain:'Economics', credibilityScore:0.93}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-030'}) MERGE (a)-[:TRADES_WITH {validFrom: date('1970-01-01'), domain:'Economics', credibilityScore:0.92}]->(b);
MATCH (a {id:'loc-003'}), (b {id:'loc-004'}) MERGE (a)-[:SANCTIONS {validFrom: date('2022-02-24'), domain:'Economics', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-047'}), (b {id:'act-026'}) MERGE (a)-[:LEADS {validFrom: date('2002-07-01'), domain:'Economics', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-048'}), (b {id:'act-025'}) MERGE (a)-[:LEADS {validFrom: date('1988-01-01'), domain:'Economics', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-025'}), (b {id:'loc-006'}) MERGE (a)-[:TRADES_WITH {validFrom: date('2020-01-01'), domain:'Economics', credibilityScore:0.85}]->(b);
MATCH (a {id:'act-035'}), (b {id:'loc-034'}) MERGE (a)-[:LOCATED_IN {domain:'Economics', credibilityScore:0.97}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'act-046'}) MERGE (a)-[:MEMBER_OF {validFrom: date('1999-09-26'), domain:'Economics', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-001'}), (b {id:'evt-012'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-09-09'), domain:'Economics', credibilityScore:0.93}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-006'}) MERGE (a)-[:TRADES_WITH {validFrom: date('2022-04-02'), domain:'Economics', credibilityScore:0.92}]->(b);
MATCH (a {id:'act-027'}), (b {id:'loc-001'}) MERGE (a)-[:LOCATED_IN {domain:'Economics', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-026'}), (b {id:'loc-034'}) MERGE (a)-[:LOCATED_IN {domain:'Economics', credibilityScore:0.96}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-033'}) MERGE (a)-[:OPERATES_IN {validFrom: date('2003-01-01'), domain:'Economics', credibilityScore:0.88}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'loc-032'}) MERGE (a)-[:OPERATES_IN {validFrom: date('2013-01-01'), domain:'Economics', credibilityScore:0.90}]->(b);
MATCH (a {id:'loc-002'}), (b {id:'loc-031'}) MERGE (a)-[:OPERATES_IN {validFrom: date('2017-12-09'), domain:'Economics', credibilityScore:0.89}]->(b);
MATCH (a {id:'act-041'}), (b {id:'loc-011'}) MERGE (a)-[:LOCATED_IN {domain:'Economics', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-036'}), (b {id:'loc-001'}) MERGE (a)-[:SUPPORTS {validFrom: date('1945-12-27'), domain:'Economics', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-055'}), (b {id:'loc-030'}) MERGE (a)-[:LOCATED_IN {domain:'Economics', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-037'}), (b {id:'loc-001'}) MERGE (a)-[:SUPPORTS {validFrom: date('1945-01-01'), domain:'Economics', credibilityScore:0.93}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-005'}) MERGE (a)-[:TRADES_WITH {validFrom: date('1958-01-01'), domain:'Economics', credibilityScore:0.92}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-004'}) MERGE (a)-[:TRADES_WITH {validFrom: date('1960-01-01'), domain:'Economics', credibilityScore:0.91}]->(b);
MATCH (a {id:'act-025'}), (b {id:'loc-034'}) MERGE (a)-[:LOCATED_IN {domain:'Economics', credibilityScore:0.90}]->(b);
MATCH (a {id:'act-053'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {validFrom: date('1981-07-07'), domain:'Economics', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-054'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {validFrom: date('1968-04-01'), domain:'Economics', credibilityScore:0.94}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-008'}) MERGE (a)-[:TRADES_WITH {validFrom: date('1998-01-26'), domain:'Economics', credibilityScore:0.90}]->(b);

// --- RELATIONSHIPS: Technology (23) ---
MATCH (a {id:'act-017'}), (b {id:'evt-008'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-08-23'), domain:'Technology', credibilityScore:0.98}]->(b);
MATCH (a {id:'act-017'}), (b {id:'evt-013'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-09-02'), domain:'Technology', credibilityScore:0.96}]->(b);
MATCH (a {id:'act-017'}), (b {id:'evt-028'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2014-09-24'), domain:'Technology', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-017'}), (b {id:'loc-039'}) MERGE (a)-[:LOCATED_IN {domain:'Technology', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-028'}), (b {id:'loc-009'}) MERGE (a)-[:LOCATED_IN {domain:'Technology', credibilityScore:0.97}]->(b);
MATCH (a {id:'evt-006'}), (b {id:'act-028'}) MERGE (a)-[:AFFECTS {validFrom: date('2022-08-09'), domain:'Technology', credibilityScore:0.94}]->(b);
MATCH (a {id:'evt-006'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2022-08-09'), domain:'Technology', credibilityScore:0.87}]->(b);
MATCH (a {id:'act-027'}), (b {id:'evt-021'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-06-01'), domain:'Technology', credibilityScore:0.89}]->(b);
MATCH (a {id:'act-053'}), (b {id:'loc-038'}) MERGE (a)-[:LOCATED_IN {domain:'Technology', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-054'}), (b {id:'loc-034'}) MERGE (a)-[:LOCATED_IN {domain:'Technology', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-050'}), (b {id:'loc-011'}) MERGE (a)-[:LOCATED_IN {domain:'Technology', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'evt-025'}) MERGE (a)-[:SIGNED_BY {validFrom: date('2023-08-11'), domain:'Technology', credibilityScore:0.95}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'evt-033'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-01-31'), domain:'Technology', credibilityScore:0.93}]->(b);
MATCH (a {id:'loc-003'}), (b {id:'evt-033'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-01-31'), domain:'Technology', credibilityScore:0.93}]->(b);
MATCH (a {id:'evt-023'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2023-02-01'), domain:'Technology', credibilityScore:0.91}]->(b);
MATCH (a {id:'act-043'}), (b {id:'act-051'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('1974-01-01'), domain:'Technology', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-026'}), (b {id:'evt-035'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2022-10-01'), domain:'Technology', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-017'}), (b {id:'loc-038'}) MERGE (a)-[:LOCATED_IN {domain:'Technology', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-050'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {validFrom: date('2004-01-27'), domain:'Technology', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-028'}), (b {id:'evt-006'}) MERGE (a)-[:AFFECTS {validFrom: date('2022-08-09'), domain:'Technology', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-053'}), (b {id:'loc-003'}) MERGE (a)-[:OPERATES_IN {validFrom: date('1987-04-01'), domain:'Technology', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-054'}), (b {id:'loc-003'}) MERGE (a)-[:OPERATES_IN {validFrom: date('1979-01-01'), domain:'Technology', credibilityScore:0.94}]->(b);
MATCH (a {id:'evt-021'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2021-12-15'), domain:'Technology', credibilityScore:0.90}]->(b);

// --- RELATIONSHIPS: Climate (15) ---
MATCH (a {id:'loc-001'}), (b {id:'evt-016'}) MERGE (a)-[:SIGNED_BY {validFrom: date('2016-10-02'), domain:'Climate', credibilityScore:0.97}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'evt-017'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-11-30'), domain:'Climate', credibilityScore:0.95}]->(b);
MATCH (a {id:'evt-024'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2023-02-06'), domain:'Climate', credibilityScore:0.94}]->(b);
MATCH (a {id:'evt-027'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2023-06-15'), domain:'Climate', credibilityScore:0.93}]->(b);
MATCH (a {id:'evt-031'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2004-12-26'), domain:'Climate', credibilityScore:0.97}]->(b);
MATCH (a {id:'evt-031'}), (b {id:'loc-024'}) MERGE (a)-[:AFFECTS {validFrom: date('2004-12-26'), domain:'Climate', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-042'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {domain:'Climate', credibilityScore:0.90}]->(b);
MATCH (a {id:'loc-044'}), (b {id:'loc-001'}) MERGE (a)-[:LOCATED_IN {domain:'Climate', credibilityScore:0.96}]->(b);
MATCH (a {id:'loc-040'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2022-03-17'), domain:'Climate', credibilityScore:0.88}]->(b);
MATCH (a {id:'evt-016'}), (b {id:'evt-017'}) MERGE (a)-[:PRECEDED_BY {domain:'Climate', credibilityScore:0.97}]->(b);
MATCH (a {id:'loc-003'}), (b {id:'evt-016'}) MERGE (a)-[:SIGNED_BY {validFrom: date('2016-09-03'), domain:'Climate', credibilityScore:0.96}]->(b);
MATCH (a {id:'loc-003'}), (b {id:'evt-017'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-11-30'), domain:'Climate', credibilityScore:0.93}]->(b);
MATCH (a {id:'evt-027'}), (b {id:'loc-008'}) MERGE (a)-[:AFFECTS {validFrom: date('2023-06-15'), domain:'Climate', credibilityScore:0.88}]->(b);
MATCH (a {id:'loc-044'}), (b {id:'loc-004'}) MERGE (a)-[:LOCATED_IN {domain:'Climate', credibilityScore:0.94}]->(b);
MATCH (a {id:'act-051'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {validFrom: date('1956-08-01'), domain:'Climate', credibilityScore:0.92}]->(b);

// --- RELATIONSHIPS: Society (13) ---
MATCH (a {id:'act-049'}), (b {id:'evt-014'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2024-04-19'), domain:'Society', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-001'}), (b {id:'evt-014'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2024-04-19'), domain:'Society', credibilityScore:0.96}]->(b);
MATCH (a {id:'evt-014'}), (b {id:'loc-001'}) MERGE (a)-[:LOCATED_IN {domain:'Society', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-044'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {domain:'Society', credibilityScore:0.93}]->(b);
MATCH (a {id:'act-049'}), (b {id:'loc-011'}) MERGE (a)-[:LOCATED_IN {domain:'Society', credibilityScore:0.96}]->(b);
MATCH (a {id:'evt-019'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2022-06-14'), domain:'Society', credibilityScore:0.92}]->(b);
MATCH (a {id:'act-023'}), (b {id:'loc-001'}) MERGE (a)-[:OPERATES_IN {domain:'Society', credibilityScore:0.95}]->(b);
MATCH (a {id:'act-040'}), (b {id:'loc-001'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('1996-01-01'), domain:'Society', credibilityScore:0.91}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-022'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('2019-01-01'), domain:'Society', credibilityScore:0.88}]->(b);
MATCH (a {id:'loc-001'}), (b {id:'loc-004'}) MERGE (a)-[:ALLIES_WITH {validFrom: date('2010-01-01'), domain:'Society', credibilityScore:0.89}]->(b);
MATCH (a {id:'act-044'}), (b {id:'evt-032'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2020-03-11'), domain:'Society', credibilityScore:0.96}]->(b);
MATCH (a {id:'evt-032'}), (b {id:'loc-001'}) MERGE (a)-[:AFFECTS {validFrom: date('2020-03-11'), domain:'Society', credibilityScore:0.97}]->(b);
MATCH (a {id:'act-008'}), (b {id:'evt-009'}) MERGE (a)-[:PARTICIPATES_IN {validFrom: date('2023-07-12'), domain:'Society', credibilityScore:0.85}]->(b);

// --- SUMMARY ---
// Total Actors: 55
// Total Events: 35
// Total Locations: 45
// Total Entities: 135
// Total Relationships: ~158 explicit + ~135 BELONGS_TO = ~293 total
// Domains: 6 (Geopolitics, Economics, Defense, Technology, Climate, Society)
