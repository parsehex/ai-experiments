// Helpful tip: You can generate grammar based on TS interfaces at
//   https://grammar.intrinsiclabs.ai/
// Note that I have been replacing the range of characters they use for
//   the "string" variable with `([a-zA-Z' ,.!?&;-]+)`. Theirs is `([^"]*)`,
// I can't get negate to work.
// Also note that you need to remember to escape characters correctly.
//   Look at other functions for examples.

const sentences = `[a-zA-Z'" ,.!?&;-]+`;
interface SentenceOptions {
	n?: number;
	min?: number;
	max?: number;
	startWithWord?: boolean;
}
const nSentences = ({
	n = 0,
	min = 0,
	max = 0,
	startWithWord,
}: SentenceOptions = {}) => {
	// console.log('nSentences', { n, min, max, startWithWord });
	const sentence = `(${
		startWithWord ? '[A-Z][a-z\'"]+' : ''
	}[a-zA-Z0-9'" ,&;-]+[.!?])`;
	let str = '(';
	if (n === 0) {
		if (min > 0 && max > 0) n = max;
		else throw new Error('nSentences: must specify n or min and max');
	}
	for (let i = 0; i < n; i++) {
		const isOptional = i >= min && i < max;
		str += `${sentence}${isOptional ? '?' : ''}`;
		if (i < n - 1) str += `" "`;
	}
	str = str.trim() + ')';
	// console.log(str);
	return str.trim();
};

export const Words = (n: number) => {
	// we basically need to repeat "word ws" for n times
	let wordStr = '';
	for (let i = 0; i < n; i++) {
		wordStr += `word ws `;
	}
	wordStr = wordStr.trim();
	return `root ::= ${wordStr}
word ::= [a-zA-z'"()&,;:]+
ws ::= [ ]`;
};
export const Sentences = (
	n: number,
	allowNewline = true,
	min?: number,
	max?: number
) => {
	let sentenceStr = '';
	// if min and max is provided, add `sentence` for `min` times, then add `sentence?` for remaining times
	// add "ws" between each sentence
	const hasMinMax = min !== undefined && max !== undefined;
	for (let i = 0; i < n; i++) {
		if (hasMinMax) break;
		sentenceStr += `sentence `;
		if (i < n - 1) sentenceStr += `ws `;
	}
	if (hasMinMax) {
		sentenceStr += `${nSentences({ min, max, startWithWord: true })} `;
	}
	sentenceStr = sentenceStr.trim();
	return `root ::= ${sentenceStr}
sentence ::= [A-Z][a-z'"]+ (letter|"-")+ [.!?]
letter ::= [a-zA-Z0-9 '"()&,;]
ws ::= [ ${allowNewline ? '\\n' : ''}]`;
};

interface LinesOptions {
	/** Number of lines to generate. If 0, number of lines is random. */
	n?: number;
	/** Whether to generate a list. */
	list?: boolean;
	/** Number of sentences per line. */
	nSent?: number;
	sentences?: {
		min?: number;
		max?: number;
		startWithWord?: boolean;
	};
}
export const Lines = ({
	n = 0,
	list = false,
	nSent = 0,
	sentences: s,
}: LinesOptions = {}) => {
	let sent = sentences;
	if (nSent) sent = nSentences({ n: nSent });
	else if (s)
		sent = nSentences({
			min: s.min,
			max: s.max,
			startWithWord: s.startWithWord,
		});
	const vars = `item ::= ${list ? '"- "' : ''} ${sent} "\\n"`;
	let itemStr = '';
	if (n === 0) {
		itemStr = `item+`;
	} else {
		// itemStr = '(';
		for (let i = 0; i < n; i++) {
			itemStr += `item `;
			if (i < n - 1) {
				itemStr += `"\\n"`;
			}
		}
		// itemStr += ')';
	}
	let str = `root ::= ${itemStr}
${vars}`;
	return str;
};

export const JsonObject = () => {
	return `root   ::= (
		"{" ws (
			string ":" ws value
("," ws string ":" ws value)*
)? "}"
)
value  ::= object | array | string | number | ("true" | "false" | "null") ws
object ::=
	"{" ws (
						string ":" ws value
		("," ws string ":" ws value)*
	)? "}" ws
array  ::=
	"[" ws (
						value
		("," ws value)*
	)? "]" ws
string ::=
	"\\"" (
		[^"\\] |
		"\\" (["\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) # escapes
	)* "\\"" ws
number ::= ("-"? ([0-9] | [1-9] [0-9]*)) ("." [0-9]+)? ([eE] [-+]? [0-9]+)? ws
# Optional space: by convention, applied in this grammar after literal chars when allowed
ws ::= ([ \\t\\n] ws)?`;
};

export const CharacterObject = () => {
	return `root ::= Character
Objectives ::= "{"   ws   "\\\"shortTerm\\\":"   ws   string   ","   ws   "\\\"longTerm\\\":"   ws   string   "}"
Objectiveslist ::= "[]" | "["   ws   Objectives   (","   ws   Objectives)*   "]"
Character ::= "{"   ws   "\\\"name\\\":"   ws   string   ","   ws   "\\\"description\\\":"   ws   string   ","   ws   "\\\"state\\\":"   ws   string   ","   ws   "\\\"objectives\\\":"   ws   Objectives   "}"
Characterlist ::= "[]" | "["   ws   Character   (","   ws   Character)*   "]"
string ::= "\\\""   ([a-zA-Z' ,.!?&;-]+)   "\\\""
boolean ::= "true" | "false"
ws ::= [ \\t\\n]*
number ::= [0-9]+   "."?   [0-9]*
stringlist ::= "["   ws   "]" | "["   ws   string   (","   ws   string)*   ws   "]"
numberlist ::= "["   ws   "]" | "["   ws   string   (","   ws   number)*   ws   "]"
`;
};

export const SettingObject = () => {
	return `root ::= Setting
Setting ::= "{"   ws   "\\\"location\\\":"   ws   string   ","   ws   "\\\"timePeriod\\\":"   ws   string   "}"
Settinglist ::= "[]" | "["   ws   Setting   (","   ws   Setting)*   "]"
string ::= "\\\""   ([a-zA-Z' ,.!?&;-]+)   "\\\""
boolean ::= "true" | "false"
ws ::= [ \\t\\n]*
number ::= [0-9]+   "."?   [0-9]*
stringlist ::= "["   ws   "]" | "["   ws   string   (","   ws   string)*   ws   "]"
numberlist ::= "["   ws   "]" | "["   ws   string   (","   ws   number)*   ws   "]"
`;
};

export const ActionObject = () => {
	return `root ::= Action
Action ::= "{"   ws   "\\\"type\\\":"   ws   string   ","   ws   "\\\"characterName\\\":"   ws   string   ","   ws   "\\\"str\\\":"   ws   string   "}"
Actionlist ::= "[]" | "["   ws   Action   (","   ws   Action)*   "]"
string ::= "\\\""   ([a-zA-Z' ,.!?&;-]+)   "\\\""
boolean ::= "true" | "false"
ws ::= [ \\t\\n]*
number ::= [0-9]+   "."?   [0-9]*
stringlist ::= "["   ws   "]" | "["   ws   string   (","   ws   string)*   ws   "]"
numberlist ::= "["   ws   "]" | "["   ws   string   (","   ws   number)*   ws   "]"`;
};
