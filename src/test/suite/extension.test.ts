import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

describe('Extension Test Suite', () => {
    beforeAll(() => {
        vscode.window.showInformationMessage('Start all tests.');
    });

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('jjbono.vscode-fwf'));
    });

    test('Should activate extension for FWF files', async () => {
        const ext = vscode.extensions.getExtension('jjbono.vscode-fwf');
        assert.ok(ext);
        
        await ext.activate();
        assert.strictEqual(ext.isActive, true);

        // Create and open a .fwf file
        const tmpFile = path.join(__dirname, 'test.fwf');
        fs.writeFileSync(tmpFile, 'DTL12345John Smith           \n');
        
        const doc = await vscode.workspace.openTextDocument(tmpFile);
        await vscode.window.showTextDocument(doc);

        // Clean up
        fs.unlinkSync(tmpFile);
    });

    test('Should register all commands', async () => {
        const commands = await vscode.commands.getCommands();
        
        const expectedCommands = [
            'vscode-fwf.defineFormat',
            'vscode-fwf.importFormatFromCsv',
            'vscode-fwf.exportFormatToCsv',
            'vscode-fwf.saveFormat',
            'vscode-fwf.loadFormat',
            'vscode-fwf.exportToCsv',
            'vscode-fwf.validateFile'
        ];

        expectedCommands.forEach(cmd => {
            assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
        });
    });

    test('Should define format and validate file', async () => {
        // Create a test file
        const tmpFile = path.join(__dirname, 'test.fwf');
        const content = 'DTL12345John Smith           \n';
        fs.writeFileSync(tmpFile, content);
        
        // Open the file
        const doc = await vscode.workspace.openTextDocument(tmpFile);
        await vscode.window.showTextDocument(doc);

        // Define format
        await vscode.commands.executeCommand('vscode-fwf.defineFormat');
        
        // Wait for format definition
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Validate file
        await vscode.commands.executeCommand('vscode-fwf.validateFile');
        
        // Wait for validation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clean up
        fs.unlinkSync(tmpFile);
    });

    test('Should import format from CSV', async () => {
        // Create sample CSV file
        const csvFile = path.join(__dirname, 'format.csv');
        const csvContent = `Record Type,Field Name,Start Position,Length,SQL Type
DETAIL,id,0,5,CHAR(5)
DETAIL,name,5,20,VARCHAR(20)`;
        fs.writeFileSync(csvFile, csvContent);

        // Import format
        await vscode.commands.executeCommand('vscode-fwf.importFormatFromCsv');
        
        // Wait for import
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clean up
        fs.unlinkSync(csvFile);
    });

    test('Should export format to CSV', async () => {
        // Create and open a .fwf file
        const tmpFile = path.join(__dirname, 'test.fwf');
        fs.writeFileSync(tmpFile, 'DTL12345John Smith           \n');
        
        const doc = await vscode.workspace.openTextDocument(tmpFile);
        await vscode.window.showTextDocument(doc);

        // Define format
        await vscode.commands.executeCommand('vscode-fwf.defineFormat');
        
        // Wait for format definition
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Export format
        await vscode.commands.executeCommand('vscode-fwf.exportFormatToCsv');
        
        // Wait for export
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clean up
        fs.unlinkSync(tmpFile);
    });

    test('Should save and load format', async () => {
        // Define format
        await vscode.commands.executeCommand('vscode-fwf.defineFormat');
        
        // Wait for format definition
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Save format
        await vscode.commands.executeCommand('vscode-fwf.saveFormat');
        
        // Wait for save
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Load format
        await vscode.commands.executeCommand('vscode-fwf.loadFormat');
        
        // Wait for load
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
}); 