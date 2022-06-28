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

//extension
/**
 * @param {Application} application
 */
var FoldTypes = function (application) {

	var self = this;

	//private vars
	let cache = {};

	//config data
	this.getConfiguration = function () {
		return vscode.workspace.getConfiguration('fold-types');
	}
	this.getConfigurationSetting = function (key, default_value) {
		var subKey = null;
		if (key.indexOf('.') > -1) {
			var list = key.split('.');
			subKey = list[0];
			key = list[1];
		}
		var config = vscode.workspace.getConfiguration('fold-types');
		var value = null;
		if (subKey) {
			value = isset(config[subKey][key]) ? config[subKey][key] : null;
		} else {
			value = config[key];
		}
		return isset(value) ? value : (isset(default_value) ? default_value : null);
	}
	this.isValidDocType = function () {
		var validDocTypes = ['js', 'php', 'css']
		return in_array(application.documentType(), validDocTypes);
	}

	//Line Info test
	function getLinesToFold(lines, foldParent) {
		var linesToFold = [];
		var first_line = true;
		for (var i in lines) {
			//override enabled settings for parent // never fold last line
			if ((parseInt(i) < lines.length - 1) && (lines[i]['isFoldEnabled'] == true || (is_true(foldParent) && first_line && lines[i]['isFoldType'] == true))) {
				linesToFold.push(lines[i]);
			}
			first_line = false;
		}
		return linesToFold;
	}
	function getParentTopLineNumber(lineType) {

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

		lineType = isset(lineType) ? lineType : null;

		if (lines[lineNumber]['isFoldType'] == true && (lineType === null || in_array(lines[lineNumber]['lineType'], lineType) == true)) {
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
		while (lineNumber >= 0 && (lines[lineNumber]['isFoldType'] == false || (lineType !== null && is_true(lines[lineNumber]['defined']) == false && in_array(lines[lineNumber]['lineType'], lineType) == false))) {
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

		var foldLevel = 0;
		var wsCheck = new RegExp('[^ ]', '');
		for (var i in lines) {

			var line_x = parseInt(i);
			var line = lines[line_x];

			line = str_replace("\t", " ", line); //make sure key words have spaces around them

			var tabLevelArray = (line.match(wsCheck) || null)
			var tabLevel = tabLevelArray == null ? 0 : line.indexOf(tabLevelArray[0]);

			line = " " + line + " ~"; //add leading ws and eol

			cache.documentLines[line_x] = {};
			cache.documentLines[line_x]['lineType'] = "";
			cache.documentLines[line_x]['line'] = line_x;
			cache.documentLines[line_x]['syntax'] = syntax;
			cache.documentLines[line_x]['tabLevel'] = tabLevel;
			cache.documentLines[line_x]['text'] = "";
			cache.documentLines[line_x]['isFoldType'] = false;
			cache.documentLines[line_x]['isFoldEnabled'] = false;

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



			//php is weird and requires well formed where as javascript does not
			if (isset(cache.well_formed_comment_block) == false) {
				if (line.indexOf("/*") > -1) {
					var x = line_x + 1;
					cache.well_formed_comment_block = false;
					if (line.indexOf("*/") == -1) {
						//not in line
						var comment_star_pos = line.indexOf("*");
						cache.well_formed_comment_block = true
						//check for well formed comment
						while (x < lines.length) {
							var next_line = lines[x];
							if (syntax !== "js" && next_line.indexOf('*') !== comment_star_pos) {
								cache.well_formed_comment_block = false;
								break;
							}
							if (next_line.indexOf("*/") > -1) {
								break;
							}
							x++;
						}
					}

					if (is_true(cache.well_formed_comment_block) == false) {
						//either exists on a single line not well formed

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

					} else {
						cache.documentLines[line_x]['lineType'] = "comment";
					}
				}
			}

			if (is_true(cache.well_formed_comment_block)) {
				if (line.indexOf("*/") > -1) {
					cache.well_formed_comment_block = null;
				}
			}



			var newLine = "";

			line = str_replace("(", " ( ", line); //make sure key words have spaces around them
			line = str_replace(")", " ) ", line); //make sure key words have spaces around them
			line = str_replace("{", " { ", line); //make sure key words have spaces around them
			line = str_replace("}", " } ", line); //make sure key words have spaces around them
			line = str_replace("[", " [ ", line); //make sure key words have spaces around them
			line = str_replace("]", " ] ", line); //make sure key words have spaces around them
			line = str_replace("=", " = ", line); //make sure key words have spaces around them
			line = str_replace(";", " ; ", line); //make sure key words have spaces around them
			line = str_replace(":", " : ", line); //make sure key words have spaces around them

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
				var prev2_char = char_x > 1 ? line[char_x - 2] : '';
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
					if (char == "`" && (prev_char != "\\" || prev2_char == "\\")) {
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
					if (char == "'" && (prev_char != "\\" || prev2_char == "\\")) {
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
					if (char == '"' && (prev_char != "\\" || prev2_char == "\\")) {
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

		debug(cache.documentLines)
	}
	function cacheDocumentJSLine(line_x) {



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
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thorough
			let start = true;
			//look backwards until finding operator
			while (line_xx > -1 && max_lines > 0) {
				var line = cache.documentLines[line_xx]['text'];
				let char_x = start ? braceStart - 1 : line.length;
				while (char_x > 0) {
					if (line[char_x - 1] == "=" && line[char_x] == ">") {
						cache.documentLines[line_xx]['lineType'] = "arrayFunctionParam"; //arrayFunctionParam
						break;
					}
					if (line[char_x] == "=" || ((line[char_x] == ":" || line[char_x] == "?") && line.indexOf(":") > -1 && line.indexOf("?") > -1)) {
						cache.documentLines[line_xx]['lineType'] = "array"; //method
						break;
					}
					if (line[char_x] == "(" || line[char_x] == ",") {
						cache.documentLines[line_xx]['lineType'] = "arrayFunctionParam"; //arrayFunctionParam
						break;
					}
					if (line[char_x] == ":" || line[char_x] == "[") {
						cache.documentLines[line_xx]['lineType'] = "arrayObjectParam"; //arrayObjectParam
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
			let char_x = braceStart;
			var braceCount = 0;
			while (line_xxx < cache.documentLines.length && lineCount < 3) {
				lineCount++;
				let line = cache.documentLines[line_xxx]['text'];
				while (char_x < line.length) {
					if (line[char_x] == "[") {
						braceCount++;
					}
					if (line[char_x] == "]") {
						braceCount--;
					}
					if (braceCount == 0) {
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
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thorough
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
						if (line[char_x] == "=" || ((line[char_x] == ":" || line[char_x] == "?") && line.indexOf(":") > -1 && line.indexOf("?") > -1)) {
							cache.documentLines[line_xx]['lineType'] = "object"; //object
							break;
						}
						if (line[char_x] == "(" || line[char_x] == ",") {
							cache.documentLines[line_xx]['lineType'] = "objectFunctionParam"; //objectParam
							break;
						}
						if (line[char_x] == ":" || line[char_x] == "[") {
							cache.documentLines[line_xx]['lineType'] = "objectObjectParam"; //objectParam
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
					cache.documentLines[line_xx]['defined'] = false;
					var char_xx = cache.documentLines[line_xx]['text'].indexOf(" function ");
					if (char_xx > -1) {
						cache.documentLines[line_xx]['defined'] = true;
						//detect if declaration or anonymous
						while (char_xx >= 0) {
							if (char_xx === " ") {

							} else if (char_xx == "=") {
								break; //true
							} else {
								cache.documentLines[line_xx]['defined'] = false;
								break;
							}
							char_xx--;
						}
					}
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
					cache.documentLines[line_xx]['defined'] = true;
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
			let char_x = bracketStart;
			var bracketCount = 0;
			var code_data = new RegExp('[^\\{\\}\\ ~]', 'g');
			var hasData = false; //default behavior requires data to fold
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

			// if (hasData == false || lineCount < 3 || cache.documentLines[line_x]['lineType'] == "other") {
			if (lineCount < 3 || cache.documentLines[line_x]['lineType'] == "other") {
				cache.documentLines[line_x]['lineType'] = cache.documentLines[line_x]['lineType'] == "other" ? cache.documentLines[line_x]['lineType'] : "";
			}

			setFoldInfo(line_xx);
		}

	}
	function cacheDocumentPHPLine(line_x) {

		var bracketStart = cache.documentLines[line_x]['text'].lastIndexOf("{");
		var braceStart = cache.documentLines[line_x]['text'].lastIndexOf("[");
		var arrayStart = cache.documentLines[line_x]['text'].lastIndexOf(" array ");
		var lineCount = 0;

		if (arrayStart > -1 && arrayStart > bracketStart) {
			//get total lines
			var open_parens = new RegExp('\\(', 'g');
			var close_parens = new RegExp('\\(', 'g');
			var line_xxx = line_x;
			let char_x = arrayStart;
			var braceCount = 0;
			var first = true;
			var startLineCount = false;
			var collapseLine = null;

			while (line_xxx < cache.documentLines.length && lineCount < 3) {
				let line = cache.documentLines[line_xxx]['text'];
				while (char_x < line.length) {
					if (line[char_x] == "(") {
						braceCount++;
						startLineCount = true;
					}
					if (line[char_x] == ")") {
						braceCount--;
					}
					char_x++;
				}
				if (startLineCount) {
					lineCount++;
				}
				if (lineCount == 1) {
					collapseLine = line_xxx;
				}
				if (startLineCount == true && braceCount == 0) {
					break;
				}
				char_x = 0;
				line_xxx++;
			}

			if (lineCount > 2) {
				cache.documentLines[collapseLine]['lineType'] = "array";
				setFoldInfo(collapseLine);
			}


		} else if (braceStart > -1 && braceStart > bracketStart) {
			//found array start
			let line_xx = line_x;
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thurough
			let start = true;
			//look backwards until finding operator
			while (line_xx > -1 && max_lines > 0) {
				var line = cache.documentLines[line_xx]['text'];
				let char_x = start ? braceStart - 1 : line.length;
				while (char_x > 0) {
					if (line[char_x - 1] == "=" && line[char_x] == ">" || line[char_x] == "[") {
						cache.documentLines[line_xx]['lineType'] = "arrayObjectParam"; //method
						break;
					}
					if (line[char_x] == "=" || ((line[char_x] == ":" || line[char_x] == "?") && line.indexOf(":") > -1 && line.indexOf("?") > -1)) {
						cache.documentLines[line_xx]['lineType'] = "array"; //method
						break;
					}
					if (line[char_x] == "(" || line[char_x] == ",") {
						cache.documentLines[line_xx]['lineType'] = "arrayFunctionParam"; //objectParam
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
			let char_x = braceStart;
			var braceCount = 0;
			var code_data = new RegExp('[^\\{\\}/ ~]', 'g');
			while (line_xxx < cache.documentLines.length && (lineCount < 3 || hasData == false)) {
				lineCount++;
				let line = cache.documentLines[line_xxx]['text'];
				while (char_x < line.length) {
					if (line[char_x] == "[") {
						braceCount++;
					}
					if (line[char_x] == "]") {
						braceCount--;
					}
					if (braceCount == 0) {
						break;
					}
					char_x++;
				}
				if (braceCount == 0) {
					break;
				}
				//data required below start bracket
				hasData = hasData || (lineCount > 1 && (line.match(code_data) || []).length > 0);
				char_x = 0;
				line_xxx++;
			}

			if (hasData == false || lineCount < 3) {
				cache.documentLines[line_xx]['lineType'] = "";
			}

			setFoldInfo(line_xx);

		} else if (bracketStart > -1) {
			//get type
			var parens = 0;
			var is_parens = false;
			var found_key_line = false;
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
					cache.documentLines[line_xx]['defined'] = false;
					var char_xx = cache.documentLines[line_xx]['text'].indexOf(" function ");
					if (char_xx > -1) {
						cache.documentLines[line_xx]['defined'] = true;
						//detect if declaration or anonymous
						while (char_xx >= 0) {
							if (cache.documentLines[line_xx]['text'][char_xx] === " ") {

							} else if (cache.documentLines[line_xx]['text'][char_xx] == "=") {
								break; //true
							} else {
								cache.documentLines[line_xx]['defined'] = false;
								break;
							}

							char_xx--;
						}
					}
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
					cache.documentLines[line_xx]['defined'] = true;
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
			var hasData = false; //default behavior requires data to fold
			var code_data = new RegExp('[^\\{\\}/ ~]', 'g');
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
	function cacheDocumentCSSLine(line_x) {

		cache.documentLines[line_x]['isFoldType'] = false;
		cache.documentLines[line_x]['isFoldEnabled'] = false;

		var bracketStart = cache.documentLines[line_x]['text'].lastIndexOf("{");
		var lineCount = 0;

		if (bracketStart > -1) {
			cache.documentLines[line_x]['lineType'] = "block";
			//get total lines
			var line_xxx = line_x;
			let char_x = bracketStart;
			var bracketCount = 0;
			var code_data = new RegExp('[^\\{\\}\\ ~]', 'g');
			var hasData = false; //default behavior requires data to fold
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

				hasData = hasData || (lineCount > 1 && (line.match(code_data) || []).length > 0);

				char_x = 0;
				line_xxx++;
			}

			//has data not required
			if (lineCount < 3) {
				cache.documentLines[line_x]['lineType'] = "";
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

		var hasJs = false;
		for (var i in cache.documentLines) {

			let line_x = parseInt(i);

			//comments already flagged in cacheDocumentLines();
			if (cache.documentLines[line_x]['lineType'] == "comment") {
				setFoldInfo(line_x);
				continue;
			}

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

			if (syntax == "css") {
				cacheDocumentCSSLine(line_x);
				continue;
			}

		}

		var jsCommentFoldEnabled = hasJs && getFoldEnabled("comment", "js");

		if (jsCommentFoldEnabled == true) {
			//javascript has weird rules that only comments above var and function declarations are foldable
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

		var jsSwitchCaseFoldEnabled = getFoldEnabled("switchCase", "js");
		var phpSwitchCaseFoldEnabled = getFoldEnabled("switchCase", "php");

		if (jsSwitchCaseFoldEnabled || phpSwitchCaseFoldEnabled) {
			//fix switchCase and switchCaseInvalid
			var switch_lines = cache.documentLines.filter(function (item) {
				return item.lineType === "switch" && ((item.syntax == 'js' && jsSwitchCaseFoldEnabled) || (item.syntax == 'php' && phpSwitchCaseFoldEnabled));
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
					var isCase = next_line.indexOf(" case ") > -1;
					var isDefault = next_line.indexOf(" default ") > -1;
					if (isCase || isDefault) {

						var code_data = new RegExp('[^\\{\\}: ~]', 'g');
						//found case with no brackets
						var x = line_x + 1;
						next_line = cache.documentLines[x]['text'];
						var hasData = false; //default behavior requires data to fold
						var b = switchBracketCount;
						while (b > 0 && next_line.indexOf(" case ") == -1 && next_line.indexOf(" default ") == -1 && hasData == false) {
							next_line = cache.documentLines[x]['text'];
							//data required
							hasData = hasData || (next_line.match(code_data) || []).length > 0;
							b += (next_line.match(open_bracket) || []).length
							b -= (next_line.match(close_bracket) || []).length
							x++;
						}
						if (x - line_x > 1) {
							cache.documentLines[line_x]['lineType'] = isCase ? "switchCase" : "switchDefault";
						}
						setFoldInfo(line_x);

					}
				}
			}
		}

		return cache.documentLines;
	}
	function getEnabledFoldTypes() {
		if (isset(cache.foldTypes) == false) {
			cache.foldTypes = {
				//global
				'class': { enabled: self.getConfigurationSetting('global.class') === "Yes" ? true : false },
				'method': { enabled: self.getConfigurationSetting('global.method') === "Yes" ? true : false },
				'object': { enabled: self.getConfigurationSetting('global.object') === "Yes" ? true : false },
				'objectFunctionParam': { enabled: self.getConfigurationSetting('global.object') === "Yes" ? true : false },
				'objectObjectParam': { enabled: self.getConfigurationSetting('global.object') === "Yes" ? true : false },
				'array': { enabled: self.getConfigurationSetting('global.array') === "Yes" ? true : false },
				'arrayFunctionParam': { enabled: self.getConfigurationSetting('global.array') === "Yes" ? true : false },
				'arrayObjectParam': { enabled: self.getConfigurationSetting('global.array') === "Yes" ? true : false },
				'while': { enabled: self.getConfigurationSetting('global.while') === "Yes" ? true : false },
				'for': { enabled: self.getConfigurationSetting('global.for') === "Yes" ? true : false },
				'if': { enabled: self.getConfigurationSetting('global.if') === "Yes" ? true : false },
				'else': { enabled: self.getConfigurationSetting('global.else') === "Yes" ? true : false },
				'switch': { enabled: self.getConfigurationSetting('global.switch') === "Yes" ? true : false },
				'switchCase': { enabled: self.getConfigurationSetting('global.switchCase') === "Yes" ? true : false },
				'switchDefault': { enabled: self.getConfigurationSetting('global.switchDefault') === "Yes" ? true : false },
				'try': { enabled: self.getConfigurationSetting('global.try') === "Yes" ? true : false },
				'tryCatch': { enabled: self.getConfigurationSetting('global.tryCatch') === "Yes" ? true : false },
				'tryFinally': { enabled: self.getConfigurationSetting('global.tryFinally') === "Yes" ? true : false },
				'comment': { enabled: self.getConfigurationSetting('global.comment') === "Yes" ? true : false },
				//javascript overrides
				'js.class': { enabled: self.getConfigurationSetting('js.class') == "Yes" ? true : (self.getConfigurationSetting('js.class') == "No" ? false : null) },
				'js.method': { enabled: self.getConfigurationSetting('js.method') == "Yes" ? true : (self.getConfigurationSetting('js.method') == "No" ? false : null) },
				'js.object': { enabled: self.getConfigurationSetting('js.object') == "Yes" ? true : (self.getConfigurationSetting('js.object') == "No" ? false : null) },
				'js.objectFunctionParam': { enabled: self.getConfigurationSetting('js.objectFunctionParam') == "Yes" ? true : (self.getConfigurationSetting('js.objectFunctionParam') == "No" ? false : null) },
				'js.objectObjectParam': { enabled: self.getConfigurationSetting('js.objectObjectParam') == "Yes" ? true : (self.getConfigurationSetting('js.objectObjectParam') == "No" ? false : null) },
				'js.array': { enabled: self.getConfigurationSetting('js.array') == "Yes" ? true : (self.getConfigurationSetting('js.array') == "No" ? false : null) },
				'js.arrayParam': { enabled: self.getConfigurationSetting('js.arrayParam') == "Yes" ? true : (self.getConfigurationSetting('js.arrayParam') == "No" ? false : null) },
				'js.while': { enabled: self.getConfigurationSetting('js.while') == "Yes" ? true : (self.getConfigurationSetting('js.while') == "No" ? false : null) },
				'js.for': { enabled: self.getConfigurationSetting('js.for') == "Yes" ? true : (self.getConfigurationSetting('js.for') == "No" ? false : null) },
				'js.if': { enabled: self.getConfigurationSetting('js.if') == "Yes" ? true : (self.getConfigurationSetting('js.if') == "No" ? false : null) },
				'js.else': { enabled: self.getConfigurationSetting('js.else') == "Yes" ? true : (self.getConfigurationSetting('js.else') == "No" ? false : null) },
				'js.switch': { enabled: self.getConfigurationSetting('js.switch') == "Yes" ? true : (self.getConfigurationSetting('js.switch') == "No" ? false : null) },
				'js.switchCase': { enabled: self.getConfigurationSetting('js.switchCase') == "Yes" ? true : (self.getConfigurationSetting('js.switchCase') == "No" ? false : null) },
				'js.switchDefault': { enabled: self.getConfigurationSetting('js.switchDefault') == "Yes" ? true : (self.getConfigurationSetting('js.switchDefault') == "No" ? false : null) },
				'js.try': { enabled: self.getConfigurationSetting('js.try') == "Yes" ? true : (self.getConfigurationSetting('js.try') == "No" ? false : null) },
				'js.tryCatch': { enabled: self.getConfigurationSetting('js.tryCatch') == "Yes" ? true : (self.getConfigurationSetting('js.tryCatch') == "No" ? false : null) },
				'js.tryFinally': { enabled: self.getConfigurationSetting('js.tryFinally') == "Yes" ? true : (self.getConfigurationSetting('js.tryFinally') == "No" ? false : null) },
				'js.comment': { enabled: self.getConfigurationSetting('js.comment') == "Yes" ? true : (self.getConfigurationSetting('js.comment') == "No" ? false : null) },
				//php
				'php.class': { enabled: self.getConfigurationSetting('php.class') == "Yes" ? true : (self.getConfigurationSetting('php.class') == "No" ? false : null) },
				'php.method': { enabled: self.getConfigurationSetting('php.method') == "Yes" ? true : (self.getConfigurationSetting('php.method') == "No" ? false : null) },
				'php.array': { enabled: self.getConfigurationSetting('php.array') == "Yes" ? true : (self.getConfigurationSetting('php.array') == "No" ? false : null) },
				'php.arrayFunctionParam': { enabled: self.getConfigurationSetting('php.arrayFunctionParam') == "Yes" ? true : (self.getConfigurationSetting('php.arrayFunctionParam') == "No" ? false : null) },
				'php.arrayObjectParam': { enabled: self.getConfigurationSetting('php.arrayObjectParam') == "Yes" ? true : (self.getConfigurationSetting('php.arrayObjectParam') == "No" ? false : null) },
				'php.while': { enabled: self.getConfigurationSetting('php.while') == "Yes" ? true : (self.getConfigurationSetting('php.while') == "No" ? false : null) },
				'php.for': { enabled: self.getConfigurationSetting('php.for') == "Yes" ? true : (self.getConfigurationSetting('php.for') == "No" ? false : null) },
				'php.if': { enabled: self.getConfigurationSetting('php.if') == "Yes" ? true : (self.getConfigurationSetting('php.if') == "No" ? false : null) },
				'php.else': { enabled: self.getConfigurationSetting('php.else') == "Yes" ? true : (self.getConfigurationSetting('php.else') == "No" ? false : null) },
				'php.switch': { enabled: self.getConfigurationSetting('php.switch') == "Yes" ? true : (self.getConfigurationSetting('php.switch') == "No" ? false : null) },
				'php.switchCase': { enabled: self.getConfigurationSetting('php.switchCase') == "Yes" ? true : (self.getConfigurationSetting('php.switchCase') == "No" ? false : null) },
				'php.switchDefault': { enabled: self.getConfigurationSetting('php.switchDefault') == "Yes" ? true : (self.getConfigurationSetting('php.switchDefault') == "No" ? false : null) },
				'php.try': { enabled: self.getConfigurationSetting('php.try') == "Yes" ? true : (self.getConfigurationSetting('php.try') == "No" ? false : null) },
				'php.tryCatch': { enabled: self.getConfigurationSetting('php.tryCatch') == "Yes" ? true : (self.getConfigurationSetting('php.tryCatch') == "No" ? false : null) },
				'php.tryFinally': { enabled: self.getConfigurationSetting('php.tryFinally') == "Yes" ? true : (self.getConfigurationSetting('php.tryFinally') == "No" ? false : null) },
				'php.comment': { enabled: self.getConfigurationSetting('php.comment') == "Yes" ? true : (self.getConfigurationSetting('php.comment') == "No" ? false : null) },
				//css
				'css.block': { enabled: self.getConfigurationSetting('css.block') === "Yes" ? true : false },
			};
		}
		return cache.foldTypes;
	}
	function getFoldEnabled(lineType, syntax, index) {
		var foldTypes = getEnabledFoldTypes();
		var globalEnabled = isset(foldTypes[lineType]) && foldTypes[lineType]['enabled'] == true;
		var settingKey = syntax + "." + lineType;
		var syntaxEnabled = isset(foldTypes[settingKey]) ? foldTypes[settingKey]['enabled'] : null;
		if (isset(index)) {
			cache.documentLines[index]['isGlobalFoldEnabled'] = globalEnabled;
			cache.documentLines[index]['isSyntaxFoldEnabled'] = syntaxEnabled;
			cache.documentLines[index]['settingKey'] = settingKey;
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
	async function fold(lines, foldParent) {
		var linesToFold = getLinesToFold(lines, foldParent);
		debug(linesToFold)
		var lineNumbers = array_column(linesToFold, 'line');
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
		var parentLineNumber = getParentTopLineNumber(['method', 'class']);
		var lines = getDocumentLines();
		debug(parentLineNumber)
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
		await fold(lines, true);
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

	application.activate(); //call last so any registered events are emmited
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
