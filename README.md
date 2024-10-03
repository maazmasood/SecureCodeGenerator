# QR Code Generator with AES Encryption

This project is a QR code generator that creates QR codes containing encrypted URLs using AES-256 encryption. The application provides a user-friendly GUI for inputting security codes and generates QR codes that can be scanned for verification purposes.

## Features

- Encrypts user-defined security codes using AES-256 encryption.
- Generates QR codes containing encrypted URLs for easy sharing and verification.
- Provides a simple GUI for user inputs, including:
  - Encryption key
  - Security code prefix
  - Start and end code numbers
- Saves generated QR codes as PNG images in a user-specified directory.

## Requirements

To run this project, you will need:

- Python 3.x
- The following Python packages:
  - `pycryptodome`
  - `qrcode`
  - `Pillow`
  - `tkinter` (included with Python standard library)

You can install the required packages using pip:

```bash
pip install pycryptodome qrcode[pil] Pillow
```

## Usage

1. Clone the repository to your local machine:

    ```bash
    git clone https://github.com/maazmasood/SecureQRCodeGenerator.git
    cd SecureCodeGenerator-main
    ```

2. Run the application:

    ```bash
    python3 qr_code_generator.py
    ```

3. Enter the required information in the GUI:
   - **Encryption Key:** The key used for AES encryption (must be a valid string).
   - **Security Code Prefix:** A prefix to append to the generated security codes.
   - **Base URL:** Your Website Domain with the desired page link.
   - **Start Code Number:** The starting number for the security code range.
   - **End Code Number:** The ending number for the security code range.

4. Click the **Generate QR Codes** button.
5. Select the folder where you want to save the generated QR code images.

## Example

When provided with:
- **Encryption Key:** `mysecretkey`
- **Security Code Prefix:** `CODE_`
- **Start Code Number:** `1`
- **End Code Number:** `5`

The application will generate QR codes for the following encrypted URLs:
- `http://yourwebsite/verification/get_data.php?hash=...CODE_1`
- `http://yourwebsite/verification/get_data.php?hash=...CODE_2`
- ...
- `http://yourwebsite/verification/get_data.php?hash=...CODE_5`



## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## Acknowledgments

- [PyCryptodome](https://www.pycryptodome.org/) for providing cryptographic functions.
- [qrcode](https://pypi.org/project/qrcode/) for generating QR codes.
- [Pillow](https://pillow.readthedocs.io/en/stable/) for image processing.
