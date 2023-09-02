/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path"
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
} from "vscode"

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node"

let client: LanguageClient

const colorMap = {
  "@color-50": "#e6f6ff",
  "@color-100": "#ceefff",
  "@color-200": "#98d7fe",
  "@color-300": "#65bbfc",
  "@color-400": "#3ea1fa",
  "@color-500": "#0076f7",
  "@color-600": "#005bd4",
  "@color-700": "#0043b1",
  "@color-800": "#052e82",
  "@color-900": "#041e63",
  "@neutral-0": "#ffffff",
  "@neutral-100": "#f5f7fa",
  "@neutral-200": "#f0f2f5",
  "@neutral-300": "#dbdde0",
  "@neutral-400": "#c8cacd",
  "@neutral-500": "#96989b",
  "@neutral-600": "#707275",
  "@neutral-700": "#4a4c4f",
  "@neutral-800": "#181a1d",
  "@neutral-900": "#000000",
  "@positive-50": "#ecfedf",
  "@positive-100": "#dffcc6",
  "@positive-200": "#c9f7ae",
  "@positive-400": "#8be374",
  "@positive-500": "#57d344",
  "@positive-600": "#3ab333",
  "@info-50": "#e6f6ff",
  "@info-100": "#ceefff",
  "@info-200": "#98d7fe",
  "@info-400": "#3ea1fa",
  "@info-500": "#0076f7",
  "@info-600": "#005bd4",
  "@alert-50": "#fff8e5",
  "@alert-100": "#fff1cc",
  "@alert-200": "#ffe199",
  "@alert-400": "#ffb53f",
  "@alert-500": "#ff9000",
  "@alert-600": "#db7200",
  "@danger-50": "#fff2ea",
  "@danger-100": "#ffe4d8",
  "@danger-200": "#ffc3b2",
  "@danger-400": "#ff766f",
  "@danger-500": "#f93940",
  "@danger-600": "#db2e43",
  "@pending-50": "#f9ecfe",
  "@pending-100": "#f4dafd",
  "@pending-200": "#e6b5fc",
  "@pending-400": "#bb71ee",
  "@pending-500": "#9a45e4",
  "@pending-600": "#7a35c3",
  "@normal-50": "#e6f6ff",
  "@normal-100": "#ceefff",
  "@normal-200": "#98d7fe",
  "@normal-300": "#65bbfc",
  "@normal-400": "#3ea1fa",
  "@normal-500": "#0076f7",
  "@normal-600": "#005bd4",
}
// const colorMap = Object.keys(colors).reduce((_colorMap , colorVar) => {

// 	const color:Color = hexToRGBA(colorMap[colorVar])

// 	_colorMap[colorVar]

// 	return _colorMap
// } , {})
class GoColorProvider implements DocumentColorProvider {
  public provideDocumentColors(
    document: TextDocument,
    token: CancellationToken
  ): Thenable<ColorInformation[]> {
    console.log("provideDocumentColors")
    // const text = document.getText()
    const colorInfos: ColorInformation[] = []

    const varNamesRegex = [
      "color",
      "neutral",
      "positive",
      "info",
      "alert",
      "danger",
      "pending",
      "normal",
    ].map((name) => new RegExp(`@${name}-\\d+`, "g"))

    for (let line = 0; line < document.lineCount; line++) {
      const textLine = document.lineAt(line)
      const text = textLine.text
      varNamesRegex.forEach((regex) => {
        let match
        while ((match = regex.exec(text)) != null) {
          const offset = match.index
          const length = match[0].length

          const colorVar = text.substring(offset, offset + length)

          if (colorMap[colorVar]) {
            const range = new Range(
              textLine.lineNumber,
              offset,
              textLine.lineNumber,
              offset + length
            )

            const color = hexToRGBA(colorMap[colorVar])
            colorInfos.push({ color, range })
          }
        }
      })
    }

    // for (let line = 0; line < document.lineCount; line++) {
    //   const textLine = document.lineAt(line)
    //   const text = textLine.text
    //   Object.keys(colorMap).forEach((colorVar) => {
    //     const regex = new RegExp(`${colorVar}`, "g")

    //     let match
    //     while ((match = regex.exec(text)) != null) {
    //       const offset = match.index
    //       const length = match[0].length

    //       const range = new Range(
    //         textLine.lineNumber,
    //         offset,
    //         textLine.lineNumber,
    //         offset + length
    //       )

    //       const color = hexToRGBA(colorMap[colorVar])
    //       colorInfos.push({ color, range })
    //     }
    //   })
    // }

    console.log("colorInfos", colorInfos)
    return Promise.resolve(colorInfos)
  }
  public provideColorPresentations(
    color: Color,
    context: { document: TextDocument; range: Range },
    token: CancellationToken
  ): Thenable<ColorPresentation[]> {
    console.log("provideColorPresentations")

    const colorVar = context.document.getText(context.range)

    console.log("colorVar", colorVar, colorMap[colorVar])

    const colorPresentation = new ColorPresentation(colorMap[colorVar])

    colorPresentation.textEdit = null
    return Promise.resolve([colorPresentation])
  }
}

export function activate(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  )

  // context.subscriptions.push(
  // 	languages.registerHoverProvider('GO_MODE', new GoHoverProvider())
  // );

  context.subscriptions.push(
    // languages.registerColorProvider('test', new GoColorProvider())
    languages.registerColorProvider(
      {
        language: "less",
        // language: "less",
        scheme: "file",
      },
      // "plaintext",
      new GoColorProvider()
    )
  )
  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
  }

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "less" }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
    },
  }

  // Create the language client and start the client.
  client = new LanguageClient(
    "languageServerExample",
    "Language Server Example",
    serverOptions,
    clientOptions
  )

  workspace.onDidChangeTextDocument((event) => {
    console.log("event", event)
  })

  // Start the client. This will also launch the server
  // client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined
  }
  // return client.stop();
}

const enum CharCode {
  Digit0 = 48,
  Digit9 = 57,

  A = 65,
  F = 70,

  a = 97,
  f = 102,
}

function parseHexDigit(charCode: CharCode): number {
  if (charCode >= CharCode.Digit0 && charCode <= CharCode.Digit9) {
    return charCode - CharCode.Digit0
  }
  if (charCode >= CharCode.A && charCode <= CharCode.F) {
    return charCode - CharCode.A + 10
  }
  if (charCode >= CharCode.a && charCode <= CharCode.f) {
    return charCode - CharCode.a + 10
  }
  return 0
}

function parseColor(content: string, offset: number): Color {
  const r =
    (16 * parseHexDigit(content.charCodeAt(offset + 1)) +
      parseHexDigit(content.charCodeAt(offset + 2))) /
    255
  const g =
    (16 * parseHexDigit(content.charCodeAt(offset + 3)) +
      parseHexDigit(content.charCodeAt(offset + 4))) /
    255
  const b =
    (16 * parseHexDigit(content.charCodeAt(offset + 5)) +
      parseHexDigit(content.charCodeAt(offset + 6))) /
    255
  return new Color(r, g, b, 1)
  // return Color.create(52, 64, 235, 1);
}

function hexToRGBA(hex, alpha = 1) {
  // 移除可能的 '#' 前缀
  hex = hex.replace(/^#/, "")

  // 解析每个颜色分量
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // 确保 alpha 在合法范围内
  alpha = Math.min(Math.max(0, alpha), 1)

  // 返回RGBA格式字符串
  // return `rgba(${red}, ${green}, ${blue}, ${alpha})`;

  return new Color(r / 255, g / 255, b / 255, 1)
}
