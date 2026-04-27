# DataFlow - Private Data Analysis in Your Browser

![DataFlow Overview](https://img.shields.io/badge/Status-Complete-success)
![Vanilla JS](https://img.shields.io/badge/Tech-Vanilla%20JS-F7DF1E)
![No Backend](https://img.shields.io/badge/Architecture-Serverless%20%2F%20Client--Side-blue)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-brightgreen)

DataFlow is a lightweight, blazing-fast web application designed for corporate data analysis and cleaning. It operates entirely in the browser, meaning your sensitive `.csv` and `.xlsx` files never leave your computer. 

## ✨ Features

- **100% Private & Serverless:** Built with a client-side architecture. No backend server means zero data uploading and instant processing speeds.
- **Drag & Drop Interface:** Seamlessly drop Excel or CSV files to instantly parse them.
- **Google Sheets Integration:** Import datasets dynamically using a public Google Sheet URL.
- **Intelligent Data Cleaning Suite:**
  - One-click removal of empty rows and exact duplicates.
  - Smart missing-value filling (infers column data types to fill zeros in numeric columns and "Unknown" in categorical columns).
- **Automated Statistics:** Generates row/column counts, missing value tracking, and infers data types for each column automatically.
- **Dynamic Charting:** Features a built-in visualization studio utilizing `Chart.js` for instant Bar, Line, Scatter, and Pie charts mapped to your cleaned data.
- **Corporate UI/UX:** Styled using a custom, premium dark-mode CSS theme ensuring a highly readable, professional interface.

## 🚀 Technologies Used

- **HTML5 & CSS3:** Custom-built glassmorphic UI without reliance on heavy frameworks.
- **Vanilla JavaScript:** Fast, dependency-free core application logic.
- **SheetJS (xlsx):** For parsing and exporting complex spreadsheet formats locally.
- **Chart.js:** For rendering interactive, hardware-accelerated graphs based on user configuration.

## 🛠️ Usage

Since DataFlow requires no backend or build steps, running it is incredibly simple:

1. Clone the repository: `git clone https://github.com/yourusername/DataFlow.git`
2. Open the folder and double-click `index.html` in any modern web browser.
3. Drop in a dataset and start analyzing!

---
*Created as a demonstration of high-performance client-side Javascript, modern CSS design systems, and data privacy workflows.*
