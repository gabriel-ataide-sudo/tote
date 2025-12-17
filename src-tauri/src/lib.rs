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

// Imports from windows crate
use windows::Win32::Foundation::{HWND, RECT};
use windows::Win32::UI::Shell::{
    SHAppBarMessage, ABM_NEW, ABM_REMOVE, ABM_SETPOS, ABM_QUERYPOS, APPBARDATA, ABE_TOP, ABE_BOTTOM,
};
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SystemParametersInfoW, SPI_GETWORKAREA};
use tauri::{Window, Manager}; // Add Manager trait for window access

#[tauri::command]
fn register_appbar(window: Window, position: String, height: u32) {
    #[cfg(target_os = "windows")]
    {
        // Get the HWND from Tauri's window
        let hwnd = window.hwnd().unwrap().0 as isize;
        let hwnd_wrapper = HWND(hwnd as *mut _);

        unsafe {
            let mut abd = APPBARDATA::default();
            abd.cbSize = std::mem::size_of::<APPBARDATA>() as u32;
            abd.hWnd = hwnd_wrapper;
            abd.uCallbackMessage = 0; // Not handling callbacks for now

            if position == "none" {
                SHAppBarMessage(ABM_REMOVE, &mut abd);
                return;
            }

            // Register if not potentially already registered (ABM_NEW calls can vary, safe to just try query or simple new)
            // A simplified approach: Remove then Add to ensure clean state
            SHAppBarMessage(ABM_REMOVE, &mut abd);
            SHAppBarMessage(ABM_NEW, &mut abd);

            // Set the edge
            abd.uEdge = if position == "top" { ABE_TOP } else { ABE_BOTTOM };

            // Query dimensions
            // Get screen metrics. For AppBar, we want to specify the width and height we *want*.
            // Since we are full width, we should get the monitor rect.
            // Simplified: Just use the current monitor info from Tauri? Or simpler, just ask Windows for screen size?
            // Actually, we usually fill rc with "desired" rect.
            
            // Getting monitor handle to be safe
            // Let's rely on standard practice: set rc for the whole screen edge
            
            // Assume primary monitor or current monitor for now.
            // But strict AppBar implementation usually requires GetSystemMetrics(SM_CXSCREEN) etc.
            // Let's trust SHAppBarMessage to do its job with provided RECT.
            
            // Get monitor info to support multi-monitor correctly
            let monitor = window.current_monitor().ok().flatten();
            let (screen_x, screen_y, screen_width, screen_height) = if let Some(m) = monitor {
                let size = m.size();
                let pos = m.position();
                (pos.x as i32, pos.y as i32, size.width as i32, size.height as i32)
            } else {
                (0, 0, 1920, 1080)
            };

            // Calculate Desired Rect in Screen Coordinates
            if position == "top" {
                abd.rc = RECT {
                    left: screen_x,
                    top: screen_y,
                    right: screen_x + screen_width,
                    bottom: screen_y + height as i32,
                };
            } else {
                 abd.rc = RECT {
                    left: screen_x,
                    top: screen_y + screen_height - (height as i32),
                    right: screen_x + screen_width,
                    bottom: screen_y + screen_height,
                };
            }

            // QUERY
            SHAppBarMessage(ABM_QUERYPOS, &mut abd);

            // Re-adjust after query (preserves the thickness we asked for, but respects the valid area returned)
            // Note: The system might adjust top/left if there are other bars.
            // But for simple Top/Bottom bars, we mostly care about ensuring height is preserved.
            if position == "top" {
                abd.rc.bottom = abd.rc.top + height as i32;
            } else {
                abd.rc.top = abd.rc.bottom - height as i32;
            }
            
            SHAppBarMessage(ABM_SETPOS, &mut abd);
            
            // We NO LONGER force window position/size here.
            // This allows the frontend to be "taller" than the reserved area (e.g. for settings menu)
            // and allows the user to drag the window away (which the frontend will detect).
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            register_appbar,
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
