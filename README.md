# Fixed Width Format Viewer

A Visual Studio Code extension for viewing and validating fixed-width format files. This extension helps you work with files where fields are defined by their position and length rather than delimiters.

## Features

- 🎨 Visual column guides with different colors for different field types
- 📝 Hover information showing field names, values, and validation
- 💾 Save and load format definitions
- 📊 Export data and formats to CSV
- ✨ Syntax highlighting for different field types
- ❌ Field validation with rich metadata support
- 📥 Import/Export formats from/to CSV files
- 💽 SQL data type support with precision/scale
- 📑 Multi-record format support (header/detail/trailer)
- ✅ Record-level validation and cross-record checks

## Installation

You can install this extension in one of two ways:

1. **From VSIX file**:
   - Download the `.vsix` file from the releases
   - In VS Code, go to Extensions (Ctrl+Shift+P)
   - Click the "..." menu (top-right) and choose "Install from VSIX..."
   - Select the downloaded file

2. **From VS Code Marketplace**:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Fixed Width Format Viewer"
   - Click Install

## Usage

### Method 1: Manual Format Definition

1. Open a fixed-width format file (`.fwf` or `.txt`)
2. Press `Ctrl+Shift+P` and select "FWF: Define File Format"
3. Enter your field definitions in the format:
   ```
   fieldName,startPosition,length[,type];fieldName2,startPosition2,length2[,type2]
   ```
   Example: `id,0,5,string;name,5,20,string;date,25,8,date`

### Method 2: CSV Format Import

1. Create a CSV file with your format definition:
   ```csv
   Record Type,Record Identifier,Identifier Start,Identifier Length,Field Name,Start Position,Length,SQL Type,Description,Required,Default Value,Validation Pattern,Min Value,Max Value,Min Length,Max Length
   HEADER,HDR,0,3,recordType,0,3,CHAR(3),Record Type Indicator,true,HDR,^HDR$,,,3,3
   HEADER,HDR,0,3,fileDate,3,8,DATE,File Creation Date,true,,^\d{8}$,,,8,8
   DETAIL,DTL,0,3,id,3,5,CHAR(5),Customer ID,true,,^[A-Z]{2}\d{3}$,,,5,5
   DETAIL,DTL,0,3,name,8,20,VARCHAR(20),Customer Name,true,,,,,2,20
   TRAILER,TRL,0,3,recordCount,3,6,INTEGER,Record Count,true,,^\d+$,0,999999,,
   ```
2. Press `Ctrl+Shift+P` and select "FWF: Import Format from CSV"
3. Select your CSV file
4. Indicate whether the file has a header row

### Multi-Record Format Support

The extension supports files with multiple record types:

- **Header Record**: File-level information (optional)
- **Detail Records**: Main data records (required)
- **Trailer Record**: Summary information (optional)

Each record type is identified by a marker at a specific position:

```
HDR20231213000004                  <- Header record (starts with HDR)
DTLAB123John Smith   ...           <- Detail record (starts with DTL)
DTLCD456Jane Doe    ...           <- Detail record (starts with DTL)
TRL000002000123.45                <- Trailer record (starts with TRL)
```

Record types are color-coded in the editor for easy identification.

### Field Metadata

Each field can have the following metadata:

- **Record-Level Fields**:
  - `Record Type` - Type of record (HEADER, DETAIL, TRAILER)
  - `Record Identifier` - Value that identifies this record type
  - `Identifier Start` - Starting position of identifier
  - `Identifier Length` - Length of identifier

- **Field-Level Metadata**:
  - `Field Name` - The name of the field
  - `Start Position` - Zero-based starting position
  - `Length` - Field length in characters
  - `SQL Type` - SQL data type specification
  - `Description` - Field description
  - `Required` - Whether the field is required
  - `Default Value` - Default value
  - `Validation Pattern` - Regex pattern
  - `Min/Max Value` - Value range
  - `Min/Max Length` - Length range

