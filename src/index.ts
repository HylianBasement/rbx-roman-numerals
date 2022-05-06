import { match, variantModule, VariantOf } from "@rbxts/variant";

const numOperationFn = (amount: number) => ({ amount });
const registerSymbol = (value: number) => () => ({ value });

const Operation = variantModule({
	increment: numOperationFn,
	decrement: numOperationFn,
});

type Operation = VariantOf<typeof Operation>;

const Numeral = variantModule({
	I: registerSymbol(1),
	IV: registerSymbol(4),
	V: registerSymbol(5),
	IX: registerSymbol(9),
	X: registerSymbol(10),
	XL: registerSymbol(40),
	L: registerSymbol(50),
	XC: registerSymbol(90),
	C: registerSymbol(100),
	CD: registerSymbol(400),
	D: registerSymbol(500),
	CM: registerSymbol(900),
	M: registerSymbol(1000),
});

type Numeral = VariantOf<typeof Numeral>;

const symbols = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"] as const;
const noop = () => {};

/**
 * Converts a roman numeral into its number equivalent.
 * @param numeral The roman numerals to convert into numbers
 */
export function parse(numeral: string) {
	assert(type(numeral) === "string", `Expected string, got ${type(numeral)}.`);

	if (numeral.size() === 0) {
		error("The numeral must have at least one symbol.", 2);
	}

	const operations = new Array<Operation>();

	for (const symbol of numeral.upper()) {
		if (!(symbol in Numeral)) {
			error(`"${symbol}" is not a valid symbol.`, 2);
		}

		const amount = Numeral[symbol as Numeral["type"]]().value;
		const lastOperation = operations[operations.size() - 1];

		if (lastOperation) {
			match(lastOperation, {
				default: noop,
				increment: ({ amount: lastAmount }) => {
					if (lastAmount < amount) {
						operations.push(Operation.decrement(lastAmount * 2));
					}

					operations.push(Operation.increment(amount));
				},
			});
		} else {
			operations.push(Operation.increment(amount));
		}
	}

	return operations.reduce(
		(acc, value) =>
			match(value, {
				increment: ({ amount }) => acc + amount,
				decrement: ({ amount }) => acc - amount,
			}),
		0,
	);
}

/**
 * Converts a number into its roman numeral equivalent.
 * @param integer The integer to convert into roman numerals
 */
export function toNumeral(integer: number) {
	assert(type(integer) === "number", `Expected number, got ${type(integer)}.`);

	if (integer < 0.5) {
		error("The integer must be greater than zero.", 2);
	} else if (integer >= 4000) {
		error("Cannot convert numbers greater than 3999.", 2);
	}

	return generateSymbols([], math.round(integer)).join("");
}

function generateSymbols(symbolArray: Array<Numeral["type"]>, n: number): Array<Numeral["type"]> {
	for (const symbol of symbols) {
		const { value } = Numeral[symbol]();

		if (n / value >= 1) {
			n -= value;
			symbolArray.push(symbol);

			break;
		}
	}

	if (n > 0) {
		return generateSymbols(symbolArray, n);
	}

	return symbolArray;
}
