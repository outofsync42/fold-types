const vscode = require('vscode');
var path = require("path");

/**
 * @type {vscode.ExtensionContext}
 */
var context;

//helpers

// kevin

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
function is_function(object) {
	if (typeof object == 'function') {
		return true;
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
function ucwords(str, force) {

	if (is_true(force)) {
		str = strtolower(str);
	}

	var value = (str + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
		return $1.toUpperCase();
	});

	return value;
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
var log = console.log;


function Extend(self, parent, p1, p2, p3) {
	if (is_function(parent)) {
		parent.call(self, p1, p2, p3);
	} else {
		for (var i in parent) {
			self[i] = parent[i];
		}
	}
}

var EventHandler = function () {

	var self = this;

	var _cbs = {}; //callbacks

	this.on = function (tag, callback, runOnce) {
		if (is_string(tag) && is_function(callback)) {
			if (isset(_cbs[tag]) == false) {
				_cbs[tag] = {};
			}

			var index = length(_cbs[tag]);

			if (is_bool(runOnce) == false) {
				runOnce = false;
			}
			_cbs[tag][index] = {
				'enabled': true,
				'runOnce': runOnce,
				'callback': callback
			};
		}
	};
	this.once = function (tag, callback) {
		self.on(tag, callback, true);
	};
	this.emit = function (tag, param1, param2, param3, param4, param5) {
		_wc = 0;
		if (isset(_cbs[tag]) == true) {
			for (var i in _cbs[tag]) {
				if (is_function(_cbs[tag][i]['callback']) && _cbs[tag][i]['enabled'] == true) {
					var callback = _cbs[tag][i]['callback'];
					var response = callback.call(this, param1, param2, param3, param4, param5);
					if (isset(_cbs[tag]) == true && isset(_cbs[tag][i]) == true && _cbs[tag][i]['runOnce'] == true) {
						delete _cbs[tag][i];
					}
					if (isset(response)) {
						return response;
					}
				}
			}
		}
		return self;
	};
	this.isEnabledEvent = function (tag, bool) {
		if (isset(_cbs[tag])) {
			for (var i in _cbs[tag]) {
				_cbs[tag][i]['enabled'] = bool;
			}
		}
	};
	this.clearEvent = function (tag) {
		if (isset(tag)) {
			_cbs[tag] = {};
		} else {
			_cbs = {};
		}
	};

	//READY
	var _orcb = new Array; //onmreadycallback
	var _wc = 0; //waitcount
	var _ri = 0; //readyindex
	var _continue = function () {
		if (_wc == 0) {
			if (isset(_orcb[_ri])) {
				_orcb[_ri]();
			}
			_ri++;
			self.resetReady();
		}
	};
	this.wait = function () {
		_wc++;
		_wc = _wc > 0 ? _wc : 0;
	};
	this.continue = function () {
		_wc--;
		_wc = _wc > 0 ? _wc : 0;
		_continue();
	};
	this.ready = function (callback) {
		_orcb.push(callback);
		//give one interval incase wait is called
		setTimeout(function () {
			_continue();
		});
	};
	this.resetReady = function () {
		if (_ri == length(_orcb) || length(_orcb) == 0) {
			_orcb = new Array;
			_wc = 0;
			_ri = 0;
		}
	};

};

//application
var Application = function () {

	var self = this;

	//Extend(this, EventHandler);

	Extend(this, EventHandler);

	var cache = {

	};

	//editor
	this.editor = function () {
		return typeof vscode.window.activeTextEditor !== 'undefined' ? vscode.window.activeTextEditor : null;
	}
	this.editorCursorPosition = function () {
		return typeof vscode.window.activeTextEditor !== 'undefined' ? vscode.window.activeTextEditor.selection.active : null;
	}
	this.editorCursorNewPosition = function (lineNumber, charNumber) {
		var pos = self.editorCursorPosition();
		return pos !== null ? pos.with(lineNumber, charNumber) : null;
	}
	//editor actions
	this.editorSelectLines = function (lineNumbers) {
		if ((is_int(lineNumbers) == false && is_array(lineNumbers) == false) || (is_array(lineNumbers) && lineNumbers.length == 0)) {
			return;
		}
		lineNumbers = is_array(lineNumbers) ? lineNumbers : [lineNumbers];
		let selections = new Array;
		for (var i in lineNumbers) {
			var linePosition = self.editorCursorNewPosition(lineNumbers[i], 0);
			if (linePosition !== null) {
				selections.push(new vscode.Selection(linePosition, linePosition));
			}
		}
		var editor = self.editor();
		if (editor !== null) {
			editor.selections = selections;
		}
	}
	this.editorUnSelectAll = function () {
		var editor = self.editor();
		if (editor !== null) {
			var linePosition = self.editorCursorNewPosition(editor.selection.start.line, editor.selection.start.character);
			if (linePosition !== null) {
				var cursor = new vscode.Selection(linePosition, linePosition);
				editor.selections = [cursor];
			}
		}
	}
	this.editorSetCursorPosition = function (lineNumber, charNumber) {
		var editor = self.editor();
		if (editor !== null) {
			if (isset(editor.selection)) {
				lineNumber = is_int(lineNumber) ? lineNumber : 0;
				charNumber = is_int(charNumber) ? charNumber : 0;
				var linePosition = self.editorCursorNewPosition(lineNumber, charNumber);
				if (linePosition !== null) {
					editor.selection = new vscode.Selection(linePosition, linePosition);
				}
			}
		}
	}
	this.editorFoldSelectedLines = async function () {
		await self.executeCommand('editor.fold');
	}
	this.editorFoldLines = async function (lineNumbers) {
		await vscode.commands.executeCommand('editor.fold', { selectionLines: lineNumbers });
	}
	this.editorUnFoldSelectedLines = async function () {
		await self.executeCommand('editor.unfold');
	}
	this.editorUnFoldLines = async function (lineNumbers) {
		await vscode.commands.executeCommand('editor.unfold', { selectionLines: lineNumbers });
	}

	//document
	this.document = function () {
		var editor = self.editor();
		if (editor !== null) {
			return editor.document;
		}
		return null;
	}
	this.documentPath = function () {
		var document = self.document();
		return document !== null ? document.fileName : "";
	}
	this.documentName = function () {
		return path.basename(self.documentPath());
	}
	this.documentType = function () {
		return str_replace('.', '', path.extname(self.documentPath()));
	}
	this.documentLines = function () {
		if (isset(cache.documentLines) == false) {
			var document = self.document();
			let text = document !== null ? document.getText() : null;
			cache.documentLines = text !== null ? text.split(/\r?\n/) : []; //zero index
		}
		return cache.documentLines;
	}
	this.documentLineCount = function () {
		var document = self.document();
		return document !== null ? document.lineCount : -1;
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

	this.activate = function () {
		//if activated by file open we need to manually trigger on document open
		var document = self.document();
		if (document !== null) {
			documentOpen(document);
		}
	}

	//system events
	this.openDocuments = null;
	var documentOpen = function (document) {
		if (document.uri.scheme === 'file') {
			if (isset(self.openDocuments) == false) {
				self.openDocuments = [];
			}
			self.openDocuments.push(document.fileName);
			setTimeout(function () {
				self.emit('documentOpen', document);
			})
		}
	}
	vscode.workspace.onDidOpenTextDocument(function (document) {
		if (isset(self.openDocuments) == false) {
			self.openDocuments = [];
		}
		if (document.uri.scheme === 'file' && in_array(document.fileName, self.openDocuments) == false) {
			documentOpen(document)
		}
	})
	vscode.workspace.onDidCloseTextDocument(function (document) {
		if (isset(self.openDocuments) == false) {
			self.openDocuments = [];
		}
		if (document.uri.scheme == 'file' && in_array(document.fileName, self.openDocuments) == true) {
			self.openDocuments = self.openDocuments.filter(function (item) {
				return item != document.fileName;
			});
			setTimeout(function () {
				self.emit('documentClose', document);
			})
		}
	});
}

//extenstion
/**
 * @param {Application} application
 */
var FoldTypes = function (application) {

	var self = this;

	//private vars
	let cache = {};

	//config data
	this.getConfigurationSetting = function (key, default_value) {
		var value = vscode.workspace.getConfiguration('fold-types').get(key);
		return isset(value) ? value : (isset(default_value) ? default_value : null);
	}
	this.isValidDocType = function () {
		var validDocTypes = ['js', 'php', 'css']
		return in_array(application.documentType(), validDocTypes);
	}

	//Line Info test
	function getLinesToFold(lines) {
		var linesTofold = [];
		var first_line = true;
		for (var i in lines) {
			//override enabled settings for parent // never fold last line
			if ((parseInt(i) < lines.length - 1) && (lines[i]['isFoldEnabled'] == true || (first_line && lines[i]['isFoldType'] == true))) {
				linesTofold.push(lines[i]);
			}
			first_line = false;
		}
		return linesTofold;
	}
	function getParentTopLineNumber() {

		if (isset(cache.parentTopLineNumber)) {
			return cache.parentTopLineNumber;
		}

		var lines = getDocumentLines();
		var cursorPosition = application.editorCursorPosition();
		if (cursorPosition === null) {
			return 0;
		}
		var lineNumber = cursorPosition.line;
		var startingCharPosition = cursorPosition.character;
		var braceCount = 1;

		if (lines[lineNumber]['isFoldType'] == true) {
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
				var open_count = (text.match(/\{/g) || []).length;
				var close_count = (text.match(/\}/g) || []).length;
				//detect }  {
				if (open_count > 0 && close_count > 0 && braceCount == 1) {
					var last_open = text.lastIndexOf('{');
					var last_close = text.lastIndexOf('}');
					if (last_open > last_close) {
						braceCount = 0;
					} else {
						braceCount -= open_count;
						braceCount += close_count;
					}
				} else {
					braceCount -= open_count;
					braceCount += close_count;
				}
			}
			lineNumber--;
		} while (braceCount > 0 && lineNumber >= 0);
		lineNumber++;
		//compensate for finding brace on next line of fold line
		while (lineNumber >= 0 && lines[lineNumber]['isFoldType'] == false) {
			lineNumber--;
		}

		cache.parentTopLineNumber = lineNumber;

		return lineNumber;
	}
	function getParentBottomLineNumber() {

		var lines = getDocumentLines();
		var cursorPosition = application.editorCursorPosition();
		if (cursorPosition === null) {
			return lines.length - 1;
		}

		var lineNumber = getParentTopLineNumber();

		if (lineNumber == -1) {
			return -1; // parent is whole document
		}

		var braceStart = false;
		var braceCount = 0;
		while (lineNumber < lines.length && (braceStart == false || braceCount !== 0)) {
			var text = lines[lineNumber]['text'];
			var open_count = (text.match(/\{/g) || []).length;
			if (open_count > 0) {
				braceStart = true;
			}
			var close_count = (text.match(/\}/g) || []).length;
			braceCount += open_count;
			braceCount -= close_count;
			lineNumber++;
		}
		lineNumber--;

		return lineNumber;
	}

	//helpers
	function getParentLines(exclude_parent) {
		var topLineNumber = getParentTopLineNumber() + (is_true(exclude_parent) ? 1 : 0);
		var bottomLineNumber = getParentBottomLineNumber() - (is_true(exclude_parent) ? 1 : 0);
		var lines = getDocumentLines();
		if (topLineNumber == -1) {
			return lines; //parent is whole document
		}
		var parentLines = new Array;
		parentLines = lines.slice(topLineNumber, bottomLineNumber);
		return parentLines;
	}

	function cacheDocumentLines() {

		var lines = application.documentLines();

		var fileType = application.documentType();
		var syntax = null;
		if (in_array(fileType, ['js', 'css']) == true) {
			syntax = fileType;
		}

		var in_comment_block = false;

		cache.documentLines = new Array;

		for (var i in lines) {

			var line_x = parseInt(i);
			var line = lines[line_x];

			if (fileType == 'php') {
				if (line.indexOf('<?') > -1 || line.indexOf('<?php') > -1) {
					cache.php_open = true;
				}
				if (line.indexOf('?>') > -1 || line.indexOf('?>') > -1) {
					cache.php_open = false;
				}
				if (cache.php_open) {
					syntax = 'php';
				}
			}

			cache.documentLines[line_x] = {};
			cache.documentLines[line_x]['lineType'] = "";
			cache.documentLines[line_x]['line'] = line_x;
			cache.documentLines[line_x]['syntax'] = syntax;

			//php is wierd and requires well formed where as javascript does not
			if (isset(cache.well_formed_comment_block) == false) {
				if (line.indexOf("/*") > -1) {
					var x = line_x + 1;
					if (line.indexOf("*/") == -1) {
						//not in line
						var comment_star_pos = line.indexOf("*");
						cache.well_formed_comment_block = true
						//check for well formmed comment
						while (x < lines.length) {
							var next_line = lines[x];
							if (syntax !== "js" && next_line.indexOf('*') !== comment_star_pos) {
								cache.well_formed_comment_block = false;
							}
							if (next_line.indexOf("*/") > -1) {
								break;
							}
							x++;
						}
					}
					if (isset(cache.well_formed_comment_block) == false) {
						//either exists on a single linenot well formed

						cache.well_formed_comment_block = null;
						var start = line.indexOf("/*") - 1
						var end = line.indexOf("*/") > -1 ? line.indexOf("*/") + 2 : null;
						line = line.slice(0, start) + (end !== null ? line.slice(end, line.length) : "");  //strip out comment
						let y = line_x + 1;

						while (y < x) {
							var next_line = lines[y];
							if (next_line.indexOf("*/") > -1) {
								line = line.slice(next_line.indexOf("*/") + 2, line.length);  //strip out comment
								break;
							}
							if (next_line.indexOf('*') !== comment_star_pos) {
								line = ""; //strip out comment
							}
							y++;
						}

					}
				}
			}

			if (is_true(cache.well_formed_comment_block)) {
				if (line.indexOf("*/") > -1) {
					cache.well_formed_comment_block = null;
				}
			}

			line = " " + trim(line) + "~"; //add leading ws and eol

			var newLine = "";

			line = str_replace("(", " ( ", line); //make sure key words have spaces around them
			line = str_replace(")", " ) ", line); //make sure key words have spaces around them
			line = str_replace("{", " { ", line); //make sure key words have spaces around them
			line = str_replace("}", " } ", line); //make sure key words have spaces around them
			line = str_replace("[", " [ ", line); //make sure key words have spaces around them
			line = str_replace("]", " ] ", line); //make sure key words have spaces around them
			line = str_replace("=", " = ", line); //make sure key words have spaces around them
			line = str_replace(";", " ; ", line); //make sure key words have spaces around them

			var match_length = 0;
			var match_lock = "";
			var in_comment_line = false;
			var in_quote_str = false;
			var in_reg_str = false;
			var in_reg_str_start = false;
			var in_single_quote_str = false;
			var in_double_quote_str = false;

			for (var o in line) {
				var char_x = parseInt(o);
				var char = line[char_x];
				var prev_char = char_x > 0 ? line[char_x - 1] : '';
				var next_char = char_x < line.length ? line[char_x + 1] : '';

				//in line comment
				if (match_lock == "" || match_lock == "in_comment_line") {
					if (in_comment_line == false && char == "/" && next_char == "/") {
						in_comment_line = true;
						match_length = 2;
						match_lock = "in_comment_line"; //resets on next line
					}
					if (in_comment_line == true) {
						if (match_length > 0) {
							match_length--;
						} else {
							continue;
						}
					}
				}

				//block comment
				if (match_lock == "" || match_lock == "in_comment_block") {
					if (in_comment_block == false && char == "/" && next_char == "*") {
						match_length = 2;
						in_comment_block = true;
						match_lock = "in_comment_block";
						cache.documentLines[line_x]['lineType'] = "comment";
					}
					if (in_comment_block == true && char == "*" && next_char == "/") {
						in_comment_block = false;
						match_lock = "";//not accurate... still prints "*/". potential to mark fold row as other
					}
					if (in_comment_block == true) {
						if (match_length > 0) {
							match_length--;
						} else {
							continue;
						}
					}
				}

				//quote
				if (match_lock == "" || match_lock == "in_quote_str") {
					if (char == "`" && prev_char != "\\") {
						match_length = 1;
						in_quote_str = !in_quote_str;
						match_lock = in_quote_str ? "in_quote_str" : "";
					}
					if (in_quote_str == true) {
						if (match_length > 0) {
							match_length--;
						} else {
							continue;
						}
					}
				}

				//single quote
				if (match_lock == "" || match_lock == "in_single_quote_str") {
					if (char == "'" && prev_char != "\\") {
						match_length = 1;
						in_single_quote_str = !in_single_quote_str;
						match_lock = in_single_quote_str ? "in_single_quote_str" : "";
					}
					if (in_single_quote_str == true) {

						if (match_length > 0) {
							match_length--;
						} else {
							continue;
						}
					}
				}

				//double quote
				if (match_lock == "" || match_lock == "in_double_quote_str") {
					if (char == '"' && prev_char != "\\") {
						match_length = 1;
						in_double_quote_str = !in_double_quote_str;
						match_lock = in_double_quote_str ? "in_double_quote_str" : "";
					}
					if (in_double_quote_str == true) {
						if (match_length > 0) {
							match_length--;
						} else {
							continue;
						}
					}
				}

				//reg string
				if (match_lock == "" || match_lock == "in_reg_str") {
					if (in_reg_str_start == false && char == "/" && next_char != "*" && prev_char != "*" && prev_char != "\\") {
						match_length = 1;
						in_reg_str = true;
						match_lock = in_reg_str ? "in_reg_str" : "";
						in_reg_str_start = true;
					} else if (in_reg_str_start && char == "/" && prev_char != "\\" && prev_char != "*") {
						in_reg_str = false;
						in_reg_str_start = false;
					}
					if (in_reg_str == true) {
						if (match_length > 0) {
							match_length--;
						} else {
							continue;
						}
					}
				}

				//white space
				if (char === " ") {
					if (prev_char == " ") {
						continue;
					}
				}

				newLine += char;
			}

			cache.documentLines[line_x]['text'] = newLine;

		}
	}
	function cacheDocumentJSLine(line_x) {

		var open_bracket = new RegExp('\\{', 'g');
		var close_bracket = new RegExp('\\}', 'g');
		var open_brace = new RegExp('\\[', 'g');
		var close_brace = new RegExp('\\]', 'g');

		cache.documentLines[line_x]['isFoldType'] = false;
		cache.documentLines[line_x]['isFoldEnabled'] = false;

		var bracketStart = cache.documentLines[line_x]['text'].lastIndexOf("{");
		var braceStart = cache.documentLines[line_x]['text'].lastIndexOf("[");
		var lineCount = 0;
		var parens = 0;
		var is_parens = false;
		var found_key_line = false;

		if (braceStart > -1 && braceStart > bracketStart) {
			//found array start
			let line_xx = line_x;
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thurough
			let start = true;
			//look backwards until finding operator
			while (line_xx > -1 && max_lines > 0) {
				var line = cache.documentLines[line_xx]['text'];
				let char_x = start ? braceStart : line.length;
				while (char_x > 0) {
					if (line[char_x - 1] == "=" && line[char_x] == ">") {
						cache.documentLines[line_xx]['lineType'] = "arrayParam"; //method
						break;
					}
					if (line[char_x] == "=" || ((line[char_x] == ":" || line[char_x] == "?") && line.indexOf(":") > -1 && line.indexOf("?") > -1)) {
						cache.documentLines[line_xx]['lineType'] = "array"; //method
						break;
					}
					if (line[char_x] == "(" || line[char_x] == "," || line[char_x] == ":") {
						cache.documentLines[line_xx]['lineType'] = "arrayParam"; //objectParam
						break;
					}
					char_x--;
				}

				if (cache.documentLines[line_xx]['lineType'] !== "") {
					break;
				}

				start = false; //first line flag
				line_xx--;
				max_lines--;
				lineCount++;
			}


			//get total lines
			var line_xxx = line_x;
			let char_x = braceStart; //unformatted row
			var braceCount = 0;
			while (line_xxx < cache.documentLines.length && lineCount < 3) {
				lineCount++;
				let line = cache.documentLines[line_xxx]['text'];
				while (char_x < line.length) {
					if (line[char_x] == "{") {
						bracketCount++;
					}
					if (line[char_x] == "}") {
						bracketCount--;
					}
					if (bracketCount == 0) {
						break;
					}
					char_x++;
				}
				if (braceCount == 0) {
					break;
				}
				char_x = 0;
				line_xxx++;
			}

			if (lineCount < 3) {
				cache.documentLines[line_xx]['lineType'] = "";
			}

			setFoldInfo(line_xx);

		} else if (bracketStart > -1) {

			//get type
			let line_xx = line_x;
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thurough
			let start = true;
			while (line_xx > -1 && max_lines > 0) {

				var line = cache.documentLines[line_xx]['text'];
				let char_x = start ? bracketStart : line.length;

				var check_line = line;

				while (char_x > 0) {

					if (line[char_x] == ")") {
						is_parens = true;
						parens++;
					}

					//check for types related to matching operators
					if (is_parens == false) {
						if (char_x > 0 && line[char_x - 1] == "=" && line[char_x] == ">") {
							cache.documentLines[line_xx]['lineType'] = "method"; //method
							break;
						}
						if (line[char_x] == ":" && check_line.indexOf(" case ") > -1) {
							cache.documentLines[line_xx]['lineType'] = start ? "switchCase" : "switchCaseInvalid"; //switchCaseInvalid ... this is bad code but js allows it and needs to correct for it below
							break;
						}
						if (line[char_x] == ":" && check_line.indexOf(" default ") > -1) {
							cache.documentLines[line_xx]['lineType'] = "switchDefault"; //switchDefault
							break;
						}
						if (line[char_x] == "=" || ((line[char_x] == ":" || line[char_x] == "?") && line.indexOf(":") > -1 && line.indexOf("?") > -1)) {
							cache.documentLines[line_xx]['lineType'] = "object"; //object
							break;
						}
						if (line[char_x] == "(" || line[char_x] == "," || line[char_x] == ":") {
							cache.documentLines[line_xx]['lineType'] = "objectParam"; //objectParam
							break;
						}
					}

					//found parens which means we should have a keyword after it closes
					if (is_parens) {
						//searching for key word
						if (line[char_x] == "(") {
							parens--;
						}
						if (parens == 0) {
							found_key_line = true; //if key word not wound then will be marked as other
							check_line = line.slice(0, char_x);
							break;
						}
					}
					char_x--;
				}

				if (cache.documentLines[line_xx]['lineType'] !== "") {
					break;
				}

				//check line should contain one of these key words. if not goes to next line
				if (check_line.indexOf(" if ") > -1 || check_line.indexOf(" elseif ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "if";
					break;
				} else if (check_line.indexOf(" else ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "else";
					break;
				} else if (check_line.indexOf(" for ") > -1 || check_line.indexOf(" foreach ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "for";
					break;
				} else if (check_line.indexOf(" function ") > -1 || check_line.indexOf(" get ") > -1 || check_line.indexOf(" set ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "method";
					break;
				} else if (check_line.indexOf(" do ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "while";
					break;
				} else if (check_line.indexOf(" while ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "while";
					break;
				} else if (check_line.indexOf(" try ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "try";
					break;
				} else if (check_line.indexOf(" catch ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "tryCatch";
					break;
				} else if (check_line.indexOf(" finally ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "tryFinally";
					break;
				} else if (check_line.indexOf(" class ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "class";
					break;
				} else if (check_line.indexOf(" return ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "object";
					break;
				} else if (check_line.indexOf(" switch ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "switch";
					break;
				} else if (check_line.indexOf(" const ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "object";
					break;
				} else if (false && check_line.indexOf(" case ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "switchCase"; //will not be found here becuase there is no open bracket
					break;
				} else if (false && check_line.indexOf(" default ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "switchDefault"; //will not be found here becuase there is no open bracket
					break;
				} else if (found_key_line) {
					cache.documentLines[line_xx]['lineType'] = "method"; //default to method
					break;
				}

				start = false; //first line flag
				line_xx--;
				max_lines--;
				lineCount++;
			}

			//get total lines
			var line_xxx = line_x;
			let char_x = bracketStart; //unformatted row
			var bracketCount = 0;
			var first = true;
			while (line_xxx < cache.documentLines.length && lineCount < 3) {
				lineCount++;
				let line = cache.documentLines[line_xxx]['text'];
				if (first) {
					first = false
					while (char_x < line.length) {
						if (line[char_x] == "{") {
							bracketCount++;
						}
						if (line[char_x] == "}") {
							bracketCount--;
						}
						char_x++;
					}
				} else {
					bracketCount += (line.match(open_bracket) || []).length;
					bracketCount -= (line.match(close_bracket) || []).length;
				}
				if (bracketCount == 0) {
					break;
				}

				char_x = 0;
				line_xxx++;
			}

			if (lineCount < 3 || cache.documentLines[line_xx]['lineType'] == "other") {
				cache.documentLines[line_xx]['lineType'] = cache.documentLines[line_xx]['lineType'] == "other" ? cache.documentLines[line_xx]['lineType'] : "";
			}

			setFoldInfo(line_xx);
		}

	}
	function cacheDocumentPHPLine(line_x) {

		var open_bracket = new RegExp('\\{', 'g');
		var close_bracket = new RegExp('\\}', 'g');
		var code_data = new RegExp('[^\\{\\} ~]', 'g');
		var open_brace = new RegExp('\\[', 'g');
		var close_brace = new RegExp('\\]', 'g');

		cache.documentLines[line_x]['isFoldType'] = false;
		cache.documentLines[line_x]['isFoldEnabled'] = false;

		//comments already flagged in cacheDocumentLines();
		if (cache.documentLines[line_x]['lineType'] == "comment") {
			setFoldInfo(line_x);
			return;
		}

		var bracketStart = cache.documentLines[line_x]['text'].lastIndexOf("{");
		var braceStart = cache.documentLines[line_x]['text'].lastIndexOf("[");
		var lineCount = 0;
		var parens = 0;
		var is_parens = false;
		var found_key_line = false;

		if (braceStart > -1 && braceStart > bracketStart) {
			//found array start
			let line_xx = line_x;
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thurough
			let start = true;
			//look backwards until finding operator
			while (line_xx > -1 && max_lines > 0) {
				var line = cache.documentLines[line_xx]['text'];
				let char_x = start ? braceStart : line.length;
				while (char_x > 0) {
					if (line[char_x - 1] == "=" && line[char_x] == ">") {
						cache.documentLines[line_xx]['lineType'] = "arrayParam"; //method
						break;
					}
					if (line[char_x] == "=" || ((line[char_x] == ":" || line[char_x] == "?") && line.indexOf(":") > -1 && line.indexOf("?") > -1)) {
						cache.documentLines[line_xx]['lineType'] = "array"; //method
						cache.documentLines[line_xx]['here'] = true
						break;
					}
					if (line[char_x] == "(" || line[char_x] == "," || line[char_x] == ":") {
						cache.documentLines[line_xx]['lineType'] = "arrayParam"; //objectParam
						break;
					}
					char_x--;
				}

				if (cache.documentLines[line_xx]['lineType'] !== "") {
					break;
				}

				start = false; //first line flag
				line_xx--;
				max_lines--;
				lineCount++;
			}


			//get total lines
			var line_xxx = line_x;
			let char_x = braceStart; //unformatted row
			var braceCount = 0;
			var first = true;
			while (line_xxx < cache.documentLines.length && lineCount < 3) {
				lineCount++;
				let line = cache.documentLines[line_xxx]['text'];
				if (first) {
					first = false
					while (char_x < line.length) {
						if (line[char_x] == "[") {
							braceCount++;
						}
						if (line[char_x] == "]") {
							braceCount--;
						}
						char_x++;
					}
				} else {
					braceCount += (line.match(open_brace) || []).length;
					braceCount -= (line.match(close_brace) || []).length;
				}
				if (braceCount == 0) {
					break;
				}

				char_x = 0;
				line_xxx++;
			}

			if (lineCount < 3) {
				cache.documentLines[line_xx]['lineType'] = "";
			}

			setFoldInfo(line_xx);

		} else if (bracketStart > -1) {
			//get type
			let line_xx = line_x;
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thurough
			let start = true;
			while (line_xx > -1 && max_lines > 0) {

				var line = cache.documentLines[line_xx]['text'];
				let char_x = start ? bracketStart : line.length;

				var check_line = line;

				while (char_x > 0) {

					if (line[char_x] == ")") {
						is_parens = true;
						parens++;
					}

					//check for types related to matching operators
					if (is_parens == false) {

						if (line[char_x] == ":" && check_line.indexOf(" case ") > -1) {
							cache.documentLines[line_x]['lineType'] = start ? "switchCase" : "switchCaseInvalid"; //switchCaseInvalid ... this is bad code but js allows it and needs to correct for it below
							break;
						}
						if (line[char_x] == ":" && check_line.indexOf(" default ") > -1) {
							cache.documentLines[line_x]['lineType'] = "switchDefault"; //switchDefault
							break;
						}
						if (line[char_x] == "=" || ((line[char_x] == ":" || line[char_x] == "?") && line.indexOf(":") > -1 && line.indexOf("?") > -1)) {
							cache.documentLines[line_x]['lineType'] = "object"; //object
							break;
						}
						if (line[char_x] == "(" || line[char_x] == "," || line[char_x] == ":") {
							cache.documentLines[line_x]['lineType'] = "objectParam"; //objectParam
							break;
						}
					}

					//found parens which means we should have a keyword after it closes
					if (is_parens) {
						//searching for key word
						if (line[char_x] == "(") {
							parens--;
						}
						if (parens == 0) {
							found_key_line = true; //if key word not wound then will be marked as other
							check_line = line.slice(0, char_x);
							break;
						}
					}
					char_x--;
				}

				if (cache.documentLines[line_x]['lineType'] !== "") {
					break;
				}

				//check line should contain one of these key words. if not goes to next line
				if (check_line.indexOf(" if ") > -1 || check_line.indexOf(" elseif ") > -1) {
					cache.documentLines[line_x]['lineType'] = "if";
					break;
				} else if (check_line.indexOf(" else ") > -1) {
					cache.documentLines[line_x]['lineType'] = "else";
					break;
				} else if (check_line.indexOf(" for ") > -1 || check_line.indexOf(" foreach ") > -1) {
					cache.documentLines[line_x]['lineType'] = "for";
					break;
				} else if (check_line.indexOf(" function ") > -1 || check_line.indexOf(" get ") > -1 || check_line.indexOf(" set ") > -1) {
					cache.documentLines[line_x]['lineType'] = "method";
					break;
				} else if (check_line.indexOf(" do ") > -1) {
					cache.documentLines[line_x]['lineType'] = "while";
					break;
				} else if (check_line.indexOf(" while ") > -1) {
					cache.documentLines[line_x]['lineType'] = "while";
					break;
				} else if (check_line.indexOf(" try ") > -1) {
					cache.documentLines[line_x]['lineType'] = "try";
					break;
				} else if (check_line.indexOf(" catch ") > -1) {
					cache.documentLines[line_x]['lineType'] = "tryCatch";
					break;
				} else if (check_line.indexOf(" finally ") > -1) {
					cache.documentLines[line_x]['lineType'] = "tryFinally";
					break;
				} else if (check_line.indexOf(" class ") > -1 || check_line.indexOf(" trait ") > -1) {
					cache.documentLines[line_x]['lineType'] = "class";
					break;
				} else if (check_line.indexOf(" return ") > -1) {
					cache.documentLines[line_x]['lineType'] = "object";
					break;
				} else if (check_line.indexOf(" switch ") > -1) {
					cache.documentLines[line_x]['lineType'] = "switch";
					break;
				} else if (check_line.indexOf(" const ") > -1) {
					cache.documentLines[line_x]['lineType'] = "object";
					break;
				} else if (false && check_line.indexOf(" case ") > -1) {
					cache.documentLines[line_x]['lineType'] = "switchCase"; //will not be found here becuase there is no open bracket
					break;
				} else if (false && check_line.indexOf(" default ") > -1) {
					cache.documentLines[line_x]['lineType'] = "switchDefault"; //will not be found here becuase there is no open bracket
					break;
				} else if (found_key_line) {
					cache.documentLines[line_x]['lineType'] = "other"; //default to method
					break;
				}

				start = false; //first line flag
				line_xx--;
				max_lines--;
				//lineCount++; line count starts at bracket. not the key word line
			}

			//get total lines
			var line_xxx = line_x;
			let char_x = bracketStart;
			var bracketCount = 0;
			var first = true;
			var hasData = false; //php requires data
			while (line_xxx < cache.documentLines.length && (lineCount < 3 || hasData == false)) {
				lineCount++;
				let line = cache.documentLines[line_xxx]['text'];
				while (char_x < line.length) {
					if (line[char_x] == "{") {
						bracketCount++;
					}
					if (line[char_x] == "}") {
						bracketCount--;
					}
					if (bracketCount == 0) {
						break;
					}
					char_x++;
				}

				if (bracketCount == 0) {
					break;
				}

				//data required below start bracket
				hasData = hasData || (lineCount > 1 && (line.match(code_data) || []).length > 0);
				
				char_x = 0;
				line_xxx++;
			}

			if (hasData == false || lineCount < 3 || cache.documentLines[line_x]['lineType'] == "other") {
				cache.documentLines[line_x]['lineType'] = cache.documentLines[line_x]['lineType'] == "other" ? cache.documentLines[line_x]['lineType'] : "";
			}

			setFoldInfo(line_x);
		}

	}
	function getDocumentLines() {

		if (isset(cache.documentLines)) {
			return cache.documentLines;
		}

		cacheDocumentLines();

		var open_bracket = new RegExp('\\{', 'g');
		var close_bracket = new RegExp('\\}', 'g');
		var open_brace = new RegExp('\\[', 'g');
		var close_brace = new RegExp('\\]', 'g');
		debug(cache.documentLines)
		var hasJs = false;
		for (var i in cache.documentLines) {

			let line_x = parseInt(i);

			var syntax = cache.documentLines[line_x]['syntax'];

			if (syntax == "js") {
				hasJs = true;
				cacheDocumentJSLine(line_x);
				continue;
			}

			if (syntax == "php") {
				cacheDocumentPHPLine(line_x);
				continue;
			}

		}

		var jsCommentFoldEnabled = hasJs && getFoldEnabled("comment", "js");

		if (jsCommentFoldEnabled == true) {
			//javascript has wierd rules that only comments above var and function declarations are foldable
			var comment_lines = cache.documentLines.filter(function (item) {
				return item.lineType === "comment" && item.syntax == "js";
			});

			for (var i in comment_lines) {
				var index = parseInt(comment_lines[i]['line']);
				var line_x = index + 1;
				var valid = false;
				while (line_x < cache.documentLines.length) {
					var line = cache.documentLines[line_x];
					if (line['text'].indexOf(" var ") > -1 || line['text'].indexOf(" function ") > -1 || line['text'].indexOf(" class ") > -1) {
						valid = true;
					}
					if (in_array(line['lineType'], ["", "comment"])) {
						line_x++;
						continue;
					}
					break;
				}
				if (valid == false) {
					cache.documentLines[index]['lineType'] = "";
				}
				setFoldInfo(index);
			}

		}

		var switchFoldEnabled = hasJs && getFoldEnabled("switch", "js");
		var switchCaseFoldEnabled = hasJs && getFoldEnabled("switchCase", "js");

		if (switchFoldEnabled || switchCaseFoldEnabled) {
			//fix switchCase and switchCaseInvalid
			var switch_lines = cache.documentLines.filter(function (item) {
				return item.lineType === "switch" && item.syntax == "js";
			});

			for (var i in switch_lines) {
				var line_x = parseInt(switch_lines[i]['line']);
				var next_line = cache.documentLines[line_x]['text'];
				var switchBracketCount = (next_line.match(open_bracket) || []).length
				while (switchBracketCount > 0) {

					line_x++;
					next_line = cache.documentLines[line_x]['text'];
					switchBracketCount += (next_line.match(open_bracket) || []).length
					switchBracketCount -= (next_line.match(close_bracket) || []).length

					if (next_line.indexOf(" case ") > -1) {

						if (cache.documentLines[line_x]['lineType'] == "") {
							//found case with no brackets
							cache.documentLines[line_x]['lineType'] = "switchCase";
							setFoldInfo(line_x);
						} else if (cache.documentLines[line_x]['lineType'] == "switchCaseInvalid") {
							var start = true;//need to wait untill we find our first bracket
							//found invalid case code with bracket below key line so no folds are available
							var caseBrackCount = (next_line.match(open_bracket) || []).length;
							let lineCount = 0;
							let line_xx = line_x;
							while (caseBrackCount > 0 || start == true) {
								line_xx++;
								next_line = cache.documentLines[line_xx]['text'];
								caseBrackCount += (next_line.match(open_bracket) || []).length;
								if (caseBrackCount > 0) {
									start = false;
								}
								caseBrackCount -= (next_line.match(close_bracket) || []).length;
								if (cache.documentLines[line_xx]['lineType'] !== "") {
									cache.documentLines[line_xx]['lineType'] == "";
									setFoldInfo(line_xx);
								}
								lineCount++;
							}

							if (lineCount < 3) {
								//no fold
								cache.documentLines[line_x]['lineType'] = "";
							} else {
								cache.documentLines[line_x]['lineType'] = "switchCase";
							}

							setFoldInfo(line_x);
						}
					}
				}
			}
		}

		return cache.documentLines;
	}
	function getEnabledFoldTypes() {
		if (isset(cache.foldtypes) == false) {
			cache.foldtypes = {
				//global
				'class': { enabled: self.getConfigurationSetting('class') === "Yes" ? true : false },
				'method': { enabled: self.getConfigurationSetting('method') === "Yes" ? true : false },
				'object': { enabled: self.getConfigurationSetting('object') === "Yes" ? true : false },
				'objectParam': { enabled: self.getConfigurationSetting('object') === "Yes" ? true : false },
				'array': { enabled: self.getConfigurationSetting('array') === "Yes" ? true : false },
				'arrayParam': { enabled: self.getConfigurationSetting('array') === "Yes" ? true : false },
				'while': { enabled: self.getConfigurationSetting('while') === "Yes" ? true : false },
				'for': { enabled: self.getConfigurationSetting('for') === "Yes" ? true : false },
				'if': { enabled: self.getConfigurationSetting('if') === "Yes" ? true : false },
				'else': { enabled: self.getConfigurationSetting('else') === "Yes" ? true : false },
				'switch': { enabled: self.getConfigurationSetting('switch') === "Yes" ? true : false },
				'switchCase': { enabled: self.getConfigurationSetting('switchCase') === "Yes" ? true : false },
				'switchDefault': { enabled: self.getConfigurationSetting('switchDefault') === "Yes" ? true : false },
				'try': { enabled: self.getConfigurationSetting('try') === "Yes" ? true : false },
				'tryCatch': { enabled: self.getConfigurationSetting('tryCatch') === "Yes" ? true : false },
				'tryFinally': { enabled: self.getConfigurationSetting('tryFinally') === "Yes" ? true : false },
				'comment': { enabled: self.getConfigurationSetting('comment') === "Yes" ? true : false },
				//javascript overrides
				'jsClass': { enabled: self.getConfigurationSetting('jsClass') == "Yes" ? true : (self.getConfigurationSetting('jsClass') == "No" ? false : null) },
				'jsMethod': { enabled: self.getConfigurationSetting('jsMethod') == "Yes" ? true : (self.getConfigurationSetting('jsMethod') == "No" ? false : null) },
				'jsObject': { enabled: self.getConfigurationSetting('jsObject') == "Yes" ? true : (self.getConfigurationSetting('jsObject') == "No" ? false : null) },
				'jsObjectParam': { enabled: self.getConfigurationSetting('jsObjectParam') == "Yes" ? true : (self.getConfigurationSetting('jsObjectParam') == "No" ? false : null) },
				'jsArray': { enabled: self.getConfigurationSetting('jsArray') == "Yes" ? true : (self.getConfigurationSetting('jsArray') == "No" ? false : null) },
				'jsArrayParam': { enabled: self.getConfigurationSetting('jsArrayParam') == "Yes" ? true : (self.getConfigurationSetting('jsArrayParam') == "No" ? false : null) },
				'jsWhile': { enabled: self.getConfigurationSetting('jsWhile') == "Yes" ? true : (self.getConfigurationSetting('jsWhile') == "No" ? false : null) },
				'jsFor': { enabled: self.getConfigurationSetting('jsFor') == "Yes" ? true : (self.getConfigurationSetting('jsFor') == "No" ? false : null) },
				'jsIf': { enabled: self.getConfigurationSetting('jsIf') == "Yes" ? true : (self.getConfigurationSetting('jsIf') == "No" ? false : null) },
				'jsElse': { enabled: self.getConfigurationSetting('jsElse') == "Yes" ? true : (self.getConfigurationSetting('jsElse') == "No" ? false : null) },
				'jsSwitch': { enabled: self.getConfigurationSetting('jsSwitch') == "Yes" ? true : (self.getConfigurationSetting('jsSwitch') == "No" ? false : null) },
				'jsSwitchCase': { enabled: self.getConfigurationSetting('jsSwitchCase') == "Yes" ? true : (self.getConfigurationSetting('jsSwitchCase') == "No" ? false : null) },
				'jsSwitchDefault': { enabled: self.getConfigurationSetting('jsSwitchDefault') == "Yes" ? true : (self.getConfigurationSetting('jsSwitchDefault') == "No" ? false : null) },
				'jsTry': { enabled: self.getConfigurationSetting('jsTry') == "Yes" ? true : (self.getConfigurationSetting('jsTry') == "No" ? false : null) },
				'jsTryCatch': { enabled: self.getConfigurationSetting('jsTryCatch') == "Yes" ? true : (self.getConfigurationSetting('jsTryCatch') == "No" ? false : null) },
				'jsTryFinally': { enabled: self.getConfigurationSetting('jsTryFinally') == "Yes" ? true : (self.getConfigurationSetting('jsTryFinally') == "No" ? false : null) },
				'jsComment': { enabled: self.getConfigurationSetting('jsComment') == "Yes" ? true : (self.getConfigurationSetting('jsComment') == "No" ? false : null) },
				//php
				'phpClass': { enabled: self.getConfigurationSetting('phpClass') == "Yes" ? true : (self.getConfigurationSetting('phpClass') == "No" ? false : null) },
				'phpMethod': { enabled: self.getConfigurationSetting('phpMethod') == "Yes" ? true : (self.getConfigurationSetting('phpMethod') == "No" ? false : null) },
				'phpObject': { enabled: self.getConfigurationSetting('phpObject') == "Yes" ? true : (self.getConfigurationSetting('phpObject') == "No" ? false : null) },
				'phpArrayParam': { enabled: self.getConfigurationSetting('phpArrayParam') == "Yes" ? true : (self.getConfigurationSetting('phpArrayParam') == "No" ? false : null) },
				'phpArray': { enabled: self.getConfigurationSetting('phpArray') == "Yes" ? true : (self.getConfigurationSetting('phpArray') == "No" ? false : null) },
				'phpWhile': { enabled: self.getConfigurationSetting('phpWhile') == "Yes" ? true : (self.getConfigurationSetting('phpWhile') == "No" ? false : null) },
				'phpFor': { enabled: self.getConfigurationSetting('phpFor') == "Yes" ? true : (self.getConfigurationSetting('phpFor') == "No" ? false : null) },
				'phpIf': { enabled: self.getConfigurationSetting('phpIf') == "Yes" ? true : (self.getConfigurationSetting('phpIf') == "No" ? false : null) },
				'phpElse': { enabled: self.getConfigurationSetting('phpElse') == "Yes" ? true : (self.getConfigurationSetting('phpElse') == "No" ? false : null) },
				'phpSwitch': { enabled: self.getConfigurationSetting('phpSwitch') == "Yes" ? true : (self.getConfigurationSetting('phpSwitch') == "No" ? false : null) },
				'phpSwitchCase': { enabled: self.getConfigurationSetting('phpSwitchCase') == "Yes" ? true : (self.getConfigurationSetting('phpSwitchCase') == "No" ? false : null) },
				'phpSwitchDefault': { enabled: self.getConfigurationSetting('phpSwitchDefault') == "Yes" ? true : (self.getConfigurationSetting('phpSwitchDefault') == "No" ? false : null) },
				'phpTry': { enabled: self.getConfigurationSetting('phpTry') == "Yes" ? true : (self.getConfigurationSetting('phpTry') == "No" ? false : null) },
				'phpTryCatch': { enabled: self.getConfigurationSetting('phpTryCatch') == "Yes" ? true : (self.getConfigurationSetting('phpTryCatch') == "No" ? false : null) },
				'phpTryFinally': { enabled: self.getConfigurationSetting('phpTryFinally') == "Yes" ? true : (self.getConfigurationSetting('phpTryFinally') == "No" ? false : null) },
				'phpComment': { enabled: self.getConfigurationSetting('phpComment') == "Yes" ? true : (self.getConfigurationSetting('phpComment') == "No" ? false : null) },
				//css
				'css': { enabled: self.getConfigurationSetting('css', true) },
			};
		}
		return cache.foldtypes;
	}
	function getFoldEnabled(lineType, syntax, index) {
		var foldTypes = getEnabledFoldTypes();
		var globalEnabled = isset(foldTypes[lineType]) && foldTypes[lineType]['enabled'] == true;
		var syntaxEnabled = isset(foldTypes[syntax + ucwords(lineType)]) ? foldTypes[syntax + ucwords(lineType)]['enabled'] : null;
		if (isset(index)) {
			cache.documentLines[index]['isGlobalFoldEnabled'] = globalEnabled;
			cache.documentLines[index]['isSyntaxFoldEnabled'] = syntaxEnabled;
			cache.documentLines[index]['settingKey'] = syntax + ucwords(lineType);
		}

		var foldEnabled = syntaxEnabled !== null ? syntaxEnabled : globalEnabled;
		return foldEnabled;
	}
	function setFoldInfo(index) {
		var lineType = cache.documentLines[index]['lineType'];
		var validType = lineType !== "" && lineType !== "other";
		if (validType) {
			var syntax = cache.documentLines[index]['syntax'];
			var foldEnabled = getFoldEnabled(lineType, syntax, index);
		}
		cache.documentLines[index]['isFoldType'] = validType ? true : false;
		cache.documentLines[index]['isFoldEnabled'] = validType ? foldEnabled : false;
	}

	//fold
	async function fold(lines) {
		var linesTofold = getLinesToFold(lines);
		var lineNumbers = array_column(linesTofold, 'line');
		if (lineNumbers.length > 0) {
			await application.editorFoldLines(lineNumbers);
		}
	}
	async function unFold(lines) {
		var lineNumbers = array_column(lines, 'line');
		if (lineNumbers.length > 0) {
			await application.editorUnFoldLines(lineNumbers);
		}
	}

	//actions
	function fallback(command) {
		if (self.isValidDocType() == false) {
			vscode.window.showInformationMessage("FoldTypes: Not a valid file type. Using default " + command);
			application.executeCommand(command);
			return true;
		}
		return false;
	}
	this.foldAll = async function () {
		if (fallback('editor.foldAll')) {
			return;
		}
		cache = {};
		log('commandFoldAll')
		var cursorPosition = application.editorCursorPosition();
		var parentLineNumber = getParentTopLineNumber();
		var lines = getDocumentLines();

		// debug(lines.filter(function (item) {
		// 	return item.lineType == "if"
		// }));

		await unFold(lines); //need to reset all lines to open first
		await fold(lines);
		if (parentLineNumber == -1) {
			application.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
		} else {
			application.editorSetCursorPosition(parentLineNumber); //place cursor at start of parent
		}
	}
	this.foldParent = async function () {
		if (fallback('editor.fold')) {
			return;
		}
		cache = {};
		log('commandFoldParent')
		var cursorPosition = application.editorCursorPosition();
		var parentLineNumber = getParentTopLineNumber();
		var lines = getParentLines();
		await unFold(lines); //need to reset all lines to open first
		await fold(lines);
		if (parentLineNumber == -1) {
			application.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
		} else {
			application.editorSetCursorPosition(parentLineNumber); //place cursor at start of parent
		}
	}
	this.foldChildren = async function () {
		if (fallback('editor.foldLevel1')) {
			return;
		}
		cache = {};
		log('commandFoldChildren');
		var cursorPosition = application.editorCursorPosition();
		var lines = getParentLines(true);
		debug(lines);
		await unFold(lines); //need to reset all lines to open first
		await fold(lines);
		application.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
	}
	this.unFoldAll = async function () {
		if (fallback('editor.unfoldAll')) {
			return;
		}
		log('unFoldAll');
		//not really neccessary but people will probably wonder why and unfold all didnt come packaged with the extension
		await application.executeCommand('editor.unfoldAll');
	}
	this.unFoldParent = async function () {
		if (fallback('editor.unfold')) {
			return;
		}
		log('unFoldParent');
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
	log('FoldTypes Active')
	context = _context
	var application = new Application();
	var foldTypes = new FoldTypes(application);
	application.registerCommand('fold-types.fold-all', async function () {
		await foldTypes.foldAll();
	});
	application.registerCommand('fold-types.fold-parent', async function () {
		await foldTypes.foldParent();
	});
	application.registerCommand('fold-types.fold-children', async function () {
		await foldTypes.foldChildren();
	});
	application.registerCommand('fold-types.unfold-all', async function () {
		await foldTypes.unFoldAll();
	});
	application.registerCommand('fold-types.unfold-parent', async function () {

		await foldTypes.unFoldParent();
	});
	application.on('documentOpen', function (document) {
		if (foldTypes.isValidDocType()) {
			log('documentOpen');
			var globalAutoFold = foldTypes.getConfigurationSetting("autoFold");
			var fileTypeAutoFold = foldTypes.getConfigurationSetting(application.documentType() + '_autoFold');
			var autoFold = fileTypeAutoFold !== null ? fileTypeAutoFold : globalAutoFold;
			if (autoFold == "Yes") {
				setTimeout(function () {
					application.executeCommand('fold-types.fold-all');
				})
			}
		}
	});

	application.activate(); //call last so any registered events are emmited
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
