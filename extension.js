const vscode = require('vscode');
var path = require("path");

/**
 * @type {vscode.ExtensionContext}
 */
var context;

//helpers
function isset(object) {
	if (typeof object != 'undefined' && object !== null) {

		//somehow an object canbe a type number but also be null.. this will catch it
		if (typeof object == 'number' && object.toString() == 'NaN') {
			return false;
		}

		return true;
	}
	return false;
}
function is_array(object) {
	if (isset(object) && object instanceof Array) {
		return true;
	}
	return false;
}
function is_int(value) {
	if (typeof value == 'number' && value.toString() != 'NaN' && value.toString() != 'Infinity') {
		return value.toString().indexOf('.') < 0;
	}
	return false;
}
function is_bool(object) {
	if (typeof object == 'boolean') {
		return true;
	}
	return false;
}
function is_string(object) {
	if (typeof object == 'string') {
		return true;
	}
	return false;
}
function is_true(object) {
	if ((is_bool(object) && object === true) || (is_int(object) && object === 1)) {
		return true;
	}
	return false;
}
function is_numeric(value) {

	if (typeof value == 'number' && value.toString() != 'NaN' && value.toString() != 'Infinity') {
		return true;
	}

	if (is_string(value)) {
		var regInt = /^-?[0-9]+$/;
		if (regInt.test(value)) {
			return true;
		}

		var regFloat = /^-?[0-9]+(\.[0-9]+)?$/;
		if (regFloat.test(value)) {
			return true;
		}
	}

	return false;
}
function in_string(needle, haystack) {
	if (is_string(haystack)) {
		if (haystack.indexOf(needle) > -1) {
			return true;
		}
	}
	return false;
}
function in_array(needle, haystack) {
	if (is_array(haystack)) {
		for (var i in haystack) {
			if (haystack[i] == needle) {
				return true;
			}
		}
	}
	return false;
}
function array_column(array, columnName) {
	var table;
	if (is_string(array)) {
		table = columnName;
		columnName = array;
	} else {
		table = array;
	}

	var list = new Array;

	if (is_array(columnName)) {
		for (var i in table) {
			var row = {};
			for (var c in columnName) {
				if (isset(table[i][columnName[c]])) {
					row[columnName[c]] = table[i][columnName[c]];
				}
			}
			list.push(row);
		}
	} else {
		for (var i in table) {
			if (isset(table[i][columnName])) {
				list.push(table[i][columnName]);
			}
		}
	}
	return list;
}
function trim(str, charlist) {

	if (str === null) {
		return '';
	}

	var whitespace, l = 0,
		i = 0;
	str += '';

	if (!charlist) {
		// default list
		whitespace =
			' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
	} else {
		// preg_quote custom list
		charlist += '';
		whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
	}

	l = str.length;
	for (i = 0; i < l; i++) {
		if (whitespace.indexOf(str.charAt(i)) === -1) {
			str = str.substring(i);
			break;
		}
	}

	l = str.length;
	for (i = l - 1; i >= 0; i--) {
		if (whitespace.indexOf(str.charAt(i)) === -1) {
			str = str.substring(0, i + 1);
			break;
		}
	}

	return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}
function str_replace(find, replace, text) {

	if (find !== replace && isset(replace)) {
		if (is_array(find) == false) {
			find = [find];
		}
		if (is_string(text)) {
			for (var i in find) {
				if (find[i] instanceof RegExp) {
					text = text.replace(find[i], replace)
				} else {
					if (in_string(find[i], text)) {
						text = text.split(find[i]).join(replace);
					}
				}
			}
		}
	}

	return text;
}
function length(object) {

	var x = 0;

	if (is_array(object)) {
		//I dont like relying on .length as it doesnt always work as expected
		//array[0] = ''
		//array[5] = ''
		//produces length of 5 when its really 2
		for (var i in object) {
			++x;
		}
	} else if (is_array(object)) {
		if (isset(object.byteLength) == true) {
			x = object.byteLength;
		} else if (isset(Object['keys'])) {
			x = Object['keys'](object).length;
		} else {
			for (var i in object) {
				++x;
			}
		}
	} else if (is_string(object)) {
		x = object.length;
	} else if (is_numeric(object)) {
		x = object.toString().length;
	}

	return x;
}

