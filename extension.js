const vscode = require('vscode');
var path = require("path");

/**
 * @type {vscode.ExtensionContext}
 */
var context;

//helpers
function isset(object) {
	if (typeof object != 'undefined' && object !== null) {

		//return NaN as false
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


function Extend(self, parent, p1, p2, p3) {
	//because prototype is ugly
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

	Extend(this, EventHandler);

	var cache = {};

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
	this.editorFormatDocument = async function () {
		await vscode.commands.executeCommand('editor.action.formatDocument');
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
		var validDocTypes = ['js', 'php', 'css', 'html', 'htm']
		return in_array(application.documentType(), validDocTypes);
	}

	function getLinesToFold(lines, isFoldType) {
		var linesToFold = [];
		for (var i in lines) {
			//override enabled settings for parent // never fold last line
			if ((parseInt(i) < lines.length - 1) && (lines[i]['isFoldEnabled'] == true || (is_true(isFoldType) && lines[i]['isFoldType'] == true))) {
				linesToFold.push(lines[i]);
			}
			first_line = false;
		}
		return linesToFold;
	}
	function getParentTopLineNumber(isFoldEnabled) {

		isFoldEnabled = isset(isFoldEnabled) ? isFoldEnabled : false; //default

		let key = is_true(isFoldEnabled) ? 'parentTopLineIsFoldType' : 'parentTopIsFoldEnabled';
		if (isset(cache[key])) {
			return cache[key];
		}

		var lines = getDocumentLines();
		var cursorPosition = application.editorCursorPosition();
		if (cursorPosition === null) {
			return 0;
		}
		var lineNumber = cursorPosition.line;

		//if already on fold line then treat that line as parent
		if (is_true(isFoldEnabled)) {
			if (lines[lineNumber]['isFoldEnabled'] == true) {
				cache[key] = lineNumber
				return lineNumber;
			}
		} else {
			//normal
			if (lines[lineNumber]['isFoldType'] == true) {
				cache[key] = lineNumber;
				return lineNumber;
			}
		}

		var level = lines[lineNumber]['level'];

		while (lineNumber > -1) {
			//parent should be on lower level
			if (lines[lineNumber]['level'] < level) {
				if (is_true(isFoldEnabled)) {
					if (lines[lineNumber]['isFoldEnabled'] == true) {
						break;
					}
				} else {
					//normal
					if (lines[lineNumber]['isFoldType'] == true) {
						break;
					}
				}
			}

			lineNumber--;
		}

		cache[key] = lineNumber;

		return lineNumber;
	}
	function getParentBottomLineNumber(isFoldEnabled) {

		isFoldEnabled = isset(isFoldEnabled) ? isFoldEnabled : false; //default

		let key = is_true(isFoldEnabled) ? 'parentBottomLineIsFoldType' : 'parentBottomIsFoldEnabled';
		if (isset(cache[key])) {
			return cache[key];
		}

		var lines = getDocumentLines();
		var cursorPosition = application.editorCursorPosition();
		if (cursorPosition === null) {
			return lines.length - 1;
		}

		var lineNumber = getParentTopLineNumber(isFoldEnabled);

		if (lineNumber == -1) {
			return lines.length - 1;; // parent is whole document
		}

		let level = lines[lineNumber]['level'];

		lineNumber++;
		while (lineNumber < lines.length) {
			if (lines[lineNumber]['level'] == level) {
				break;
			}
			lineNumber++;
		}

		cache[key] = lineNumber;

		return lineNumber;
	}
	function getParentLines() {
		var topLineNumber = getParentTopLineNumber();
		var bottomLineNumber = getParentBottomLineNumber();
		var lines = getDocumentLines();
		if (topLineNumber == -1) {
			return lines; //parent is whole document
		}
		var parentLines = new Array;
		parentLines = lines.slice(topLineNumber, bottomLineNumber);
		return parentLines;
	}
	function getParentChildrenLines() {
		var topLineNumber = getParentTopLineNumber() + 1;
		var bottomLineNumber = getParentBottomLineNumber() - 1;
		var lines = getDocumentLines();
		if (topLineNumber == -1) {
			return lines; //parent is whole document
		}
		var parentLines = new Array;
		parentLines = lines.slice(topLineNumber, bottomLineNumber);
		return parentLines;
	}

	let elementTypes = ['head', 'body', 'div', 'ul', 'a', 'select', 'button', 'script', 'style', 'table', 'tbody', 'thead', 'tfoot', 'tfoot', 'tfoot', 'tr', 'td', 'th'];
	let elementVoids = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'path', 'source', 'track', 'wbr'];

	function getDocumentLines() {

		if (isset(cache.documentLines)) {
			return cache.documentLines;
		}

		cacheDocumentLines();

		var open_bracket = new RegExp('\\{', 'g');
		var close_bracket = new RegExp('\\}', 'g');
		var open_brace = new RegExp('\\[', 'g');
		var close_brace = new RegExp('\\]', 'g');

		var level = 0;
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
				cacheDocumentJsLine(line_x);
				continue;
			}

			if (syntax == "php") {
				cacheDocumentPhpLine(line_x);
				continue;
			}

			if (syntax == "css") {
				cacheDocumentCssLine(line_x);
				continue;
			}

			if (syntax == "html") {
				cacheDocumentHtmlLine(line_x);
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
	function cacheDocumentLines() {

		var lines = application.documentLines();

		var fileType = application.documentType();
		var syntax = null;
		if (in_array(fileType, ['js', 'css']) == true) {
			syntax = fileType;
		}
		if (in_array(fileType, ['htm', 'html']) == true) {
			syntax = 'html';
		}

		var in_comment_block = false;

		cache.documentLines = new Array;

		for (var i in lines) {

			let line_x = parseInt(i);
			let lineTemp = lines[line_x];

			lineTemp = str_replace("\t", " ", lineTemp); //make sure key words have spaces around them

			let line = " " + lineTemp + " ~"; //add leading ws and eol

			cache.documentLines[line_x] = {};

			line = str_replace("(", " ( ", line); //make sure key words have spaces around them
			line = str_replace(")", " ) ", line); //make sure key words have spaces around them
			line = str_replace("{", " { ", line); //make sure key words have spaces around them
			line = str_replace("}", " } ", line); //make sure key words have spaces around them
			line = str_replace("[", " [ ", line); //make sure key words have spaces around them
			line = str_replace("]", " ] ", line); //make sure key words have spaces around them
			line = str_replace("=", " = ", line); //make sure key words have spaces around them
			line = str_replace(";", " ; ", line); //make sure key words have spaces around them
			line = str_replace(":", " : ", line); //make sure key words have spaces around them

			var newLine = "";
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
					//detecting regex is hard... this will likely need to be updated
					if (in_reg_str_start == false && char == "/" && (is_array(next_char.match(/[a-zA-Z0-9^+\[\\(]/)) || (prev_char == " " && in_array(prev2_char, ['(', ',', '=', '[', ':']))) && prev_char != "*" && prev_char != "\\" && prev_char != "<") {
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

			cache.documentLines[line_x]['line'] = line_x;

			cache.documentLines[line_x]['level'] = 0;
			cache.documentLines[line_x]['lineType'] = "";
			cache.documentLines[line_x]['text'] = "";

			if (fileType == 'php') {
				syntax = 'php';
				if (newLine.indexOf('<?') > -1 || newLine.indexOf('<?php') > -1) {
					cache.php_open = true;
				}
				if (newLine.indexOf('?>') > -1 || newLine.indexOf('?>') > -1) {
					cache.php_open = false;
					syntax = 'php';
				}
				if (is_true(cache.php_open)) {
					syntax = 'php';
				}

				//mixed html_js
				if (newLine.indexOf('</script') > -1) {
					cache.php_html_script = false;
					syntax = 'html';
				}
				if (is_true(cache.php_html_script)) {
					syntax = 'js';
				}
				if (newLine.indexOf('<script') > -1) {
					cache.php_html_script = true;
					syntax = 'html';
				}

				//mixed html_css
				if (newLine.indexOf('</style') > -1) {
					cache.php_html_css = false;
					syntax = 'html';
				}
				if (is_true(cache.php_html_css)) {
					syntax = 'css';
				}
				if (newLine.indexOf('<style') > -1) {
					cache.php_html_css = true;
					syntax = 'html';
				}

				if (syntax == "php") {
					if ((isset(cache.php_last_type) && cache.php_last_type == 'html') || trim(newLine).indexOf('<') === 0) {
						syntax = 'html';
						cache.php_last_type = 'html';
					}

					if (syntax == "html") {

						cache.documentLines[line_x]['idAttribute'] = false;
						cache.documentLines[line_x]['elementTagPos'] = null;
						cache.documentLines[line_x]['elementTag'] = "";

						let foundOpenTag = false;
						let isTag = false;
						let isComment = false;
						let charX = 0;
						let tag = "";
						let tags = [];
						let tagsPos = [];
						while (charX < newLine.length) {

							if (isTag == false && newLine[charX] == '<' && newLine[charX + 1] == '!' && isset(newLine[charX + 2]) && newLine[charX + 2] == '-' && isset(newLine[charX + 3]) && newLine[charX + 3] == '-') {
								cache.documentLines[line_x]['lineType'] = 'comment';
								isComment = true;
							} else if (isTag == false && isComment == true) {
								if (newLine[charX] == '-' && newLine[charX + 1] == '-' && isset(newLine[charX + 2]) && newLine[charX + 2] == '>') {
									isComment = false;
									cache.documentLines[line_x]['lineType'] = '';
								}
							}

							if (isComment == false) {
								if (isTag == false && newLine[charX] == '<' && /[a-zA-Z]/.test(newLine[charX + 1])) {
									isTag = true;
								} else if (isTag && (newLine[charX] == ' ' || newLine[charX] == ">")) {
									isTag = false;
									foundOpenTag = true;
								}

								if (isTag && newLine[charX] !== '<') {
									tag += newLine[charX];
								}
								if (foundOpenTag) {
									foundOpenTag = false;
									tags.push(tag);
									tagsPos.push(charX);
									tag = "";
								}

								if (newLine[charX] == "/" && newLine[charX - 1] == "<") {
									//close tag
									tags.pop();
									tagsPos.pop();
								}
							}

							charX++;
						}

						if (tags.length > 0) {
							//keep the last open tag
							let lastTag = tags[tags.length - 1];
							let lastTagPos = tagsPos[tagsPos.length - 1];
							if (newLine.indexOf('id = ""', lastTagPos) > -1) {
								cache.documentLines[line_x]['idAttribute'] = true;
							}
							cache.documentLines[line_x]['elementTag'] = lastTag == 'th' ? 'td' : lastTag;
							cache.documentLines[line_x]['elementTags'] = tags;
						}

					}

				}
				if (line_x == 10) {
					console.log(syntax);
				}
			}
			cache.documentLines[line_x]['syntax'] = syntax;
			cache.documentLines[line_x]['isFoldType'] = false;
			cache.documentLines[line_x]['isFoldEnabled'] = false;


			if (in_array(syntax, ['css', 'js', 'php'])) {
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
			}

			cache.documentLines[line_x]['text'] = newLine;

		}

		debug(cache.documentLines)
	}
	function cacheDocumentJsLine(line_x) {

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
			let isParam = false;
			//look backwards until finding operator
			while (line_xx > -1 && max_lines > 0) {
				var text = cache.documentLines[line_xx]['text'];
				let char_x = start ? braceStart - 1 : text.length;
				while (char_x > 0) {

					if (text[char_x].match(/[a-zA-Z0-9]/) !== null) {
						//found previous block so this is a param key
						isParam = true;
						break;
					}

					if (text[char_x - 1] == "=" && text[char_x] == ">") {
						cache.documentLines[line_xx]['lineType'] = "arrayFunctionParam"; //arrayFunctionParam
						break;
					}
					if (text[char_x] == "=" || ((text[char_x] == ":" || text[char_x] == "?") && text.indexOf(":") > -1 && text.indexOf("?") > -1)) {
						cache.documentLines[line_xx]['lineType'] = "array"; //method
						break;
					}
					if (text[char_x] == "(" || text[char_x] == ",") {
						cache.documentLines[line_xx]['lineType'] = "arrayFunctionParam"; //arrayFunctionParam
						break;
					}
					if (text[char_x] == ":" || text[char_x] == "[") {
						cache.documentLines[line_xx]['lineType'] = "arrayObjectParam"; //arrayObjectParam
						break;
					}
					char_x--;
				}

				if (cache.documentLines[line_xx]['lineType'] !== "") {
					break;
				}

				if (isParam) {
					break;
				}

				start = false; //first line flag
				line_xx--;
				max_lines--;
				lineCount++;
			}

			//get total lines
			let foldStartLine = line_xx + 1;
			let line_xxx = line_x;
			let char_x = braceStart;
			let braceCount = 0;
			// while (line_xxx < cache.documentLines.length && lineCount < 3) {
			while (line_xxx < cache.documentLines.length) {
				lineCount++;
				if (cache.documentLines[line_xxx]['syntax'] == 'js') {
					let text = cache.documentLines[line_xxx]['text'];
					while (char_x < text.length) {
						if (text[char_x] == "[") {
							braceCount++;
						}
						if (text[char_x] == "]") {
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
				}
				line_xxx++;
			}

			let foldEndLine = line_xxx;

			if (lineCount < 3) {
				cache.documentLines[line_xx]['lineType'] = "";
			} else {
				while (foldStartLine < foldEndLine) {
					if (cache.documentLines[foldStartLine]['syntax'] == 'js') {
						cache.documentLines[foldStartLine]['level']++;
					}
					foldStartLine++;
				}
			}

			setFoldInfo(line_xx);

		} else if (bracketStart > -1) {
			//get type
			let line_xx = line_x;
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thorough
			let start = true;
			while (line_xx > -1 && max_lines > 0) {

				var text = cache.documentLines[line_xx]['text'];
				let char_x = start ? bracketStart : text.length;

				var check_line = text;

				while (char_x > 0) {

					if (text[char_x] == ")") {
						is_parens = true;
						parens++;
					}

					//check for types related to matching operators
					if (is_parens == false) {
						if (char_x > 0 && text[char_x - 1] == "=" && text[char_x] == ">") {
							cache.documentLines[line_xx]['lineType'] = "method"; //method
							break;
						}
						if (text[char_x] == "=" || ((text[char_x] == ":" || text[char_x] == "?") && text.indexOf(":") > -1 && text.indexOf("?") > -1)) {
							cache.documentLines[line_xx]['lineType'] = "object"; //object
							break;
						}
						if (text[char_x] == "(" || text[char_x] == ",") {
							cache.documentLines[line_xx]['lineType'] = "objectFunctionParam"; //objectParam
							break;
						}
						if (text[char_x] == ":" || text[char_x] == "[") {
							cache.documentLines[line_xx]['lineType'] = "objectObjectParam"; //objectParam
							break;
						}
					}

					//found parens which means we should have a keyword after it closes
					if (is_parens) {
						//searching for key word
						if (text[char_x] == "(") {
							parens--;
						}
						if (parens == 0) {
							found_key_line = true; //if key word not wound then will be marked as other
							check_line = text.slice(0, char_x);
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
				} else if (check_line.indexOf(" interface ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "interface";
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
			var foldStartLine = line_xx + 1;
			var line_xxx = line_x;
			let char_x = bracketStart;
			var bracketCount = 0;
			var code_data = new RegExp('[^\\{\\}\\ ~]', 'g');
			var hasData = false; //default behavior requires data to fold
			// while (line_xxx < cache.documentLines.length && (lineCount < 3 || hasData == false)) {
			while (line_xxx < cache.documentLines.length) {
				lineCount++;
				if (cache.documentLines[line_xxx]['syntax'] == 'js') {
					let text = cache.documentLines[line_xxx]['text'];
					while (char_x < text.length) {
						if (text[char_x] == "{") {
							bracketCount++;
						}
						if (text[char_x] == "}") {
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

					hasData = hasData || (lineCount > 1 && (text.match(code_data) || []).length > 0);

					char_x = 0;
				}
				line_xxx++;
			}

			let foldEndLine = line_xxx;

			//js does not require hasData to fold
			if (lineCount < 3 || cache.documentLines[line_x]['lineType'] == "other") {
				cache.documentLines[line_x]['lineType'] = cache.documentLines[line_x]['lineType'] == "other" ? cache.documentLines[line_x]['lineType'] : "";
			} else {
				while (foldStartLine < foldEndLine) {
					if (cache.documentLines[foldStartLine]['syntax'] == 'js') {
						cache.documentLines[foldStartLine]['level']++;
					}
					foldStartLine++;
				}
			}

			setFoldInfo(line_xx);
		}

	}
	function cacheDocumentPhpLine(line_x) {

		var bracketStart = cache.documentLines[line_x]['text'].lastIndexOf("{");
		var braceStart = cache.documentLines[line_x]['text'].lastIndexOf("[");
		var arrayStart = cache.documentLines[line_x]['text'].lastIndexOf(" array ");
		var lineCount = 0;

		if (arrayStart > -1 && arrayStart > bracketStart) {
			//get total lines
			var line_xxx = line_x;
			let char_x = arrayStart;
			var braceCount = 0;
			var startLineCount = false;
			var collapseLine = null;

			// while (line_xxx < cache.documentLines.length && lineCount < 3) {
			while (line_xxx < cache.documentLines.length) {
				let line = cache.documentLines[line_xxx]['text'];
				if (cache.documentLines[line_xxx]['syntax'] == 'php') {
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
				}
				line_xxx++;
			}

			if (lineCount > 2) {
				cache.documentLines[collapseLine]['lineType'] = "array";
				let foldStartLine = collapseLine + 1
				let foldEndLine = line_xxx
				while (foldStartLine < foldEndLine) {
					if (cache.documentLines[foldStartLine]['syntax'] == 'php') {
						cache.documentLines[foldStartLine]['level']++;
					}
					foldStartLine++;
				}
				setFoldInfo(collapseLine);
			}


		} else if (braceStart > -1 && braceStart > bracketStart) {
			//found array start
			let line_xx = line_x;
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thurough
			let start = true;
			let isParam = false;
			//look backwards until finding operator
			while (line_xx > -1 && max_lines > 0) {
				if (cache.documentLines[line_xx]['syntax'] == 'php') {
					var text = cache.documentLines[line_xx]['text'];
					let char_x = start ? braceStart - 1 : text.length;
					while (char_x > 0) {

						if (text[char_x].match(/[a-zA-Z0-9]/) !== null) {
							//found previous block so this is a param key
							isParam = true;
							break;
						}

						if (text[char_x - 1] == "=" && text[char_x] == ">" || text[char_x] == "[") {
							cache.documentLines[line_xx]['lineType'] = "arrayObjectParam";
							break;
						}
						if (text[char_x] == "=" || ((text[char_x] == ":" || text[char_x] == "?") && text.indexOf(":") > -1 && text.indexOf("?") > -1)) {
							cache.documentLines[line_xx]['lineType'] = "array"; //method
							break;
						}
						if (text[char_x] == "(" || text[char_x] == ",") {
							cache.documentLines[line_xx]['lineType'] = "arrayFunctionParam"; //objectParam
							break;
						}
						char_x--;
					}

					if (cache.documentLines[line_xx]['lineType'] !== "") {
						break;
					}

					if (isParam) {
						break;
					}
				}
				start = false; //first line flag
				line_xx--;
				max_lines--;
				lineCount++;
			}

			if (isParam == false) {

				//get total lines
				let foldStartLine = line_xx + 1;
				let line_xxx = line_x;
				let char_x = braceStart;
				let braceCount = 0;
				let code_data = new RegExp('[^\\{\\}/ ~]', 'g');
				var hasData = false; //default behavior requires data to fold
				// while (line_xxx < cache.documentLines.length && (lineCount < 3 || hasData == false)) {
				while (line_xxx < cache.documentLines.length) {
					lineCount++;
					if (cache.documentLines[line_xxx]['syntax'] == 'php') {
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
					}
					line_xxx++;
				}

				let foldEndLine = line_xxx;

				if (hasData == false || lineCount < 3) {
					cache.documentLines[line_xx]['lineType'] = "";
				} else {
					while (foldStartLine < foldEndLine) {
						if (cache.documentLines[foldStartLine]['syntax'] == 'php') {
							cache.documentLines[foldStartLine]['level']++;
						}
						foldStartLine++;
					}
				}

				setFoldInfo(line_xx);
			}
		} else if (bracketStart > -1) {
			//get type
			let parens = 0;
			let is_parens = false;
			let found_key_line = false;
			let line_xx = line_x;
			let max_lines = 10; //looking up the bracket should be either on same line or 1 below. check 10 just to be thurough
			let start = true;
			while (line_xx > -1 && max_lines > 0) {

				if (cache.documentLines[line_xx]['syntax'] == 'php') {

					var text = cache.documentLines[line_xx]['text'];
					let char_x = start ? bracketStart : text.length;

					let check_line = text;

					while (char_x > 0) {

						if (text[char_x] == ")") {
							is_parens = true;
							parens++;
						}

						//found parens which means we should have a keyword after it closes
						if (is_parens) {
							//searching for key word
							if (text[char_x] == "(") {
								parens--;
							}
							if (parens == 0) {
								found_key_line = true; //if key word not wound then will be marked as other
								check_line = text.slice(0, char_x);
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
					} else if (found_key_line) {
						cache.documentLines[line_x]['lineType'] = "other"; //default to method
						break;
					}
				}
				start = false; //first line flag
				line_xx--;
				max_lines--;
				//lineCount++; line count starts at bracket. not the key word line
			}

			//get total lines
			let foldStartLine = line_xx + 1;
			let line_xxx = line_x;
			let char_x = bracketStart;
			let bracketCount = 0;
			let hasData = false; //default behavior requires data to fold
			let code_data = new RegExp('[^\\{\\}/ ~]', 'g');
			// while (line_xxx < cache.documentLines.length && (lineCount < 3 || hasData == false)) {
			while (line_xxx < cache.documentLines.length) {
				lineCount++;
				if (cache.documentLines[line_xxx]['syntax'] == 'php') {
					let text = cache.documentLines[line_xxx]['text'];
					while (char_x < text.length) {
						if (text[char_x] == "{") {
							bracketCount++;
						}
						if (text[char_x] == "}") {
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
					hasData = hasData || (lineCount > 1 && (text.match(code_data) || []).length > 0);
					char_x = 0;
				}
				line_xxx++;
			}

			let foldEndLine = line_xxx;
			if (hasData == false || lineCount < 3 || cache.documentLines[line_x]['lineType'] == "other") {
				cache.documentLines[line_x]['lineType'] = cache.documentLines[line_x]['lineType'] == "other" ? cache.documentLines[line_x]['lineType'] : "";
			} else {
				while (foldStartLine < foldEndLine) {
					if (cache.documentLines[foldStartLine]['syntax'] == 'php') {
						cache.documentLines[foldStartLine]['level']++;
					}
					foldStartLine++;
				}
			}

			setFoldInfo(line_x);
		}

	}
	function cacheDocumentCssLine(line_x) {

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
			// while (line_xxx < cache.documentLines.length && (lineCount < 3 || hasData == false)) {
			while (line_xxx < cache.documentLines.length) {
				lineCount++;
				if (cache.documentLines[line_xxx]['syntax'] == 'css') {
					let text = cache.documentLines[line_xxx]['text'];
					while (char_x < text.length) {
						if (text[char_x] == "{") {
							bracketCount++;
						}
						if (text[char_x] == "}") {
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

					hasData = hasData || (lineCount > 1 && (text.match(code_data) || []).length > 0);
					char_x = 0;
				}
				line_xxx++;
			}

			//has data not required
			if (lineCount < 3) {
				cache.documentLines[line_x]['lineType'] = "";
			} else {
				let foldStartLine = line_x + 1;
				let foldEndLine = line_xxx;
				while (foldStartLine < foldEndLine) {
					if (cache.documentLines[foldStartLine]['syntax'] == 'css') {
						cache.documentLines[foldStartLine]['level']++;
					}
					foldStartLine++;
				}
			}

			setFoldInfo(line_x);
		}
	}
	function cacheDocumentHtmlLine(line_x) {

		//add id="" fold="" checking

		if (cache.documentLines[line_x]['lineType'] == 'comment') {
			setFoldInfo(line_x);
			return;
		}

		if (isset(cache.documentLines[line_x]['elementTag']) && cache.documentLines[line_x]['elementTag'] != '') {

			var x = cache.documentLines[line_x]['elementTags'].length - 1;
			var openCountStart = 1;
			while (x >= 0) {

				//found foldType. get lines and mark levels. set lineType
				let line_xx = line_x + 1; //start on next line
				let lineCount = 1;
				let openCount = openCountStart++;

				while (line_xx < cache.documentLines.length) {
					lineCount++;
					if (cache.documentLines[line_xx]['syntax'] == 'html') {
						let char_x = 0;
						text = cache.documentLines[line_xx]['text'];
						while (char_x < text.length) {
							if (text[char_x] == '<' && /[a-zA-Z]/.test(text[char_x + 1])) {
								let isVoid = false;
								for (var i in elementVoids) {
									if (text.indexOf(elementVoids[i]) === char_x + 1) {
										isVoid = true;
										break;
									}
								}
								if (isVoid == false) {
									openCount++;
								}
							}
							if (text[char_x] == '<' && text[char_x + 1] == '/') {
								openCount--;
							}
							if (openCount == 0) {
								break;
							}
							char_x++;
						}
						if (openCount == 0) {
							break;
						}
					}
					line_xx++;
				}
				if (x == cache.documentLines[line_x]['elementTags'].length - 1) {
					if (lineCount < 3) {
						cache.documentLines[line_x]['lineType'] = "";
					} else {

						if (in_array(cache.documentLines[line_x]['elementTag'], elementTypes)) {
							cache.documentLines[line_x]['lineType'] = cache.documentLines[line_x]['elementTag'];
							setFoldInfo(line_x);
						}

						if (cache.documentLines[line_x]['isFoldEnabled'] == false && cache.documentLines[line_x]['idAttribute']) {
							cache.documentLines[line_x]['lineType'] = 'idAttribute';
						}

						if (cache.documentLines[line_x]['lineType'] != '') {
							let foldStartLine = line_x + 1;
							let foldEndLine = line_xx;
							while (foldStartLine < foldEndLine) {
								if (cache.documentLines[foldStartLine]['syntax'] == 'html') {
									cache.documentLines[foldStartLine]['level']++;
								}
								foldStartLine++;
							}
						}
					}
				} else {
					if (lineCount >= 3) {
						let foldStartLine = line_x + 1;
						let foldEndLine = line_xx;
						while (foldStartLine < foldEndLine) {
							if (cache.documentLines[foldStartLine]['syntax'] == 'html') {
								cache.documentLines[foldStartLine]['level']++;
							}
							foldStartLine++;
						}
					}
				}

				x--;
			}

			if (cache.documentLines[line_x]['lineType'] != "") {
				setFoldInfo(line_x);
			}
		}

	}
	function getEnabledFoldTypes() {
		if (isset(cache.foldTypes) == false) {
			cache.foldTypes = {
				//javascript overrides
				'js.class': { enabled: self.getConfigurationSetting('js.class') == "Yes" ? true : false },
				'js.interface': { enabled: self.getConfigurationSetting('js.interface') == "Yes" ? true : false },
				'js.method': { enabled: self.getConfigurationSetting('js.method') == "Yes" ? true : false },
				'js.object': { enabled: self.getConfigurationSetting('js.object') == "Yes" ? true : false },
				'js.objectFunctionParam': { enabled: self.getConfigurationSetting('js.objectFunctionParam') == "Yes" ? true : false },
				'js.objectObjectParam': { enabled: self.getConfigurationSetting('js.objectObjectParam') == "Yes" ? true :false },
				'js.array': { enabled: self.getConfigurationSetting('js.array') == "Yes" ? true : false },
				'js.arrayParam': { enabled: self.getConfigurationSetting('js.arrayParam') == "Yes" ? true :false },
				'js.while': { enabled: self.getConfigurationSetting('js.while') == "Yes" ? true : false },
				'js.for': { enabled: self.getConfigurationSetting('js.for') == "Yes" ? true :false },
				'js.if': { enabled: self.getConfigurationSetting('js.if') == "Yes" ? true : false },
				'js.else': { enabled: self.getConfigurationSetting('js.else') == "Yes" ? true :false },
				'js.switch': { enabled: self.getConfigurationSetting('js.switch') == "Yes" ? true : false },
				'js.switchCase': { enabled: self.getConfigurationSetting('js.switchCase') == "Yes" ? true :false },
				'js.switchDefault': { enabled: self.getConfigurationSetting('js.switchDefault') == "Yes" ? true : false },
				'js.try': { enabled: self.getConfigurationSetting('js.try') == "Yes" ? true : false },
				'js.tryCatch': { enabled: self.getConfigurationSetting('js.tryCatch') == "Yes" ? true : false },
				'js.tryFinally': { enabled: self.getConfigurationSetting('js.tryFinally') == "Yes" ? true : false },
				'js.comment': { enabled: self.getConfigurationSetting('js.comment') == "Yes" ? true : false },
				//php
				'php.class': { enabled: self.getConfigurationSetting('php.class') == "Yes" ? true : false },
				'php.interface': { enabled: self.getConfigurationSetting('php.interface') == "Yes" ? true :false },
				'php.method': { enabled: self.getConfigurationSetting('php.method') == "Yes" ? true : false },
				'php.array': { enabled: self.getConfigurationSetting('php.array') == "Yes" ? true :false },
				'php.arrayFunctionParam': { enabled: self.getConfigurationSetting('php.arrayFunctionParam') == "Yes" ? true : false },
				'php.arrayObjectParam': { enabled: self.getConfigurationSetting('php.arrayObjectParam') == "Yes" ? true : false },
				'php.while': { enabled: self.getConfigurationSetting('php.while') == "Yes" ? true : false },
				'php.for': { enabled: self.getConfigurationSetting('php.for') == "Yes" ? true :false },
				'php.if': { enabled: self.getConfigurationSetting('php.if') == "Yes" ? true : false },
				'php.else': { enabled: self.getConfigurationSetting('php.else') == "Yes" ? true : false },
				'php.switch': { enabled: self.getConfigurationSetting('php.switch') == "Yes" ? true : false },
				'php.switchCase': { enabled: self.getConfigurationSetting('php.switchCase') == "Yes" ? true : false },
				'php.switchDefault': { enabled: self.getConfigurationSetting('php.switchDefault') == "Yes" ? true : false },
				'php.try': { enabled: self.getConfigurationSetting('php.try') == "Yes" ? true : false },
				'php.tryCatch': { enabled: self.getConfigurationSetting('php.tryCatch') == "Yes" ? true : false },
				'php.tryFinally': { enabled: self.getConfigurationSetting('php.tryFinally') == "Yes" ? true :false },
				'php.comment': { enabled: self.getConfigurationSetting('php.comment') == "Yes" ? true : false },
				//css
				'css.block': { enabled: self.getConfigurationSetting('css.block') === "Yes" ? true : false },
				//HTML
				'html.head': { enabled: self.getConfigurationSetting('html.head') === "Yes" ? true : false },
				'html.body': { enabled: self.getConfigurationSetting('html.body') === "Yes" ? true : false },
				'html.div': { enabled: self.getConfigurationSetting('html.div') === "Yes" ? true : false },
				'html.section': { enabled: self.getConfigurationSetting('html.section') === "Yes" ? true : false },
				'html.ul': { enabled: self.getConfigurationSetting('html.ul') === "Yes" ? true : false },
				'html.select': { enabled: self.getConfigurationSetting('html.select') === "Yes" ? true : false },
				'html.button': { enabled: self.getConfigurationSetting('html.button') === "Yes" ? true : false },
				'html.table': { enabled: self.getConfigurationSetting('html.table') === "Yes" ? true : false },
				'html.tableTbody': { enabled: self.getConfigurationSetting('html.tableTbody') === "Yes" ? true : false },
				'html.tableThead': { enabled: self.getConfigurationSetting('html.tableThead') === "Yes" ? true : false },
				'html.tableTfoot': { enabled: self.getConfigurationSetting('html.tableTfoot') === "Yes" ? true : false },
				'html.tableTr': { enabled: self.getConfigurationSetting('html.tableTr') === "Yes" ? true : false },
				'html.tableTd': { enabled: self.getConfigurationSetting('html.tableTd') === "Yes" ? true : false },
				'html.script': { enabled: self.getConfigurationSetting('html.script') === "Yes" ? true : false },
				'html.style': { enabled: self.getConfigurationSetting('html.style') === "Yes" ? true : false },
				'html.idAttribute': { enabled: self.getConfigurationSetting('html.idAttribute') === "Yes" ? true : false },
				'html.comment': { enabled: self.getConfigurationSetting('html.comment') == "Yes" ? true : false },
			};
		}
		return cache.foldTypes;
	}
	function getFoldEnabled(lineType, syntax, index) {
		var foldTypes = getEnabledFoldTypes();
		var settingKey = syntax + "." + lineType;
		var syntaxEnabled = isset(foldTypes[settingKey]) ? foldTypes[settingKey]['enabled'] : null;
		if (isset(index)) {
			cache.documentLines[index]['isSyntaxFoldEnabled'] = syntaxEnabled;
			cache.documentLines[index]['settingKey'] = settingKey;
		}
		var foldEnabled = syntaxEnabled !== null ? syntaxEnabled : false;
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
	async function fold(lines, isFoldType) {
		var linesToFold = getLinesToFold(lines, isFoldType);
		var lineNumbers = array_column(linesToFold, 'line');
		if (lineNumbers.length > 0) {
			await application.editorFoldLines(lineNumbers);
		}
		return linesToFold;
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
		var parentLineNumber = getParentTopLineNumber(true); //get first foldable parent
		var lines = getDocumentLines();

		await unFold(lines); //need to reset all lines to open first
		let linesToFold = await fold(lines);

		//get lowest tab level
		let lowestTabLevel = 999;
		for (var i in linesToFold) {
			if (linesToFold[i]['isFoldEnabled'] == true) {
				let tabLevel = linesToFold[i]['level'];
				if (tabLevel < lowestTabLevel) {
					lowestTabLevel = tabLevel;
				}
			}
		}
		lowestTabLevel = lowestTabLevel == 999 ? 0 : lowestTabLevel;

		let lineNumber = parentLineNumber;
		while (lineNumber > -1) {
			let tabLevel = lines[lineNumber]['level'];
			let isFoldEnabled = lines[lineNumber]['isFoldEnabled'];
			if (tabLevel == lowestTabLevel && isFoldEnabled == true) {
				break;
			}
			lineNumber--;
		}

		if (parentLineNumber == -1 || lineNumber == -1) {
			application.editorSetCursorPosition(cursorPosition.line); //put cursor back to original position
		} else {
			application.editorSetCursorPosition(lineNumber); //place cursor at start of tabLevel 0 parent
		}
	}
	this.foldParent = async function () {
		if (fallback('editor.fold')) {
			return;
		}
		cache = {};
		log('commandFoldParent')
		let parentLineNumber = getParentTopLineNumber(); //get first fold type
		var cursorPosition = application.editorCursorPosition();
		var lines = getParentLines();
		var firstIndex = Object.keys(lines)[0];

		lines[firstIndex]['isFoldEnabled'] = true; //fold parent should fold the parent regardless of settings
		await unFold(lines); //need to reset all lines to open first
		await fold(lines);

		if (parentLineNumber == -1 || lines[firstIndex]['isFoldEnabled'] == false) {
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
		var lines = getParentChildrenLines();
		await unFold(lines); //need to reset all lines to open first
		await fold(lines);
		application.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
	}
	this.foldChildrenAllTypes = async function () {
		if (fallback('editor.foldLevel1')) {
			return;
		}
		cache = {};
		log('commandFoldChildren');
		var cursorPosition = application.editorCursorPosition();
		var lines = getParentChildrenLines();
		await unFold(lines); //need to reset all lines to open first
		await fold(lines, true);
		application.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
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
	application.registerCommand('fold-types.fold-children-all-types', async function () {
		await foldTypes.foldChildrenAllTypes();
	});
	application.registerCommand('fold-types.unfold-parent', async function () {
		await foldTypes.unFoldParent();
	});

	application.activate(); //call last so any registered events are emitted
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
