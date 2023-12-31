/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import {
	workspace,
	ExtensionContext,
	HoverProvider,
	CancellationToken,
	Hover,
	Position,
	TextDocument,
	languages,
	DocumentColorProvider,
	ColorInformation,
	ColorPresentation,
	Range,
	Color,
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

class GoColorProvider implements DocumentColorProvider {
	public provideDocumentColors(
		document: TextDocument,
		token: CancellationToken
	): Thenable<ColorInformation[]> {
		return Promise.resolve([
			new ColorInformation(new Range(1, 1, 5, 5), new Color(255, 100, 255, 255)),
		]);
	}
	public provideColorPresentations(
		color: Color,
		context: { document: TextDocument; range: Range },
		token: CancellationToken
	): Thenable<ColorPresentation[]> {
		return Promise.resolve([new ColorPresentation('fuck')]);
	}
}

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));

	// context.subscriptions.push(
	// 	languages.registerHoverProvider('GO_MODE', new GoHoverProvider())
	// );

	context.subscriptions.push(
		languages.registerColorProvider('test', new GoColorProvider())
	);
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		},
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'less' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
		},
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	workspace.onDidChangeTextDocument((event) => {
		console.log('event', event);
	});

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
