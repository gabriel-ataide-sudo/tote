use crate_whisper_wrapper::WhisperWrapper;

pub struct Estado {
    pub wrapper: Option<WhisperWrapper>
}

impl Estado {
    pub fn new() -> Self {
        Self { wrapper: None }
    }
}