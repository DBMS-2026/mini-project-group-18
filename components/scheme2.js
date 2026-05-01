const schemaData = [`CREATE TABLE crime_scenes (
    id INTEGER PRIMARY KEY,
    scene_id VARCHAR(20) UNIQUE,
    case_level VARCHAR(20),
    date INTEGER,
    location VARCHAR(200),
    crime_type VARCHAR(50),
    victim_name VARCHAR(100),
    description TEXT,
    lead_detective VARCHAR(100),
    status VARCHAR(20)
);`,
`CREATE TABLE witness_statements (
    id INTEGER PRIMARY KEY,
    crime_scene_id INTEGER,
    witness_name VARCHAR(100),
    witness_phone VARCHAR(20),
    witness_age INTEGER,
    witness_occupation VARCHAR(100),
    statement TEXT,
    recorded_date INTEGER,
    reliability INTEGER,
    FOREIGN KEY (crime_scene_id) REFERENCES crime_scenes(id)
);`,
`CREATE TABLE suspects (
    id INTEGER PRIMARY KEY,
    crime_scene_id INTEGER,
    suspect_name VARCHAR(100),
    relationship_to_victim VARCHAR(200),
    motive TEXT,
    alibi TEXT,
    background_check TEXT,
    arrest_record BOOLEAN,
    FOREIGN KEY (crime_scene_id) REFERENCES crime_scenes(id)
);`,
`CREATE TABLE evidence (
    id INTEGER PRIMARY KEY,
    crime_scene_id INTEGER,
    evidence_type VARCHAR(50),
    description TEXT,
    location_found VARCHAR(200),
    collected_date INTEGER,
    analyzed BOOLEAN,
    findings TEXT,
    chain_of_custody VARCHAR(200),
    FOREIGN KEY (crime_scene_id) REFERENCES crime_scenes(id)
);`,
`CREATE TABLE phone_records (
    id INTEGER PRIMARY KEY,
    caller_name VARCHAR(100),
    receiver_name VARCHAR(100),
    call_date INTEGER,
    call_time VARCHAR(10),
    duration INTEGER,
    tower_location VARCHAR(100),
    call_type VARCHAR(20)
);`,
`CREATE TABLE financial_transactions (
    id INTEGER PRIMARY KEY,
    sender_name VARCHAR(100),
    receiver_name VARCHAR(100),
    transaction_date INTEGER,
    amount INTEGER,
    reference VARCHAR(200),
    bank_name VARCHAR(100),
    account_type VARCHAR(50),
    transaction_type VARCHAR(20)
);`,
`CREATE TABLE access_logs (
    id INTEGER PRIMARY KEY,
    employee_id INTEGER,
    employee_name VARCHAR(100),
    facility_name VARCHAR(200),
    access_date INTEGER,
    access_time VARCHAR(10),
    access_type VARCHAR(20),
    success BOOLEAN,
    card_used VARCHAR(50)
);`,
`CREATE TABLE medical_examiner_reports (
    id INTEGER PRIMARY KEY,
    crime_scene_id INTEGER,
    victim_name VARCHAR(100),
    exam_date INTEGER,
    cause_of_death VARCHAR(200),
    time_of_death VARCHAR(100),
    toxicology_findings TEXT,
    injuries TEXT,
    FOREIGN KEY (crime_scene_id) REFERENCES crime_scenes(id)
);`,
`CREATE TABLE background_checks (
    id INTEGER PRIMARY KEY,
    suspect_name VARCHAR(100),
    check_date INTEGER,
    criminal_record TEXT,
    employment_history TEXT,
    financial_status TEXT,
    known_associates TEXT
);`,
`CREATE TABLE case_solutions (
    id INTEGER PRIMARY KEY,
    crime_scene_id INTEGER,
    culprit_name VARCHAR(100),
    solution_date INTEGER,
    solving_detective VARCHAR(100),
    evidence_summary TEXT,
    confidence_score INTEGER,
    FOREIGN KEY (crime_scene_id) REFERENCES crime_scenes(id)
);`];
export default schemaData;