var debug = console.log;

//application
var application = new function () {

	var self = this;

	var cache = {

	};

	//editor
	this.editor = function () {
		return vscode.window.activeTextEditor;
	}
	this.editorCursorPosition = function () {
		return vscode.window.activeTextEditor.selection.active;
	}
	this.editorCursorNewPosition = function (lineNumber, charNumber) {
		return self.editorCursorPosition().with(lineNumber, charNumber);
	}
	//editor actions
	this.editorSelectLines = function (lineNumbers) {
		if ((is_int(lineNumbers) == false && is_array(lineNumbers) == false) || (is_array(lineNumbers) && length(lineNumbers) == 0)) {
			return;
		}
		lineNumbers = is_array(lineNumbers) ? lineNumbers : [lineNumbers];
		let selections = new Array;
		for (var i in lineNumbers) {
			var linePosition = self.editorCursorNewPosition(lineNumbers[i], 0);
			selections.push(new vscode.Selection(linePosition, linePosition));
		}
		self.editor().selections = selections;
	}
	this.editorUnSelectAll = function () {
		var linePosition = self.editorCursorNewPosition(self.editor().selection.start.line, self.editor().selection.start.character);
		var cursor = new vscode.Selection(linePosition, linePosition);
		self.editor().selections = [cursor];
	}
	this.editorSetCursorPosition = function (lineNumber, charNumber) {
		lineNumber = is_int(lineNumber) ? lineNumber : 0;
		charNumber = is_int(charNumber) ? charNumber : 0;
		var linePosition = self.editorCursorNewPosition(lineNumber, charNumber);
		self.editor().selection = new vscode.Selection(linePosition, linePosition);
	}
	this.editorFoldSelectedLines = async function () {
		await self.executeCommand('editor.fold');
	}
	this.editorUnFoldSelectedLines = async function () {
		await self.executeCommand('editor.unfold');
	}

	//document
	this.document = function () {
		return self.editor().document;
	}
	this.documentPath = function () {
		return self.document().fileName;
	}
	this.documentName = function () {
		return path.basename(self.documentPath());
	}
	this.documentLines = function () {
		if (isset(cache.documentLines) == false) {
			let text = self.document().getText();
			cache.documentLines = text.split(/\r?\n/); //zero index
		}
		return cache.documentLines;
	}
	this.documentType = function () {
		if (isset(cache.documentType) == false) {
			cache.documentType = str_replace('.', '', path.extname(self.documentPath()));
		}
		return cache.documentType;
	}
	this.documentLineCount = function () {
		return this.document().lineCount;
	}

	//actions
	this.executeCommand = async function (command) {
		await vscode.commands.executeCommand(command);
	}
	this.registerCommand = function (command, callback) {
		context.subscriptions.push(vscode.commands.registerCommand(command, function () {
			cache = {}; //clear cache
			if (typeof callback == "function") {
				callback();
			}
		}));
	}
	this.registerMenuCommand = function (command, callback) {
		const disposable = vscode.commands.registerTextEditorCommand(command, callback);
		context.subscriptions.push(disposable);
	}

}

