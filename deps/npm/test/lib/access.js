const { test } = require('tap')
const requireInject = require('require-inject')

const access = requireInject('../../lib/access.js', {
  '../../lib/npm.js': {
    flatOptions: {},
  },
})

test('completion', t => {
  const { completion } = access

  const testComp = (argv, expect) => {
    const res = completion({conf: {argv: {remain: argv}}})
    t.resolves(res, expect, argv.join(' '))
  }

  testComp(['npm', 'access'], [
    'public', 'restricted', 'grant', 'revoke', 'ls-packages',
    'ls-collaborators', 'edit', '2fa-required', '2fa-not-required',
  ])
  testComp(['npm', 'access', 'grant'], ['read-only', 'read-write'])
  testComp(['npm', 'access', 'grant', 'read-only'], [])
  testComp(['npm', 'access', 'public'], [])
  testComp(['npm', 'access', 'restricted'], [])
  testComp(['npm', 'access', 'revoke'], [])
  testComp(['npm', 'access', 'ls-packages'], [])
  testComp(['npm', 'access', 'ls-collaborators'], [])
  testComp(['npm', 'access', 'edit'], [])
  testComp(['npm', 'access', '2fa-required'], [])
  testComp(['npm', 'access', '2fa-not-required'], [])
  testComp(['npm', 'access', 'revoke'], [])

  t.rejects(
    completion({conf: {argv: {remain: ['npm', 'access', 'foobar']}}}),
    { message: 'foobar not recognized' }
  )

  t.end()
})

test('subcommand required', t => {
  access([], (err) => {
    t.equal(err, '\nUsage: Subcommand is required.\n\n' + access.usage)
    t.end()
  })
})

test('unrecognized subcommand', (t) => {
  access(['blerg'], (err) => {
    t.match(
      err,
      /Usage: blerg is not a recognized subcommand/,
      'should throw EUSAGE on missing subcommand'
    )
    t.end()
  })
})

test('edit', (t) => {
  access([
    'edit',
    '@scoped/another',
  ], (err) => {
    t.match(
      err,
      /edit subcommand is not implemented yet/,
      'should throw not implemented yet error'
    )
    t.end()
  })
})

test('access public on unscoped package', (t) => {
  const prefix = t.testdir({
    'package.json': JSON.stringify({
      name: 'npm-access-public-pkg',
    }),
  })
  const access = requireInject('../../lib/access.js', {
    '../../lib/npm.js': { prefix },
  })
  access([
    'public',
  ], (err) => {
    t.match(
      err,
      /Usage: This command is only available for scoped packages/,
      'should throw scoped-restricted error'
    )
    t.end()
  })
})

test('access public on scoped package', (t) => {
  t.plan(4)
  const name = '@scoped/npm-access-public-pkg'
  const prefix = t.testdir({
    'package.json': JSON.stringify({ name }),
  })
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      public: (pkg, { registry }) => {
        t.equal(pkg, name, 'should use pkg name ref')
        t.equal(
          registry,
          'https://registry.npmjs.org',
          'should forward correct options'
        )
        return true
      },
    },
    '../../lib/npm.js': {
      flatOptions: {
        registry: 'https://registry.npmjs.org',
      },
      prefix,
    },
  })
  access([
    'public',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access public on scoped package')
  })
})

test('access public on missing package.json', (t) => {
  const prefix = t.testdir({
    node_modules: {},
  })
  const access = requireInject('../../lib/access.js', {
    '../../lib/npm.js': { prefix },
  })
  access([
    'public',
  ], (err) => {
    t.match(
      err,
      /no package name passed to command and no package.json found/,
      'should throw no package.json found error'
    )
    t.end()
  })
})

test('access public on invalid package.json', (t) => {
  const prefix = t.testdir({
    'package.json': '{\n',
    node_modules: {},
  })
  const access = requireInject('../../lib/access.js', {
    '../../lib/npm.js': { prefix },
  })
  access([
    'public',
  ], (err) => {
    t.match(
      err,
      /JSONParseError/,
      'should throw failed to parse package.json'
    )
    t.end()
  })
})

