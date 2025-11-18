import socket
import numpy as np
import struct  # Mantido caso seja necessário para o wrapper Rust, embora não seja usado no protocolo simplificado.
from faster_whisper import WhisperModel
import time

import os

cuda_version = "13.0"
cuda_bin_path = rf"C:\Program Files\NVIDIA\CUDNN\v9.16\bin\{cuda_version}"

# Add to PATH (so DLL loader can find it)
os.environ["PATH"] = cuda_bin_path + os.pathsep + os.environ["PATH"]

# --- CONFIGURAÇÕES ---
HOST = "127.0.0.1"
PORT = 43007
MODEL_SIZE = "base"
# Se a GPU falhar, o CTranslate2 (faster-whisper) pode cair para CPU,
# mas é mais seguro definir explicitamente se houver erros de driver.
DEVICE = "cuda"
COMPUTE_TYPE = "int8"


# --- FIM CONFIGURAÇÕES ---

def main():
    print(f"Carregando modelo {MODEL_SIZE} em {DEVICE}...")
    try:
        model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    except Exception as e:
        print(f"Erro ao carregar CUDA/GPU: {e}. Tentando CPU...")
        model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((HOST, PORT))
    server_socket.listen(1)

    print(f"Ouvindo em {HOST}:{PORT}")
    print("Aguardando conexão do Rust...")

    conn, addr = server_socket.accept()
    print(f"Conectado a {addr}")

    audio_buffer = np.array([], dtype=np.float32)

    SAMPLE_RATE = 16000
    PROCESS_INTERVAL = 0.8  # Aumentado ligeiramente para 0.8s
    last_process_time = time.time()

    try:
        while True:
            # Recebe dados do Rust (pedaços de 4096 bytes)
            data = conn.recv(4096)
            if not data:
                break

            # Converte bytes PCM 16-bit para float32
            floats = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
            audio_buffer = np.append(audio_buffer, floats)

            current_time = time.time()

            if (current_time - last_process_time) > PROCESS_INTERVAL and len(
                audio_buffer
            ) > SAMPLE_RATE * 0.5:
                # Limita o buffer para evitar lentidão progressiva
                if len(audio_buffer) > SAMPLE_RATE * 10:
                    audio_buffer = audio_buffer[-SAMPLE_RATE * 10 :]

                segments, info = model.transcribe(
                    audio_buffer,
                    beam_size=1,
                    language="pt",
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                )

                # CORREÇÃO: Inicializa a variável para evitar Undefined name
                full_text = ""
                for segment in segments:
                    full_text += segment.text + " "

                full_text = full_text.strip()

                if full_text:
                    print(f"Transcrevendo: {full_text[-100:]}")

                    # Protocolo Length-prefix: 4 bytes (tamanho) + bytes do texto
                    msg_bytes = full_text.encode("utf-8")
                    header = struct.pack(
                        ">I", len(msg_bytes)
                    )  # '>I' = 4 bytes, unsigned integer, Big-endian

                    conn.sendall(header + msg_bytes)  # Envia o cabeçalho e o texto

                last_process_time = current_time

    except Exception as e:
        print(f"Erro no processamento ou comunicação: {e}")
    finally:
        conn.close()
        server_socket.close()


if __name__ == "__main__":
    main()
