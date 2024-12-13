import { validateField } from '../../validation';
import { FieldDefinition } from '../../types';

describe('Field Validation', () => {
    describe('validateField', () => {
        it('should validate required fields', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 5,
                required: true
            };

            expect(validateField(field, '')).toContain('Field is required');
            expect(validateField(field, '  ')).toContain('Field is required');
            expect(validateField(field, 'value')).toHaveLength(0);
        });

        it('should validate CHAR type', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 5,
                sqlType: 'CHAR'
            };

            expect(validateField(field, 'abc')).toContain('Must be exactly 5 characters');
            expect(validateField(field, 'abcde')).toHaveLength(0);
        });

        it('should validate VARCHAR type', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 5,
                sqlType: 'VARCHAR'
            };

            expect(validateField(field, 'abcdef')).toContain('Cannot exceed 5 characters');
            expect(validateField(field, 'abc')).toHaveLength(0);
            expect(validateField(field, 'abcde')).toHaveLength(0);
        });

        it('should validate INTEGER type', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 5,
                sqlType: 'INTEGER'
            };

            expect(validateField(field, 'abc')).toContain('Must be an integer');
            expect(validateField(field, '12.34')).toContain('Must be an integer');
            expect(validateField(field, '123')).toHaveLength(0);
        });

        it('should validate DECIMAL type', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 8,
                sqlType: 'DECIMAL',
                precision: 5,
                scale: 2
            };

            expect(validateField(field, 'abc')).toContain('Must be a decimal number');
            expect(validateField(field, '123.456')).toContain('Cannot exceed 2 decimal places');
            expect(validateField(field, '1234.56')).toContain('Total digits cannot exceed 5');
            expect(validateField(field, '123.45')).toHaveLength(0);
        });

        it('should validate DATE type', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 10,
                sqlType: 'DATE'
            };

            expect(validateField(field, 'abc')).toContain('Invalid date format (YYYY-MM-DD)');
            expect(validateField(field, '2024-13-01')).toContain('Invalid date format (YYYY-MM-DD)');
            expect(validateField(field, '2024-01-32')).toContain('Invalid date format (YYYY-MM-DD)');
            expect(validateField(field, '2024-01-01')).toHaveLength(0);
        });

        it('should validate custom patterns', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 5,
                validationPattern: '^[A-Z]{2}\\d{3}$'
            };

            expect(validateField(field, 'abc12')).toContain('Does not match pattern');
            expect(validateField(field, '12ABC')).toContain('Does not match pattern');
            expect(validateField(field, 'AB123')).toHaveLength(0);
        });

        it('should validate numeric ranges', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 5,
                type: 'number',
                minValue: 1,
                maxValue: 100
            };

            expect(validateField(field, '0')).toContain('Value below minimum (1)');
            expect(validateField(field, '101')).toContain('Value above maximum (100)');
            expect(validateField(field, '50')).toHaveLength(0);
        });

        it('should validate length constraints', () => {
            const field: FieldDefinition = {
                name: 'test',
                start: 0,
                length: 10,
                minLength: 3,
                maxLength: 5
            };

            expect(validateField(field, 'ab')).toContain('Length below minimum (3)');
            expect(validateField(field, 'abcdef')).toContain('Length above maximum (5)');
            expect(validateField(field, 'abcd')).toHaveLength(0);
        });
    });
}); 