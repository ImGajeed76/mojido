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
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_decorum::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mojido.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
