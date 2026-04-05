# E-Certificate Platform

This project is now organized into **2 modules**:

1. **Certificate Generation Module (Python CLI)**
2. **Certificate Download Module (Next.js app)**

The Python CLI creates certificate images and writes a manifest (`output/index.json`).
The Next.js app uses that manifest to allow PIN-protected lookup and download by `roll_no` or `email`.

## Project Structure

- `certificate_generator/` - Python generation package
- `main.py` - compatibility entrypoint for CLI
- `web/` - Next.js download app
- `input/` - Excel + template inputs
- `output/` - generated certificate PNGs + `index.json`

## Module 1: Certificate Generation (Python)

### Setup

```powershell
cd X:\git-projects\e-certificate-generator
python -m pip install -r requirements.txt
```

### Required Excel columns

- `Name` (required)
- `roll_no` (recommended for portal lookup)
- `email` (recommended for portal lookup)

The loader also accepts common aliases like `Roll No`, `Roll Number`, and `Email`.

### Run (default inputs)

```powershell
cd X:\git-projects\e-certificate-generator
python main.py
```

or:

```powershell
cd X:\git-projects\e-certificate-generator
python -m certificate_generator
```
- Generate certificates first, then run the web app.
- If lookup fails due to missing manifest, re-run Python generation to rebuild `output/index.json`.

## License

[MIT](LICENSE)
3. App returns and downloads the matched certificate image.
npm run dev

- `--name-column`, `--roll-column`, `--email-column`
- `--start-row`, `--end-row`, `--limit`
- `--font`, `--font-size`, `--color`
- `--name-x`, `--name-y`
- `--name-zone-top`, `--name-zone-bottom`, `--name-zone-padding`
- `--dry-run`, `--overwrite`

### Output contract

Generation writes:

- `output/certificate_001_<name>.png` (and more)
- `output/index.json` with records containing:
  - `certificate_id`
  - `name`
  - `roll_no`
  - `email`
  - `file_name`

## Module 2: Certificate Download App (Next.js)

See `web/README.md` for detailed module-specific instructions.

### Quick start
### Example with options

```powershell
cd X:\git-projects\e-certificate-generator
python main.py --excel input/data.xlsx --template input/template.png --output-dir output --font-size 40 --color FFFFFF --overwrite
```

Process only a specific Excel range (inclusive):

```powershell
python main.py --start-row 2 --end-row 51
```

- Row `1` is the header, so data starts from row `2`
- `--start-row` and `--end-row` are inclusive
- If omitted, the script processes from row `2` to the last row

- Default style is Pacifico (if available), white text, 40px
- Use `--name-y` for exact vertical placement, or `--name-zone-top` / `--name-zone-bottom` for zone placement
- `input/*` user files and `assets/fonts/*` are git-ignored (only default placeholders are tracked)
> If you want to generate those certificates on the app frontend: 

```powershell
python main.py --output-dir web/public/certificates --overwrite
```

### License: [MIT](/LICENSE)

### Author:
- [Anbuselvan Annamalai](https://fb.com/anburocky3)