use crate_whisper_wrapper::WhisperWrapper;
use std::sync::Mutex;

mod utils;
use utils::comandos;
use utils::estado::Estado;

// type Result<T> = std::result::Result<T, String>;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            comandos::iniciar_wrapper,
            comandos::iniciar_transcricao, 
            comandos::parar_transcricao, 
            comandos::retomar_transcricao,
            comandos::pegar_texto]
        )
        .manage(Mutex::new(Estado::new()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
