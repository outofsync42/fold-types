const vscode = require('vscode');
const custom = require('./lib/custom.js');
const app = new custom.Application();

var FoldTypes = function () {

	var self = this;

	//private vars
	let cache = {};

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

		var cursorPosition = app.editorCursorPosition();
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
		var cursorPosition = app.editorCursorPosition();
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

	let elementFoldTypes = ['head', 'body', 'div', 'ul', 'a', 'select', 'button', 'script', 'style', 'table', 'tbody', 'thead', 'tfoot', 'tfoot', 'tfoot', 'tr', 'td', 'th'];
	let elementVoids = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'path', 'source', 'track', 'wbr'];

	let extSettings = new custom.ConfigSettings('fold-types');

	function getDocumentLines() {

		if (isset(cache.documentLines) == false) {

			cache.documentLines = app.getDocumentLinesInfo();

			var open_bracket = new RegExp('\\{', 'g');
			var close_bracket = new RegExp('\\}', 'g');

			var hasJs = false;
			for (var i in cache.documentLines) {

				let line_x = parseInt(i);

				cache.documentLines[line_x]['isFoldType'] = false;
				cache.documentLines[line_x]['isFoldEnabled'] = false;

				let line = cache.documentLines[line_x]['textFormatted']
				line = str_replace("(", " ( ", line); //make sure key words have spaces around them
				line = str_replace(")", " ) ", line); //make sure key words have spaces around them
				line = str_replace("{", " { ", line); //make sure key words have spaces around them
				line = str_replace("}", " } ", line); //make sure key words have spaces around them
				line = str_replace("[", " [ ", line); //make sure key words have spaces around them
				line = str_replace("]", " ] ", line); //make sure key words have spaces around them
				line = str_replace("=", " = ", line); //make sure key words have spaces around them
				line = str_replace(";", " ; ", line); //make sure key words have spaces around them
				line = str_replace(":", " : ", line); //make sure key words have spaces around them
				line = str_replace("!", " ! ", line); //make sure key words have spaces around them
				cache.documentLines[line_x]['textFormatted'] = line;
				
				var syntax = cache.documentLines[line_x]['syntax'];

				if (syntax == "js" || syntax == "ts") {
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
						if (line['textFormatted'].indexOf(" var ") > -1 || line['textFormatted'].indexOf(" function ") > -1 || line['textFormatted'].indexOf(" class ") > -1) {
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
					var next_line = cache.documentLines[line_x]['textFormatted'];
					var switchBracketCount = (next_line.match(open_bracket) || []).length
					while (switchBracketCount > 0) {

						line_x++;
						next_line = cache.documentLines[line_x]['textFormatted'];
						switchBracketCount += (next_line.match(open_bracket) || []).length
						switchBracketCount -= (next_line.match(close_bracket) || []).length
						var isCase = next_line.indexOf(" case ") > -1;
						var isDefault = next_line.indexOf(" default ") > -1;
						if (isCase || isDefault) {

							var code_data = new RegExp('[^\\{\\}: ~]', 'g');
							//found case with no brackets
							var x = line_x + 1;
							next_line = cache.documentLines[x]['textFormatted'];
							var hasData = false; //default behavior requires data to fold
							var b = switchBracketCount;
							while (b > 0 && next_line.indexOf(" case ") == -1 && next_line.indexOf(" default ") == -1 && hasData == false) {
								next_line = cache.documentLines[x]['textFormatted'];
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

		}

		return cache.documentLines;
	}
	/**
	 * @param {number} line_x 
	 */
	function cacheDocumentJsLine(line_x) {

		//application already flags and clears comment start and stops.
		//only need to check for open chars to know if well formed comment exists as line
		//no need to set levels
		if (cache.documentLines[line_x]['textFormatted'].lastIndexOf('/*') > -1) {
			cache.documentLines[line_x]['lineType'] = 'comment';
			setFoldInfo(line_x);
			return;
		}

		var bracketStart = cache.documentLines[line_x]['textFormatted'].lastIndexOf("{");
		var braceStart = cache.documentLines[line_x]['textFormatted'].lastIndexOf("[");
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
				var text = cache.documentLines[line_xx]['textFormatted'];
				let char_x = start ? braceStart - 1 : text.length - 1;

				while (char_x > 0) {

					if (text[char_x].match(/[a-zA-Z0-9\]]/) !== null) {
						//found previous block so this is a param key
						isParam = true;
						break;
					}

					if (text[char_x - 1] == "=" && text[char_x] == ">") {
						cache.documentLines[line_xx]['lineType'] = "arrayFunctionParam"; //arrayFunctionParam
						break;
					}
					if (text[char_x] == "=" || ((text[char_x] == ":" || text[char_x] == "?") && text.indexOf(":") > -1 && text.indexOf("?") > -1)) {
						cache.documentLines[line_xx]['lineType'] = "array";
						break;
					}
					if (text[char_x] == "|" || text[char_x - 1] == "|") {
						cache.documentLines[line_xx]['lineType'] = "array";
						break;
					}
					if (text[char_x] == "&" || text[char_x - 1] == "&") {
						cache.documentLines[line_xx]['lineType'] = "array";
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
					let text = cache.documentLines[line_xxx]['textFormatted'];
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

				var text = cache.documentLines[line_xx]['textFormatted'];
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
				} else if (check_line.indexOf(" for ") > -1) {
				// } else if (check_line.indexOf(" for ") > -1 || check_line.indexOf(" foreach ") > -1) {
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
				} else if (check_line.indexOf(" constructor ") > -1) {
					cache.documentLines[line_xx]['lineType'] = "constructor";
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
					let text = cache.documentLines[line_xxx]['textFormatted'];
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

		//application already flags and clears comment start and stops.
		//only need to check for open chars to know if wellformed comment exists as line
		//no need to set levels
		if (cache.documentLines[line_x]['textFormatted'].lastIndexOf('/*') > -1) {
			cache.documentLines[line_x]['lineType'] = 'comment';
			setFoldInfo(line_x);
			return;
		}

		var bracketStart = cache.documentLines[line_x]['textFormatted'].lastIndexOf("{");
		var braceStart = cache.documentLines[line_x]['textFormatted'].lastIndexOf("[");
		var arrayStart = cache.documentLines[line_x]['textFormatted'].lastIndexOf(" array ");
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
				let line = cache.documentLines[line_xxx]['textFormatted'];
				if (cache.documentLines[line_xxx]['syntax'] == 'php') {
					while (char_x < line.length) {
						if (line[char_x] == "(") {
							braceCount++;
							startLineCount = true;
						}
						if (line[char_x] == ")") {
							braceCount--;
						}
						if (startLineCount == true && braceCount == 0) {
							break;
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
					var text = cache.documentLines[line_xx]['textFormatted'];
					let char_x = start ? braceStart - 1 : text.length - 1;
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
						let line = cache.documentLines[line_xxx]['textFormatted'];
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

					var text = cache.documentLines[line_xx]['textFormatted'];
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
					let text = cache.documentLines[line_xxx]['textFormatted'];
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

		//application already flags and clears comment start and stops.
		//only need to check for open chars to know if well formed comment exists as line
		//no need to set levels
		if (cache.documentLines[line_x]['textFormatted'].lastIndexOf('/*') > -1) {
			cache.documentLines[line_x]['lineType'] = 'comment';
			setFoldInfo(line_x);
			return;
		}

		var bracketStart = cache.documentLines[line_x]['textFormatted'].lastIndexOf("{");
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
					let text = cache.documentLines[line_xxx]['textFormatted'];
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

		if (Object.keys(cache.documentLines[line_x]['html']['elements']).length > 0) {

			let elements = cache.documentLines[line_x]['html']['elements'];

			//keep the last open tag
			let lastOpenTag = '';
			let lastOpenKey = null;
			for (var key in elements) {
				let isLastOpen = elements[key]['isLastOpen'];
				if (isLastOpen == true) {
					lastOpenTag = elements[key]['tag'];
					lastOpenKey = key;
				}
			}
			if (lastOpenTag != '') {

				let line_xx = line_x + 1; //start on next line
				let lineCount = 1;
				let openCount = 1;
				while (line_xx < cache.documentLines.length) {
					lineCount++;
					if (cache.documentLines[line_xx]['syntax'] == 'html') {
						let char_x = 0;
						text = cache.documentLines[line_xx]['textFormatted'];
						while (char_x < text.length) {
							if (text[char_x] == '<' && /[a-zA-Z]/.test(text[char_x + 1])) {
								let isVoid = false;
								for (var key in elementVoids) {
									if (text.indexOf(elementVoids[key]) === char_x + 1) {
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
				cache.documentLines[line_x]['lineCount'] = lineCount;
				cache.documentLines[line_x]['lineEnd'] = line_x + (lineCount - 1);
				if (lineCount < 3) {
					cache.documentLines[line_x]['lineType'] = "";
				} else {
					if (in_array(elements[lastOpenKey]['tag'], elementFoldTypes)) {
						let tag = lastOpenTag;
						if (in_array(tag, ['td', 'th'])) {
							tag = 'tableTd';
						}
						if (tag == 'tr') {
							tag = 'tableTr';
						}
						if (tag == 'tbody') {
							tag = 'tableTbody';
						}
						if (tag == 'thead') {
							tag = 'tableThead';
						}
						if (tag == 'tfoot') {
							tag = 'tableTfoot';
						}

						cache.documentLines[line_x]['lineType'] = tag;
						setFoldInfo(line_x);

						if (cache.documentLines[line_x]['isFoldEnabled'] == false) {
							if (isset(elements[lastOpenKey]['attributes']['id'])) {
								cache.documentLines[line_x]['lineType'] = "idAttribute";
								setFoldInfo(line_x);
							}
						}
					}
				}

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

	}
	function getEnabledFoldTypes() {
		if (isset(cache.foldTypes) == false) {
			cache.foldTypes = {
				//javascript overrides
				'js.class': { enabled: extSettings.getValue('js.class') == "Yes" ? true : false },
				'js.constructor': { enabled: extSettings.getValue('js.constructor') == "Yes" ? true : false },
				'js.interface': { enabled: extSettings.getValue('js.interface') == "Yes" ? true : false },
				'js.method': { enabled: extSettings.getValue('js.method') == "Yes" ? true : false },
				'js.object': { enabled: extSettings.getValue('js.object') == "Yes" ? true : false },
				'js.objectFunctionParam': { enabled: extSettings.getValue('js.objectFunctionParam') == "Yes" ? true : false },
				'js.objectObjectParam': { enabled: extSettings.getValue('js.objectObjectParam') == "Yes" ? true : false },
				'js.array': { enabled: extSettings.getValue('js.array') == "Yes" ? true : false },
				'js.arrayParam': { enabled: extSettings.getValue('js.arrayParam') == "Yes" ? true : false },
				'js.while': { enabled: extSettings.getValue('js.while') == "Yes" ? true : false },
				'js.for': { enabled: extSettings.getValue('js.for') == "Yes" ? true : false },
				'js.if': { enabled: extSettings.getValue('js.if') == "Yes" ? true : false },
				'js.else': { enabled: extSettings.getValue('js.else') == "Yes" ? true : false },
				'js.switch': { enabled: extSettings.getValue('js.switch') == "Yes" ? true : false },
				'js.switchCase': { enabled: extSettings.getValue('js.switchCase') == "Yes" ? true : false },
				'js.switchDefault': { enabled: extSettings.getValue('js.switchDefault') == "Yes" ? true : false },
				'js.try': { enabled: extSettings.getValue('js.try') == "Yes" ? true : false },
				'js.tryCatch': { enabled: extSettings.getValue('js.tryCatch') == "Yes" ? true : false },
				'js.tryFinally': { enabled: extSettings.getValue('js.tryFinally') == "Yes" ? true : false },
				'js.comment': { enabled: extSettings.getValue('js.comment') == "Yes" ? true : false },
				//php
				'php.class': { enabled: extSettings.getValue('php.class') == "Yes" ? true : false },
				'php.interface': { enabled: extSettings.getValue('php.interface') == "Yes" ? true : false },
				'php.method': { enabled: extSettings.getValue('php.method') == "Yes" ? true : false },
				'php.array': { enabled: extSettings.getValue('php.array') == "Yes" ? true : false },
				'php.arrayFunctionParam': { enabled: extSettings.getValue('php.arrayFunctionParam') == "Yes" ? true : false },
				'php.arrayObjectParam': { enabled: extSettings.getValue('php.arrayObjectParam') == "Yes" ? true : false },
				'php.while': { enabled: extSettings.getValue('php.while') == "Yes" ? true : false },
				'php.for': { enabled: extSettings.getValue('php.for') == "Yes" ? true : false },
				'php.if': { enabled: extSettings.getValue('php.if') == "Yes" ? true : false },
				'php.else': { enabled: extSettings.getValue('php.else') == "Yes" ? true : false },
				'php.switch': { enabled: extSettings.getValue('php.switch') == "Yes" ? true : false },
				'php.switchCase': { enabled: extSettings.getValue('php.switchCase') == "Yes" ? true : false },
				'php.switchDefault': { enabled: extSettings.getValue('php.switchDefault') == "Yes" ? true : false },
				'php.try': { enabled: extSettings.getValue('php.try') == "Yes" ? true : false },
				'php.tryCatch': { enabled: extSettings.getValue('php.tryCatch') == "Yes" ? true : false },
				'php.tryFinally': { enabled: extSettings.getValue('php.tryFinally') == "Yes" ? true : false },
				'php.comment': { enabled: extSettings.getValue('php.comment') == "Yes" ? true : false },
				//css
				'css.block': { enabled: extSettings.getValue('css.block') === "Yes" ? true : false },
				//HTML
				'html.head': { enabled: extSettings.getValue('html.head') === "Yes" ? true : false },
				'html.body': { enabled: extSettings.getValue('html.body') === "Yes" ? true : false },
				'html.div': { enabled: extSettings.getValue('html.div') === "Yes" ? true : false },
				'html.section': { enabled: extSettings.getValue('html.section') === "Yes" ? true : false },
				'html.ul': { enabled: extSettings.getValue('html.ul') === "Yes" ? true : false },
				'html.select': { enabled: extSettings.getValue('html.select') === "Yes" ? true : false },
				'html.button': { enabled: extSettings.getValue('html.button') === "Yes" ? true : false },
				'html.table': { enabled: extSettings.getValue('html.table') === "Yes" ? true : false },
				'html.tableTbody': { enabled: extSettings.getValue('html.tableTbody') === "Yes" ? true : false },
				'html.tableThead': { enabled: extSettings.getValue('html.tableThead') === "Yes" ? true : false },
				'html.tableTfoot': { enabled: extSettings.getValue('html.tableTfoot') === "Yes" ? true : false },
				'html.tableTr': { enabled: extSettings.getValue('html.tableTr') === "Yes" ? true : false },
				'html.tableTd': { enabled: extSettings.getValue('html.tableTd') === "Yes" ? true : false },
				'html.script': { enabled: extSettings.getValue('html.script') === "Yes" ? true : false },
				'html.style': { enabled: extSettings.getValue('html.style') === "Yes" ? true : false },
				'html.idAttribute': { enabled: extSettings.getValue('html.idAttribute') === "Yes" ? true : false },
				'html.comment': { enabled: extSettings.getValue('html.comment') == "Yes" ? true : false },
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
			await app.editorFoldLines(lineNumbers);
		}
		return linesToFold;
	}
	async function unFold(lines) {
		var lineNumbers = array_column(lines, 'line');
		if (lineNumbers.length > 0) {
			await app.editorUnFoldLines(lineNumbers);
		}
	}

	//IS
	this.isAutoFoldEnabled = function () {
		let autoFold = extSettings.getValue('general.autoFoldOnFileOpen', 'No');
		if(autoFold==='Yes'){
			return true;
		}
		return false;
	}

	//actions
	function fallback(command) {
		if (app.documentIsValidType() == false) {
			vscode.window.showInformationMessage("FoldTypes: Not a valid file type. Using default " + command);
			vscode.commands.executeCommand(command);
			return true;
		}
		return false;
	}
	this.foldAll = async function () {
		if (fallback('editor.foldAll')) {
			return;
		}

		cache = {};

		var cursorPosition = app.editorCursorPosition();
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
			app.editorSetCursorPosition(cursorPosition.line); //put cursor back to original position
		} else {
			app.editorSetCursorPosition(lineNumber); //place cursor at start of tabLevel 0 parent
		}
	}
	this.foldParent = async function () {
		if (fallback('editor.fold')) {
			return;
		}
		cache = {};

		let parentLineNumber = getParentTopLineNumber(); //get first fold type
		var cursorPosition = app.editorCursorPosition();
		var lines = getParentLines();
		var firstIndex = Object.keys(lines)[0];

		lines[firstIndex]['isFoldEnabled'] = true; //fold parent should fold the parent regardless of settings
		await unFold(lines); //need to reset all lines to open first
		await fold(lines);

		if (parentLineNumber == -1 || lines[firstIndex]['isFoldEnabled'] == false) {
			app.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
		} else {
			app.editorSetCursorPosition(parentLineNumber); //place cursor at start of parent
		}
	}
	this.foldChildren = async function () {
		if (fallback('editor.foldLevel1')) {
			return;
		}
		cache = {};

		var cursorPosition = app.editorCursorPosition();
		var lines = getParentChildrenLines();

		await unFold(lines); //need to reset all lines to open first
		await fold(lines);
		app.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
	}
	this.foldChildrenAllTypes = async function () {
		if (fallback('editor.foldLevel1')) {
			return;
		}
		cache = {};

		var cursorPosition = app.editorCursorPosition();
		var lines = getParentChildrenLines();
		await unFold(lines); //need to reset all lines to open first
		await fold(lines, true);
		app.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
	}
	this.unFoldParent = async function () {
		if (fallback('editor.unfold')) {
			return;
		}
		cache = {};
		var cursorPosition = app.editorCursorPosition();
		await unFold(getParentLines());
		app.editorSetCursorPosition(cursorPosition.line, cursorPosition.character); //put cursor back to original position
	}

}

function activate(context) {

	//INIT APP
	app.setContext(context);
	app.setValidDocTypes(['js', 'jsx', 'ts', 'tsx', 'php', 'css', 'html', 'htm']);
	app.setDocumentCacheEnabled({
		lineCount: 2000 //caching only needed for optimal results on files with more than 2000 lines
	});

	//INIT EXTENSION
	var foldTypes = new FoldTypes();

	//EVENTS
	app.onDocumentOpen(function (document) {
		if(foldTypes.isAutoFoldEnabled()){
			foldTypes.foldAll();
		}
	})

	//REGISTER COMMANDS
	app.registerCommand('fold-types.fold-all', async function () {
		await foldTypes.foldAll();
	});
	app.registerCommand('fold-types.fold-all-expand-parent', async function () {
		await foldTypes.foldAll();
		vscode.commands.executeCommand('editor.unfold');
	});
	app.registerCommand('fold-types.fold-parent', async function () {
		await foldTypes.foldParent();
	});
	app.registerCommand('fold-types.fold-children', async function () {
		await foldTypes.foldChildren();
	});
	app.registerCommand('fold-types.fold-children-all-types', async function () {
		await foldTypes.foldChildrenAllTypes();
	});
	app.registerCommand('fold-types.unfold-parent', async function () {
		await foldTypes.unFoldParent();
	});

	//ACTIVATE
	app.activate();
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
