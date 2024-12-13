import * as vscode from 'vscode';
import { activate, deactivate } from '../../extension';
import { mockStatusBarItem, mockEditor, createMockContext, setupVSCodeMock } from '../test-utils';

setupVSCodeMock();

describe('Extension Integration', () => {
    let mockContext: vscode.ExtensionContext;

    beforeAll(async () => {
        mockContext = createMockContext() as vscode.ExtensionContext;

        // Set up the active editor
        const mockedWindow = vscode.window as unknown as { activeTextEditor: typeof mockEditor };
        mockedWindow.activeTextEditor = mockEditor;

        // Activate the extension
        await activate(mockContext);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        const mockedWindow = vscode.window as unknown as { activeTextEditor: typeof mockEditor };
        mockedWindow.activeTextEditor = mockEditor;
    });

    afterEach(() => {
        deactivate();
        mockStatusBarItem.dispose();
    });

    describe('Command Registration', () => {
        it('should register all commands', async () => {
            const commands = await vscode.commands.getCommands();
            expect(commands).toContain('vscode-fwf.defineFormat');
            expect(commands).toContain('vscode-fwf.importFormatFromCsv');
            expect(commands).toContain('vscode-fwf.exportFormatToCsv');
            expect(commands).toContain('vscode-fwf.saveFormat');
            expect(commands).toContain('vscode-fwf.loadFormat');
            expect(commands).toContain('vscode-fwf.exportToCsv');
            expect(commands).toContain('vscode-fwf.validateFile');
        });
    });

    describe('Format Definition', () => {
        it('should define format through command', async () => {
            const input = 'id,0,5,string;name,5,20,string';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(input);

            await vscode.commands.executeCommand('vscode-fwf.defineFormat');

            expect(mockStatusBarItem.show).toHaveBeenCalled();
            expect(mockEditor.setDecorations).toHaveBeenCalled();
        });
    });

    describe('CSV Import/Export', () => {
        it('should import format from CSV', async () => {
            const csvContent = `Record Type,Record Identifier,Identifier Start,Identifier Length,Field Name,Start Position,Length,SQL Type,Description,Required
DETAIL,DTL,0,3,id,3,5,CHAR(5),Customer ID,true`;

            (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValue(Buffer.from(csvContent));
            await vscode.commands.executeCommand('vscode-fwf.importFormatFromCsv');

            expect(mockStatusBarItem.show).toHaveBeenCalled();
            expect(mockEditor.setDecorations).toHaveBeenCalled();
        });
    });

    describe('File Validation', () => {
        it('should validate file content', async () => {
            // First define a format
            const input = 'id,0,5,string;name,5,20,string';
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(input);
            await vscode.commands.executeCommand('vscode-fwf.defineFormat');

            // Mock file content
            const fileContent = 'AB123John Doe            ';
            (mockEditor.document.getText as jest.Mock).mockReturnValue(fileContent);

            await vscode.commands.executeCommand('vscode-fwf.validateFile');

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('File is valid')
            );
        });
    });
}); 