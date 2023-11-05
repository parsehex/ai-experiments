# GBNF Grammar Notes

## Usage in Strings

When code returns a grammar string, you need to be mindful of the escaped characters.
For example, you likely want to use `\\n` instead of `\n` to have the newline character be part of the grammar string, rather than making the string go down a line.
Similar for quotes inside JSON grammar -- if you need there to be an escaped string in the grammar, you'd use `\\\"` which should resolve to `\"` when sent to the LLM.

## Examples

These are example grammars that I have written. They _should_ work correctly.

### Hyphenated Word

This makes the response be a hyphenated word followed by a newline.

```
# Start with a letter, followed by more letters
# Followed by a hyphen at some point, followed by more letters
# end with a letter and a newline which is taken as the stopping string
root ::= [A-Za-z][a-z]+ "-" [a-z]+[a-z] "\n"
```
