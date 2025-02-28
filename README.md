# Sheet

A modern React-based spreadsheet application that mimics Google Sheets functionality, built with TypeScript and Tailwind CSS.

## Overview

Sheet is a web application that closely mimics the user interface and core functionalities of Google Sheets, with a focus on mathematical and data quality functions, data entry, and key UI interactions. It provides functionalities for managing, manipulating, and processing data efficiently.

## Features

### Spreadsheet Interface:

- **Mimic Google Sheets UI**: Strive for a visual design and layout that closely resembles Google Sheets, including the toolbar, formula bar, and cell structure.
- **Drag Functions**: Implement drag functionality for cell content, formulas, and selections to mirror Google Sheets' behavior.
- **Cell Dependencies**: Ensure that formulas and functions accurately reflect cell dependencies and update accordingly when changes are made to related cells.
- **Basic Cell Formatting**: Support for bold, italics, font size, and color.
- **Row and Column Management**: Ability to add, delete, and resize rows and columns.
- **Relative and Absolute References**: Support for referencing cells using relative (e.g., A1, B2) and absolute (e.g., $A$1, $B$2) references in formulas.

### Mathematical Functions:

- **SUM**: Calculates the sum of a range of cells.
- **AVERAGE**: Calculates the average of a range of cells.
- **MAX**: Returns the maximum value from a range of cells.
- **MIN**: Returns the minimum value from a range of cells.
- **COUNT**: Counts the number of cells containing numerical values in a range.

### Data Quality Functions:

- **TRIM**: Removes leading and trailing whitespace from a cell.
- **UPPER**: Converts the text in a cell to uppercase.
- **LOWER**: Converts the text in a cell to lowercase.
- **REMOVE_DUPLICATES**: Removes duplicate rows from a selected range.

### Additional Features:

- **Data Management**: Easily create, read, update, and delete spreadsheet data.
- **User-Friendly**: Intuitive UI and simple interface for seamless operations.
- **Fast Processing**: Optimized for handling large datasets efficiently.
- **Export & Import**: Supports multiple file formats like CSV, Excel, and JSON.

## Installation

To use this project, clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/Aayush7213/sheet.git


# Install dependencies
npm install
```

## Usage

Run the application using the following command:

```bash
npm run dev
```

After starting the development server, open your browser and navigate to the local server URL (typically http://localhost:5173/). You can then begin using the spreadsheet application.

## Technologies Used

- React.js
- TypeScript
- Tailwind CSS
- Vite
- Lucide React (for icons)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Aayush - [GitHub Profile](https://github.com/Aayush7213)

Project Link: [https://github.com/Aayush7213/sheet](https://github.com/Aayush7213/sheet)
