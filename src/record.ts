import { FileFormat, RecordType, ValidationResult, FieldDefinition } from './types';
import { validateField } from './validation';

export function getRecordType(line: string, format: FileFormat): RecordType | undefined {
    if (line.length === 0) {
        return undefined;
    }

    // Check header record
    if (format.header?.identifier && 
        line.length >= format.header.identifier.start + format.header.identifier.length &&
        line.substr(format.header.identifier.start, format.header.identifier.length) === format.header.identifier.value) {
        return format.header;
    }

    // Check trailer record
    if (format.trailer?.identifier && 
        line.length >= format.trailer.identifier.start + format.trailer.identifier.length &&
        line.substr(format.trailer.identifier.start, format.trailer.identifier.length) === format.trailer.identifier.value) {
        return format.trailer;
    }

    // Check detail records
    return format.recordTypes.find(rt => 
        line.length >= rt.identifier.start + rt.identifier.length &&
        line.substr(rt.identifier.start, rt.identifier.length) === rt.identifier.value
    );
}

export function validateRecord(line: string, recordType: RecordType): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    // Check record length
    const requiredLength = recordType.fields.reduce((max, f) => Math.max(max, f.start + f.length), 0);
    if (line.length < requiredLength) {
        result.errors.push('Record is too short');
        result.isValid = false;
        return result;
    }

    // Validate each field
    for (const field of recordType.fields) {
        const value = line.substr(field.start, field.length).trim();
        const fieldErrors = validateField(field, value);
        if (fieldErrors.length > 0) {
            result.errors.push(...fieldErrors.map(err => `Field ${field.name}: ${err}`));
            result.isValid = false;
        }
    }

    return result;
}

export function extractFieldValue(line: string, field: FieldDefinition): string {
    if (line.length < field.start + field.length) {
        return '';
    }
    return line.substr(field.start, field.length).trim();
}

export function validateRecordSequence(lines: string[], format: FileFormat): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };
    const seenRecordTypes = new Set<string>();
    let recordCount = 0;
    let totalBalance = 0;

    // Check for header if defined
    if (format.header) {
        if (lines.length === 0 || getRecordType(lines[0], format) !== format.header) {
            result.errors.push('File must start with a header record');
            result.isValid = false;
            return result;
        }
        seenRecordTypes.add('HEADER');
    }

    // Check for trailer if defined
    if (format.trailer) {
        if (lines.length === 0 || getRecordType(lines[lines.length - 1], format) !== format.trailer) {
            result.errors.push('File must end with a trailer record');
            result.isValid = false;
            return result;
        }
    }

    // Process each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const recordType = getRecordType(line, format);

        if (!recordType) {
            result.errors.push(`Line ${i + 1}: Invalid record type`);
            result.isValid = false;
            continue;
        }

        // Validate record type sequence
        if (recordType === format.header && i !== 0) {
            result.errors.push(`Line ${i + 1}: Header record can only appear at the start`);
            result.isValid = false;
        }

        if (recordType === format.trailer && i !== lines.length - 1) {
            result.errors.push(`Line ${i + 1}: Trailer record can only appear at the end`);
            result.isValid = false;
        }

        // Validate record content
        const recordValidation = validateRecord(line, recordType);
        if (!recordValidation.isValid) {
            result.errors.push(...recordValidation.errors.map(err => `Line ${i + 1}: ${err}`));
            result.isValid = false;
        }

        // Update counters
        if (recordType !== format.header && recordType !== format.trailer) {
            recordCount++;
            const balanceField = recordType.fields.find(f => f.name === 'balance');
            if (balanceField) {
                const balance = parseFloat(extractFieldValue(line, balanceField));
                if (!isNaN(balance)) {
                    totalBalance += balance;
                }
            }
        }
    }

    // Validate header record count if present
    if (format.header) {
        const recordCountField = format.header.fields.find(f => f.name === 'recordCount');
        if (recordCountField) {
            const headerRecordCount = parseInt(extractFieldValue(lines[0], recordCountField));
            if (headerRecordCount !== recordCount) {
                result.errors.push(`Header record count (${headerRecordCount}) does not match actual count (${recordCount})`);
                result.isValid = false;
            }
        }
    }

    // Validate trailer record count and total balance
    if (format.trailer) {
        const trailer = lines[lines.length - 1];
        const recordCountField = format.trailer.fields.find(f => f.name === 'recordCount');
        const balanceField = format.trailer.fields.find(f => f.name === 'totalBalance');

        if (recordCountField) {
            const trailerRecordCount = parseInt(extractFieldValue(trailer, recordCountField));
            if (trailerRecordCount !== recordCount) {
                result.errors.push(`Trailer record count (${trailerRecordCount}) does not match actual count (${recordCount})`);
                result.isValid = false;
            }
        }

        if (balanceField) {
            const trailerBalance = parseFloat(extractFieldValue(trailer, balanceField));
            if (Math.abs(trailerBalance - totalBalance) > 0.01) { // Allow for small floating-point differences
                result.errors.push(`Trailer total balance (${trailerBalance}) does not match actual total (${totalBalance})`);
                result.isValid = false;
            }
        }
    }

    return result;
}

export { FileFormat, RecordType, ValidationResult }; 