### Supported SQL Types

The extension supports common SQL data types with validation:

- **String Types**:
  - `CHAR(n)` - Fixed-length string
  - `VARCHAR(n)` - Variable-length string
  - `TEXT` - Unlimited length text

- **Numeric Types**:
  - `INTEGER` - Whole numbers
  - `DECIMAL(p,s)` - Decimal numbers with precision and scale
  - `NUMERIC(p,s)` - Same as DECIMAL

- **Date/Time Types**:
  - `DATE` - Date values (YYYY-MM-DD)
  - `TIMESTAMP` - Date and time values

### Record-Level Validation

The extension performs comprehensive validation across records:

1. **Record Sequence Validation**:
   - Header record must be first (if defined)
   - Trailer record must be last (if defined)
   - No duplicate header/trailer records
   - Valid record type identifiers

2. **Cross-Record Validation**:
   - Record count in header matches actual count
   - Record count in trailer matches actual count
   - Total balance in trailer matches sum of detail records
   - Field-level validation within each record

3. **To Validate a File**:
   1. Open your fixed-width file
   2. Import or define your format
   3. Press `Ctrl+Shift+P` and select "FWF: Validate File"
   4. View validation results in the output panel

Example validation checks for our sample format:
```
✓ Header record starts with "HDR"
✓ Detail records start with "DTL"
✓ Trailer record starts with "TRL"
✓ Record count in header (4) matches actual count
✓ Record count in trailer (4) matches actual count
✓ Total balance in trailer (1603.91) matches sum of detail balances
✓ All required fields are present
✓ All field values match their SQL type constraints
```

### Commands

- `FWF: Define File Format` - Define a new format manually
- `FWF: Import Format from CSV` - Import a format from a CSV file
- `FWF: Export Format to CSV` - Export the current format to CSV
- `FWF: Save Current Format` - Save the current format for later use
- `FWF: Load Saved Format` - Load a previously saved format
- `FWF: Export to CSV` - Export the data to CSV format
- `FWF: Validate File` - Validate the current file against its format

### Validation Features

The extension validates at multiple levels:

1. **Field Level**:
   - Required fields
   - SQL type constraints
   - Length requirements
   - Pattern matching
   - Value ranges

2. **Record Level**:
   - Record type identification
   - Record sequence
   - Required fields by record type
   - Record length

3. **File Level**:
   - Header/trailer presence
   - Record counts
   - Balance totals
   - Cross-record relationships

## Examples

### Sample File Format
```csv
Record Type,Record Identifier,Identifier Start,Identifier Length,Field Name,Start Position,Length,SQL Type,Description,Required
HEADER,HDR,0,3,recordType,0,3,CHAR(3),Record Type Indicator,true
HEADER,HDR,0,3,fileDate,3,8,DATE,File Creation Date,true
HEADER,HDR,0,3,recordCount,11,6,INTEGER,Total Record Count,true
DETAIL,DTL,0,3,recordType,0,3,CHAR(3),Record Type Indicator,true
DETAIL,DTL,0,3,id,3,5,CHAR(5),Customer ID,true
DETAIL,DTL,0,3,name,8,20,VARCHAR(20),Customer Name,true
TRAILER,TRL,0,3,recordType,0,3,CHAR(3),Record Type Indicator,true
TRAILER,TRL,0,3,recordCount,3,6,INTEGER,Record Count,true
TRAILER,TRL,0,3,totalBalance,9,12,DECIMAL(12,2),Total Balance,true
```

### Sample Data File with Validation
```
HDR202312130000004                  ✓ Valid header
DTLAB123John Smith   ...           ✓ Valid detail record
DTLCD456Jane Doe    ...           ✓ Valid detail record
TRL0000041603.91                   ✓ Valid trailer with matching totals
```

This format includes:
- Header record with file date and record count
- Detail records with customer information
- Trailer record with totals
- Record type identification
- Field-level validation
- SQL type constraints
- Cross-record validation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. 