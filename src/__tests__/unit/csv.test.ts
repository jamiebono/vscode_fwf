import { importFormatFromCsv, exportFormatToCsv } from '../../csv';
import { FileFormat } from '../../types';

describe('CSV Format Operations', () => {
    const sampleCsvContent = `Record Type,Record Identifier,Identifier Start,Identifier Length,Field Name,Start Position,Length,SQL Type,Description,Required
HEADER,HDR,0,3,recordType,0,3,CHAR(3),Record Type Indicator,true
DETAIL,DTL,0,3,id,3,5,CHAR(5),Customer ID,true
TRAILER,TRL,0,3,recordCount,3,6,INTEGER,Record Count,true`;

    const expectedFormat: FileFormat = {
        name: 'Imported Format',
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
                required: true,
                description: 'Customer ID'
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
                name: 'recordType',
                start: 0,
                length: 3,
                sqlType: 'CHAR',
                required: true,
                description: 'Record Type Indicator'
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
                required: true,
                description: 'Record Count'
            }]
        },
        recordLength: 9
    };

    describe('importFormatFromCsv', () => {
        it('should correctly parse CSV content into FileFormat', () => {
            const format = importFormatFromCsv(sampleCsvContent);
            expect(format).toMatchObject(expectedFormat);
        });

        it('should handle empty CSV content', () => {
            expect(() => importFormatFromCsv('')).toThrow('CSV content is empty');
        });

        it('should handle invalid CSV content', () => {
            expect(() => importFormatFromCsv('invalid,csv,content')).toThrow('Invalid CSV format');
        });

        it('should calculate correct record length', () => {
            const format = importFormatFromCsv(sampleCsvContent);
            expect(format.recordLength).toBe(9); // max(3+3, 3+5, 3+6)
        });

        it('should handle optional fields', () => {
            const csvWithOptionals = `${sampleCsvContent}
DETAIL,DTL,0,3,notes,8,20,TEXT,Optional Notes,false`;
            const format = importFormatFromCsv(csvWithOptionals);
            expect(format.recordTypes[0].fields).toHaveLength(2);
            expect(format.recordTypes[0].fields[1].required).toBe(false);
        });
    });

    describe('exportFormatToCsv', () => {
        it('should correctly export FileFormat to CSV', () => {
            const csv = exportFormatToCsv(expectedFormat);
            const lines = csv.split('\n');
            expect(lines[0]).toContain('Record Type,Record Identifier');
            expect(lines).toHaveLength(4); // header row + 3 record definitions
        });

        it('should handle format without header/trailer', () => {
            const simpleFormat: FileFormat = {
                name: 'Simple Format',
                recordTypes: [{
                    name: 'DETAIL',
                    identifier: { start: 0, length: 3, value: 'DTL' },
                    fields: [{
                        name: 'id',
                        start: 0,
                        length: 5,
                        type: 'string'
                    }]
                }],
                recordLength: 5
            };
            const csv = exportFormatToCsv(simpleFormat);
            const lines = csv.split('\n');
            expect(lines).toHaveLength(2); // header row + 1 record definition
        });

        it('should include all field metadata', () => {
            const format: FileFormat = {
                name: 'Test Format',
                recordTypes: [{
                    name: 'DETAIL',
                    identifier: { start: 0, length: 3, value: 'DTL' },
                    fields: [{
                        name: 'test',
                        start: 0,
                        length: 5,
                        sqlType: 'VARCHAR',
                        description: 'Test field',
                        required: true,
                        defaultValue: 'test',
                        validationPattern: '^\\w+$',
                        minValue: 0,
                        maxValue: 100,
                        minLength: 1,
                        maxLength: 5
                    }]
                }],
                recordLength: 5
            };
            const csv = exportFormatToCsv(format);
            const lines = csv.split('\n');
            const detailLine = lines[1];
            expect(detailLine).toContain('VARCHAR');
            expect(detailLine).toContain('Test field');
            expect(detailLine).toContain('true');
            expect(detailLine).toContain('test');
            expect(detailLine).toContain('^\\w+$');
        });
    });
}); 