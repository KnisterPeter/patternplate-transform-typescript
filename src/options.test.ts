import test from 'ava';
import * as ts from 'typescript';

import { mapJsx, mapTarget, mapModule } from './options';

Object.keys(ts.JsxEmit).forEach(jsxOption => {
  const num = parseInt(jsxOption, 10);
  if (isNaN(num)) {
    test(`map JsxEmit ${jsxOption}`, t => {
      const result = mapJsx(jsxOption);
      t.is(result, ts.JsxEmit[jsxOption]);
    });
  } else {
    test(`map JsxEmit ${num}`, t => {
      const expected: ts.JsxEmit = ts.JsxEmit[ts.JsxEmit[jsxOption]] as any;
      const result = mapJsx(num);
      t.is(result, expected);
    });
  }
});

test('map JsxEmit fails on invalid string input', t => {
  t.throws(() => mapJsx('abc'));
});

test('map JsxEmit fails on invalid number input', t => {
  t.throws(() => mapJsx(Number.MAX_SAFE_INTEGER));
});

Object.keys(ts.ScriptTarget).forEach(targetOption => {
  const num = parseInt(targetOption, 10);
  if (isNaN(num)) {
    test(`map mapTarget ${targetOption}`, t => {
      const result = mapTarget(targetOption);
      t.is(result, ts.ScriptTarget[targetOption]);
    });
  } else {
    test(`map ScriptTarget ${num}`, t => {
      const expected: ts.ScriptTarget = ts.ScriptTarget[ts.ScriptTarget[targetOption]] as any;
      const result = mapTarget(num);
      t.is(result, expected);
    });
  }
});

test('map mapTarget fails on invalid string input', t => {
  t.throws(() => mapTarget('abc'));
});

test('map mapTarget fails on invalid number input', t => {
  t.throws(() => mapTarget(Number.MAX_SAFE_INTEGER));
});

Object.keys(ts.ModuleKind).forEach(moduleOption => {
  const num = parseInt(moduleOption, 10);
  if (isNaN(num)) {
    test(`map mapTarget ${moduleOption}`, t => {
      const result = mapModule(moduleOption);
      t.is(result, ts.ModuleKind[moduleOption]);
    });
  } else {
    test(`map ModuleKind ${num}`, t => {
      const expected: ts.ModuleKind = ts.ModuleKind[ts.ModuleKind[moduleOption]] as any;
      const result = mapModule(num);
      t.is(result, expected);
    });
  }
});

test('map mapModule fails on invalid string input', t => {
  t.throws(() => mapModule('abc'));
});

test('map mapModule fails on invalid number input', t => {
  t.throws(() => mapModule(Number.MAX_SAFE_INTEGER));
});
