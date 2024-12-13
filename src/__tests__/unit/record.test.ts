import { getRecordType, validateRecord, validateRecordSequence } from '../../record';
import { FileFormat, RecordType } from '../../types';

describe('Record Operations', () => {
    const sampleFormat: FileFormat = {
        name: 'Test Format',
        recordTypes: [{
            name: 'DETAIL',
            identifier: {
                start: 0,
                length: 3,
                value: 'DTL'
            },
            fields: [{
                name: 'id',
                start: 3,
                length: 5,
                sqlType: 'CHAR',
                required: true
            }]
        }],
        header: {
            name: 'HEADER',
            identifier: {
                start: 0,
                length: 3,
                value: 'HDR'
            },
            fields: [{
                name: 'date',
                start: 3,
                length: 8,
                sqlType: 'DATE',
                required: true
            }]
        },
        trailer: {
            name: 'TRAILER',
            identifier: {
                start: 0,
                length: 3,
                value: 'TRL'
            },
            fields: [{
                name: 'count',
                start: 3,
                length: 6,
                sqlType: 'INTEGER',
                required: true
            }]
        },
        recordLength: 11
    };

    describe('getRecordType', () => {
        it('should identify header record', () => {
            const line = 'HDR20240101';
            const recordType = getRecordType(line, sampleFormat);
            expect(recordType).toBe(sampleFormat.header);
        });

        it('should identify detail record', () => {
            const line = 'DTLAB123';
            const recordType = getRecordType(line, sampleFormat);
            expect(recordType).toBe(sampleFormat.recordTypes[0]);
        });

        it('should identify trailer record', () => {
            const line = 'TRL000123';
            const recordType = getRecordType(line, sampleFormat);
            expect(recordType).toBe(sampleFormat.trailer);
        });

        it('should return undefined for unknown record type', () => {
            const line = 'XXX12345';
            const recordType = getRecordType(line, sampleFormat);
            expect(recordType).toBeUndefined();
        });

        it('should handle line shorter than identifier', () => {
            const line = 'HD';
            const recordType = getRecordType(line, sampleFormat);
            expect(recordType).toBeUndefined();
        });
    });

    describe('validateRecord', () => {
        const headerRecord: RecordType = {
            name: 'HEADER',
            identifier: { start: 0, length: 3, value: 'HDR' },
            fields: [{
                name: 'date',
                start: 3,
                length: 8,
                sqlType: 'DATE',
                required: true
            }]
        };

        it('should validate valid header record', () => {
            const line = 'HDR2024-01-01';
            const result = validateRecord(line, headerRecord);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect record too short', () => {
            const line = 'HDR2024';
            const result = validateRecord(line, headerRecord);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Record is too short');
        });

        it('should validate required fields', () => {
            const line = 'HDR        ';
            const result = validateRecord(line, headerRecord);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Field date: Field is required');
        });

        it('should validate date format', () => {
            const line = 'HDR20241301'; // Invalid month
            const result = validateRecord(line, headerRecord);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Field date: Invalid date format');
        });

        it('should validate multiple fields', () => {
            const detailRecord: RecordType = {
                name: 'DETAIL',
                identifier: { start: 0, length: 3, value: 'DTL' },
                fields: [
                    {
                        name: 'id',
                        start: 3,
                        length: 5,
                        sqlType: 'CHAR',
                        required: true,
                        validationPattern: '^[A-Z]{2}\\d{3}$'
                    },
                    {
                        name: 'amount',
                        start: 8,
                        length: 10,
                        sqlType: 'DECIMAL',
                        required: true,
                        precision: 10,
                        scale: 2
                    }
                ]
            };

            const line = 'DTL12345ABCD.EF   '; // Invalid ID format and invalid decimal
            const result = validateRecord(line, detailRecord);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors[0]).toContain('Field id: Does not match pattern');
            expect(result.errors[1]).toContain('Field amount: Must be a decimal number');
        });

        it('should handle optional fields', () => {
            const recordType: RecordType = {
                name: 'DETAIL',
                identifier: { start: 0, length: 3, value: 'DTL' },
                fields: [{
                    name: 'notes',
                    start: 3,
                    length: 10,
                    required: false
                }]
            };

            const line = 'DTL          '; // Empty optional field
            const result = validateRecord(line, recordType);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('validateRecordSequence', () => {
        const format: FileFormat = {
            name: 'Test Format',
            recordTypes: [{
                name: 'DETAIL',
                identifier: {
                    start: 0,
                    length: 3,
                    value: 'DTL'
                },
                fields: [{
                    name: 'id',
                    start: 3,
                    length: 5,
                    sqlType: 'CHAR',
                    required: true
                }, {
                    name: 'balance',
                    start: 8,
                    length: 10,
                    sqlType: 'DECIMAL',
                    precision: 10,
                    scale: 2,
                    required: true
                }]
            }],
            header: {
                name: 'HEADER',
                identifier: {
                    start: 0,
                    length: 3,
                    value: 'HDR'
                },
                fields: [{
                    name: 'recordCount',
                    start: 3,
                    length: 6,
                    sqlType: 'INTEGER',
                    required: true
                }]
            },
            trailer: {
                name: 'TRAILER',
                identifier: {
                    start: 0,
                    length: 3,
                    value: 'TRL'
                },
                fields: [{
                    name: 'recordCount',
                    start: 3,
                    length: 6,
                    sqlType: 'INTEGER',
                    required: true
                }, {
                    name: 'totalBalance',
                    start: 9,
                    length: 12,
                    sqlType: 'DECIMAL',
                    precision: 12,
                    scale: 2,
                    required: true
                }]
            },
            recordLength: 21
        };

        it('should validate a valid file with header and trailer', () => {
            const lines = [
                'HDR000002',
                'DTLAB123  100.00',
                'DTLCD456  200.00',
                'TRL000002000300.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect missing header record', () => {
            const lines = [
                'DTLAB123  100.00',
                'TRL000001000100.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('File must start with a header record');
        });

        it('should detect missing trailer record', () => {
            const lines = [
                'HDR000001',
                'DTLAB123  100.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('File must end with a trailer record');
        });

        it('should detect invalid record type', () => {
            const lines = [
                'HDR000002',
                'DTLAB123  100.00',
                'XXX000000',
                'TRL000002000100.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Line 3: Invalid record type');
        });

        it('should detect header record count mismatch', () => {
            const lines = [
                'HDR000003',
                'DTLAB123  100.00',
                'DTLCD456  200.00',
                'TRL000002000300.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Header record count (3) does not match actual count (2)');
        });

        it('should detect trailer record count mismatch', () => {
            const lines = [
                'HDR000002',
                'DTLAB123  100.00',
                'DTLCD456  200.00',
                'TRL000003000300.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Trailer record count (3) does not match actual count (2)');
        });

        it('should detect trailer balance mismatch', () => {
            const lines = [
                'HDR000002',
                'DTLAB123  100.00',
                'DTLCD456  200.00',
                'TRL000002000400.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Trailer total balance (400.00) does not match actual total (300.00)');
        });

        it('should handle empty file', () => {
            const result = validateRecordSequence([], format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('File must start with a header record');
        });

        it('should handle header in wrong position', () => {
            const lines = [
                'DTLAB123  100.00',
                'HDR000001',
                'TRL000001000100.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('File must start with a header record');
            expect(result.errors).toContain('Line 2: Header record can only appear at the start');
        });

        it('should handle trailer in wrong position', () => {
            const lines = [
                'HDR000002',
                'TRL000002000200.00',
                'DTLAB123  100.00'
            ];

            const result = validateRecordSequence(lines, format);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Line 2: Trailer record can only appear at the end');
        });
    });
}); 