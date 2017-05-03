import * as ts from 'typescript';

export function mapJsx(input: string|ts.JsxEmit): ts.JsxEmit {
  if (typeof input === 'string') {
    const result = ts.JsxEmit[input];
    if (result === undefined) {
      throw new Error('Invalid input');
    }
    return result;
  }
  if (ts.JsxEmit[input] === undefined) {
    throw new Error('Invalid input');
  }
  return input;
}

export function mapTarget(input: string|ts.ScriptTarget): ts.ScriptTarget {
  if (typeof input === 'string') {
    const result = ts.ScriptTarget[input];
    if (result === undefined) {
      throw new Error('Invalid input');
    }
    return result;
  }
  if (ts.ScriptTarget[input] === undefined) {
    throw new Error('Invalid input');
  }
  return input;
}

export function mapModule(input: string|ts.ModuleKind): ts.ModuleKind {
  if (typeof input === 'string') {
    const result = ts.ModuleKind[input];
    if (result === undefined) {
      throw new Error('Invalid input');
    }
    return result;
  }
  if (ts.ModuleKind[input] === undefined) {
    throw new Error('Invalid input');
  }
  return input;
}
