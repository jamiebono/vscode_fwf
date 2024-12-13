import * as vscode from 'vscode';
import { FileFormat } from './types';
import { importFormatFromCsv, exportFormatToCsv } from './csv';

let currentFormat: FileFormat | undefined;
let statusBarItem: vscode.StatusBarItem;

// Create decoration types for different field types
const decorationTypes = {
    string: vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(65, 105, 225, 0.1)',
        borderWidth: '0 1px 0 0',
        borderStyle: 'solid',
        borderColor: 'rgba(65, 105, 225, 0.3)'
    }),
    number: vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(50, 205, 50, 0.1)',
        borderWidth: '0 1px 0 0',
        borderStyle: 'solid',
        borderColor: 'rgba(50, 205, 50, 0.3)'
    }),
    date: vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderWidth: '0 1px 0 0',
        borderStyle: 'solid',
        borderColor: 'rgba(255, 165, 0, 0.3)'
    })
};

function updateStatusBar(): void {
    if (currentFormat) {
        statusBarItem.text = `$(file) FWF: ${currentFormat.name || 'Unnamed Format'}`;
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}

async function defineFormatCommand(): Promise<void> {
    try {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter field definitions (name,start,length[,type];name2,start2,length2[,type2]...)',
            placeHolder: 'e.g., id,0,5,string;name,5,20,string;date,25,8,date'
        });

        if (!input) {
            return;
        }

        const fields = input.split(';').map(fieldStr => {
            const [name, start, length, type] = fieldStr.split(',').map(s => s.trim());
            return {
                name,
                start: parseInt(start),
                length: parseInt(length),
                type: type as 'string' | 'number' | 'date' | undefined
            };
        });

        // Create a default detail record type
        const detailType = {
            name: 'DETAIL',
            identifier: {
                start: 0,
                length: 0,
                value: ''
            },
            fields
        };

        const recordLength = Math.max(...fields.map(f => f.start + f.length));
        currentFormat = { 
            name: 'Unnamed Format',
            recordTypes: [detailType],
            recordLength
        };

        updateStatusBar();
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        vscode.window.showErrorMessage(`Failed to define format: ${message}`);
    }
}

async function importFormatCommand(): Promise<void> {
    try {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            filters: {
                'CSV Files': ['csv']
            },
            title: 'Select Format Definition CSV'
        };

        const fileUri = await vscode.window.showOpenDialog(options);
        if (!fileUri || fileUri.length === 0) {
            return;
        }

        const content = await vscode.workspace.fs.readFile(fileUri[0]);
        const csvContent = Buffer.from(content).toString('utf8');
        currentFormat = importFormatFromCsv(csvContent);

        updateStatusBar();
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }

        vscode.window.showInformationMessage(`Format '${currentFormat.name}' imported successfully`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        vscode.window.showErrorMessage(`Failed to import format: ${message}`);
    }
}

async function exportFormatCommand(): Promise<void> {
    if (!currentFormat) {
        vscode.window.showErrorMessage('No format defined to export');
        return;
    }

    try {
        const csvContent = exportFormatToCsv(currentFormat);
        const defaultPath = currentFormat.name ? 
            `${currentFormat.name}_format.csv` : 
            'format_definition.csv';
        
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultPath),
            filters: { 'CSV files': ['csv'] }
        });

        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(csvContent, 'utf8'));
            vscode.window.showInformationMessage(`Format exported to ${uri.fsPath}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        vscode.window.showErrorMessage(`Failed to export format: ${message}`);
    }
}

async function saveFormatCommand(): Promise<void> {
    if (!currentFormat) {
        vscode.window.showErrorMessage('No format defined to save');
        return;
    }

    const formatName = await vscode.window.showInputBox({
        prompt: 'Enter a name for this format',
        placeHolder: 'e.g., CustomerRecord'
    });

    if (!formatName) {
        return;
    }

    const config = vscode.workspace.getConfiguration('fwf');
    const savedFormats = config.get<Record<string, FileFormat>>('savedFormats') || {};
    savedFormats[formatName] = { ...currentFormat, name: formatName };

    await config.update('savedFormats', savedFormats, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`Format '${formatName}' saved successfully`);
}

async function loadFormatCommand(): Promise<void> {
    const config = vscode.workspace.getConfiguration('fwf');
    const savedFormats = config.get<Record<string, FileFormat>>('savedFormats') || {};
    const formatNames = Object.keys(savedFormats);

    if (formatNames.length === 0) {
        vscode.window.showInformationMessage('No saved formats found');
        return;
    }

    const selectedName = await vscode.window.showQuickPick(formatNames, {
        placeHolder: 'Select a format to load'
    });

    if (selectedName && savedFormats[selectedName]) {
        currentFormat = savedFormats[selectedName];
        updateStatusBar();
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }
        vscode.window.showInformationMessage(`Format '${selectedName}' loaded successfully`);
    }
}

function updateDecorations(editor: vscode.TextEditor): void {
    if (!currentFormat) {
        return;
    }

    try {
        const fieldDecorationsByType: Record<string, vscode.DecorationOptions[]> = {
            string: [],
            number: [],
            date: []
        };

        const document = editor.document;

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            if (line.trim().length === 0) {
                continue;
            }

            currentFormat.recordTypes[0].fields.forEach(field => {
                if (field.start + field.length <= line.length) {
                    const range = new vscode.Range(
                        new vscode.Position(i, field.start),
                        new vscode.Position(i, field.start + field.length)
                    );

                    const type = field.type || 'string';
                    if (fieldDecorationsByType[type]) {
                        fieldDecorationsByType[type].push({ range });
                    }
                }
            });
        }

        // Apply field type decorations
        Object.entries(fieldDecorationsByType).forEach(([type, decorations]) => {
            editor.setDecorations(decorationTypes[type as keyof typeof decorationTypes], decorations);
        });
    } catch (error) {
        console.error('Error updating decorations:', error);
    }
}

export function activate(context: vscode.ExtensionContext): void {
    console.log('FWF extension is now active');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);

    // Register commands
    const commands = {
        defineFormat: vscode.commands.registerCommand('vscode-fwf.defineFormat', defineFormatCommand),
        importFormatFromCsv: vscode.commands.registerCommand('vscode-fwf.importFormatFromCsv', importFormatCommand),
        exportFormatToCsv: vscode.commands.registerCommand('vscode-fwf.exportFormatToCsv', exportFormatCommand),
        saveFormat: vscode.commands.registerCommand('vscode-fwf.saveFormat', saveFormatCommand),
        loadFormat: vscode.commands.registerCommand('vscode-fwf.loadFormat', loadFormatCommand)
    };

    // Register event handlers
    const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && currentFormat) {
            updateDecorations(editor);
            updateStatusBar();
        }
    });

    const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document && currentFormat) {
            updateDecorations(editor);
        }
    });

    // Add subscriptions
    Object.values(commands).forEach(command => context.subscriptions.push(command));
    context.subscriptions.push(editorChangeDisposable, documentChangeDisposable);
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
    Object.values(decorationTypes).forEach(d => d.dispose());
} 