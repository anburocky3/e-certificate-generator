# E-Certificate Generator

Generate personalized certificate images from Excel using default files in the `input` folder.

[![Stars](https://img.shields.io/github/stars/anburocky3/e-certificate-generator)](https://github.com/anburocky3/e-certificate-generator)
[![Forks](https://img.shields.io/github/forks/anburocky3/e-certificate-generator)](https://github.com/anburocky3/e-certificate-generator)
[![GitHub license](https://img.shields.io/github/license/anburocky3/e-certificate-generator)](https://github.com/anburocky3/e-certificate-generator)
![Anbuselvan Rocky Twitter](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Fanburocky3%2Fe-certificate-generator)
[![Support Server](https://img.shields.io/discord/742347296091537448.svg?label=Discord&logo=Discord&colorB=7289da)](https://discord.gg/6ktMR65YMy)
[![Cyberdude youtube](https://img.shields.io/youtube/channel/subscribers/UCteUj8bL1ppZcS70UCWrVfw?style=social)](https://www.youtube.com/c/cyberdudenetworks)

![House Rent app](docs/banner.png)

Simple commands to run the script with default inputs:

```powershell
python main.py --excel input/data.xlsx --template input/template.png --output-dir output --font-size 40 --color FFFFFF --overwrite
```


### Screenshots

1. For each user which is read from the Excel file, a certificate is generated with their name and saved in the `output` folder. The script can be customized with various flags for font size, color, and placement.

> ![Sample Certificates](/docs/screenshots/2.png)

2. So, if you have an Excel file with 50 names, you will get 50 personalized certificate images in the output folder after running the script.

> ![Sample Certificates](/docs/screenshots/1.png)



## Input files

- `input/data.xlsx`
- `input/template.png`

`data.xlsx` should include a `Name` column in the header row.
You can still pass other file paths with CLI flags.

## Setup

```powershell
python -m pip install -r requirements.txt
```

## Generate certificates

```powershell
python main.py
```

This uses default inputs (`input/data.xlsx`, `input/template.png`) and writes files to `output`.

## Optional flags

```powershell
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

### License: [MIT](/LICENSE)

### Author:
- [Anbuselvan Annamalai](https://fb.com/anburocky3)