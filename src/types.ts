export type SqlType = 'CHAR' | 'VARCHAR' | 'INTEGER' | 'DECIMAL' | 'NUMERIC' | 'DATE' | 'TIMESTAMP' | 'TEXT';
export type InternalType = 'string' | 'number' | 'date';

export interface FieldDefinition {
    name: string;
    start: number;
    length: number;
    type?: InternalType;
    sqlType?: SqlType;
    format?: string;
    description?: string;
    required?: boolean;
    defaultValue?: string;
    validationPattern?: string;
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    precision?: number;
    scale?: number;
}

export interface RecordType {
    name: string;
    description?: string;
    identifier: {
        start: number;
        length: number;
        value: string;
    };
    fields: FieldDefinition[];
}

export interface FileFormat {
    name: string;
    recordTypes: RecordType[];
    header?: RecordType;
    trailer?: RecordType;
    recordLength: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface RecordValidationContext {
    lineNumber: number;
    recordCount: number;
    totalBalance: number;
    seenRecordTypes: Set<string>;
} 