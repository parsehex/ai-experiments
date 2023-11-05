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
		startWithWord ? '[a-zA-Z]' : ''
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
export const Sentences = (n: number, allowNewline = true) => {
	let sentenceStr = '';
	for (let i = 0; i < n; i++) {
		sentenceStr += `sentence `;
		if (i < n - 1) sentenceStr += `ws `;
	}
	sentenceStr = sentenceStr.trim();
	return `root ::= ${sentenceStr}
sentence ::= [A-Z](letter|"-")+ [.!?]
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
	return `root ::= Thing
Type ::= "\\\"Narrative\\\"" | "\\\"Dialogue\\\""
Thing ::= "{"   ws   "\\\"type\\\":"   ws   Type   ","   ws   "\\\"str\\\":"   ws   string   ","   ws   ("\\\"characterName\\\":"   ws   string)?   "}"
Thinglist ::= "[]" | "["   ws   Thing   (","   ws   Thing)*   "]"
string ::= "\\\""   ([a-zA-Z' ,.!?&;-]+)   "\\\""
boolean ::= "true" | "false"
ws ::= [ \\t\\n]*
number ::= [0-9]+   "."?   [0-9]*
stringlist ::= "["   ws   "]" | "["   ws   string   (","   ws   string)*   ws   "]"
numberlist ::= "["   ws   "]" | "["   ws   string   (","   ws   number)*   ws   "]"`;
};
