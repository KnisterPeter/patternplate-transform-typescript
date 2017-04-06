import test from 'ava';
import { Application, OutputArtifact } from './types';

import * as utils from './utils';

test('addOutputArtifact should add the given artifact if supported by the application', t => {
  const application: Application = {
    resources: []
  };
  const artifact: OutputArtifact = {
    id: 'id',
    content: 'content',
    pattern: 'pattern',
    reference: true,
    type: 'd.ts'
  };

  utils.addOutputArtifact(application, artifact);

  t.deepEqual(application.resources, [artifact]);
});

test('addOutputArtifact should not add the given artifact if not supported by the application', t => {
  const application: Application = {};
  const artifact: OutputArtifact = {
    id: 'id',
    content: 'content',
    pattern: 'pattern',
    reference: true,
    type: 'd.ts'
  };

  utils.addOutputArtifact(application, artifact);

  t.falsy(application.resources);
});

test('addOutputArtifact should replace an existing artifact', t => {
  const artifact0: OutputArtifact = {
    id: 'id',
    content: 'content',
    pattern: 'pattern',
    reference: true,
    type: 'd.ts'
  };
  const artifact1 = Object.assign({}, artifact0, {content: 'new-content'});
  const application: Application = {
    resources: [
      artifact0
    ]
  };

  utils.addOutputArtifact(application, artifact1);

  t.deepEqual(application.resources, [artifact1]);
});
