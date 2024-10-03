import base64
import hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import qrcode
from PIL import Image
import tkinter as tk
from tkinter import messagebox
from tkinter import filedialog

# Function to encrypt the message using AES-256-CBC
def encrypt_aes(message, key, iv):
    cipher = AES.new(key, AES.MODE_CBC, iv)
    encrypted_bytes = cipher.encrypt(pad(message.encode(), AES.block_size))  # Apply PKCS7 padding
    return base64.urlsafe_b64encode(encrypted_bytes).decode()  # Return URL-safe Base64 encoded encrypted message

# Function to generate QR codes based on user inputs
def generate_qr_codes():
    input_key = key_entry.get()
    prefix = prefix_entry.get()
    try:
        start_code = int(start_code_entry.get())
        end_code = int(end_code_entry.get())
    except ValueError:
        messagebox.showerror("Invalid Input", "Please enter valid start and end code numbers.")
        return

    if not input_key or not prefix:
        messagebox.showerror("Input Error", "Please provide the key and prefix.")
        return
    
    # Create the encryption key and IV
    key = hashlib.sha256(input_key.encode()).digest()  # AES-256 key (32 bytes)
    iv = b'abcabcabcabcabca'  # IV must be 16 bytes

    # Base URL for the verification page
    base_url = "http://localhost/verification/get_data.php?hash="

    # Generate security codes
    security_codes = [f"{prefix}{i}" for i in range(start_code, end_code + 1)]

    # Select folder to save the QR codes
    folder_path = filedialog.askdirectory(title="Select Folder to Save QR Codes")
    if not folder_path:
        return

    # Encrypt the security code, generate QR codes, and save them
    for code in security_codes:
        # Encrypt the security code part
        encrypted_code = encrypt_aes(code, key, iv)
        
        # Construct the final URL in the format `http://localhost/verification/get_data.php?hash=ENCODED_KEY`
        final_url = base_url + encrypted_code
        
        # Generate the QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(final_url)  # Add the final URL to the QR code
        qr.make(fit=True)

        # Save the QR code with the security code as the filename
        img = qr.make_image(fill='black', back_color='white')
        img.save(f'{folder_path}/{code}.png')

    messagebox.showinfo("Success", "QR codes with encrypted URLs have been generated and saved.")

# Create the main window
root = tk.Tk()
root.title("QR Code Generator")

# Create and position labels and entries
tk.Label(root, text="Encryption Key:").grid(row=0, column=0, padx=10, pady=10)
key_entry = tk.Entry(root, width=30)
key_entry.grid(row=0, column=1, padx=10, pady=10)

tk.Label(root, text="Security Code Prefix:").grid(row=1, column=0, padx=10, pady=10)
prefix_entry = tk.Entry(root, width=30)
prefix_entry.grid(row=1, column=1, padx=10, pady=10)

tk.Label(root, text="Start Code Number:").grid(row=2, column=0, padx=10, pady=10)
start_code_entry = tk.Entry(root, width=30)
start_code_entry.grid(row=2, column=1, padx=10, pady=10)

tk.Label(root, text="End Code Number:").grid(row=3, column=0, padx=10, pady=10)
end_code_entry = tk.Entry(root, width=30)
end_code_entry.grid(row=3, column=1, padx=10, pady=10)

# Generate button
generate_button = tk.Button(root, text="Generate QR Codes", command=generate_qr_codes)
generate_button.grid(row=4, column=0, columnspan=2, padx=10, pady=20)

# Start the GUI event loop
root.mainloop()
