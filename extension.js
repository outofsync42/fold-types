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

	//private vars
	var cache = {};
	var in_block_comment = false;

	//helpers
	function strip_non_code(line) {
		var newLine = "";
		var x = 0;
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

			if (in_block_comment) {
				if (in_block_comment_end && line[x] == '/') {
					in_block_comment = false;
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

			if (in_double_quote_str == false) {
				if (line[x] == "'" && line[x - 1] != "\\") {
					in_single_quote_str = !in_single_quote_str;
				}
			}
			if (in_single_quote_str == false) {
				if (line[x] == '"' && line[x - 1] != "\\") {
					in_double_quote_str = !in_double_quote_str;
				}
			}

			if (in_double_quote_str || in_single_quote_str) {
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
				in_block_comment = true;
			} else if (line[x] == "/") {
				in_block_comment_start = true;
			} else {
				in_block_comment_start = false;
			}

			if (in_line_comment == true || in_block_comment == true) {
				return newLine; //return what ever came before the comment
			}

			newLine += line[x];
			x++;
		}
		return newLine;
	}

	//data
	function documentLines() {
		if (isset(cache.documentLines) == false) {
			var lines = application.documentLines();
			cache.documentLines = [];
			for (var i in lines) {
				cache.documentLines.push(strip_non_code(str_replace("\t", " ", lines[i])));
			}
		}
		return cache.documentLines;
	}

	//methods
	function isFoldLine(lines, i) {

		var curr_line = lines[parseInt(i)];

		var checkFold = {
			method: [],
			object: [],
			array: [],
			while: [],
			if: [],
		};

		var preventFold = {
			method: [],
			object: [],
			array: [],
			while: [],
			if: [],
		}

		var keyWords = {
			method: ['function'],
			while: ['while', 'do'],
			if: ['if', 'else']
		}

		var check_line = curr_line.toLowerCase();

		//method
		checkFold.method.push(check_line.lastIndexOf("function "));
		checkFold.method.push(check_line.lastIndexOf("function("));
		if (application.documentType() == 'js') {
			checkFold.method.push(check_line.lastIndexOf("=> {"));
			checkFold.method.push(check_line.lastIndexOf("=>{"));
		}

		//objects
		checkFold.object.push(check_line.lastIndexOf("= {"));
		checkFold.object.push(check_line.lastIndexOf("={"));
		checkFold.object.push(check_line.lastIndexOf("({"));

		//arrays
		checkFold.array.push(check_line.lastIndexOf("= ["));
		checkFold.array.push(check_line.lastIndexOf("=["));
		checkFold.array.push(check_line.lastIndexOf("(["));

		//while
		// checkFold.while.push(check_line.lastIndexOf("while ("));
		// checkFold.while.push(check_line.lastIndexOf("while("));
		// checkFold.while.push(check_line.lastIndexOf("do {"));
		// checkFold.while.push(check_line.lastIndexOf("do{"));
		// preventFold.while.push(check_line.lastIndexOf("}while("))
		// preventFold.while.push(check_line.lastIndexOf("} while("))
		// preventFold.while.push(check_line.lastIndexOf("}while ("))
		// preventFold.while.push(check_line.lastIndexOf("} while ("))

		//if
		// checkFold.if.push(check_line.lastIndexOf("if ("));
		// checkFold.if.push(check_line.lastIndexOf("if("));
		// checkFold.if.push(check_line.lastIndexOf("else "));
		// checkFold.if.push(check_line.lastIndexOf("else{"));

		for (var type in checkFold) {

			checkFold[type] = checkFold[type].filter(function (item) {
				return item !== -1; // remove un needed
			})
			preventFold[type] = preventFold[type].filter(function (item) {
				return item !== -1; // remove un needed
			})
			var foldKeyPosition = length(checkFold[type]) > 0 ? checkFold[type][0] : null;

			if (foldKeyPosition !== null && length(preventFold[type]) == 0) {

				if (isset(keyWords[type])) {
					for (var o in keyWords[type]) {
						//correct for irregular method names with key word at end of function name call
						if (check_line.lastIndexOf(keyWords[type][o]) > 0) {
							var ops = ['(', ')', '=', '+', ' ', '}', '{'];
							if (in_array(check_line[check_line.lastIndexOf(keyWords[type][o]) - 1], ops) == false) {
								continue;
							}
						}
					}
				}

				var braceCount = 0;
				var braceStart = false;
				var lineCount = 0;
				var lineNum = parseInt(i)

				if (type == 'if') {
					var next_line = strip_non_code(str_replace("\t", " ", lines[lineNum + 1]));
					if (is_array(check_line.match(/\{/g)) == false && is_array(next_line.match(/\{/g)) == false) {
						break; //ignore if statments with no starting brace
					}
				}

				//need to check starting at the location of the keyword so braces that came before it do not effect it
				//need to make sure there is at least one line before end brace
				return true;
				while (lineNum < length(lines)) {
					var line = lines[lineNum];
					var first_line = true;
					for (var o in line) {
						if (first_line == true) {
							//first line needs to check from cursor position
							if (parseInt(o) >= foldKeyPosition) {
								first_line = false;
								if (type == 'array') {
									if (line[o] == '[') {
										braceStart = true;
										braceCount++;
									}
									if (line[o] == ']') {
										braceCount--;
									}
								} else {
									//default
									if (line[o] == '{') {
										braceStart = true;
										braceCount++;
									}
									if (line[o] == '}') {
										braceCount--;
									}
								}
							}
						} else {
							//optimized checking of entire line
							if (type == 'array') {
								braceCount += (check_line.match(/\[/g) || []).length;
								if (braceCount > 0) {
									braceStart = true;
								}
								braceCount -= (check_line.match(/\]/g) || []).length;
							} else {
								braceCount += (check_line.match(/\{/g) || []).length;
								if (braceCount > 0) {
									braceStart = true;
								}
								braceCount -= (check_line.match(/\}/g) || []).length;
							}
						}

					}

					//no start brace found... ide fold region starts as keyword not brace
					if (braceStart == false && braceCount == 0) {
						lineCount++;
					}
					//found starting brace on line with keyword and then no closing brace on next line.
					if (braceStart && braceCount > 0) {
						lineCount++;
					}
					lineNum++;

					if (lineCount > 1) {
						//if more than one line then fold option available
						return true;
					}
				}
			}
		}

		return false;
	}
	function getLinesToFold(lines) {
		var linesTofold = [];
		for (var i in lines) {
			if (isFoldLine(lines, i)) {
				linesTofold.push({ line: parseInt(i), text: lines[i] });
			}
		}
		return linesTofold;
	}
	function getLineNumbersToFold(lines) {
		var linesTofold = getLinesToFold(lines);
		return array_column(linesTofold, 'line');
	}
	function getParentTopLineNumber() {

		var lines = documentLines();
		var cursorPosition = application.editorCursorPosition();
		var lineNumber = cursorPosition.line;
		var startingCharPosition = cursorPosition.character;
		var braceCount = 1;

		do {
			var line = strip_non_code(lines[lineNumber]);
			var x = startingCharPosition > 0 ? (startingCharPosition - 1) : length(line) - 1;
			while (x >= 0) {
				if (line[x] == '}') {
					braceCount++;
				} else if (line[x] == '{') {
					braceCount--;
				}
				x--;
			}
			startingCharPosition = 0;
			lineNumber--;
		} while (braceCount > 0);
		lineNumber++;
		return lineNumber;
	}
	function getParentBottomLineNumber() {

		var lines = documentLines();
		var cursorPosition = application.editorCursorPosition();
		var lineNumber = cursorPosition.line;
		var startingCharPosition = cursorPosition.character;
		var braceCount = 1;

		do {
			var line = strip_non_code(lines[lineNumber]);

			let x = startingCharPosition > 0 ? startingCharPosition : 0;

			while (x < length(line)) {
				//check end of line
				if (isset(line[x])) {
					if (line[x] == '{') {
						braceCount++;
					} else if (line[x] == '}') {
						braceCount--;
					}
				}
				x++;
			}
			startingCharPosition = 0;
			lineNumber++;
		} while (braceCount > 0);
		lineNumber--;
		return lineNumber;
	}
	function getParentAllLines() {
		var topLineNumber = getParentTopLineNumber();
		var bottomLineNumber = getParentBottomLineNumber();
		var lines = documentLines();
		var parentLines = new Array;
		for (var i in lines) {
			if (parseInt(i) >= topLineNumber && parseInt(i) <= bottomLineNumber) {
				parentLines[i] = lines[i];
			}
		}
		return parentLines;
	}
	function getParentLineNumbers() {
		var parentLines = getParentAllLines();
		return array_column(parentLines, 'line');
	}
	function getParentFoldLines(exclude_parent) {
		var topLineNumber = getParentTopLineNumber() + (is_true(exclude_parent) ? 1 : 0);
		var bottomLineNumber = getParentBottomLineNumber() - (is_true(exclude_parent) ? 1 : 0);
		var lines = documentLines();
		var parentLinesToFold = new Array;
		for (var i in lines) {
			if (parseInt(i) >= topLineNumber && parseInt(i) <= bottomLineNumber) {
				parentLinesToFold[i] = lines[i];
			}
		}
		return parentLinesToFold;
	}

	//actions
	this.foldAll = async function () {
		cache = {};
		debug('commandFoldAll')
		debug(vscode.workspace.getConfiguration('fold-type').get('class'));
		debug('1')
		var lines = documentLines();
		debug('2')
		var linesTofold = getLinesToFold(lines);
		debug('3')
		application.editorSelectLines(array_column(linesTofold, 'line'));
		debug('4')
		await application.editorFoldSelectedLines();
		debug('5')
		application.editorUnSelectAll(); //clear selected lines
		debug('6')
		application.editorSetCursorPosition(linesTofold[0]['line']); //place cursor at start of parent
		debug('7')
	}
	this.foldParent = async function () {
		cache = {};
		debug('commandFoldParent')
		var linesToFold = getParentFoldLines();
		var lineNumbersToFold = getLineNumbersToFold(linesToFold);
		application.editorSelectLines(lineNumbersToFold);
		await application.editorFoldSelectedLines();
		application.editorUnSelectAll(); //clear selected lines
		application.editorSetCursorPosition(lineNumbersToFold[0]); //place cursor at start of parent
	}
	this.foldChildren = async function () {
		cache = {};
		debug('commandFoldChildren');
		var cursorPosition = application.editorCursorPosition();
		var linesToFold = getParentFoldLines(true);
		var lineNumbersToFold = getLineNumbersToFold(linesToFold);
		application.editorSelectLines(lineNumbersToFold);
		await application.editorFoldSelectedLines();
		application.editorUnSelectAll(); //clear selected lines
		application.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
	}
	this.unFoldParent = async function () {
		debug('expandFoldParent');
		var cursorPosition = application.editorCursorPosition();
		var lineNumbersToUnFold = getParentLineNumbers();
		application.editorSelectLines(lineNumbersToUnFold);
		application.editorUnFoldSelectedLines();
		application.editorUnSelectAll(); //clear selected lines
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
