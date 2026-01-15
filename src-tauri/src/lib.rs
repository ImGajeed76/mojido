use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_progress_table",
            sql: "CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY,
                character TEXT UNIQUE NOT NULL,
                correct INTEGER DEFAULT 0,
                incorrect INTEGER DEFAULT 0,
                last_seen INTEGER,
                mastery REAL DEFAULT 0
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_sessions_table",
            sql: "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY,
                started_at INTEGER,
                ended_at INTEGER,
                total_chars INTEGER,
                correct_chars INTEGER,
                max_streak INTEGER
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_daily_activity_table",
            sql: "CREATE TABLE IF NOT EXISTS daily_activity (
                date TEXT PRIMARY KEY,
                sentences_completed INTEGER DEFAULT 0,
                first_sentence_at INTEGER
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_adaptive_learning_schema",
            sql: "
                -- Extend progress table with adaptive learning metrics
                ALTER TABLE progress ADD COLUMN hint_shown INTEGER DEFAULT 0;
                ALTER TABLE progress ADD COLUMN hint_used INTEGER DEFAULT 0;
                ALTER TABLE progress ADD COLUMN total_time_ms INTEGER DEFAULT 0;
                ALTER TABLE progress ADD COLUMN attempt_count INTEGER DEFAULT 0;
                ALTER TABLE progress ADD COLUMN best_time_ms INTEGER;
                ALTER TABLE progress ADD COLUMN recent_times TEXT DEFAULT '[]';
                ALTER TABLE progress ADD COLUMN mastery_score REAL DEFAULT 0;
                ALTER TABLE progress ADD COLUMN level TEXT DEFAULT 'new';
                ALTER TABLE progress ADD COLUMN next_review_at INTEGER;

                -- User skill profile (singleton row)
                CREATE TABLE IF NOT EXISTS user_profile (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    overall_skill REAL DEFAULT 0,
                    current_difficulty REAL DEFAULT 1.0,
                    speed_baseline_ms INTEGER DEFAULT 1000,
                    consecutive_perfect INTEGER DEFAULT 0,
                    consecutive_struggle INTEGER DEFAULT 0,
                    total_practice_ms INTEGER DEFAULT 0,
                    chars_typed_total INTEGER DEFAULT 0,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );

                -- Detailed attempt log for analytics
                CREATE TABLE IF NOT EXISTS attempt_log (
                    id INTEGER PRIMARY KEY,
                    session_id INTEGER NOT NULL,
                    sentence_id TEXT NOT NULL,
                    character TEXT NOT NULL,
                    correct INTEGER NOT NULL,
                    time_ms INTEGER,
                    hint_used INTEGER DEFAULT 0,
                    typed_wrong TEXT,
                    created_at INTEGER NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES sessions(id)
                );

                -- Sentence history for repetition avoidance
                CREATE TABLE IF NOT EXISTS sentence_history (
                    id INTEGER PRIMARY KEY,
                    sentence_id TEXT NOT NULL,
                    session_id INTEGER,
                    difficulty_at_time REAL,
                    accuracy REAL,
                    avg_time_ms INTEGER,
                    hints_used INTEGER DEFAULT 0,
                    shown_at INTEGER NOT NULL,
                    completed_at INTEGER,
                    FOREIGN KEY (session_id) REFERENCES sessions(id)
                );
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_decorum::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mojido.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
