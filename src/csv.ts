import { FileFormat, RecordType, FieldDefinition } from './types';
import { parseSqlType } from './validation';

interface CsvRow {
    recordType: string;
    recordIdentifier: string;
    identifierStart: string;
    identifierLength: string;
    fieldName: string;
    startPosition: string;
    length: string;
    sqlType?: string;
    description?: string;
    required?: string;
    defaultValue?: string;
    validationPattern?: string;
    minValue?: string;
    maxValue?: string;
    minLength?: string;
    maxLength?: string;
    [key: string]: string | undefined;
}

function parseCsvRow(headers: string[], row: string): CsvRow {
    const values = row.split(',').map(v => v.trim());
    const result: Record<string, string> = {};
    headers.forEach((header, index) => {
        if (values[index]) {
            result[toCamelCase(header)] = values[index];
        }
    });
    return result as unknown as CsvRow;
}

function toCamelCase(str: string): string {
    return str.toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

export function importFormatFromCsv(csvContent: string): FileFormat {
    if (!csvContent.trim()) {
        throw new Error('CSV content is empty');
    }

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
        throw new Error('Invalid CSV format');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const recordsByType: Record<string, RecordType> = {};
    let maxRecordLength = 0;

    // Process each row
    for (let i = 1; i < lines.length; i++) {
        const row = parseCsvRow(headers, lines[i]);
        const recordTypeName = row.recordType || 'DETAIL';

        if (!recordsByType[recordTypeName]) {
            recordsByType[recordTypeName] = {
                name: recordTypeName,
                identifier: {
                    start: parseInt(row.identifierStart || '0'),
                    length: parseInt(row.identifierLength || '0'),
                    value: row.recordIdentifier || ''
                },
                fields: []
            };
        }

        const field: FieldDefinition = {
            name: row.fieldName,
            start: parseInt(row.startPosition),
            length: parseInt(row.length)
        };

        // Handle SQL type if present
        if (row.sqlType) {
            const { sqlType, precision, scale } = parseSqlType(row.sqlType);
            field.sqlType = sqlType;
            if (precision !== undefined) {
                field.precision = precision;
                field.scale = scale;
            }
        }

        // Add other field properties
        if (row.description) { field.description = row.description; }
        if (row.required) { field.required = row.required.toLowerCase() === 'true'; }
        if (row.defaultValue) { field.defaultValue = row.defaultValue; }
        if (row.validationPattern) { field.validationPattern = row.validationPattern; }
        if (row.minValue) { field.minValue = parseFloat(row.minValue); }
        if (row.maxValue) { field.maxValue = parseFloat(row.maxValue); }
        if (row.minLength) { field.minLength = parseInt(row.minLength); }
        if (row.maxLength) { field.maxLength = parseInt(row.maxLength); }

        recordsByType[recordTypeName].fields.push(field);
        maxRecordLength = Math.max(maxRecordLength, field.start + field.length);
    }

    // Create format object
    const format: FileFormat = {
        name: 'Imported Format',
        recordTypes: [],
        recordLength: maxRecordLength
    };

    // Organize record types
    Object.values(recordsByType).forEach(rt => {
        if (rt.name.toUpperCase() === 'HEADER') {
            format.header = rt;
        } else if (rt.name.toUpperCase() === 'TRAILER') {
            format.trailer = rt;
        } else {
            format.recordTypes.push(rt);
        }
    });

    return format;
}

export function exportFormatToCsv(format: FileFormat): string {
    const headers = [
        'Record Type',
        'Record Identifier',
        'Identifier Start',
        'Identifier Length',
        'Field Name',
        'Start Position',
        'Length',
        'SQL Type',
        'Description',
        'Required',
        'Default Value',
        'Validation Pattern',
        'Min Value',
        'Max Value',
        'Min Length',
        'Max Length'
    ];

    const rows: string[][] = [];

    // Helper function to add record type fields
    function addRecordFields(recordType: RecordType): void {
        recordType.fields.forEach(field => {
            const sqlType = field.sqlType ? 
                (field.precision !== undefined ? 
                    `${field.sqlType}(${field.precision}${field.scale !== undefined ? `,${field.scale}` : ''})` : 
                    field.sqlType) : 
                '';

            rows.push([
                recordType.name,
                recordType.identifier.value,
                recordType.identifier.start.toString(),
                recordType.identifier.length.toString(),
                field.name,
                field.start.toString(),
                field.length.toString(),
                sqlType,
                field.description || '',
                field.required?.toString() || 'false',
                field.defaultValue || '',
                field.validationPattern || '',
                field.minValue?.toString() || '',
                field.maxValue?.toString() || '',
                field.minLength?.toString() || '',
                field.maxLength?.toString() || ''
            ]);
        });
    }

    // Add header fields
    if (format.header) {
        addRecordFields(format.header);
    }

    // Add detail record fields
    format.recordTypes.forEach(rt => addRecordFields(rt));

    // Add trailer fields
    if (format.trailer) {
        addRecordFields(format.trailer);
    }

    // Convert to CSV
    const csvLines = [
        headers.join(','),
        ...rows.map(row => row.map(value => `"${value}"`).join(','))
    ];

    return csvLines.join('\n');
}

export { FileFormat }; 