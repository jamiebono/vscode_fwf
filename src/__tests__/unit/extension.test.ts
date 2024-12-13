import * as vscode from 'vscode';
import { activate, deactivate } from '../../extension';
import { FileFormat } from '../../types';
import { mockStatusBarItem, mockEditor, createMockContext, setupVSCodeMock } from '../test-utils';

setupVSCodeMock();

describe('Extension', () => {
    let mockContext: vscode.ExtensionContext;

    beforeAll(() => {
        mockContext = createMockContext() as vscode.ExtensionContext;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        const mockedWindow = vscode.window as unknown as { activeTextEditor: typeof mockEditor };
        mockedWindow.activeTextEditor = mockEditor;
    });

    describe('activate', () => {
        it('should register commands and create status bar item', () => {
            activate(mockContext as vscode.ExtensionContext);
            expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
            expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(7);
            expect(mockContext.subscriptions?.length).toBeGreaterThan(0);
        });

        it('should restore saved format', () => {
            const savedFormat: FileFormat = {
                name: 'Saved Format',
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

            (mockContext.workspaceState.get as jest.Mock).mockReturnValue(savedFormat);
            activate(mockContext as vscode.ExtensionContext);
            expect(mockStatusBarItem.text).toContain('Saved Format');
            expect(mockStatusBarItem.show).toHaveBeenCalled();
        });
    });

    describe('deactivate', () => {
        it('should dispose of status bar item and decorations', () => {
            activate(mockContext as vscode.ExtensionContext);
            deactivate();
            expect(mockStatusBarItem.dispose).toHaveBeenCalled();
        });
    });

    describe('commands', () => {
        beforeEach(() => {
            activate(mockContext as vscode.ExtensionContext);
        });

        it('should define format from user input', async () => {
            const input = 'id,0,5,string;name,5,20,string';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(input);

            await vscode.commands.executeCommand('vscode-fwf.defineFormat');

            expect(mockStatusBarItem.show).toHaveBeenCalled();
            expect(mockEditor.setDecorations).toHaveBeenCalled();
        });

        it('should handle invalid format input', async () => {
            const input = 'invalid format';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(input);

            await vscode.commands.executeCommand('vscode-fwf.defineFormat');

            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });

        it('should save format to workspace state', async () => {
            const formatName = 'Test Format';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(formatName);

            // First define a format
            const input = 'id,0,5,string';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(input);
            await vscode.commands.executeCommand('vscode-fwf.defineFormat');

            // Then save it
            await vscode.commands.executeCommand('vscode-fwf.saveFormat');

            expect(vscode.workspace.getConfiguration().update).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('saved successfully')
            );
        });

        it('should handle save format with no current format', async () => {
            await vscode.commands.executeCommand('vscode-fwf.saveFormat');

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'No format defined to save'
            );
        });

        it('should load format from workspace state', async () => {
            const savedFormats = {
                'Test Format': {
                    name: 'Test Format',
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
                }
            };

            (vscode.workspace.getConfiguration().get as jest.Mock).mockReturnValue(savedFormats);
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue('Test Format');

            await vscode.commands.executeCommand('vscode-fwf.loadFormat');

            expect(mockStatusBarItem.text).toContain('Test Format');
            expect(mockStatusBarItem.show).toHaveBeenCalled();
            expect(mockEditor.setDecorations).toHaveBeenCalled();
        });

        it('should handle load format with no saved formats', async () => {
            (vscode.workspace.getConfiguration().get as jest.Mock).mockReturnValue({});

            await vscode.commands.executeCommand('vscode-fwf.loadFormat');

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'No saved formats found'
            );
        });

        it('should handle CSV import with file selection cancelled', async () => {
            (vscode.window.showOpenDialog as jest.Mock).mockResolvedValue(undefined);

            await vscode.commands.executeCommand('vscode-fwf.importFormatFromCsv');

            expect(mockStatusBarItem.show).not.toHaveBeenCalled();
            expect(mockEditor.setDecorations).not.toHaveBeenCalled();
        });

        it('should handle CSV import with invalid content', async () => {
            (vscode.window.showOpenDialog as jest.Mock).mockResolvedValue([{ fsPath: '/test/format.csv' }]);
            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('invalid,csv,content'));

            await vscode.commands.executeCommand('vscode-fwf.importFormatFromCsv');

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Failed to import format')
            );
        });

        it('should handle CSV export with no current format', async () => {
            await vscode.commands.executeCommand('vscode-fwf.exportFormatToCsv');

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'No format defined to export'
            );
        });

        it('should handle CSV export with save dialog cancelled', async () => {
            // First define a format
            const input = 'id,0,5,string';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(input);
            await vscode.commands.executeCommand('vscode-fwf.defineFormat');

            // Then try to export it
            (vscode.window.showSaveDialog as jest.Mock).mockResolvedValue(undefined);

            await vscode.commands.executeCommand('vscode-fwf.exportFormatToCsv');

            expect(vscode.workspace.fs.writeFile).not.toHaveBeenCalled();
        });

        it('should handle file validation with no format defined', async () => {
            await vscode.commands.executeCommand('vscode-fwf.validateFile');

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                'No format defined for validation'
            );
        });

        it('should handle file validation with empty file', async () => {
            // First define a format
            const input = 'id,0,5,string';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(input);
            await vscode.commands.executeCommand('vscode-fwf.defineFormat');

            // Mock empty file content
            (mockEditor.document.getText as jest.Mock).mockReturnValue('');

            await vscode.commands.executeCommand('vscode-fwf.validateFile');

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('File is empty')
            );
        });

        it('should handle file validation with invalid content', async () => {
            // First define a format
            const input = 'id,0,5,string';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(input);
            await vscode.commands.executeCommand('vscode-fwf.defineFormat');

            // Mock invalid file content
            (mockEditor.document.getText as jest.Mock).mockReturnValue('invalid content');

            await vscode.commands.executeCommand('vscode-fwf.validateFile');

            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                expect.stringContaining('Validation failed')
            );
        });
    });
}); 