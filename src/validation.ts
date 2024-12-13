import { FieldDefinition, SqlType, InternalType } from './types';

const sqlTypeMap: Record<SqlType, { 
    internalType: InternalType;
    validateValue: (value: string, field: FieldDefinition) => string | null;
}> = {
    'CHAR': {
        internalType: 'string',
        validateValue: (value, field) => {
            if (field.length && value.length !== field.length) {
                return `Must be exactly ${field.length} characters`;
            }
            return null;
        }
    },
    'VARCHAR': {
        internalType: 'string',
        validateValue: (value, field) => {
            if (field.length && value.length > field.length) {
                return `Cannot exceed ${field.length} characters`;
            }
            return null;
        }
    },
    'INTEGER': {
        internalType: 'number',
        validateValue: (value) => {
            if (!Number.isInteger(Number(value))) {
                return 'Must be an integer';
            }
            return null;
        }
    },
    'DECIMAL': {
        internalType: 'number',
        validateValue: (value, field) => {
            const num = Number(value);
            if (isNaN(num)) {
                return 'Must be a decimal number';
            }
            if (field.precision !== undefined) {
                const parts = value.split('.');
                if (parts[1] && parts[1].length > (field.scale || 0)) {
                    return `Cannot exceed ${field.scale} decimal places`;
                }
                const totalDigits = parts.join('').length;
                if (totalDigits > field.precision) {
                    return `Total digits cannot exceed ${field.precision}`;
                }
            }
            return null;
        }
    },
    'NUMERIC': {
        internalType: 'number',
        validateValue: (value, field) => sqlTypeMap.DECIMAL.validateValue(value, field)
    },
    'DATE': {
        internalType: 'date',
        validateValue: (value) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return 'Invalid date format (YYYY-MM-DD)';
            }
            return null;
        }
    },
    'TIMESTAMP': {
        internalType: 'date',
        validateValue: (value) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return 'Invalid timestamp format (YYYY-MM-DD HH:mm:ss)';
            }
            return null;
        }
    },
    'TEXT': {
        internalType: 'string',
        validateValue: () => null
    }
};

export function validateField(field: FieldDefinition, value: string): string[] {
    const errors: string[] = [];

    if (field.required && !value.trim()) {
        errors.push('Field is required');
        return errors;
    }

    if (!value.trim()) {
        return errors;
    }

    // SQL type validation
    if (field.sqlType) {
        const sqlValidation = sqlTypeMap[field.sqlType].validateValue(value, field);
        if (sqlValidation) {
            errors.push(sqlValidation);
        }
    }

    // Standard validations
    if (field.validationPattern) {
        const regex = new RegExp(field.validationPattern);
        if (!regex.test(value)) {
            errors.push('Does not match pattern');
        }
    }

    if (field.type === 'number') {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            if (field.minValue !== undefined && numValue < field.minValue) {
                errors.push(`Value below minimum (${field.minValue})`);
            }
            if (field.maxValue !== undefined && numValue > field.maxValue) {
                errors.push(`Value above maximum (${field.maxValue})`);
            }
        }
    }

    const valueLength = value.length;
    if (field.minLength !== undefined && valueLength < field.minLength) {
        errors.push(`Length below minimum (${field.minLength})`);
    }
    if (field.maxLength !== undefined && valueLength > field.maxLength) {
        errors.push(`Length above maximum (${field.maxLength})`);
    }

    return errors;
}

export function parseSqlType(typeStr: string): { sqlType: SqlType; precision?: number; scale?: number } {
    const match = typeStr.match(/^(\w+)(?:\((\d+)(?:,(\d+))?\))?$/i);
    if (!match) {
        throw new Error(`Invalid SQL type format: ${typeStr}`);
    }

    const [, baseType, precisionStr, scaleStr] = match;
    const sqlType = baseType.toUpperCase() as SqlType;
    
    if (!sqlTypeMap[sqlType]) {
        throw new Error(`Unsupported SQL type: ${sqlType}`);
    }

    if (precisionStr) {
        const precision = parseInt(precisionStr);
        const scale = scaleStr ? parseInt(scaleStr) : undefined;
        return { sqlType, precision, scale };
    }

    return { sqlType };
} 