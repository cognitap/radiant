import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chartGeometry, validateChart } from '../dist/library/internal/charts.js'
const series = [{ key: 'sessions', label: 'Sessions' }]
const rows = values =>
  values.map((value, index) => ({
    key: String(index),
    label: `Round ${index + 1}`,
    values: { sessions: value }
  }))
test('Cartesian scales include zero, preserve signed bars and keep extreme finite values drawable', () => {
  for (const values of [
    [0, 0],
    [12, 24],
    [-12, 24],
    [-1e308, 1e308]
  ]) {
    const model = chartGeometry('bar', rows(values), series)
    for (const point of model.marks)
      for (const key of ['x', 'y', 'height', 'top']) assert.ok(Number.isFinite(point[key]))
    assert.ok(model.marks.every(mark => mark.height >= 0 && mark.y >= 24 && mark.y <= 276))
    assert.ok(model.ticks.every(tick => Number.isFinite(tick.value)))
  }
  assert.equal(chartGeometry('line', rows([0, 0]), series).marks[0].y, 276)
})
test('missing values break lines and areas instead of inventing zero-valued data', () => {
  const input = rows([1, null, 3]),
    before = JSON.stringify(input)
  for (const kind of ['line', 'area']) {
    const model = chartGeometry(kind, input, series)
    assert.equal(model.paths.length, 2)
    assert.equal(model.marks.length, 2)
    assert.ok(model.paths.every(path => !path.line.includes('NaN')))
  }
  assert.equal(JSON.stringify(input), before)
})
test('pie geometry supports full circles, zeros and huge values without overflow', () => {
  const full = chartGeometry('pie', rows([12, 0]), series)
  assert.equal(full.marks.length, 1)
  assert.equal((full.marks[0].path.match(/ A /g) ?? []).length, 2)
  assert.equal(chartGeometry('pie', rows([0, 0]), series).marks.length, 0)
  const large = chartGeometry('pie', rows([1e308, 1e308]), series)
  assert.equal(large.marks.length, 2)
  assert.ok(large.marks.every(mark => !/(NaN|Infinity)/.test(mark.path)))
})
test('invalid identities and data fail before SVG generation', () => {
  assert.throws(() => validateChart(rows([NaN]), series), /finite/)
  assert.throws(() => chartGeometry('pie', rows([-1]), series), /nonnegative/)
  assert.throws(() => validateChart(rows([1]), [...series, ...series]), /unique/)
  assert.throws(
    () => chartGeometry('pie', rows([1]), [...series, { key: 'other', label: 'Other' }]),
    /one series/
  )
  assert.throws(
    () => validateChart([{ key: '', label: 'Round', values: { sessions: 1 } }], series),
    /unique nonempty/
  )
})
