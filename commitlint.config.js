module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^\[([A-Z]+)\]\s+(\w+)(?:\(([^)]+)\))?:\s+(.+)$/,
      headerCorrespondence: ['project', 'type', 'scope', 'subject']
    }
  },
  rules: {
    'header-match-project': [2, 'always']
  },
  plugins: [
    {
      rules: {
        'header-match-project': (parsed) => {
          const { project } = parsed;
          if (!project || project !== 'MA') {
            return [false, 'Commit header must start with [MA] (e.g. "[MA] feat(qibla): add compass (MA-3)")'];
          }
          return [true];
        }
      }
    }
  ]
};
