const vscode = {
    window: {
        createStatusBarItem: jest.fn(() => ({
            text: '',
            tooltip: '',
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn()
        })),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showInputBox: jest.fn(),
        showQuickPick: jest.fn(),
        showOpenDialog: jest.fn(),
        showSaveDialog: jest.fn(),
        createTextEditorDecorationType: jest.fn(() => ({
            dispose: jest.fn()
        })),
        activeTextEditor: {
            document: {
                getText: jest.fn(),
                lineAt: jest.fn(),
                uri: { fsPath: '/test/file.fwf' }
            },
            setDecorations: jest.fn()
        }
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn(),
            update: jest.fn()
        })),
        openTextDocument: jest.fn(),
        workspaceFolders: [{ uri: { fsPath: '/test' } }]
    },
    commands: {
        registerCommand: jest.fn(),
        executeCommand: jest.fn(),
        getCommands: jest.fn(() => Promise.resolve([]))
    },
    languages: {
        registerHoverProvider: jest.fn()
    },
    StatusBarAlignment: {
        Left: 1,
        Right: 2
    },
    Range: jest.fn((startLine, startChar, endLine, endChar) => ({
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar }
    })),
    Position: jest.fn((line, char) => ({ line, character: char })),
    Uri: {
        file: jest.fn(path => ({ fsPath: path })),
        parse: jest.fn()
    },
    ConfigurationTarget: {
        Global: 1,
        Workspace: 2,
        WorkspaceFolder: 3
    },
    extensions: {
        getExtension: jest.fn(() => ({
            activate: jest.fn(),
            exports: {}
        }))
    }
};

module.exports = vscode; 