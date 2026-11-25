const path = require('path');
const { RunManager } = require('./runner');
const { createExecutionRouter } = require('./routes');
const { createFaultConfig } = require('./faults');

function createExecutionRuntime({ projectRoot }) {
  const faults = createFaultConfig();
  const manager = new RunManager({ rootDir: path.join(projectRoot, '.testsphere') });
  return {
    faults,
    manager,
    router: createExecutionRouter({ manager, faults }),
  };
}

module.exports = { createExecutionRuntime };