test('access restricted on unscoped package', (t) => {
  const prefix = t.testdir({
    'package.json': JSON.stringify({
      name: 'npm-access-restricted-pkg',
    }),
  })
  const access = requireInject('../../lib/access.js', {
    '../../lib/npm.js': { prefix },
  })
  access([
    'restricted',
  ], (err) => {
    t.match(
      err,
      /Usage: This command is only available for scoped packages/,
      'should throw scoped-restricted error'
    )
    t.end()
  })
})

test('access restricted on scoped package', (t) => {
  t.plan(4)
  const name = '@scoped/npm-access-restricted-pkg'
  const prefix = t.testdir({
    'package.json': JSON.stringify({ name }),
  })
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      restricted: (pkg, { registry }) => {
        t.equal(pkg, name, 'should use pkg name ref')
        t.equal(
          registry,
          'https://registry.npmjs.org',
          'should forward correct options'
        )
        return true
      },
    },
    '../../lib/npm.js': {
      flatOptions: {
        registry: 'https://registry.npmjs.org',
      },
      prefix,
    },
  })
  access([
    'restricted',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access restricted on scoped package')
  })
})

test('access restricted on missing package.json', (t) => {
  const prefix = t.testdir({
    node_modules: {},
  })
  const access = requireInject('../../lib/access.js', {
    '../../lib/npm.js': { prefix },
  })
  access([
    'restricted',
  ], (err) => {
    t.match(
      err,
      /no package name passed to command and no package.json found/,
      'should throw no package.json found error'
    )
    t.end()
  })
})

test('access restricted on invalid package.json', (t) => {
  const prefix = t.testdir({
    'package.json': '{\n',
    node_modules: {},
  })
  const access = requireInject('../../lib/access.js', {
    '../../lib/npm.js': { prefix },
  })
  access([
    'restricted',
  ], (err) => {
    t.match(
      err,
      /JSONParseError/,
      'should throw failed to parse package.json'
    )
    t.end()
  })
})

test('access grant read-only', (t) => {
  t.plan(5)
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      grant: (spec, team, permissions) => {
        t.equal(spec, '@scoped/another', 'should use expected spec')
        t.equal(team, 'myorg:myteam', 'should use expected team')
        t.equal(permissions, 'read-only', 'should forward permissions')
        return true
      },
    },
    '../../lib/npm.js': {},
  })
  access([
    'grant',
    'read-only',
    'myorg:myteam',
    '@scoped/another',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access grant read-only')
  })
})

test('access grant read-write', (t) => {
  t.plan(5)
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      grant: (spec, team, permissions) => {
        t.equal(spec, '@scoped/another', 'should use expected spec')
        t.equal(team, 'myorg:myteam', 'should use expected team')
        t.equal(permissions, 'read-write', 'should forward permissions')
        return true
      },
    },
    '../../lib/npm.js': {},
  })
  access([
    'grant',
    'read-write',
    'myorg:myteam',
    '@scoped/another',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access grant read-write')
  })
})

test('access grant current cwd', (t) => {
  t.plan(5)
  const prefix = t.testdir({
    'package.json': JSON.stringify({
      name: 'yargs',
    }),
  })
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      grant: (spec, team, permissions) => {
        t.equal(spec, 'yargs', 'should use expected spec')
        t.equal(team, 'myorg:myteam', 'should use expected team')
        t.equal(permissions, 'read-write', 'should forward permissions')
        return true
      },
    },
    '../../lib/npm.js': { prefix },
  })
  access([
    'grant',
    'read-write',
    'myorg:myteam',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access grant current cwd')
  })
})

test('access grant others', (t) => {
  access([
    'grant',
    'rerere',
    'myorg:myteam',
    '@scoped/another',
  ], (err) => {
    t.match(
      err,
      /Usage: First argument must be either `read-only` or `read-write`./,
      'should throw unrecognized argument error'
    )
    t.end()
  })
})