//extenstion
var SmartFold = function () {

	var self = this;

	//private vars
	let cache = {};

	//helpers
	function strip_non_code(line) {
		var newLine = "";
		var x = 0;
		var in_quote_str = false;
		var in_single_quote_str = false;
		var in_double_quote_str = false;
		var in_block_comment_start = false;
		var in_block_comment_end = false;
		var in_line_comment = false;
		var in_line_comment_start = false;
		var ws = true;
		while (x < length(line) && in_line_comment == false) {

			if (ws == true) {
				if (line[x] !== " ") {
					ws = false;
				} else {
					x++; //skip first white spaces
					continue;
				}
			}

			if (is_true(cache.in_block_comment)) {
				if (in_block_comment_end && line[x] == '/') {
					cache.in_block_comment = false;
				} else if (line[x] == '*') {
					in_block_comment_end = true;
					x++;
					continue;
				} else {
					in_block_comment_end = false;
					x++;
					continue;
				}
			}

			if (in_double_quote_str == false && in_single_quote_str == false) {
				if (line[x] == "`" && line[x - 1] != "\\") {
					in_quote_str = !in_quote_str;
				}
			}
			if (in_double_quote_str == false && in_quote_str == false) {
				if (line[x] == "'" && line[x - 1] != "\\") {
					in_single_quote_str = !in_single_quote_str;
				}
			}
			if (in_single_quote_str == false && in_quote_str == false) {
				if (line[x] == '"' && line[x - 1] != "\\") {
					in_double_quote_str = !in_double_quote_str;
				}
			}

			if (in_double_quote_str || in_single_quote_str || in_quote_str) {
				x++;
				continue;
			}

			if (in_line_comment_start && line[x] == "/") {
				in_line_comment = true;
			} else if (line[x] == "/") {
				in_line_comment_start = true;
			} else {
				in_line_comment_start = false;
				in_line_comment = false;
			}

			if (in_block_comment_start && line[x] == "*") {
				cache.in_block_comment = true;
			} else if (line[x] == "/") {
				in_block_comment_start = true;
			} else {
				in_block_comment_start = false;
			}

			if (in_line_comment == true || cache.in_block_comment == true) {
				return newLine; //return what ever came before the comment
			}

			newLine += line[x];
			x++;
		}
		return newLine;
	}

	//config data
	function getConfigurationSetting(key, default_value) {
		var value = vscode.workspace.getConfiguration('fold-type').get(key);
		return isset(value) ? value : default_value;
	}

	//methods
	function getEnabledFoldTypes() {
		if (isset(cache.enabledTypes) == false) {
			cache.foldtypes = {
				'class': { enabled: getConfigurationSetting('class', true) },
				'method': { enabled: getConfigurationSetting('method', true) },
				'object': { enabled: getConfigurationSetting('object', true) },
				'array': { enabled: getConfigurationSetting('array', true) },
				'while': { enabled: getConfigurationSetting('while', true) },
				'if': { enabled: getConfigurationSetting('if', true) },
			};
		}
		return cache.foldtypes;
	}
	function getLineInfo(line) {

		var text = line['text'];
		var lineNum = line['line'];
		var lines = getDocumentLines();

		var fileType = application.documentType();

		line['syntax'] = 'any';
		if (fileType == 'js') {
			line['syntax'] = 'js';
		}

		var foldTypes = getEnabledFoldTypes();
		var checkType = {};
		for (var type in foldTypes) {
			checkType[type] = [];
		}

		var preventType = {
			while: [],
		}

		var keyWords = [
			'class',
			'function',
			'constructor',
			'while',
			'do',
			'if'
		];

		//--------------------------------
		//classes
		checkType.class.push(text.lastIndexOf(" class "));
		checkType.class = checkType.class.filter(function (item) {
			return item !== -1; // remove un needed
		})

		//--------------------------------
		//method
		if (line['syntax'] == 'js') {
			//only for JS
			if (checkType.class.length > 0) {
				cache.in_class = true;
			}
			if (is_true(cache.in_class)) {
				var b = (text.match(/\{/g) || []).length;
				cache.in_class_brace_count = isset(cache.in_class_brace_count) == false && b > 0 ? b : (cache.in_class_brace_count + b);
				cache.in_class_brace_count = isset(cache.in_class_brace_count) == false ? null : (cache.in_class_brace_count - (text.match(/\}/g) || []).length);
				if (cache.in_class_brace_count === 0) {
					cache.in_class = false;
					cache.in_class_brace_count = null;
				}
				if (cache.in_class) {
					var open_p = (text.match(/\(/g) || []);
					var close_p = (text.match(/\)/g) || []);
					var close_brace = text.lastIndexOf('{') == text.length - 1; //require brace at end
					if (open_p.length > 0 && close_p.length > 0 && close_brace) {
						checkType.method.push(close_p[close_p.length - 1]);
					}
				}
			}
		}

		checkType.method.push(text.lastIndexOf("function "));
		checkType.method.push(text.lastIndexOf("function("));
		checkType.method.push(text.lastIndexOf("constructor ("));
		checkType.method.push(text.lastIndexOf("constructor("));
		checkType.method.push(text.lastIndexOf("=> {"));
		checkType.method.push(text.lastIndexOf("=>{"));
		checkType.method = checkType.method.filter(function (item) {
			return item !== -1; // remove un needed
		})

		//--------------------------------
		//objects
		checkType.object.push(text.lastIndexOf("= {"));
		checkType.object.push(text.lastIndexOf("={"));
		checkType.object.push(text.lastIndexOf("({"));
		checkType.object = checkType.object.filter(function (item) {
			return item !== -1; // remove un needed
		})

		//--------------------------------
		//arrays
		checkType.array.push(text.lastIndexOf("= ["));
		checkType.array.push(text.lastIndexOf("=["));
		checkType.array.push(text.lastIndexOf("(["));
		checkType.array = checkType.array.filter(function (item) {
			return item !== -1; // remove un needed
		})

		//--------------------------------
		//while
		checkType.while.push(text.lastIndexOf("while ("));
		checkType.while.push(text.lastIndexOf("while("));
		checkType.while.push(text.lastIndexOf("do {"));
		checkType.while.push(text.lastIndexOf("do{"));
		checkType.while = checkType.while.filter(function (item) {
			return item !== -1; // remove un needed
		})
		preventType.while.push(text.lastIndexOf("}while("))
		preventType.while.push(text.lastIndexOf("} while("))
		preventType.while.push(text.lastIndexOf("}while ("))
		preventType.while.push(text.lastIndexOf("} while ("))
		preventType.while = preventType.while.filter(function (item) {
			return item !== -1; // remove un needed
		})

		//--------------------------------
		//clean up
		if (checkType.while.length > 0 || preventType.while.length > 0) {
			checkType.method = []; //overrules method
		}


		//if
		checkType.if.push(text.lastIndexOf("if ("));
		checkType.if.push(text.lastIndexOf("if("));
		checkType.if = checkType.if.filter(function (item) {
			return item !== -1; // remove un needed
		})

		// checkFold.if.push(check_line.lastIndexOf("else "));
		// checkFold.if.push(check_line.lastIndexOf("else{"));

		var lineType = '';

		for (var type in checkType) {

			var typePosition = checkType[type].length > 0 ? checkType[type][0] : null;

			if (typePosition !== null && (isset(preventType[type]) == false || preventType[type].length == 0)) {

				if (isset(keyWords[type])) {
					for (var o in keyWords[type]) {
						//correct for irregular method names with key word at end of function name call
						if (text.lastIndexOf(keyWords[type][o]) > 0) {
							var ops = ['(', ')', '=', '+', ' ', '}', '{', ';'];
							if (in_array(text[text.lastIndexOf(keyWords[type][o]) - 1], ops) == false) {
								continue;
							}
						}
					}
				}

				var braceCount = null;
				var braceStart = false;
				var lineCount = 0;


				// if (type == 'if') {
				// 	let next_line = lines[lineNum + 1]['text'];
				// 	if (is_array(text.match(/\{/g)) == false && is_array(next_line.match(/\{/g)) == false) {
				// 		break; //ignore if statments with no starting brace
				// 	}
				// }

				//need to check starting at the location of the keyword so braces that came before it do not effect it
				//need to make sure there is at least one line before end brace
				while (isset(lines[lineNum])) {
					let next_line = lines[lineNum]['text'];
					let first_line = true;
					for (var o in next_line) {
						if (first_line == true) {
							first_line = false;
							//first line needs to check from cursor position
							if (parseInt(o) >= typePosition) {
								if (type == 'array') {
									if (next_line[o] == '[') {
										braceCount = braceCount === null ? 1 : braceCount + 1;
									}
									if (next_line[o] == ']') {
										braceCount--;
									}
								} else {
									//default
									if (next_line[o] == '{') {
										braceCount = braceCount === null ? 1 : braceCount + 1;
									}
									if (next_line[o] == '}') {
										braceCount--;
									}
								}
							}
						} else {
							//optimized checking of entire line
							if (type == 'array') {
								var count = (next_line.match(/\[/g) || []).length;
								braceCount = braceCount === null ? count : braceCount + count;
								braceCount -= (next_line.match(/\]/g) || []).length;
							} else {
								var count = (next_line.match(/\{/g) || []).length;
								braceCount = braceCount === null ? count : braceCount + count;
								braceCount -= (next_line.match(/\}/g) || []).length;
							}
						}
					}

					//no start brace found... ide fold region starts as keyword not brace
					if (braceCount === null || braceCount > 1) {
						lineCount++;
					}
					if (braceCount === 0 || lineCount > 1) {
						if (lineCount > 1) {
							lineType = type;
						}
						break;
						//stop
					}
					lineNum++;
				}
			}
		}

		var foldEnabled = isset(foldTypes[lineType]) && foldTypes[lineType]['enabled'] == true;

		return {
			type: lineType,
			fold: foldEnabled,
			text: text
		};
	}
	function getLinesToFold(lines) {
		var linesTofold = [];
		var first_line = true;
		for (var i in lines) {
			var lineInfo = getLineInfo(lines[i]);
			lines[i]['type'] = lineInfo['type'];
			lines[i]['fold'] = lineInfo['fold'];
			//override enabled settings for parent
			if (lines[i]['fold'] == true || (first_line && lines[i]['type'] !== '')) {
				linesTofold.push(lines[i]);
			}
			first_line = false;
		}
		return linesTofold;
	}
	function getLineNumbers(lines) {
		return array_column(lines, 'line');
	}
	function getParentTopLineNumber() {

		var lines = getDocumentLines();
		var cursorPosition = application.editorCursorPosition();
		var lineNumber = cursorPosition.line;
		var startingCharPosition = cursorPosition.character;
		var braceCount = 1;

		var lineInfo = getLineInfo(lines[lineNumber]);
		if (lineInfo['type'] != '') {
			return lineNumber;
		}

		var first_line = true;
		do {
			var text = lines[lineNumber]['text'];
			if (first_line == true) {
				first_line = false;
				let x = startingCharPosition;
				while (x >= 0) {
					//check end of line
					if (isset(text[x])) {
						if (text[x] == '{') {
							braceCount--;
						} else if (text[x] == '}') {
							braceCount++;
						}
					}
					x--;
				}
			} else {
				//optimize search of entire line for each additional line
				braceCount -= (text.match(/\{/g) || []).length;
				braceCount += (text.match(/\}/g) || []).length;
			}
			lineNumber--;
		} while (braceCount > 0 && lineNumber >= 0);
		lineNumber++;
		return lineNumber;
	}
	function getParentBottomLineNumber() {

		var lines = getDocumentLines();
		var cursorPosition = application.editorCursorPosition();
		var lineNumber = cursorPosition.line;
		var startingCharPosition = cursorPosition.character;
		var braceCount = 1;
		var first_line = true;

		var lineInfo = getLineInfo(lines[lineNumber]);
		if (lineInfo['type'] != '') {
			lineNumber++;
			first_line = false;
		}

		do {
			var text = lines[lineNumber]['text'];
			//first line checks from cursor position
			if (first_line == true) {
				first_line = false;
				let x = startingCharPosition;
				while (x < length(text)) {
					//check end of line
					if (isset(text[x])) {
						if (text[x] == '{') {
							braceCount++;
						} else if (text[x] == '}') {
							braceCount--;
						}
					}
					x++;
				}
			} else {
				//optimize search of entire line for each additional line
				braceCount += (text.match(/\{/g) || []).length;
				braceCount -= (text.match(/\}/g) || []).length;
			}
			lineNumber++;
		} while (braceCount > 0 && lineNumber < length(lines));
		lineNumber--;
		return lineNumber;
	}
	function getDocumentLines() {
		if (isset(cache.documentLines) == false) {
			var lines = application.documentLines();
			cache.documentLines = [];
			for (var i in lines) {
				//add ws to front. strip tabs
				var line = parseInt(i);
				cache.documentLines[line] = {
					line: line,
					text: (' ' + strip_non_code(trim(lines[i]))) //if you add anything to end of line fix the js class function brace checking
				};
			}
		}
		return cache.documentLines;
	}
	function getParentLines(exclude_parent) {
		var topLineNumber = getParentTopLineNumber() + (is_true(exclude_parent) ? 1 : 0);
		var bottomLineNumber = getParentBottomLineNumber() - (is_true(exclude_parent) ? 1 : 0);
		var lines = getDocumentLines();
		var parentLines = new Array;
		for (var i in lines) {
			if (lines[i]['line'] >= topLineNumber && lines[i]['line'] <= bottomLineNumber) {
				parentLines.push(lines[i]);
			}
		}
		return parentLines;
	}

	//fold
	async function fold(lines, inner) {
		inner = is_bool(inner) ? inner : false;
		var linesTofold = getLinesToFold(lines);
		if (inner) {
			linesTofold = linesTofold.slice(1);
		}
		var lineNumbersToFold = getLineNumbers(linesTofold);
		application.editorSelectLines(lineNumbersToFold);
		await application.editorFoldSelectedLines();
		application.editorUnSelectAll(); //clear selected lines
	}
	async function unFold(lines) {
		var lineNumbersToUnFold = getLineNumbers(lines);
		application.editorSelectLines(lineNumbersToUnFold);
		await application.editorUnFoldSelectedLines();
		application.editorUnSelectAll(); //clear selected lines
	}

	//actions
	this.foldAll = async function () {
		cache = {};
		debug('commandFoldAll')
		var lines = getDocumentLines();
		await fold(lines);
		application.editorSetCursorPosition(lines[0]['line']); //place cursor at start of parent
	}
	this.foldParent = async function () {
		cache = {};
		debug('commandFoldParent')
		var lines = getParentLines();
		await fold(lines);
		application.editorSetCursorPosition(lines[0]['line']); //place cursor at start of parent
	}
	this.foldChildren = async function () {
		cache = {};
		debug('commandFoldChildren');
		var cursorPosition = application.editorCursorPosition();
		var lines = getParentLines();
		debug(lines)
		await fold(lines, true);
		application.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
	}
	this.unFoldAll = async function () {
		debug('unFoldAll');
		//not really neccessary but people will probably wonder why and unfold all didnt come packaged with the extension
		await application.executeCommand('editor.unfoldAll');
	}
	this.unFoldParent = async function () {
		debug('unFoldParent');
		cache = {};
		var cursorPosition = application.editorCursorPosition();
		await unFold(getParentLines());
		application.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
	}
}

/**
 * @param {vscode.ExtensionContext} _context
 */
function activate(_context) {
	context = _context
	var smartFold = new SmartFold();
	application.registerCommand('fold-type.fold-all', async function () {
		await smartFold.foldAll();
	});
	application.registerCommand('fold-type.fold-parent', async function () {
		await smartFold.foldParent();
	});
	application.registerCommand('fold-type.fold-children', async function () {
		await smartFold.foldChildren();
	});
	application.registerCommand('fold-type.unfold-all', async function () {
		await smartFold.unFoldAll();
	});
	application.registerCommand('fold-type.unfold-parent', async function () {
		await smartFold.unFoldParent();
	});
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
