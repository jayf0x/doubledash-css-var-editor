const assert = require('assert');
const { getColor } = require('../color.logic.js');

function createResolver(map) {
  return (name) => (Object.prototype.hasOwnProperty.call(map, name) ? map[name] : null);
}

function expectResolves(input, resolverMap) {
  const color = getColor(input, { resolveVar: createResolver(resolverMap) });
  assert.ok(color, `Expected non-null color for ${input}, got ${color}`);
}

function expectNull(input, resolverMap) {
  const color = getColor(input, { resolveVar: createResolver(resolverMap) });
  assert.strictEqual(color, null, `Expected null color for ${input}, got ${color}`);
}

(function run() {
  const directHex = ['#3d444d', '#ffa657', '#161b22', '#f0f6fc', '#151b23', '#656c76'];
  const alphaHex = [
    '#161b2200', '#656c7633', '#0000', '#2ea04326', '#3fb9504d', '#2ea04366',
    '#f851491a', '#f851494d', '#f8514966', '#388bfd1a', '#151b23f2', '#ffffffb3',
    '#d2992266', '#3d444db3'
  ];

  for (const value of directHex) {
    expectResolves(value, {});
  }

  for (const value of alphaHex) {
    expectResolves(value, {});
  }

  const fixtureMap = {
    '--bgColor-default': '#161b22',
    '--label-auburn-bgColor-rest': '#2a1200',
    '--label-auburn-fgColor-rest': '#f8c99b',
    '--a': 'var(--b)',
    '--b': '#112233',
    '--cycle-a': 'var(--cycle-b)',
    '--cycle-b': 'var(--cycle-a)'
  };

  expectResolves('var(--bgColor-default)', fixtureMap);
  expectResolves('var(--label-auburn-bgColor-rest)', fixtureMap);
  expectResolves('var(--label-auburn-fgColor-rest)', fixtureMap);
  expectResolves('var(--a)', fixtureMap);
  expectResolves('var(--missing, #445566)', fixtureMap);
  expectNull('var(--cycle-a)', fixtureMap);

  const providedLogValues = [
    '#3d444d', '#ffa657', '#161b22', '#161b2200', '#656c7633', '#0000', '#2ea04326',
    '#3fb9504d', '#2ea04366', '#f851491a', '#f851494d', '#f8514966', '#f0f6fc', '#151b23',
    'var(--bgColor-default)', '#388bfd1a', '#151b23f2', '#656c76', '#ffffffb3', '#d2992266',
    'var(--label-auburn-bgColor-rest)', 'var(--label-auburn-fgColor-rest)', '#0000', '#3d444db3'
  ];

  for (const value of providedLogValues) {
    expectResolves(value, fixtureMap);
  }

  console.log('All unit.getcolors tests passed');
})();
