import * as vscode from 'vscode';
import type { Memento } from 'vscode';

export const mockStatusBarItem = {
    text: '',
    tooltip: '',
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn()
};

export const mockEditor = {
    document: {
        uri: { fsPath: '/test/file.fwf' },
        getText: jest.fn(),
        lineAt: jest.fn(),
        lineCount: 5
    },
    setDecorations: jest.fn()
};

export function createMockContext(): Partial<vscode.ExtensionContext> {
    return {
        subscriptions: [],
        workspaceState: {
            get: jest.fn(),
            update: jest.fn(),
            keys: jest.fn().mockReturnValue([])
        } as Memento,
        extensionPath: '/test/extension/path',
        asAbsolutePath: jest.fn(p => p),
        storagePath: '/test/storage/path',
        globalStoragePath: '/test/global/storage/path',
        globalState: {
            get: jest.fn(),
            update: jest.fn(),
            keys: jest.fn().mockReturnValue([]),
            setKeysForSync: jest.fn()
        } as vscode.Memento & { setKeysForSync(keys: readonly string[]): void },
        logPath: '/test/log/path',
        extensionUri: vscode.Uri.file('/test/extension/path'),
        environmentVariableCollection: {
            persistent: true,
            description: 'Test Collection',
            replace: jest.fn(),
            append: jest.fn(),
            prepend: jest.fn(),
            get: jest.fn(),
            forEach: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            getScoped: jest.fn(),
            [Symbol.iterator]: jest.fn(() => ({
                next: jest.fn(() => ({ done: true, value: undefined }))
            }))
        } as unknown as vscode.GlobalEnvironmentVariableCollection,
        extensionMode: 3,
        globalStorageUri: vscode.Uri.file('/test/global/storage'),
        logUri: vscode.Uri.file('/test/log'),
        storageUri: vscode.Uri.file('/test/storage'),
        secrets: {
            store: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            onDidChange: jest.fn()
        } as unknown as vscode.SecretStorage,
        extension: {
            id: 'test-extension',
            extensionUri: vscode.Uri.file('/test/extension/path'),
            extensionPath: '/test/extension/path',
            isActive: true,
            packageJSON: {},
            exports: undefined,
            activate: jest.fn().mockResolvedValue(undefined),
            extensionKind: 2
        },
        languageModelAccessInformation: {} as vscode.LanguageModelAccessInformation
    };
}

export function setupVSCodeMock(): void {
    jest.mock('vscode', () => ({
        window: {
            createStatusBarItem: jest.fn(() => mockStatusBarItem),
            showInputBox: jest.fn(),
            showQuickPick: jest.fn(),
            showInformationMessage: jest.fn(),
            showErrorMessage: jest.fn(),
            createTextEditorDecorationType: jest.fn(() => ({
                dispose: jest.fn()
            })),
            activeTextEditor: undefined,
            showTextDocument: jest.fn()
        },
        workspace: {
            getConfiguration: jest.fn(() => ({
                get: jest.fn(),
                update: jest.fn()
            })),
            openTextDocument: jest.fn(),
            fs: {
                readFile: jest.fn(),
                writeFile: jest.fn()
            }
        },
        commands: {
            registerCommand: jest.fn().mockImplementation(() => ({
                dispose: jest.fn()
            })),
            executeCommand: jest.fn(),
            getCommands: jest.fn().mockResolvedValue([
                'vscode-fwf.defineFormat',
                'vscode-fwf.importFormatFromCsv',
                'vscode-fwf.exportFormatToCsv',
                'vscode-fwf.saveFormat',
                'vscode-fwf.loadFormat',
                'vscode-fwf.exportToCsv',
                'vscode-fwf.validateFile'
            ])
        },
        languages: {
            registerHoverProvider: jest.fn()
        },
        StatusBarAlignment: {
            Right: 1
        },
        Uri: {
            file: jest.fn(path => ({ fsPath: path }))
        },
        Position: jest.fn(),
        Range: jest.fn(),
        ConfigurationTarget: {
            Global: 1
        },
        ExtensionKind: {
            UI: 1,
            Workspace: 2
        },
        ExtensionMode: {
            Production: 1,
            Development: 2,
            Test: 3
        },
        EventEmitter: jest.fn().mockImplementation(() => ({
            event: jest.fn(),
            fire: jest.fn(),
            dispose: jest.fn()
        })),
        SecretStorageChangeEvent: jest.fn().mockImplementation((key: string) => ({
            key
        })),
        extensions: {
            getExtension: jest.fn().mockReturnValue({
                id: 'test-extension',
                extensionUri: vscode.Uri.file('/test/extension/path'),
                extensionPath: '/test/extension/path',
                isActive: true,
                packageJSON: {},
                exports: undefined,
                activate: jest.fn().mockResolvedValue(undefined),
                extensionKind: 2
            })
        }
    }));
} 