test('access grant missing team args', (t) => {
  access([
    'grant',
    'read-only',
    undefined,
    '@scoped/another',
  ], (err) => {
    t.match(
      err,
      /Usage: `<scope:team>` argument is required./,
      'should throw missing argument error'
    )
    t.end()
  })
})

test('access grant malformed team arg', (t) => {
  access([
    'grant',
    'read-only',
    'foo',
    '@scoped/another',
  ], (err) => {
    t.match(
      err,
      /Usage: Second argument used incorrect format.\n/,
      'should throw malformed arg error'
    )
    t.end()
  })
})

test('access 2fa-required/2fa-not-required', t => {
  t.plan(2)
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      tfaRequired: (spec) => {
        t.equal(spec, '@scope/pkg', 'should use expected spec')
        return true
      },
      tfaNotRequired: (spec) => {
        t.equal(spec, 'unscoped-pkg', 'should use expected spec')
        return true
      },
    },
    '../../lib/npm.js': {},
  })

  access(['2fa-required', '@scope/pkg'], er => {
    if (er)
      throw er
  })

  access(['2fa-not-required', 'unscoped-pkg'], er => {
    if (er)
      throw er
  })
})

test('access revoke', (t) => {
  t.plan(4)
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      revoke: (spec, team) => {
        t.equal(spec, '@scoped/another', 'should use expected spec')
        t.equal(team, 'myorg:myteam', 'should use expected team')
        return true
      },
    },
    '../../lib/npm.js': {},
  })
  access([
    'revoke',
    'myorg:myteam',
    '@scoped/another',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access revoke')
  })
})

test('access revoke missing team args', (t) => {
  access([
    'revoke',
    undefined,
    '@scoped/another',
  ], (err) => {
    t.match(
      err,
      /Usage: `<scope:team>` argument is required./,
      'should throw missing argument error'
    )
    t.end()
  })
})

test('access revoke malformed team arg', (t) => {
  access([
    'revoke',
    'foo',
    '@scoped/another',
  ], (err) => {
    t.match(
      err,
      /Usage: First argument used incorrect format.\n/,
      'should throw malformed arg error'
    )
    t.end()
  })
})

test('npm access ls-packages with no team', (t) => {
  t.plan(3)
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      lsPackages: (entity) => {
        t.equal(entity, 'foo', 'should use expected entity')
        return {}
      },
    },
    '../../lib/utils/get-identity.js': () => Promise.resolve('foo'),
    '../../lib/utils/output.js': () => null,
    '../../lib/npm.js': {},
  })
  access([
    'ls-packages',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access ls-packages with no team')
  })
})

test('access ls-packages on team', (t) => {
  t.plan(3)
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      lsPackages: (entity) => {
        t.equal(entity, 'myorg:myteam', 'should use expected entity')
        return {}
      },
    },
    '../../lib/utils/output.js': () => null,
    '../../lib/npm.js': {},
  })
  access([
    'ls-packages',
    'myorg:myteam',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access ls-packages on team')
  })
})

test('access ls-collaborators on current', (t) => {
  t.plan(3)
  const prefix = t.testdir({
    'package.json': JSON.stringify({
      name: 'yargs',
    }),
  })
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      lsCollaborators: (spec) => {
        t.equal(spec, 'yargs', 'should use expected spec')
        return {}
      },
    },
    '../../lib/utils/output.js': () => null,
    '../../lib/npm.js': { prefix },
  })
  access([
    'ls-collaborators',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access ls-collaborators on current')
  })
})

test('access ls-collaborators on spec', (t) => {
  t.plan(3)
  const access = requireInject('../../lib/access.js', {
    libnpmaccess: {
      lsCollaborators: (spec) => {
        t.equal(spec, 'yargs', 'should use expected spec')
        return {}
      },
    },
    '../../lib/utils/output.js': () => null,
    '../../lib/npm.js': {},
  })
  access([
    'ls-collaborators',
    'yargs',
  ], (err) => {
    t.ifError(err, 'npm access')
    t.ok('should successfully access ls-packages with no team')
  })
})
