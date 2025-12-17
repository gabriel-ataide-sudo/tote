use crate_whisper_wrapper::WhisperWrapper;
use tauri::Manager;
use crate::utils::estado::Estado;
use std::sync::{LockResult, Mutex};
use anyhow::Result;
// type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[tauri::command(rename_all = "snake_case")]
pub fn iniciar_wrapper(app_handle: tauri::AppHandle, host: String, porta: u32, limite_caracteres: u32, comprimento_minimo: f32) -> Result<(), String>{
    let estado = app_handle.state::<Mutex<Estado>>();
    let mut lock_estado= estado.lock().unwrap();

    match lock_estado.wrapper {
        Some(_) => { return Err("Wrapper já foi iniciado".into()) },
        None => {
            let novo_wrapper = match WhisperWrapper::new(
                host, 
                porta,
                limite_caracteres,
                comprimento_minimo
            ) {
                Ok(i) => {i},
                Err(e) => { return Err(e.to_string()) }
            };
            lock_estado.wrapper = Some(novo_wrapper);
        }
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn iniciar_transcricao(app_handle: tauri::AppHandle) -> Result<(), String> {
    let estado = app_handle.state::<Mutex<Estado>>();
    let mut lock_estado = estado.lock().unwrap();
    
    match lock_estado.wrapper {
        Some(_) => {
            match lock_estado.wrapper.as_mut().unwrap().iniciar_envio() {
                Ok(_) => {},
                Err(e) => { return Err(e.to_string()) }
            };
        }
        None => {
            return Err("Wrapper não foi iniciado".to_string());
        }
    }
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn parar_transcricao(app_handle: tauri::AppHandle) -> Result<(), String>{
    let estado = app_handle.state::<Mutex<Estado>>();
    let mut lock_estado = estado.lock().unwrap();

    // Dropping the wrapper closes the socket, triggering backend restart (exit 42)
    lock_estado.wrapper = None;
    
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn retomar_transcricao(app_handle: tauri::AppHandle) -> Result<(), String>{
    let estado = app_handle.state::<Mutex<Estado>>();
    let mut lock_estado = estado.lock().unwrap();

    match lock_estado.wrapper {
        Some(_) => {
            match lock_estado.wrapper.as_mut().unwrap().retomar() {
                Ok(_) => {},
                Err(e) => { return Err(e.to_string()) }
            };
        },
        None => {
            return Err("Wrapper não foi iniciado".to_string());
        }
    }
    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn pegar_texto(app_handle: tauri::AppHandle) -> Result<String, String> {
    let estado = app_handle.state::<Mutex<Estado>>();
    let mut lock_estado = estado.lock().unwrap();

    match lock_estado.wrapper {
        Some(_) => {
            return Ok(lock_estado.wrapper.as_mut().unwrap().pegar_transcricao());
        },
        None => {
            return Err("Wrapper não foi iniciado".to_string());
        }
    }
}