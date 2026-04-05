# E-Certificate Platform

Generate personalized certificates from Excel data and a template image, then allow recipients to securely look up and download their certificates via a web portal.

[![Stars](https://img.shields.io/github/stars/anburocky3/e-certificate-generator)](https://github.com/anburocky3/e-certificate-generator)
[![Forks](https://img.shields.io/github/forks/anburocky3/e-certificate-generator)](https://github.com/anburocky3/e-certificate-generator)
[![GitHub license](https://img.shields.io/github/license/anburocky3/e-certificate-generator)](https://github.com/anburocky3/e-certificate-generator)
![Anbuselvan Rocky Twitter](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Fanburocky3%2Fe-certificate-generator)
[![Support Server](https://img.shields.io/discord/742347296091537448.svg?label=Discord&logo=Discord&colorB=7289da)](https://discord.gg/6ktMR65YMy)
[![Cyberdude youtube](https://img.shields.io/youtube/channel/subscribers/UCteUj8bL1ppZcS70UCWrVfw?style=social)](https://www.youtube.com/c/cyberdudenetworks)

![House Rent app](docs/banner.png)

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

App returns and downloads the matched certificate image.
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

### Screenshots

1. For each user which is read from the Excel file, a certificate is generated with their name and saved in the `output` folder. The script can be customized with various flags for font size, color, and placement.

> ![Sample Certificates](/docs/screenshots/2.png)

2. So, if you have an Excel file with 50 names, you will get 50 personalized certificate images in the output folder after running the script.

> ![Sample Certificates](/docs/screenshots/1.png)

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

## Module 2: Certificate Download App (Next.js)

See [web/README.md](/web/README.md) for detailed module-specific instructions.


### License: [MIT](/LICENSE)

### Author:
- [Anbuselvan Annamalai](https://fb.com/anburocky3)