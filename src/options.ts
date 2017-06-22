import * as ts from 'typescript';

export function mapJsx(input: string | ts.JsxEmit): ts.JsxEmit {
  if (typeof input === 'string') {
    const result = getKeys(ts.JsxEmit)[input.toLowerCase()];
    if (result === undefined) {
      throw new Error(`Invalid input '${input}'`);
    }
    return result;
  }
  if (ts.JsxEmit[input] === undefined) {
    throw new Error(`Invalid input '${input}'`);
  }
  return input;
}

export function mapTarget(input: string | ts.ScriptTarget): ts.ScriptTarget {
  if (typeof input === 'string') {
    const result = getKeys(ts.ScriptTarget)[input.toLowerCase()];
    if (result === undefined) {
      throw new Error(`Invalid input '${input}'`);
    }
    return result;
  }
  if (ts.ScriptTarget[input] === undefined) {
    throw new Error(`Invalid input '${input}'`);
  }
  return input;
}

export function mapModule(input: string | ts.ModuleKind): ts.ModuleKind {
  if (typeof input === 'string') {
    const result = getKeys(ts.ModuleKind)[input.toLowerCase()];
    if (result === undefined) {
      throw new Error(`Invalid input '${input}'`);
    }
    return result;
  }
  if (ts.ModuleKind[input] === undefined) {
    throw new Error(`Invalid input '${input}'`);
  }
  return input;
}

function getKeys(input: any): { [name: string]: number } {
  return Object
    .keys(input)
    .filter(key => isNaN(parseInt(key, 10)))
    .reduce((obj: { [name: string]: number }, key) => (obj[key.toLowerCase()] = input[key], obj), {});
}
