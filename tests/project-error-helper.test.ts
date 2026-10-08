import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { formatErrorMessage, flashError } from '../src/lib/project'

test('formatErrorMessage extracts standard Error message', () => {
  assert.equal(formatErrorMessage(new Error('Network timeout')), 'Network timeout')
})

test('formatErrorMessage extracts raw string errors', () => {
  assert.equal(formatErrorMessage('Freighter rejected connection'), 'Freighter rejected connection')
})

test('formatErrorMessage converts thrown primitives to readable strings', () => {
  assert.equal(formatErrorMessage(503), '503')
  assert.equal(formatErrorMessage(true), 'true')
})

test('formatErrorMessage extracts message property from error-like objects', () => {
  assert.equal(formatErrorMessage({ message: 'RPC failure' }), 'RPC failure')
})

test('formatErrorMessage falls back to safe default on empty or whitespace strings', () => {
  assert.equal(formatErrorMessage(''), 'Operation failed')
  assert.equal(formatErrorMessage('   '), 'Operation failed')
  assert.equal(formatErrorMessage(new Error('')), 'Operation failed')
  assert.equal(formatErrorMessage(new Error('   ')), 'Operation failed')
})

test('formatErrorMessage falls back to safe default on null/undefined', () => {
  assert.equal(formatErrorMessage(null), 'Operation failed')
  assert.equal(formatErrorMessage(undefined), 'Operation failed')
})

test('flashError dispatches toast with kind err and formatted message', () => {
  let toastReceived: { kind: string; text: string } | null = null
  const flash = (t: { kind: 'err'; text: string }) => {
    toastReceived = t
  }
  const result = flashError('test-op', new Error('Ledger rejected'), flash)
  assert.equal(result, 'Ledger rejected')
  assert.deepEqual(toastReceived, { kind: 'err', text: 'Ledger rejected' })
})

test('src/lib/project.ts contains zero catch (e: any) instances', () => {
  const fileContent = fs.readFileSync(path.resolve('src/lib/project.ts'), 'utf-8')
  const match = fileContent.match(/catch\s*\(\s*\w+\s*:\s*any\s*\)/g)
  assert.equal(match, null, `Found remaining catch (: any) occurrences: ${JSON.stringify(match)}`)
})
